// Solo maneja HTTP: delega al servicio y responde.
import { NextFunction, Request, Response } from 'express';
import { IAuthService } from '../services/interfaces/auth-service.interface.js';

export class AuthController {
  private readonly authService: IAuthService;

  constructor(cradle: { authService: IAuthService }) {
    this.authService = cradle.authService;
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
