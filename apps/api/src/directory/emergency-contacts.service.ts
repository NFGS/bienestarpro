import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { DbService, type Database } from '../db/db.module';
import { consents, emergencyContacts, learners } from '../db/schema';
import {
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
} from './dto/emergency-contacts.dto';

/**
 * CU-23 / CU-24 — RF-28 y RF-29: contactos de emergencia (M10).
 * Registro solo con consentimiento vigente; acceso por rol mínimo (coordinación
 * y superadmin) y CADA LECTURA queda auditada (ADR-0011 D1).
 */
@Injectable()
export class EmergencyContactsService {
  constructor(
    private readonly dbService: DbService,
    private readonly audit: AuditService,
  ) {}

  private tenant(actor: AuthenticatedUser): string {
    if (!actor.centerId) {
      throw new BadRequestException('Tu usuario no tiene centro asignado');
    }
    return actor.centerId;
  }

  private async requireLearner(db: Database, learnerId: string): Promise<void> {
    const [learner] = await db
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId))
      .limit(1);
    if (!learner) {
      throw new NotFoundException('Aprendiz no encontrado');
    }
  }

  private async requireActiveConsent(
    db: Database,
    learnerId: string,
  ): Promise<void> {
    const [consent] = await db
      .select()
      .from(consents)
      .where(
        and(eq(consents.learnerId, learnerId), isNull(consents.revokedAt)),
      )
      .limit(1);
    if (!consent) {
      throw new BadRequestException(
        'El aprendiz no tiene consentimiento vigente para tratar sus datos',
      );
    }
  }

  async create(
    learnerId: string,
    dto: CreateEmergencyContactDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const created = await this.dbService.withTenant(centerId, async (db) => {
      await this.requireLearner(db, learnerId);
      await this.requireActiveConsent(db, learnerId);
      const [row] = await db
        .insert(emergencyContacts)
        .values({
          centerId,
          learnerId,
          name: dto.name,
          relationship: dto.relationship,
          phone: dto.phone,
        })
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'emergency_contact.created',
      entity: 'learner',
      entityId: learnerId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      // El detalle NO incluye el teléfono ni el nombre del contacto (minimización).
      detail: { relationship: dto.relationship },
    });
    return created;
  }

  /** Lista los contactos y REGISTRA LA LECTURA en la auditoría (RF-29). */
  async list(learnerId: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const rows = await this.dbService.withTenant(centerId, async (db) => {
      await this.requireLearner(db, learnerId);
      return db
        .select()
        .from(emergencyContacts)
        .where(eq(emergencyContacts.learnerId, learnerId))
        .orderBy(asc(emergencyContacts.createdAt));
    });
    await this.audit.record({
      action: 'emergency_contact.read',
      entity: 'learner',
      entityId: learnerId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { contacts: rows.length },
    });
    return rows;
  }

  async update(
    id: string,
    dto: UpdateEmergencyContactDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(emergencyContacts)
        .where(eq(emergencyContacts.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Contacto no encontrado');
      }
      await this.requireActiveConsent(db, current.learnerId);
      const [row] = await db
        .update(emergencyContacts)
        .set({
          name: dto.name ?? current.name,
          relationship: dto.relationship ?? current.relationship,
          phone: dto.phone ?? current.phone,
        })
        .where(eq(emergencyContacts.id, id))
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'emergency_contact.updated',
      entity: 'learner',
      entityId: updated.learnerId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
    });
    return updated;
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const removed = await this.dbService.withTenant(centerId, async (db) => {
      const [row] = await db
        .delete(emergencyContacts)
        .where(eq(emergencyContacts.id, id))
        .returning();
      return row;
    });
    if (!removed) {
      throw new NotFoundException('Contacto no encontrado');
    }
    await this.audit.record({
      action: 'emergency_contact.deleted',
      entity: 'learner',
      entityId: removed.learnerId,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
    });
    return { ok: true };
  }
}
