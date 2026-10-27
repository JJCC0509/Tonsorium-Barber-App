import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { HttpError, type ErrorDetail } from '../lib/httpError';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function toDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

/**
 * Reemplaza un valor de la peticion respetando las propiedades de solo lectura
 * de Express 5 (`req.query` y `req.params` son getters en el prototipo).
 */
function override(req: Request, key: 'query' | 'params', value: unknown): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

/**
 * Middleware de validacion con Zod. Cada parte (`body`, `query`, `params`) que
 * se declare se valida antes de tocar la base de datos; si algo falla responde
 * 400 VALIDATION_ERROR con el detalle de los campos invalidos.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        override(req, 'query', schemas.query.parse(req.query));
      }
      if (schemas.params) {
        override(req, 'params', schemas.params.parse(req.params));
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(400, 'VALIDATION_ERROR', 'Datos de entrada invalidos.', toDetails(error)));
        return;
      }
      next(error);
    }
  };
}
