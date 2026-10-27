# PROMPT DE IMPLEMENTACIÓN — TONSORIUM BARBER APP
### Backend REST propio + Supabase + APK Android instalable (proyecto académico)

> **Cómo usar este documento:** es un prompt autocontenido. Se copia y pega completo en un agente de codificación (o se ejecuta como guía manual). Las decisiones técnicas ya están tomadas: **no volver a preguntarlas**.

---

## 0. Rol y objetivo

Actúa como **ingeniero de software full-stack senior**. Debes llevar el proyecto **Tonsorium (Barber App)** desde su estado actual —un prototipo React Native con **todos los datos hardcodeados**— hasta una aplicación **académica, terminada, persistente y desplegable**, que incluya:

1. Un **backend REST propio** con **5 endpoints funcionales y con propósito real**.
2. Una **base de datos real en Supabase (PostgreSQL)** que aún no existe.
3. Una **app móvil conectada al backend**, sin datos simulados.
4. Un **APK Android instalable** y verificado en un dispositivo físico, como entregable final.

**Fuera de alcance explícito:** Google Play Store, iOS, pagos, notificaciones push reales, recuperación de contraseña por correo, panel de administración.

---

## 1. Contexto verificado del repositorio

Rutas (Windows):

| Elemento | Ruta |
|---|---|
| Proyecto móvil (anidado) | `C:\Users\Admin\Desktop\Tonsorium-Barber-App\Tonsorium-Barber-App` |
| **Backend nuevo (carpeta paralela al proyecto anidado)** | `C:\Users\Admin\Desktop\Tonsorium-Barber-App\backend` |
| Documentación de este plan | `C:\Users\Admin\Desktop\Tonsorium-Barber-App\docs` |

Stack real, verificado en `Tonsorium-Barber-App\package.json`:

- Expo `~57.0.23`, React Native `0.86.3`, React `19.2.3`, TypeScript `~6.0.3`.
- `@react-navigation/native` `^7.4.1` + `@react-navigation/native-stack` `^7.19.2`.
- `expo-status-bar`, `react-native-safe-area-context`, `react-native-screens`.
- Scripts: `start`, `android`, `ios`, `web`. **No existe** `eas.json`, `android/`, backend ni archivo `.env`.

> **REGLA OBLIGATORIA** (definida en `Tonsorium-Barber-App\AGENTS.md`): antes de escribir código de Expo, consultar la documentación versionada <https://docs.expo.dev/versions/v57.0.0/> para `expo-secure-store`, `expo-constants` y `expo-splash-screen`. No asumir APIs de versiones anteriores.

### 1.1 Estado actual: todo es simulado

| Qué | Archivo:líneas | Situación real |
|---|---|---|
| Login simulado | `src/screens/LoginScreen.tsx:34-55` | `setTimeout` de 800 ms, **no** valida credenciales; el nombre se deriva del email; `console.log` con la contraseña (línea 46) |
| Registro simulado | `src/screens/RegisterScreen.tsx:31-59` | `setTimeout`; **no persiste** nada |
| Catálogo de servicios (Home) | `src/screens/HomeScreen.tsx:15-20` | `FEATURED_SERVICES` hardcodeado |
| Catálogo de barberos (Home) | `src/screens/HomeScreen.tsx:22-26` | `BARBERS` hardcodeado |
| Próxima cita (Home) | `src/screens/HomeScreen.tsx:69-99` | Cita fija "Barber Chamos / Combo / Hoy 4:30 PM" |
| Citas | `src/screens/AppointmentScreen.tsx:26-57` | `INITIAL_APPOINTMENTS` en memoria; se pierde al cerrar la app |
| Servicios/barberos/fechas/horas de reserva | `src/screens/AppointmentScreen.tsx:59-73` | 4 listas hardcodeadas |
| Perfil | `src/screens/ProfileScreen.tsx:41-52,58-70` | Nombre "Usuario", correo placeholder, stats 12 / 340 / 4.9 fijos |
| Preferencias del perfil | `src/screens/ProfileScreen.tsx:77-121` | Items **sin `onPress`**: no hacen nada |
| Sesión | `App.tsx:18` | `initialRouteName="Login"`; no hay restauración de sesión |

### 1.2 Inconsistencias detectadas que el modelo de datos debe resolver

Estas contradicciones existen hoy entre listas hardcodeadas; la base de datos será la **única fuente de verdad**:

