import rateLimit from 'express-rate-limit';

/**
 * Limita a 10 intentos cada 15 minutos por IP + correo en las rutas `/auth/*`.
 * Usa el correo (cuando existe) para no penalizar a toda una red por los
 * intentos fallidos de un solo usuario.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${req.ip ?? 'unknown'}:${email}`;
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.',
        details: [],
      },
    });
  },
});
