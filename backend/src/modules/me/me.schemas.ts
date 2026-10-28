import { z } from 'zod';
import { phoneSchema } from '../../lib/phone';

/**
 * Todos los campos son opcionales, pero al menos uno debe enviarse.
 * Un cuerpo vacio (o solo con claves desconocidas) produce 400 VALIDATION_ERROR.
 */
export const updateMeSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres.')
      .max(80, 'El nombre no puede pasar de 80 caracteres.')
      .regex(/[A-Za-zÀ-ÿ]/, 'El nombre debe incluir al menos una letra.')
      .optional(),
    phone: phoneSchema.nullable().optional(),
    preferred_shop_id: z.string().uuid('El identificador de barberia no es valido.').nullable().optional(),
    favorite_style: z
      .string()
      .trim()
      .min(1, 'El estilo favorito no puede estar vacio.')
      .max(80, 'El estilo favorito no puede pasar de 80 caracteres.')
      .nullable()
      .optional(),
    notifications_enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
