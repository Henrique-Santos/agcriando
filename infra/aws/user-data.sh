#!/bin/bash
# Bootstrap da EC2 (Amazon Linux 2023, arm64): Docker + Compose, swap, CloudWatch Agent e health check.
set -euxo pipefail

dnf install -y docker amazon-cloudwatch-agent
systemctl enable --now docker

mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 1 GB de swap como folga para picos de memória (build-free: só runtime).
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap defaults 0 0' >> /etc/fstab
fi

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
{
  "metrics": {
    "append_dimensions": { "InstanceId": "${aws:InstanceId}" },
    "metrics_collected": {
      "disk": { "measurement": ["used_percent"], "resources": ["/"], "drop_device": true },
      "mem": { "measurement": ["mem_used_percent"] }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Health check da aplicação a cada minuto → métrica AgCriando/HealthOk (1 ok, 0 falha).
cat > /usr/local/bin/agcriando-health <<'EOF'
#!/bin/bash
TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
IID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
if curl -fsSk --max-time 10 https://localhost/api/health >/dev/null; then v=1; else v=0; fi
aws cloudwatch put-metric-data --region "$REGION" --namespace AgCriando --metric-name HealthOk \
  --dimensions InstanceId="$IID" --value "$v"
EOF
chmod +x /usr/local/bin/agcriando-health
cat > /etc/systemd/system/agcriando-health.service <<'EOF'
[Unit]
Description=AG Criando health check
[Service]
Type=oneshot
ExecStart=/usr/local/bin/agcriando-health
EOF
cat > /etc/systemd/system/agcriando-health.timer <<'EOF'
[Unit]
Description=AG Criando health check a cada minuto
[Timer]
OnBootSec=2min
OnUnitActiveSec=1min
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now agcriando-health.timer

mkdir -p /opt/agcriando
