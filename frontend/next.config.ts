import type { NextConfig } from 'next';

const apiProxy = process.env.API_PROXY_URL;

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // As fotos já chegam da API em WebP ≤ 1200 px.
  images: { unoptimized: true },
  async rewrites() {
    // Em produção o Nginx encaminha /api/* para a API; em dev e no E2E o próprio Next faz isso.
    // Rotas do próprio Next (ex.: /api/revalidate) têm prioridade sobre estes rewrites.
    return apiProxy ? [{ source: '/api/:path*', destination: `${apiProxy}/api/:path*` }] : [];
  },
};

export default nextConfig;
