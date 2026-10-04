export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(title);
    this.name = 'ApiError';
  }
}

type ProblemBody = { title?: unknown; errors?: Record<string, unknown> } | null;

export function toApiError(status: number, body: unknown): ApiError {
  const problem = (body && typeof body === 'object' ? body : null) as ProblemBody;
  const title = typeof problem?.title === 'string' ? problem.title : 'Algo deu errado. Tente novamente.';
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(problem?.errors ?? {})) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') fieldErrors[field] = messages[0];
  }
  return new ApiError(status, title, fieldErrors);
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('X-Requested-With', 'fetch');
  let body = rest.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  const response = await fetch(path, { ...rest, body, headers, credentials: 'same-origin' });
  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, data);
  return data as T;
}

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof ApiError) return Object.values(error.fieldErrors)[0] ?? error.title;
  return fallback;
}
