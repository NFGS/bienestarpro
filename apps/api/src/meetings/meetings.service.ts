import { randomUUID } from 'node:crypto';
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
import { resolveSegmentLearners } from '../common/segments';
import { DbService, type Database } from '../db/db.module';
import {
  groups,
  meetingInvitees,
  meetingMinuteRevisions,
  meetingMinutes,
  meetings,
  users,
} from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateMeetingDto,
  RsvpDto,
  UpdateMeetingDto,
  UpsertMinutesDto,
} from './dto/meetings.dto';

type MeetingRow = typeof meetings.$inferSelect;
type InviteeRow = typeof meetingInvitees.$inferSelect;

const MANAGER_ROLES = ['superadmin', 'coordinacion'];
const HOUR_MS = 60 * 60 * 1000;

/** Fecha y hora de la reunión en hora de Colombia (UTC-5). */
function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(date);
}

function meetingEnd(start: Date, end: Date | null): Date {
  return end ?? new Date(start.getTime() + HOUR_MS);
}

/**
 * CU-30 a CU-33 — RF-36 a RF-39: reuniones y agenda (M8).
 * Convoca personas o fichas, difunde por el hub, gestiona RSVP, recordatorios
 * automáticos y acta versionada con compromisos.
 */
@Injectable()
export class MeetingsService {
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

  private isManager(actor: AuthenticatedUser): boolean {
    return MANAGER_ROLES.includes(actor.role);
  }

