import type { AppointmentStatus } from '../types/api';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_MS = 24 * 60 * 60 * 1000;
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

// Pasa un instante a sus componentes de pared en hora de Bogotá.
function bogotaParts(ms: number): { y: number; m: number; d: number; h: number; min: number; weekday: number } {
  const wall = new Date(ms + BOGOTA_OFFSET_MS);
  return {
    y: wall.getUTCFullYear(),
    m: wall.getUTCMonth(),
    d: wall.getUTCDate(),
    h: wall.getUTCHours(),
    min: wall.getUTCMinutes(),
    weekday: wall.getUTCDay(),
  };
}

// $25.000 con regex de miles, sin depender de Intl.
export function formatPrice(value: number): string {
  const rounded = Math.round(value).toString();
  return '$' + rounded.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// 18 Oct 2026 a partir de startAt.
export function formatDate(startAt: string): string {
  const ms = Date.parse(startAt);
  if (!Number.isFinite(ms)) return startAt;
  const p = bogotaParts(ms);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

// 4:30 PM a partir de startAt.
export function formatTime(startAt: string): string {
  const ms = Date.parse(startAt);
  if (!Number.isFinite(ms)) return startAt;
  const p = bogotaParts(ms);
  const ampm = p.h >= 12 ? 'PM' : 'AM';
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const mm = p.min.toString().padStart(2, '0');
  return `${h12}:${mm} ${ampm}`;
}

export function statusLabel(status: AppointmentStatus): string {
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'COMPLETED') return 'Completada';
  return 'Cancelada';
}

export interface DayOption {
  value: string;
  label: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Próximos 7 días en hora de Bogotá: value YYYY-MM-DD, label Hoy/Mañana/Sáb 17.
export function getNext7Days(): DayOption[] {
  const nowWall = new Date(Date.now() + BOGOTA_OFFSET_MS);
  const baseUTC = Date.UTC(nowWall.getUTCFullYear(), nowWall.getUTCMonth(), nowWall.getUTCDate());
  const days: DayOption[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(baseUTC + i * DAY_MS);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    const d = dt.getUTCDate();
    const value = `${y}-${pad2(m + 1)}-${pad2(d)}`;
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${WEEKDAYS[dt.getUTCDay()]} ${d}`;
    days.push({ value, label });
  }
  return days;
}

// Minutos actuales en Bogotá (para deshabilitar horarios pasados de hoy).
export function nowBogotaMinutes(): { todayValue: string; minutes: number } {
  const days = getNext7Days();
  const wall = new Date(Date.now() + BOGOTA_OFFSET_MS);
  return { todayValue: days[0].value, minutes: wall.getUTCHours() * 60 + wall.getUTCMinutes() };
}
