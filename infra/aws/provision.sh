#!/usr/bin/env bash
# Provisiona a infraestrutura AWS da loja (idempotente). Uso: provision.sh [config.env]
# ATENÇÃO: cria recursos que geram custo. Rode só depois de revisar config.env.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG=${1:-config.env}
# shellcheck disable=SC1090
. "$CONFIG"
: "${AWS_REGION:?}" "${DOMAIN:?}" "${ADMIN_EMAIL:?}" "${ALERT_EMAIL:?}" "${GITHUB_REPO:?}" "${WHATSAPP:?}"
INSTANCE_TYPE=${INSTANCE_TYPE:-t4g.small}
export AWS_REGION AWS_DEFAULT_REGION=$AWS_REGION

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
MEDIA_BUCKET=agcriando-media-$ACCOUNT
BACKUP_BUCKET=agcriando-backups-$ACCOUNT
TAGS='Key=Project,Value=agcriando'
say() { printf '\n==> %s\n' "$*"; }
exists() { "$@" >/dev/null 2>&1; }

render_policy() { # render_policy <arquivo> [instance-id]
  sed -e "s/__MEDIA_BUCKET__/$MEDIA_BUCKET/g" -e "s/__BACKUP_BUCKET__/$BACKUP_BUCKET/g" \
      -e "s/__REGION__/$AWS_REGION/g" -e "s/__ACCOUNT__/$ACCOUNT/g" -e "s/__INSTANCE__/${2:-}/g" "$1"
}

create_bucket() {
  local b=$1
  exists aws s3api head-bucket --bucket "$b" && return 0
  if [ "$AWS_REGION" = us-east-1 ]; then aws s3api create-bucket --bucket "$b" >/dev/null
  else aws s3api create-bucket --bucket "$b" --create-bucket-configuration LocationConstraint="$AWS_REGION" >/dev/null; fi
}

say "Buckets S3"
create_bucket "$MEDIA_BUCKET"
create_bucket "$BACKUP_BUCKET"
# Mídia: leitura pública apenas de products/* (o bloqueio de acesso público da CONTA também precisa permitir políticas).
aws s3api put-public-access-block --bucket "$MEDIA_BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3api put-bucket-policy --bucket "$MEDIA_BUCKET" --policy "$(printf '{"Version":"2012-10-17","Statement":[{"Sid":"PublicProducts","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::%s/products/*"}]}' "$MEDIA_BUCKET")"
aws s3api put-public-access-block --bucket "$BACKUP_BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-lifecycle-configuration --bucket "$BACKUP_BUCKET" --lifecycle-configuration \
  '{"Rules":[{"ID":"backups-30d","Status":"Enabled","Filter":{"Prefix":"backups/"},"Expiration":{"Days":30}},{"ID":"artifacts-30d","Status":"Enabled","Filter":{"Prefix":"artifacts/"},"Expiration":{"Days":30}}]}'

say "Repositórios ECR"
for repo in agcriando-api agcriando-web agcriando-migrator; do
  exists aws ecr describe-repositories --repository-names "$repo" || \
    aws ecr create-repository --repository-name "$repo" --image-scanning-configuration scanOnPush=true --tags "$TAGS" >/dev/null
  aws ecr put-lifecycle-policy --repository-name "$repo" --lifecycle-policy-text \
    '{"rules":[{"rulePriority":1,"description":"mantém as 10 últimas","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":10},"action":{"type":"expire"}}]}' >/dev/null
done

say "IAM da instância"
if ! exists aws iam get-role --role-name agcriando-ec2; then
  aws iam create-role --role-name agcriando-ec2 --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name agcriando-ec2 --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
  aws iam attach-role-policy --role-name agcriando-ec2 --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
fi
aws iam put-role-policy --role-name agcriando-ec2 --policy-name agcriando --policy-document "$(render_policy policies/ec2-role.json)"
if ! exists aws iam get-instance-profile --instance-profile-name agcriando-ec2; then
  aws iam create-instance-profile --instance-profile-name agcriando-ec2 >/dev/null
  aws iam add-role-to-instance-profile --instance-profile-name agcriando-ec2 --role-name agcriando-ec2
  sleep 10 # propagação do instance profile
fi

say "Security group"
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=agcriando-web Name=vpc-id,Values="$VPC" --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = None ]; then
  SG=$(aws ec2 create-security-group --group-name agcriando-web --description "AG Criando HTTP/HTTPS" --vpc-id "$VPC" --query GroupId --output text)
  aws ec2 authorize-security-group-ingress --group-id "$SG" --ip-permissions \
    'IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]' 'IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]' >/dev/null
fi

say "EC2"
INSTANCE=$(aws ec2 describe-instances --filters Name=tag:Name,Values=agcriando Name=instance-state-name,Values=pending,running,stopped \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
if [ "$INSTANCE" = None ]; then
  AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64 --query Parameter.Value --output text)
  INSTANCE=$(aws ec2 run-instances --image-id "$AMI" --instance-type "$INSTANCE_TYPE" \
    --iam-instance-profile Name=agcriando-ec2 --security-group-ids "$SG" \
    --metadata-options HttpTokens=required,HttpPutResponseHopLimit=2,HttpEndpoint=enabled \
    --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp3,Encrypted=true}' \
    --user-data file://user-data.sh \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=agcriando},{Key=Project,Value=agcriando}]' \
    --query 'Instances[0].InstanceId' --output text)
  aws ec2 wait instance-running --instance-ids "$INSTANCE"
