const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  centerId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
  /** true cuando el rol exige TOTP y aún no está configurado (RF-05). */
  totpEnrollmentRequired: boolean;
}

export interface UserRow {
  id: string;
  centerId: string | null;
  document: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AuditRow {
  id: string;
  action: string;
  actorEmail: string | null;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
}

/** Error del API con el código de negocio (p. ej. totp_required). */
export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
  });

  if (!res.ok) {
    let message = 'No se pudo completar la solicitud.';
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        message?: string | string[];
        code?: string;
      };
      if (Array.isArray(body.message) && body.message.length > 0) {
        message = body.message[0] as string;
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
      code = body.code;
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el mensaje genérico.
    }
    throw new ApiError(message, code);
  }

  return (await res.json()) as T;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/** CU-01 / RF-01 / RF-05: inicio de sesión con soporte de segundo factor. */
export function login(
  identifier: string,
  password: string,
  totpCode?: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier,
      password,
      ...(totpCode ? { totpCode } : {}),
    }),
  });
}

/** Sesión actual (valida el token guardado). */
export function me(accessToken: string): Promise<SessionUser> {
  return request<SessionUser>('/auth/me', {
    headers: authHeaders(accessToken),
  });
}

/** CU-05 / RF-05: inicia el enrolamiento del segundo factor. */
export function enrollTotp(
  token: string,
): Promise<{ otpauthUrl: string; secret: string }> {
  return request('/auth/totp/enroll', {
    method: 'POST',
    headers: authHeaders(token),
  });
}

/** CU-05 / RF-05: activa el segundo factor con un código real. */
export function activateTotp(token: string, code: string): Promise<void> {
  return request('/auth/totp/activate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ code }),
  });
}

/** CU-02 / RF-02: usuarios del centro (según rol). */
export function listUsers(token: string): Promise<UserRow[]> {
  return request<UserRow[]>('/users', { headers: authHeaders(token) });
}

