import { z } from 'zod';

/**
 * Todos los campos son opcionales, pero al menos uno debe enviarse.
 * Un cuerpo vacio (o solo con claves desconocidas) produce 400 VALIDATION_ERROR.
 */
export const updateMeSchema = z
  .object({
    full_name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').optional(),
    phone: z.string().trim().min(1, 'El telefono no puede estar vacio.').nullable().optional(),
    preferred_shop_id: z.string().uuid('El identificador de barberia no es valido.').nullable().optional(),
    favorite_style: z.string().trim().min(1, 'El estilo favorito no puede estar vacio.').nullable().optional(),
    notifications_enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
