/**
 * Generacion de la agenda de reserva.
 *
 * Reglas acordadas con el backend: dias = proximos 14, franjas = cada 45 min
 * entre las 09:00 y las 19:00. El backend rechaza con `INVALID_SCHEDULE`
 * cualquier fecha pasada, por eso las franjas ya vencidas de hoy se desactivan.
 */

import { formatDayChip, formatTime, startOfDay } from './format';

const OPENING_HOUR = 9;
const CLOSING_HOUR = 19;
const SLOT_STEP_MINUTES = 45;
const DAYS_AHEAD = 14;

export interface DayOption {
  /** `YYYY-MM-DD` en hora local; identifica el chip seleccionado. */
  key: string;
  label: string;
  sublabel: string;
}

export interface SlotOption {
  /** ISO 8601 listo para enviar como `scheduled_at`. */
  iso: string;
  label: string;
  disabled: boolean;
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Proximos 14 dias, empezando por hoy. */
export function buildDays(): DayOption[] {
  const today = startOfDay(new Date());
  const days: DayOption[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    days.push({
      key: dayKey(date),
      label: formatDayChip(date),
      sublabel: `${day}/${month}`,
    });
  }

  return days;
}

/**
 * Franjas de 45 minutos para el dia indicado. Una franja se desactiva si su
 * hora de inicio ya paso (solo puede ocurrir hoy).
 */
export function buildSlots(day: string): SlotOption[] {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const slots: SlotOption[] = [];
  const now = Date.now();
  const steps = Math.floor(((CLOSING_HOUR - OPENING_HOUR) * 60) / SLOT_STEP_MINUTES) + 1;

  for (let index = 0; index < steps; index += 1) {
    const minutesFromOpening = index * SLOT_STEP_MINUTES;
    const date = new Date(
      year,
      month - 1,
      dayOfMonth,
      OPENING_HOUR + Math.floor(minutesFromOpening / 60),
      minutesFromOpening % 60,
      0,
      0,
    );
    const iso = date.toISOString();
    slots.push({
      iso,
      label: formatTime(iso),
      disabled: date.getTime() <= now,
    });
  }

  return slots;
}

/** Primer indice de una franja habilitada, o `-1` si el dia entero ya paso. */
export function firstEnabledSlotIndex(slots: SlotOption[]): number {
  return slots.findIndex((slot) => !slot.disabled);
}
