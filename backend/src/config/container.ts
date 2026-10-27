// Contenedor de dependencias con Awilix en modo PROXY y singletons.
import { InjectionMode, asClass, createContainer } from 'awilix';
import { AppointmentsController } from '../controllers/appointments.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import { AppointmentsService } from '../services/appointments.service.js';
import { AuthService } from '../services/auth.service.js';

export const container = createContainer({ injectionMode: InjectionMode.PROXY });

container.register({
  authService: asClass(AuthService).singleton(),
  appointmentsService: asClass(AppointmentsService).singleton(),
  authController: asClass(AuthController).singleton(),
  appointmentsController: asClass(AppointmentsController).singleton(),
});
