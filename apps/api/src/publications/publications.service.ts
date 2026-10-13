import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { resolveSegmentLearners, validateSegment } from '../common/segments';
import { DbService } from '../db/db.module';
import {
  publicationMetrics,
  publicationSegments,
  publications,
} from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePublicationDto,
  PublicationMetricDto,
  UpdatePublicationDto,
} from './dto/publications.dto';

/** Fecha de hoy en hora de Colombia (UTC-5) para las métricas por día. */
function todayInColombia(): string {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * CU-25 / CU-26 — RF-30 a RF-32: noticias y campañas (M6).
 * Publicación segmentada; la difusión usa el hub de notificaciones; la
 * analítica es AGREGADA por día (jamás registra lectores individuales).
 */
@Injectable()
export class PublicationsService {
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
        .from(publications)
        .orderBy(desc(publications.createdAt));
      if (rows.length === 0) {
        return [];
      }
      const ids = rows.map((row) => row.id);
      const segments = await db
        .select()
        .from(publicationSegments)
        .where(inArray(publicationSegments.publicationId, ids));
      const totals = await db
        .select({
          publicationId: publicationMetrics.publicationId,
          views: sql<number>`coalesce(sum(${publicationMetrics.views}), 0)::int`,
          reads: sql<number>`coalesce(sum(${publicationMetrics.reads}), 0)::int`,
          clicks: sql<number>`coalesce(sum(${publicationMetrics.clicks}), 0)::int`,
        })
        .from(publicationMetrics)
        .where(inArray(publicationMetrics.publicationId, ids))
        .groupBy(publicationMetrics.publicationId);
      return rows.map((publication) => ({
        ...publication,
        segments: segments
          .filter((segment) => segment.publicationId === publication.id)
          .map((segment) => ({
            segmentType: segment.segmentType,
            segmentValue: segment.segmentValue,
          })),
        totals: totals.find((total) => total.publicationId === publication.id) ?? {
          views: 0,
          reads: 0,
          clicks: 0,
        },
      }));
    });
  }

  async create(dto: CreatePublicationDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      for (const segment of dto.segments ?? []) {
        await validateSegment(db, segment);
      }
      const [row] = await db
        .insert(publications)
        .values({
          centerId,
          type: dto.type,
          title: dto.title,
          content: dto.content,
          authorId: actor.id,
        })
        .returning();
      if (dto.segments && dto.segments.length > 0) {
        await db.insert(publicationSegments).values(
          dto.segments.map((segment) => ({
            centerId,
            publicationId: row.id,
            segmentType: segment.segmentType,
            segmentValue: segment.segmentValue,
          })),
        );
      }
      return row;
    });
    await this.audit.record({
      action: 'publication.created',
      entity: 'publication',
      entityId: created.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { type: created.type, segments: dto.segments?.length ?? 0 },
    });
    return created;
  }

  async update(
    id: string,
    dto: UpdatePublicationDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Publicación no encontrada');
      }
      if (current.status !== 'borrador') {
        throw new ConflictException(
          'Solo se puede editar una publicación en borrador',
        );
      }
      if (dto.title === undefined && dto.content === undefined) {
        throw new BadRequestException('No hay cambios por aplicar');
      }
      const [row] = await db
        .update(publications)
        .set({
          title: dto.title ?? current.title,
          content: dto.content ?? current.content,
        })
        .where(eq(publications.id, id))
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'publication.updated',
      entity: 'publication',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
    });
    return updated;
  }

  async publish(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [publication] = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      if (!publication) {
        throw new NotFoundException('Publicación no encontrada');
      }
      if (publication.status !== 'borrador') {
        throw new ConflictException('La publicación ya fue publicada');
      }
      const segments = await db
        .select()
        .from(publicationSegments)
        .where(eq(publicationSegments.publicationId, id));
      const recipients = (await resolveSegmentLearners(db, segments)).map(
        (learner) => ({ name: learner.fullName, email: learner.email }),
      );
      const [updated] = await db
        .update(publications)
        .set({ status: 'publicada', publishedAt: new Date() })
        .where(eq(publications.id, id))
        .returning();
      return { publication: updated, recipients };
    });

    const enqueued = await this.notifications.enqueue({
      centerId,
      eventType: 'generico',
      recipients: result.recipients,
      payload: {
        detail: `${result.publication.title} — ${result.publication.content.slice(0, 140)}`,
        critical: false,
      },
    });
    await this.audit.record({
      action: 'publication.published',
      entity: 'publication',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: {
        recipients: result.recipients.length,
        queued: enqueued.queued,
      },
    });
    return {
      ...result.publication,
      recipients: result.recipients.length,
      notificationsQueued: enqueued.queued,
    };
  }

  /** CU-26: métrica agregada por día (sin identidad del lector). */
  async addMetric(
    id: string,
    dto: PublicationMetricDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [publication] = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      if (!publication) {
        throw new NotFoundException('Publicación no encontrada');
      }
      if (publication.status !== 'publicada') {
        throw new ConflictException('La publicación no está activa');
      }
      const viewDelta = dto.event === 'view' ? 1 : 0;
      const readDelta = dto.event === 'read' ? 1 : 0;
      const clickDelta = dto.event === 'click' ? 1 : 0;
      await db
        .insert(publicationMetrics)
        .values({
          centerId,
          publicationId: id,
          day: todayInColombia(),
          views: viewDelta,
          reads: readDelta,
          clicks: clickDelta,
        })
        .onConflictDoUpdate({
          target: [publicationMetrics.publicationId, publicationMetrics.day],
          set: {
            views: sql`${publicationMetrics.views} + ${viewDelta}`,
            reads: sql`${publicationMetrics.reads} + ${readDelta}`,
            clicks: sql`${publicationMetrics.clicks} + ${clickDelta}`,
          },
        });
      return { ok: true, event: dto.event };
    });
  }

  async metrics(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [publication] = await db
        .select()
        .from(publications)
        .where(eq(publications.id, id))
        .limit(1);
      if (!publication) {
        throw new NotFoundException('Publicación no encontrada');
      }
      return db
        .select()
        .from(publicationMetrics)
        .where(eq(publicationMetrics.publicationId, id))
        .orderBy(asc(publicationMetrics.day));
    });
  }
}