export function createUser(
  token: string,
  payload: {
    name: string;
    document: string;
    email: string;
    password: string;
    role: string;
  },
): Promise<UserRow> {
  return request<UserRow>('/users', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  token: string,
  id: string,
  payload: { role?: string; status?: string },
): Promise<UserRow> {
  return request<UserRow>(`/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

/** CU-04 / RF-04: últimas entradas de auditoría. */
export function listAudit(
  token: string,
): Promise<{ items: AuditRow[]; total: number }> {
  return request('/audit?limit=25', { headers: authHeaders(token) });
}

// ---------- Directorio maestro (M9) ----------

export interface ProgramRow {
  id: string;
  name: string;
  status: string;
}

export interface GroupRow {
  id: string;
  programId: string;
  code: string;
  journey: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  programName: string;
}

export interface LearnerRow {
  id: string;
  groupId: string;
  document: string;
  fullName: string;
  email: string | null;
  status: string;
  retiredAt: string | null;
}

export interface ConsentRow {
  id: string;
  learnerId: string;
  policyVersion: string;
  grantedAt: string;
  revokedAt: string | null;
}

export interface InstructorAssignment {
  id: string;
  instructorId: string;
  roleInGroup: string;
  name: string;
  email: string;
}

export interface GroupDetail extends GroupRow {
  learners: LearnerRow[];
  instructors: InstructorAssignment[];
  consents: ConsentRow[];
}

export function listPrograms(token: string): Promise<ProgramRow[]> {
  return request<ProgramRow[]>('/programs', { headers: authHeaders(token) });
}

export function createProgram(token: string, name: string): Promise<ProgramRow> {
  return request<ProgramRow>('/programs', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}

export function listGroups(
  token: string,
  params?: { journey?: string; programId?: string },
): Promise<GroupRow[]> {
  const query = [
    params?.journey ? `journey=${encodeURIComponent(params.journey)}` : '',
    params?.programId ? `programId=${encodeURIComponent(params.programId)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return request<GroupRow[]>(`/groups${query ? `?${query}` : ''}`, {
    headers: authHeaders(token),
  });
}

export function createGroup(
  token: string,
  payload: {
    programId: string;
    code: string;
    journey: string;
    startDate?: string;
  },
): Promise<GroupRow> {
  return request<GroupRow>('/groups', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getGroupDetail(
  token: string,
  id: string,
): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${id}`, {
    headers: authHeaders(token),
  });
}

export function createLearner(
  token: string,
  payload: {
    groupId: string;
    document: string;
    fullName: string;
    email?: string;
  },
): Promise<LearnerRow> {
  return request<LearnerRow>('/learners', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateLearner(
  token: string,
  id: string,
  payload: { status?: string; fullName?: string; email?: string },
): Promise<LearnerRow> {
  return request<LearnerRow>(`/learners/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function assignInstructor(
  token: string,
  groupId: string,
  payload: { instructorId: string; roleInGroup: string },
): Promise<InstructorAssignment> {
  return request<InstructorAssignment>(`/groups/${groupId}/instructors`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function removeInstructor(
  token: string,
  groupId: string,
  assignmentId: string,
): Promise<{ ok: boolean }> {
  return request(`/groups/${groupId}/instructors/${assignmentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export function grantConsent(
  token: string,
  learnerId: string,
  policyVersion: string,
): Promise<ConsentRow> {
  return request<ConsentRow>(`/learners/${learnerId}/consents`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ policyVersion }),
  });
}

export function revokeConsent(
  token: string,
  consentId: string,
): Promise<ConsentRow> {
  return request<ConsentRow>(`/consents/${consentId}/revoke`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

// ---------- Refrigerios (M1) ----------

export interface EventRow {
  id: string;
  date: string;
  journey: string;
  status: string;
  planned?: number;
  participantsByStatus?: Record<string, number>;
  confirmationDeadline: string | null;
  cafeteriaPreparedAt: string | null;
  closeSummary: Record<string, unknown> | null;
}

export interface EventGroupRow {
  id: string;
  groupId: string;
  groupCode: string;
  calculatedQuota: number;
  adjustedQuota: number | null;
}

export interface EventDetail extends EventRow {
  groups: EventGroupRow[];
  participantsByStatus: Record<string, number>;
  deliveriesTotal: number;
}

export interface CafeteriaSummary {
  eventId: string;
  date: string;
  journey: string;
  status: string;
  preparedAt: string | null;
  confirmed: number;
  delivered: number;
  totalToPrepare: number;
  groups: {
    eventGroupId: string;
    groupCode: string;
    calculatedQuota: number;
    effectiveQuota: number;
  }[];
}

export interface ParticipantSearch {
  participantId: string;
  learnerId: string;
  fullName: string;
  document: string;
  status: string;
  confirmed: boolean;
}

export interface DeliveryResult {
  delivery: { id: string; method: string; participantId: string };
  idempotent: boolean;
}

export function listEvents(token: string, status?: string): Promise<EventRow[]> {
  return request<EventRow[]>(`/events${status ? `?status=${status}` : ''}`, {
    headers: authHeaders(token),
  });
}

export function createEvent(
  token: string,
  payload: { date: string; journey: string },
): Promise<EventRow> {
  return request<EventRow>('/events', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getEventDetail(
  token: string,
  id: string,
): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`, {
    headers: authHeaders(token),
  });
}

export function publishEvent(
  token: string,
  id: string,
): Promise<{ participants: number }> {
  return request(`/events/${id}/publish`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
}

export function adjustQuota(
  token: string,
  eventId: string,
  eventGroupId: string,
  quota: number,
  reason: string,
): Promise<EventGroupRow> {
  return request<EventGroupRow>(
    `/events/${eventId}/groups/${eventGroupId}/quota`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ quota, reason }),
    },
  );
}

export function registerDelivery(
  token: string,
  eventId: string,
  payload: {
    method: 'qr' | 'manual';
    qrToken?: string;
    learnerId?: string;
    clientUuid: string;
    reason?: string;
    override?: boolean;
  },
): Promise<DeliveryResult> {
  return request<DeliveryResult>(`/events/${eventId}/deliveries`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function searchParticipant(
  token: string,
  eventId: string,
  document: string,
): Promise<ParticipantSearch> {
  return request<ParticipantSearch>(
    `/events/${eventId}/participants/search?document=${encodeURIComponent(document)}`,
    { headers: authHeaders(token) },
  );
}

export function cafeteriaSummary(
  token: string,
  eventId: string,
): Promise<CafeteriaSummary> {
  return request<CafeteriaSummary>(`/events/${eventId}/cafeteria`, {
    headers: authHeaders(token),
  });
}

export function markCafeteriaPrepared(
  token: string,
  eventId: string,
): Promise<{ cafeteriaPreparedAt: string }> {
  return request(`/events/${eventId}/cafeteria/prepared`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
}

export function closeEvent(token: string, id: string): Promise<EventRow> {
  return request<EventRow>(`/events/${id}/close`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
}
