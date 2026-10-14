// Lógica de autenticación: validación manual, bcrypt y JWT.
import bcrypt from 'bcryptjs';
import { USERS } from '../data/users.data.js';
import { AuthResponseDTO, AuthUserDTO, LoginBody, RegisterBody } from '../dto/auth.dto.js';
import { AppErrors } from '../exceptions/errors/app.error.js';
import { SHOPS } from '../utils/constants.js';
import { signToken } from '../utils/jwt.util.js';
import { IAuthService } from './interfaces/auth-service.interface.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toUserDTO(id: string, fullName: string, email: string, phone: string | undefined, preferredShop: string): AuthUserDTO {
  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  return { id, fullName, firstName, email, phone, preferredShop };
}

export class AuthService implements IAuthService {
  async register(body: RegisterBody): Promise<AuthResponseDTO> {
    const fullName = asNonEmptyString(body.fullName);
    const emailRaw = asNonEmptyString(body.email);
    const password = typeof body.password === 'string' ? body.password : null;
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : null;

    if (!fullName || !emailRaw || !password || !confirmPassword) {
      throw AppErrors.VALIDATION_ERROR('Por favor completa los campos obligatorios para registrarte.');
    }
    if (password.length < 8) {
      throw AppErrors.VALIDATION_ERROR('La contraseña debe tener mínimo 8 caracteres.');
    }
    if (password !== confirmPassword) {
      throw AppErrors.VALIDATION_ERROR('Las contraseñas no coinciden.');
    }
    const email = emailRaw.toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw AppErrors.VALIDATION_ERROR('El correo electrónico no tiene un formato válido.');
    }

    let preferredShop = 'Barber Chamos';
    if (body.preferredShop !== undefined) {
      const shop = asNonEmptyString(body.preferredShop);
      if (!shop || !(SHOPS as readonly string[]).includes(shop)) {
        throw AppErrors.VALIDATION_ERROR('La barbería preferida no es válida.');
      }
      preferredShop = shop;
    }

    let phone: string | undefined;
    if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
      if (typeof body.phone !== 'string') {
        throw AppErrors.VALIDATION_ERROR('El teléfono no tiene un formato válido.');
      }
      phone = body.phone.trim() || undefined;
    }

    if (USERS.some((u) => u.email === email)) {
      throw AppErrors.EMAIL_ALREADY_REGISTERED();
    }

    const id = `usr-${USERS.length + 1}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    USERS.push({
      id,
      fullName,
      email,
      phone,
      preferredShop,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    const token = signToken(id, '1d');
    return { token, user: toUserDTO(id, fullName, email, phone, preferredShop) };
  }

  async login(body: LoginBody): Promise<AuthResponseDTO> {
    const emailRaw = asNonEmptyString(body.email);
    const password = typeof body.password === 'string' && body.password.length > 0 ? body.password : null;
    if (!emailRaw || !password) {
      throw AppErrors.VALIDATION_ERROR('Completa tu correo y tu contraseña para continuar.');
    }
    const email = emailRaw.toLowerCase();
    const user = USERS.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw AppErrors.INVALID_CREDENTIALS();
    }
    const remember = body.remember === true;
    const token = signToken(user.id, remember ? '30d' : '1d');
    return {
      token,
      user: toUserDTO(user.id, user.fullName, user.email, user.phone, user.preferredShop),
    };
  }
}