1. **Mismo servicio con dos nombres:** Home dice `Corte Premium $25000` (`HomeScreen.tsx:16`) y Reservar dice `Corte Clásico $25000` (`AppointmentScreen.tsx:60`).
2. **Mismo combo, dos nombres:** `Combo Especial $38000` (`HomeScreen.tsx:18`) vs `Combo (Corte + Barba) $38000` (`AppointmentScreen.tsx:62`).
3. **Precio imposible:** la cita `apt-1` (`AppointmentScreen.tsx:32`) cobra `$20000` por un combo que el catálogo cotiza en `$38000`.
4. **Barbería con dos direcciones:** `Barber Chamos` aparece sin dirección en Home y con "Av. Principal 123" en Perfil (`ProfileScreen.tsx:81`).

**Tarea obligatoria:** reportar estas 4 inconsistencias y resolverlas con la normalización del punto 4.

---

## 2. Decisiones ya tomadas (NO re-preguntar)

| Tema | Decisión |
|---|---|
| Backend | **Node.js 22 LTS + Express 5 + TypeScript**, cliente `@supabase/supabase-js` v2 con **`service_role` key**, validación con **Zod**, `jsonwebtoken` v9, **`bcryptjs`** (JS puro: evita node-gyp en Windows), `cors`, `helmet`, `express-rate-limit`, `dotenv` |
| Autenticación | **JWT propio** firmado por el backend + contraseñas con **bcrypt** (cost 10) en la tabla `public.users` de Supabase. **No** se usa Supabase Auth (GoTrue) |
| Alcance "5 endpoints" | **5 rutas de recurso** que exponen **9 operaciones HTTP** (GET/POST/PUT/PATCH). Ver sección 3 |
| Cliente HTTP en la app | `fetch` nativo de React Native (sin axios) encapsulado en una capa `src/services/` |
| Persistencia de sesión en la app | `expo-secure-store` (token JWT) |
| La app **NO** incluye el SDK de Supabase | La app solo habla con el backend. La `service_role` key **jamás** viaja al dispositivo |
| APK | **EAS Build**, perfil `preview` con `android.buildType: "apk"`. Alternativa local con Gradle documentada en la Fase 9 |
| Seguridad de datos | RLS **habilitado y sin políticas** en todas las tablas: `anon` y `authenticated` no pueden leer nada; solo el backend (`service_role`) accede |
| Datos de prueba | Los mocks actuales se **migran a la base de datos** como *seed* idempotente y quedan **modificables** desde Supabase |

---

## 3. Los 5 endpoints (alcance funcional obligatorio)

Base: `http://<host>/api/v1`. Autenticación: cabecera `Authorization: Bearer <jwt>`.
Formato de error uniforme: `{ "error": { "code": "STRING_CODE", "message": "texto legible", "details": [...] } }`

| # | Endpoint (ruta) | Operaciones | Auth | Propósito en la aplicación | Pantallas que lo consumen |
|---|---|---|---|---|---|
| 1 | `/api/v1/auth/register` | `POST` | No | Crear cuenta real y persistente | `RegisterScreen` |
| 2 | `/api/v1/auth/login` | `POST` | No | Validar credenciales y emitir JWT | `LoginScreen` |
| 3 | `/api/v1/me` | `GET`, `PUT` | Sí | Leer perfil + estadísticas y **editar** nombre, teléfono, barbería habitual, estilo favorito y notificaciones | `ProfileScreen`, `HomeScreen`, `EditProfileScreen` |
| 4 | `/api/v1/catalog` | `GET` | No | Entregar barberías, barberos y servicios (elimina **todas** las listas hardcodeadas) | `HomeScreen`, `AppointmentScreen`, `RegisterScreen`, `EditProfileScreen` |
| 5 | `/api/v1/appointments` | `GET`, `POST`, `PATCH /:id/cancel` | Sí | Listar citas del usuario, reservar y cancelar | `HomeScreen`, `AppointmentScreen` |

**Total: 5 rutas → 9 operaciones HTTP.** Si el docente exige literalmente *5 operaciones*, ver la sección 10 (plan B de recorte).

### 3.1 Contrato detallado

**1) `POST /api/v1/auth/register`**
```jsonc
// body
{ "full_name": "Carlos Mendoza", "email": "carlos@ejemplo.com",
  "password": "Tonsorium2026*", "phone": "+57 320 6107465",
  "preferred_shop_id": "uuid-opcional" }
// 201
{ "token": "<jwt>", "user": { "id": "uuid", "email": "...", "full_name": "...",
  "phone": "...", "preferred_shop_id": null, "favorite_style": null,
  "notifications_enabled": true, "points": 0 } }
```
Errores: `400 VALIDATION_ERROR` (Zod: email válido, contraseña ≥ 8 con al menos 1 letra y 1 número, nombre ≥ 3), `409 EMAIL_TAKEN`.
Efectos: hashea la contraseña con bcrypt y persiste en `public.users`.

