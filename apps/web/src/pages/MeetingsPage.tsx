import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  cancelMeeting,
  completeMeeting,
  createMeeting,
  listGroups,
  listMeetings,
  listUsers,
} from '../lib/api';
import type { GroupRow, MeetingRow, UserRow } from '../lib/api';

interface Props {
  token: string;
  onBack: () => void;
  onOpen: (meetingId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}

/** CU-30 (RF-36): agenda de reuniones desde coordinación. */
export default function MeetingsPage({ token, onBack, onOpen }: Props) {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    reminderAt: '',
    invitees: [] as string[],
  });

  const load = useCallback(async () => {
    try {
      const [meetingRows, userRows, groupRows] = await Promise.all([
        listMeetings(token),
        listUsers(token),
        listGroups(token),
      ]);
      setMeetings(meetingRows);
      setUsers(userRows.filter((user) => user.status === 'activo'));
      setGroups(groupRows.filter((group) => group.status === 'activa'));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar las reuniones.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleInvitee(key: string): void {
    setForm((current) => ({
      ...current,
      invitees: current.invitees.includes(key)
        ? current.invitees.filter((item) => item !== key)
        : [...current.invitees, key],
    }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (form.title.trim().length < 3 || form.location.trim().length < 3) {
      setError('El título y el lugar o enlace son obligatorios.');
      return;
    }
    if (!form.startsAt) {
      setError('Indica la fecha y hora de inicio.');
      return;
    }
    if (form.invitees.length === 0) {
      setError('Selecciona al menos un convocado (persona o ficha).');
      return;
    }
    setSaving(true);
    try {
      const result = await createMeeting(token, {
        title: form.title.trim(),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        startsAt: new Date(form.startsAt).toISOString(),
        ...(form.endsAt ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
        location: form.location.trim(),
        ...(form.reminderAt
          ? { reminderAt: new Date(form.reminderAt).toISOString() }
          : {}),
        invitees: form.invitees.map((key) => {
          const [inviteeType, inviteeId] = key.split(':') as [
            'usuario' | 'ficha',
            string,
          ];
          return { inviteeType, inviteeId };
        }),
      });
      setNotice(
        result.conflicts.length > 0
          ? `Reunión agendada. Advertencia: se cruza con "${result.conflicts[0]!.title}".`
          : `Reunión agendada: ${result.notificationsQueued} notificaciones en cola.`,
      );
      setForm({
        title: '',
        description: '',
        startsAt: '',
        endsAt: '',
        location: '',
        reminderAt: '',
        invitees: [],
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar la reunión.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await cancelMeeting(token, id);
      setNotice(
        `Reunión cancelada: ${result.notificationsQueued} notificaciones en cola.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar.');
    }
  }

  async function handleComplete(id: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await completeMeeting(token, id);
      setNotice('Reunión marcada como realizada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar.');
    }
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Reuniones y agenda</h1>
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
        <h2>Agendar reunión</h2>
        <form onSubmit={(event) => void handleCreate(event)} noValidate>
          <div className="field">
            <label htmlFor="meeting-title">Título</label>
            <input
              id="meeting-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="meeting-description">Descripción (opcional)</label>
            <textarea
              id="meeting-description"
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>
          <div className="admin__form">
            <div className="field">
              <label htmlFor="meeting-starts">Inicio</label>
              <input
                id="meeting-starts"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm({ ...form, startsAt: event.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="meeting-ends">Fin (opcional)</label>
              <input
                id="meeting-ends"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm({ ...form, endsAt: event.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="meeting-reminder">Recordatorio (opcional)</label>
              <input
                id="meeting-reminder"
                type="datetime-local"
                value={form.reminderAt}
                onChange={(event) =>
                  setForm({ ...form, reminderAt: event.target.value })
                }
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="meeting-location">Lugar o enlace</label>
            <input
              id="meeting-location"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              required
              minLength={3}
            />
          </div>

          <h3 className="prefs__subtitle">Convocados</h3>
          <div className="survey-options">
            {users.map((user) => (
              <label key={user.id} className="check-row">
                <input
                  type="checkbox"
                  checked={form.invitees.includes(`usuario:${user.id}`)}
                  onChange={() => toggleInvitee(`usuario:${user.id}`)}
                />
                {user.name} ({user.role})
              </label>
            ))}
            {groups.map((group) => (
              <label key={group.id} className="check-row">
                <input
                  type="checkbox"
                  checked={form.invitees.includes(`ficha:${group.id}`)}
                  onChange={() => toggleInvitee(`ficha:${group.id}`)}
                />
                Ficha {group.code} · {group.journey}
              </label>
            ))}
          </div>

          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Agendando…' : 'Agendar reunión'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Agenda ({meetings.length})</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : meetings.length === 0 ? (
          <p className="muted">Aún no hay reuniones agendadas.</p>
        ) : (
          <ul className="admin__list">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="admin__row">
                <div className="admin__info">
                  <strong>{meeting.title}</strong>
                  <span className="muted">
                    {formatDateTime(meeting.startsAt)} · {meeting.location}
                  </span>
                  <span className="muted">
                    {meeting.inviteesTotal} convocados · {meeting.confirmed}{' '}
                    confirmados · {meeting.pending} pendientes
                    {meeting.groupsTotal > 0
                      ? ` · ${meeting.groupsTotal} ficha(s)`
                      : ''}
                  </span>
                  <span className="admin__chips">
                    <span
                      className={
                        meeting.status === 'agendada'
                          ? 'chip chip--ok'
                          : meeting.status === 'cancelada'
                            ? 'chip chip--off'
                            : 'chip chip--warn'
                      }
                    >
                      {STATUS_LABEL[meeting.status] ?? meeting.status}
                    </span>
                    {meeting.hasMinutes ? (
                      <span className="chip">Acta</span>
                    ) : null}
                  </span>
                </div>
                <div className="admin__actions">
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => onOpen(meeting.id)}
                  >
                    Abrir
                  </button>
                  {meeting.status === 'agendada' ? (
                    <>
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() => void handleComplete(meeting.id)}
                      >
                        Completar
                      </button>
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() => void handleCancel(meeting.id)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
