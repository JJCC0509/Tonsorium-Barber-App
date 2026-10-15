// Utilidades de fecha interpretadas en America/Bogotá (UTC-5, sin DST).
import { BOGOTA_OFFSET, BOGOTA_OFFSET_MS } from './constants.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDateFormat(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTimeFormat(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

// Construye el ISO con offset -05:00 y devuelve el instante en ms.
export function bogotaToMs(date: string, time: string): number {
  const iso = `${date}T${time}:00${BOGOTA_OFFSET}`;
  const ms = Date.parse(iso);
  return ms;
}

// Formatea un instante (ms) como ISO en hora de Bogotá con offset -05:00.
export function msToBogotaIso(ms: number): string {
  const wall = new Date(ms + BOGOTA_OFFSET_MS);
  return `${wall.toISOString().slice(0, 19)}${BOGOTA_OFFSET}`;
}

export function addMinutes(ms: number, minutes: number): number {
  return ms + minutes * 60 * 1000;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
