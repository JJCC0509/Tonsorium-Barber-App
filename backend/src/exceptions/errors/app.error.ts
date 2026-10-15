// Catálogo central de errores: código en inglés, mensaje en español, status HTTP.
import { AppExeption } from '../app.exception.js';

interface ErrorEntry {
  code: string;
  message: string;
  statusCode: number;
}

function entry(code: string, message: string, statusCode: number): ErrorEntry {
  return { code, message, statusCode };
}

export const AppErrors = {
  VALIDATION_ERROR: (message = 'Los datos enviados no son válidos.') =>
    new AppExeption('VALIDATION_ERROR', message, 400),
  EMAIL_ALREADY_REGISTERED: () =>
    new AppExeption('EMAIL_ALREADY_REGISTERED', 'Este correo ya está registrado.', 409),
  INVALID_CREDENTIALS: () =>
    new AppExeption('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401),
  MISSING_TOKEN: () =>
    new AppExeption('MISSING_TOKEN', 'Falta el token de autenticación.', 401),
  INVALID_TOKEN: () => new AppExeption('INVALID_TOKEN', 'El token no es válido.', 401),
  TOKEN_EXPIRED: () =>
    new AppExeption('TOKEN_EXPIRED', 'Tu sesión expiró. Inicia sesión de nuevo.', 401),
  SERVICE_NOT_FOUND: () =>
    new AppExeption('SERVICE_NOT_FOUND', 'El servicio seleccionado no existe.', 404),
  BARBER_NOT_FOUND: () =>
    new AppExeption('BARBER_NOT_FOUND', 'El barbero seleccionado no existe.', 404),
  PAST_DATE: () =>
    new AppExeption('PAST_DATE', 'No puedes reservar una cita en el pasado.', 422),
  TOO_FAR_IN_FUTURE: () =>
    new AppExeption(
      'TOO_FAR_IN_FUTURE',
      'Solo puedes reservar citas hasta 30 días en el futuro.',
      422,
    ),
  OUTSIDE_WORKING_HOURS: () =>
    new AppExeption(
      'OUTSIDE_WORKING_HOURS',
      'El horario debe estar entre las 9:00 AM y las 9:00 PM.',
      422,
    ),
  SLOT_TAKEN: () =>
    new AppExeption('SLOT_TAKEN', 'Ese horario ya no está disponible. Elige otro.', 409),
  APPOINTMENT_NOT_FOUND: () =>
    new AppExeption('APPOINTMENT_NOT_FOUND', 'La cita no existe.', 404),
  INVALID_STATUS_TRANSITION: () =>
    new AppExeption(
      'INVALID_STATUS_TRANSITION',
      'Esta cita ya no se puede cancelar.',
      422,
    ),
  ROUTE_NOT_FOUND: () =>
    new AppExeption('ROUTE_NOT_FOUND', 'La ruta solicitada no existe.', 404),
  INTERNAL_SERVER_ERROR: () =>
    new AppExeption('INTERNAL_SERVER_ERROR', 'Ocurrió un error inesperado en el servidor.', 500),
  TOO_MANY_REQUESTS: () =>
    new AppExeption(
      'TOO_MANY_REQUESTS',
      'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      429,
    ),
} satisfies Record<string, (...args: never[]) => AppExeption>;

export { entry };
export type { ErrorEntry };
