// Constantes de negocio compartidas por los servicios.
export const POINTS_STEP = 1000;
export const MAX_DAYS_AHEAD = 30;
export const WORK_START_MINUTES = 9 * 60;
export const WORK_END_MINUTES = 21 * 60;
export const BOGOTA_OFFSET = '-05:00';
export const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

export const SHOPS = ['Barber Chamos', 'Barberia Prado Centro', 'SurBarber'] as const;
export type Shop = (typeof SHOPS)[number];
