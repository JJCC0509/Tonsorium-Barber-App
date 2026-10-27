import { z } from 'zod';

export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum(['upcoming', 'history'], {
      errorMap: () => ({ message: 'El parametro status debe ser "upcoming" o "history".' }),
    })
    .optional()
    .default('upcoming'),
});

export const createAppointmentSchema = z.object({
  service_id: z.string().uuid('El identificador del servicio no es valido.'),
  barber_id: z.string().uuid('El identificador del barbero no es valido.'),
  // ISO 8601 con desplazamiento horario o Z (p. ej. 2026-10-28T16:30:00-05:00).
  scheduled_at: z.string().datetime({ offset: true, message: 'scheduled_at debe ser una fecha ISO 8601 valida.' }),
});

export const cancelAppointmentParamsSchema = z.object({
  id: z.string().uuid('El identificador de la cita no es valido.'),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentParams = z.infer<typeof cancelAppointmentParamsSchema>;
