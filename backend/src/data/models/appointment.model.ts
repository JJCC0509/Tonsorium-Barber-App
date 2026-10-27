import { AppointmentStatus } from '../../enums/appointment-status.enum.js';

export interface Appointment {
  id: string;
  userId: string;
  serviceId: string;
  barberId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  price: number;
  accumulate: number;
}
