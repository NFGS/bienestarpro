import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { hash } from 'argon2';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { generateOtpCode } from '../auth/otp';
import { centers, users } from '../db/schema';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = {
  coordinacion: 'm6.coordinacion@bienestarpro.local',
  aprendiz: 'm6.aprendiz@bienestarpro.local',
};

describe('Noticias y campañas M6 (RF-30 a RF-32)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let aprendizToken: string;
  let groupId: string;
  let publicationId: string;

  async function withContext<T>(
    fn: (tx: postgres.TransactionSql<Record<string, unknown>>) => Promise<T>,
  ): Promise<T> {
    return sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerId}, true)`;
      return fn(tx);
    }) as Promise<T>;
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

    centerId = (
      await db
        .insert(centers)
        .values({ name: 'Centro M6 Prueba' })
        .returning()
    )[0].id;
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '220000001',
        email: EMAILS.coordinacion,
        name: 'Coordinación M6',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '220000002',
        email: EMAILS.aprendiz,
        name: 'Aprendiz M6',
        passwordHash,
        role: 'aprendiz',
      },
    ]);

    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    const body = first.json() as {
      accessToken: string;
      totpEnrollmentRequired: boolean;
    };
    let coord = body.accessToken;
    if (body.totpEnrollmentRequired) {
      const enroll = await app.inject({
        method: 'POST',
        url: '/api/auth/totp/enroll',
        headers: { authorization: `Bearer ${coord}` },
      });
      const secret = (enroll.json() as { secret: string }).secret;
      await app.inject({
        method: 'POST',
        url: '/api/auth/totp/activate',
        headers: { authorization: `Bearer ${coord}` },
        payload: { code: generateOtpCode(secret) },
      });
      const second = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          identifier: EMAILS.coordinacion,
          password: PASSWORD,
          totpCode: generateOtpCode(secret),
        },
      });
      coord = second.json().accessToken as string;
    }
    coordToken = coord;

    const aprendizLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.aprendiz, password: PASSWORD },
    });
    aprendizToken = aprendizLogin.json().accessToken as string;

    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { name: 'Programa M6' },
    });
    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        programId: program.json().id,
        code: 'M6-2847',
        journey: 'noche',
      },
    });
    groupId = group.json().id as string;
    for (const index of [1, 2]) {
      await app.inject({
        method: 'POST',
        url: '/api/learners',
        headers: { authorization: `Bearer ${coordToken}` },
        payload: {
          groupId,
          document: `45000000${index}`,
          fullName: `Aprendiz M6 ${index}`,
          email: `aprendiz.m6.${index}@bienestarpro.local`,
        },
      });
    }
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from notifications where center_id = ${centerId}`;
      await tx`delete from outbox where center_id = ${centerId}`;
      await tx`delete from publication_metrics where center_id = ${centerId}`;
      await tx`delete from publication_segments where center_id = ${centerId}`;
      await tx`delete from publications where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(inArray(centers.id, [centerId]));
    await app.close();
    await sql.end();
  });

  it('crea, publica y difunde la noticia al segmento (ficha) por el hub', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/publications',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        type: 'noticia',
        title: 'Nueva jornada de salud',
        content: 'La jornada de salud será el viernes en el auditorio.',
        segments: [{ segmentType: 'ficha', segmentValue: groupId }],
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().status).toBe('borrador');
    publicationId = created.json().id as string;

    const published = await app.inject({
      method: 'POST',
      url: `/api/publications/${publicationId}/publish`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(published.statusCode).toBe(200);
    expect(published.json().status).toBe('publicada');
    expect(published.json().recipients).toBe(2);
    expect(published.json().notificationsQueued).toBe(2);

    const republish = await app.inject({
      method: 'POST',
      url: `/api/publications/${publicationId}/publish`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(republish.statusCode).toBe(409);

    const editPublished = await app.inject({
      method: 'PATCH',
      url: `/api/publications/${publicationId}`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { title: 'Cambio tardío' },
    });
    expect(editPublished.statusCode).toBe(409);
  });

  it('valida segmentos (jornada y ficha)', async () => {
    const badJourney = await app.inject({
      method: 'POST',
      url: '/api/publications',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        type: 'noticia',
        title: 'Título válido',
        content: 'Contenido suficientemente largo.',
        segments: [{ segmentType: 'jornada', segmentValue: 'madrugada' }],
      },
    });
    expect(badJourney.statusCode).toBe(400);

    const badGroup = await app.inject({
      method: 'POST',
      url: '/api/publications',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        type: 'noticia',
        title: 'Título válido',
        content: 'Contenido suficientemente largo.',
        segments: [
          {
            segmentType: 'ficha',
            segmentValue: '00000000-0000-4000-8000-000000000000',
          },
        ],
      },
    });
    expect(badGroup.statusCode).toBe(400);
  });

  it('analítica agregada por día (vistas, lecturas y clics sin identidad)', async () => {
    for (const event of ['view', 'view', 'read'] as const) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/publications/${publicationId}/metrics`,
        headers: { authorization: `Bearer ${coordToken}` },
        payload: { event },
      });
      expect(res.statusCode).toBe(200);
    }

    const metrics = await app.inject({
      method: 'GET',
      url: `/api/publications/${publicationId}/metrics`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(metrics.statusCode).toBe(200);
    const rows = metrics.json() as {
      views: number;
      reads: number;
      clicks: number;
      day: string;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].views).toBe(2);
    expect(rows[0].reads).toBe(1);
    expect(rows[0].clicks).toBe(0);

    const list = await app.inject({
      method: 'GET',
      url: '/api/publications',
      headers: { authorization: `Bearer ${coordToken}` },
    });
    const items = list.json() as { totals: { views: number } }[];
    expect(items[0].totals.views).toBe(2);
  });

  it('cualquier rol autenticado lee, solo coordinación gestiona', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/publications',
      headers: { authorization: `Bearer ${aprendizToken}` },
    });
    expect(list.statusCode).toBe(200);

    const forbidden = await app.inject({
      method: 'POST',
      url: '/api/publications',
      headers: { authorization: `Bearer ${aprendizToken}` },
      payload: {
        type: 'noticia',
        title: 'No permitida',
        content: 'Contenido suficientemente largo.',
      },
    });
    expect(forbidden.statusCode).toBe(403);

    const withoutContext = await sql`select count(*)::int as n from publications`;
    expect(withoutContext[0].n).toBe(0);
  });
});
