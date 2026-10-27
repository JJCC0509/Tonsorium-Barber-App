/** Detalle estructurado que acompana a un error de validacion. */
export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Error controlado con codigo HTTP y codigo de negocio.
 * El middleware de errores lo serializa con el formato uniforme:
 * { error: { code, message, details } }
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: ErrorDetail[];

  constructor(status: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
