import bcrypt from 'bcryptjs';

/** Coste de bcrypt acordado para el proyecto. */
const SALT_ROUNDS = 10;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function comparePassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
