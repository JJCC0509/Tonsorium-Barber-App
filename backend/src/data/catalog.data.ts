// Catálogo semilla: mismos IDs que la app (s1-s4, b1-b3).
import { Barber } from './models/barber.model.js';
import { Service } from './models/service.model.js';

export const SERVICES: Service[] = [
  { id: 's1', name: 'Corte Clásico', price: 25000, durationMinutes: 30 },
  { id: 's2', name: 'Barba Tradicional', price: 18000, durationMinutes: 25 },
  { id: 's3', name: 'Combo (Corte + Barba)', price: 38000, durationMinutes: 50 },
  { id: 's4', name: 'Cejas', price: 7000, durationMinutes: 5 },
];

export const BARBERS: Barber[] = [
  { id: 'b1', name: 'El Chamo', shop: 'Barber Chamos' },
  { id: 'b2', name: 'Javier Silva', shop: 'Barberia Prado Centro' },
  { id: 'b3', name: 'Diego Torres', shop: 'SurBarber' },
];
