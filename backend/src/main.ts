import { env } from './config/env.js';
import { createApp } from './server.js';

const app = createApp();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Tonsorium API escuchando en http://0.0.0.0:${env.port}/api/v1`);
  console.log('Usuario demo disponible: demo@tonsorium.com / Demo12345');
});
