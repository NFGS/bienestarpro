import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Esquema inicial (rebanada 1, M4 Administración).
 *
 * Nota RLS (ADR-0003): las políticas Row-Level Security y el contexto
 * `SET LOCAL app.centro_id` se añaden como migraciones SQL explícitas cuando
 * lleguen las tablas multi-tenant de M9/M1 (ADR-0016, D2). Las tablas de esta
 * rebanada son de identidad (pre-tenant) y se protegen por rol de aplicación.
 */

export const centers = pgTable('centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  region: text('region').notNull().default('Quindío'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id').references(() => centers.id),
  document: text('document').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /** Rol global provisional; el RBAC por ámbito llega con el CRUD de usuarios (RF-02). */
  role: text('role').notNull().default('aprendiz'),
  status: text('status').notNull().default('activo'),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  /** Secreto TOTP cifrado con AES-256-GCM (TOTP_ENCRYPTION_KEY). */
  totpSecret: text('totp_secret'),
  /** Fecha de activación del segundo factor; nulo = no configurado. */
  totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Bitácora de auditoría (RF-04): solo inserción.
 * Registra accesos, cambios de rol y operaciones críticas.
 * `detail` nunca contiene datos sensibles (contraseñas, tokens, contactos).
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id'),
    actorId: uuid('actor_id'),
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: uuid('entity_id'),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_log_created_at_idx').on(table.createdAt),
    index('audit_log_action_idx').on(table.action),
    index('audit_log_actor_idx').on(table.actorId),
  ],
);

/**
 * M9 — Directorio maestro (rebanada 2). Tablas multi-tenant:
 * protegidas con Row-Level Security (ver migración SQL de políticas, ADR-0003).
 * Toda consulta pasa por `DbService.withTenant` (contexto `app.centro_id`).
 */

export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Fichas de formación (con jornada mañana/tarde/noche). */
export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    programId: uuid('program_id')
      .notNull()
      .references(() => programs.id),
    code: text('code').notNull(),
    journey: text('journey').notNull(),
    startDate: date('start_date', { mode: 'string' }),
    endDate: date('end_date', { mode: 'string' }),
    status: text('status').notNull().default('activa'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('groups_center_code_unique').on(table.centerId, table.code),
    index('groups_center_journey_idx').on(table.centerId, table.journey),
  ],
);

/** Aprendices (historial conservado: el retiro cambia `status`). */
export const learners = pgTable(
  'learners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    document: text('document').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    status: text('status').notNull().default('activo'),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('learners_center_document_unique').on(
      table.centerId,
      table.document,
    ),
  ],
);

/** Asignación de instructores a fichas (director o instructor). */
export const groupInstructors = pgTable(
  'group_instructors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => users.id),
    roleInGroup: text('role_in_group').notNull().default('instructor'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('group_instructors_unique').on(table.groupId, table.instructorId),
  ],
);

/** Consentimientos de tratamiento de datos (Ley 1581): versionados y revocables. */
export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  learnerId: uuid('learner_id')
    .notNull()
    .references(() => learners.id),
  policyVersion: text('policy_version').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

/**
 * M10 — Contactos de emergencia (rebanada 5). Datos sensibles: registro solo
 * con consentimiento vigente, acceso por rol mínimo y CADA LECTURA auditada
 * (RF-28/29, ADR-0011 D1).
 */
