import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { hash } from 'argon2';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module';
import { centers, users } from './db/schema';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = {
  admin: 'admin.prueba@bienestarpro.local',
  aprendiz: 'aprendiz.prueba@bienestarpro.local',
  superadmin: 'super.prueba@bienestarpro.local',
  target: 'objetivo.prueba@bienestarpro.local',
};

describe('Administración (usuarios, centros y auditoría)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let adminToken: string;
  let aprendizToken: string;
  let superadminToken: string;

  async function login(identifier: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    return res.json().accessToken as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const existing = await db.select().from(centers).limit(1);
    centerId =
      existing[0]?.id ??
      (
        await db
          .insert(centers)
          .values({ name: 'Centro admin prueba' })
          .returning()
      )[0].id;

    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '880000001',
        email: EMAILS.admin,
        name: 'Admin Prueba',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '880000002',
        email: EMAILS.aprendiz,
        name: 'Aprendiz Prueba',
        passwordHash,
        role: 'aprendiz',
      },
      {
        centerId,
        document: '880000003',
        email: EMAILS.superadmin,
        name: 'Super Prueba',
        passwordHash,
        role: 'superadmin',
      },
    ]);

    adminToken = await login(EMAILS.admin);
    aprendizToken = await login(EMAILS.aprendiz);
    superadminToken = await login(EMAILS.superadmin);
  });

  afterAll(async () => {
    await db
      .delete(users)
      .where(
        inArray(users.email, [
          EMAILS.admin,
          EMAILS.aprendiz,
          EMAILS.superadmin,
          EMAILS.target,
        ]),
      );
    await db.delete(centers).where(eq(centers.name, 'Centro Nuevo Prueba'));
    await app.close();
    await sql.end();
  });

  it('un aprendiz no puede administrar usuarios ni ver la auditoría (403)', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${aprendizToken}` },
    });
    expect(list.statusCode).toBe(403);

    const create = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${aprendizToken}` },
      payload: {
        document: '990000009',
        email: EMAILS.target,
        name: 'Objetivo',
        password: PASSWORD,
        role: 'aprendiz',
      },
    });
    expect(create.statusCode).toBe(403);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit',
      headers: { authorization: `Bearer ${aprendizToken}` },
    });
    expect(audit.statusCode).toBe(403);
  });

  it('coordinación crea usuarios, evita duplicados y no escala a superadmin', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        document: '990000010',
        email: EMAILS.target,
        name: 'Usuario Objetivo',
        password: PASSWORD,
        role: 'aprendiz',
      },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json();
    expect(created.email).toBe(EMAILS.target);
    expect(created.passwordHash).toBeUndefined();
    expect(created.centerId).toBe(centerId);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        document: '990000010',
        email: 'otro@bienestarpro.local',
        name: 'Duplicado',
        password: PASSWORD,
        role: 'aprendiz',
      },
    });
    expect(duplicate.statusCode).toBe(409);

    const escalate = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        document: '990000011',
        email: 'super.intento@bienestarpro.local',
        name: 'Intento Super',
        password: PASSWORD,
        role: 'superadmin',
      },
    });
    expect(escalate.statusCode).toBe(403);
  });

  it('coordinación actualiza roles, no puede modificarse a sí mismo y queda auditado', async () => {
    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.email, EMAILS.target))
      .limit(1);
    expect(target).toBeTruthy();

    const update = await app.inject({
      method: 'PATCH',
      url: `/api/users/${target.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { role: 'auxiliar' },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json().role).toBe('auxiliar');

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, EMAILS.admin))
      .limit(1);
    const self = await app.inject({
      method: 'PATCH',
      url: `/api/users/${admin.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'inactivo' },
    });
    expect(self.statusCode).toBe(400);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=user.updated',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(audit.statusCode).toBe(200);
    const body = audit.json() as {
      items: { entityId: string }[];
      total: number;
    };
    expect(body.items.some((item) => item.entityId === target.id)).toBe(true);
  });

  it('la auditoría registra accesos y solo el superadmin administra centros', async () => {
    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=login.success',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(audit.statusCode).toBe(200);
    expect((audit.json() as { total: number }).total).toBeGreaterThan(0);

    const forbidden = await app.inject({
      method: 'POST',
      url: '/api/centers',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Centro No Permitido' },
    });
    expect(forbidden.statusCode).toBe(403);

    const created = await app.inject({
      method: 'POST',
      url: '/api/centers',
      headers: { authorization: `Bearer ${superadminToken}` },
      payload: { name: 'Centro Nuevo Prueba', region: 'Quindío' },
    });
    expect(created.statusCode).toBe(201);

    const centersList = await app.inject({
      method: 'GET',
      url: '/api/centers',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(centersList.statusCode).toBe(200);
    const list = centersList.json() as { id: string }[];
    expect(list.some((c) => c.id === centerId)).toBe(true);
  });
});
