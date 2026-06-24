const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  json?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  });

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    if (body?.code === 'TOKEN_EXPIRED') {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        return apiFetch<T>(path, options);
      }
    }
    throw new ApiError(body?.error ?? 'Unauthorized', 401, body?.code);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.code);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { method: 'GET', ...init }),
  post: <T>(path: string, json?: unknown) => apiFetch<T>(path, { method: 'POST', json }),
  put: <T>(path: string, json?: unknown) => apiFetch<T>(path, { method: 'PUT', json }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: 'POST', body: formData }),
};
