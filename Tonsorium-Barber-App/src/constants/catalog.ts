// Catálogo compartido con los mismos IDs del backend (s1-s4, b1-b3).
export interface CatalogService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
}

export interface CatalogBarber {
  id: string;
  name: string;
  shop: string;
  rating: string;
  experience: string;
}

export interface TimeSlot {
  value: string;
  label: string;
}

export const SHOPS: string[] = ['Barber Chamos', 'Barberia Prado Centro', 'SurBarber'];

export const SERVICES: CatalogService[] = [
  {
    id: 's1',
    name: 'Corte Clásico',
    price: 25000,
    durationMinutes: 30,
    description: 'Corte tradicional a tijera o máquina con acabado fino.',
  },
  {
    id: 's2',
    name: 'Barba Tradicional',
    price: 18000,
    durationMinutes: 25,
    description: 'Afeitado o perfilado con toalla caliente y bálsamo.',
  },
  {
    id: 's3',
    name: 'Combo (Corte + Barba)',
    price: 38000,
    durationMinutes: 50,
    description: 'Corte de cabello + arreglo completo de barba + lavado.',
  },
  {
    id: 's4',
    name: 'Cejas',
    price: 7000,
    durationMinutes: 5,
    description: 'Corte de cejas con tijeras y cera.',
  },
];

export const BARBERS: CatalogBarber[] = [
  { id: 'b1', name: 'El Chamo', shop: 'Barber Chamos', rating: '4.9 ⭐', experience: '8 años exp.' },
  { id: 'b2', name: 'Javier Silva', shop: 'Barberia Prado Centro', rating: '4.8 ⭐', experience: '5 años exp.' },
  { id: 'b3', name: 'Diego Torres', shop: 'SurBarber', rating: '5.0 ⭐', experience: '10 años exp.' },
];

export const TIMES: TimeSlot[] = [
  { value: '10:00', label: '10:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:15', label: '7:15 PM' },
];
