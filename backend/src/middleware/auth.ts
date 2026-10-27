import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError';
import { verifyToken } from '../lib/jwt';

/**
 * Exige la cabecera `Authorization: Bearer <jwt>` y coloca el id de usuario
 * en `req.userId`. Responde 401 UNAUTHORIZED si falta, es invalido o expiro.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const unauthorized = new HttpError(401, 'UNAUTHORIZED', 'Token de autenticacion ausente o invalido.');

  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized);
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (token.length === 0) {
    next(unauthorized);
    return;
  }

  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    next(unauthorized);
  }
}
