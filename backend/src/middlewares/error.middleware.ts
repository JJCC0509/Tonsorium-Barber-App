// Convierte errores en respuestas { code, message }.
import { NextFunction, Request, Response } from 'express';
import { AppExeption } from '../exceptions/app.exception.js';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppExeption) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }
  console.error(err);
  res
    .status(500)
    .json({ code: 'INTERNAL_SERVER_ERROR', message: 'Ocurrió un error inesperado en el servidor.' });
}
