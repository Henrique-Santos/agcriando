import { defineConfig, devices } from '@playwright/test';

const API = 'http://localhost:5180';
const WEB = 'http://localhost:3100';
const SECRET = 'e2e-secret';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: WEB, locale: 'pt-BR', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: [
    {
      command: 'dotnet run --project ../backend/src/AgCriando.Api --no-launch-profile',
      url: `${API}/api/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: API,
        ConnectionStrings__Default: 'Host=localhost;Port=5433;Database=agcriando_e2e;Username=agcriando;Password=agcriando',
        Storage__LocalPath: 'media-e2e',
        Storage__PublicBaseUrl: `${API}/media`,
        Revalidation__Url: `${WEB}/api/revalidate`,
        Revalidation__Secret: SECRET,
      },
    },
    {
      command: 'pnpm build && pnpm start -p 3100',
      url: WEB,
      timeout: 300_000,
      reuseExistingServer: false,
      env: {
        API_INTERNAL_URL: API,
        API_PROXY_URL: API,
        NEXT_PUBLIC_SITE_URL: WEB,
        REVALIDATE_SECRET: SECRET,
      },
    },
  ],
});
