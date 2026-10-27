import type { AppointmentItem, AppointmentsFilter, AppointmentsListResponse } from '../types/api';
import { get, patch, post } from './api';

export async function getAppointments(options?: {
  filter?: AppointmentsFilter;
  limit?: number;
}): Promise<AppointmentsListResponse> {
  const params = new URLSearchParams();
  if (options?.filter) params.set('filter', options.filter);
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  const query = params.toString();
  return get<AppointmentsListResponse>(`/appointments${query ? `?${query}` : ''}`);
}

export async function createAppointment(input: {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
}): Promise<AppointmentItem> {
  return post<AppointmentItem>('/appointments', input);
}

export async function cancelAppointment(id: string): Promise<AppointmentItem> {
  return patch<AppointmentItem>(`/appointments/${id}/cancel`);
}
