import { describe, expect, it } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { api, ApiError, errorMessage, toApiError } from './browser';

describe('browser api client', () => {
  it('sends JSON with the CSRF header and same-origin credentials', async () => {
    const { calls, fn } = mockFetch(() => ({ json: { ok: true } }));

    await expect(api('/api/admin/categories', { method: 'POST', json: { label: 'Bottons' } })).resolves.toEqual({ ok: true });

    expect(calls[0].method).toBe('POST');
    expect(calls[0].body).toEqual({ label: 'Bottons' });
    expect(calls[0].headers.get('X-Requested-With')).toBe('fetch');
    expect(calls[0].headers.get('Content-Type')).toBe('application/json');
    expect(fn.mock.calls[0][1]?.credentials).toBe('same-origin');
  });

  it('returns undefined for 204', async () => {
    mockFetch(() => ({ status: 204 }));
    await expect(api('/api/admin/products/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns ProblemDetails into ApiError with the first message per field', async () => {
    mockFetch(() => ({ status: 400, json: { title: 'Confira os campos destacados.', errors: { name: ['Dê um nome ao produto.', 'outro'] } } }));

    const error = await api('/api/admin/products', { method: 'POST', json: {} }).catch((e: unknown) => e as ApiError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.title).toBe('Confira os campos destacados.');
    expect(error.fieldErrors).toEqual({ name: 'Dê um nome ao produto.' });
  });

  it('uses a generic message when the body is not ProblemDetails', () => {
    expect(toApiError(502, null).title).toBe('Algo deu errado. Tente novamente.');
  });

  it('picks the best human message', () => {
    expect(errorMessage(toApiError(400, { title: 'T', errors: { label: ['Já existe uma categoria com esse nome.'] } })))
      .toBe('Já existe uma categoria com esse nome.');
    expect(errorMessage(toApiError(409, { title: 'Mova ou exclua os produtos desta categoria antes.' })))
      .toBe('Mova ou exclua os produtos desta categoria antes.');
    expect(errorMessage(new Error('boom'), 'Falhou.')).toBe('Falhou.');
  });
});
