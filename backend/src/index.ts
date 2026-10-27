import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Tonsorium API escuchando en http://localhost:${env.PORT}/api/v1`);
});

/** Cierre ordenado: deja de aceptar conexiones y termina cuando se vacian. */
function shutdown(signal: NodeJS.Signals): void {
  console.log(`\n${signal} recibido. Cerrando el servidor...`);
  server.close(() => {
    process.exit(0);
  });
  // Salida forzada si alguna conexion no se cierra a tiempo.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
