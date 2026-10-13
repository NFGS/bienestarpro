import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { DbService } from '../db/db.module';
import { auditLog } from '../db/schema';

export interface AuditEntry {
  action: string;
  centerId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  entity?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
}

export interface AuditFilters {
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
  centerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly dbService: DbService) {}

  /**
   * Registra una acción crítica. Nunca interrumpe la operación de negocio:
   * si la bitácora falla, se reporta por consola y se continúa (RF-04).
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.dbService.db.insert(auditLog).values({
        action: entry.action,
        centerId: entry.centerId ?? null,
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        entity: entry.entity ?? null,
        entityId: entry.entityId ?? null,
        detail: entry.detail ?? null,
      });
    } catch (error) {
      console.error('No se pudo registrar la auditoría:', error);
    }
  }

  async list(filters: AuditFilters): Promise<{
    items: (typeof auditLog.$inferSelect)[];
    total: number;
  }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 25));

    const conditions: SQL[] = [];
    if (filters.centerId) {
      conditions.push(eq(auditLog.centerId, filters.centerId));
    }
    if (filters.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }
    if (filters.actorId) {
      conditions.push(eq(auditLog.actorId, filters.actorId));
    }
    if (filters.from) {
      conditions.push(gte(auditLog.createdAt, new Date(filters.from)));
    }
    if (filters.to) {
      conditions.push(lte(auditLog.createdAt, new Date(filters.to)));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [totalRow]] = await Promise.all([
      this.dbService.db
        .select()
        .from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.dbService.db.select({ value: count() }).from(auditLog).where(where),
    ]);

    return { items, total: totalRow?.value ?? 0 };
  }
}
