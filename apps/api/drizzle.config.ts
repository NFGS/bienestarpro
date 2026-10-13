import { defineConfig } from 'drizzle-kit';

const url =
  process.env.DATABASE_URL ??
  'postgres://bienestarpro:bienestarpro_dev@127.0.0.1:5434/bienestarpro';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
