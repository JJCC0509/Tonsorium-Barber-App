import { API_URL } from '../config/env';
import type { ApiErrorBody } from '../types/api';

/** Error tipado de la API: conserva el `code` que envia el backend. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

let authToken: string | null = null;

/** El token vive en memoria; `AuthContext` lo rehidrata desde SecureStore al arrancar. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined>;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const base = `${API_URL}${path}`;
  if (!query) {
    return base;
  }

  const pairs = Object.entries(query).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '',
  );
  if (pairs.length === 0) {
    return base;
  }

  const search = pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${base}?${search}`;
}

function parseJson(raw: string): unknown {
  if (raw.length === 0) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Unico punto de salida HTTP de la app: arma la URL, adjunta el token, aplica
 * timeout y traduce cualquier fallo a `ApiError`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      0,
      aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      aborted
        ? 'El servidor tardo demasiado en responder. Intenta de nuevo.'
        : 'No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.',
    );
  } finally {
    clearTimeout(timer);
  }

  const payload = parseJson(await response.text());

  if (!response.ok) {
    const apiError = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      apiError?.code ?? 'UNKNOWN_ERROR',
      apiError?.message ?? `La solicitud fallo con el codigo ${response.status}.`,
      apiError?.details ?? null,
    );
  }

  return payload as T;
}

/**
 * Extrae el primer mensaje concreto de `error.details`.
 *
 * El backend responde los 400 VALIDATION_ERROR con un mensaje generico
 * ("Datos de entrada invalidos.") y el detalle real de cada campo en
 * `details` (por ejemplo "El correo electrónico no es válido."). Sin esto la
 * pantalla mostraba siempre el texto generico.
 */
function firstDetailMessage(details: unknown): string | null {
  if (!Array.isArray(details)) {
    return null;
  }
  for (const item of details) {
    if (item !== null && typeof item === 'object') {
      const message = (item as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  }
  return null;
}

/** Mensaje listo para mostrar al usuario, venga de `ApiError` o no. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return firstDetailMessage(error.details) ?? error.message;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