**2) `POST /api/v1/auth/login`**
```jsonc
// body
{ "email": "carlos@ejemplo.com", "password": "Tonsorium2026*" }
// 200 -> { "token": "<jwt>", "user": { ... } }
```
Errores: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (mismo mensaje para email inexistente y contraseña errónea: no filtrar información), `429 RATE_LIMITED` (10 intentos / 15 min por IP+email).

**3) `GET /api/v1/me`** → `200`
```jsonc
{ "user": { "id": "...", "email": "...", "full_name": "...", "phone": "...",
            "preferred_shop_id": "...", "favorite_style": "...",
            "notifications_enabled": true, "created_at": "..." },
  "preferred_shop": { "id": "...", "name": "Barber Chamos", "address": "..." } | null,
  "stats": { "cuts_done": 12, "points": 300, "rating": 4.9 } }
```
`stats` se obtiene con la función SQL `public.get_user_stats(uuid)` (sección 4). Nunca se calcula en el cliente.

**4) `PUT /api/v1/me`** → `200` con el usuario actualizado.
```jsonc
// body: todos los campos opcionales, al menos uno obligatorio
{ "full_name": "Carlos M.", "phone": "+57 300 0000000",
  "preferred_shop_id": "uuid|null", "favorite_style": "Fade Medio + Barba Perfilada",
  "notifications_enabled": false }
```
Errores: `400 VALIDATION_ERROR` (cuerpo vacío incluido), `404 NOT_FOUND` si `preferred_shop_id` no existe.

**5) `GET /api/v1/catalog`** → `200`, sin auth, sin caché (siempre lee de la BD).
```jsonc
{ "shops":    [ { "id": "...", "name": "Barber Chamos", "address": "..." } ],
  "barbers":  [ { "id": "...", "name": "El Chamo", "shop_id": "...",
                  "shop_name": "Barber Chamos", "experience_years": 8, "rating": 4.9 } ],
  "services": [ { "id": "...", "name": "Corte Clásico", "description": "...",
                  "price_cop": 25000, "duration_minutes": 30 } ] }
```
Filtros opcionales: `?shop_id=<uuid>` y `?service_id=<uuid>`. Solo devuelve registros con `active = true`.

**6) `GET /api/v1/appointments?status=upcoming|history`** → `200` (solo las del usuario autenticado).
```jsonc
{ "appointments": [ { "id": "...", "status": "confirmed",
    "scheduled_at": "2026-10-28T16:30:00-05:00",
    "price_cop": 38000,
    "shop": { "id": "...", "name": "Barber Chamos", "address": "..." },
    "barber": { "id": "...", "name": "El Chamo" },
    "service": { "id": "...", "name": "Combo (Corte + Barba)", "duration_minutes": 50 } } ] }
```
`upcoming` = `status = 'confirmed' AND scheduled_at >= now()`; `history` = el resto; orden `upcoming` ascendente / `history` descendente.

**7) `POST /api/v1/appointments`**
```jsonc
// body
{ "service_id": "uuid", "barber_id": "uuid", "scheduled_at": "2026-10-28T16:30:00-05:00" }
// 201 -> { "appointment": { ...igual que en GET... } }
```
Reglas de servidor (obligatorias, no delegables al cliente):
- `scheduled_at` debe ser fecha futura → `400 INVALID_SCHEDULE`.
- El barbero debe existir y estar activo → `404 NOT_FOUND`.
- `shop_id` y `price_cop` se **derivan** del barbero y del servicio; **nunca** se aceptan del cliente (evita manipulación de precios).
- Conflicto de horario → `409 SLOT_TAKEN` (garantizado por el índice único parcial de la sección 4).

**8) `PATCH /api/v1/appointments/:id/cancel`** → `200 { "appointment": { ...status: "cancelled" } }`
Errores: `404 NOT_FOUND` (no existe o no es suya → no filtrar), `409 ALREADY_CANCELLED`, `400 CANNOT_CANCEL_COMPLETED`.

**9) `GET /api/v1/health`** → `200 { "status": "ok", "db": "ok", "timestamp": "..." }`
Endpoint de infraestructura (verifica conexión real a Supabase). **No cuenta dentro de los 5.**

---

## 4. Modelo de datos en Supabase (PostgreSQL)

Cinco tablas + un trigger de puntos + una función de estadísticas. Los archivos SQL viven en `backend/supabase/`.

### 4.1 `001_init_schema.sql`

