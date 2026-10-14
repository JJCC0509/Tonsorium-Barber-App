import { AuthResponseDTO, LoginBody, RegisterBody } from '../../dto/auth.dto.js';

export interface IAuthService {
  register(body: RegisterBody): Promise<AuthResponseDTO>;
  login(body: LoginBody): Promise<AuthResponseDTO>;
}
