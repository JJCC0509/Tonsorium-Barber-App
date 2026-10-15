// Tipos que reflejan exactamente los DTOs del backend.
export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ApiUser {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  phone?: string;
  preferredShop: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface AppointmentItem {
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

export interface AppointmentsSummary {
  upcomingCount: number;
  completedCount: number;
  totalPoints: number;
}

export interface AppointmentsListResponse {
  items: AppointmentItem[];
  summary: AppointmentsSummary;
}

export type AppointmentsFilter = 'upcoming' | 'history';
