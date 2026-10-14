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
import { MeetingsScheduler } from './meetings.scheduler';

const PASSWORD = 'ClaveSegura123*';
const EMAILS = {
  coordinacion: 'm8.coordinacion@bienestarpro.local',
  instructor: 'm8.instructor@bienestarpro.local',
  instructor2: 'm8.instructor2@bienestarpro.local',
};
const APRENDIZ_EMAIL = 'aprendiz.m8@bienestarpro.local';

describe('Reuniones y agenda M8 (RF-36 a RF-39)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let instructorToken: string;
  let instructor2Token: string;
  let instructorId: string;
  let groupId: string;
  let meetingId: string;

  async function withContext<T>(
    fn: (tx: postgres.TransactionSql<Record<string, unknown>>) => Promise<T>,
  ): Promise<T> {
    return sql.begin(async (tx) => {
      await tx`select set_config('app.centro_id', ${centerId}, true)`;
      return fn(tx);
    }) as Promise<T>;
  }

  function auth(token: string): { authorization: string } {
    return { authorization: `Bearer ${token}` };
  }

  function futureIso(offsetMs: number): string {
    return new Date(Date.now() + offsetMs).toISOString();
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
        .values({ name: 'Centro M8 Prueba' })
        .returning()
    )[0].id;
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    const inserted = await db
      .insert(users)
      .values([
        {
          centerId,
          document: '240000001',
          email: EMAILS.coordinacion,
          name: 'Coordinación M8',
          passwordHash,
          role: 'coordinacion',
        },
        {
          centerId,
          document: '240000002',
          email: EMAILS.instructor,
          name: 'Instructor M8',
          passwordHash,
          role: 'instructor',
        },
        {
          centerId,
          document: '240000003',
          email: EMAILS.instructor2,
          name: 'Instructor M8 B',
          passwordHash,
          role: 'instructor',
        },
      ])
      .returning();
    instructorId = inserted.find(
      (user) => user.email === EMAILS.instructor,
    )!.id;

    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { identifier: EMAILS.coordinacion, password: PASSWORD },
    });
    let coord = (first.json() as { accessToken: string }).accessToken;
    const enroll = await app.inject({
      method: 'POST',
      url: '/api/auth/totp/enroll',
      headers: auth(coord),
    });
    const secret = (enroll.json() as { secret: string }).secret;
    await app.inject({
      method: 'POST',
      url: '/api/auth/totp/activate',
      headers: auth(coord),
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
    coord = (second.json() as { accessToken: string }).accessToken;
    coordToken = coord;

    instructorToken = (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identifier: EMAILS.instructor, password: PASSWORD },
      })
    ).json().accessToken as string;
    instructor2Token = (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identifier: EMAILS.instructor2, password: PASSWORD },
      })
    ).json().accessToken as string;

    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: auth(coordToken),
      payload: { name: 'Programa M8' },
    });
    const group = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: auth(coordToken),
      payload: {
        programId: program.json().id,
        code: 'M8-2847',
        journey: 'manana',
      },
    });
    groupId = group.json().id as string;
    await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: auth(coordToken),
      payload: {
        groupId,
        document: '470000001',
        fullName: 'Aprendiz M8',
        email: APRENDIZ_EMAIL,
      },
    });
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from meeting_minute_revisions where center_id = ${centerId}`;
      await tx`delete from meeting_minutes where center_id = ${centerId}`;
      await tx`delete from meeting_invitees where center_id = ${centerId}`;
      await tx`delete from meetings where center_id = ${centerId}`;
      await tx`delete from notifications where center_id = ${centerId}`;
      await tx`delete from outbox where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(inArray(centers.id, [centerId]));
    await app.close();
    await sql.end();
  });

  it('agenda la reunión, valida convocados y notifica (CU-30)', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/meetings',
      headers: auth(coordToken),
      payload: {
        title: 'Reunión inválida',
        startsAt: futureIso(3600_000),
        location: 'Auditorio',
        invitees: [
          {
            inviteeType: 'usuario',
            inviteeId: '00000000-0000-4000-8000-000000000000',
          },
        ],
      },
    });
    expect(invalid.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: '/api/meetings',
      headers: auth(coordToken),
      payload: {
        title: 'Comité de bienestar',
        description: 'Revisión mensual de actividades.',
        startsAt: futureIso(24 * 3600_000),
        endsAt: futureIso(25 * 3600_000),
        location: 'Auditorio principal',
        invitees: [
          { inviteeType: 'usuario', inviteeId: instructorId },
          { inviteeType: 'ficha', inviteeId: groupId },
        ],
      },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json() as {
      id: string;
      status: string;
      conflicts: unknown[];
      notificationsQueued: number;
    };
    meetingId = body.id;
    expect(body.status).toBe('agendada');
    expect(body.conflicts).toHaveLength(0);
    // Persona convocada + aprendiz activo de la ficha.
    expect(body.notificationsQueued).toBeGreaterThanOrEqual(2);

    const list = await app.inject({
      method: 'GET',
      url: '/api/meetings',
      headers: auth(coordToken),
    });
    const rows = list.json() as {
      id: string;
      inviteesTotal: number;
      groupsTotal: number;
      pending: number;
      confirmed: number;
    }[];
    const row = rows.find((item) => item.id === meetingId);
    expect(row?.inviteesTotal).toBe(2);
    expect(row?.groupsTotal).toBe(1);
    expect(row?.pending).toBe(1);
    expect(row?.confirmed).toBe(0);
  });

  it('advierte conflicto de horario del organizador (FA-2 CU-30)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/meetings',
      headers: auth(coordToken),
      payload: {
        title: 'Otra reunión solapada',
        startsAt: futureIso(24 * 3600_000 + 1800_000),
        location: 'Sala 2',
        invitees: [{ inviteeType: 'usuario', inviteeId: instructorId }],
      },
    });
    expect(created.statusCode).toBe(201);
    const conflicts = (created.json() as { conflicts: { id: string }[] })
      .conflicts;
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    expect(conflicts[0]!.id).toBe(meetingId);
  });

  it('el convocado ve su invitación y responde RSVP (CU-31)', async () => {
    const invited = await app.inject({
      method: 'GET',
      url: '/api/meetings/invited',
      headers: auth(instructorToken),
    });
    expect(invited.statusCode).toBe(200);
    const rows = invited.json() as { id: string; myRsvpStatus: string }[];
    const row = rows.find((item) => item.id === meetingId);
    expect(row?.myRsvpStatus).toBe('pendiente');

    const confirmed = await app.inject({
      method: 'POST',
      url: `/api/meetings/${meetingId}/rsvp`,
      headers: auth(instructorToken),
      payload: { status: 'confirmado' },
    });
    expect(confirmed.statusCode).toBe(200);
    expect((confirmed.json() as { rsvpStatus: string }).rsvpStatus).toBe(
      'confirmado',
    );

    const detail = await app.inject({
      method: 'GET',
      url: `/api/meetings/${meetingId}`,
      headers: auth(coordToken),
    });
    const invitees = (
      detail.json() as {
        invitees: { inviteeId: string; rsvpStatus: string }[];
      }
    ).invitees;
    expect(
      invitees.find((invitee) => invitee.inviteeId === instructorId)?.rsvpStatus,
    ).toBe('confirmado');

    // FA-1: cambiar la respuesta.
    const rejected = await app.inject({
      method: 'POST',
      url: `/api/meetings/${meetingId}/rsvp`,
      headers: auth(instructorToken),
      payload: { status: 'rechazado' },
    });
    expect(rejected.statusCode).toBe(200);
    expect((rejected.json() as { rsvpStatus: string }).rsvpStatus).toBe(
      'rechazado',
    );

    // Quien no fue convocado no ve el detalle ni puede responder.
    const foreign = await app.inject({
      method: 'GET',
      url: `/api/meetings/${meetingId}`,
      headers: auth(instructor2Token),
    });
    expect(foreign.statusCode).toBe(403);
    const foreignRsvp = await app.inject({
      method: 'POST',
      url: `/api/meetings/${meetingId}/rsvp`,
      headers: auth(instructor2Token),
      payload: { status: 'confirmado' },
    });
    expect(foreignRsvp.statusCode).toBe(403);
  });

  it('editar notifica y reinicia los RSVP al cambiar la fecha (FA-1 CU-30)', async () => {
    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/meetings/${meetingId}`,
      headers: auth(coordToken),
      payload: {
        startsAt: futureIso(48 * 3600_000),
        endsAt: futureIso(49 * 3600_000),
      },
    });
    expect(updated.statusCode).toBe(200);
    const body = updated.json() as {
      rsvpReset: boolean;
      notificationsQueued: number;
    };
    expect(body.rsvpReset).toBe(true);
    expect(body.notificationsQueued).toBeGreaterThanOrEqual(2);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/meetings/${meetingId}`,
      headers: auth(coordToken),
    });
    const invitees = (
      detail.json() as {
        invitees: { inviteeId: string; rsvpStatus: string }[];
      }
    ).invitees;
    expect(
      invitees.find((invitee) => invitee.inviteeId === instructorId)?.rsvpStatus,
    ).toBe('pendiente');
  });

  it('envía recordatorios solo a los no confirmados, una vez (CU-32)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/meetings',
      headers: auth(coordToken),
      payload: {
        title: 'Reunión con recordatorio',
        startsAt: futureIso(72 * 3600_000),
        location: 'Sala 3',
        reminderAt: futureIso(-60_000),
        invitees: [
          { inviteeType: 'usuario', inviteeId: instructorId },
          { inviteeType: 'ficha', inviteeId: groupId },
        ],
      },
    });
    const reminderMeetingId = (created.json() as { id: string }).id;
    // El instructor confirma: FA-2 lo excluye del recordatorio.
    await app.inject({
      method: 'POST',
      url: `/api/meetings/${reminderMeetingId}/rsvp`,
      headers: auth(instructorToken),
      payload: { status: 'confirmado' },
    });

    const scheduler = app.get(MeetingsScheduler);
    const before = await withContext(
      (tx) =>
        tx`select count(*)::int as total from notifications where center_id = ${centerId} and recipient_email = ${APRENDIZ_EMAIL}`,
    );
    const processed = await scheduler.runReminders();
    expect(processed).toBeGreaterThanOrEqual(1);
    const after = await withContext(
      (tx) =>
        tx`select count(*)::int as total from notifications where center_id = ${centerId} and recipient_email = ${APRENDIZ_EMAIL}`,
    );
    expect((after[0]!.total as number) - (before[0]!.total as number)).toBe(1);

    const instructorCount = await withContext(
      (tx) =>
        tx`select count(*)::int as total from notifications where center_id = ${centerId} and recipient_email = ${EMAILS.instructor} and payload->>'detail' like 'Recordatorio:%'`,
    );
    expect(instructorCount[0]!.total).toBe(0);

    // Idempotente: una segunda pasada no reenvía.
    const again = await scheduler.runReminders();
    expect(again).toBe(0);

    const sent = await withContext(
      (tx) =>
        tx`select reminder_sent_at from meetings where id = ${reminderMeetingId}`,
    );
    expect(sent[0]!.reminder_sent_at).not.toBeNull();
  });

  it('cancelar deshabilita el RSVP (FA-2 CU-31)', async () => {
    const cancelled = await app.inject({
      method: 'POST',
      url: `/api/meetings/${meetingId}/cancel`,
      headers: auth(coordToken),
      payload: { reason: 'Sin quórum' },
    });
    expect(cancelled.statusCode).toBe(200);
    expect((cancelled.json() as { status: string }).status).toBe('cancelada');

    const rsvp = await app.inject({
      method: 'POST',
      url: `/api/meetings/${meetingId}/rsvp`,
      headers: auth(instructorToken),
      payload: { status: 'confirmado' },
    });
    expect(rsvp.statusCode).toBe(409);

    const edit = await app.inject({
      method: 'PATCH',
      url: `/api/meetings/${meetingId}`,
      headers: auth(coordToken),
      payload: { title: 'Intento de cambio' },
    });
    expect(edit.statusCode).toBe(409);
  });

  it('registra el acta con compromisos versionados (CU-33)', async () => {
    const pendingMinutes = await app.inject({
      method: 'PUT',
      url: `/api/meetings/${meetingId}/minutes`,
      headers: auth(coordToken),
      payload: {
        topics: 'Temas',
        attendees: [],
        commitments: [],
      },
    });
    // Cancelada: no se puede registrar acta.
    expect(pendingMinutes.statusCode).toBe(409);

    const other = await app.inject({
      method: 'POST',
      url: '/api/meetings',
      headers: auth(coordToken),
      payload: {
        title: 'Reunión para acta',
        startsAt: futureIso(96 * 3600_000),
        location: 'Sala 4',
        invitees: [{ inviteeType: 'usuario', inviteeId: instructorId }],
      },
    });
    const minutesMeetingId = (other.json() as { id: string }).id;

    const completed = await app.inject({
      method: 'POST',
      url: `/api/meetings/${minutesMeetingId}/complete`,
      headers: auth(coordToken),
    });
    expect(completed.statusCode).toBe(200);
    expect((completed.json() as { status: string }).status).toBe('realizada');

    const saved = await app.inject({
      method: 'PUT',
      url: `/api/meetings/${minutesMeetingId}/minutes`,
      headers: auth(coordToken),
      payload: {
        topics: 'Plan de acción del semestre',
        attendees: ['Instructor M8'],
        commitments: [{ text: 'Enviar el plan de acción' }],
      },
    });
    expect(saved.statusCode).toBe(200);
    const minutes = saved.json() as {
      commitments: { id: string; text: string; done: boolean }[];
      notificationsQueued: number;
    };
    expect(minutes.commitments).toHaveLength(1);
    expect(minutes.notificationsQueued).toBeGreaterThanOrEqual(1);
    const commitmentId = minutes.commitments[0]!.id;

    // El convocado consulta el acta desde su detalle.
    const detail = await app.inject({
      method: 'GET',
      url: `/api/meetings/${minutesMeetingId}`,
      headers: auth(instructorToken),
    });
    const detailBody = detail.json() as {
      minutes: { topics: string } | null;
      minutesRevisions: number;
    };
    expect(detailBody.minutes?.topics).toBe('Plan de acción del semestre');
    expect(detailBody.minutesRevisions).toBe(0);

    const done = await app.inject({
      method: 'PATCH',
      url: `/api/meetings/${minutesMeetingId}/minutes/commitments/${commitmentId}`,
      headers: auth(coordToken),
      payload: { done: true },
    });
    expect(done.statusCode).toBe(200);

    // Editar el acta conserva la versión anterior (FA-1 CU-33) y el estado
    // del compromiso existente.
    const edited = await app.inject({
      method: 'PUT',
      url: `/api/meetings/${minutesMeetingId}/minutes`,
      headers: auth(coordToken),
      payload: {
        topics: 'Plan de acción del semestre (ajustado)',
        attendees: ['Instructor M8', 'Coordinación M8'],
        commitments: [{ id: commitmentId, text: 'Enviar el plan de acción' }],
      },
    });
    expect(edited.statusCode).toBe(200);
    const editedMinutes = edited.json() as {
      commitments: { id: string; done: boolean }[];
    };
    expect(editedMinutes.commitments[0]!.done).toBe(true);

    const finalDetail = await app.inject({
      method: 'GET',
      url: `/api/meetings/${minutesMeetingId}`,
      headers: auth(coordToken),
    });
    expect(
      (finalDetail.json() as { minutesRevisions: number }).minutesRevisions,
    ).toBe(1);
  });
});
