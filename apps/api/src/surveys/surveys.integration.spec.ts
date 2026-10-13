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
  coordinacion: 'm7.coordinacion@bienestarpro.local',
  aprendiz: 'm7.aprendiz@bienestarpro.local',
  aprendiz2: 'm7.aprendiz2@bienestarpro.local',
};

describe('Encuestas M7 (RF-33 a RF-35)', () => {
  let app: NestFastifyApplication;
  const sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  const db = drizzle(sql);
  let centerId: string;
  let coordToken: string;
  let aprendizToken: string;
  let aprendiz2Token: string;
  let groupAId: string;
  let groupBId: string;
  let surveyId: string;

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
        .values({ name: 'Centro M7 Prueba' })
        .returning()
    )[0].id;
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    const passwordHash = await hash(PASSWORD);
    await db.insert(users).values([
      {
        centerId,
        document: '230000001',
        email: EMAILS.coordinacion,
        name: 'Coordinación M7',
        passwordHash,
        role: 'coordinacion',
      },
      {
        centerId,
        document: '230000002',
        email: EMAILS.aprendiz,
        name: 'Aprendiz M7',
        passwordHash,
        role: 'aprendiz',
      },
      {
        centerId,
        document: '230000003',
        email: EMAILS.aprendiz2,
        name: 'Aprendiz M7 B',
        passwordHash,
        role: 'aprendiz',
      },
    ]);

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

    aprendizToken = (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identifier: EMAILS.aprendiz, password: PASSWORD },
      })
    ).json().accessToken as string;
    aprendiz2Token = (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identifier: EMAILS.aprendiz2, password: PASSWORD },
      })
    ).json().accessToken as string;

    const program = await app.inject({
      method: 'POST',
      url: '/api/programs',
      headers: auth(coordToken),
      payload: { name: 'Programa M7' },
    });
    const groupA = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: auth(coordToken),
      payload: {
        programId: program.json().id,
        code: 'M7-2847',
        journey: 'manana',
      },
    });
    groupAId = groupA.json().id as string;
    const groupB = await app.inject({
      method: 'POST',
      url: '/api/groups',
      headers: auth(coordToken),
      payload: {
        programId: program.json().id,
        code: 'M7-2848',
        journey: 'tarde',
      },
    });
    groupBId = groupB.json().id as string;

    // El nombre real de la ficha lo asigna el directorio; el correo vincula
    // al usuario con su registro de aprendiz (patrón del piloto).
    await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: auth(coordToken),
      payload: {
        groupId: groupAId,
        document: '460000001',
        fullName: 'Aprendiz M7',
        email: EMAILS.aprendiz,
      },
    });
    await app.inject({
      method: 'POST',
      url: '/api/learners',
      headers: auth(coordToken),
      payload: {
        groupId: groupBId,
        document: '460000002',
        fullName: 'Aprendiz M7 B',
        email: EMAILS.aprendiz2,
      },
    });
  });

  afterAll(async () => {
    await withContext(async (tx) => {
      await tx`delete from notifications where center_id = ${centerId}`;
      await tx`delete from outbox where center_id = ${centerId}`;
      await tx`delete from survey_answers where center_id = ${centerId}`;
      await tx`delete from survey_responses where center_id = ${centerId}`;
      await tx`delete from survey_segments where center_id = ${centerId}`;
      await tx`delete from survey_options where center_id = ${centerId}`;
      await tx`delete from survey_questions where center_id = ${centerId}`;
      await tx`delete from surveys where center_id = ${centerId}`;
      await tx`delete from learners where center_id = ${centerId}`;
      await tx`delete from groups where center_id = ${centerId}`;
      await tx`delete from programs where center_id = ${centerId}`;
    });
    await db.delete(users).where(inArray(users.email, Object.values(EMAILS)));
    await db.delete(centers).where(inArray(centers.id, [centerId]));
    await app.close();
    await sql.end();
  });

  it('crea la encuesta en borrador con preguntas, la edita y la lista (RF-33)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/surveys',
      headers: auth(coordToken),
      payload: {
        title: 'Pulso de bienestar M7',
        description: 'Cuéntanos cómo te sientes con las actividades.',
        anonymous: true,
        minResponses: 3,
        segments: [{ segmentType: 'ficha', segmentValue: groupAId }],
        questions: [
          {
            text: '¿Participaste en la actividad?',
            type: 'unica',
            required: true,
            options: [{ label: 'Sí' }, { label: 'No' }],
          },
          {
            text: 'Califica la actividad (1 a 5)',
            type: 'escala',
            scaleMin: 1,
            scaleMax: 5,
          },
        ],
      },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json() as {
      id: string;
      status: string;
      questions: { type: string; options: { label: string }[] }[];
    };
    surveyId = body.id;
    expect(body.status).toBe('borrador');
    expect(body.questions).toHaveLength(2);
    expect(body.questions[0]!.options.map((option) => option.label)).toEqual([
      'Sí',
      'No',
    ]);

    const edited = await app.inject({
      method: 'PATCH',
      url: `/api/surveys/${surveyId}`,
      headers: auth(coordToken),
      payload: {
        title: 'Pulso de bienestar M7 (v2)',
        questions: [
          {
            text: '¿Participaste en la actividad?',
            type: 'unica',
            options: [{ label: 'Sí' }, { label: 'No' }],
          },
          {
            text: 'Califica la actividad (1 a 5)',
            type: 'escala',
            scaleMin: 1,
            scaleMax: 5,
          },
          {
            text: '¿Qué mejorarías?',
            type: 'multiple',
            required: false,
            options: [{ label: 'Horarios' }, { label: 'Lugar' }, { label: 'Temática' }],
          },
        ],
      },
    });
    expect(edited.statusCode).toBe(200);
    expect(
      (edited.json() as { questions: unknown[] }).questions,
    ).toHaveLength(3);

    const list = await app.inject({
      method: 'GET',
      url: '/api/surveys',
      headers: auth(coordToken),
    });
    const rows = list.json() as {
      id: string;
      questionCount: number;
      totalResponses: number;
    }[];
    const row = rows.find((item) => item.id === surveyId);
    expect(row?.questionCount).toBe(3);
    expect(row?.totalResponses).toBe(0);
  });

  it('no publica sin preguntas (FA-1) y al publicar congela la estructura (RF-33)', async () => {
    const empty = await app.inject({
      method: 'POST',
      url: '/api/surveys',
      headers: auth(coordToken),
      payload: {
        title: 'Encuesta vacía',
        description: 'Sin preguntas todavía.',
        anonymous: false,
      },
    });
    const emptyId = (empty.json() as { id: string }).id;
    const failed = await app.inject({
      method: 'POST',
      url: `/api/surveys/${emptyId}/publish`,
      headers: auth(coordToken),
    });
    expect(failed.statusCode).toBe(400);
    expect((failed.json() as { message: string }).message).toContain(
      'al menos una pregunta',
    );

    const published = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyId}/publish`,
      headers: auth(coordToken),
    });
    expect(published.statusCode).toBe(200);
    const body = published.json() as {
      status: string;
      recipients: number;
      notificationsQueued: number;
    };
    expect(body.status).toBe('publicada');
    expect(body.recipients).toBe(1);
    expect(body.notificationsQueued).toBeGreaterThanOrEqual(1);

    const frozen = await app.inject({
      method: 'PATCH',
      url: `/api/surveys/${surveyId}`,
      headers: auth(coordToken),
      payload: { title: 'Intento de cambio' },
    });
    expect(frozen.statusCode).toBe(409);
  });

  it('el aprendiz ve su encuesta disponible con su estructura (RF-34)', async () => {
    const available = await app.inject({
      method: 'GET',
      url: '/api/surveys/available',
      headers: auth(aprendizToken),
    });
    expect(available.statusCode).toBe(200);
    const rows = available.json() as {
      id: string;
      anonymous: boolean;
      answered: boolean;
      questions: {
        type: string;
        required: boolean;
        options: { id: string; label: string }[];
      }[];
    }[];
    const survey = rows.find((item) => item.id === surveyId);
    expect(survey).toBeDefined();
    expect(survey!.anonymous).toBe(true);
    expect(survey!.answered).toBe(false);
    expect(survey!.questions).toHaveLength(3);
    expect(survey!.questions[0]!.options.map((option) => option.label)).toEqual([
      'Sí',
      'No',
    ]);
    expect(survey!.questions[1]!.type).toBe('escala');
    expect(survey!.questions[2]!.required).toBe(false);
  });

  it('valida respuestas obligatorias y opciones (FA-1 CU-28)', async () => {
    const detail = await app.inject({
      method: 'GET',
      url: `/api/surveys/${surveyId}`,
      headers: auth(coordToken),
    });
    const questions = (
      detail.json() as {
        questions: {
          id: string;
          type: string;
          options: { id: string; label: string }[];
        }[];
      }
    ).questions;
    const single = questions[0]!;
    const scale = questions[1]!;
    const optional = questions[2]!;

    const missing = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyId}/responses`,
      headers: auth(aprendizToken),
      payload: { answers: [{ questionId: single.id, optionIds: [] }] },
    });
    expect(missing.statusCode).toBe(400);

    const twoOptions = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyId}/responses`,
      headers: auth(aprendizToken),
      payload: {
        answers: [
          {
            questionId: single.id,
            optionIds: [single.options[0]!.id, single.options[1]!.id],
          },
          { questionId: scale.id, scaleValue: 4 },
        ],
      },
    });
    expect(twoOptions.statusCode).toBe(400);
    expect((twoOptions.json() as { message: string }).message).toContain(
      'exactamente una opción',
    );

    const unknown = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyId}/responses`,
      headers: auth(aprendizToken),
      payload: {
        answers: [
          { questionId: single.id, optionIds: [single.options[0]!.id] },
          { questionId: scale.id, scaleValue: 4 },
          { questionId: optional.id, optionIds: [] },
          { questionId: '00000000-0000-4000-8000-000000000000', scaleValue: 1 },
        ],
      },
    });
    expect(unknown.statusCode).toBe(400);
    expect((unknown.json() as { message: string }).message).toContain(
      'pregunta desconocida',
    );
  });

  it('registra la respuesta anónima sin identificador y agrega resultados (RF-34/35)', async () => {
    const detail = await app.inject({
      method: 'GET',
      url: `/api/surveys/${surveyId}`,
      headers: auth(coordToken),
    });
    const questions = (
      detail.json() as {
        questions: {
          id: string;
          type: string;
          options: { id: string; label: string }[];
        }[];
      }
    ).questions;
    const single = questions[0]!;
    const scale = questions[1]!;

    const submitted = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyId}/responses`,
      headers: auth(aprendizToken),
      payload: {
        answers: [
          { questionId: single.id, optionIds: [single.options[0]!.id] },
          { questionId: scale.id, scaleValue: 4 },
        ],
      },
    });
    expect(submitted.statusCode).toBe(200);
    expect((submitted.json() as { anonymous: boolean }).anonymous).toBe(true);

    const rows = await withContext(
      (tx) =>
        tx`select learner_id, group_id from survey_responses where survey_id = ${surveyId}`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.learner_id).toBeNull();
    expect(rows[0]!.group_id).toBe(groupAId);

    const results = await app.inject({
      method: 'GET',
      url: `/api/surveys/${surveyId}/results`,
      headers: auth(coordToken),
    });
    expect(results.statusCode).toBe(200);
    const data = results.json() as {
      totalResponses: number;
      questions: {
        type: string;
        respondents: number;
        average: number | null;
        options: { label: string; count: number; percentage: number }[];
      }[];
    };
    expect(data.totalResponses).toBe(1);
    expect(data.questions[0]!.options[0]).toMatchObject({
      label: 'Sí',
      count: 1,
      percentage: 100,
    });
    expect(data.questions[1]!.average).toBe(4);
  });

  it('en identificadas no permite repetir (FA-2) y filtra por segmento', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/surveys',
      headers: auth(coordToken),
      payload: {
        title: 'Asistencia a charla (identificada)',
        description: 'Control de asistencia con nombre.',
        anonymous: false,
        segments: [{ segmentType: 'ficha', segmentValue: groupAId }],
        questions: [
          {
            text: '¿Asististe a la charla?',
            type: 'unica',
            options: [{ label: 'Sí' }, { label: 'No' }],
          },
        ],
      },
    });
    const identifiedId = (created.json() as { id: string }).id;
    const published = await app.inject({
      method: 'POST',
      url: `/api/surveys/${identifiedId}/publish`,
      headers: auth(coordToken),
    });
    expect(published.statusCode).toBe(200);
    const question = (
      (await app.inject({
        method: 'GET',
        url: `/api/surveys/${identifiedId}`,
        headers: auth(coordToken),
      })).json() as {
        questions: { id: string; options: { id: string }[] }[];
      }
    ).questions[0]!;

    const first = await app.inject({
      method: 'POST',
      url: `/api/surveys/${identifiedId}/responses`,
      headers: auth(aprendizToken),
      payload: {
        answers: [
          { questionId: question.id, optionIds: [question.options[0]!.id] },
        ],
      },
    });
    expect(first.statusCode).toBe(200);
    expect((first.json() as { anonymous: boolean }).anonymous).toBe(false);

    const again = await app.inject({
      method: 'POST',
      url: `/api/surveys/${identifiedId}/responses`,
      headers: auth(aprendizToken),
      payload: {
        answers: [
          { questionId: question.id, optionIds: [question.options[1]!.id] },
        ],
      },
    });
    expect(again.statusCode).toBe(409);
    expect((again.json() as { message: string }).message).toContain(
      'Ya respondiste',
    );

    const rows = await withContext(
      (tx) =>
        tx`select learner_id from survey_responses where survey_id = ${identifiedId}`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.learner_id).not.toBeNull();

    // El segmento (ficha A) filtra: el aprendiz B no la ve.
    const availableB = await app.inject({
      method: 'GET',
      url: '/api/surveys/available',
      headers: auth(aprendiz2Token),
    });
    const idsB = (availableB.json() as { id: string }[]).map((row) => row.id);
    expect(idsB).not.toContain(identifiedId);
  });

  it('oculta desgloses bajo el umbral (RN-08) y exporta CSV (RF-35)', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/surveys',
      headers: auth(coordToken),
      payload: {
        title: 'Actividad por fichas',
        description: 'Pulso anónimo para dos fichas.',
        anonymous: true,
        minResponses: 3,
        segments: [
          { segmentType: 'ficha', segmentValue: groupAId },
          { segmentType: 'ficha', segmentValue: groupBId },
        ],
        questions: [
          {
            text: '¿Te gustó la actividad?',
            type: 'unica',
            options: [{ label: 'Sí' }, { label: 'No' }],
          },
        ],
      },
    });
    const surveyC = (created.json() as { id: string }).id;
    const published = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyC}/publish`,
      headers: auth(coordToken),
    });
    expect(published.statusCode).toBe(200);
    expect((published.json() as { recipients: number }).recipients).toBe(2);
    const question = (
      (await app.inject({
        method: 'GET',
        url: `/api/surveys/${surveyC}`,
        headers: auth(coordToken),
      })).json() as {
        questions: { id: string; options: { id: string }[] }[];
      }
    ).questions[0]!;
    const yes = question.options[0]!.id;
    const no = question.options[1]!.id;

    // Ficha A: 3 respuestas anónimas (el aprendiz puede responder varias
    // veces sin identificador; el anonimato impide deduplicar).
    for (let index = 0; index < 3; index += 1) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/surveys/${surveyC}/responses`,
        headers: auth(aprendizToken),
        payload: { answers: [{ questionId: question.id, optionIds: [yes] }] },
      });
      expect(res.statusCode).toBe(200);
    }
    // Ficha B: 1 respuesta (por debajo del umbral).
    const one = await app.inject({
      method: 'POST',
      url: `/api/surveys/${surveyC}/responses`,
      headers: auth(aprendiz2Token),
      payload: { answers: [{ questionId: question.id, optionIds: [no] }] },
    });
    expect(one.statusCode).toBe(200);

    const results = await app.inject({
      method: 'GET',
      url: `/api/surveys/${surveyC}/results`,
      headers: auth(coordToken),
    });
    const data = results.json() as {
      totalResponses: number;
      hiddenSegments: number;
      questions: { options: { label: string; count: number; percentage: number }[] }[];
      segments: { groupCode: string | null; responses: number }[];
    };
    expect(data.totalResponses).toBe(4);
    expect(data.hiddenSegments).toBe(1);
    expect(data.segments).toHaveLength(1);
    expect(data.segments[0]!.responses).toBe(3);
    expect(data.segments[0]!.groupCode).toBe('M7-2847');
    expect(data.questions[0]!.options[0]).toMatchObject({
      label: 'Sí',
      count: 3,
      percentage: 75,
    });

    const exported = await app.inject({
      method: 'GET',
      url: `/api/surveys/${surveyC}/results/export`,
      headers: auth(coordToken),
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers['content-type']).toContain('text/csv');
    expect(exported.headers['content-disposition']).toContain('encuesta-');
    const csv = exported.body;
    expect(csv).toContain('Pregunta,Tipo,Respuesta,Total,Porcentaje');
    expect(csv).toContain('¿Te gustó la actividad?');
    expect(csv).toContain('75');
    // La ficha visible (3 respuestas) aparece; la oculta (1 < umbral) no.
    expect(csv).toContain('M7-2847');
    expect(csv).not.toContain('M7-2848');
  });
});
