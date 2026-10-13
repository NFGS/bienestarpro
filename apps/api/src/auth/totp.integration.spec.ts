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
import { centers, users } from '../db/schema';
import { generateOtpCode } from './otp';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = {
  coordinacion: 'totp.coordinacion@bienestarpro.local',
  aprendiz: 'totp.aprendiz@bienestarpro.local',
};

describe('Segundo factor TOTP (RF-05)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let totpSecret = '';

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
          .values({ name: 'Centro TOTP prueba' })
          .returning()
      )[0].id;

    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '770000001',
        email: EMAILS.coordinacion,
        name: 'Coordinación TOTP',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '770000002',
        email: EMAILS.aprendiz,
        name: 'Aprendiz TOTP',
        passwordHash,
        role: 'aprendiz',
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await app.close();
    await sql.end();
  });

  it('sin TOTP configurado el rol administrativo no puede operar (403)', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    const body = login.json() as {
      accessToken: string;
      totpEnrollmentRequired: boolean;
    };
    expect(body.totpEnrollmentRequired).toBe(true);

    const users = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${body.accessToken}` },
    });
    expect(users.statusCode).toBe(403);
    expect(users.json().message).toContain('segundo factor');
  });

  it('enrolamiento: genera secreto, activa con un código real y no permite repetir', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    const token = login.json().accessToken as string;

    const enroll = await app.inject({
      method: 'POST',
      url: '/api/auth/totp/enroll',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(enroll.statusCode).toBe(200);
    const enrollBody = enroll.json() as { otpauthUrl: string; secret: string };
    expect(enrollBody.otpauthUrl.startsWith('otpauth://totp/')).toBe(true);
    expect(enrollBody.secret.length).toBeGreaterThanOrEqual(16);
    totpSecret = enrollBody.secret;

    const activate = await app.inject({
      method: 'POST',
      url: '/api/auth/totp/activate',
      headers: { authorization: `Bearer ${token}` },
      payload: { code: generateOtpCode(totpSecret) },
    });
    expect(activate.statusCode).toBe(200);

    const again = await app.inject({
      method: 'POST',
      url: '/api/auth/totp/enroll',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(again.statusCode).toBe(409);

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=totp.activated',
      headers: {
        authorization: `Bearer ${await loginWithCode()}`,
      },
    });
    expect(audit.statusCode).toBe(200);
    expect((audit.json() as { total: number }).total).toBeGreaterThan(0);
  });

  async function loginWithCode(): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        identifier: EMAILS.coordinacion,
        password: PASSWORD,
        totpCode: generateOtpCode(totpSecret),
      },
    });
    expect(res.statusCode).toBe(200);
    return res.json().accessToken as string;
  }

  it('con TOTP activo: sin código 401, código inválido 401, código correcto opera', async () => {
    const withoutCode = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    expect(withoutCode.statusCode).toBe(401);
    expect(withoutCode.json().code).toBe('totp_required');

    const wrongCode = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        identifier: EMAILS.coordinacion,
        password: PASSWORD,
        totpCode: '123456',
      },
    });
    expect(wrongCode.statusCode).toBe(401);
    expect(wrongCode.json().code).toBe('totp_invalid');

    const token = await loginWithCode();
    const users = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(users.statusCode).toBe(200);
  });

  it('los roles sin TOTP obligatorio no lo requieren', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.aprendiz, password: PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().totpEnrollmentRequired).toBe(false);
  });
});
