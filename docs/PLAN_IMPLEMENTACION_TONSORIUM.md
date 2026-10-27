# PLAN DE IMPLEMENTACIÓN — TONSORIUM BARBER APP
### De prototipo hardcodeado a app académica terminada, persistente y con APK instalable

**Documento complementario:** `PROMPT_IMPLEMENTACION_TONSORIUM.md` (contratos, esquema SQL y reglas detalladas).
**Alcance:** 5 endpoints REST propios + Supabase (BD real) + app integrada + APK Android.
**Fuera de alcance:** Google Play, iOS, pagos, push notifications reales, recuperación de contraseña, panel admin.

**Rutas base**
- App móvil (anidada): `C:\Users\Admin\Desktop\Tonsorium-Barber-App\Tonsorium-Barber-App`
- Backend nuevo: `C:\Users\Admin\Desktop\Tonsorium-Barber-App\backend`
- Documentación: `C:\Users\Admin\Desktop\Tonsorium-Barber-App\docs`

---

## 1. Punto de partida verificado

| Aspecto | Estado real |
|---|---|
| Stack | Expo `~57.0.23` · RN `0.86.3` · React `19.2.3` · TypeScript `~6.0.3` · React Navigation 7 |
| Pantallas | 5: `LoginScreen`, `RegisterScreen`, `HomeScreen`, `AppointmentScreen`, `ProfileScreen` |
| Datos | **100 % hardcodeados**: catálogos, citas, perfil y estadísticas |
| Autenticación | Simulada con `setTimeout`; no valida nada (`LoginScreen.tsx:44-49`, `RegisterScreen.tsx:50-53`) |
| Persistencia | Ninguna; cerrar la app borra las citas creadas |
| Backend / BD | No existen |
| Build Android | Sin `eas.json`, sin `android.package`, sin carpeta `android/` |
| Bugs objetivos | `console.log` con credenciales (`LoginScreen.tsx:46`); 4 inconsistencias de datos entre listas (ver prompt §1.2); 4 controles de UI inertes en Perfil |

---

## 2. Arquitectura objetivo

```
┌──────────────────────────────┐        HTTPS/JSON        ┌────────────────────────────┐
│  App Expo SDK 57 (React      │  ───────────────────────▶ │  Backend Node 22 +         │
│  Native + TS)                │   Bearer <JWT>            │  Express 5 + TypeScript    │
│  APK Android instalable      │                           │  (carpeta backend/)        │
│  · expo-secure-store (token) │                           └─────────────┬──────────────┘
│  · fetch nativo              │                                         │ service_role
│  · sin SDK de Supabase       │                                         ▼
└──────────────────────────────┘                           ┌────────────────────────────┐
                                                            │ Supabase PostgreSQL        │
                                                            │ 5 tablas + trigger puntos  │
                                                            │ + función de estadísticas  │
                                                            │ RLS activo, sin políticas  │
                                                            └────────────────────────────┘
```

**Principios:** una sola fuente de verdad (PostgreSQL); la app nunca ve credenciales de BD; el servidor valida todo y deriva precios/tienda; RLS bloquea el acceso anónimo.

---

## 3. Matriz de trazabilidad: cada endpoint justifica su existencia

| Endpoint | Problema actual que elimina | Archivo afectado |
|---|---|---|
| `POST /auth/register` | Registro falso que no guarda nada | `RegisterScreen.tsx:31-59` |
| `POST /auth/login` | Login falso basado en `setTimeout` | `LoginScreen.tsx:34-55` |
| `GET/PUT /me` | Perfil con "Usuario", "[tucorreo@ejemplo.com]" y stats inventadas | `ProfileScreen.tsx:41-70` |
| `GET /catalog` | 6 listas duplicadas e inconsistentes en 3 pantallas | `HomeScreen.tsx:15-26`, `AppointmentScreen.tsx:59-70`, `RegisterScreen.tsx:150` |
| `GET/POST/PATCH /appointments` | Citas en memoria que se pierden al cerrar la app | `AppointmentScreen.tsx:26-57,86-127` |

