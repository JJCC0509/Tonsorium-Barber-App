# Tonsorium API

Backend de **Tonsorium Barber App**: API REST con exactamente 5 endpoints, datos en memoria y autenticación con JWT.

## Requisitos

- Node.js 22 o superior (recomendado 24+).
- npm.

## Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Genera un `JWT_SECRET` propio de mínimo 32 caracteres (nunca uses el de ejemplo en producción):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Ejecución

Desarrollo (recarga automática):

```bash
npm run dev
```

Producción:

```bash
npm run build
npm start
```

Al arrancar verás la URL base y el usuario demo disponible. El servidor escucha en `0.0.0.0` para que el celular acceda por la IP de la red local.

```text
Tonsorium API escuchando en http://0.0.0.0:3000/api/v1
Usuario demo disponible: demo@tonsorium.com / Demo12345
```

Variables de entorno (ver `.env.example`):

| Variable | Defecto | Descripción |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` o `production`. |
| `PORT` | `3000` | Puerto de escucha. |
| `JWT_SECRET` | (obligatorio) | Secreto de firma, mínimo 32 caracteres. Sin él no arranca. |
| `CORS_ORIGIN` | `*` | Origen CORS permitido. |
| `AUTH_RATE_LIMIT_MAX` | `1000` dev / `10` prod | Máximo de peticiones a `/auth/*` por 15 min. |
| `LOG_LEVEL` | `info` | Nivel de log. |

## Endpoints (base `/api/v1`, JSON)

### 1) `POST /auth/register` (público, con rate limit) → `201`

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Carlos Mendoza","email":"carlos@mail.com","phone":"+57 320 6107465","preferredShop":"Barber Chamos","password":"12345678","confirmPassword":"12345678"}'
```

Respuesta:

```json
{ "token": "<jwt>", "user": { "id": "usr-2", "fullName": "Carlos Mendoza", "firstName": "Carlos", "email": "carlos@mail.com", "phone": "+57 320 6107465", "preferredShop": "Barber Chamos" } }
```

### 2) `POST /auth/login` (público, con rate limit) → `200`

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@tonsorium.com","password":"Demo12345","remember":false}'
```

El JWT expira en `30d` si `remember` es `true` y en `1d` si no. Los errores responden `{ "code", "message" }` con el mensaje en español.

### 3) `GET /appointments` (requiere `Authorization: Bearer <token>`) → `200`

Query opcional: `filter=upcoming|history`, `limit` (entero positivo).

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@tonsorium.com","password":"Demo12345"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")
curl "http://localhost:3000/api/v1/appointments?filter=upcoming" -H "Authorization: Bearer $TOKEN"
```

Respuesta:

```json
{
  "items": [
    {
      "id": "apt-1", "serviceId": "s3", "serviceName": "Combo (Corte + Barba)",
      "barberId": "b1", "barberName": "El Chamo", "shop": "Barber Chamos",
      "price": 20000, "durationMinutes": 50,
      "startAt": "2026-10-18T16:30:00-05:00", "endAt": "2026-10-18T17:20:00-05:00",
      "status": "CONFIRMED", "accumulate": 0
    }
  ],
  "summary": { "upcomingCount": 1, "completedCount": 2, "totalPoints": 40 }
}
```

`summary` se calcula siempre sobre todas las citas del usuario. `upcoming` = `CONFIRMED` (asc), `history` = `COMPLETED` o `CANCELLED` (desc).

### 4) `POST /appointments` (requiere token) → `201`

`date` es `YYYY-MM-DD` y `time` es `HH:mm` (24 h) en **America/Bogotá (UTC-5)**.

```bash
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"serviceId":"s1","barberId":"b2","date":"2026-10-20","time":"10:00"}'
```

### 5) `PATCH /appointments/:id/cancel` (requiere token, sin body) → `200`

```bash
curl -X PATCH http://localhost:3000/api/v1/appointments/apt-1/cancel \
  -H "Authorization: Bearer $TOKEN"
```

Cualquier otra ruta responde `404 { "code": "ROUTE_NOT_FOUND", ... }`. La API expone solo estos 5 endpoints; el catálogo de servicios y barberos no se expone por API.

## Reglas de negocio

- `date` + `time` se interpretan en **America/Bogotá (UTC-5)**; `startAt` se guarda en ISO 8601 con offset `-05:00` y `endAt = startAt + durationMinutes`.
- Orden de validación al crear: formato del body (`400`) → servicio existente (`404 SERVICE_NOT_FOUND`) → barbero existente (`404 BARBER_NOT_FOUND`) → fecha no pasada (`422 PAST_DATE`) → máximo 30 días adelante (`422 TOO_FAR_IN_FUTURE`) → horario laboral 09:00–21:00 (`422 OUTSIDE_WORKING_HOURS`) → sin traslape con otra cita no cancelada del mismo barbero (`409 SLOT_TAKEN`).
- La cita nace `CONFIRMED` con el precio del catálogo. El `price` es una foto al momento de reservar: las citas semilla conservan sus precios originales aunque difieran del catálogo.
- **Completado automático**: antes de listar o crear, las citas `CONFIRMED` cuyo `endAt` ya pasó se marcan `COMPLETED` con `accumulate = Math.floor(price / 1000)` (1 punto por cada $1.000). `totalPoints` suma los `accumulate`.
- IDs: citas `apt-<n>`, usuarios `usr-<n>`.
- El email se normaliza a minúsculas y es único. Contraseñas con `bcryptjs` (cost 10). JWT con `sub` = id de usuario.
- Rate limit solo en `/auth/*`: 1000 por 15 min en desarrollo, 10 en producción (`429 TOO_MANY_REQUESTS`).

## Tabla de errores (`{ "code", "message" }`, mensajes en español)

| Código | HTTP | Cuándo |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Datos inválidos (registro, login incompleto, filtro o `limit` inválidos, formato de cita). |
| `EMAIL_ALREADY_REGISTERED` | 409 | Email ya registrado. |
| `INVALID_CREDENTIALS` | 401 | Email inexistente o contraseña incorrecta (mismo mensaje). |
| `MISSING_TOKEN` | 401 | Falta `Authorization: Bearer <token>`. |
| `INVALID_TOKEN` | 401 | Token con firma inválida. |
| `TOKEN_EXPIRED` | 401 | Token vencido. |
| `SERVICE_NOT_FOUND` | 404 | `serviceId` inexistente. |
| `BARBER_NOT_FOUND` | 404 | `barberId` inexistente. |
| `PAST_DATE` | 422 | Fecha/hora en el pasado. |
| `TOO_FAR_IN_FUTURE` | 422 | Más de 30 días adelante. |
| `OUTSIDE_WORKING_HOURS` | 422 | Fuera de 09:00–21:00. |
| `SLOT_TAKEN` | 409 | Traslape con otra cita no cancelada del mismo barbero. |
| `APPOINTMENT_NOT_FOUND` | 404 | La cita no existe o no es del usuario. |
| `INVALID_STATUS_TRANSITION` | 422 | La cita ya no se puede cancelar. |
| `TOO_MANY_REQUESTS` | 429 | Rate limit de `/auth/*`. |
| `ROUTE_NOT_FOUND` | 404 | Ruta inexistente. |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado. |

## Guía de Postman

Archivos en `postman/`:

- `Tonsorium.postman_collection.json` (Collection v2.1, 3 carpetas, 24 requests en orden).
- `Tonsorium.postman_environment.json` (`baseUrl`, `token`, `appointmentId`, `demoEmail`, `demoPassword`).

### Importar

1. Abre Postman → **Import** → arrastra los dos archivos (o **File → Import**).
2. Abajo a la derecha selecciona el environment **Tonsorium**.
3. Levanta la API (`npm run dev`) con el `.env` configurado.

### Correr request por request

1. Ejecuta primero **Auth → Register OK** (el pre-request genera un email único) y luego **Login demo OK** (guarda `token`).
2. Sigue con **Appointments flujo feliz** en orden: cada test verifica status, forma del JSON y valores clave; tras crear se guarda `appointmentId` y al cancelar se libera el horario.
3. **Casos de error** verifica cada código de error de la tabla.

### Correr todo con el Collection Runner

1. Abre la colección → **Run** (Collection Runner).
2. Selecciona el environment **Tonsorium** y deja el orden por defecto.
3. Pulsa **Run Tonsorium**. Todos los tests deben pasar en verde.
4. Puedes pulsar **Run** de nuevo sin reiniciar el servidor: el flujo crea emails únicos y cancela la cita creada, así que la segunda vuelta también pasa.

### Leer los resultados

- Cada request incluye `pm.test(...)`: en el Runner verás por request cuántos tests pasaron/fallaron y el detalle de cada aserción.
- Si un test falla, revisa **Response Body** (debe ser `{ "code", "message" }` en errores) y las variables del environment (`token`, `appointmentId`, `apptDate`, `apptTime`).

## Probar desde el celular (`EXPO_PUBLIC_API_URL`)

La app Expo lee `EXPO_PUBLIC_API_URL` (ver `.env.example` de la app):

- Celular físico: usa la IP de la red local del computador, por ejemplo `http://192.168.1.10:3000/api/v1` (el backend escucha en `0.0.0.0`).
- Emulador Android: usa `http://10.0.2.2:3000/api/v1`.
- No uses `localhost`: en el celular apunta al propio teléfono, no al computador.
