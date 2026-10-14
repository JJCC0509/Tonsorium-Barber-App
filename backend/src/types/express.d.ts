// Extiende Request con el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
