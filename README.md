# Tonsorium Barber App

Proyecto académico: aplicación móvil de barbería con **backend propio**, **base de datos real en Supabase (PostgreSQL)** y entrega final como **APK instalable en Android**.

La aplicación **no tiene datos locales ni simulados**. Todo lo que se ve en pantalla (catálogo, perfil, puntos, citas) llega por HTTPS desde la API, y todo lo que el usuario crea o modifica queda persistido en PostgreSQL.

---

## Arquitectura

```
┌──────────────────────────────────────────────┐
│  App móvil (Expo / React Native)             │
│  APK instalado en el teléfono                │
│  Guarda el JWT en SecureStore                │
└───────────────────┬──────────────────────────┘
                    │  HTTPS + JSON
                    │  Authorization: Bearer <jwt>
                    ▼
┌──────────────────────────────────────────────┐
│  API REST (Express 5 + TypeScript)           │
│  Desplegada en Render                        │
│  Usa la clave service_role (solo servidor)   │
└───────────────────┬──────────────────────────┘
                    │  supabase-js (HTTPS)
                    ▼
┌──────────────────────────────────────────────┐
│  Supabase: PostgreSQL + PostgREST            │
│  5 tablas, RLS, triggers y una función RPC   │
└──────────────────────────────────────────────┘
```

**Decisión de diseño:** la autenticación es propia (JWT + bcrypt) sobre la tabla `public.users`. No se usa Supabase Auth (GoTrue), lo que permite que el backend sea la única pieza con credenciales de base de datos.

---

## Servicios que deben estar funcionando

### 1. Terceros, en la nube (necesarios siempre)

| Servicio | Para qué sirve | ¿Debe estar encendido? | Coste |
|---|---|---|---|
| **Supabase** (`<project-ref>.supabase.co`) | Es la base de datos y su API REST. Aquí viven los datos. | **Sí, siempre.** Si está pausado, la API responde error y la app no carga nada. | Plan gratuito. Los proyectos sin actividad se pausan a los ~7 días; se reactivan desde el panel. |
| **Render** (`tonsorium-api.onrender.com`) | Ejecuta el backend Express. Es el único que habla con Supabase. | **Sí, siempre**, para que el APK funcione. | Plan gratuito: **se suspende tras 15 min sin tráfico**. La primera petición lo despierta (tarda entre 20 y 50 s). |
| **Expo EAS** | Solo se usa para **compilar** el APK en la nube. | Solo durante el build. | Plan gratuito con cola. |

### 2. En el teléfono donde se instala el APK

**Nada.** No hace falta ningún servicio en segundo plano:

- No necesita **Expo Go** (el APK es nativo y ya contiene el bundle de JavaScript).
- No necesita el **servidor de Metro** encendido.
- No necesita que el **PC esté prendido** ni en la misma red.
- Lo único que necesita es **conexión a Internet**, porque los datos son remotos. Es justamente el objetivo del proyecto: datos persistentes compartidos, no locales.

### 3. En el PC (solo si vas a desarrollar)

| Servicio | Comando | Notas |
|---|---|---|
| Backend en modo desarrollo | `npm run dev` (puerto 4000) | Recarga automática con `tsx watch`. |
| Servidor de desarrollo de Expo (Metro) | `npx expo start` | Solo para probar en Expo Go o en un *development build*. |

---

## Requisitos previos

- **Git**
- **Node.js 22** (el `engines` del backend fija `22.x` a propósito, ver *Problemas conocidos*)
- **npm** 10 o superior
- Cuenta en **Supabase**, **Render** y **Expo** (las dos últimas solo si vas a desplegar o a recompilar)
- Un **teléfono Android** para instalar el APK

---

## Estructura del repositorio

```
Tonsorium-Barber-App/            <- raíz del repositorio
├── Tonsorium-Barber-App/        <- la app móvil (Expo)
│   ├── src/{screens,services,context,hooks,types,config,utils}
│   ├── app.json                 <- package Android: com.tonsorium.barber
│   ├── eas.json                 <- perfiles de compilación (APK / AAB)
│   └── .env.example
├── backend/                     <- la API REST (Express)
│   ├── src/{modules,middleware,lib,db,config}
│   ├── supabase/migrations/     <- 001, 002, 003
│   ├── api.http                 <- una petición por operación
│   ├── .npmrc                   <- fuerza devDependencies en el build
│   └── README.md                <- detalle de endpoints y despliegue
├── docs/                        <- prompt y plan de implementación
└── render.yaml                  <- blueprint de despliegue del backend
```

> Ojo: la carpeta de la app se llama igual que la raíz. Es la estructura original del proyecto y se conserva.

---

## Ruta A — Ejecutar todo desde un PC nuevo (desarrollo)

### Paso 1. Clonar

