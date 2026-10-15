import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { container } from '../config/container.js';
import { AuthController } from '../controllers/auth.controller.js';
import { env } from '../config/env.js';

const router = Router();

// Rate limit solo en /auth/*.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
    });
  },
});

router.use(authLimiter);

const authController = container.resolve<AuthController>('authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
