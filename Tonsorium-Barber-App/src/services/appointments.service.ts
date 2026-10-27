import { apiRequest } from './apiClient';
import type { Appointment, AppointmentStatus, CreateAppointmentInput } from '../types/api';

export type AppointmentListFilter = 'upcoming' | 'history';

/** GET /appointments?status=upcoming|history */
export async function fetchAppointments(status: AppointmentListFilter): Promise<Appointment[]> {
  const result = await apiRequest<{ appointments: Appointment[] }>('/appointments', {
    query: { status },
  });
  return result.appointments;
}

/** POST /appointments */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const result = await apiRequest<{ appointment: Appointment }>('/appointments', {
    method: 'POST',
    body: input,
  });
  return result.appointment;
}

/** PATCH /appointments/:id/cancel */
export async function cancelAppointment(id: string): Promise<Appointment> {
  const result = await apiRequest<{ appointment: Appointment }>(
    `/appointments/${id}/cancel`,
    { method: 'PATCH' },
  );
  return result.appointment;
}

export type { AppointmentStatus };
