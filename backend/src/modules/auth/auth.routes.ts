import { Router } from 'express';
import { authRateLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { loginHandler, registerHandler } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerSchema }), registerHandler);
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), loginHandler);
