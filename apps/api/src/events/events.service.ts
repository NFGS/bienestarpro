import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { DbService } from '../db/db.module';
import { NotificationsService } from '../notifications/notifications.service';
import type { EnqueueRecipient } from '../notifications/notifications.service';
import {
  deliveries,
  eventGroups,
  eventParticipants,
  events,
  groups,
  learners,
} from '../db/schema';
import {
  AdjustQuotaDto,
  CreateEventDto,
  DeliveryDto,
  EventQueryDto,
  PublicConfirmationDto,
  PublishEventDto,
} from './dto/events.dto';

/** Enlace de confirmación que viaja en la convocatoria (RF-15). */
function buildConfirmUrl(qrToken: string): string {
  const base = process.env.PUBLIC_CONFIRM_BASE_URL;
  return base ? `${base}?token=${qrToken}` : `token de confirmación: ${qrToken}`;
}

/**
 * CU-10 a CU-17 / RF-12 a RF-21 — Refrigerios (M1).
 * Reglas provisionales hasta el discovery: un refrigerio por aprendiz activo
 * de las fichas de la jornada del evento; el snapshot queda congelado al
 * publicar (RF-13) y se ajusta con motivo auditado (RF-16).
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private tenant(actor: AuthenticatedUser): string {
    if (!actor.centerId) {
      throw new ForbiddenException('Tu usuario no tiene centro asignado');
    }
    return actor.centerId;
  }

  private async auditChange(
    actor: AuthenticatedUser,
    action: string,
    entityId: string,
    centerId: string,
    detail?: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      action,
      entity: 'event',
      entityId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: detail ?? null,
    });
  }

  // ---------- RF-12 / RF-13: crear y publicar ----------

  async create(dto: CreateEventDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .insert(events)
        .values({
          centerId,
          date: dto.date,
          journey: dto.journey,
          confirmationDeadline: dto.confirmationDeadline
            ? new Date(dto.confirmationDeadline)
            : null,
        })
        .returning();
      return row;
    });
    await this.auditChange(actor, 'event.created', created.id, centerId, {
      date: created.date,
      journey: created.journey,
    });
    return created;
  }

  async publish(
    id: string,
    dto: PublishEventDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const recipients: EnqueueRecipient[] = [];
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      if (event.status !== 'borrador') {
        throw new ConflictException('El evento ya fue publicado');
      }

      const journeyGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.journey, event.journey))
        .orderBy(asc(groups.code));
      if (journeyGroups.length === 0) {
        throw new BadRequestException(
          'No hay fichas registradas en esa jornada',
        );
      }

      const snapshotGroups: {
        groupId: string;
        code: string;
        learnerCount: number;
      }[] = [];
      const participants: {
        centerId: string;
        eventId: string;
        learnerId: string;
        qrToken: string;
      }[] = [];

      for (const group of journeyGroups) {
        const activeLearners = await db
          .select()
          .from(learners)
          .where(
            and(eq(learners.groupId, group.id), eq(learners.status, 'activo')),
          );
        await db.insert(eventGroups).values({
          centerId,
          eventId: id,
          groupId: group.id,
          calculatedQuota: activeLearners.length,
        });
        snapshotGroups.push({
          groupId: group.id,
          code: group.code,
          learnerCount: activeLearners.length,
        });
        for (const learner of activeLearners) {
          const qrToken = randomUUID();
          participants.push({
            centerId,
            eventId: id,
            learnerId: learner.id,
            qrToken,
          });
          recipients.push({
            name: learner.fullName,
            email: learner.email ?? null,
            payload: { confirmUrl: buildConfirmUrl(qrToken) },
          });
        }
      }

      if (participants.length === 0) {
        throw new BadRequestException(
          'No hay aprendices activos en las fichas de esa jornada',
        );
      }

      await db.insert(eventParticipants).values(participants);

      // Ventana de confirmación provisional (el discovery define la regla final):
      // por defecto, 12 horas antes del inicio del día del evento (UTC-5).
      const deadline = dto.confirmationDeadline
        ? new Date(dto.confirmationDeadline)
        : new Date(
            new Date(`${event.date}T00:00:00-05:00`).getTime() -
              12 * 3600 * 1000,
          );

      const [updated] = await db
        .update(events)
        .set({
          status: 'activo',
          publishedAt: new Date(),
          confirmationDeadline: deadline,
          rulesSnapshot: {
            rule: 'una-racion-por-aprendiz-activo',
            generatedAt: new Date().toISOString(),
            totalPlanned: participants.length,
            groups: snapshotGroups,
          },
        })
        .where(eq(events.id, id))
        .returning();

      return { event: updated, participants: participants.length };
    });

    await this.auditChange(actor, 'event.published', id, centerId, {
      participants: result.participants,
    });

    // RF-14 / RF-22: la convocatoria entra al hub multicanal por el outbox.
    const enqueued = await this.notifications.enqueue({
      centerId,
      eventType: 'evento_convocatoria',
      eventId: id,
      recipients,
      payload: {
        eventId: id,
        date: result.event.date,
        journey: result.event.journey,
        critical: false,
      },
    });
    await this.auditChange(
      actor,
      'event.notifications_enqueued',
      id,
      centerId,
      { queued: enqueued.queued },
    );
    return { ...result, notificationsQueued: enqueued.queued };
  }

  // ---------- Consultas ----------

  async list(actor: AuthenticatedUser, query: EventQueryDto) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const conditions = [];
      if (query.status) {
        conditions.push(eq(events.status, query.status));
      }
      const eventRows = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(desc(events.date), desc(events.createdAt));
      if (eventRows.length === 0) {
        return [];
      }
      const ids = eventRows.map((event) => event.id);
      const quotaRows = await db
        .select()
        .from(eventGroups)
        .where(inArray(eventGroups.eventId, ids));
      const statusRows = await db
        .select({
          eventId: eventParticipants.eventId,
          status: eventParticipants.status,
          total: count(),
        })
        .from(eventParticipants)
        .where(inArray(eventParticipants.eventId, ids))
        .groupBy(eventParticipants.eventId, eventParticipants.status);

      return eventRows.map((event) => {
        const groupsOfEvent = quotaRows.filter(
          (row) => row.eventId === event.id,
        );
        const planned = groupsOfEvent.reduce(
          (sum, row) => sum + (row.adjustedQuota ?? row.calculatedQuota),
          0,
        );
        const participants = statusRows.filter(
          (row) => row.eventId === event.id,
        );
        return {
          ...event,
          planned,
          participantsByStatus: Object.fromEntries(
            participants.map((row) => [row.status, row.total]),
          ),
        };
      });
    });
  }

  async getDetail(actor: AuthenticatedUser, id: string) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      const groupRows = await db
        .select({ eventGroup: eventGroups, groupCode: groups.code })
        .from(eventGroups)
        .innerJoin(groups, eq(eventGroups.groupId, groups.id))
        .where(eq(eventGroups.eventId, id))
        .orderBy(asc(groups.code));
      const statusRows = await db
        .select({
          status: eventParticipants.status,
          total: count(),
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, id))
        .groupBy(eventParticipants.status);
      const [deliveryTotals] = await db
        .select({ total: count() })
        .from(deliveries)
        .where(eq(deliveries.eventId, id));
      return {
        ...event,
        groups: groupRows.map((row) => ({
          ...row.eventGroup,
          groupCode: row.groupCode,
        })),
        participantsByStatus: Object.fromEntries(
          statusRows.map((row) => [row.status, row.total]),
        ),
        deliveriesTotal: deliveryTotals?.total ?? 0,
      };
    });
  }

  /** RF-16: ajuste manual de cupos, siempre auditado con motivo. */
  async adjustQuota(
    eventId: string,
    eventGroupId: string,
    dto: AdjustQuotaDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      if (event.status === 'cerrado') {
        throw new ConflictException('El evento está cerrado');
      }
      const [row] = await db
        .select()
        .from(eventGroups)
        .where(
          and(
            eq(eventGroups.id, eventGroupId),
            eq(eventGroups.eventId, eventId),
          ),
        )
        .limit(1);
      if (!row) {
        throw new NotFoundException('Grupo del evento no encontrado');
      }
      const [updatedRow] = await db
        .update(eventGroups)
        .set({ adjustedQuota: dto.quota })
        .where(eq(eventGroups.id, eventGroupId))
        .returning();
      return {
        previous: row.adjustedQuota ?? row.calculatedQuota,
        next: updatedRow.adjustedQuota,
        updatedRow,
      };
    });
    await this.auditChange(actor, 'event.quota_adjusted', eventId, centerId, {
      eventGroupId,
      previous: updated.previous,
      next: updated.next,
      reason: dto.reason,
    });
    return updated.updatedRow;
  }

  // ---------- RF-17 / RF-18: entregas ----------

  /** Búsqueda de participante por documento (para la entrega manual). */
  async searchParticipant(
    actor: AuthenticatedUser,
    eventId: string,
    document: string,
  ) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .select({ participant: eventParticipants, learner: learners })
        .from(eventParticipants)
        .innerJoin(learners, eq(eventParticipants.learnerId, learners.id))
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(learners.document, document),
          ),
        )
        .limit(1);
      if (!row) {
        throw new NotFoundException('Aprendiz no encontrado en el evento');
      }
      return {
        participantId: row.participant.id,
        learnerId: row.learner.id,
        fullName: row.learner.fullName,
        document: row.learner.document,
        status: row.participant.status,
        confirmed: row.participant.status === 'confirmado',
      };
    });
  }

  async registerDelivery(
    eventId: string,
    dto: DeliveryDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const outcome = await this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      if (event.status !== 'activo') {
        throw new ConflictException(
          'El evento no está activo y no admite entregas',
        );
      }

      // Idempotencia para sincronización offline: el mismo clientUuid no duplica.
      const [existing] = await db
        .select()
        .from(deliveries)
        .where(eq(deliveries.clientUuid, dto.clientUuid))
        .limit(1);
      if (existing) {
        return { delivery: existing, idempotent: true };
      }

      let participant;
      if (dto.method === 'qr') {
        if (!dto.qrToken) {
          throw new BadRequestException('La entrega por QR requiere qrToken');
        }
        [participant] = await db
          .select()
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, eventId),
              eq(eventParticipants.qrToken, dto.qrToken),
            ),
          )
          .limit(1);
      } else {
        if (!dto.learnerId || !dto.reason) {
          throw new BadRequestException(
            'La entrega manual requiere learnerId y motivo',
          );
        }
        [participant] = await db
          .select()
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, eventId),
              eq(eventParticipants.learnerId, dto.learnerId),
            ),
          )
          .limit(1);
      }
      if (!participant) {
        throw new NotFoundException('Participante no encontrado en el evento');
      }
      if (participant.status === 'entregado') {
        throw new ConflictException({
          message: 'Este aprendiz ya recibió su refrigerio en el evento',
          code: 'already_delivered',
        });
      }
      const confirmed = participant.status === 'confirmado';
      if (!confirmed && !dto.override) {
        throw new ConflictException({
          message: 'El aprendiz no ha confirmado su asistencia',
          code: 'not_confirmed',
        });
      }
      if (!confirmed && dto.override && !dto.reason) {
        throw new BadRequestException(
          'La entrega excepcional requiere motivo',
        );
      }

      const [delivery] = await db
        .insert(deliveries)
        .values({
          centerId,
          eventId,
          participantId: participant.id,
          method: dto.method,
          registeredBy: actor.id,
          clientUuid: dto.clientUuid,
          reason: dto.reason ?? null,
        })
        .returning();
      await db
        .update(eventParticipants)
        .set({ status: 'entregado' })
        .where(eq(eventParticipants.id, participant.id));
      return { delivery, idempotent: false, override: !confirmed };
    });

    if (!outcome.idempotent) {
      await this.auditChange(actor, 'event.delivery_registered', eventId, centerId, {
        method: dto.method,
        participantId: outcome.delivery.participantId,
        override: outcome.override,
      });
    }
    return outcome;
  }

  // ---------- RF-19: consolidado de cafetería ----------

  async cafeteriaSummary(actor: AuthenticatedUser, eventId: string) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      const groupRows = await db
        .select({ eventGroup: eventGroups, groupCode: groups.code })
        .from(eventGroups)
        .innerJoin(groups, eq(eventGroups.groupId, groups.id))
        .where(eq(eventGroups.eventId, eventId))
        .orderBy(asc(groups.code));
      const statusRows = await db
        .select({
          status: eventParticipants.status,
          total: count(),
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
        .groupBy(eventParticipants.status);
      const statusMap = Object.fromEntries(
        statusRows.map((row) => [row.status, row.total]),
      );
      const groupsSummary = groupRows.map((row) => ({
        eventGroupId: row.eventGroup.id,
        groupCode: row.groupCode,
        calculatedQuota: row.eventGroup.calculatedQuota,
        effectiveQuota:
          row.eventGroup.adjustedQuota ?? row.eventGroup.calculatedQuota,
      }));
      return {
        eventId: event.id,
        date: event.date,
        journey: event.journey,
        status: event.status,
        preparedAt: event.cafeteriaPreparedAt,
        confirmed: statusMap.confirmado ?? 0,
        delivered: statusMap.entregado ?? 0,
        totalToPrepare: groupsSummary.reduce(
          (sum, row) => sum + row.effectiveQuota,
          0,
        ),
        groups: groupsSummary,
      };
    });
  }

  async markPrepared(eventId: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      const [row] = await db
        .update(events)
        .set({ cafeteriaPreparedAt: new Date() })
        .where(eq(events.id, eventId))
        .returning();
      return row;
    });
    await this.auditChange(actor, 'event.cafeteria_prepared', eventId, centerId);
    return updated;
  }

  // ---------- RF-20: cierre ----------

  async close(eventId: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const summary = await this.dbService.withTenant(centerId, async (db) => {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!event) {
        throw new NotFoundException('Evento no encontrado');
      }
      if (event.status !== 'activo') {
        throw new ConflictException('Solo se pueden cerrar eventos activos');
      }

      // Confirmados sin entrega → no reclamados.
      await db
        .update(eventParticipants)
        .set({ status: 'no_reclamado' })
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.status, 'confirmado'),
          ),
        );

      const quotaRows = await db
        .select()
        .from(eventGroups)
        .where(eq(eventGroups.eventId, eventId));
      const planned = quotaRows.reduce(
        (sum, row) => sum + (row.adjustedQuota ?? row.calculatedQuota),
        0,
      );
      const [deliveredRow] = await db
        .select({ total: count() })
        .from(deliveries)
        .where(eq(deliveries.eventId, eventId));
      const [notClaimedRow] = await db
        .select({ total: count() })
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.status, 'no_reclamado'),
          ),
        );
      const delivered = deliveredRow?.total ?? 0;
      const notClaimed = notClaimedRow?.total ?? 0;
      const wastePct =
        planned > 0
          ? Math.round(((planned - delivered) / planned) * 10000) / 100
          : 0;

      const [updated] = await db
        .update(events)
        .set({
          status: 'cerrado',
          closedAt: new Date(),
          closeSummary: {
            planned,
            delivered,
            notClaimed,
            wastePct,
            closedBy: actor.email,
          },
        })
        .where(eq(events.id, eventId))
        .returning();
      return { event: updated, planned, delivered, notClaimed, wastePct };
    });

    await this.auditChange(actor, 'event.closed', eventId, centerId, {
      planned: summary.planned,
      delivered: summary.delivered,
      notClaimed: summary.notClaimed,
      wastePct: summary.wastePct,
    });
    return summary.event;
  }

  // ---------- RF-21: historial por aprendiz ----------

  async learnerHistory(actor: AuthenticatedUser, learnerId: string) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [learner] = await db
        .select()
        .from(learners)
        .where(eq(learners.id, learnerId))
        .limit(1);
      if (!learner) {
        throw new NotFoundException('Aprendiz no encontrado');
      }
      const rows = await db
        .select({
          delivery: deliveries,
          eventDate: events.date,
          eventJourney: events.journey,
        })
        .from(deliveries)
        .innerJoin(
          eventParticipants,
          eq(deliveries.participantId, eventParticipants.id),
        )
        .innerJoin(events, eq(deliveries.eventId, events.id))
        .where(eq(eventParticipants.learnerId, learnerId))
        .orderBy(desc(deliveries.deliveredAt));
      return rows.map((row) => ({
        deliveryId: row.delivery.id,
        deliveredAt: row.delivery.deliveredAt,
        method: row.delivery.method,
        reason: row.delivery.reason,
        eventId: row.delivery.eventId,
        eventDate: row.eventDate,
        eventJourney: row.eventJourney,
      }));
    });
  }

  // ---------- RF-15: confirmación pública por token ----------

  async confirmByToken(dto: PublicConfirmationDto) {
    const result = await this.dbService.db.execute(
      sql`select * from confirm_event_participation(${dto.token}::uuid, ${dto.attending})`,
    );
    const row = (result as unknown as {
      outcome: string;
      participant_id: string | null;
      event_id: string | null;
      center_id: string | null;
      learner_id: string | null;
    }[])[0];

    if (!row || row.outcome === 'token_not_found') {
      throw new NotFoundException('Enlace de confirmación inválido');
    }
    if (row.outcome === 'event_not_active') {
      throw new ConflictException('El evento no está disponible');
    }
    if (row.outcome === 'deadline_passed') {
      throw new ConflictException({
        message: 'El plazo para confirmar terminó',
        code: 'deadline_passed',
      });
    }

    await this.audit.record({
      action: dto.attending
        ? 'event.confirmation_accepted'
        : 'event.confirmation_declined',
      entity: 'event',
      entityId: row.event_id,
      actorId: row.learner_id,
      actorEmail: null,
      centerId: row.center_id,
      detail: { participantId: row.participant_id, via: 'public_token' },
    });

    return {
      outcome: row.outcome,
      attending: dto.attending,
      eventId: row.event_id,
    };
  }
}
