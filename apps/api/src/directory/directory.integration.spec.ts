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
import { AppModule } from '../app.module';
import { generateOtpCode } from '../auth/otp';
import { centers, users } from '../db/schema';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = {
  coordA: 'm9.coord.a@bienestarpro.local',
  coordB: 'm9.coord.b@bienestarpro.local',
  instructor: 'm9.instructor@bienestarpro.local',
  aprendiz: 'm9.aprendiz@bienestarpro.local',
};

describe('Directorio maestro M9 (RF-06 a RF-11 + RLS)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerA: string;
  let centerB: string;
  let coordAToken: string;
  let coordBToken: string;
  let instructorToken: string;
  let instructorId: string;
  let groupAId: string;
  let groupA2Id: string;
  let groupBId: string;
  let learnerId: string;

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

  async function cleanupTenant(centerId: string): Promise<void> {
    await sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerId}, true)`;
      await tx`delete from consents where center_id = ${centerId}`;
      await tx`delete from group_instructors where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
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
    centerA =
      existing[0]?.id ??
      (await db.insert(centers).values({ name: 'Centro M9 A' }).returning())[0]
        .id;
    centerB = (
      await db.insert(centers).values({ name: 'Centro M9 B' }).returning()
    )[0].id;

    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    const inserted = await db
      .insert(users)
      .values([
        {
          centerId: centerA,
          document: '660000001',
          email: EMAILS.coordA,
          name: 'Coordinación A',
          passwordHash,
          role: 'coordinacion',
        },
        {
          centerId: centerB,
          document: '660000002',
          email: EMAILS.coordB,
          name: 'Coordinación B',
          passwordHash,
          role: 'coordinacion',
        },
        {
          centerId: centerA,
          document: '660000003',
          email: EMAILS.instructor,
          name: 'Instructor A',
          passwordHash,
          role: 'instructor',
        },
      ])
      .returning();
    instructorId = inserted.find((u) => u.email === EMAILS.instructor)!.id;

    coordAToken = await loginWithTotp(EMAILS.coordA);
    coordBToken = await loginWithTotp(EMAILS.coordB);
    instructorToken = await login(EMAILS.instructor);
  });

  afterAll(async () => {
    await cleanupTenant(centerA);
    await cleanupTenant(centerB);
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(eq(centers.name, 'Centro M9 B'));
    await app.close();
    await sql.end();
  });

  it('crea el directorio completo: programa, ficha, aprendiz, instructor y consentimiento', async () => {
    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { name: 'Análisis y Desarrollo de Software' },
    });
    expect(program.statusCode).toBe(201);
    const programId = program.json().id as string;

    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: {
        programId,
        code: '2847012',
        journey: 'manana',
        startDate: '2026-08-01',
      },
    });
    expect(group.statusCode).toBe(201);
    groupAId = group.json().id as string;

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { programId, code: '2847012', journey: 'tarde' },
    });
    expect(duplicate.statusCode).toBe(409);

    const learner = await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: {
        groupId: groupAId,
        document: '1098765432',
        fullName: 'Aprendiz de Prueba M9',
      },
    });
    expect(learner.statusCode).toBe(201);
    learnerId = learner.json().id as string;

    const duplicateLearner = await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: {
        groupId: groupAId,
        document: '1098765432',
        fullName: 'Otro Aprendiz',
      },
    });
    expect(duplicateLearner.statusCode).toBe(409);

    const assignment = await app.inject({
      method: 'POST',
      url: `/api/groups/${groupAId}/instructors`,
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { instructorId, roleInGroup: 'director' },
    });
    expect(assignment.statusCode).toBe(201);

    const consent = await app.inject({
      method: 'POST',
      url: `/api/learners/${learnerId}/consents`,
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { policyVersion: 'aviso-privacidad-v1' },
    });
    expect(consent.statusCode).toBe(201);
    const consentId = consent.json().id as string;

    const revoked = await app.inject({
      method: 'PATCH',
      url: `/api/consents/${consentId}/revoke`,
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    expect(revoked.statusCode).toBe(200);
    expect(revoked.json().revokedAt).not.toBeNull();

    const revokeAgain = await app.inject({
      method: 'PATCH',
      url: `/api/consents/${consentId}/revoke`,
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    expect(revokeAgain.statusCode).toBe(404);
  });

  it('el instructor solo ve sus fichas; coordinación ve todo su centro', async () => {
    const programList = await app.inject({
      method: 'GET',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    const programId = (programList.json() as { id: string }[])[0].id;

    const secondGroup = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { programId, code: '2847013', journey: 'tarde' },
    });
    groupA2Id = secondGroup.json().id as string;

    const instructorGroups = await app.inject({
      method: 'GET',
      url: '/api/groups',
      headers: { authorization: `Bearer ${instructorToken}` },
    });
    expect(instructorGroups.statusCode).toBe(200);
    const visible = instructorGroups.json() as { id: string }[];
    expect(visible.map((g) => g.id)).toEqual([groupAId]);

    const forbiddenDetail = await app.inject({
      method: 'GET',
      url: `/api/groups/${groupA2Id}`,
      headers: { authorization: `Bearer ${instructorToken}` },
    });
    expect(forbiddenDetail.statusCode).toBe(404);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/groups/${groupAId}`,
      headers: { authorization: `Bearer ${instructorToken}` },
    });
    expect(detail.statusCode).toBe(200);
    const body = detail.json() as {
      learners: { fullName: string }[];
      instructors: { name: string; roleInGroup: string }[];
    };
    expect(body.learners).toHaveLength(1);
    expect(body.instructors[0].roleInGroup).toBe('director');
  });

  it('RLS: el centro B no ve ni toca los datos del centro A (y viceversa)', async () => {
    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: { authorization: `Bearer ${coordBToken}` },
      payload: { name: 'Programa del centro B' },
    });
    const programBId = program.json().id as string;

    const groupB = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordBToken}` },
      payload: { programId: programBId, code: 'B-0001', journey: 'noche' },
    });
    expect(groupB.statusCode).toBe(201);
    groupBId = groupB.json().id as string;

    // Listados cruzados: cada centro ve solo lo suyo
    const listA = await app.inject({
      method: 'GET',
      url: '/api/groups',
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    const idsA = (listA.json() as { id: string }[]).map((g) => g.id);
    expect(idsA).toContain(groupAId);
    expect(idsA).not.toContain(groupBId);

    // Detalle cruzado: la ficha de B es invisible para A
    const crossDetail = await app.inject({
      method: 'GET',
      url: `/api/groups/${groupBId}`,
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    expect(crossDetail.statusCode).toBe(404);

    // Fila de B no visible desde el contexto de A (SQL directo con RLS)
    const rowsA = await sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerA}, true)`;
      return tx`select count(*)::int as n from groups`;
    });
    const rowsB = await sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerB}, true)`;
      return tx`select count(*)::int as n from groups`;
    });
    expect(rowsA[0].n).toBe(2);
    expect(rowsB[0].n).toBe(1);

    // Fail-closed: sin contexto no hay filas
    const withoutContext = await sql`select count(*)::int as n from groups`;
    expect(withoutContext[0].n).toBe(0);
  });

  it('retiro del aprendiz conserva historial y queda auditado', async () => {
    const retired = await app.inject({
      method: 'PATCH',
      url: `/api/learners/${learnerId}`,
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: { status: 'retirado' },
    });
    expect(retired.statusCode).toBe(200);
    expect(retired.json().status).toBe('retirado');
    expect(retired.json().retiredAt).not.toBeNull();

    const audit = await app.inject({
      method: 'GET',
      url: '/api/audit?action=learner.updated',
      headers: { authorization: `Bearer ${coordAToken}` },
    });
    expect(audit.statusCode).toBe(200);
    const body = audit.json() as { items: { entityId: string }[] };
    expect(body.items.some((item) => item.entityId === learnerId)).toBe(true);
  });

  it('un rol no autorizado (aprendiz) no accede al directorio', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${coordAToken}` },
      payload: {
        document: '660000004',
        email: EMAILS.aprendiz,
        name: 'Aprendiz M9',
        password: PASSWORD,
        role: 'aprendiz',
      },
    });
    expect(created.statusCode).toBe(201);

    const token = await login(EMAILS.aprendiz);
    const groups = await app.inject({
      method: 'GET',
      url: '/api/groups',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(groups.statusCode).toBe(403);
  });
});
