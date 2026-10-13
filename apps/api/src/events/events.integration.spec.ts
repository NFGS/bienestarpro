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
  coordinacion: 'm1.coordinacion@bienestarpro.local',
  auxiliar: 'm1.auxiliar@bienestarpro.local',
  aprendiz: 'm1.aprendiz@bienestarpro.local',
};

describe('Refrigerios M1 (RF-12 a RF-21)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let auxToken: string;
  let groupId: string;
  let eventId: string;
  let eventGroupId: string;
  let learnerIds: string[] = [];
  let tokensByLearner: Record<string, string> = {};

  async function loginWithTotp(identifier: string): Promise<string> {
    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier, password: PASSWORD },
    });
    expect(first.statusCode).toBe(200);
    const body = first.json() as {
      accessToken: string;
      totpEnrollmentRequired: boolean;
    };
    if (!body.totpEnrollmentRequired) {
      return body.accessToken;
    }
    const enroll = await app.inject({
      method: 'POST',
      url: '/api/auth/totp/enroll',
      headers: { authorization: `Bearer ${body.accessToken}` },
    });
    const secret = (enroll.json() as { secret: string }).secret;
    await app.inject({
      method: 'POST',
      url: '/api/auth/totp/activate',
      headers: { authorization: `Bearer ${body.accessToken}` },
      payload: { code: generateOtpCode(secret) },
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        identifier,
        password: PASSWORD,
        totpCode: generateOtpCode(secret),
      },
    });
    expect(second.statusCode).toBe(200);
    return second.json().accessToken as string;
  }

  async function login(identifier: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    return res.json().accessToken as string;
  }

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
        .values({ name: 'Centro M1 Prueba' })
        .returning()
    )[0].id;

    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '550000001',
        email: EMAILS.coordinacion,
        name: 'Coordinación M1',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '550000002',
        email: EMAILS.auxiliar,
        name: 'Auxiliar M1',
        passwordHash,
        role: 'auxiliar',
      },
      {
        centerId,
        document: '550000003',
        email: EMAILS.aprendiz,
        name: 'Aprendiz M1',
        passwordHash,
        role: 'aprendiz',
      },
    ]);

    coordToken = await loginWithTotp(EMAILS.coordinacion);
    auxToken = await login(EMAILS.auxiliar);

    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { name: 'Programa M1' },
    });
    const programId = program.json().id as string;
    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { programId, code: 'M1-2847', journey: 'manana' },
    });
    groupId = group.json().id as string;
    for (const [index, document] of ['410000001', '410000002', '410000003'].entries()) {
      const learner = await app.inject({
        method: 'POST',
        url: '/api/learners',
        headers: { authorization: `Bearer ${coordToken}` },
        payload: {
          groupId,
          document,
          fullName: `Aprendiz M1 ${index + 1}`,
        },
      });
      learnerIds.push(learner.json().id as string);
    }
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from deliveries where center_id = ${centerId}`;
      await tx`delete from event_participants where center_id = ${centerId}`;
      await tx`delete from event_groups where center_id = ${centerId}`;
      await tx`delete from events where center_id = ${centerId}`;
      await tx`delete from consents where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(inArray(centers.name, ['Centro M1 Prueba']));
    await app.close();
    await sql.end();
  });

  it('crea y publica el evento: cupos calculados y convocados generados', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { date: '2026-10-20', journey: 'manana' },
    });
    expect(created.statusCode).toBe(201);
    eventId = created.json().id as string;
    expect(created.json().status).toBe('borrador');

    const published = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/publish`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(published.statusCode).toBe(200);
    expect(published.json().participants).toBe(3);

    const republish = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/publish`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(republish.statusCode).toBe(409);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/events/${eventId}`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(detail.statusCode).toBe(200);
    const body = detail.json();
    expect(body.status).toBe('activo');
    expect(body.groups).toHaveLength(1);
    expect(body.groups[0].calculatedQuota).toBe(3);
    expect(body.participantsByStatus.convocado).toBe(3);
    expect(body.rulesSnapshot.rule).toBe('una-racion-por-aprendiz-activo');
    eventGroupId = body.groups[0].id as string;

    const rows = await withContext(
      (tx) =>
        tx`select learner_id, qr_token from event_participants where event_id = ${eventId}`,
    );
    tokensByLearner = Object.fromEntries(
      (rows as unknown as { learner_id: string; qr_token: string }[]).map(
        (row) => [row.learner_id, row.qr_token],
      ),
    );
    expect(Object.keys(tokensByLearner)).toHaveLength(3);

    const search = await app.inject({
      method: 'GET',
      url: `/api/events/${eventId}/participants/search?document=410000001`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(search.statusCode).toBe(200);
    expect(search.json().fullName).toBe('Aprendiz M1 1');
    expect(search.json().confirmed).toBe(false);
  });

  it('confirmación pública por token: acepta, rechaza token inválido y respeta el plazo', async () => {
    const accepted = await app.inject({
      method: 'POST',
      url: '/api/public/confirmations',
      payload: { token: tokensByLearner[learnerIds[0]], attending: true },
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json().outcome).toBe('confirmed');

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/public/confirmations',
      payload: {
        token: '00000000-0000-4000-8000-000000000000',
        attending: true,
      },
    });
    expect(invalid.statusCode).toBe(404);

    await withContext(
      (tx) =>
        tx`update events set confirmation_deadline = now() - interval '1 hour' where id = ${eventId}`,
    );
    const late = await app.inject({
      method: 'POST',
      url: '/api/public/confirmations',
      payload: { token: tokensByLearner[learnerIds[2]], attending: true },
    });
    expect(late.statusCode).toBe(409);
    expect(late.json().code).toBe('deadline_passed');
    await withContext(
      (tx) =>
        tx`update events set confirmation_deadline = now() + interval '1 day' where id = ${eventId}`,
    );
  });

  it('entregas: QR confirmada, idempotencia offline, duplicados y excepción con motivo', async () => {
    const qrDelivery = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'qr',
        qrToken: tokensByLearner[learnerIds[0]],
        clientUuid: '11111111-1111-4111-8111-111111111111',
      },
    });
    expect(qrDelivery.statusCode).toBe(201);
    expect(qrDelivery.json().idempotent).toBe(false);

    const retry = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'qr',
        qrToken: tokensByLearner[learnerIds[0]],
        clientUuid: '11111111-1111-4111-8111-111111111111',
      },
    });
    expect(retry.statusCode).toBe(201);
    expect(retry.json().idempotent).toBe(true);

    const duplicate = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'qr',
        qrToken: tokensByLearner[learnerIds[0]],
        clientUuid: '22222222-2222-4222-8222-222222222222',
      },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().code).toBe('already_delivered');

    const notConfirmed = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'qr',
        qrToken: tokensByLearner[learnerIds[1]],
        clientUuid: '33333333-3333-4333-8333-333333333333',
      },
    });
    expect(notConfirmed.statusCode).toBe(409);
    expect(notConfirmed.json().code).toBe('not_confirmed');

    const override = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'qr',
        qrToken: tokensByLearner[learnerIds[1]],
        clientUuid: '44444444-4444-4444-8444-444444444444',
        override: true,
        reason: 'Autorizado por coordinación (caso especial)',
      },
    });
    expect(override.statusCode).toBe(201);

    const manual = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'manual',
        learnerId: learnerIds[2],
        clientUuid: '55555555-5555-4555-8555-555555555555',
        reason: 'Sin código disponible; verificado por documento',
        override: true,
      },
    });
    expect(manual.statusCode).toBe(201);
    expect(manual.json().delivery.method).toBe('manual');
  });

  it('ajuste de cupos, consolidado de cafetería y cierre con desperdicio', async () => {
    const adjust = await app.inject({
      method: 'PATCH',
      url: `/api/events/${eventId}/groups/${eventGroupId}/quota`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { quota: 5, reason: 'Llegaron aprendices de otra ficha' },
    });
    expect(adjust.statusCode).toBe(200);
    expect(adjust.json().adjustedQuota).toBe(5);

    const cafeteria = await app.inject({
      method: 'GET',
      url: `/api/events/${eventId}/cafeteria`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(cafeteria.statusCode).toBe(200);
    expect(cafeteria.json().totalToPrepare).toBe(5);
    expect(cafeteria.json().delivered).toBe(3);

    const prepared = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/cafeteria/prepared`,
      headers: { authorization: `Bearer ${auxToken}` },
    });
    expect(prepared.statusCode).toBe(200);
    expect(prepared.json().cafeteriaPreparedAt).not.toBeNull();

    const closed = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/close`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(closed.statusCode).toBe(200);
    expect(closed.json().status).toBe('cerrado');
    expect(closed.json().closeSummary.planned).toBe(5);
    expect(closed.json().closeSummary.delivered).toBe(3);
    expect(closed.json().closeSummary.wastePct).toBe(40);

    const afterClose = await app.inject({
      method: 'POST',
      url: `/api/events/${eventId}/deliveries`,
      headers: { authorization: `Bearer ${auxToken}` },
      payload: {
        method: 'manual',
        learnerId: learnerIds[0],
        clientUuid: '66666666-6666-4666-8666-666666666666',
        reason: 'intento posterior al cierre',
      },
    });
    expect(afterClose.statusCode).toBe(409);
  });

  it('historial del aprendiz, roles y aislamiento fail-closed', async () => {
    const history = await app.inject({
      method: 'GET',
      url: `/api/learners/${learnerIds[0]}/deliveries`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(history.statusCode).toBe(200);
    const rows = history.json() as { method: string; eventDate: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].eventDate).toBe('2026-10-20');

    const aprendizToken = await login(EMAILS.aprendiz);
    const forbidden = await app.inject({
      method: 'GET',
      url: '/api/events',
      headers: { authorization: `Bearer ${aprendizToken}` },
    });
    expect(forbidden.statusCode).toBe(403);

    const withoutContext = await sql`select count(*)::int as n from events`;
    expect(withoutContext[0].n).toBe(0);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=event.closed',
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(audit.statusCode).toBe(200);
    expect((audit.json() as { total: number }).total).toBeGreaterThan(0);
  });
});
