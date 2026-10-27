import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  cancelAppointmentHandler,
  createAppointmentHandler,
  listAppointmentsHandler,
} from './appointments.controller';
import {
  cancelAppointmentParamsSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
} from './appointments.schemas';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

appointmentsRouter.get('/', validate({ query: listAppointmentsQuerySchema }), listAppointmentsHandler);
appointmentsRouter.post('/', validate({ body: createAppointmentSchema }), createAppointmentHandler);
appointmentsRouter.patch(
  '/:id/cancel',
  validate({ params: cancelAppointmentParamsSchema }),
  cancelAppointmentHandler,
);
