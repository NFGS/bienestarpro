import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { resolveSegmentLearners, validateSegment } from '../common/segments';
import { DbService, type Database } from '../db/db.module';
import {
  groups,
  learners,
  surveyAnswers,
  surveyOptions,
  surveyQuestions,
  surveyResponses,
  surveySegments,
  surveys,
} from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateSurveyDto,
  SubmitSurveyDto,
  SurveyQuestionDto,
  UpdateSurveyDto,
} from './dto/surveys.dto';

type SurveyQuestionRow = typeof surveyQuestions.$inferSelect;
type SurveyOptionRow = typeof surveyOptions.$inferSelect;
type SurveyAnswerRow = typeof surveyAnswers.$inferSelect;

/** Agrega respuestas por pregunta (sin identidad de respondientes). */
function aggregateQuestions(
  questions: SurveyQuestionRow[],
  options: SurveyOptionRow[],
  answers: SurveyAnswerRow[],
) {
  return questions.map((question) => {
    const questionAnswers = answers.filter(
      (answer) => answer.questionId === question.id,
    );
    const respondents = new Set(questionAnswers.map((a) => a.responseId)).size;
    const base = {
      id: question.id,
      text: question.text,
      type: question.type,
      required: question.required,
      respondents,
    };
    if (question.type === 'escala') {
      const values = questionAnswers
        .map((answer) => answer.scaleValue)
        .filter((value): value is number => value !== null);
      const distribution = [
        ...values.reduce((map, value) => {
          map.set(value, (map.get(value) ?? 0) + 1);
          return map;
        }, new Map<number, number>()),
      ]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value - b.value);
      const average = values.length
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
        : null;
      return {
        ...base,
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        average,
        distribution,
        options: [],
      };
    }
    const counts = options
      .filter((option) => option.questionId === question.id)
      .sort((a, b) => a.position - b.position)
      .map((option) => {
        const count = questionAnswers.filter(
          (answer) => answer.optionId === option.id,
        ).length;
        return {
          optionId: option.id,
          label: option.label,
          count,
          percentage: respondents
            ? Math.round((count / respondents) * 1000) / 10
            : 0,
        };
      });
    return {
      ...base,
      scaleMin: null,
      scaleMax: null,
      average: null,
      distribution: [],
      options: counts,
    };
  });
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * CU-27 a CU-29 — RF-33 a RF-35: encuestas (M7).
 * Anonimato por diseño (RN-08): en modo anónimo la respuesta no guarda
 * identificador del aprendiz y los desgloses por ficha se ocultan bajo el
 * umbral mínimo de respuestas. La estructura se congela al publicar.
 */
