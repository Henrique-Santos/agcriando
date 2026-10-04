// @vitest-environment node
import { revalidateTag } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const call = (secret: string | null, body: unknown) =>
  POST(new Request('http://web/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-revalidate-secret': secret } : {}) },
    body: JSON.stringify(body),
  }));

describe('POST /api/revalidate', () => {
  beforeEach(() => vi.stubEnv('REVALIDATE_SECRET', 's3gredo'));
  afterEach(() => { vi.unstubAllEnvs(); vi.mocked(revalidateTag).mockClear(); });

  it('rejects a missing or wrong secret', async () => {
    expect((await call(null, { tag: 'catalog' })).status).toBe(401);
    expect((await call('errado', { tag: 'catalog' })).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects everything when the server has no secret configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');
    expect((await call('', { tag: 'catalog' })).status).toBe(401);
  });

  it('rejects unknown tags', async () => {
    expect((await call('s3gredo', { tag: 'outra' })).status).toBe(400);
  });

  it('expires the catalog cache immediately', async () => {
    const response = await call('s3gredo', { tag: 'catalog' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(revalidateTag).toHaveBeenCalledWith('catalog', { expire: 0 });
  });
});
