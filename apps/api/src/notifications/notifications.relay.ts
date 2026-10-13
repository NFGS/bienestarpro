import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DelayedError, Queue, Worker } from 'bullmq';
import { and, eq, sql } from 'drizzle-orm';
import IORedis from 'ioredis';
import { DbService } from '../db/db.module';
import { notifications } from '../db/schema';
import { NotificationsService } from './notifications.service';

interface NotificationJobData {
  notificationId: string;
  centerId: string;
}

/**
 * Relay del outbox (ADR-0004): reclama filas de `outbox` de todos los centros
 * (función SECURITY DEFINER con SKIP LOCKED) y publica un job por notificación
 * en la cola BullMQ. Si REDIS_URL no está configurada, procesa en modo directo
 * para no bloquear el desarrollo.
 */
@Injectable()
export class NotificationsRelay implements OnModuleInit, OnModuleDestroy {
  private connection?: IORedis;
  private queue?: Queue<NotificationJobData>;
  private worker?: Worker<NotificationJobData>;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly dbService: DbService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    const url = process.env.REDIS_URL;
    if (url) {
      try {
        this.connection = new IORedis(url, { maxRetriesPerRequest: null });
        this.queue = new Queue<NotificationJobData>('notifications', {
          connection: this.connection,
        });
        this.worker = new Worker<NotificationJobData>(
          'notifications',
          async (job) => this.handleJob(job),
          { connection: this.connection, concurrency: 4 },
        );
        this.worker.on('failed', (job, error) => {
          console.error(
            `[notificaciones] job ${job?.id ?? '?'} falló: ${error.message}`,
          );
        });
      } catch (error) {
        console.warn(
          '[notificaciones] BullMQ no disponible, modo directo:',
          error,
        );
        this.queue = undefined;
        this.worker = undefined;
      }
    } else {
      console.warn('[notificaciones] REDIS_URL no configurada: modo directo');
    }

    this.timer = undefined;
    const autoStart = process.env.NOTIFICATIONS_RELAY_ENABLED !== 'false';
    if (autoStart) {
      this.timer = setInterval(() => {
        void this.tick().catch((error) =>
          console.error('[notificaciones] relay:', error),
        );
      }, 10_000);
      setTimeout(() => {
        void this.tick().catch(() => undefined);
      }, 1500);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.worker?.close().catch(() => undefined);
    await this.queue?.close().catch(() => undefined);
    await this.connection?.quit().catch(() => undefined);
  }

  /** Reclama outbox pendiente y lo publica/procesa. Público para pruebas. */
  async tick(): Promise<number> {
    const claimed = (await this.dbService.db.execute(
      sql`select * from claim_pending_outbox(20)`,
    )) as unknown as { id: string; center_id: string }[];
    if (!Array.isArray(claimed) || claimed.length === 0) {
      return 0;
    }
    let processed = 0;
    for (const box of claimed) {
      processed += await this.processOutboxRow(box.id, box.center_id);
    }
    return processed;
  }

  private async processOutboxRow(
    outboxId: string,
    centerId: string,
  ): Promise<number> {
    const pending = await this.dbService.withTenant(centerId, (db) =>
      db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.outboxId, outboxId),
            eq(notifications.status, 'pendiente'),
          ),
        ),
    );
    if (this.queue) {
      for (const row of pending) {
        await this.queue.add(
          'send',
          { notificationId: row.id, centerId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: 200,
            removeOnFail: 500,
          },
        );
      }
      return pending.length;
    }
    let processed = 0;
    for (const row of pending) {
      await this.notifications.processNotification(row.id, centerId);
      processed += 1;
    }
    return processed;
  }

  private async handleJob(job: {
    data: NotificationJobData;
    token?: string;
    moveToDelayed: (timestamp: number, token: string) => Promise<void>;
  }): Promise<void> {
    const result = await this.notifications.processNotification(
      job.data.notificationId,
      job.data.centerId,
    );
    if (result.outcome === 'deferred' && result.until && job.token) {
      await job.moveToDelayed(new Date(result.until).getTime(), job.token);
      throw new DelayedError();
    }
    if (result.outcome === 'failed') {
      throw new Error('La notificación agotó los canales disponibles');
    }
  }
}
