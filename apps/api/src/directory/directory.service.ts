import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { isUniqueViolation } from '../db/db-errors';
import { DbService } from '../db/db.module';
import {
  consents,
  groupInstructors,
  groups,
  learners,
  programs,
  users,
} from '../db/schema';
import {
  AssignInstructorDto,
  CreateGroupDto,
  GroupQueryDto,
  UpdateGroupDto,
} from './dto/groups.dto';
import {
  CreateLearnerDto,
  GrantConsentDto,
  LearnerQueryDto,
  UpdateLearnerDto,
} from './dto/learners.dto';
import { CreateProgramDto, UpdateProgramDto } from './dto/programs.dto';

/**
 * CU-06 a CU-09 / RF-06 a RF-11 — Directorio maestro (M9).
 * Todas las operaciones pasan por `DbService.withTenant` (contexto RLS).
 */
@Injectable()
export class DirectoryService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
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
    entity: string,
    entityId: string,
    centerId: string,
    detail?: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      action,
      entity,
      entityId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: detail ?? null,
    });
  }

  // ---------- Programas (RF-06) ----------

  async listPrograms(actor: AuthenticatedUser) {
    return this.dbService.withTenant(this.tenant(actor), (db) =>
      db.select().from(programs).orderBy(asc(programs.name)),
    );
  }

  async createProgram(dto: CreateProgramDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .insert(programs)
        .values({ centerId, name: dto.name })
        .returning();
      return row;
    });
    await this.auditChange(actor, 'program.created', 'program', created.id, centerId, {
      name: created.name,
    });
    return created;
  }

  async updateProgram(
    id: string,
    dto: UpdateProgramDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const changes: Partial<typeof programs.$inferInsert> = {};
    if (dto.name !== undefined) {
      changes.name = dto.name;
    }
    if (dto.status !== undefined) {
      changes.status = dto.status;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No hay cambios por aplicar');
    }
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .update(programs)
        .set(changes)
        .where(eq(programs.id, id))
        .returning();
      return row;
    });
    if (!updated) {
      throw new NotFoundException('Programa no encontrado');
    }
    await this.auditChange(actor, 'program.updated', 'program', id, centerId, {
      changes: dto,
    });
    return updated;
  }

  // ---------- Fichas (RF-07, RF-10) ----------

  async listGroups(actor: AuthenticatedUser, query: GroupQueryDto) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const conditions = [];
      if (query.journey) {
        conditions.push(eq(groups.journey, query.journey));
      }
      if (query.programId) {
        conditions.push(eq(groups.programId, query.programId));
      }
      if (actor.role === 'instructor') {
        conditions.push(eq(groupInstructors.instructorId, actor.id));
        const rows = await db
          .select({ group: groups, programName: programs.name })
          .from(groups)
          .innerJoin(programs, eq(groups.programId, programs.id))
          .innerJoin(
            groupInstructors,
            eq(groupInstructors.groupId, groups.id),
          )
          .where(and(...conditions))
          .orderBy(asc(groups.code));
        return rows.map((row) => ({
          ...row.group,
          programName: row.programName,
        }));
      }
      const rows = await db
        .select({ group: groups, programName: programs.name })
        .from(groups)
        .innerJoin(programs, eq(groups.programId, programs.id))
        .where(and(...conditions))
        .orderBy(asc(groups.code));
      return rows.map((row) => ({ ...row.group, programName: row.programName }));
    });
  }

  async getGroupDetail(actor: AuthenticatedUser, id: string) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id))
        .limit(1);
      if (!group) {
        throw new NotFoundException('Ficha no encontrada');
      }
      if (actor.role === 'instructor') {
        const [assignment] = await db
          .select()
          .from(groupInstructors)
          .where(
            and(
              eq(groupInstructors.groupId, id),
              eq(groupInstructors.instructorId, actor.id),
            ),
          )
          .limit(1);
        if (!assignment) {
          throw new NotFoundException('Ficha no encontrada');
        }
      }
      const [program] = await db
        .select()
        .from(programs)
        .where(eq(programs.id, group.programId))
        .limit(1);
      const groupLearners = await db
        .select()
        .from(learners)
        .where(eq(learners.groupId, id))
        .orderBy(asc(learners.fullName));
      const instructorRows = await db
        .select({
          assignment: groupInstructors,
          name: users.name,
          email: users.email,
        })
        .from(groupInstructors)
        .innerJoin(users, eq(groupInstructors.instructorId, users.id))
        .where(eq(groupInstructors.groupId, id));
      const learnerIds = groupLearners.map((learner) => learner.id);
      const consentRows =
        learnerIds.length > 0
          ? await db
              .select()
              .from(consents)
              .where(inArray(consents.learnerId, learnerIds))
          : [];
      return {
        ...group,
        programName: program?.name ?? null,
        learners: groupLearners,
        instructors: instructorRows.map((row) => ({
          id: row.assignment.id,
          instructorId: row.assignment.instructorId,
          roleInGroup: row.assignment.roleInGroup,
          name: row.name,
          email: row.email,
        })),
        consents: consentRows,
      };
    });
  }

  async createGroup(dto: CreateGroupDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    try {
      const created = await this.dbService.withTenant(centerId, async (db) => {
        const [program] = await db
          .select()
          .from(programs)
          .where(eq(programs.id, dto.programId))
          .limit(1);
        if (!program) {
          throw new BadRequestException('El programa indicado no existe');
        }
        const [row] = await db
          .insert(groups)
          .values({
            centerId,
            programId: dto.programId,
            code: dto.code,
            journey: dto.journey,
            startDate: dto.startDate ?? null,
            endDate: dto.endDate ?? null,
          })
          .returning();
        return row;
      });
      await this.auditChange(actor, 'group.created', 'group', created.id, centerId, {
        code: created.code,
        journey: created.journey,
      });
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe una ficha con ese código en el centro',
        );
      }
      throw error;
    }
  }

  async updateGroup(
    id: string,
    dto: UpdateGroupDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const changes: Partial<typeof groups.$inferInsert> = {};
    if (dto.status !== undefined) {
      changes.status = dto.status;
    }
    if (dto.journey !== undefined) {
      changes.journey = dto.journey;
    }
    if (dto.startDate !== undefined) {
      changes.startDate = dto.startDate;
    }
    if (dto.endDate !== undefined) {
      changes.endDate = dto.endDate;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No hay cambios por aplicar');
    }
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .update(groups)
        .set(changes)
        .where(eq(groups.id, id))
        .returning();
      return row;
    });
    if (!updated) {
      throw new NotFoundException('Ficha no encontrada');
    }
    await this.auditChange(actor, 'group.updated', 'group', id, centerId, {
      changes: dto,
    });
    return updated;
  }

  // ---------- Aprendices (RF-08) ----------

  async listLearners(actor: AuthenticatedUser, query: LearnerQueryDto) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const conditions = [];
      if (query.groupId) {
        conditions.push(eq(learners.groupId, query.groupId));
      }
      return db
        .select()
        .from(learners)
        .where(and(...conditions))
        .orderBy(asc(learners.fullName));
    });
  }

  async createLearner(dto: CreateLearnerDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    try {
      const created = await this.dbService.withTenant(centerId, async (db) => {
        const [group] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, dto.groupId))
          .limit(1);
        if (!group) {
          throw new BadRequestException('La ficha indicada no existe');
        }
        const [row] = await db
          .insert(learners)
          .values({
            centerId,
            groupId: dto.groupId,
            document: dto.document,
            fullName: dto.fullName,
            email: dto.email ?? null,
          })
          .returning();
        return row;
      });
      await this.auditChange(
        actor,
        'learner.created',
        'learner',
        created.id,
        centerId,
        { groupId: created.groupId },
      );
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe un aprendiz con ese documento en el centro',
        );
      }
      throw error;
    }
  }

  async updateLearner(
    id: string,
    dto: UpdateLearnerDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const changes: Partial<typeof learners.$inferInsert> = {};
    if (dto.fullName !== undefined) {
      changes.fullName = dto.fullName;
    }
    if (dto.email !== undefined) {
      changes.email = dto.email;
    }
    if (dto.status !== undefined) {
      changes.status = dto.status;
      changes.retiredAt = dto.status === 'retirado' ? new Date() : null;
    }
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No hay cambios por aplicar');
    }
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .update(learners)
        .set(changes)
        .where(eq(learners.id, id))
        .returning();
      return row;
    });
    if (!updated) {
      throw new NotFoundException('Aprendiz no encontrado');
    }
    await this.auditChange(actor, 'learner.updated', 'learner', id, centerId, {
      changes: dto,
    });
    return updated;
  }

  // ---------- Instructores por ficha (RF-09) ----------

  async assignInstructor(
    groupId: string,
    dto: AssignInstructorDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    try {
      const created = await this.dbService.withTenant(centerId, async (db) => {
        const [group] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);
        if (!group) {
          throw new NotFoundException('Ficha no encontrada');
        }
        const [instructor] = await db
          .select()
          .from(users)
          .where(eq(users.id, dto.instructorId))
          .limit(1);
        if (
          !instructor ||
          instructor.role !== 'instructor' ||
          instructor.centerId !== centerId ||
          instructor.status !== 'activo'
        ) {
          throw new BadRequestException(
            'El instructor indicado no es válido para este centro',
          );
        }
        const [row] = await db
          .insert(groupInstructors)
          .values({
            centerId,
            groupId,
            instructorId: dto.instructorId,
            roleInGroup: dto.roleInGroup,
          })
          .returning();
        return row;
      });
      await this.auditChange(
        actor,
        'group.instructor_assigned',
        'group',
        groupId,
        centerId,
        { instructorId: dto.instructorId, roleInGroup: dto.roleInGroup },
      );
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'El instructor ya está asignado a esta ficha',
        );
      }
      throw error;
    }
  }

  async removeInstructor(
    groupId: string,
    assignmentId: string,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const removed = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .delete(groupInstructors)
        .where(
          and(
            eq(groupInstructors.id, assignmentId),
            eq(groupInstructors.groupId, groupId),
          ),
        )
        .returning();
      return row;
    });
    if (!removed) {
      throw new NotFoundException('Asignación no encontrada');
    }
    await this.auditChange(
      actor,
      'group.instructor_removed',
      'group',
      groupId,
      centerId,
      { instructorId: removed.instructorId },
    );
    return { ok: true };
  }

  // ---------- Consentimientos (RF-11) ----------

  async grantConsent(
    learnerId: string,
    dto: GrantConsentDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      const [learner] = await db
        .select()
        .from(learners)
        .where(eq(learners.id, learnerId))
        .limit(1);
      if (!learner) {
        throw new NotFoundException('Aprendiz no encontrado');
      }
      const [row] = await db
        .insert(consents)
        .values({
          centerId,
          learnerId,
          policyVersion: dto.policyVersion,
        })
        .returning();
      return row;
    });
    await this.auditChange(
      actor,
      'consent.granted',
      'learner',
      learnerId,
      centerId,
      { policyVersion: dto.policyVersion },
    );
    return created;
  }

  async revokeConsent(consentId: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .update(consents)
        .set({ revokedAt: new Date() })
        .where(and(eq(consents.id, consentId), isNull(consents.revokedAt)))
        .returning();
      return row;
    });
    if (!updated) {
      throw new NotFoundException('Consentimiento no encontrado o ya revocado');
    }
    await this.auditChange(
      actor,
      'consent.revoked',
      'learner',
      updated.learnerId,
      centerId,
      { consentId },
    );
    return updated;
  }
}
