/**
 * Configuracion de entorno de la app.
 *
 * `EXPO_PUBLIC_*` se incrusta en el bundle durante el build, por lo que el
 * valor queda fijado en el APK: cambiar de backend exige recompilar.
 */

const raw = process.env.EXPO_PUBLIC_API_URL;

if (!raw || raw.trim().length === 0) {
  throw new Error(
    'Falta la variable EXPO_PUBLIC_API_URL.\n' +
      'Crea un archivo .env en la raiz del proyecto con una linea como:\n' +
      'EXPO_PUBLIC_API_URL=http://192.168.1.1:4000/api/v1',
  );
}

/** URL base del backend, sin barra final. */
export const API_URL = raw.trim().replace(/\/+$/, '');
