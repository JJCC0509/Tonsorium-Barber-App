import { HttpError } from '../../lib/httpError';
import { supabase } from '../../lib/supabase';
import {
  APPOINTMENT_COLUMNS,
  toAppointment,
  type AppointmentDto,
  type AppointmentRow,
} from '../../lib/mappers';
import type { CreateAppointmentInput } from './appointments.schemas';

interface BarberLookupRow {
  id: string;
  shop_id: string;
  active: boolean;
}

interface ServiceLookupRow {
  id: string;
  price_cop: number;
  active: boolean;
}

interface AppointmentStatusRow {
  id: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

/** Citas del usuario autenticado, con shop/barber/service anidados. */
export async function listAppointments(
  userId: string,
  status: 'upcoming' | 'history',
): Promise<AppointmentDto[]> {
  const nowIso = new Date().toISOString();

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('user_id', userId);

  if (status === 'upcoming') {
    query = query.eq('status', 'confirmed').gte('scheduled_at', nowIso).order('scheduled_at', { ascending: true });
  } else {
    query = query
      .or(`status.neq.confirmed,scheduled_at.lt.${nowIso}`)
      .order('scheduled_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudieron obtener las citas.');
  }

  return ((data ?? []) as unknown as AppointmentRow[]).map(toAppointment);
}

/**
 * Crea una cita. `shop_id` y `price_cop` se derivan en el servidor a partir del
 * barbero y del servicio: el cliente nunca los envia.
 */
export async function createAppointment(
  userId: string,
  input: CreateAppointmentInput,
): Promise<AppointmentDto> {
  const scheduledAt = new Date(input.scheduled_at);

  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    throw new HttpError(400, 'INVALID_SCHEDULE', 'La fecha y hora de la cita debe ser futura.');
  }

  const { data: barberData, error: barberError } = await supabase
    .from('barbers')
    .select('id, shop_id, active')
    .eq('id', input.barber_id)
    .maybeSingle();

  if (barberError) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo validar el barbero.');
  }

  const barber = barberData as BarberLookupRow | null;
  if (!barber || !barber.active) {
    throw new HttpError(404, 'NOT_FOUND', 'El barbero seleccionado no existe o no esta disponible.');
  }

  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select('id, price_cop, active')
    .eq('id', input.service_id)
    .maybeSingle();

  if (serviceError) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo validar el servicio.');
  }

  const service = serviceData as ServiceLookupRow | null;
  if (!service || !service.active) {
    throw new HttpError(404, 'NOT_FOUND', 'El servicio seleccionado no existe o no esta disponible.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      shop_id: barber.shop_id,
      barber_id: barber.id,
      service_id: service.id,
      scheduled_at: scheduledAt.toISOString(),
      price_cop: service.price_cop,
    })
    .select(APPOINTMENT_COLUMNS)
    .single();

  if (error) {
    // 23505 = violacion del indice unico parcial `appointments_no_double_booking`.
    if (error.code === '23505') {
      throw new HttpError(409, 'SLOT_TAKEN', 'Ese horario ya esta ocupado, elige otro.');
    }
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo crear la cita.');
  }

  return toAppointment(data as unknown as AppointmentRow);
}

/** Cancela una cita propia. Si no existe o pertenece a otro usuario responde 404 (sin filtrar). */
export async function cancelAppointment(userId: string, appointmentId: string): Promise<AppointmentDto> {
  const { data: existingData, error: fetchError } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo consultar la cita.');
  }

  const existing = existingData as AppointmentStatusRow | null;
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'La cita no existe.');
  }
  if (existing.status === 'cancelled') {
    throw new HttpError(409, 'ALREADY_CANCELLED', 'La cita ya estaba cancelada.');
  }
  if (existing.status === 'completed') {
    throw new HttpError(400, 'CANNOT_CANCEL_COMPLETED', 'No se puede cancelar una cita completada.');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('user_id', userId)
    .select(APPOINTMENT_COLUMNS)
    .single();

  if (error || !data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo cancelar la cita.');
  }

  return toAppointment(data as unknown as AppointmentRow);
}
