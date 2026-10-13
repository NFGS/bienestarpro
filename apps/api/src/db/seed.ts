/**
 * Seed de desarrollo: centro + usuario de coordinación sintético.
 * Uso: pnpm --filter @bienestarpro/api db:seed
 * Credenciales de ejemplo (solo desarrollo, datos sintéticos):
 *   documento: 1000000001 | correo: coordinacion.demo@bienestarpro.local
 *   contraseña: Demo1234*
 */
import { hash } from 'argon2';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { centers, users } from './schema';

try {
  process.loadEnvFile();
} catch {
  // variables del entorno
}

const DEMO_EMAIL = 'coordinacion.demo@bienestarpro.local';
const DEMO_DOCUMENT = '1000000001';
const DEMO_PASSWORD = 'Demo1234*';

async function main(): Promise<void> {
  const url = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no está definida');
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  const existingCenters = await db.select().from(centers).limit(1);
  let centerId = existingCenters[0]?.id;
  if (!centerId) {
    const [center] = await db
      .insert(centers)
      .values({ name: 'Centro de Comercio y Turismo', region: 'Quindío' })
      .returning();
    centerId = center.id;
    console.log('Centro creado:', center.name);
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      centerId,
      document: DEMO_DOCUMENT,
      email: DEMO_EMAIL,
      name: 'Coordinación Demo',
      passwordHash: await hash(DEMO_PASSWORD),
      role: 'coordinacion',
    });
    console.log('Usuario demo creado:', DEMO_EMAIL);
  } else {
    console.log('Usuario demo ya existe:', DEMO_EMAIL);
  }

  await client.end();
}

void main();