Ningún endpoint quedaría sin consumidor real en la app. Ninguna lista quedaría hardcodeada.

---

## 4. Fases de implementación

Cada fase termina con un **criterio de aceptación (CA)** verificable. No se avanza sin cumplirlo.

---

### Fase 0 — Preparación y control de versiones

**Objetivo:** partir de una base reproducible y asegurar que los secretos no lleguen a Git.

**Tareas**
1. Confirmar en la app que no hay cambios sin guardar; crear rama de trabajo: `git checkout -b feature/backend-supabase-apk`.
2. Verificar el árbol actual: `git status` y `git log -n 5` (solo lectura, sin commit ni push).
3. Confirmar que `.env` y `.env.local` estén en `Tonsorium-Barber-App\.gitignore`.
4. Crear `C:\Users\Admin\Desktop\Tonsorium-Barber-App\backend` (vacía) y `docs\` si no existe.
5. Verificar herramientas instaladas: `node -v` (≥ 20, ideal 22), `npm -v`, `git --version`, `npx expo --version`.

**CA:** rama creada; `backend\` existe; `node -v` ≥ 20; `.env` ignorado por Git.

---

### Fase 1 — Crear el proyecto Supabase

**Objetivo:** tener la BD real aprovisionada y las credenciales del backend a mano.

**Tareas**
1. Crear el proyecto `tonsorium-barber-app` en <https://supabase.com> (región cercana).
2. Guardar la *Database Password* en un gestor de contraseñas.
3. Copiar desde *Project Settings → API*: `Project URL` y `service_role` secret.
4. Anotar el `PROJECT_REF` (lo usa `supabase link`).
5. Instalar/verificar el CLI: `supabase --version` (si falta: `npm install -g supabase` o `scoop install supabase`).

**CA:** el proyecto aparece *Healthy* en el panel; las 2 credenciales están guardadas fuera del repositorio.

**Riesgo:** el plan gratuito pausa proyectos inactivos. Mitigación: despertar el proyecto antes de la sustentación y antes de cada build de prueba.

---

### Fase 2 — Esquema, triggers y datos iniciales en Supabase

**Objetivo:** BD completa, con las reglas de negocio dentro de la base (no en el cliente).

**Tareas**
1. `backend\supabase\migrations\001_init_schema.sql` → 5 tablas, índice único parcial anti-doble-reserva, `updated_at` automático, RLS habilitado sin políticas. (SQL literal en prompt §4.1.)
2. `backend\supabase\migrations\002_points_and_stats.sql` → trigger de puntos (25 por corte completado) y función `public.get_user_stats(uuid)`. (prompt §4.2.)
3. `supabase init` → `supabase link --project-ref <REF>` → `supabase db push`.
4. `backend\src\db\seed.ts` (idempotente) + script `npm run db:seed`:
   - 3 `shops` (con dirección real para Barber Chamos → resuelve la inconsistencia #4)
   - 3 `barbers` (El Chamo 4.9/8a, Javier Silva 4.8/5a, Diego Torres 5.0/10a)
   - **4** `services` unificados (elimina nombres duplicados y el combo de $20000 → inconsistencias #1, #2, #3)
   - 1 usuario demo `carlos@tonsorium.test` (hash bcrypt generado en el script)
   - 1 cita `confirmed` futura + 12 `completed` (5/4/3 por barbero → rating determinista 4.9 y 300 puntos)
5. Verificar con SQL: `select * from get_user_stats(...)` → `12 | 300 | 4.9`.

**CA:** `Table Editor` muestra 3 / 3 / 4 / 1 / 13 filas; la función de estadísticas devuelve `12 | 300 | 4.9`; `select password_hash from users` muestra un hash bcrypt (nunca texto plano).

---

### Fase 3 — Backend REST (los 5 endpoints)

**Objetivo:** API funcional, validada y segura.

**Tareas**
1. Scaffold: `npm init -y`; instalar `express@5`, `typescript`, `tsx`, `@types/*`, `@supabase/supabase-js`, `zod`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`, `helmet`, `express-rate-limit`. Scripts: `dev`, `build`, `start`, `typecheck`, `db:seed`.
2. `src/config/env.ts`: validación Zod de `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (≥ 32 caracteres), `PORT`, `ALLOWED_ORIGINS`. Falla al arrancar si falta algo.
3. `src/lib/`: `supabase.ts` (singleton service_role), `jwt.ts` (sign/verify, expiración 7 días), `password.ts` (bcryptjs, cost 10), `httpError.ts`.
4. `src/middleware/`: `auth.ts` (Bearer JWT → `req.user`), `validate.ts` (Zod en body/query/params), `error.ts` (formato uniforme `{ error: { code, message, details } }`), `rateLimit.ts` (10 intentos / 15 min en `/auth/*`).
5. Módulos, en este orden y verificando cada uno antes de pasar al siguiente:
   1. `POST /api/v1/auth/register` — hash + inserción; `409 EMAIL_TAKEN`. No devolver `password_hash` nunca.
   2. `POST /api/v1/auth/login` — comparación bcrypt; `401 INVALID_CREDENTIALS` (mismo mensaje para email y contraseña incorrectos).
   3. `GET /api/v1/me` — usuario + `preferred_shop` + `stats` vía `rpc('get_user_stats')`.
   4. `PUT /api/v1/me` — actualización parcial; `404` si `preferred_shop_id` no existe.
   5. `GET /api/v1/catalog` — shops + barbers + services activos, con `shop_name` resuelto, filtros `?shop_id` / `?service_id`, sin caché.
   6. `GET /api/v1/appointments` — solo del usuario autenticado; `status=upcoming|history`, orden correcto, datos anidados (shop/barber/service).
   7. `POST /api/v1/appointments` — deriva `shop_id` y `price_cop` en el servidor; rechaza fechas pasadas; traduce el error `23505` del índice único a `409 SLOT_TAKEN`.
   8. `PATCH /api/v1/appointments/:id/cancel` — `409 ALREADY_CANCELLED`, `400 CANNOT_CANCEL_COMPLETED`, `404` si no es del usuario.
   9. `GET /api/v1/health` — verifica la conexión real a Supabase (infraestructura, no cuenta como endpoint de negocio).
6. `api.http` con una petición por operación (casos felices y de error) para pruebas reproducibles.
7. `README.md` del backend: arranque, variables de entorno, tabla de endpoints, despliegue.

**CA:** `npm run typecheck` sin errores; las 9 operaciones responden según el contrato del prompt §3.1; los casos de error devuelven el código esperado; en los logs no aparece nunca una contraseña ni un token.

---

### Fase 4 — Pruebas del backend contra la BD real

**Objetivo:** demostrar funcionalidad y persistencia antes de tocar la app.

**Tareas**
1. Ejecutar `api.http` de arriba a abajo y registrar las respuestas (evidencia).
2. Casos límite obligatorios: email duplicado, contraseña < 8, token ausente/expirado, reservar en el pasado, **doble reserva del mismo barbero y hora** (debe dar `409`), cancelar dos veces, cancelar cita de otro usuario (`404`), cuerpo vacío en `PUT /me`.
3. Comprobar en `Table Editor` que cada operación escribió/leyó realmente en Supabase.
4. Inyectar un cambio directo en la BD (cambiar el precio de "Cejas" a 9000) y confirmar que `GET /catalog` lo refleja al instante.

**CA:** todas las pruebas pasan; el cambio de precio hecho por SQL aparece sin reiniciar el backend.

---

### Fase 5 — Despliegue del backend

**Objetivo:** URL pública HTTPS, requisito para que el APK funcione fuera de la LAN.

**Tareas**
1. Desplegar en Render / Railway / Fly.io (build `npm run build`, start `npm start`, runtime Node 22).
2. Configurar las variables de entorno en el panel del proveedor (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ALLOWED_ORIGINS`).
3. Verificar `https://<host>/api/v1/health` → `{ status: "ok", db: "ok" }`.
4. Repetir un registro y un login contra la URL pública.
5. Documentar la URL final (se usará en `EXPO_PUBLIC_API_URL`).

**CA:** health `ok` desde Internet; registro/login funcionan contra la URL pública.

**Nota de seguridad:** la `service_role` key se configura **solo** en el panel del proveedor y en `backend\.env` local. Nunca en la app, nunca en Git.

---

### Fase 6 — Integración de la app con el backend

**Objetivo:** eliminar todo dato simulado y consumir la API real.

**Tareas**
1. `npx expo install expo-secure-store expo-constants` (no instalar el SDK de Supabase).
2. `.env` con `EXPO_PUBLIC_API_URL=http://<IP-LAN>:4000/api/v1` para desarrollo.
3. Crear `src/config/env.ts` (lee `process.env.EXPO_PUBLIC_API_URL` y falla con mensaje claro si falta).
4. Crear la capa de servicios: `apiClient.ts` (fetch + token + mapeo de errores tipado), `auth.service.ts`, `catalog.service.ts`, `profile.service.ts`, `appointments.service.ts`, y `src/types/api.ts` espejo de los JSON del backend.
5. Crear `src/context/AuthContext.tsx`: `session`, `user`, `signIn`, `signUp`, `signOut`, `restoreSession`, `updateUser`. Token en `expo-secure-store` (solo si "Recordarme" está marcado).
6. `App.tsx`: restaurar sesión al arrancar; pantalla de carga mientras se verifica; **screens condicionales** (sin token → `Login`/`Register`; con token → `Home`/`Appointments`/`Profile`).
7. `LoginScreen`: `POST /auth/login`; aplicar la decisión sobre "Recordarme" (conectar) y retirar "Continuar como invitado" y "¿Olvidaste tu contraseña?"; **eliminar el `console.log` de credenciales**.
8. `RegisterScreen`: `POST /auth/register`; chips de barbería desde `GET /catalog`; persistir teléfono.
9. `HomeScreen`: "Próxima Cita" desde `GET /appointments?status=upcoming` (+ estado vacío con CTA); barberos y servicios desde `GET /catalog`; borrar `FEATURED_SERVICES` y `BARBERS`.
10. `AppointmentScreen`: servicios/barberos desde `GET /catalog`; fechas = próximos 14 días; horas = franjas de 45 min (9:00–19:00); reservar con `POST /appointments` mostrando "Ese horario ya está ocupado" ante `409`; cancelar con `Alert` + `PATCH /:id/cancel`; borrar las 5 constantes hardcodeadas.
11. `useAppointments` / `useCatalog`: hooks con `loading | error | data` y refetch tras mutaciones.

**CA:** con la app en el emulador o Expo Go y el backend local en LAN, los flujos de registro, login, reserva y cancelación funcionan y **cada acción se refleja en el `Table Editor` de Supabase**; `grep -r "FEATURED_SERVICES\|BARBERS_LIST\|INITIAL_APPOINTMENTS\|SERVICES_LIST" src/` no devuelve resultados.

---

### Fase 7 — Cierre del alcance del Perfil y limpieza de controles de muestra

**Objetivo:** que ninguna parte de la UI sea decorativa.

**Tareas**
1. `ProfileScreen`: nombre, correo y avatar desde la sesión (borrar "Usuario" y "[tucorreo@ejemplo.com]"); stats desde `GET /me` (borrar 12 / 340 / 4.9).
2. Conectar "Barbería Habitual" y "Estilo Favorito" → abren `EditProfileScreen` mostrando valores reales.
3. Convertir "Recordatorios & Notificaciones" en un `Switch` persistido en `notifications_enabled`; renombrar el subtítulo a "Preferencias de recordatorios" (no hay push real).
4. "Sobre Tonsorium App": modal informativo con la versión real desde `expo-constants` (`appVersion`) en lugar del texto fijo "1.0.0 (MVP)".
5. **Retirar** "Términos y Privacidad" (no existe documento legal que los respalde).
6. Conectar "Cerrar sesión" (limpiar SecureStore + reset de navegación).
7. Crear `src/screens/EditProfileScreen.tsx` y registrar la ruta en `src/types/navigation.ts` (`EditProfile: undefined`) y en `App.tsx`; guardado con `PUT /me` + feedback de éxito/error.
8. Revisar que ningún `Pressable` quede sin `onPress` funcional.

**CA:** inventario final → **13 controles conectados, 3 retirados** (tabla completa en prompt §6.5); editar el perfil en la app cambia la fila correspondiente en `users`; ningún `Pressable` inerte permanece.

---

### Fase 8 — QA integral en desarrollo

**Objetivo:** validar la app completa contra la BD real antes de compilar.

**Tareas**
1. Recorrido E2E: registro nuevo → ver fila en `users` → cerrar la app → reabrir (sesión restaurada) → reservar → ver cita en `appointments` → cancelar → `status = cancelled`.
2. Modificabilidad (evidencia clave): cambiar un precio desde Supabase → reabrir la pantalla de reserva → ver el precio nuevo sin recompilar.
3. Puntos: `update appointments set status='completed' where id='...'` → +25 puntos y +1 corte en el Perfil.
4. Estados degradados: backend apagado → mensajes de error legibles, sin pantallas en blanco ni cierres; token expirado → vuelve al Login sin colgarse.
5. Regresión visual: la paleta y la disposición deben permanecer iguales (solo cambian datos y navegación).
6. `npx tsc --noEmit` en la app sin errores.

**CA:** los 6 puntos se cumplen; se registran capturas como evidencia para la sustentación.

---

### Fase 9 — Generación del APK instalable

**Objetivo:** entregable final funcionando en un teléfono físico.

**Tareas**
1. `npm install -g eas-cli`; `eas login`; `eas init` (escribe `extra.eas.projectId`).
2. `app.json`: agregar `android.package: "com.tonsorium.barber"`, `android.versionCode: 1`, splash con el plugin `expo-splash-screen` sobre `assets/splash-icon.png`. Consultar <https://docs.expo.dev/versions/v57.0.0/> para la configuración vigente del plugin.
3. Crear `eas.json` con el perfil `preview` (`android.buildType: "apk"`) y `env.EXPO_PUBLIC_API_URL` apuntando al backend desplegado (prompt §8).
4. `eas build -p android --profile preview` → descargar el `.apk`.
5. Instalar en el teléfono físico (habilitar "orígenes desconocidos") y repetir los 4 flujos críticos: registro → login → reserva → cancelación, con verificación simultánea en el `Table Editor`.
6. Alternativa sin cuenta EAS (documentada, no obligatoria): `npx expo prebuild -p android` + `.\gradlew assembleRelease` (requiere JDK 17 y Android SDK 36; firmar con keystore de debug salvo que se configure uno propio).
7. **Advertencia:** si se prueba contra un backend local por HTTP, Android bloquea el tráfico en claro; requiere `expo-build-properties` con `usesCleartextTraffic: true` y **recompilar**. La vía recomendada es usar el backend HTTPS desplegado en la Fase 5.

**CA:** el APK se instala y ejecuta sin Expo Go; las 4 operaciones críticas persisten en Supabase; con el backend caído la app muestra error y no se cierra.

---

### Fase 10 — Cierre y entrega académica

**Tareas**
1. `backend\README.md`: requisitos, variables de entorno, comandos, tabla de endpoints, pasos de despliegue y URL pública.
2. `.env.example` en el backend (sin valores reales) y verificación final de que ningún `.env` esté versionado.
3. Evidencias para la sustentación:
   - Esquema en `Table Editor` (5 tablas) y resultado de `get_user_stats`.
   - Respuestas de `api.http` (casos felices y de error, incluido el `409` de doble reserva).
   - Capturas de la app antes/después de modificar un precio directamente en Supabase (demuestra persistencia y modificabilidad).
   - APK instalado y funcionando en un dispositivo físico.
   - Informe de las 4 inconsistencias detectadas y su resolución mediante normalización.
4. Verificación de cierre: los 15 criterios de aceptación del prompt §9.

**CA:** repositorio reproducible desde cero siguiendo el README; todas las evidencias reunidas.

---

## 5. Tabla resumen de fases

| Fase | Entregable | CA en una línea |
|---|---|---|
| 0 | Rama + carpetas + entorno verificado | `node -v` ≥ 20 y `backend\` creado |
| 1 | Proyecto Supabase | Proyecto *Healthy* + credenciales guardadas |
| 2 | Esquema + trigger + seed | `12 / 300 / 4.9` en la BD |
| 3 | Backend con 9 operaciones | Contratos cumplidos, `typecheck` limpio |
| 4 | Pruebas contra la BD real | Todos los casos, incluido `409 SLOT_TAKEN` |
| 5 | Backend desplegado | `health` `ok` desde Internet |
| 6 | App integrada | Cada acción visible en `Table Editor` |
| 7 | Perfil completo + UI limpia | 13 conectados / 3 retirados, 0 botones inertes |
| 8 | QA E2E | 6 escenarios validados con capturas |
| 9 | **APK instalable** | Instalado y funcional en teléfono real |
| 10 | Entrega | README + evidencias completas |

---

## 6. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El teléfono no alcanza `localhost` del backend | El APK no cargaría datos | Backend desplegado en HTTPS (Fase 5); para pruebas locales, IP de LAN + `usesCleartextTraffic` |
| `EXPO_PUBLIC_API_URL` se incrusta en el build | Cambiar de backend exige recompilar | Documentar la URL y fijarla en `eas.json` antes de cada build |
| Proyecto Supabase gratuito pausado por inactividad | Fallos intermitentes en la demo | Despertarlo antes de la sustentación y antes de cada prueba |
| Fuga de `service_role` key | Compromiso total de los datos | Solo en `backend\.env` y en el panel del proveedor; `.gitignore` verificado en Fase 0 |
| Conflicto de horarios no detectado | Doble reserva | Índice único parcial en la BD + traducción a `409` en el backend |
| `bcrypt` nativo falla en Windows | Bloqueo de la instalación | Usar `bcryptjs` (JS puro) |
| Cola de EAS Build gratuita | Espera larga antes del APK | Lanzar el build apenas termine la Fase 8; alternativa Gradle documentada |
| Cambios de API de Expo 57 | Código desactualizado | Consultar <https://docs.expo.dev/versions/v57.0.0/> antes de implementar (mandato de `AGENTS.md`) |
| Datos mock migrados con cifras inventadas | Sustentación inconsistente | Solo se siembran datos trazables a los mocks actuales; 340 puntos → 300 reales (12 × 25) |

---

## 7. Riesgos de integridad que se corrigen en este plan

| Hallazgo | Corrección |
|---|---|
| `Corte Premium` vs `Corte Clásico` (mismo precio, dos nombres) | Un solo registro en `services` |
| `Combo Especial` vs `Combo (Corte + Barba)` | Un solo registro en `services` |
| Cita mock cobra $20000 por un combo de $38000 | Precio derivado del catálogo en el servidor |
| `Barber Chamos` con y sin dirección | Una sola fila en `shops` con dirección |
| Contraseña impresa en consola (`LoginScreen.tsx:46`) | Eliminada |
| Stats inventadas (340) | Calculadas por trigger y función SQL |
| 4 botones sin acción en Perfil | 3 conectados, 1 retirado |
| "Continuar como invitado" con persistencia requerida | Retirado |

---

## 8. Lo que queda explícitamente fuera y por qué

| Excluido | Razón |
|---|---|
| Google Play Store | El objetivo es un APK instalable; publicar es irrelevante para la evaluación |
| iOS | No hay entorno macOS/Xcode disponible |
| Push notifications | Requiere servicio externo (FCM/Expo Push) y permisos; el perfil solo guarda la preferencia |
| Recuperación de contraseña | Requiere proveedor de correo; el enlace inerte se retira |
| Marcar una cita como "Completada" desde la app | Requeriría un 6.º endpoint o un rol admin; el estado se gestiona por SQL y la app lo muestra en el historial |
| Panel de administración | Fuera del alcance del 5 endpoints acordado |
