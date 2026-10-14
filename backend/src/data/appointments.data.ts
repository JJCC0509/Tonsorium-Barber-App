// Citas semilla del usuario demo, con precios y fechas originales de la app.
// El precio es una foto al momento de reservar y puede diferir del catálogo.
import { AppointmentStatus } from '../enums/appointment-status.enum.js';
import { POINTS_STEP } from '../utils/constants.js';
import { Appointment } from './models/appointment.model.js';

function points(price: number): number {
  return Math.floor(price / POINTS_STEP);
}

export const APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    userId: 'usr-1',
    serviceId: 's3',
    barberId: 'b1',
    startAt: '2026-10-18T16:30:00-05:00',
    endAt: '2026-10-18T17:20:00-05:00',
    status: AppointmentStatus.CONFIRMED,
    price: 20000,
    accumulate: 0,
  },
  {
    id: 'apt-2',
    userId: 'usr-1',
    serviceId: 's1',
    barberId: 'b2',
    startAt: '2026-10-10T11:00:00-05:00',
    endAt: '2026-10-10T11:30:00-05:00',
    status: AppointmentStatus.COMPLETED,
    price: 22000,
    accumulate: points(22000),
  },
  {
    id: 'apt-3',
    userId: 'usr-1',
    serviceId: 's2',
    barberId: 'b3',
    startAt: '2026-10-02T17:00:00-05:00',
    endAt: '2026-10-02T17:25:00-05:00',
    status: AppointmentStatus.COMPLETED,
    price: 18000,
    accumulate: points(18000),
  },
];
