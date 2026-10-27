import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError';

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
}

/** Cualquier ruta no registrada responde con el formato uniforme de error. */
export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado.',
      details: [],
    },
  };
  res.status(404).json(body);
}

/** Express lanza este error cuando `express.json()` no puede parsear el cuerpo. */
function isInvalidJsonError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

/**
 * Manejador final de errores: convierte `HttpError` en la respuesta esperada y
 * cualquier error inesperado en un 500 sin filtrar detalles internos.
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    res.status(error.status).json(body);
    return;
  }

  if (isInvalidJsonError(error)) {
    const body: ApiErrorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El cuerpo de la peticion no es un JSON valido.',
        details: [],
      },
    };
    res.status(400).json(body);
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[error] Fallo no controlado:', message);

  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor.',
      details: [],
    },
  };
  res.status(500).json(body);
}