export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  learnerId: uuid('learner_id')
    .notNull()
    .references(() => learners.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * M1 — Refrigerios (rebanada 3). Tablas multi-tenant con RLS
 * (ver migración 0008: políticas + función de confirmación pública).
 */

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  date: date('date', { mode: 'string' }).notNull(),
  journey: text('journey').notNull(),
  /** borrador | activo | cerrado */
  status: text('status').notNull().default('borrador'),
  /** Reglas aplicadas al calcular los cupos (RF-13), congeladas al publicar. */
  rulesSnapshot: jsonb('rules_snapshot'),
  confirmationDeadline: timestamp('confirmation_deadline', {
    withTimezone: true,
  }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closeSummary: jsonb('close_summary'),
  cafeteriaPreparedAt: timestamp('cafeteria_prepared_at', {
    withTimezone: true,
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventGroups = pgTable(
  'event_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    calculatedQuota: integer('calculated_quota').notNull().default(0),
    adjustedQuota: integer('adjusted_quota'),
  },
  (table) => [unique('event_groups_unique').on(table.eventId, table.groupId)],
);

export const eventParticipants = pgTable(
  'event_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id),
    learnerId: uuid('learner_id')
      .notNull()
      .references(() => learners.id),
    /** convocado | confirmado | rechazado | entregado | no_reclamado */
    status: text('status').notNull().default('convocado'),
    qrToken: uuid('qr_token').notNull().unique(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('event_participants_unique').on(table.eventId, table.learnerId),
  ],
);

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  participantId: uuid('participant_id')
    .notNull()
    .references(() => eventParticipants.id),
  /** qr | manual */
  method: text('method').notNull(),
  registeredBy: uuid('registered_by')
    .notNull()
    .references(() => users.id),
  /** Idempotencia para sincronización offline (UUID generado en el cliente). */
  clientUuid: uuid('client_uuid').notNull().unique(),
  /** Motivo en entrega manual o autorización de excepción. */
  reason: text('reason'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * M6 — Noticias y campañas (rebanada 6). Publicación segmentada con
 * analítica AGREGADA por día (sin lectores individuales — privacidad por
 * diseño, ADR-0011).
 */

export const publications = pgTable('publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  /** noticia | campana */
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  /** borrador | publicada */
  status: text('status').notNull().default('borrador'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const publicationSegments = pgTable('publication_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  publicationId: uuid('publication_id')
    .notNull()
    .references(() => publications.id),
  /** programa | ficha | jornada */
  segmentType: text('segment_type').notNull(),
  /** UUID del programa/ficha o nombre de la jornada. */
  segmentValue: text('segment_value').notNull(),
});

export const publicationMetrics = pgTable(
  'publication_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id),
    day: date('day', { mode: 'string' }).notNull(),
    views: integer('views').notNull().default(0),
    reads: integer('reads').notNull().default(0),
    clicks: integer('clicks').notNull().default(0),
  },
  (table) => [
    unique('publication_metrics_day_unique').on(
      table.publicationId,
      table.day,
    ),
  ],
);

/**
 * M2 — Hub de notificaciones (rebanada 4). Patrón outbox (ADR-0004):
 * los eventos escriben en `outbox`; el relay publica a la cola y el worker
 * entrega por adaptadores con cascada push → WhatsApp → correo.
 */

export const notificationTemplates = pgTable(
  'notification_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    type: text('type').notNull(),
    channel: text('channel').notNull(),
    version: integer('version').notNull(),
    content: text('content').notNull(),
    /** vigente | historica */
    status: text('status').notNull().default('vigente'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('notification_templates_version_unique').on(
      table.centerId,
      table.type,
      table.channel,
      table.version,
    ),
    index('notification_templates_lookup_idx').on(
      table.centerId,
      table.type,
      table.channel,
    ),
  ],
);

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  /** Canales preferidos en orden (null = todos por defecto). */
  channels: jsonb('channels'),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const outbox = pgTable('outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  /** pendiente | publicado */
  status: text('status').notNull().default('pendiente'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    outboxId: uuid('outbox_id')
      .notNull()
      .references(() => outbox.id),
    eventId: uuid('event_id').references(() => events.id),
    type: text('type').notNull(),
    recipientUserId: uuid('recipient_user_id').references(() => users.id),
    recipientName: text('recipient_name'),
    recipientEmail: text('recipient_email'),
    recipientPhone: text('recipient_phone'),
    channelAttempted: text('channel_attempted'),
    channelEffective: text('channel_effective'),
    /** pendiente | sent | delivered | read | failed */
    status: text('status').notNull().default('pendiente'),
    templateVersion: integer('template_version'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_event_idx').on(table.eventId),
    index('notifications_status_idx').on(table.status),
  ],
);

/**
 * M7 — Encuestas (rebanada 7). Pulso institucional e investigación con
 * anonimato por diseño (RN-08): en modo anónimo la respuesta NO guarda
 * identificador de usuario; los desgloses por segmento se ocultan bajo el
 * umbral mínimo de respuestas. La estructura se congela al publicar.
 */

export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  /** true = no se almacena el identificador del respondiente (RN-08). */
  anonymous: boolean('anonymous').notNull().default(false),
  /** borrador | publicada | cerrada */
  status: text('status').notNull().default('borrador'),
  /** Umbral de respuestas para mostrar desgloses por segmento. */
  minResponses: integer('min_responses').notNull().default(5),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const surveyQuestions = pgTable('survey_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id),
  position: integer('position').notNull(),
  text: text('text').notNull(),
  /** unica | multiple | escala */
  type: text('type').notNull(),
  required: boolean('required').notNull().default(true),
  /** Solo para preguntas de escala. */
  scaleMin: integer('scale_min'),
  scaleMax: integer('scale_max'),
});

export const surveyOptions = pgTable('survey_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  questionId: uuid('question_id')
    .notNull()
    .references(() => surveyQuestions.id),
  position: integer('position').notNull(),
  label: text('label').notNull(),
});

export const surveySegments = pgTable('survey_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id),
  /** programa | ficha | jornada */
  segmentType: text('segment_type').notNull(),
  segmentValue: text('segment_value').notNull(),
});

export const surveyResponses = pgTable('survey_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id),
  /** NULL en encuestas anónimas: jamás se almacena quién respondió (RN-08). */
  learnerId: uuid('learner_id').references(() => learners.id),
  /** Ficha del respondiente al momento de responder (segmento, no identidad). */
  groupId: uuid('group_id').references(() => groups.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const surveyAnswers = pgTable('survey_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  responseId: uuid('response_id')
    .notNull()
    .references(() => surveyResponses.id),
  questionId: uuid('question_id')
    .notNull()
    .references(() => surveyQuestions.id),
  /** Opción elegida (unica/multiple); NULL en preguntas de escala. */
  optionId: uuid('option_id').references(() => surveyOptions.id),
  /** Valor de escala; NULL en unica/multiple. */
  scaleValue: integer('scale_value'),
});

/**
 * M8 — Reuniones y agenda (rebanada 8). Reunión con convocados (personas o
 * fichas), RSVP de las personas, recordatorios automáticos por el hub y acta
 * con compromisos versionada (RF-36 a RF-39).
 */

/** Compromiso de un acta de reunión (M8). */
export interface MeetingCommitment {
  id: string;
  text: string;
  done: boolean;
}

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  /** Lugar físico o enlace virtual. */
  location: text('location').notNull(),
  /** agendada | realizada | cancelada */
  status: text('status').notNull().default('agendada'),
  organizerId: uuid('organizer_id')
    .notNull()
    .references(() => users.id),
  /** Momento configurado para el recordatorio (RF-38). */
  reminderAt: timestamp('reminder_at', { withTimezone: true }),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetingInvitees = pgTable(
  'meeting_invitees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    /** usuario | ficha */
    inviteeType: text('invitee_type').notNull(),
    /** users.id o groups.id según el tipo. */
    inviteeId: uuid('invitee_id').notNull(),
    /** pendiente | confirmado | rechazado (aplica a convocados personas). */
    rsvpStatus: text('rsvp_status').notNull().default('pendiente'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('meeting_invitees_unique').on(
      table.meetingId,
      table.inviteeType,
      table.inviteeId,
    ),
  ],
);

export const meetingMinutes = pgTable(
  'meeting_minutes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    topics: text('topics').notNull(),
    /** Asistentes reales (texto libre; la UI prellena con los confirmados). */
    attendees: jsonb('attendees').$type<string[]>().notNull().default([]),
    /** Compromisos: [{ id, text, done }]. */
    commitments: jsonb('commitments')
      .$type<MeetingCommitment[]>()
      .notNull()
      .default([]),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('meeting_minutes_meeting_unique').on(table.meetingId),
  ],
);

export const meetingMinuteRevisions = pgTable('meeting_minute_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => centers.id),
  minutesId: uuid('minutes_id')
    .notNull()
    .references(() => meetingMinutes.id),
  topics: text('topics').notNull(),
  attendees: jsonb('attendees').$type<string[]>().notNull().default([]),
  commitments: jsonb('commitments')
    .$type<MeetingCommitment[]>()
    .notNull()
    .default([]),
  editedBy: uuid('edited_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
