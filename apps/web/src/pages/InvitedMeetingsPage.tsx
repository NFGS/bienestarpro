import { useCallback, useEffect, useState } from 'react';
import { listInvitedMeetings, rsvpMeeting } from '../lib/api';
import type { InvitedMeetingRow } from '../lib/api';

interface Props {
  token: string;
  onBack: () => void;
  onOpen: (meetingId: string) => void;
}

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

/** CU-31 (RF-37): invitaciones del convocado con confirmación de asistencia. */
export default function InvitedMeetingsPage({ token, onBack, onOpen }: Props) {
  const [meetings, setMeetings] = useState<InvitedMeetingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setMeetings(await listInvitedMeetings(token));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar tus reuniones.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRsvp(
    id: string,
    status: 'confirmado' | 'rechazado',
  ): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await rsvpMeeting(token, id, status);
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

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Mis reuniones</h1>
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

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : meetings.length === 0 ? (
        <section className="card">
          <p className="muted">No tienes reuniones convocadas por ahora.</p>
        </section>
      ) : (
        meetings.map((meeting) => (
          <section key={meeting.id} className="card">
            <h2>{meeting.title}</h2>
            <p>
              <strong>{formatDateTime(meeting.startsAt)}</strong>
            </p>
            <p className="muted">Lugar o enlace: {meeting.location}</p>
            {meeting.description ? <p>{meeting.description}</p> : null}
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
                {meeting.status === 'agendada'
                  ? 'Agendada'
                  : meeting.status === 'realizada'
                    ? 'Realizada'
                    : 'Cancelada'}
              </span>
              <span
                className={
                  meeting.myRsvpStatus === 'confirmado'
                    ? 'chip chip--ok'
                    : meeting.myRsvpStatus === 'rechazado'
                      ? 'chip chip--off'
                      : 'chip chip--warn'
                }
              >
                {RSVP_LABEL[meeting.myRsvpStatus] ?? meeting.myRsvpStatus}
              </span>
              {meeting.hasMinutes ? <span className="chip">Acta disponible</span> : null}
            </span>
            <div className="admin__actions prefs__subtitle">
              {meeting.status === 'agendada' ? (
                <>
                  <button
                    className="btn btn--primary btn--small"
                    type="button"
                    onClick={() => void handleRsvp(meeting.id, 'confirmado')}
                  >
                    Confirmar asistencia
                  </button>
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => void handleRsvp(meeting.id, 'rechazado')}
                  >
                    Rechazar
                  </button>
                </>
              ) : null}
              <button
                className="btn btn--secondary btn--small"
                type="button"
                onClick={() => onOpen(meeting.id)}
              >
                Ver detalle
              </button>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
