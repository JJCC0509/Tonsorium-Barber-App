// Cliente fetch con base URL, timeout de 10 s y header Authorization.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 10000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

function errorBody(json: unknown): { code: string; message: string } {
  if (typeof json === 'object' && json !== null) {
    const record = json as Record<string, unknown>;
    return {
      code: typeof record.code === 'string' ? record.code : 'UNKNOWN_ERROR',
      message: typeof record.message === 'string' ? record.message : 'Ocurrió un error inesperado.',
    };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Ocurrió un error inesperado.' };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (init.headers) {
      const extra = init.headers as Record<string, string>;
      for (const key of Object.keys(extra)) headers[key] = extra[key];
    }
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal: controller.signal });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const body = errorBody(json);
      if (res.status === 401 && (body.code === 'TOKEN_EXPIRED' || body.code === 'INVALID_TOKEN')) {
        onUnauthorized?.();
      }
      throw new ApiError(res.status, body.code, body.message);
    }
    return json as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'No pudimos conectar con el servidor. Revisa tu conexión.');
  } finally {
    clearTimeout(timer);
  }
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });
}
