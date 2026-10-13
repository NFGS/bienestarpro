import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { DbService } from '../db/db.module';
import { centers } from '../db/schema';
import { CreateCenterDto } from './dto/create-center.dto';
import { UpdateCenterDto } from './dto/update-center.dto';

/** CU-03 / RF-03: administración de centros (multi-tenant). */
@Injectable()
export class CentersService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    if (actor.role === 'superadmin') {
      return this.dbService.db.select().from(centers).orderBy(asc(centers.name));
    }
    if (!actor.centerId) {
      return [];
    }
    return this.dbService.db
      .select()
      .from(centers)
      .where(eq(centers.id, actor.centerId));
  }

  async create(dto: CreateCenterDto, actor: AuthenticatedUser) {
    const [created] = await this.dbService.db
      .insert(centers)
      .values({ name: dto.name, region: dto.region ?? 'Quindío' })
      .returning();
    await this.audit.record({
      action: 'center.created',
      entity: 'center',
      entityId: created.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId: created.id,
      detail: { name: created.name },
    });
    return created;
  }

  async update(id: string, dto: UpdateCenterDto, actor: AuthenticatedUser) {
    const changes: Partial<typeof centers.$inferInsert> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.region !== undefined) {
      changes.region = dto.region;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No hay cambios por aplicar');
    }
    const [updated] = await this.dbService.db
      .update(centers)
      .set(changes)
      .where(eq(centers.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Centro no encontrado');
    }
    await this.audit.record({
      action: 'center.updated',
      entity: 'center',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId: id,
      detail: { changes: dto },
    });
    return updated;
  }
}