```sql
create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table public.shops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  address    text,
  created_at timestamptz not null default now()
);

create table public.barbers (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops(id) on delete cascade,
  name           text not null,
  experience_years int not null default 0 check (experience_years >= 0),
  rating         numeric(2,1) not null default 5.0 check (rating >= 0 and rating <= 5),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (shop_id, name)
);

create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  description      text,
  price_cop        integer not null check (price_cop >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.users (
  id                    uuid primary key default gen_random_uuid(),
  email                 citext not null unique,
  password_hash         text not null,
  full_name             text not null,
  phone                 text,
  role                  text not null default 'client' check (role in ('client','admin')),
  points                integer not null default 0 check (points >= 0),
  preferred_shop_id     uuid references public.shops(id) on delete set null,
  favorite_style        text,
  notifications_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.appointments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  shop_id      uuid not null references public.shops(id),
  barber_id    uuid not null references public.barbers(id),
  service_id   uuid not null references public.services(id),
  scheduled_at timestamptz not null,
  status       text not null default 'confirmed'
                 check (status in ('confirmed','completed','cancelled')),
  price_cop    integer not null check (price_cop >= 0),  -- copia del precio al reservar
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Impide doble reserva del mismo barbero a la misma hora (excepto citas canceladas)
create unique index appointments_no_double_booking
  on public.appointments (barber_id, scheduled_at)
  where status <> 'cancelled';

create index appointments_user_idx on public.appointments (user_id, scheduled_at desc);

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_users_updated        before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();

-- Row Level Security: habilitada SIN políticas -> anon/authenticated no acceden.
-- Solo el backend con service_role (BYPASSRLS) lee y escribe.
alter table public.shops        enable row level security;
alter table public.barbers      enable row level security;
alter table public.services     enable row level security;
alter table public.users        enable row level security;
alter table public.appointments enable row level security;
```

### 4.2 `002_points_and_stats.sql`

```sql
-- 25 puntos por cada corte completado; se revierten si la cita deja de estar completada.
create or replace function public.sync_user_points() returns trigger
language plpgsql as $$
declare delta integer := 0;
begin
  if tg_op = 'INSERT' then
    if new.status = 'completed' then delta := 25; end if;
  else
    if new.status = 'completed' and old.status is distinct from 'completed' then
      delta := 25;
    elsif old.status = 'completed' and new.status is distinct from 'completed' then
      delta := -25;
    end if;
  end if;
  if delta <> 0 then
    update public.users set points = greatest(points + delta, 0) where id = new.user_id;
  end if;
  return new;
end; $$;

create trigger trg_appointments_points
  after insert or update of status on public.appointments
  for each row execute function public.sync_user_points();

-- Estadísticas del perfil calculadas en la base de datos (no en el cliente)
create or replace function public.get_user_stats(p_user_id uuid)
returns table (cuts_done integer, points integer, rating numeric)
language sql stable as $$
  select
    (select count(*)::int from public.appointments a
      where a.user_id = p_user_id and a.status = 'completed'),
    (select u.points from public.users u where u.id = p_user_id),
    (select coalesce(round(avg(b.rating), 1), 5.0)
       from public.appointments a
       join public.barbers b on b.id = a.barber_id
      where a.user_id = p_user_id and a.status = 'completed');
$$;
```

### 4.3 Seed: migración de los datos de prueba actuales a la BD real

Los mocks de hoy se convierten en **filas persistentes y editables**. Script `backend/src/db/seed.ts` (`npm run db:seed`), **idempotente** (upsert por nombre/email, borrado y reinserción de las citas del usuario demo).

