import { Router } from 'express';
import appointmentsRoute from './appointments.route.js';
import authRoute from './auth.route.js';

const router = Router();

router.use('/auth', authRoute);
router.use('/appointments', appointmentsRoute);

export default router;
