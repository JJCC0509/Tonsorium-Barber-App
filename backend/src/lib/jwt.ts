import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** Contenido del JWT emitido por el backend. */
export interface AuthTokenPayload {
  sub: string;
}

/** 7 dias expresados en segundos. */
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export function signToken(userId: string): string {
  const payload: AuthTokenPayload = { sub: userId };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

/**
 * Verifica el token y devuelve el id de usuario.
 * Lanza si el token es invalido o esta expirado (el middleware lo traduce a 401).
 */
export function verifyToken(token: string): string {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || decoded.sub.length === 0) {
    throw new Error('Token sin sujeto');
  }
  return decoded.sub;
}
