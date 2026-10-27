import { hashPassword } from '../lib/password';
import { supabase } from '../lib/supabase';

/**
 * Seed idempotente: migra a Supabase los datos que hoy estan hardcodeados en la
 * app Expo. Se puede ejecutar varias veces sin duplicar informacion.
 *
 *   npm run db:seed
 */

const DEMO_EMAIL = 'carlos@tonsorium.test';
const DEMO_PASSWORD = 'Tonsorium2026*';

interface NamedId {
  id: string;
  name: string;
}

interface BarberIdRow {
  id: string;
  name: string;
  shop_id: string;
}

interface ServiceIdRow {
  id: string;
  name: string;
  price_cop: number;
}

// --- Datos de catalogo (trazables a los mocks actuales) ----------------------

const SHOPS = [
  { name: 'Barber Chamos', address: 'Av. Principal 123' },
  { name: 'Barberia Prado Centro', address: null },
  { name: 'SurBarber', address: null },
];

const BARBERS = [
  { name: 'El Chamo', shop: 'Barber Chamos', experience_years: 8, rating: 4.9 },
  { name: 'Javier Silva', shop: 'Barberia Prado Centro', experience_years: 5, rating: 4.8 },
  { name: 'Diego Torres', shop: 'SurBarber', experience_years: 10, rating: 5.0 },
];

const SERVICES = [
  {
    name: 'Corte Clásico',
    description: 'Corte tradicional a tijera o máquina con acabado fino.',
    price_cop: 25000,
    duration_minutes: 30,
  },
  {
    name: 'Barba Tradicional',
    description: 'Afeitado o perfilado con toalla caliente y bálsamo.',
    price_cop: 18000,
    duration_minutes: 25,
  },
  {
    name: 'Combo (Corte + Barba)',
    description: 'Corte de cabello + arreglo completo de barba + lavado.',
    price_cop: 38000,
    duration_minutes: 50,
  },
  {
    name: 'Cejas',
    description: 'Corte de cejas con tijeras y cera.',
    price_cop: 7000,
    duration_minutes: 5,
  },
];

/**
 * Historial: 12 citas completadas (5 El Chamo / 4 Javier Silva / 3 Diego Torres)
 * con horarios distintos por barbero para no violar el indice unico parcial.
 */
const HISTORY_PLAN = [
  { barber: 'El Chamo', service: 'Combo (Corte + Barba)', daysAgo: 5, hour: 10, minute: 0 },
  { barber: 'El Chamo', service: 'Corte Clásico', daysAgo: 9, hour: 11, minute: 0 },
  { barber: 'El Chamo', service: 'Barba Tradicional', daysAgo: 14, hour: 12, minute: 0 },
  { barber: 'El Chamo', service: 'Cejas', daysAgo: 21, hour: 15, minute: 0 },
  { barber: 'El Chamo', service: 'Corte Clásico', daysAgo: 30, hour: 16, minute: 0 },
  { barber: 'Javier Silva', service: 'Corte Clásico', daysAgo: 6, hour: 10, minute: 30 },
  { barber: 'Javier Silva', service: 'Combo (Corte + Barba)', daysAgo: 11, hour: 11, minute: 30 },
  { barber: 'Javier Silva', service: 'Barba Tradicional', daysAgo: 17, hour: 13, minute: 0 },
  { barber: 'Javier Silva', service: 'Corte Clásico', daysAgo: 26, hour: 17, minute: 0 },
  { barber: 'Diego Torres', service: 'Barba Tradicional', daysAgo: 7, hour: 9, minute: 30 },
  { barber: 'Diego Torres', service: 'Corte Clásico', daysAgo: 13, hour: 14, minute: 30 },
  { barber: 'Diego Torres', service: 'Combo (Corte + Barba)', daysAgo: 22, hour: 18, minute: 0 },
];

/** Cita futura confirmada (la "Próxima Cita" de HomeScreen). */
const UPCOMING_PLAN = { barber: 'El Chamo', service: 'Combo (Corte + Barba)', inDays: 3, hour: 16, minute: 30 };

// --- Utilidades -------------------------------------------------------------

