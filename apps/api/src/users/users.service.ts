import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'argon2';
import { asc, eq } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { isUniqueViolation } from '../db/db-errors';
import { DbService } from '../db/db.module';
import { users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface PublicUser {
  id: string;
  centerId: string | null;
  document: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
}

function toPublic(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    centerId: row.centerId,
    document: row.document,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
  };
}

/** CU-02 / RF-02: gestión de usuarios y roles (ámbito por centro). */
@Injectable()
export class UsersService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedUser): Promise<PublicUser[]> {
    const rows =
      actor.role === 'superadmin'
        ? await this.dbService.db.select().from(users).orderBy(asc(users.name))
        : await this.dbService.db
            .select()
            .from(users)
            .where(eq(users.centerId, actor.centerId as string))
            .orderBy(asc(users.name));
    return rows.map(toPublic);
  }

  async create(
    dto: CreateUserDto,
    actor: AuthenticatedUser,
  ): Promise<PublicUser> {
    if (actor.role !== 'superadmin' && dto.role === 'superadmin') {
      throw new ForbiddenException(
        'Solo un superadmin puede asignar el rol superadmin',
      );
    }
    const centerId =
      actor.role === 'superadmin' ? (dto.centerId ?? actor.centerId) : actor.centerId;

    const passwordHash = await hash(dto.password);
    try {
      const [created] = await this.dbService.db
        .insert(users)
        .values({
          centerId,
          document: dto.document,
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash,
          role: dto.role,
        })
        .returning();

      await this.audit.record({
        action: 'user.created',
        entity: 'user',
        entityId: created.id,
        actorId: actor.id,
        actorEmail: actor.email,
        centerId: created.centerId,
        detail: { role: created.role },
      });
      return toPublic(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe un usuario con ese documento o correo',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: AuthenticatedUser,
  ): Promise<PublicUser> {
    const [target] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (target.id === actor.id) {
      throw new BadRequestException(
        'No puedes modificar tu propio rol o estado',
      );
    }
    if (actor.role !== 'superadmin' && target.centerId !== actor.centerId) {
      throw new ForbiddenException(
        'No puedes administrar usuarios de otro centro',
      );
    }
    if (dto.role === 'superadmin' && actor.role !== 'superadmin') {
      throw new ForbiddenException(
        'Solo un superadmin puede asignar el rol superadmin',
      );
    }

    const changes: Partial<typeof users.$inferInsert> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.role !== undefined) {
      changes.role = dto.role;
    }
    if (dto.status !== undefined) {
      changes.status = dto.status;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No hay cambios por aplicar');
    }

    const [updated] = await this.dbService.db
      .update(users)
      .set(changes)
      .where(eq(users.id, id))
      .returning();

    await this.audit.record({
      action: 'user.updated',
      entity: 'user',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId: updated.centerId,
      detail: { changes: dto },
    });
    return toPublic(updated);
  }
}
