# Tonsorium Barber App — Backend REST

Backend propio del proyecto académico **Tonsorium Barber App**. Expone **5 rutas de recurso** con **9 operaciones HTTP** sobre una base de datos real en **Supabase (PostgreSQL)**.

- Node.js 22 LTS + **Express 5** + **TypeScript** (strict, CommonJS)
- `@supabase/supabase-js` v2 con la clave **`service_role`** (solo en el servidor)
- Autenticación propia con **JWT** (`jsonwebtoken`) y contraseñas con **bcryptjs**
- Validación de todas las entradas con **Zod**

> La app móvil **nunca** ve credenciales de base de datos: solo habla con esta API por HTTPS/JSON.

---

## Requisitos

- **Node.js 22** (mínimo 20; `engines` declara `>=22`)
- **npm** 10+
- Un proyecto de **Supabase** con el esquema aplicado y el seed cargado
- (Opcional) **Supabase CLI** para aplicar migraciones con `supabase db push`

---

## Instalación

```powershell
cd C:\Users\Admin\Desktop\Tonsorium-Barber-App\backend
npm install
Copy-Item .env.example .env
# Edita .env y completa SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y JWT_SECRET
```

### Variables de entorno

Todas se validan con Zod al arrancar (`src/config/env.ts`); si falta alguna o no es válida, **el proceso se detiene** con un mensaje claro. Referencia completa en [`.env.example`](./.env.example).

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | *Project URL* de Supabase → `Project Settings → API`. |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role secret*. **Secreto de servidor: nunca en la app ni en Git.** |
| `JWT_SECRET` | Firma de los JWT. **Mínimo 32 caracteres.** |
| `PORT` | Puerto HTTP (por defecto `4000`). |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS separados por coma; `*` solo en desarrollo. |
| `NODE_ENV` | `development` \| `test` \| `production` (por defecto `development`). |

**Generar un `JWT_SECRET` seguro:**

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con recarga (`tsx watch src/index.ts`). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta la compilación (`node dist/index.js`). |
| `npm run typecheck` | Verificación de tipos sin emitir (`tsc --noEmit`). |
| `npm run db:seed` | Carga datos de prueba **idempotentes** (catálogo + usuario demo + citas). |

---

## Base de datos

Las migraciones viven en `supabase/migrations/` y **ya están escritas**:

- `001_init_schema.sql` — 5 tablas (`shops`, `barbers`, `services`, `users`, `appointments`), índice único parcial anti-doble-reserva, `updated_at` automático y **RLS habilitado sin políticas**.
- `002_points_and_stats.sql` — trigger de puntos (25 por cita completada) y función `public.get_user_stats(uuid)`.

Aplicarlas (con Supabase CLI ya vinculado):

```powershell
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Alternativa sin CLI: pegar el contenido de ambos archivos en el *SQL Editor* de Supabase y ejecutarlos en orden.

Cargar los datos de prueba:

```powershell
npm run db:seed
```

Resultado esperado: 3 `shops`, 3 `barbers`, 4 `services`, 1 `users` y 13 `appointments` (1 `confirmed` futura + 12 `completed`), con `get_user_stats` devolviendo `cuts_done = 12`, `points = 300`, `rating = 4.9`.

**Usuario demo:** `carlos@tonsorium.test` / `Tonsorium2026*`

---

## Endpoints

Base: `/api/v1`. Autenticación: cabecera `Authorization: Bearer <jwt>`.

Formato de error uniforme:

```json
{ "error": { "code": "STRING_CODE", "message": "texto legible", "details": [] } }
```

| # | Ruta | Operación | Auth | Propósito |
|---|---|---|---|---|
| 1 | `/auth/register` | `POST` | No | Crear cuenta real y persistente |
| 2 | `/auth/login` | `POST` | No | Validar credenciales y emitir JWT |
| 3 | `/me` | `GET` | Sí | Leer perfil + `preferred_shop` + `stats` (RPC `get_user_stats`) |
| 3 | `/me` | `PUT` | Sí | Editar nombre, teléfono, barbería habitual, estilo y notificaciones |
| 4 | `/catalog` | `GET` | No | Barberías, barberos y servicios activos (sin caché) |
| 5 | `/appointments` | `GET` | Sí | Citas propias: `?status=upcoming\|history` |
| 5 | `/appointments` | `POST` | Sí | Reservar (precio y tienda derivados en el servidor) |
| 5 | `/appointments/:id/cancel` | `PATCH` | Sí | Cancelar una cita propia |
| — | `/health` | `GET` | No | Infraestructura: verifica la conexión real a Supabase (no cuenta como endpoint de negocio) |

**Total: 5 rutas de recurso → 9 operaciones HTTP** (+ `/health`).

### Códigos de error

| Código | HTTP | Cuándo |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Entrada inválida (Zod), incluido el cuerpo vacío en `PUT /me`. |
| `INVALID_SCHEDULE` | 400 | `scheduled_at` en el pasado. |
| `CANNOT_CANCEL_COMPLETED` | 400 | Intentar cancelar una cita completada. |
| `UNAUTHORIZED` | 401 | Token ausente, inválido o expirado. |
| `INVALID_CREDENTIALS` | 401 | Correo o contraseña incorrectos (mismo mensaje en ambos casos). |
| `NOT_FOUND` | 404 | Recurso inexistente o inactivo (barbero, servicio, barbería, cita ajena). |
| `EMAIL_TAKEN` | 409 | El correo ya está registrado. |
| `SLOT_TAKEN` | 409 | Doble reserva del mismo barbero a la misma hora. |
| `ALREADY_CANCELLED` | 409 | La cita ya estaba cancelada. |
| `RATE_LIMITED` | 429 | Más de 10 intentos en 15 min en `/auth/*`. |
| `INTERNAL_ERROR` | 500 | Error inesperado del servidor. |

### Pruebas

`api.http` contiene una petición por operación (casos felices y de error). Se puede usar con la extensión **REST Client** de VS Code o importar en Postman/Insomnia. Recuerda completar las variables `@token`, `@shopId`, `@barberId`, `@serviceId` y `@appointmentId` con los valores reales.

---

## Despliegue (Render / Railway)

El backend debe ser accesible por Internet (o por la LAN) para que el APK funcione en un teléfono real.

1. Sube el repositorio a GitHub (el `.env` está en `.gitignore` y **no** debe versionarse).
2. Crea un **Web Service** apuntando a la carpeta `backend/`:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Runtime / Node version:** 22
3. Configura las variables de entorno en el panel del proveedor: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS` (y opcionalmente `PORT`; Render/Railway lo inyectan automáticamente).
4. Verifica desde el navegador del teléfono: `https://<host>/api/v1/health` → debe responder `{ "status": "ok", "db": "ok", ... }`.
5. Repite un registro y un login contra la URL pública.
6. Documenta la URL final: se usará como `EXPO_PUBLIC_API_URL` en la app (`https://<host>/api/v1`) y en `eas.json`.

> **Nota de seguridad:** la `service_role` key se configura **solo** en `backend\.env` y en el panel del proveedor. Nunca en la app móvil, nunca en Git.
