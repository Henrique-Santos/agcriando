import { vi } from 'vitest';

export type FetchCall = { url: string; method: string; body: unknown; headers: Headers };
type Reply = { status?: number; json?: unknown };

export function mockFetch(handler: (call: FetchCall) => Reply | undefined) {
  const calls: FetchCall[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = init?.body;
    const call: FetchCall = {
      url: String(input),
      method: (init?.method ?? 'GET').toUpperCase(),
      body: typeof raw === 'string' ? JSON.parse(raw) : raw ?? null,
      headers: new Headers(init?.headers),
    };
    calls.push(call);
    const reply = handler(call) ?? { status: 404, json: { title: 'Não encontrado.' } };
    const status = reply.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(reply.json ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls };
}
