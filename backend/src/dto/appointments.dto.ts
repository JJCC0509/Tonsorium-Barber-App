import { AppointmentStatus } from '../enums/appointment-status.enum.js';

export interface AppointmentResponseDTO {
  id: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  shop: string;
  price: number;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  accumulate: number;
}

export interface AppointmentsSummaryDTO {
  upcomingCount: number;
  completedCount: number;
  totalPoints: number;
}

export interface ListAppointmentsResponseDTO {
  items: AppointmentResponseDTO[];
  summary: AppointmentsSummaryDTO;
}

export interface CreateAppointmentBody {
  serviceId: unknown;
  barberId: unknown;
  date: unknown;
  time: unknown;
}

export type AppointmentFilter = 'upcoming' | 'history';
