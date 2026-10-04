// Variáveis NEXT_PUBLIC_* são embutidas no `next build`; no build de produção (standalone, Docker)
// elas precisam ser passadas como build args, senão URLs canônicas, sitemap e Open Graph apontariam para localhost.
const REQUIRED = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_WHATSAPP'] as const;

export function missingBuildEnv(env: Record<string, string | undefined>): string[] {
  if (env.NEXT_OUTPUT !== 'standalone') return [];
  return REQUIRED.filter((name) => !env[name]?.trim());
}
