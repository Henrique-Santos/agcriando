import { describe, expect, it } from 'vitest';
import { missingBuildEnv } from './build-env';

describe('missingBuildEnv', () => {
  it('requires the public site URL and WhatsApp number in the production (standalone) build', () => {
    expect(missingBuildEnv({ NEXT_OUTPUT: 'standalone' })).toEqual(['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_WHATSAPP']);
  });

  it('passes when both are set', () => {
    expect(missingBuildEnv({ NEXT_OUTPUT: 'standalone', NEXT_PUBLIC_SITE_URL: 'https://agcriando.com.br', NEXT_PUBLIC_WHATSAPP: '5592995185104' })).toEqual([]);
  });

  it('does not require them outside the production build (dev, tests, E2E)', () => {
    expect(missingBuildEnv({})).toEqual([]);
  });
});