function dateAt(offsetDays: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function requireId(map: Map<string, string>, name: string): string {
  const id = map.get(name);
  if (!id) {
    throw new Error(`No se encontro "${name}" tras el upsert.`);
  }
  return id;
}

function requireEntry<T>(map: Map<string, T>, name: string): T {
  const entry = map.get(name);
  if (!entry) {
    throw new Error(`No se encontro "${name}" tras el upsert.`);
  }
  return entry;
}

// --- Seed -------------------------------------------------------------------

async function seed(): Promise<void> {
  // 1. Catalogo
  const { data: shopsData, error: shopsError } = await supabase
    .from('shops')
    .upsert(SHOPS, { onConflict: 'name' })
    .select('id, name');

  if (shopsError) throw shopsError;
  const shopIdByName = new Map((shopsData as NamedId[]).map((shop) => [shop.name, shop.id]));

  const barberRows = BARBERS.map((barber) => ({
    name: barber.name,
    shop_id: requireId(shopIdByName, barber.shop),
    experience_years: barber.experience_years,
    rating: barber.rating,
    active: true,
  }));

  const { data: barbersData, error: barbersError } = await supabase
    .from('barbers')
    .upsert(barberRows, { onConflict: 'shop_id,name' })
    .select('id, name, shop_id');

  if (barbersError) throw barbersError;
  const barberByName = new Map((barbersData as BarberIdRow[]).map((barber) => [barber.name, barber]));

  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .upsert(SERVICES, { onConflict: 'name' })
    .select('id, name, price_cop');

  if (servicesError) throw servicesError;
  const serviceByName = new Map((servicesData as ServiceIdRow[]).map((service) => [service.name, service]));

  // 2. Usuario demo (se reinician sus puntos para que el trigger recalcule).
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert(
      {
        email: DEMO_EMAIL,
        password_hash: passwordHash,
        full_name: 'Carlos Mendoza',
        phone: '+57 320 6107465',
        preferred_shop_id: requireId(shopIdByName, 'Barber Chamos'),
        points: 0,
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single();

  if (userError) throw userError;
  const userId = (userData as { id: string }).id;

  // 3. Citas: se borran las previas del usuario demo y se reinscriben.
  const { error: deleteError } = await supabase.from('appointments').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;

  const appointmentRows = HISTORY_PLAN.map((item) => {
    const barber = requireEntry(barberByName, item.barber);
    const service = requireEntry(serviceByName, item.service);
    return {
      user_id: userId,
      shop_id: barber.shop_id,
      barber_id: barber.id,
      service_id: service.id,
      scheduled_at: dateAt(-item.daysAgo, item.hour, item.minute),
      status: 'completed',
      price_cop: service.price_cop,
    };
  });

  const upcomingBarber = requireEntry(barberByName, UPCOMING_PLAN.barber);
  const upcomingService = requireEntry(serviceByName, UPCOMING_PLAN.service);
  appointmentRows.push({
    user_id: userId,
    shop_id: upcomingBarber.shop_id,
    barber_id: upcomingBarber.id,
    service_id: upcomingService.id,
    scheduled_at: dateAt(UPCOMING_PLAN.inDays, UPCOMING_PLAN.hour, UPCOMING_PLAN.minute),
    status: 'confirmed',
    price_cop: upcomingService.price_cop,
  });

  const { error: insertError } = await supabase.from('appointments').insert(appointmentRows);
  if (insertError) throw insertError;

  // 4. Resumen
  const { data: stats, error: statsError } = await supabase.rpc('get_user_stats', { p_user_id: userId });
  if (statsError) throw statsError;

  const summary = Array.isArray(stats) ? stats[0] : stats;

  console.log('Seed completado.');
  console.log(`  Shops: ${shopIdByName.size} | Barbers: ${barberByName.size} | Services: ${serviceByName.size}`);
  console.log(`  Usuario demo: ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`);
  console.log(`  Citas: ${appointmentRows.length} (12 completed + 1 confirmed)`);
  console.log(
    `  get_user_stats -> cuts_done: ${summary?.cuts_done ?? '?'} | points: ${summary?.points ?? '?'} | rating: ${summary?.rating ?? '?'}`,
  );
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error durante el seed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
