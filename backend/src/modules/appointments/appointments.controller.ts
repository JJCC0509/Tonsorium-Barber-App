import type { Request, Response } from 'express';
import type { CancelAppointmentParams, CreateAppointmentInput, ListAppointmentsQuery } from './appointments.schemas';
import { cancelAppointment, createAppointment, listAppointments } from './appointments.service';

export async function listAppointmentsHandler(req: Request, res: Response): Promise<void> {
  const { status } = req.query as unknown as ListAppointmentsQuery;
  const appointments = await listAppointments(req.userId as string, status);
  res.status(200).json({ appointments });
}

export async function createAppointmentHandler(req: Request, res: Response): Promise<void> {
  const appointment = await createAppointment(req.userId as string, req.body as CreateAppointmentInput);
  res.status(201).json({ appointment });
}

export async function cancelAppointmentHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as CancelAppointmentParams;
  const appointment = await cancelAppointment(req.userId as string, id);
  res.status(200).json({ appointment });
}
