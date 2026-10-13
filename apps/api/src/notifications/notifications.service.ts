import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { DbService, type Database } from '../db/db.module';
import {
  notificationPreferences,
  notificationTemplates,
  notifications,
  outbox,
} from '../db/schema';
import {
  NOTIFICATION_CHANNELS,
  type PreferencesDto,
} from './dto/notifications.dto';
import {
  DEFAULT_SUBJECTS,
  DEFAULT_TEMPLATES,
  renderContent,
} from './default-templates';
import { buildAdapters } from './adapters';
import type { NotificationChannelAdapter } from './adapters';

export interface EnqueueRecipient {
  userId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Variables adicionales por destinatario (p. ej. confirmUrl único). */
  payload?: Record<string, unknown>;
}

export interface EnqueueParams {
  centerId: string;
  eventType: string;
  eventId?: string | null;
  recipients: EnqueueRecipient[];
  payload: Record<string, unknown>;
}

export interface ProcessResult {
  outcome: 'sent' | 'failed' | 'deferred';
  channel?: string;
  until?: string;
}

const RATE_LIMIT_PER_HOUR = 10;
const QUIET_DEFAULT: [string | null, string | null] = [null, null];

/** CU-18 a CU-21 / RF-22 a RF-26 — Hub de notificaciones (M2). */
@Injectable()
export class NotificationsService {
  private readonly adapters: Map<string, NotificationChannelAdapter>;

  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
  ) {
    this.adapters = new Map(
      buildAdapters().map((adapter) => [adapter.channel, adapter]),
    );
  }

  // ---------- RF-23: plantillas versionadas ----------

  async listTemplates(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, (db) =>
      db
        .select()
        .from(notificationTemplates)
        .orderBy(
          notificationTemplates.type,
          notificationTemplates.channel,
          desc(notificationTemplates.version),
        ),
    );
  }

  async createTemplate(
    dto: { type: string; channel: string; content: string },
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      const [existing] = await db
        .select({ max: sql<number>`coalesce(max(${notificationTemplates.version}), 0)` })
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.type, dto.type),
            eq(notificationTemplates.channel, dto.channel),
          ),
        );
      const [row] = await db
        .insert(notificationTemplates)
        .values({
          centerId,
          type: dto.type,
          channel: dto.channel,
          version: (existing?.max ?? 0) + 1,
          content: dto.content,
        })
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'notification_template.created',
      entity: 'notification_template',
      entityId: created.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { type: created.type, channel: created.channel, version: created.version },
    });
    return created;
  }

  async updateTemplate(
    id: string,
    dto: { content: string },
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Plantilla no encontrada');
      }
      await db
        .update(notificationTemplates)
        .set({ status: 'historica' })
        .where(eq(notificationTemplates.id, id));
      const [row] = await db
        .insert(notificationTemplates)
        .values({
          centerId,
          type: current.type,
          channel: current.channel,
          version: current.version + 1,
          content: dto.content,
        })
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'notification_template.updated',
      entity: 'notification_template',
      entityId: created.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { version: created.version },
    });
    return created;
  }

  // ---------- RF-24: preferencias ----------

  async getMyPreferences(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, actor.id))
        .limit(1);
      return (
        row ?? {
          channels: null,
          quietHoursStart: QUIET_DEFAULT[0],
          quietHoursEnd: QUIET_DEFAULT[1],
        }
      );
    });
  }

  async updateMyPreferences(dto: PreferencesDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    if (
      (dto.quietHoursStart && !dto.quietHoursEnd) ||
      (!dto.quietHoursStart && dto.quietHoursEnd)
    ) {
      throw new BadRequestException(
        'Indica el inicio y el fin del horario silencioso',
      );
    }
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .insert(notificationPreferences)
        .values({
          centerId,
          userId: actor.id,
          channels: dto.channels ?? null,
          quietHoursStart: dto.quietHoursStart ?? null,
          quietHoursEnd: dto.quietHoursEnd ?? null,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            channels: dto.channels ?? null,
            quietHoursStart: dto.quietHoursStart ?? null,
            quietHoursEnd: dto.quietHoursEnd ?? null,
            updatedAt: new Date(),
          },
        })
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'notification_preferences.updated',
      entity: 'user',
      entityId: actor.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { channels: dto.channels ?? null },
    });
    return updated;
  }

  // ---------- RF-22: encolar (outbox) ----------

  async enqueue(params: EnqueueParams): Promise<{ outboxId: string; queued: number }> {
    return this.dbService.withTenant(params.centerId, async (db) => {
      const [box] = await db
        .insert(outbox)
        .values({
          centerId: params.centerId,
          eventType: params.eventType,
          payload: params.payload,
        })
        .returning();
      const rows = params.recipients
        .filter((recipient) => recipient.email || recipient.phone)
        .map((recipient) => ({
          centerId: params.centerId,
          outboxId: box.id,
          eventId: params.eventId ?? null,
          type: params.eventType,
          recipientUserId: recipient.userId ?? null,
          recipientName: recipient.name,
          recipientEmail: recipient.email ?? null,
          recipientPhone: recipient.phone ?? null,
          payload: { ...params.payload, ...recipient.payload },
        }));
      if (rows.length > 0) {
        await db.insert(notifications).values(rows);
      }
      return { outboxId: box.id, queued: rows.length };
    });
  }

  /** Lista de notificaciones de un evento (acuses — RF-26). */
  async listEventNotifications(actor: AuthenticatedUser, eventId: string) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, (db) =>
      db
        .select()
        .from(notifications)
        .where(eq(notifications.eventId, eventId))
        .orderBy(desc(notifications.createdAt)),
    );
  }

  // ---------- Procesamiento (worker) ----------

  /**
   * Procesa una notificación: preferencias → horario silencioso → límite
   * anti-saturación → cascada de canales con adaptadores → acuse (RF-22/26).
   * Público para las pruebas y para el worker de la cola.
   */
  async processNotification(
    notificationId: string,
    centerId: string,
  ): Promise<ProcessResult> {
    return this.dbService.withTenant(centerId, async (db) => {
      const [item] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);
      if (!item) {
        return { outcome: 'failed' };
      }
      if (['sent', 'delivered', 'read'].includes(item.status)) {
        return { outcome: 'sent', channel: item.channelEffective ?? undefined };
      }

      const payload = (item.payload ?? {}) as Record<string, unknown>;
      const critical = payload.critical === true;

      const [preference] = item.recipientUserId
        ? await db
            .select()
            .from(notificationPreferences)
            .where(eq(notificationPreferences.userId, item.recipientUserId))
            .limit(1)
        : [];

      if (
        !critical &&
        preference?.quietHoursStart &&
        preference.quietHoursEnd &&
        isWithinQuietHours(
          preference.quietHoursStart,
          preference.quietHoursEnd,
        )
      ) {
        return {
          outcome: 'deferred',
          until: nextQuietWindowEnd(preference.quietHoursEnd).toISOString(),
        };
      }

      if (item.recipientEmail) {
        const [usage] = await db
          .select({ total: count() })
          .from(notifications)
          .where(
            and(
              eq(notifications.recipientEmail, item.recipientEmail),
              inArray(notifications.status, ['sent', 'delivered', 'read']),
              gte(notifications.updatedAt, new Date(Date.now() - 3600_000)),
            ),
          );
        if ((usage?.total ?? 0) >= RATE_LIMIT_PER_HOUR) {
          return {
            outcome: 'deferred',
            until: new Date(Date.now() + 3600_000).toISOString(),
          };
        }
      }

      const configuredChannels = Array.isArray(preference?.channels)
        ? (preference?.channels as string[])
        : null;
      const order =
        configuredChannels && configuredChannels.length > 0
          ? configuredChannels
          : [...NOTIFICATION_CHANNELS];

      let attempts = item.attempts;
      let lastError: string | null = null;

      for (const channel of order) {
        const adapter = this.adapters.get(channel);
        const to = channel === 'email' ? item.recipientEmail : item.recipientPhone;
        if (!adapter || !to) {
          lastError = `Canal ${channel} sin destino o sin adaptador`;
          continue;
        }
        attempts += 1;
        try {
          const rendered = await this.renderFor(db, centerId, item.type, channel, {
            ...payload,
            name: item.recipientName ?? '',
          });
          await adapter.send({
            to,
            subject: rendered.subject,
            body: rendered.body,
          });
          await db
            .update(notifications)
            .set({
              status: 'sent',
              channelAttempted: channel,
              channelEffective: channel,
              templateVersion: rendered.version,
              attempts,
              lastError: null,
              updatedAt: new Date(),
            })
            .where(eq(notifications.id, notificationId));
          return { outcome: 'sent', channel };
        } catch (error) {
          lastError = `${channel}: ${error instanceof Error ? error.message : 'error'}`;
        }
      }

      await db
        .update(notifications)
        .set({
          status: 'failed',
          attempts,
          lastError,
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, notificationId));
      return { outcome: 'failed' };
    });
  }

  private async renderFor(
    db: Database,
    centerId: string,
    type: string,
    channel: string,
    variables: Record<string, unknown>,
  ): Promise<{ subject: string; body: string; version: number }> {
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          eq(notificationTemplates.centerId, centerId),
          eq(notificationTemplates.type, type),
          eq(notificationTemplates.channel, channel),
          eq(notificationTemplates.status, 'vigente'),
        ),
      )
      .orderBy(desc(notificationTemplates.version))
      .limit(1);
    const content =
      template?.content ?? DEFAULT_TEMPLATES[type] ?? DEFAULT_TEMPLATES.generico;
    return {
      subject: DEFAULT_SUBJECTS[type] ?? DEFAULT_SUBJECTS.generico,
      body: renderContent(content, variables),
      version: template?.version ?? 0,
    };
  }

  private tenant(actor: AuthenticatedUser): string {
    if (!actor.centerId) {
      throw new BadRequestException('Tu usuario no tiene centro asignado');
    }
    return actor.centerId;
  }
}

/** Horario silencioso en formato HH:MM (hora de Colombia, UTC-5). */
export function isWithinQuietHours(
  start: string,
  end: string,
  now: Date = colombiaNow(),
): boolean {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin === endMin) {
    return false;
  }
  if (startMin < endMin) {
    return minutes >= startMin && minutes < endMin;
  }
  return minutes >= startMin || minutes < endMin;
}

/** Hora actual desplazada a UTC-5 para comparar contra horas locales. */
function colombiaNow(): Date {
  return new Date(Date.now() - 5 * 3600 * 1000);
}

export function nextQuietWindowEnd(
  end: string,
  now: Date = colombiaNow(),
): Date {
  const [eh, em] = end.split(':').map(Number);
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), eh, em),
  );
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return new Date(target.getTime() + 5 * 3600 * 1000);
}