fi
EIP=$(aws ec2 describe-addresses --filters Name=tag:Name,Values=agcriando --query 'Addresses[0].PublicIp' --output text)
if [ "$EIP" = None ]; then
  ALLOC=$(aws ec2 allocate-address --domain vpc --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=agcriando}]' --query AllocationId --output text)
  aws ec2 associate-address --instance-id "$INSTANCE" --allocation-id "$ALLOC" >/dev/null
  EIP=$(aws ec2 describe-addresses --allocation-ids "$ALLOC" --query 'Addresses[0].PublicIp' --output text)
fi

say "Parâmetros SSM (não sobrescreve segredos existentes)"
put_param() { # put_param <nome> <valor> <String|SecureString> [overwrite]
  local path=/agcriando/prod/$1
  if exists aws ssm get-parameter --name "$path"; then
    [ "${4:-}" = overwrite ] && aws ssm put-parameter --name "$path" --value "$2" --type "$3" --overwrite >/dev/null
  else
    aws ssm put-parameter --name "$path" --value "$2" --type "$3" >/dev/null
  fi
}
put_param DB_PASSWORD "$(openssl rand -hex 24)" SecureString
put_param ADMIN_PASSWORD "$(openssl rand -hex 12)" SecureString
put_param REVALIDATE_SECRET "$(openssl rand -hex 32)" SecureString
put_param ADMIN_EMAIL "$ADMIN_EMAIL" String overwrite
put_param DOMAIN "$DOMAIN" String overwrite
put_param AWS_REGION "$AWS_REGION" String overwrite
put_param AWS_ACCOUNT_ID "$ACCOUNT" String overwrite
put_param MEDIA_BUCKET "$MEDIA_BUCKET" String overwrite
put_param MEDIA_BASE_URL "https://$MEDIA_BUCKET.s3.$AWS_REGION.amazonaws.com" String overwrite
put_param BACKUP_BUCKET "$BACKUP_BUCKET" String overwrite
put_param STORAGE_PROVIDER S3 String overwrite

say "OIDC do GitHub e role de deploy"
OIDC_ARN=arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com
exists aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" || \
  aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com >/dev/null
TRUST=$(printf '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"%s"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com","token.actions.githubusercontent.com:sub":"repo:%s:environment:production"}}}]}' "$OIDC_ARN" "$GITHUB_REPO")
if exists aws iam get-role --role-name agcriando-github-deploy; then
  aws iam update-assume-role-policy --role-name agcriando-github-deploy --policy-document "$TRUST"
else
  aws iam create-role --role-name agcriando-github-deploy --assume-role-policy-document "$TRUST" >/dev/null
fi
aws iam put-role-policy --role-name agcriando-github-deploy --policy-name deploy --policy-document "$(render_policy policies/github-deploy.json "$INSTANCE")"
DEPLOY_ROLE=$(aws iam get-role --role-name agcriando-github-deploy --query Role.Arn --output text)

say "Alertas (SNS + CloudWatch)"
TOPIC=$(aws sns create-topic --name agcriando-alerts --query TopicArn --output text)
if [ "$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC" --query "length(Subscriptions[?Endpoint=='$ALERT_EMAIL'])" --output text)" = 0 ]; then
  aws sns subscribe --topic-arn "$TOPIC" --protocol email --notification-endpoint "$ALERT_EMAIL" >/dev/null
fi
aws cloudwatch put-metric-alarm --alarm-name agcriando-cpu --namespace AWS/EC2 --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value="$INSTANCE" --statistic Average --period 300 --evaluation-periods 3 \
  --threshold 80 --comparison-operator GreaterThanThreshold --alarm-actions "$TOPIC"
aws cloudwatch put-metric-alarm --alarm-name agcriando-disk --namespace CWAgent --metric-name disk_used_percent \
  --dimensions Name=InstanceId,Value="$INSTANCE" Name=path,Value=/ Name=fstype,Value=xfs --statistic Average \
  --period 300 --evaluation-periods 1 --threshold 80 --comparison-operator GreaterThanThreshold --alarm-actions "$TOPIC"
aws cloudwatch put-metric-alarm --alarm-name agcriando-health --namespace AgCriando --metric-name HealthOk \
  --dimensions Name=InstanceId,Value="$INSTANCE" --statistic Maximum --period 60 --evaluation-periods 5 \
  --threshold 1 --comparison-operator LessThanThreshold --treat-missing-data breaching \
  --alarm-actions "$TOPIC" --ok-actions "$TOPIC"
aws cloudwatch put-metric-alarm --alarm-name agcriando-status-recover --namespace AWS/EC2 --metric-name StatusCheckFailed_System \
  --dimensions Name=InstanceId,Value="$INSTANCE" --statistic Maximum --period 60 --evaluation-periods 2 \
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions "arn:aws:automate:$AWS_REGION:ec2:recover" "$TOPIC"

cat <<EOF

============================================================
Provisionamento concluído.

1) DNS: crie um registro A  $DOMAIN  ->  $EIP
2) Variáveis do GitHub (environment "production"):
   AWS_REGION=$AWS_REGION
   AWS_DEPLOY_ROLE_ARN=$DEPLOY_ROLE
   EC2_INSTANCE_ID=$INSTANCE
   ARTIFACTS_BUCKET=$BACKUP_BUCKET
   SITE_URL=https://$DOMAIN
   WHATSAPP=$WHATSAPP
3) Confirme a inscrição de alertas no e-mail $ALERT_EMAIL.
4) Senha inicial do admin:
   aws ssm get-parameter --name /agcriando/prod/ADMIN_PASSWORD --with-decryption --query Parameter.Value --output text
============================================================
EOF
