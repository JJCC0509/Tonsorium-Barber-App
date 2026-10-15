// Firma y verificación de JWT. Payload mínimo: sub (id de usuario).
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
}

export function signToken(userId: string, expiresIn: '30d' | '1d'): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
