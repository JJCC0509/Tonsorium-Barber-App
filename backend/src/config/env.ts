// Configuración de entorno tipada. El servidor no arranca sin JWT_SECRET válido.
import dotenv from 'dotenv';

dotenv.config();

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET es obligatorio y debe tener mínimo 32 caracteres.');
  }
  return secret;
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: toNumber(process.env.PORT, 3000),
  jwtSecret: requireJwtSecret(),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  // Por defecto 1000 en desarrollo (para no bloquear Postman) y 10 en producción.
  authRateLimitMax: process.env.AUTH_RATE_LIMIT_MAX
    ? toNumber(process.env.AUTH_RATE_LIMIT_MAX, 1000)
    : nodeEnv === 'production'
      ? 10
      : 1000,
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
