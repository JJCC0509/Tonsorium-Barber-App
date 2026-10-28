import { z } from 'zod';
import { phoneSchema } from '../../lib/phone';

const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'La contrasena debe incluir al menos una letra.')
  .regex(/[0-9]/, 'La contrasena debe incluir al menos un numero.');

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(80, 'El nombre no puede pasar de 80 caracteres.')
    .regex(/[A-Za-zÀ-ÿ]/, 'El nombre debe incluir al menos una letra.'),
  email: z.string().trim().email('El correo electronico no es valido.'),
  password: passwordSchema,
  phone: phoneSchema.optional(),
  preferred_shop_id: z.string().uuid('El identificador de barberia no es valido.').optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('El correo electronico no es valido.'),
  password: z.string().min(1, 'La contrasena es obligatoria.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
