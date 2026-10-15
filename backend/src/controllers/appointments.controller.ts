// Solo maneja HTTP: delega al servicio y responde.
import { NextFunction, Request, Response } from 'express';
import { AppointmentFilter } from '../dto/appointments.dto.js';
import { IAppointmentsService } from '../services/interfaces/appointments-service.interface.js';

export class AppointmentsController {
  private readonly appointmentsService: IAppointmentsService;

  constructor(cradle: { appointmentsService: IAppointmentsService }) {
    this.appointmentsService = cradle.appointmentsService;
  }

  list = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const rawFilter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
      const rawLimit = typeof req.query.limit === 'string' ? req.query.limit : undefined;
      const filter = rawFilter as AppointmentFilter | undefined;
      const limit = rawLimit !== undefined ? Number(rawLimit) : undefined;
      const result = this.appointmentsService.list(req.user?.id ?? '', filter, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.appointmentsService.create(req.user?.id ?? '', req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  cancel = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.appointmentsService.cancel(req.user?.id ?? '', req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
