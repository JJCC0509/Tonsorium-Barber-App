import { z } from 'zod';

/** Caracteres admitidos en un telefono internacional. */
const PHONE_ALLOWED = /^[+()\s\d-]+$/;

/** Un numero real de telefonia movil/fija tiene entre 10 y 15 digitos. */
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

/**
 * Telefono no vacio: formato internacional y entre 10 y 15 digitos reales.
 *
 * El chequeo manual se debe a que Zod no valida "cantidad de digitos"
 * ignorando espacios, parentesis o guiones, y a que el error debe decir
 * cuantos digitos se escribieron para que el usuario sepa que corregir.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'El telefono no puede estar vacio.')
  .superRefine((value, ctx) => {
    if (!PHONE_ALLOWED.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El telefono solo puede llevar numeros, espacios, +, - y parentesis.',
      });
      return;
    }

    const plusIndex = value.indexOf('+');
    if (plusIndex > 0 || value.indexOf('+', plusIndex + 1) !== -1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El signo + solo puede ir al principio del numero.',
      });
      return;
    }

    const digits = (value.match(/\d/g) ?? []).length;
    if (digits < PHONE_MIN_DIGITS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El telefono debe tener al menos ${PHONE_MIN_DIGITS} digitos (llevas ${digits}).`,
      });
      return;
    }
    if (digits > PHONE_MAX_DIGITS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El telefono no puede tener mas de ${PHONE_MAX_DIGITS} digitos (llevas ${digits}).`,
      });
    }
  });
