// Lógica de citas: autocompletado, validación en orden y mapeo a DTO.
import { APPOINTMENTS } from '../data/appointments.data.js';
import { BARBERS, SERVICES } from '../data/catalog.data.js';
import { Appointment } from '../data/models/appointment.model.js';
import {
  AppointmentFilter,
  AppointmentResponseDTO,
  CreateAppointmentBody,
  ListAppointmentsResponseDTO,
} from '../dto/appointments.dto.js';
import { AppointmentStatus } from '../enums/appointment-status.enum.js';
import { AppErrors } from '../exceptions/errors/app.error.js';
import {
  MAX_DAYS_AHEAD,
  POINTS_STEP,
  WORK_END_MINUTES,
  WORK_START_MINUTES,
} from '../utils/constants.js';
import {
  addMinutes,
  bogotaToMs,
  isValidDateFormat,
  isValidTimeFormat,
  msToBogotaIso,
  timeToMinutes,
} from '../utils/date.util.js';
import { IAppointmentsService } from './interfaces/appointments-service.interface.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDTO(apt: Appointment): AppointmentResponseDTO {
  const service = SERVICES.find((s) => s.id === apt.serviceId);
  const barber = BARBERS.find((b) => b.id === apt.barberId);
  return {
    id: apt.id,
    serviceId: apt.serviceId,
    serviceName: service?.name ?? '',
    barberId: apt.barberId,
    barberName: barber?.name ?? '',
    shop: barber?.shop ?? '',
    price: apt.price,
    durationMinutes: service?.durationMinutes ?? 0,
    startAt: apt.startAt,
    endAt: apt.endAt,
    status: apt.status,
    accumulate: apt.accumulate,
  };
}

// Marca como COMPLETED las citas CONFIRMED cuyo endAt ya pasó.
function autoComplete(): void {
  const now = Date.now();
  for (const apt of APPOINTMENTS) {
    if (apt.status === AppointmentStatus.CONFIRMED && Date.parse(apt.endAt) <= now) {
      apt.status = AppointmentStatus.COMPLETED;
      apt.accumulate = Math.floor(apt.price / POINTS_STEP);
    }
  }
}

function nextAppointmentId(): string {
  let max = 0;
  for (const apt of APPOINTMENTS) {
    const n = Number(apt.id.replace('apt-', ''));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `apt-${max + 1}`;
}

export class AppointmentsService implements IAppointmentsService {
  list(userId: string, filter?: AppointmentFilter, limit?: number): ListAppointmentsResponseDTO {
    autoComplete();
    if (filter !== undefined && filter !== 'upcoming' && filter !== 'history') {
      throw AppErrors.VALIDATION_ERROR('El filtro debe ser upcoming o history.');
    }
    if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
      throw AppErrors.VALIDATION_ERROR('El límite debe ser un entero positivo.');
    }

    const mine = APPOINTMENTS.filter((a) => a.userId === userId);
    const upcomingCount = mine.filter((a) => a.status === AppointmentStatus.CONFIRMED).length;
    const completedCount = mine.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
    const totalPoints = mine.reduce((acc, a) => acc + a.accumulate, 0);
    const summary = { upcomingCount, completedCount, totalPoints };

    let items = [...mine];
    if (filter === 'upcoming') {
      items = items
        .filter((a) => a.status === AppointmentStatus.CONFIRMED)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
    } else if (filter === 'history') {
      items = items
        .filter((a) => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED)
        .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
    } else {
      const upcoming = items
        .filter((a) => a.status === AppointmentStatus.CONFIRMED)
        .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
      const history = items
        .filter((a) => a.status !== AppointmentStatus.CONFIRMED)
        .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
      items = [...upcoming, ...history];
    }

    if (limit !== undefined) items = items.slice(0, limit);
    return { items: items.map(toDTO), summary };
  }

  create(userId: string, body: CreateAppointmentBody): AppointmentResponseDTO {
    autoComplete();

    // 1. Formato del body.
    if (
      typeof body.serviceId !== 'string' || body.serviceId.trim() === '' ||
      typeof body.barberId !== 'string' || body.barberId.trim() === '' ||
      !isValidDateFormat(body.date) ||
      !isValidTimeFormat(body.time)
    ) {
      throw AppErrors.VALIDATION_ERROR('Los datos de la cita no son válidos.');
    }
    const serviceId = body.serviceId.trim();
    const barberId = body.barberId.trim();
    const date = body.date;
    const time = body.time;

    // 2 y 3. Existencia de servicio y barbero.
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) throw AppErrors.SERVICE_NOT_FOUND();
    const barber = BARBERS.find((b) => b.id === barberId);
    if (!barber) throw AppErrors.BARBER_NOT_FOUND();

    const startMs = bogotaToMs(date, time);
    if (!Number.isFinite(startMs)) {
      throw AppErrors.VALIDATION_ERROR('Los datos de la cita no son válidos.');
    }
    const endMs = addMinutes(startMs, service.durationMinutes);
    const now = Date.now();

    // 4. Fecha no pasada.
    if (startMs <= now) throw AppErrors.PAST_DATE();
    // 5. Máximo 30 días adelante.
    if (startMs - now > MAX_DAYS_AHEAD * DAY_MS) throw AppErrors.TOO_FAR_IN_FUTURE();

    // 6. Horario laboral 09:00-21:00 (inicio y fin dentro del rango).
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + service.durationMinutes;
    if (startMinutes < WORK_START_MINUTES || startMinutes > WORK_END_MINUTES || endMinutes > WORK_END_MINUTES) {
      throw AppErrors.OUTSIDE_WORKING_HOURS();
    }

    // 7. Sin traslape con otra cita no cancelada del mismo barbero.
    for (const apt of APPOINTMENTS) {
      if (apt.barberId !== barberId || apt.status === AppointmentStatus.CANCELLED) continue;
      const s = Date.parse(apt.startAt);
      const e = Date.parse(apt.endAt);
      if (startMs < e && s < endMs) throw AppErrors.SLOT_TAKEN();
    }

    const apt: Appointment = {
      id: nextAppointmentId(),
      userId,
      serviceId,
      barberId,
      startAt: msToBogotaIso(startMs),
      endAt: msToBogotaIso(endMs),
      status: AppointmentStatus.CONFIRMED,
      price: service.price,
      accumulate: 0,
    };
    APPOINTMENTS.push(apt);
    return toDTO(apt);
  }

  cancel(userId: string, id: string): AppointmentResponseDTO {
    autoComplete();
    const apt = APPOINTMENTS.find((a) => a.id === id && a.userId === userId);
    if (!apt) throw AppErrors.APPOINTMENT_NOT_FOUND();
    if (apt.status !== AppointmentStatus.CONFIRMED || Date.parse(apt.startAt) <= Date.now()) {
      throw AppErrors.INVALID_STATUS_TRANSITION();
    }
    apt.status = AppointmentStatus.CANCELLED;
    return toDTO(apt);
  }
}
