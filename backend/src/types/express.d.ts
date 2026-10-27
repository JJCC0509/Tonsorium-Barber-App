declare global {
  namespace Express {
    interface Request {
      /** Id del usuario autenticado. Lo define el middleware `requireAuth`. */
      userId?: string;
    }
  }
}

export {};
