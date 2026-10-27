import { HttpError } from '../../lib/httpError';
import { signToken } from '../../lib/jwt';
import { comparePassword, hashPassword } from '../../lib/password';
import { supabase } from '../../lib/supabase';
import { USER_COLUMNS, toPublicUser, type PublicUser, type UserRow } from '../../lib/mappers';
import type { LoginInput, RegisterInput } from './auth.schemas';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Crea la cuenta: hashea la contrasena y persiste en `public.users`. */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name,
      phone: input.phone ?? null,
      preferred_shop_id: input.preferred_shop_id ?? null,
    })
    .select(USER_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta registrada con ese correo electronico.');
    }
    if (error.code === '23503') {
      throw new HttpError(404, 'NOT_FOUND', 'La barberia preferida indicada no existe.');
    }
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudo crear la cuenta.');
  }

  const user = toPublicUser(data as UserRow);
  return { token: signToken(user.id), user };
}

/** Valida credenciales y emite el JWT. Mismo mensaje para email y contrasena fallidos. */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { data, error } = await supabase
    .from('users')
    .select(`${USER_COLUMNS}, password_hash`)
    .eq('email', input.email)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'No se pudieron validar las credenciales.');
  }

  const invalidCredentials = (): HttpError =>
    new HttpError(401, 'INVALID_CREDENTIALS', 'Correo o contrasena incorrectos.');

  if (!data) {
    throw invalidCredentials();
  }

  const row = data as UserRow & { password_hash: string };
  const isPasswordValid = await comparePassword(input.password, row.password_hash);
  if (!isPasswordValid) {
    throw invalidCredentials();
  }

  const user = toPublicUser(row);
  return { token: signToken(user.id), user };
}
