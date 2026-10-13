import { defineConfig } from 'drizzle-kit';

// Migraciones con el rol propietario (puede crear/alterar objetos y roles);
// la API en ejecución usa DATABASE_URL con el rol de aplicación (RLS activo).
const url =
  process.env.MIGRATIONS_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgres://bienestarpro:bienestarpro_dev@127.0.0.1:5434/bienestarpro';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