@Injectable()
export class SurveysService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private tenant(actor: AuthenticatedUser): string {
    if (!actor.centerId) {
      throw new BadRequestException('Tu usuario no tiene centro asignado');
    }
    return actor.centerId;
  }

  async list(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const rows = await db
        .select()
        .from(surveys)
        .orderBy(desc(surveys.createdAt));
      if (rows.length === 0) {
        return [];
      }
      const ids = rows.map((row) => row.id);
      const responseCounts = await db
        .select({
          surveyId: surveyResponses.surveyId,
          total: sql<number>`count(*)::int`,
        })
        .from(surveyResponses)
        .where(inArray(surveyResponses.surveyId, ids))
        .groupBy(surveyResponses.surveyId);
      const questionCounts = await db
        .select({
          surveyId: surveyQuestions.surveyId,
          total: sql<number>`count(*)::int`,
        })
        .from(surveyQuestions)
        .where(inArray(surveyQuestions.surveyId, ids))
        .groupBy(surveyQuestions.surveyId);
      const segments = await db
        .select()
        .from(surveySegments)
        .where(inArray(surveySegments.surveyId, ids));
      return rows.map((survey) => ({
        ...survey,
        totalResponses:
          responseCounts.find((count) => count.surveyId === survey.id)?.total ??
          0,
        questionCount:
          questionCounts.find((count) => count.surveyId === survey.id)?.total ??
          0,
        segments: segments
          .filter((segment) => segment.surveyId === survey.id)
          .map((segment) => ({
            segmentType: segment.segmentType,
            segmentValue: segment.segmentValue,
          })),
      }));
    });
  }

  async get(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1);
      if (!survey) {
        throw new NotFoundException('Encuesta no encontrada');
      }
      const [questions, options, segments, totals] = await Promise.all([
        db
          .select()
          .from(surveyQuestions)
          .where(eq(surveyQuestions.surveyId, id))
          .orderBy(asc(surveyQuestions.position)),
        this.optionsFor(db, id),
        db.select().from(surveySegments).where(eq(surveySegments.surveyId, id)),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(surveyResponses)
          .where(eq(surveyResponses.surveyId, id)),
      ]);
      return {
        ...survey,
        segments: segments.map((segment) => ({
          segmentType: segment.segmentType,
          segmentValue: segment.segmentValue,
        })),
        totalResponses: totals[0]?.total ?? 0,
        questions: questions.map((question) => ({
          ...question,
          options: options
            .filter((option) => option.questionId === question.id)
            .map((option) => ({ id: option.id, label: option.label })),
        })),
      };
    });
  }

  private async optionsFor(db: Database, surveyId: string) {
    const ids = await db
      .select({ id: surveyQuestions.id })
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId));
    if (ids.length === 0) {
      return [];
    }
    return db
      .select()
      .from(surveyOptions)
      .where(
        inArray(
          surveyOptions.questionId,
          ids.map((question) => question.id),
        ),
      )
      .orderBy(asc(surveyOptions.position));
  }

  private async insertQuestions(
    db: Database,
    centerId: string,
    surveyId: string,
    questions: SurveyQuestionDto[],
  ): Promise<void> {
    for (const [position, question] of questions.entries()) {
      const [row] = await db
        .insert(surveyQuestions)
        .values({
          centerId,
          surveyId,
          position,
          text: question.text,
          type: question.type,
          required: question.required ?? true,
          scaleMin: question.type === 'escala' ? (question.scaleMin ?? 1) : null,
          scaleMax: question.type === 'escala' ? (question.scaleMax ?? 5) : null,
        })
        .returning();
      if (question.type !== 'escala' && (question.options?.length ?? 0) > 0) {
        await db.insert(surveyOptions).values(
          question.options!.map((option, index) => ({
            centerId,
            questionId: row.id,
            position: index,
            label: option.label,
          })),
        );
      }
    }
  }

  async create(dto: CreateSurveyDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      for (const segment of dto.segments ?? []) {
        await validateSegment(db, segment);
      }
      const [row] = await db
        .insert(surveys)
        .values({
          centerId,
          title: dto.title,
          description: dto.description,
          anonymous: dto.anonymous,
          minResponses: dto.minResponses ?? 5,
          authorId: actor.id,
        })
        .returning();
      await this.insertQuestions(db, centerId, row.id, dto.questions ?? []);
      if (dto.segments && dto.segments.length > 0) {
        await db.insert(surveySegments).values(
          dto.segments.map((segment) => ({
            centerId,
            surveyId: row.id,
            segmentType: segment.segmentType,
            segmentValue: segment.segmentValue,
          })),
        );
      }
      return row;
    });
    await this.audit.record({
      action: 'survey.created',
      entity: 'survey',
      entityId: created.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: {
        anonymous: created.anonymous,
        questions: dto.questions?.length ?? 0,
        segments: dto.segments?.length ?? 0,
      },
    });
    return this.get(created.id, actor);
  }

  async update(id: string, dto: UpdateSurveyDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Encuesta no encontrada');
      }
      if (current.status !== 'borrador') {
        throw new ConflictException(
          'La estructura se congeló al publicar: no se puede editar',
        );
      }
      await db
        .update(surveys)
        .set({
          title: dto.title ?? current.title,
          description: dto.description ?? current.description,
          anonymous: dto.anonymous ?? current.anonymous,
          minResponses: dto.minResponses ?? current.minResponses,
        })
        .where(eq(surveys.id, id));
      if (dto.questions !== undefined) {
        const old = await db
          .select({ id: surveyQuestions.id })
          .from(surveyQuestions)
          .where(eq(surveyQuestions.surveyId, id));
        if (old.length > 0) {
          await db.delete(surveyOptions).where(
            inArray(
              surveyOptions.questionId,
              old.map((question) => question.id),
            ),
          );
          await db
            .delete(surveyQuestions)
            .where(eq(surveyQuestions.surveyId, id));
        }
        await this.insertQuestions(db, centerId, id, dto.questions);
      }
      if (dto.segments !== undefined) {
        for (const segment of dto.segments) {
          await validateSegment(db, segment);
        }
        await db.delete(surveySegments).where(eq(surveySegments.surveyId, id));
        if (dto.segments.length > 0) {
          await db.insert(surveySegments).values(
            dto.segments.map((segment) => ({
              centerId,
              surveyId: id,
              segmentType: segment.segmentType,
              segmentValue: segment.segmentValue,
            })),
          );
        }
      }
    });
    await this.audit.record({
      action: 'survey.updated',
      entity: 'survey',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
    });
    return this.get(id, actor);
  }

  /** CU-27: publica y difunde la invitación al segmento (FA-1: sin preguntas). */
  async publish(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1);
      if (!survey) {
        throw new NotFoundException('Encuesta no encontrada');
      }
      if (survey.status !== 'borrador') {
        throw new ConflictException('La encuesta ya fue publicada');
      }
      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, id));
      if (questions.length === 0) {
        throw new BadRequestException(
          'Agrega al menos una pregunta antes de publicar',
        );
      }
      const options = await this.optionsFor(db, id);
      for (const question of questions) {
        if (question.type === 'escala') {
          if (
            question.scaleMin === null ||
            question.scaleMax === null ||
            question.scaleMin >= question.scaleMax
          ) {
            throw new BadRequestException(
              `La escala de la pregunta "${question.text}" no es válida`,
            );
          }
          continue;
        }
        if (
          options.filter((option) => option.questionId === question.id)
            .length < 2
        ) {
          throw new BadRequestException(
            `La pregunta "${question.text}" necesita al menos dos opciones`,
          );
        }
      }
      const segments = await db
        .select()
        .from(surveySegments)
        .where(eq(surveySegments.surveyId, id));
      const recipients = (await resolveSegmentLearners(db, segments)).map(
        (learner) => ({ name: learner.fullName, email: learner.email }),
      );
      const [updated] = await db
        .update(surveys)
        .set({ status: 'publicada', publishedAt: new Date() })
        .where(eq(surveys.id, id))
        .returning();
      return { survey: updated, recipients };
    });

    const enqueued = await this.notifications.enqueue({
      centerId,
      eventType: 'generico',
      recipients: result.recipients,
      payload: {
        detail: `Encuesta de Bienestar: "${result.survey.title}". Ingresa a BienestarPro y respóndela.`,
        critical: false,
      },
    });
    await this.audit.record({
      action: 'survey.published',
      entity: 'survey',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: {
        anonymous: result.survey.anonymous,
        recipients: result.recipients.length,
        queued: enqueued.queued,
      },
    });
    return {
      ...result.survey,
      recipients: result.recipients.length,
      notificationsQueued: enqueued.queued,
    };
  }

  /** CU-28: encuestas publicadas del segmento del aprendiz (con estructura). */
  async available(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [learner] = await db
        .select()
        .from(learners)
        .where(
          and(
            eq(learners.email, actor.email),
            eq(learners.status, 'activo'),
          ),
        )
        .limit(1);
      if (!learner) {
        return [];
      }
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, learner.groupId))
        .limit(1);
      const published = await db
        .select()
        .from(surveys)
        .where(eq(surveys.status, 'publicada'))
        .orderBy(desc(surveys.publishedAt));
      if (published.length === 0) {
        return [];
      }
      const ids = published.map((survey) => survey.id);
      const segments = await db
        .select()
        .from(surveySegments)
        .where(inArray(surveySegments.surveyId, ids));
      const visible = published.filter((survey) => {
        const own = segments.filter(
          (segment) => segment.surveyId === survey.id,
        );
        if (own.length === 0) {
          return true;
        }
        return own.some((segment) => {
          if (segment.segmentType === 'ficha') {
            return segment.segmentValue === learner.groupId;
          }
          if (segment.segmentType === 'jornada') {
            return segment.segmentValue === group?.journey;
          }
          return segment.segmentValue === group?.programId;
        });
      });
      if (visible.length === 0) {
        return [];
      }
      const visibleIds = visible.map((survey) => survey.id);
      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(inArray(surveyQuestions.surveyId, visibleIds))
        .orderBy(asc(surveyQuestions.position));
      const questionIds = questions.map((question) => question.id);
      const options = questionIds.length
        ? await db
            .select()
            .from(surveyOptions)
            .where(inArray(surveyOptions.questionId, questionIds))
            .orderBy(asc(surveyOptions.position))
        : [];
      const answered = await db
        .select({ surveyId: surveyResponses.surveyId })
        .from(surveyResponses)
        .where(
          and(
            inArray(surveyResponses.surveyId, visibleIds),
            eq(surveyResponses.learnerId, learner.id),
          ),
        );
      return visible.map((survey) => ({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        anonymous: survey.anonymous,
        publishedAt: survey.publishedAt,
        answered: answered.some((row) => row.surveyId === survey.id),
        questions: questions
          .filter((question) => question.surveyId === survey.id)
          .map((question) => ({
            id: question.id,
            text: question.text,
            type: question.type,
            required: question.required,
            scaleMin: question.scaleMin,
            scaleMax: question.scaleMax,
            options: options
              .filter((option) => option.questionId === question.id)
              .map((option) => ({ id: option.id, label: option.label })),
          })),
      }));
    });
  }

  /** CU-28: registra la respuesta (sin identificador si la encuesta es anónima). */
  async submit(id: string, dto: SubmitSurveyDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1);
      if (!survey) {
        throw new NotFoundException('Encuesta no encontrada');
      }
      if (survey.status !== 'publicada') {
        throw new ConflictException('La encuesta no está activa');
      }
      const [learner] = await db
        .select()
        .from(learners)
        .where(
          and(
            eq(learners.email, actor.email),
            eq(learners.status, 'activo'),
          ),
        )
        .limit(1);
      if (!learner) {
        throw new ForbiddenException(
          'Tu usuario no está vinculado a una ficha de aprendiz',
        );
      }
      const segments = await db
        .select()
        .from(surveySegments)
        .where(eq(surveySegments.surveyId, id));
      if (segments.length > 0) {
        const [group] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, learner.groupId))
          .limit(1);
        const belongs = segments.some((segment) => {
          if (segment.segmentType === 'ficha') {
            return segment.segmentValue === learner.groupId;
          }
          if (segment.segmentType === 'jornada') {
            return segment.segmentValue === group?.journey;
          }
          return segment.segmentValue === group?.programId;
        });
        if (!belongs) {
          throw new ForbiddenException(
            'La encuesta no está dirigida a tu ficha',
          );
        }
      }
      // FA-2 (CU-28): una respuesta por aprendiz en encuestas identificadas;
      // en anónimas no hay identificador que verificar (anonimato por diseño).
      if (!survey.anonymous) {
        const [existing] = await db
          .select({ id: surveyResponses.id })
          .from(surveyResponses)
          .where(
            and(
              eq(surveyResponses.surveyId, id),
              eq(surveyResponses.learnerId, learner.id),
            ),
          )
          .limit(1);
        if (existing) {
          throw new ConflictException('Ya respondiste esta encuesta');
        }
      }
      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, id));
      const options = await this.optionsFor(db, id);
      const answersByQuestion = new Map(
        dto.answers.map((answer) => [answer.questionId, answer]),
      );
      for (const answer of dto.answers) {
        if (!questions.some((question) => question.id === answer.questionId)) {
          throw new BadRequestException('Respuesta a una pregunta desconocida');
        }
      }
      for (const question of questions) {
        const answer = answersByQuestion.get(question.id);
        if (!answer) {
          if (question.required) {
            throw new BadRequestException(
              `Responde la pregunta obligatoria: "${question.text}"`,
            );
          }
          continue;
        }
        if (question.type === 'escala') {
          if (answer.scaleValue === undefined) {
            throw new BadRequestException(
              `Falta el valor de la escala en: "${question.text}"`,
            );
          }
          if (
            answer.scaleValue < (question.scaleMin ?? 1) ||
            answer.scaleValue > (question.scaleMax ?? 5)
          ) {
            throw new BadRequestException(
              `Valor fuera de la escala en: "${question.text}"`,
            );
          }
          continue;
        }
        const selected = [...new Set(answer.optionIds ?? [])];
        if (question.type === 'unica' && selected.length !== 1) {
          throw new BadRequestException(
            `Selecciona exactamente una opción en: "${question.text}"`,
          );
        }
        if (question.type === 'multiple' && selected.length < 1) {
          throw new BadRequestException(
            `Selecciona al menos una opción en: "${question.text}"`,
          );
        }
        for (const optionId of selected) {
          if (
            !options.some(
              (option) =>
                option.id === optionId && option.questionId === question.id,
            )
          ) {
            throw new BadRequestException(
              `Opción inválida en: "${question.text}"`,
            );
          }
        }
      }
      const [response] = await db
        .insert(surveyResponses)
        .values({
          centerId,
          surveyId: id,
          learnerId: survey.anonymous ? null : learner.id,
          groupId: learner.groupId,
        })
        .returning();
      const values: (typeof surveyAnswers.$inferInsert)[] = [];
      for (const question of questions) {
        const answer = answersByQuestion.get(question.id);
        if (!answer) {
          continue;
        }
        if (question.type === 'escala') {
          values.push({
            centerId,
            responseId: response.id,
            questionId: question.id,
            optionId: null,
            scaleValue: answer.scaleValue ?? null,
          });
          continue;
        }
        for (const optionId of new Set(answer.optionIds ?? [])) {
          values.push({
            centerId,
            responseId: response.id,
            questionId: question.id,
            optionId,
            scaleValue: null,
          });
        }
      }
      await db.insert(surveyAnswers).values(values);
      return { anonymous: survey.anonymous, responseId: response.id };
    });
    // En encuestas anónimas no se audita la autoría: correlacionar usuario y
    // momento con una respuesta rompería el anonimato por diseño (RN-08).
    if (!result.anonymous) {
      await this.audit.record({
        action: 'survey.response_submitted',
        entity: 'survey',
        entityId: id,
        actorId: actor.id,
        actorEmail: actor.email,
        centerId,
        detail: { responseId: result.responseId },
      });
    }
    return { ok: true, anonymous: result.anonymous };
  }

  /** CU-29 / RF-35: resultados agregados por pregunta y segmento. */
  async results(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [survey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1);
      if (!survey) {
        throw new NotFoundException('Encuesta no encontrada');
      }
      const responses = await db
        .select()
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, id));
      const responseIds = responses.map((response) => response.id);
      const answers = responseIds.length
        ? await db
            .select()
            .from(surveyAnswers)
            .where(inArray(surveyAnswers.responseId, responseIds))
        : [];
      const questions = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.surveyId, id))
        .orderBy(asc(surveyQuestions.position));
      const options = await this.optionsFor(db, id);

      const byGroup = new Map<string, typeof responses>();
      for (const response of responses) {
        if (!response.groupId) {
          continue;
        }
        const bucket = byGroup.get(response.groupId) ?? [];
        bucket.push(response);
        byGroup.set(response.groupId, bucket);
      }
      const groupIds = [...byGroup.keys()];
      const groupRows = groupIds.length
        ? await db.select().from(groups).where(inArray(groups.id, groupIds))
        : [];
      const segments = [];
      let hiddenSegments = 0;
      for (const [groupId, groupResponses] of byGroup) {
        // FA-1 (CU-29 + RN-08): en anónimas se oculta todo desglose por
        // debajo del umbral para que no sea reidentificable.
        if (survey.anonymous && groupResponses.length < survey.minResponses) {
          hiddenSegments += 1;
          continue;
        }
        const group = groupRows.find((row) => row.id === groupId);
        const groupResponseIds = new Set(
          groupResponses.map((response) => response.id),
        );
        segments.push({
          groupId,
          groupCode: group?.code ?? null,
          journey: group?.journey ?? null,
          responses: groupResponses.length,
          questions: aggregateQuestions(
            questions,
            options,
            answers.filter((answer) => groupResponseIds.has(answer.responseId)),
          ),
        });
      }
      return {
        survey: {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          anonymous: survey.anonymous,
          status: survey.status,
          minResponses: survey.minResponses,
          publishedAt: survey.publishedAt,
        },
        totalResponses: responses.length,
        questions: aggregateQuestions(questions, options, answers),
        segments,
        hiddenSegments,
      };
    });
  }

  /** CU-29 FL-3: exporta los resultados agregados a CSV para el informe. */
  async exportCsv(id: string, actor: AuthenticatedUser) {
    const data = await this.results(id, actor);
    const lines = ['Pregunta,Tipo,Respuesta,Total,Porcentaje'];
    for (const question of data.questions) {
      if (question.type === 'escala') {
        for (const item of question.distribution) {
          lines.push(
            [
              csvCell(question.text),
              'escala',
              csvCell(item.value),
              item.count,
              '',
            ].join(','),
          );
        }
        lines.push(
          [
            csvCell(question.text),
            'escala',
            'Promedio',
            question.average ?? '',
            '',
          ].join(','),
        );
        continue;
      }
      for (const option of question.options) {
        lines.push(
          [
            csvCell(question.text),
            question.type,
            csvCell(option.label),
            option.count,
            option.percentage,
          ].join(','),
        );
      }
    }
    lines.push('');
    lines.push(
      `Desglose por ficha (en anónimas se exigen ${data.survey.minResponses} respuestas como mínimo)`,
    );
    lines.push('Ficha,Jornada,Respondientes,Pregunta,Tipo,Respuesta,Total,Porcentaje');
    for (const segment of data.segments) {
      for (const question of segment.questions) {
        if (question.type === 'escala') {
          lines.push(
            [
              csvCell(segment.groupCode ?? ''),
              csvCell(segment.journey ?? ''),
              segment.responses,
              csvCell(question.text),
              'escala',
              `Promedio: ${question.average ?? ''}`,
              question.respondents,
              '',
            ].join(','),
          );
          continue;
        }
        for (const option of question.options) {
          lines.push(
            [
              csvCell(segment.groupCode ?? ''),
              csvCell(segment.journey ?? ''),
              segment.responses,
              csvCell(question.text),
              question.type,
              csvCell(option.label),
              option.count,
              option.percentage,
            ].join(','),
          );
        }
      }
    }
    return {
      filename: `encuesta-${id.slice(0, 8)}.csv`,
      csv: `\uFEFF${lines.join('\n')}`,
    };
  }
}
