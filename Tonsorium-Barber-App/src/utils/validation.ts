/**
 * Validaciones de formulario compartidas por las pantallas de acceso y perfil.
 *
 * Cada funcion devuelve `null` si el valor es correcto o el mensaje concreto
 * que debe verse en pantalla. Duplican a proposito las reglas de Zod del
 * backend: aqui sirven para responder al instante y sin gastar una peticion,
 * pero el backend sigue siendo la autoridad final sobre los datos.
 */

/** Correo: local@dominio.ext, sin espacios y con extension de 2+ letras. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Caracteres admitidos en un telefono internacional. */
const PHONE_ALLOWED = /^[+()\s\d-]+$/;

/** Limite de `citext` en la base de datos. */
const EMAIL_MAX_LENGTH = 254;

/** bcrypt ignora todo lo que pase de 72 bytes. */
const PASSWORD_MAX_LENGTH = 72;

const NAME_MAX_LENGTH = 80;
const FAVORITE_STYLE_MAX_LENGTH = 80;

const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

function countDigits(value: string): number {
  const matches = value.match(/\d/g);
  return matches ? matches.length : 0;
}

/** `null` si el correo es valido; si no, el motivo concreto del rechazo. */
export function validateEmail(raw: string): string | null {
  const value = raw.trim();

  if (value.length === 0) {
    return 'El correo electrónico es obligatorio.';
  }
  if (/\s/.test(value)) {
    return 'El correo no puede tener espacios.';
  }
  if (value.length > EMAIL_MAX_LENGTH) {
    return 'El correo es demasiado largo.';
  }

  const atIndex = value.indexOf('@');
  if (atIndex === -1) {
    return 'Al correo le falta el símbolo @. Escríbelo como nombre@dominio.com';
  }
  if (value.indexOf('@', atIndex + 1) !== -1) {
    return 'El correo solo puede llevar un símbolo @.';
  }
  if (atIndex === 0) {
    return 'Al correo le falta el nombre de usuario antes de la @.';
  }

  const domain = value.slice(atIndex + 1);
  if (domain.length === 0) {
    return 'Al correo le falta el dominio después de la @.';
  }
  if (!domain.includes('.')) {
    return 'Al dominio del correo le falta la extensión (ej. .com).';
  }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return 'El dominio del correo no es válido.';
  }
  if (!EMAIL_SHAPE.test(value)) {
    return 'El correo contiene caracteres no válidos. Escríbelo como nombre@dominio.com';
  }

  return null;
}

/**
 * `null` si el telefono es valido. Acepta el formato internacional
 * (`+57 320 6107465`) y exige entre 10 y 15 digitos reales.
 *
 * @param required si es `true`, el campo vacio se rechaza.
 */
export function validatePhone(raw: string, required = false): string | null {
  const value = raw.trim();

  if (value.length === 0) {
    return required ? 'El teléfono es obligatorio.' : null;
  }
  if (!PHONE_ALLOWED.test(value)) {
    return 'El teléfono solo puede llevar números, espacios, +, - y paréntesis.';
  }
  const plusIndex = value.indexOf('+');
  if (plusIndex > 0 || value.indexOf('+', plusIndex + 1) !== -1) {
    return 'El signo + solo puede ir al principio del número.';
  }

  const digits = countDigits(value);
  if (digits < PHONE_MIN_DIGITS) {
    return `El teléfono debe tener al menos ${PHONE_MIN_DIGITS} dígitos (llevas ${digits}).`;
  }
  if (digits > PHONE_MAX_DIGITS) {
    return `El teléfono no puede tener más de ${PHONE_MAX_DIGITS} dígitos (llevas ${digits}).`;
  }

  return null;
}

/** `null` si el nombre es valido. */
export function validateFullName(raw: string): string | null {
  const value = raw.trim();

  if (value.length === 0) {
    return 'El nombre es obligatorio.';
  }
  if (value.length < 3) {
    return 'El nombre debe tener al menos 3 caracteres.';
  }
  if (value.length > NAME_MAX_LENGTH) {
    return `El nombre no puede pasar de ${NAME_MAX_LENGTH} caracteres.`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value)) {
    return 'El nombre debe incluir al menos una letra.';
  }

  return null;
}

/** `null` si la contrasena cumple la politica del backend. */
export function validatePassword(raw: string): string | null {
  if (raw.length === 0) {
    return 'La contraseña es obligatoria.';
  }
  if (raw.length < 8) {
    return 'La contraseña debe tener mínimo 8 caracteres.';
  }
  if (raw.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede pasar de ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!/[A-Za-z]/.test(raw)) {
    return 'La contraseña debe incluir al menos una letra.';
  }
  if (!/[0-9]/.test(raw)) {
    return 'La contraseña debe incluir al menos un número.';
  }

  return null;
}

/** `null` si el estilo favorito es valido. Vacio se permite (campo opcional). */
export function validateFavoriteStyle(raw: string): string | null {
  const value = raw.trim();

  if (value.length > FAVORITE_STYLE_MAX_LENGTH) {
    return `El estilo no puede pasar de ${FAVORITE_STYLE_MAX_LENGTH} caracteres.`;
  }

  return null;
}
