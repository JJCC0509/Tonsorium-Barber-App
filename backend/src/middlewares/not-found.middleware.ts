import { NextFunction, Request, Response } from 'express';
import { AppErrors } from '../exceptions/errors/app.error.js';

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next(AppErrors.ROUTE_NOT_FOUND());
}