```powershell
git clone https://github.com/JJCC0509/Tonsorium-Barber-App.git
cd Tonsorium-Barber-App
```

### Paso 2. Crear el proyecto de Supabase

1. Entra a <https://supabase.com/dashboard> y pulsa **New project**.
2. Elige organización, nombre, una **contraseña de base de datos** (guárdala) y la región más cercana.
3. Espera a que termine el aprovisionamiento (~2 min).

### Paso 3. Aplicar el esquema

En el panel del proyecto: **SQL Editor** → **New query**. Pega y ejecuta, **en este orden**, el contenido de:

1. `backend\supabase\migrations\001_init_schema.sql` — 5 tablas, índice único anti-doble-reserva, trigger de `updated_at`, RLS habilitado sin políticas.
2. `backend\supabase\migrations\002_points_and_stats.sql` — trigger de puntos (25 por cita completada) y función `public.get_user_stats(uuid)`.
3. `backend\supabase\migrations\003_service_role_grants.sql` — **imprescindible**, ver *Problemas conocidos*.

Comprueba en **Table Editor** que aparecen las 5 tablas: `shops`, `barbers`, `services`, `users`, `appointments`.

### Paso 4. Obtener las credenciales

**Project Settings → API**:

- **Project URL** → será `SUPABASE_URL`
- **service_role secret** → será `SUPABASE_SERVICE_ROLE_KEY`

> La `service_role` **omite RLS**. Es un secreto de servidor: nunca en la app móvil, nunca en Git.

### Paso 5. Levantar el backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edita `backend\.env` y completa las tres variables:

```ini
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
JWT_SECRET=<48 bytes aleatorios>
```

Genera el secreto con:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Carga los datos de prueba y arranca:

```powershell
npm run db:seed     # catálogo + usuario demo + 13 citas (idempotente)
npm run dev         # API en http://localhost:4000/api/v1
```

Verifica: <http://localhost:4000/api/v1/health> debe responder `{"status":"ok","db":"ok",...}`.

### Paso 6. Configurar y arrancar la app

En **otra terminal**, desde la raíz del repositorio:

```powershell
cd Tonsorium-Barber-App
npm install
Copy-Item .env.example .env
```

`Tonsorium-Barber-App\.env`:

```ini
# Opción 1: backend local en la misma red Wi-Fi
EXPO_PUBLIC_API_URL=http://192.168.1.1:4000/api/v1

# Opción 2: backend ya desplegado (funciona en cualquier red)
EXPO_PUBLIC_API_URL=https://tonsorium-api.onrender.com/api/v1
```

Reemplaza `192.168.1.1` por la IP local de tu PC (`ipconfig`). Si usas la opción 1:

- El teléfono debe estar en la **misma red Wi-Fi** que el PC.
- Windows Firewall debe permitir **Node.js** en el puerto 4000 (si no, acepta el aviso que aparece la primera vez que arranca el backend).

Arranca:

```powershell
npx expo start
```

Escanea el QR con **Expo Go**, o pulsa `a` para abrir un emulador Android.

> `EXPO_PUBLIC_*` se incrusta en el bundle. Si cambias el valor, **detén y reinicia** `npx expo start` con `--clear`.

### Paso 7. Iniciar sesión

Usuario demo creado por el seed:

| Correo | Contraseña |
|---|---|
| `carlos@tonsorium.test` | `Tonsorium2026*` |

---

## Ruta B — Solo instalar el APK en un teléfono nuevo

**No necesitas el PC ni este repositorio.** El APK ya lleva dentro la URL del backend.

1. Abre el enlace del último build en el teléfono:
   <https://expo.dev/accounts/jaime555s-team/projects/TONSORIUM/builds>
   (o escanea el QR que muestra el CLI al terminar el build). Inicia sesión con la cuenta de Expo si te lo pide.
2. Descarga el `.apk`.
3. Android pedirá permitir **instalar apps de origen desconocido** para el navegador o el gestor de archivos. Actívalo y continúa.
4. Abre la app e inicia sesión con `carlos@tonsorium.test` / `Tonsorium2026*`, o regístrate con una cuenta nueva (queda guardada en Supabase y es visible desde el Table Editor).

**Advertencia sobre la primera apertura:** si el backend de Render lleva más de 15 minutos sin tráfico, estará dormido. La primera petición puede tardar en responder; la app muestra una pantalla de **Reintentar** y el botón despierta el servidor. A partir de ahí funciona con normalidad.

---

## Variables de entorno

### Backend (`backend\.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SUPABASE_URL` | Sí | *Project URL* de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | *service_role secret*. **Nunca en Git ni en la app.** |
| `JWT_SECRET` | Sí | Firma de los JWT. Mínimo 32 caracteres. |
| `PORT` | No | Puerto HTTP (por defecto `4000`). |
| `ALLOWED_ORIGINS` | No | Orígenes CORS separados por coma; `*` solo en desarrollo. |
| `NODE_ENV` | No | `development` \| `test` \| `production`. |

