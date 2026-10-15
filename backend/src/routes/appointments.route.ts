import { Router } from 'express';
import { container } from '../config/container.js';
import { AppointmentsController } from '../controllers/appointments.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

const appointmentsController =
  container.resolve<AppointmentsController>('appointmentsController');

router.use(authMiddleware);

router.get('/', appointmentsController.list);
router.post('/', appointmentsController.create);
router.patch('/:id/cancel', appointmentsController.cancel);

export default router;