| Origen (mock actual) | Destino en Supabase |
|---|---|
| `Barber Chamos`, `Barberia Prado Centro`, `SurBarber` | 3 filas en `shops` (dirección real: "Av. Principal 123" para Barber Chamos → resuelve la inconsistencia #4) |
| `El Chamo` / `Javier Silva` / `Diego Torres` (`HomeScreen.tsx:22-26`) | 3 filas en `barbers` con `experience_years` 8 / 5 / 10 y `rating` 4.9 / 4.8 / 5.0 |
| Servicios de `HomeScreen.tsx:15-20` **y** `AppointmentScreen.tsx:59-64` | **4 filas unificadas** en `services`: `Corte Clásico` 25000/30, `Barba Tradicional` 18000/25, `Combo (Corte + Barba)` 38000/50, `Cejas` 7000/5 → resuelve las inconsistencias #1 y #2 |
| `INITIAL_APPOINTMENTS` (`AppointmentScreen.tsx:26-57`) | 1 cita `confirmed` a futuro + **12 citas `completed`** históricas |
| Stats `12 / 340 / 4.9` (`ProfileScreen.tsx:58-69`) | Valores **calculados**: `cuts_done = 12`, `points = 300` (12 × 25 del trigger), `rating = 4.9`. El 340 del mock era inventado: se reemplaza por el valor real |

Distribución de las 12 citas completadas para que la calificación sea determinista:
5 con El Chamo (4.9), 4 con Javier Silva (4.8), 3 con Diego Torres (5.0) → `(5×4.9 + 4×4.8 + 3×5.0) / 12 = 4.8916… → 4.9`.
Precios: la lista de servicios es la única autoridad (resuelve la inconsistencia #3: desaparece el combo de $20000).

Usuario demo: `carlos@tonsorium.test` / `Tonsorium2026*` (hash bcrypt generado por el propio script, no escrito a mano en SQL).

---

## 5. Guía paso a paso para conectar Supabase (desde cero)

> El proyecto de Supabase **todavía no existe**. Ejecutar en orden.

**Paso 1 — Crear el proyecto en Supabase**
1. Entrar a <https://supabase.com> → *New project*.
2. Nombre: `tonsorium-barber-app`. Región: la más cercana (ej. `us-east-1` o `sa-east-1`).
3. Guardar la **Database Password** generada en un gestor de contraseñas.
4. Esperar a que el proyecto termine de aprovisionarse.

**Paso 2 — Obtener las credenciales del backend**
En *Project Settings → API*, copiar:
- `Project URL` → `SUPABASE_URL`
- `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (**secreto de servidor**; nunca en la app ni en Git)

**Paso 3 — Crear la carpeta del backend (paralela al proyecto anidado)**
```
C:\Users\Admin\Desktop\Tonsorium-Barber-App\
├── Tonsorium-Barber-App\   (app Expo existente — no mover)
├── docs\                   (estos documentos)
└── backend\                (NUEVO)
```
El backend **no** se crea dentro de `Tonsorium-Barber-App\`: así la app conserva su `package.json` y su build de Expo limpios.

**Paso 4 — Vincular el CLI de Supabase y aplicar el esquema**
```powershell
cd C:\Users\Admin\Desktop\Tonsorium-Barber-App\backend
supabase init                     # crea backend\supabase\
supabase login                    # abre el navegador
supabase link --project-ref <PROJECT_REF>
supabase db push                  # aplica 001_init_schema.sql y 002_points_and_stats.sql
```
> `supabase db push` requiere que las migraciones estén en `backend\supabase\migrations\`. Es un comando re-ejecutable sin efectos duplicados.

**Paso 5 — Alternativa sin CLI (si el CLI no está disponible)**
*SQL Editor* de Supabase → pegar el contenido de `001_init_schema.sql` y luego `002_points_and_stats.sql` → *Run*.

**Paso 6 — Cargar los datos de prueba**
```powershell
npm run db:seed        # dentro de backend\
```

**Paso 7 — Verificar la persistencia real**
En *Table Editor*: confirmar 3 filas en `shops`, 3 en `barbers`, 4 en `services`, 1 en `users`, 13 en `appointments`.
En *SQL Editor*: `select * from get_user_stats((select id from users where email = 'carlos@tonsorium.test'));` → debe devolver `12 | 300 | 4.9`.

---

## 6. Cambios obligatorios en la app móvil

### 6.1 Estructura nueva (aprovecha las carpetas ya creadas)

```
Tonsorium-Barber-App/src/
├── config/env.ts                 # API_BASE_URL desde process.env.EXPO_PUBLIC_API_URL
├── services/
│   ├── apiClient.ts              # fetch + baseURL + token + manejo de errores tipado
│   ├── auth.service.ts           # register / login
│   ├── catalog.service.ts        # getCatalog
│   ├── profile.service.ts        # getMe / updateMe
│   └── appointments.service.ts   # list / create / cancel
├── context/AuthContext.tsx       # sesión, usuario, signIn, signUp, signOut, restore
├── hooks/
│   ├── useCatalog.ts
│   └── useAppointments.ts
├── components/                   # solo lo reutilizado en ≥2 pantallas
│   ├── LoadingView.tsx
│   ├── ErrorBanner.tsx
│   ├── EmptyState.tsx
│   └── ScreenHeader.tsx
├── types/api.ts                  # tipos que reflejan exactamente los JSON del backend
└── screens/EditProfileScreen.tsx # NUEVA: cierre del alcance del perfil
```

### 6.2 Dependencias a instalar (siempre con `npx expo install`, nunca `npm install` a mano)

```powershell
cd C:\Users\Admin\Desktop\Tonsorium-Barber-App\Tonsorium-Barber-App
npx expo install expo-secure-store expo-constants
```
`expo-build-properties` es **opcional**: solo si se decide probar el APK contra un backend local por HTTP (ver Fase 9). La app **no** instala `@supabase/supabase-js`.

### 6.3 Configuración

- `.env` en la raíz de la app: `EXPO_PUBLIC_API_URL=http://192.168.1.x:4000/api/v1` (desarrollo en LAN).
- `app.json` → agregar: `android.package: "com.tonsorium.barber"`, `android.versionCode: 1`, configuración de splash con el plugin `expo-splash-screen` usando `assets/splash-icon.png`, y `extra.eas.projectId` (lo genera `eas init`).
- La URL del backend **no** se escribe literal en el código: siempre vía `EXPO_PUBLIC_API_URL`.

### 6.4 Comportamiento esperado

- `App.tsx`: al arrancar, restaurar sesión desde SecureStore. Mientras se verifica → pantalla de carga. Sin token → `Login`/`Register`. Con token → `Home`/`Appointments`/`Profile`/`EditProfile`. Usar el patrón de **screens condicionales** de React Navigation (una sola pila).
- `LoginScreen`: `handleSubmit` llama a `POST /auth/login`; el error `401` se muestra en el banner existente; **eliminar** el `console.log` de credenciales (`LoginScreen.tsx:46`).
- `RegisterScreen`: llama a `POST /auth/register`; el selector "Barbería preferida" se alimenta de `GET /catalog`; el teléfono se persiste.
- `HomeScreen`: "Próxima Cita" sale de `GET /appointments?status=upcoming` (si no hay, mostrar `EmptyState` con CTA); barberos y servicios salen de `GET /catalog`.
- `AppointmentScreen`: servicios y barberos desde `GET /catalog`; las fechas se generan como los próximos 14 días y los horarios como franjas de 45 min entre 9:00 y 19:00; la reserva llama a `POST /appointments`; ante `409 SLOT_TAKEN` mostrar "Ese horario ya está ocupado, elige otro"; cancelar llama a `PATCH /:id/cancel` con `Alert` de confirmación.
- `ProfileScreen`: datos reales de `GET /me`; stats calculadas; `ActivityIndicator` al cargar; logout limpia SecureStore y reinicia la navegación.
- `EditProfileScreen` (nueva): editar `full_name`, `phone`, `preferred_shop_id` (desde el catálogo), `favorite_style` y `notifications_enabled` → `PUT /me`.
- Todos los estados: **cargando / error / vacío / éxito**. Botones deshabilitados mientras hay una petición en curso.

### 6.5 Decisión sobre los controles que hoy son solo de muestra

| Control | Ubicación | Decisión | Justificación |
|---|---|---|---|
| "¿Olvidaste tu contraseña?" | `LoginScreen.tsx:169-171` | **RETIRAR** | Requiere proveedor de correo (fuera de alcance). Un enlace inerte es una funcionalidad falsa |
| "Recordarme" | `LoginScreen.tsx:159-168` | **CONECTAR** | Marcado → token en SecureStore (sesión persistente); sin marcar → solo en memoria |
| "Continuar como invitado" | `LoginScreen.tsx:194-196` | **RETIRAR** | Un invitado sin cuenta no puede tener citas persistentes; contradice el requisito de persistencia |
| "Barbería preferida" (chips) | `RegisterScreen.tsx:147-170` | **CONECTAR** | Se alimenta del catálogo y persiste en `users.preferred_shop_id` |
| "Próxima Cita" | `HomeScreen.tsx:69-99` | **CONECTAR** | Cita real más próxima; estado vacío si no hay |
| "Próxima Cita" → Detalles/Cancelar | `HomeScreen.tsx:91-98` | **CONECTAR** | Navegar a la cita real (no siempre a "Mis citas") |
| Reservar / Cancelar cita | `AppointmentScreen.tsx:274-276, 362-371` | **CONECTAR** | Persistencia real + validación de conflicto en servidor |
| "Completada" (estado) | `AppointmentScreen.tsx:341` | **CONECTAR (solo lectura)** | El estado proviene de la BD; no hay endpoint de finalización en el alcance (ver Fuera de alcance) |
| Datos de cabecera del perfil | `ProfileScreen.tsx:41-52` | **CONECTAR** | Nombre, correo y avatar desde la sesión |
| Stats 12 / 340 / 4.9 | `ProfileScreen.tsx:58-70` | **CONECTAR** | Calculados por `get_user_stats`; 340 se corrige a 300 real |
| "Barbería Habitual" | `ProfileScreen.tsx:77-84` | **CONECTAR** | Muestra `preferred_shop` real y abre `EditProfileScreen` |
| "Estilo Favorito" | `ProfileScreen.tsx:88-95` | **CONECTAR** | Editable → `favorite_style` |
| "Historial de Citas" | `ProfileScreen.tsx:99-109` | **Ya funciona** | Mantener |
| "Recordatorios & Notificaciones" | `ProfileScreen.tsx:113-120` | **CONECTAR** | `Switch` persistido en `notifications_enabled`. Sin push real: el texto debe decir "Preferencias de recordatorios" para no prometer notificaciones |
| "Sobre Tonsorium App" | `ProfileScreen.tsx:126-132` | **CONECTAR** | Modal informativo; la versión se lee de `expo-constants` (`appVersion`), no del texto fijo "1.0.0 (MVP)" |
| "Términos y Privacidad" | `ProfileScreen.tsx:136-142` | **RETIRAR** | No existe documento legal. No se debe simular cumplimiento normativo en un proyecto académico |
| "Cerrar sesión" | `ProfileScreen.tsx:146-148` | **CONECTAR** | Borrar token + reset de navegación |

**Resumen: 13 controles conectados, 3 retirados.**

---

## 7. Backend: archivos y despliegue

```
backend/
├── package.json                  # scripts: dev, build, start, typecheck, db:seed
├── tsconfig.json
├── .env.example                  # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, PORT, ALLOWED_ORIGINS
├── .gitignore                    # .env, node_modules, dist
├── README.md                     # arranque, variables, endpoints, despliegue
├── api.http                      # colección de pruebas (REST Client / equivalente Postman)
├── supabase/
│   ├── config.toml
│   ├── migrations/001_init_schema.sql
│   ├── migrations/002_points_and_stats.sql
│   └── seed/                     # (referencia; el seed real lo ejecuta el script Node)
└── src/
    ├── index.ts                  # bootstrap + apagado ordenado
    ├── app.ts                    # express, helmet, cors, json, rutas, error handler
    ├── config/env.ts             # validación de variables con Zod (falla rápido si falta algo)
    ├── lib/supabase.ts           # cliente service_role (singleton)
    ├── lib/jwt.ts                # sign / verify
    ├── lib/password.ts           # hash / compare (bcryptjs)
    ├── lib/httpError.ts          # clase de error con status + code
    ├── middleware/auth.ts        # valida Bearer JWT -> req.user
    ├── middleware/validate.ts    # valida body/query/params con Zod
    ├── middleware/error.ts       # formato uniforme de error
    ├── middleware/rateLimit.ts
    ├── db/seed.ts
    └── modules/
        ├── auth/{auth.routes.ts, auth.controller.ts, auth.service.ts, auth.schemas.ts}
        ├── me/{...}
        ├── catalog/{...}
        └── appointments/{...}
```

Reglas del backend:
- El `service_role` key **solo** existe en `backend\.env`. Verificar que `.env` esté en `.gitignore` **antes** del primer commit.
- `bcryptjs` (no `bcrypt`) para evitar compilación nativa en Windows.
- Toda entrada se valida con Zod; nunca se confía en datos del cliente.
- `price_cop` y `shop_id` de una cita se derivan en el servidor.
- CORS restringido a `ALLOWED_ORIGINS`; `express-rate-limit` en `/auth/login` y `/auth/register`.
- Logs sin datos sensibles (nunca contraseñas ni tokens).

Despliegue (para que el APK funcione en un teléfono real, el backend **debe** ser accesible por Internet o por la LAN):
- Opción recomendada: **Render / Railway / Fly.io** (plan gratuito) → `build: npm run build`, `start: npm start`, variables de entorno desde el panel. URL resultante: `https://<app>.onrender.com/api/v1`.
- Verificación: abrir `https://<app>/api/v1/health` desde el navegador del teléfono → debe responder `db: "ok"`.
- Con HTTPS no se necesita ninguna excepción de tráfico en claro en Android.

---

## 8. Objetivo final: APK Android instalable

**Requisitos previos (una sola vez):**
```powershell
npm install -g eas-cli
cd C:\Users\Admin\Desktop\Tonsorium-Barber-App\Tonsorium-Barber-App
eas login
eas init                # crea el proyecto EAS y escribe extra.eas.projectId en app.json
```

**Crear `eas.json` en la raíz de la app:**
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://<backend-desplegado>/api/v1" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "env": { "EXPO_PUBLIC_API_URL": "https://<backend-desplegado>/api/v1" }
    }
  }
}
```

**Construir el APK:**
```powershell
eas build -p android --profile preview      # genera un .apk instalable (NO un .aab)
```
Al terminar, EAS entrega una URL de descarga del `.apk` y un código QR.

> `EXPO_PUBLIC_API_URL` se **incrusta en tiempo de compilación**. Si cambia la URL del backend, hay que **recompilar** el APK. Documentar esta URL en el README.

**Ruta alternativa sin cuenta EAS (Gradle local, requiere JDK 17 + Android SDK 36):**
```powershell
npx expo prebuild -p android
cd android
.\gradlew assembleRelease        # salida: android\app\build\outputs\apk\release\app-release.apk
```
Si se usa esta ruta, la firma se hace con el keystore de debug salvo que se configure uno propio; documentar la limitación.

**Instalación y validación en el teléfono:**
1. Transferir el `.apk` y habilitar "Instalar apps de orígenes desconocidos".
2. Instalar y verificar los flujos de la sección 9 sobre **datos reales de Supabase**.

---

## 9. Criterios de aceptación (definición de "terminado")

**Backend**
1. `GET /api/v1/health` responde `{ status: "ok", db: "ok" }` desde Internet.
2. Las 9 operaciones responden con los contratos de la sección 3, incluidos los casos de error (`400`, `401`, `403/404`, `409`, `429`).
3. Nada de lo que devuelve el backend está hardcodeado: todo proviene de Supabase.

**Persistencia y modificabilidad (evidencia central del proyecto académico)**
4. Registrarse desde la app → la fila aparece en `Table Editor → users` con la contraseña **hasheada** (nunca en texto plano).
5. Crear una cita en la app → aparece en `Table Editor → appointments`.
6. Cancelar la cita en la app → `status` cambia a `cancelled` en la BD.
7. **Modificar un precio en Supabase** (ej. `services.price_cop` de "Cejas" de 7000 a 9000) → al reabrir la pantalla de reserva, la app muestra `$9000` sin tocar código ni recompilar.
8. Completar una cita por SQL (`update appointments set status='completed' where id='...'`) → los puntos del usuario suben 25 y "Cortes hechos" aumenta en 1.
9. Reiniciar la app con sesión iniciada → sigue autenticado (SecureStore).

**App**
10. Cero listas hardcodeadas: eliminados `FEATURED_SERVICES`, `BARBERS`, `SERVICES_LIST`, `BARBERS_LIST`, `DATES_LIST`, `TIMES_LIST`, `INITIAL_APPOINTMENTS` y los textos fijos "Usuario" / "[tucorreo@ejemplo.com]".
11. Toda pantalla tiene estados de carga, error y vacío.
12. Las 3 decisiones de retiro de la sección 6.5 están aplicadas y las 13 conexiones funcionan.

**APK**
13. El `.apk` se instala en un teléfono Android físico sin Expo Go.
14. Con el backend en HTTPS, los 4 flujos críticos funcionan en el dispositivo: registro → login → reserva → cancelación.
15. Con el backend caído, la app muestra un mensaje de error claro y **no** se cierra (sin pantallas en blanco).

---

## 10. Plan B: si se exige exactamente "5 operaciones HTTP"

Se recorta el alcance así, declarándolo explícitamente en la documentación académica:

| Se conserva | Se elimina | Consecuencia honesta |
|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /me`, `GET /appointments`, `POST /appointments` | `PUT /me`, `GET /catalog`, `PATCH /:id/cancel` | El perfil queda **solo lectura** (barbería habitual, estilo y notificaciones vuelven a ser informativos o se retiran), cancelar cita desaparece de la app y las categorías de catálogo quedan en constantes de la app |

