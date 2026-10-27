import { useCallback, useEffect, useState } from 'react';
import { toErrorMessage } from '../services/apiClient';
import {
  cancelAppointment as cancelAppointmentRequest,
  createAppointment as createAppointmentRequest,
  fetchAppointments,
  type AppointmentListFilter,
} from '../services/appointments.service';
import type { Appointment, CreateAppointmentInput } from '../types/api';

interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  /** `{ silent: true }` refresca sin mostrar el spinner (post-mutacion). */
  refetch: (options?: { silent?: boolean }) => Promise<void>;
  create: (input: CreateAppointmentInput) => Promise<Appointment>;
  cancel: (id: string) => Promise<void>;
}

/** Citas del usuario autenticado, separadas por `upcoming` / `history`. */
export function useAppointments(filter: AppointmentListFilter): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const data = await fetchAppointments(filter);
        setAppointments(data);
        setError(null);
      } catch (err) {
        setError(toErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (input: CreateAppointmentInput) => {
      const created = await createAppointmentRequest(input);
      await refetch({ silent: true });
      return created;
    },
    [refetch],
  );

  const cancel = useCallback(
    async (id: string) => {
      await cancelAppointmentRequest(id);
      await refetch({ silent: true });
    },
    [refetch],
  );

  return { appointments, loading, error, refetch, create, cancel };
}
