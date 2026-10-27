import {
  AppointmentFilter,
  AppointmentResponseDTO,
  CreateAppointmentBody,
  ListAppointmentsResponseDTO,
} from '../../dto/appointments.dto.js';

export interface IAppointmentsService {
  list(userId: string, filter?: AppointmentFilter, limit?: number): ListAppointmentsResponseDTO;
  create(userId: string, body: CreateAppointmentBody): AppointmentResponseDTO;
  cancel(userId: string, id: string): AppointmentResponseDTO;
}
