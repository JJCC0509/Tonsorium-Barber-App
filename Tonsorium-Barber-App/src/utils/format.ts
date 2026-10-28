import type { AppointmentStatus } from '../types/api';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

/** `25000` -> `$25.000` (separador de miles colombiano, sin depender de Intl). */
export function formatPrice(cop: number): string {
  const digits = Math.round(cop).toString();
  return `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** `150` -> `2 h 30 min`, `45` -> `45 min`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Fecha local del dispositivo: `18 Oct 2026`. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Hora local del dispositivo: `4:30 PM`. */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = date.getHours() >= 12 ? 'PM' : 'AM';
  const hour12 = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** Etiqueta corta de dia para los chips de reserva: `Hoy`, `Mañana`, `Vie 30`. */
export function formatDayChip(date: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) {
    return 'Hoy';
  }
  if (diffDays === 1) {
    return 'Mañana';
  }
  return `${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()}`;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function statusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status];
}
