import {
  Global,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Conexión única a PostgreSQL (drizzle + postgres.js).
 * Cierra el pool al apagar la aplicación (evita procesos colgados en pruebas).
 */
@Injectable()
export class DbService implements OnApplicationShutdown {
  readonly db: Database;
  private readonly client: Sql;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL no está definida (revisa apps/api/.env)');
    }
    this.client = postgres(url, { max: 10 });
    this.db = drizzle(this.client, { schema });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.end();
  }
}

@Global()
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
