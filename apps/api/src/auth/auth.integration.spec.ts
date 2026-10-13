import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { hash } from 'argon2';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { centers, users } from '../db/schema';

const DEMO = {
  email: 'prueba.login@bienestarpro.local',
  document: '990000001',
  password: 'ClaveSegura123*',
};

describe('Autenticación (integración con PostgreSQL)', () => {
  let app: NestFastifyApplication;
  let centerId: string;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Centro propio de esta corrida (nunca reutilizar el de otro spec:
    // en ejecución paralela el "primer centro" puede ser ajeno).
    const [ownCenter] = await db
      .insert(centers)
      .values({ name: 'Centro auth prueba' })
      .returning();
    centerId = ownCenter.id;
    await db.delete(users).where(eq(users.email, DEMO.email));
    await db.insert(users).values({
      centerId,
      document: DEMO.document,
      email: DEMO.email,
      name: 'Usuario de Prueba',
      passwordHash: await hash(DEMO.password),
      role: 'aprendiz',
    });
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, DEMO.email));
    await db.delete(centers).where(eq(centers.id, centerId));
    await app.close();
    await sql.end();
  });

  it('login correcto devuelve token y usuario sin datos sensibles', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: DEMO.email, password: DEMO.password },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe(DEMO.email);
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('credenciales inválidas dan error genérico sin revelar la causa', async () => {
    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: DEMO.email, password: 'ClaveIncorrecta1*' },
    });
    expect(wrongPassword.statusCode).toBe(401);
    expect(wrongPassword.json().message).toBe('Credenciales inválidas');

    const unknownUser = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: 'no.existe@x.local', password: 'ClaveIncorrecta1*' },
    });
    expect(unknownUser.statusCode).toBe(401);
    expect(unknownUser.json().message).toBe('Credenciales inválidas');
  });

  it('bloquea la cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identifier: DEMO.email, password: 'MalaClave123*' },
      });
    }
    const locked = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: DEMO.email, password: DEMO.password },
    });
    expect(locked.statusCode).toBe(401);
    expect(locked.json().message).toContain('bloqueada');
  });

  it('GET /auth/me exige token válido y devuelve el usuario', async () => {
    await db
      .update(users)
      .set({ lockedUntil: null, failedAttempts: 0 })
      .where(eq(users.email, DEMO.email));

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: DEMO.document, password: DEMO.password },
    });
    const token = login.json().accessToken as string;

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(DEMO.email);

    const noToken = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(noToken.statusCode).toBe(401);
  });
});
