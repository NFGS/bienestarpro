import {
  Global,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
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

  /**
   * Ejecuta una operación en una transacción con el contexto de centro activo
   * (`app.centro_id`), requisito de las políticas RLS de las tablas
   * multi-tenant (ADR-0003 / ADR-0016 D2). Sin contexto, las políticas no
   * dejan ver ni escribir filas.
   */
  async withTenant<T>(
    centerId: string,
    fn: (db: Database) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.centro_id', ${centerId}, true)`,
      );
      return fn(tx as unknown as Database);
    });
  }
}

@Global()
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
