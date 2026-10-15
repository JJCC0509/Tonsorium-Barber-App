// Lee Authorization: Bearer <token> y deja req.user = { id }.
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppErrors } from '../exceptions/errors/app.error.js';
import { verifyToken } from '../utils/jwt.util.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(AppErrors.MISSING_TOKEN());
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(AppErrors.MISSING_TOKEN());
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(AppErrors.TOKEN_EXPIRED());
      return;
    }
    next(AppErrors.INVALID_TOKEN());
  }
}