Todas se validan con Zod al arrancar. Si falta alguna, el proceso se detiene con un mensaje claro.

### App (`Tonsorium-Barber-App\.env`)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Sí | URL base del backend **sin barra final**. Se incrusta en el bundle en tiempo de compilación. |

---

## Endpoints

Base: `/api/v1`. Autenticación: cabecera `Authorization: Bearer <jwt>`.

| # | Ruta | Operación | Auth | Propósito |
|---|---|---|---|---|
| 1 | `/auth/register` | `POST` | No | Crear cuenta real y persistente |
| 2 | `/auth/login` | `POST` | No | Validar credenciales y emitir JWT |
| 3 | `/me` | `GET` | Sí | Perfil + `preferred_shop` + `stats` (RPC `get_user_stats`) |
| 3 | `/me` | `PUT` | Sí | Editar nombre, teléfono, barbería, estilo y notificaciones |
| 4 | `/catalog` | `GET` | No | Barberías, barberos y servicios activos |
| 5 | `/appointments` | `GET` | Sí | Citas propias (`?status=upcoming\|history`) |
| 5 | `/appointments` | `POST` | Sí | Reservar (precio y tienda se derivan en el servidor) |
| 5 | `/appointments/:id/cancel` | `PATCH` | Sí | Cancelar una cita propia |
| — | `/health` | `GET` | No | Comprueba la conexión real a Supabase |

**5 rutas de recurso → 9 operaciones HTTP.** El detalle de códigos de error y el archivo `api.http` con una petición por operación están en [`backend/README.md`](./backend/README.md).

URL pública actual: `https://tonsorium-api.onrender.com/api/v1`

---

## Compilar un APK nuevo

El APK se compila en la nube con EAS. No hace falta Android Studio ni el SDK de Android.

```powershell
cd Tonsorium-Barber-App
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

- El perfil **`preview`** genera un **`.apk`** instalable (el perfil `production` genera un `.aab`, que **no** sirve para instalar directamente).
- El `projectId` ya está vinculado en `app.json`, y la clave de firma Android está guardada en los servidores de Expo, así que las actualizaciones se instalan **encima** de la app existente, sin desinstalar.
- Al terminar, el CLI muestra un enlace y un QR. Responde **`n`** a la pregunta del emulador si vas a instalar en un teléfono físico.

Para cambiar la URL del backend en el APK, edita `env` del perfil en `eas.json` y **vuelve a compilar**: el valor queda incrustado en el bundle.

---

## Problemas conocidos

Cinco trampas reales encontradas durante el desarrollo y el despliegue, todas resueltas:

1. **npm omite las devDependencies en el build de Render.** El servicio define `NODE_ENV=production`, así que `npm ci` no instala `typescript` ni `@types/node` y el build falla con `TS2688 Cannot find type definition file for 'node'`. Solución: `--include=dev` en el `buildCommand` **y** `backend\.npmrc` con `include=dev`.
2. **Hay que fijar la versión de Node.** Con `engines.node: ">=22"`, Render instaló Node 26 y su `tsc` rechazaba el proyecto con `TS5108 Option 'moduleResolution=node10' has been removed`. Solución: `"node": "22.x"`, que garantiza el `tsc 5.9.3` del `package-lock.json`.
3. **Supabase ya no concede privilegios a las tablas nuevas.** Sin la migración `003_service_role_grants.sql`, la API responde `permission denied` **aunque use la `service_role` key**: `BYPASSRLS` omite el filtrado por filas, pero no los `GRANT`.
4. **El plan gratuito de Render duerme el servicio.** La primera petición tras 15 minutos de inactividad tarda entre 20 y 50 s, más que el tiempo de espera de 15 s de la app. La app interpreta ese fallo como problema de red (no como sesión inválida) y ofrece **Reintentar**, en lugar de expulsar al usuario al Login.
5. **`EXPO_PUBLIC_API_URL` queda incrustada en el APK.** Cambiar de backend exige recompilar; no basta con editar el `.env`.

---

## Documentación adicional

- [`backend/README.md`](./backend/README.md) — endpoints, códigos de error, migraciones y despliegue.
- [`docs/PROMPT_IMPLEMENTACION_TONSORIUM.md`](./docs/PROMPT_IMPLEMENTACION_TONSORIUM.md) — especificación de los 5 endpoints y criterios de aceptación.
- [`docs/PLAN_IMPLEMENTACION_TONSORIUM.md`](./docs/PLAN_IMPLEMENTACION_TONSORIUM.md) — plan de implementación por fases.