  private async validateInvitees(
    db: Database,
    invitees: { inviteeType: string; inviteeId: string }[],
  ): Promise<void> {
    const unique = new Set(
      invitees.map((invitee) => `${invitee.inviteeType}:${invitee.inviteeId}`),
    );
    if (unique.size !== invitees.length) {
      throw new BadRequestException('Hay convocados repetidos');
    }
    const userIds = invitees
      .filter((invitee) => invitee.inviteeType === 'usuario')
      .map((invitee) => invitee.inviteeId);
    if (userIds.length > 0) {
      const found = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, userIds));
      if (found.length !== userIds.length) {
        throw new BadRequestException('Alguno de los convocados no existe');
      }
    }
    const groupIds = invitees
      .filter((invitee) => invitee.inviteeType === 'ficha')
      .map((invitee) => invitee.inviteeId);
    if (groupIds.length > 0) {
      const found = await db
        .select({ id: groups.id })
        .from(groups)
        .where(inArray(groups.id, groupIds));
      if (found.length !== groupIds.length) {
        throw new BadRequestException('Alguna de las fichas convocadas no existe');
      }
    }
  }

  /** CU-30 FA-2: advertencia (no bloqueante) por cruce con otra reunión. */
  private async findConflicts(
    db: Database,
    organizerId: string,
    startsAt: Date,
    endsAt: Date | null,
    excludeId?: string,
  ): Promise<{ id: string; title: string; startsAt: Date }[]> {
    const rows = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.organizerId, organizerId),
          eq(meetings.status, 'agendada'),
        ),
      );
    const end = meetingEnd(startsAt, endsAt);
    return rows
      .filter((row) => {
        if (row.id === excludeId) {
          return false;
        }
        const rowEnd = meetingEnd(row.startsAt, row.endsAt);
        return (
          startsAt.getTime() < rowEnd.getTime() &&
          row.startsAt.getTime() < end.getTime()
        );
      })
      .map((row) => ({ id: row.id, title: row.title, startsAt: row.startsAt }));
  }

  /** Destinatarios del hub: personas convocadas + aprendices de las fichas. */
  private async recipientsFor(
    db: Database,
    invitees: InviteeRow[],
  ): Promise<{ name: string; email: string | null }[]> {
    const map = new Map<string, { name: string; email: string | null }>();
    const userIds = invitees
      .filter((invitee) => invitee.inviteeType === 'usuario')
      .map((invitee) => invitee.inviteeId);
    if (userIds.length > 0) {
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const row of rows) {
        map.set(`u:${row.id}`, { name: row.name, email: row.email });
      }
    }
    const groupIds = invitees
      .filter((invitee) => invitee.inviteeType === 'ficha')
      .map((invitee) => invitee.inviteeId);
    if (groupIds.length > 0) {
      const learners = await resolveSegmentLearners(
        db,
        groupIds.map((groupId) => ({
          segmentType: 'ficha',
          segmentValue: groupId,
        })),
      );
      for (const learner of learners) {
        map.set(`l:${learner.id}`, {
          name: learner.fullName,
          email: learner.email,
        });
      }
    }
    return [...map.values()];
  }

  private async notify(
    db: Database,
    centerId: string,
    meeting: MeetingRow,
    action: 'agendada' | 'actualizada' | 'cancelada' | 'recordatorio' | 'acta',
    invitees: InviteeRow[],
    note?: string,
  ): Promise<number> {
    const recipients = await this.recipientsFor(db, invitees);
    if (recipients.length === 0) {
      return 0;
    }
    const when = formatWhen(meeting.startsAt);
    const suffix = note ? ` Motivo: ${note}` : '';
    const detail =
      action === 'cancelada'
        ? `Reunión cancelada: ${meeting.title} (${when}).${suffix}`
        : action === 'recordatorio'
          ? `Recordatorio: ${meeting.title} — ${when} en ${meeting.location}. Confirma tu asistencia.`
          : action === 'acta'
            ? `Acta disponible: ${meeting.title} (${when}).`
            : `Reunión ${action}: ${meeting.title} — ${when} en ${meeting.location}.`;
    const enqueued = await this.notifications.enqueue({
      centerId,
      eventType: 'generico',
      recipients,
      payload: { detail, critical: false },
    });
    return enqueued.queued;
  }

  async list(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const rows = await db
        .select()
        .from(meetings)
        .orderBy(desc(meetings.startsAt));
      if (rows.length === 0) {
        return [];
      }
      const ids = rows.map((row) => row.id);
      const inviteeRows = await db
        .select()
        .from(meetingInvitees)
        .where(inArray(meetingInvitees.meetingId, ids));
      const minutesRows = await db
        .select({ meetingId: meetingMinutes.meetingId })
        .from(meetingMinutes)
        .where(inArray(meetingMinutes.meetingId, ids));
      const organizerIds = [...new Set(rows.map((row) => row.organizerId))];
      const organizerRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, organizerIds));
      return rows.map((meeting) => {
        const own = inviteeRows.filter(
          (invitee) => invitee.meetingId === meeting.id,
        );
        const people = own.filter(
          (invitee) => invitee.inviteeType === 'usuario',
        );
        return {
          ...meeting,
          organizerName:
            organizerRows.find((row) => row.id === meeting.organizerId)?.name ??
            null,
          inviteesTotal: own.length,
          groupsTotal: own.length - people.length,
          confirmed: people.filter((row) => row.rsvpStatus === 'confirmado')
            .length,
          pending: people.filter((row) => row.rsvpStatus === 'pendiente').length,
          rejected: people.filter((row) => row.rsvpStatus === 'rechazado')
            .length,
          hasMinutes: minutesRows.some(
            (row) => row.meetingId === meeting.id,
          ),
        };
      });
    });
  }

  /** CU-31: reuniones donde el actor fue convocado como persona. */
  async invited(actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const invites = await db
        .select()
        .from(meetingInvitees)
        .where(
          and(
            eq(meetingInvitees.inviteeType, 'usuario'),
            eq(meetingInvitees.inviteeId, actor.id),
          ),
        );
      if (invites.length === 0) {
        return [];
      }
      const meetingIds = invites.map((invite) => invite.meetingId);
      const rows = await db
        .select()
        .from(meetings)
        .where(inArray(meetings.id, meetingIds))
        .orderBy(asc(meetings.startsAt));
      const minutesRows = await db
        .select({ meetingId: meetingMinutes.meetingId })
        .from(meetingMinutes)
        .where(inArray(meetingMinutes.meetingId, meetingIds));
      return rows.map((meeting) => ({
        ...meeting,
        myRsvpStatus:
          invites.find((invite) => invite.meetingId === meeting.id)?.rsvpStatus ??
          'pendiente',
        hasMinutes: minutesRows.some((row) => row.meetingId === meeting.id),
      }));
    });
  }

  async create(dto: CreateMeetingDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la de inicio',
      );
    }
    const result = await this.dbService.withTenant(centerId, async (db) => {
      await this.validateInvitees(db, dto.invitees);
      const conflicts = await this.findConflicts(
        db,
        actor.id,
        startsAt,
        endsAt,
      );
      const [meeting] = await db
        .insert(meetings)
        .values({
          centerId,
          title: dto.title,
          description: dto.description ?? '',
          startsAt,
          endsAt,
          location: dto.location,
          organizerId: actor.id,
          reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null,
        })
        .returning();
      const invitees = await db
        .insert(meetingInvitees)
        .values(
          dto.invitees.map((invitee) => ({
            centerId,
            meetingId: meeting.id,
            inviteeType: invitee.inviteeType,
            inviteeId: invitee.inviteeId,
          })),
        )
        .returning();
      const queued = await this.notify(
        db,
        centerId,
        meeting,
        'agendada',
        invitees,
      );
      return { meeting, conflicts, queued };
    });
    await this.audit.record({
      action: 'meeting.created',
      entity: 'meeting',
      entityId: result.meeting.id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: {
        invitees: dto.invitees.length,
        conflicts: result.conflicts.length,
        queued: result.queued,
      },
    });
    return {
      ...result.meeting,
      conflicts: result.conflicts,
      notificationsQueued: result.queued,
    };
  }

  async get(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    return this.dbService.withTenant(centerId, async (db) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!meeting) {
        throw new NotFoundException('Reunión no encontrada');
      }
      const inviteeRows = await db
        .select()
        .from(meetingInvitees)
        .where(eq(meetingInvitees.meetingId, id))
        .orderBy(asc(meetingInvitees.createdAt));
      const myInvite = inviteeRows.find(
        (invitee) =>
          invitee.inviteeType === 'usuario' && invitee.inviteeId === actor.id,
      );
      if (!this.isManager(actor) && !myInvite) {
        throw new ForbiddenException('No tienes acceso a esta reunión');
      }
      const userIds = inviteeRows
        .filter((invitee) => invitee.inviteeType === 'usuario')
        .map((invitee) => invitee.inviteeId);
      const userRows = userIds.length
        ? await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];
      const groupIds = inviteeRows
        .filter((invitee) => invitee.inviteeType === 'ficha')
        .map((invitee) => invitee.inviteeId);
      const groupRows = groupIds.length
        ? await db
            .select({ id: groups.id, code: groups.code })
            .from(groups)
            .where(inArray(groups.id, groupIds))
        : [];
      const [organizer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, meeting.organizerId))
        .limit(1);
      const [minutes] = await db
        .select()
        .from(meetingMinutes)
        .where(eq(meetingMinutes.meetingId, id))
        .limit(1);
      let minutesRevisions = 0;
      if (minutes) {
        const [count] = await db
          .select({ total: sql<number>`count(*)::int` })
          .from(meetingMinuteRevisions)
          .where(eq(meetingMinuteRevisions.minutesId, minutes.id));
        minutesRevisions = count?.total ?? 0;
      }
      return {
        ...meeting,
        organizerName: organizer?.name ?? null,
        myRsvpStatus: myInvite?.rsvpStatus ?? null,
        invitees: inviteeRows.map((invitee) => ({
          id: invitee.id,
          inviteeType: invitee.inviteeType,
          inviteeId: invitee.inviteeId,
          rsvpStatus: invitee.rsvpStatus,
          respondedAt: invitee.respondedAt,
          name:
            invitee.inviteeType === 'usuario'
              ? (userRows.find((row) => row.id === invitee.inviteeId)?.name ??
                null)
              : null,
          email:
            invitee.inviteeType === 'usuario'
              ? (userRows.find((row) => row.id === invitee.inviteeId)?.email ??
                null)
              : null,
          groupCode:
            invitee.inviteeType === 'ficha'
              ? (groupRows.find((row) => row.id === invitee.inviteeId)?.code ??
                null)
              : null,
        })),
        minutes: minutes ?? null,
        minutesRevisions,
      };
    });
  }

  async update(id: string, dto: UpdateMeetingDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Reunión no encontrada');
      }
      if (current.status !== 'agendada') {
        throw new ConflictException('Solo se puede editar una reunión agendada');
      }
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
      const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
      if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
        throw new BadRequestException(
          'La hora de fin debe ser posterior a la de inicio',
        );
      }
      const reminderAt = dto.reminderAt
        ? new Date(dto.reminderAt)
        : current.reminderAt;
      const dateChanged = startsAt.getTime() !== current.startsAt.getTime();
      const reminderChanged =
        dto.reminderAt !== undefined &&
        (reminderAt?.getTime() ?? null) !==
          (current.reminderAt?.getTime() ?? null);
      let invitees = await db
        .select()
        .from(meetingInvitees)
        .where(eq(meetingInvitees.meetingId, id));
      if (dto.invitees) {
        await this.validateInvitees(db, dto.invitees);
        await db
          .delete(meetingInvitees)
          .where(eq(meetingInvitees.meetingId, id));
        invitees = await db
          .insert(meetingInvitees)
          .values(
            dto.invitees.map((invitee) => ({
              centerId,
              meetingId: id,
              inviteeType: invitee.inviteeType,
              inviteeId: invitee.inviteeId,
            })),
          )
          .returning();
      }
      const [updated] = await db
        .update(meetings)
        .set({
          title: dto.title ?? current.title,
          description: dto.description ?? current.description,
          startsAt,
          endsAt,
          location: dto.location ?? current.location,
          reminderAt,
          reminderSentAt: reminderChanged ? null : current.reminderSentAt,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, id))
        .returning();
      // Si cambia la fecha, las respuestas previas dejan de ser válidas.
      if (dateChanged) {
        await db
          .update(meetingInvitees)
          .set({ rsvpStatus: 'pendiente', respondedAt: null })
          .where(eq(meetingInvitees.meetingId, id));
      }
      const conflicts = await this.findConflicts(
        db,
        current.organizerId,
        startsAt,
        endsAt,
        id,
      );
      const queued = await this.notify(
        db,
        centerId,
        updated,
        'actualizada',
        invitees,
      );
      return { updated, conflicts, queued, dateChanged };
    });
    await this.audit.record({
      action: 'meeting.updated',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { dateChanged: result.dateChanged, queued: result.queued },
    });
    return {
      ...result.updated,
      conflicts: result.conflicts,
      rsvpReset: result.dateChanged,
      notificationsQueued: result.queued,
    };
  }

  /** CU-30 FA-1: cancela y notifica la actualización a los convocados. */
  async cancel(id: string, reason: string | undefined, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Reunión no encontrada');
      }
      if (current.status !== 'agendada') {
        throw new ConflictException('La reunión ya no está agendada');
      }
      const [updated] = await db
        .update(meetings)
        .set({ status: 'cancelada', updatedAt: new Date() })
        .where(eq(meetings.id, id))
        .returning();
      const invitees = await db
        .select()
        .from(meetingInvitees)
        .where(eq(meetingInvitees.meetingId, id));
      const queued = await this.notify(
        db,
        centerId,
        updated,
        'cancelada',
        invitees,
        reason,
      );
      return { updated, queued };
    });
    await this.audit.record({
      action: 'meeting.cancelled',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { reason: reason ?? null, queued: result.queued },
    });
    return { ...result.updated, notificationsQueued: result.queued };
  }

  /** Marca la reunión como realizada (habilita el acta, CU-33). */
  async complete(id: string, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [current] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!current) {
        throw new NotFoundException('Reunión no encontrada');
      }
      if (current.status !== 'agendada') {
        throw new ConflictException('La reunión ya no está agendada');
      }
      const [row] = await db
        .update(meetings)
        .set({ status: 'realizada', updatedAt: new Date() })
        .where(eq(meetings.id, id))
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'meeting.completed',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
    });
    return updated;
  }

  /** CU-31: RSVP del convocado (FA-1: puede cambiar la respuesta). */
  async rsvp(id: string, dto: RsvpDto, actor: AuthenticatedUser) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!meeting) {
        throw new NotFoundException('Reunión no encontrada');
      }
      if (meeting.status === 'cancelada') {
        throw new ConflictException(
          'La reunión fue cancelada: la confirmación está deshabilitada',
        );
      }
      if (meeting.status === 'realizada') {
        throw new ConflictException('La reunión ya se realizó');
      }
      const [invite] = await db
        .select()
        .from(meetingInvitees)
        .where(
          and(
            eq(meetingInvitees.meetingId, id),
            eq(meetingInvitees.inviteeType, 'usuario'),
            eq(meetingInvitees.inviteeId, actor.id),
          ),
        )
        .limit(1);
      if (!invite) {
        throw new ForbiddenException('No fuiste convocado a esta reunión');
      }
      const [row] = await db
        .update(meetingInvitees)
        .set({ rsvpStatus: dto.status, respondedAt: new Date() })
        .where(eq(meetingInvitees.id, invite.id))
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'meeting.rsvp',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { status: dto.status },
    });
    return updated;
  }

  /**
   * CU-33: registra o actualiza el acta (FA-1: cada edición conserva la
   * versión anterior en el historial). Al crearla se notifica "acta
   * disponible" a los convocados.
   */
  async upsertMinutes(
    id: string,
    dto: UpsertMinutesDto,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const result = await this.dbService.withTenant(centerId, async (db) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, id))
        .limit(1);
      if (!meeting) {
        throw new NotFoundException('Reunión no encontrada');
      }
      if (meeting.status !== 'realizada') {
        throw new ConflictException(
          'Marca la reunión como realizada antes de registrar el acta',
        );
      }
      const [existing] = await db
        .select()
        .from(meetingMinutes)
        .where(eq(meetingMinutes.meetingId, id))
        .limit(1);
      let minutes;
      let created = false;
      let queued = 0;
      if (existing) {
        await db.insert(meetingMinuteRevisions).values({
          centerId,
          minutesId: existing.id,
          topics: existing.topics,
          attendees: existing.attendees,
          commitments: existing.commitments,
          editedBy: actor.id,
        });
        const merged = dto.commitments.map((commitment) => {
          const previous = commitment.id
            ? existing.commitments.find((item) => item.id === commitment.id)
            : undefined;
          return {
            id: commitment.id ?? randomUUID(),
            text: commitment.text,
            done: previous?.done ?? commitment.done ?? false,
          };
        });
        [minutes] = await db
          .update(meetingMinutes)
          .set({
            topics: dto.topics,
            attendees: dto.attendees,
            commitments: merged,
            updatedAt: new Date(),
          })
          .where(eq(meetingMinutes.id, existing.id))
          .returning();
      } else {
        [minutes] = await db
          .insert(meetingMinutes)
          .values({
            centerId,
            meetingId: id,
            topics: dto.topics,
            attendees: dto.attendees,
            commitments: dto.commitments.map((commitment) => ({
              id: commitment.id ?? randomUUID(),
              text: commitment.text,
              done: commitment.done ?? false,
            })),
            authorId: actor.id,
          })
          .returning();
        created = true;
        const invitees = await db
          .select()
          .from(meetingInvitees)
          .where(eq(meetingInvitees.meetingId, id));
        queued = await this.notify(db, centerId, meeting, 'acta', invitees);
      }
      return { minutes, created, queued };
    });
    await this.audit.record({
      action: 'meeting.minutes_saved',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { created: result.created },
    });
    return { ...result.minutes, notificationsQueued: result.queued };
  }

  /** CU-33: marca un compromiso como cumplido (o lo revierte). */
  async updateCommitment(
    id: string,
    commitmentId: string,
    done: boolean,
    actor: AuthenticatedUser,
  ) {
    const centerId = this.tenant(actor);
    const updated = await this.dbService.withTenant(centerId, async (db) => {
      const [minutes] = await db
        .select()
        .from(meetingMinutes)
        .where(eq(meetingMinutes.meetingId, id))
        .limit(1);
      if (!minutes) {
        throw new NotFoundException('El acta no existe');
      }
      if (
        !minutes.commitments.some((commitment) => commitment.id === commitmentId)
      ) {
        throw new NotFoundException('Compromiso no encontrado');
      }
      const commitments = minutes.commitments.map((commitment) =>
        commitment.id === commitmentId ? { ...commitment, done } : commitment,
      );
      const [row] = await db
        .update(meetingMinutes)
        .set({ commitments, updatedAt: new Date() })
        .where(eq(meetingMinutes.id, minutes.id))
        .returning();
      return row;
    });
    await this.audit.record({
      action: 'meeting.commitment_updated',
      entity: 'meeting',
      entityId: id,
      actorId: actor.id,
      actorEmail: actor.email,
      centerId,
      detail: { commitmentId, done },
    });
    return updated;
  }

  /**
   * CU-32: envía recordatorios de las reuniones vencidas a los convocados sin
   * confirmar (FA-1: las canceladas no se procesan; FA-2: los confirmados se
   * excluyen; las fichas no tienen RSVP y reciben siempre).
   */
  async runReminders(): Promise<number> {
    const claimed = (await this.dbService.db.execute(
      sql`select * from claim_due_meeting_reminders(20)`,
    )) as unknown as { id: string; center_id: string }[];
    if (!Array.isArray(claimed) || claimed.length === 0) {
      return 0;
    }
    let processed = 0;
    for (const row of claimed) {
      try {
        await this.dbService.withTenant(row.center_id, async (db) => {
          const [meeting] = await db
            .select()
            .from(meetings)
            .where(eq(meetings.id, row.id))
            .limit(1);
          if (!meeting) {
            return;
          }
          const invitees = await db
            .select()
            .from(meetingInvitees)
            .where(eq(meetingInvitees.meetingId, meeting.id));
          const pending = invitees.filter(
            (invitee) =>
              invitee.inviteeType === 'ficha' ||
              invitee.rsvpStatus === 'pendiente',
          );
          await this.notify(db, row.center_id, meeting, 'recordatorio', pending);
        });
        processed += 1;
      } catch (error) {
        console.error('[reuniones] recordatorio:', error);
      }
    }
    return processed;
  }
}
