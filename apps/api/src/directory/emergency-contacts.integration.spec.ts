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
  coordinacion: 'm10.coordinacion@bienestarpro.local',
  instructor: 'm10.instructor@bienestarpro.local',
};

describe('Contactos de emergencia M10 (RF-28 y RF-29)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let instructorToken: string;
  let learnerId: string;
  let contactId: string;

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
        .values({ name: 'Centro M10 Prueba' })
        .returning()
    )[0].id;
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '330000001',
        email: EMAILS.coordinacion,
        name: 'Coordinación M10',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '330000002',
        email: EMAILS.instructor,
        name: 'Instructor M10',
        passwordHash,
        role: 'instructor',
      },
    ]);

    // Coordinación con TOTP
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

    const instructorLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.instructor, password: PASSWORD },
    });
    instructorToken = instructorLogin.json().accessToken as string;

    // Ficha y aprendiz (sin consentimiento todavía)
    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { name: 'Programa M10' },
    });
    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        programId: program.json().id,
        code: 'M10-2847',
        journey: 'tarde',
      },
    });
    const learner = await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        groupId: group.json().id,
        document: '430000001',
        fullName: 'Aprendiz M10',
      },
    });
    learnerId = learner.json().id as string;
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from emergency_contacts where center_id = ${centerId}`;
      await tx`delete from consents where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(inArray(centers.id, [centerId]));
    await app.close();
    await sql.end();
  });

  it('sin consentimiento vigente no se registran contactos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/learners/${learnerId}/emergency-contacts`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { name: 'Contacto de Prueba', relationship: 'Madre', phone: '+57 300 000 0000' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('consentimiento');
  });

  it('con consentimiento se registra y el detalle auditado no expone datos sensibles', async () => {
    const consent = await app.inject({
      method: 'POST',
      url: `/api/learners/${learnerId}/consents`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { policyVersion: 'aviso-privacidad-v1' },
    });
    expect(consent.statusCode).toBe(201);

    const created = await app.inject({
      method: 'POST',
      url: `/api/learners/${learnerId}/emergency-contacts`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: {
        name: 'Contacto de Prueba',
        relationship: 'Madre',
        phone: '+57 300 000 0000',
      },
    });
    expect(created.statusCode).toBe(201);
    contactId = created.json().id as string;

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=emergency_contact.created',
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(audit.statusCode).toBe(200);
    const items = audit.json().items as {
      detail: Record<string, unknown> | null;
    }[];
    expect(items.length).toBeGreaterThan(0);
    const detail = items[0].detail ?? {};
    expect(detail.relationship).toBe('Madre');
    expect(JSON.stringify(detail)).not.toContain('300 000');
  });

  it('cada lectura queda auditada y los roles no autorizados no acceden', async () => {
    const list = await app.inject({
      method: 'GET',
      url: `/api/learners/${learnerId}/emergency-contacts`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=emergency_contact.read',
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(audit.statusCode).toBe(200);
    expect((audit.json() as { total: number }).total).toBeGreaterThan(0);

    const forbidden = await app.inject({
      method: 'GET',
      url: `/api/learners/${learnerId}/emergency-contacts`,
      headers: { authorization: `Bearer ${instructorToken}` },
    });
    expect(forbidden.statusCode).toBe(403);
  });

  it('actualización y eliminación con auditoría, y fail-closed sin contexto', async () => {
    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/emergency-contacts/${contactId}`,
      headers: { authorization: `Bearer ${coordToken}` },
      payload: { phone: '+57 301 111 1111' },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().phone).toBe('+57 301 111 1111');

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/emergency-contacts/${contactId}`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(removed.statusCode).toBe(200);

    const list = await app.inject({
      method: 'GET',
      url: `/api/learners/${learnerId}/emergency-contacts`,
      headers: { authorization: `Bearer ${coordToken}` },
    });
    expect(list.json()).toHaveLength(0);

    const withoutContext = await sql`select count(*)::int as n from emergency_contacts`;
    expect(withoutContext[0].n).toBe(0);
  });
});
