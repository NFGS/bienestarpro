import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  cancelMeeting,
  completeMeeting,
  getMeeting,
  rsvpMeeting,
  updateMeeting,
  updateMeetingCommitment,
  upsertMeetingMinutes,
} from '../lib/api';
import type { MeetingDetail } from '../lib/api';

const MANAGE_ROLES = ['superadmin', 'coordinacion'];
const RSVP_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  token: string;
  role: string;
  meetingId: string;
  onBack: () => void;
}

interface CommitmentDraft {
  id?: string;
  text: string;
}

/** CU-30 a CU-33: detalle de la reunión (RSVP, edición, acta). */
export default function MeetingDetailPage({
  token,
  role,
  meetingId,
  onBack,
}: Props) {
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editForm, setEditForm] = useState({
    startsAt: '',
    endsAt: '',
    location: '',
    reminderAt: '',
  });
  const [minutesForm, setMinutesForm] = useState<{
    topics: string;
    attendees: string;
    commitments: CommitmentDraft[];
  }>({ topics: '', attendees: '', commitments: [{ text: '' }] });
  const canManage = MANAGE_ROLES.includes(role);

  const load = useCallback(async () => {
    try {
      const data = await getMeeting(token, meetingId);
      setDetail(data);
      setEditForm({
        startsAt: toLocalInput(data.startsAt),
        endsAt: data.endsAt ? toLocalInput(data.endsAt) : '',
        location: data.location,
        reminderAt: data.reminderAt ? toLocalInput(data.reminderAt) : '',
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la reunión.');
    } finally {
      setLoading(false);
    }
  }, [token, meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRsvp(status: 'confirmado' | 'rechazado'): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await rsvpMeeting(token, meetingId, status);
      setNotice(
        status === 'confirmado'
          ? 'Asistencia confirmada.'
          : 'Asistencia rechazada.',
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la respuesta.');
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const result = await updateMeeting(token, meetingId, {
        ...(editForm.startsAt
          ? { startsAt: new Date(editForm.startsAt).toISOString() }
          : {}),
        ...(editForm.endsAt
          ? { endsAt: new Date(editForm.endsAt).toISOString() }
          : {}),
        location: editForm.location,
        ...(editForm.reminderAt
          ? { reminderAt: new Date(editForm.reminderAt).toISOString() }
          : {}),
      });
      setNotice(
        result.rsvpReset
          ? 'Reunión actualizada. Al cambiar la fecha, las confirmaciones volvieron a pendiente.'
          : 'Reunión actualizada y convocados notificados.',
      );
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    }
  }

  async function handleCancel(): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await cancelMeeting(
        token,
        meetingId,
        cancelReason.trim() || undefined,
      );
      setNotice(
        `Reunión cancelada: ${result.notificationsQueued} notificaciones en cola.`,
      );
      setCancelReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    }
  }

  async function handleComplete(): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await completeMeeting(token, meetingId);
      setNotice('Reunión marcada como realizada: ya puedes registrar el acta.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
    }
  }

  function openMinutesForm(): void {
    if (!detail) {
      return;
    }
    const confirmed = detail.invitees
      .filter(
        (invitee) =>
          invitee.inviteeType === 'usuario' && invitee.rsvpStatus === 'confirmado',
      )
      .map((invitee) => invitee.name)
      .filter((name): name is string => Boolean(name));
    setMinutesForm({
      topics: detail.minutes?.topics ?? '',
      attendees: detail.minutes
        ? detail.minutes.attendees.join(', ')
        : confirmed.join(', '),
      commitments:
        detail.minutes && detail.minutes.commitments.length > 0
          ? detail.minutes.commitments.map((commitment) => ({
              id: commitment.id,
              text: commitment.text,
            }))
          : [{ text: '' }],
    });
    setEditingMinutes(true);
  }

  async function handleMinutesSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const result = await upsertMeetingMinutes(token, meetingId, {
        topics: minutesForm.topics.trim(),
        attendees: minutesForm.attendees
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
        commitments: minutesForm.commitments
          .map((commitment) => ({
            ...(commitment.id ? { id: commitment.id } : {}),
            text: commitment.text.trim(),
          }))
          .filter((commitment) => commitment.text.length >= 2),
      });
      setNotice(
        `Acta guardada. ${result.notificationsQueued} notificaciones en cola.`,
      );
      setEditingMinutes(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el acta.');
    }
  }

  async function handleToggleCommitment(
    commitmentId: string,
    done: boolean,
  ): Promise<void> {
    setError(null);
    try {
      await updateMeetingCommitment(token, meetingId, commitmentId, done);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo actualizar el compromiso.',
      );
    }
  }

  if (loading) {
    return (
      <main className="admin">
        <p className="muted">Cargando…</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="admin">
        <header className="home__header">
          <h1>Reunión</h1>
          <button className="btn btn--secondary" type="button" onClick={onBack}>
            Volver
          </button>
        </header>
        <div className="banner banner--error" role="alert">
          {error ?? 'No se encontró la reunión.'}
        </div>
      </main>
    );
  }

  const statusLabel =
    detail.status === 'agendada'
      ? 'Agendada'
      : detail.status === 'realizada'
        ? 'Realizada'
        : 'Cancelada';

  return (
    <main className="admin">
      <header className="home__header">
        <h1>{detail.title}</h1>
        <button className="btn btn--secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      {error ? (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      ) : null}
      {notice ? <div className="banner banner--success">{notice}</div> : null}

      <section className="card">
        <span className="admin__chips">
          <span
            className={
              detail.status === 'agendada'
                ? 'chip chip--ok'
                : detail.status === 'cancelada'
                  ? 'chip chip--off'
                  : 'chip chip--warn'
            }
          >
            {statusLabel}
          </span>
          {detail.minutes ? <span className="chip">Acta</span> : null}
        </span>
        <p>
          <strong>{formatDateTime(detail.startsAt)}</strong>
          {detail.endsAt ? ` — ${formatDateTime(detail.endsAt)}` : ''}
        </p>
        <p className="muted">Lugar o enlace: {detail.location}</p>
        <p className="muted">Organiza: {detail.organizerName ?? 'Coordinación'}</p>
        {detail.description ? <p>{detail.description}</p> : null}
        {detail.reminderAt ? (
          <p className="muted">
            Recordatorio: {formatDateTime(detail.reminderAt)}
            {detail.reminderSentAt ? ' (enviado)' : ' (programado)'}
          </p>
        ) : null}
      </section>

      {detail.myRsvpStatus && detail.status === 'agendada' ? (
        <section className="card">
          <h2>Tu asistencia</h2>
          <p className="muted">
            Respuesta actual: {RSVP_LABEL[detail.myRsvpStatus] ?? detail.myRsvpStatus}
          </p>
          <div className="admin__actions">
            <button
              className="btn btn--primary btn--small"
              type="button"
              onClick={() => void handleRsvp('confirmado')}
            >
              Confirmar asistencia
            </button>
            <button
              className="btn btn--secondary btn--small"
              type="button"
              onClick={() => void handleRsvp('rechazado')}
            >
              Rechazar
            </button>
          </div>
        </section>
      ) : null}

      {canManage && detail.status === 'agendada' ? (
        <section className="card">
          <h2>Gestión</h2>
          <div className="admin__actions">
            <button
              className="btn btn--secondary btn--small"
              type="button"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cerrar edición' : 'Editar fecha o lugar'}
            </button>
            <button
              className="btn btn--secondary btn--small"
              type="button"
              onClick={() => void handleComplete()}
            >
              Marcar realizada
            </button>
          </div>
          {editing ? (
            <form onSubmit={(event) => void handleEditSubmit(event)} noValidate>
              <div className="admin__form">
                <div className="field">
                  <label htmlFor="edit-starts">Inicio</label>
                  <input
                    id="edit-starts"
                    type="datetime-local"
                    value={editForm.startsAt}
                    onChange={(event) =>
                      setEditForm({ ...editForm, startsAt: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-ends">Fin</label>
                  <input
                    id="edit-ends"
                    type="datetime-local"
                    value={editForm.endsAt}
                    onChange={(event) =>
                      setEditForm({ ...editForm, endsAt: event.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="edit-reminder">Recordatorio</label>
                  <input
                    id="edit-reminder"
                    type="datetime-local"
                    value={editForm.reminderAt}
                    onChange={(event) =>
                      setEditForm({ ...editForm, reminderAt: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="edit-location">Lugar o enlace</label>
                <input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(event) =>
                    setEditForm({ ...editForm, location: event.target.value })
                  }
                  required
                  minLength={3}
                />
              </div>
              <button className="btn btn--primary" type="submit">
                Guardar cambios
              </button>
            </form>
          ) : null}
          <div className="field">
            <label htmlFor="cancel-reason">Motivo de cancelación (opcional)</label>
            <input
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </div>
          <button
            className="btn btn--secondary btn--small"
            type="button"
            onClick={() => void handleCancel()}
          >
            Cancelar reunión
          </button>
        </section>
      ) : null}

      <section className="card">
        <h2>Convocados ({detail.invitees.length})</h2>
        <ul className="admin__list">
          {detail.invitees.map((invitee) => (
            <li key={invitee.id} className="admin__row">
              <div className="admin__info">
                <strong>
                  {invitee.inviteeType === 'usuario'
                    ? (invitee.name ?? 'Persona')
                    : `Ficha ${invitee.groupCode ?? ''}`}
                </strong>
                {invitee.email ? (
                  <span className="muted">{invitee.email}</span>
                ) : null}
              </div>
              <span className="admin__chips">
                {invitee.inviteeType === 'usuario' ? (
                  <span
                    className={
                      invitee.rsvpStatus === 'confirmado'
                        ? 'chip chip--ok'
                        : invitee.rsvpStatus === 'rechazado'
                          ? 'chip chip--off'
                          : 'chip chip--warn'
                    }
                  >
                    {RSVP_LABEL[invitee.rsvpStatus] ?? invitee.rsvpStatus}
                  </span>
                ) : (
                  <span className="chip">Convocatoria grupal</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {detail.status === 'realizada' || detail.minutes ? (
        <section className="card">
          <h2>Acta de la reunión</h2>
          {detail.minutesRevisions > 0 ? (
            <p className="muted">
              Versiones anteriores conservadas: {detail.minutesRevisions}
            </p>
          ) : null}
          {editingMinutes ? (
            <form onSubmit={(event) => void handleMinutesSubmit(event)} noValidate>
              <div className="field">
                <label htmlFor="minutes-topics">Temas tratados</label>
                <textarea
                  id="minutes-topics"
                  rows={4}
                  value={minutesForm.topics}
                  onChange={(event) =>
                    setMinutesForm({ ...minutesForm, topics: event.target.value })
                  }
                  required
                  minLength={3}
                />
              </div>
              <div className="field">
                <label htmlFor="minutes-attendees">
                  Asistentes (separados por coma)
                </label>
                <input
                  id="minutes-attendees"
                  value={minutesForm.attendees}
                  onChange={(event) =>
                    setMinutesForm({
                      ...minutesForm,
                      attendees: event.target.value,
                    })
                  }
                />
              </div>
              <h3 className="prefs__subtitle">Compromisos</h3>
              {minutesForm.commitments.map((commitment, index) => (
                <div key={index} className="survey-option-row">
                  <input
                    aria-label={`Compromiso ${index + 1}`}
                    value={commitment.text}
                    onChange={(event) =>
                      setMinutesForm({
                        ...minutesForm,
                        commitments: minutesForm.commitments.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, text: event.target.value }
                            : item,
                        ),
                      })
                    }
                    placeholder="Compromiso"
                  />
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() =>
                      setMinutesForm({
                        ...minutesForm,
                        commitments: minutesForm.commitments.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                    disabled={minutesForm.commitments.length <= 1}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() =>
                  setMinutesForm({
                    ...minutesForm,
                    commitments: [...minutesForm.commitments, { text: '' }],
                  })
                }
              >
                + Compromiso
              </button>
              <div className="prefs__subtitle">
                <button className="btn btn--primary" type="submit">
                  Guardar acta
                </button>
              </div>
            </form>
          ) : detail.minutes ? (
            <div>
              <p>
                <strong>Temas:</strong> {detail.minutes.topics}
              </p>
              <p className="muted">
                Asistentes: {detail.minutes.attendees.join(', ') || 'Sin registrar'}
              </p>
              <h3 className="prefs__subtitle">Compromisos</h3>
              {detail.minutes.commitments.length === 0 ? (
                <p className="muted">Sin compromisos registrados.</p>
              ) : (
                <ul className="admin__list">
                  {detail.minutes.commitments.map((commitment) => (
                    <li key={commitment.id} className="admin__row">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={commitment.done}
                          disabled={!canManage}
                          onChange={() =>
                            void handleToggleCommitment(
                              commitment.id,
                              !commitment.done,
                            )
                          }
                        />
                        {commitment.text}
                      </label>
                      <span className="admin__chips">
                        <span
                          className={commitment.done ? 'chip chip--ok' : 'chip chip--warn'}
                        >
                          {commitment.done ? 'Cumplido' : 'Pendiente'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {canManage ? (
                <div className="prefs__subtitle">
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={openMinutesForm}
                  >
                    Editar acta
                  </button>
                </div>
              ) : null}
            </div>
          ) : canManage ? (
            <button className="btn btn--primary" type="button" onClick={openMinutesForm}>
              Registrar acta
            </button>
          ) : (
            <p className="muted">El acta aún no está disponible.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