No es la opción recomendada: deja la mitad de la pantalla de Perfil sin función real.

---

## 11. Qué NO hacer

- **No** usar Supabase Auth (`supabase.auth.*`) ni `@supabase/supabase-js` en la app.
- **No** exponer `SUPABASE_SERVICE_ROLE_KEY` en el código de la app, en logs ni en Git.
- **No** enviar `price_cop`, `shop_id` ni `user_id` desde el cliente como valores de confianza.
- **No** guardar contraseñas sin hash ni tokens en `AsyncStorage` sin cifrar (usar `expo-secure-store`).
- **No** reemplazar `setTimeout` simulado por datos falsos "en memoria": la fuente única de verdad es la BD.
- **No** agregar pantallas, roles, pagos ni funciones fuera del alcance de la sección 0.
- **No** rediseñar la interfaz ni alterar la paleta `src/styles/colors.ts` (incluidos sus valores atípicos): solo conectar o retirar controles según la sección 6.5.
- **No** crear documentación `.md` adicional salvo el `README.md` del backend.
- **No** ejecutar `git commit` ni `git push` sin autorización explícita.

---

## 12. Forma de trabajo esperada

1. **Fase por fase**, siguiendo `PLAN_IMPLEMENTACION_TONSORIUM.md`, sin avanzar sin cumplir el criterio de aceptación de la fase anterior.
2. Antes de escribir código de Expo, consultar la documentación versionada <https://docs.expo.dev/versions/v57.0.0/> (mandato de `AGENTS.md`).
3. Verificar cada afirmación técnica antes de aplicarla: si una API, comando o flag no se puede confirmar en la documentación oficial, detenerse y reportarlo en lugar de improvisar.
4. Al terminar cada fase, reportar: archivos creados/modificados, comandos ejecutados y **evidencia** obtenida (salida real, captura de `Table Editor`, respuestas HTTP).
5. Si algo del alcance resulta inviable, decirlo con claridad y proponer la alternativa más simple, en vez de simular que funciona.
