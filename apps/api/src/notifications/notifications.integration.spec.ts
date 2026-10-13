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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../app.module';
import { generateOtpCode } from '../auth/otp';
import { centers, users } from '../db/schema';
import { NotificationsRelay } from './notifications.relay';
import { NotificationsService } from './notifications.service';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = { coordinacion: 'm2.coordinacion@bienestarpro.local' };

interface NotificationRow {
  id: string;
  status: string;
  channelEffective: string | null;
  templateVersion: number | null;
  attempts: number;
}

describe('Hub de notificaciones M2 (RF-22 a RF-26)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let coordUserId: string;
  let eventId: string;
  let relay: NotificationsRelay;
  let service: NotificationsService;

  async function withContext<T>(
    fn: (tx: postgres.TransactionSql<Record<string, unknown>>) => Promise<T>,
  ): Promise<T> {
    return sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerId}, true)`;
      return fn(tx);
    }) as Promise<T>;
  }

  async function listNotifications(id: string): Promise<NotificationRow[]> {
    const res = await app.inject({
      method: 'GET',
      url: `/api/events/${id}/notifications`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(res.statusCode).toBe(200);
    return res.json() as NotificationRow[];
  }

  async function publishEvent(date: string): Promise<string> {
    const created = await app.inject({
      method: 'POST',
      url: '/api/events',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { date, journey: 'manana' },
    });
    const id = created.json().id as string;
    const published = await app.inject({
      method: 'POST',
      url: `/api/events/${id}/publish`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(published.statusCode).toBe(200);
    return id;
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
    relay = app.get(NotificationsRelay);
    service = app.get(NotificationsService);

    centerId = (
      await db
        .insert(centers)
        .values({ name: 'Centro M2 Prueba' })
        .returning()
    )[0].id;

    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.insert(users).values({
      centerId,
      document: '440000001',
      email: EMAILS.coordinacion,
      name: 'Coordinación M2',
      passwordHash: await hash(PASSWORD),
      role: 'coordinacion',
    });

    // Login con TOTP
    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    const body = first.json() as unknown as {
      accessToken: string;
      totpEnrollmentRequired: boolean;
      user: { id: string };
    };
    let token = body.accessToken;
    coordUserId = body.user.id;
    if (body.totpEnrollmentRequired) {
      const enroll = await app.inject({
        method: 'POST',
        url: '/api/auth/totp/enroll',
        headers: { authorization: `Bearer ${token}` },
      });
      const secret = (enroll.json() as unknown as { secret: string }).secret;
      await app.inject({
        method: 'POST',
        url: '/api/auth/totp/activate',
        headers: { authorization: `Bearer ${token}` },
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
      token = second.json().accessToken as string;
    }
    coordToken = token;

    // Directorio con dos aprendices con correo
    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { name: 'Programa M2' },
    });
    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        programId: program.json().id,
        code: 'M2-2847',
        journey: 'manana',
      },
    });
    for (const index of [1, 2]) {
      await app.inject({
        method: 'POST',
        url: '/api/learners',
        headers: { authorization: `Bearer ${coordToken}` },
        payload: {
          groupId: group.json().id,
          document: `42000000${index}`,
          fullName: `Aprendiz M2 ${index}`,
          email: `aprendiz.m2.${index}@bienestarpro.local`,
        },
      });
    }
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from notifications where center_id = ${centerId}`;
      await tx`delete from outbox where center_id = ${centerId}`;
      await tx`delete from notification_preferences where center_id = ${centerId}`;
      await tx`delete from notification_templates where center_id = ${centerId}`;
      await tx`delete from deliveries where center_id = ${centerId}`;
      await tx`delete from event_participants where center_id = ${centerId}`;
      await tx`delete from event_groups where center_id = ${centerId}`;
      await tx`delete from events where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    // Solo el centro de esta corrida (los de corridas previas no se tocan).
    await db.delete(centers).where(inArray(centers.id, [centerId]));
    await app.close();
    await sql.end();
  });

  it('publicar encola la convocatoria en el outbox (una notificación por aprendiz con correo)', async () => {
    eventId = await publishEvent('2026-11-20');
    const rows = await listNotifications(eventId);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.status === 'pendiente')).toBe(true);

    const outboxRows = await withContext(
      (tx) => tx`select status from outbox where center_id = ${centerId}`,
    );
    expect((outboxRows as unknown as { status: string }[])[0].status).toBe('pendiente');
  });

  it('el relay publica a la cola y el worker entrega por la cascada (acuse sent por correo)', async () => {
    await relay.tick();
    await vi.waitFor(
      async () => {
        const rows = await listNotifications(eventId);
        expect(rows.every((row) => row.status === 'sent')).toBe(true);
        expect(rows.every((row) => row.channelEffective === 'email')).toBe(true);
      },
      { timeout: 15000, interval: 500 },
    );

    const outboxRows = await withContext(
      (tx) => tx`select status from outbox where center_id = ${centerId}`,
    );
    expect((outboxRows as unknown as { status: string }[])[0].status).toBe('publicado');

    // Cascada completa: con teléfono y correo, push y WhatsApp fallan por no
    // estar configurados y el correo termina la entrega (3 intentos).
    const enqueued = await service.enqueue({
      centerId,
      eventType: 'generico',
      recipients: [
        {
          name: 'Destinatario con teléfono',
          email: 'cascada.m2@bienestarpro.local',
          phone: '+573000000000',
        },
      ],
      payload: { detail: 'prueba de cascada' },
    });
    const cascadeRows = await withContext(
      (tx) =>
        tx`select id from notifications where outbox_id = ${enqueued.outboxId}`,
    );
    const cascadeId = (cascadeRows as unknown as { id: string }[])[0].id;
    const cascadeResult = await service.processNotification(cascadeId, centerId);
    expect(cascadeResult.outcome).toBe('sent');
    expect(cascadeResult.channel).toBe('email');

    const after = await withContext(
      (tx) =>
        tx`select attempts, channel_effective from notifications where id = ${cascadeId}`,
    );
    const row = (
      after as unknown as { attempts: number; channel_effective: string }[]
    )[0];
    expect(row.attempts).toBe(3);
    expect(row.channel_effective).toBe('email');
  }, 20000);

  it('el horario silencioso aplaza la entrega y no la pierde', async () => {
    // Las preferencias aplican a destinatarios con cuenta (userId).
    await app.inject({
      method: 'PUT',
      url: '/api/me/notification-preferences',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { quietHoursStart: '00:00', quietHoursEnd: '23:59' },
    });

    const enqueued = await service.enqueue({
      centerId,
      eventType: 'generico',
      recipients: [
        {
          userId: coordUserId,
          name: 'Coordinación M2',
          email: EMAILS.coordinacion,
        },
      ],
      payload: { detail: 'prueba de silencio' },
    });
    expect(enqueued.queued).toBe(1);

    const rows = await withContext(
      (tx) =>
        tx`select id from notifications where outbox_id = ${enqueued.outboxId}`,
    );
    const rowId = (rows as unknown as { id: string }[])[0].id;

    const deferred = await service.processNotification(rowId, centerId);
    expect(deferred.outcome).toBe('deferred');
    expect(deferred.until).toBeTruthy();

    const still = await withContext(
      (tx) => tx`select status from notifications where id = ${rowId}`,
    );
    expect((still as unknown as { status: string }[])[0].status).toBe('pendiente');

    // Fuera del silencio, el procesamiento la entrega.
    await app.inject({
      method: 'PUT',
      url: '/api/me/notification-preferences',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { channels: ['push', 'whatsapp', 'email'] },
    });
    const sent = await service.processNotification(rowId, centerId);
    expect(sent.outcome).toBe('sent');
  }, 15000);

  it('plantillas versionadas: al actualizar sube la versión y los envíos la registran', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/notification-templates',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        type: 'generico',
        channel: 'email',
        content: 'Hola {{name}}: aviso de prueba v1',
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().version).toBe(1);

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/notification-templates/${created.json().id}`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { content: 'Hola {{name}}: aviso de prueba v2' },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().version).toBe(2);

    const enqueued = await service.enqueue({
      centerId,
      eventType: 'generico',
      recipients: [
        {
          name: 'Destinatario de prueba',
          email: 'destino.m2@bienestarpro.local',
        },
      ],
      payload: { detail: 'prueba de plantilla' },
    });
    expect(enqueued.queued).toBe(1);

    const rows = await withContext(
      (tx) =>
        tx`select id, status, template_version from notifications where outbox_id = ${enqueued.outboxId}`,
    );
    const row = (rows as unknown as { id: string }[])[0];
    const result = await service.processNotification(row.id, centerId);
    expect(result.outcome).toBe('sent');

    const after = await withContext(
      (tx) =>
        tx`select template_version, channel_effective from notifications where id = ${row.id}`,
    );
    expect(
      (after as unknown as { template_version: number }[])[0].template_version,
    ).toBe(2);
    expect(
      (after as unknown as { channel_effective: string }[])[0].channel_effective,
    ).toBe('email');
  });

  it('fail-closed: sin contexto de centro no se ven notificaciones', async () => {
    const rows = await sql`select count(*)::int as n from notifications`;
    expect(rows[0].n).toBe(0);
  });
});
