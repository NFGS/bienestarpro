import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createEvent, listEvents, publishEvent } from '../lib/api';
import type { EventRow } from '../lib/api';

const JOURNEYS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
];

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  activo: 'Activo',
  cerrado: 'Cerrado',
};

interface Props {
  token: string;
  onBack: () => void;
  onOpen: (eventId: string) => void;
}

export default function EventsPage({ token, onBack, onOpen }: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', journey: 'manana' });

  const load = useCallback(async () => {
    try {
      setEvents(await listEvents(token, status || undefined));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createEvent(token, form);
      setNotice(`Evento creado para el ${created.date}`);
      setForm({ date: '', journey: 'manana' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el evento.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(eventId: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await publishEvent(token, eventId);
      setNotice(`Evento publicado con ${result.participants} aprendices convocados`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el evento.');
    }
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Refrigerios</h1>
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
        <h2>Crear evento</h2>
        <form className="admin__form" onSubmit={handleCreate} noValidate>
          <div className="field">
            <label htmlFor="event-date">Fecha</label>
            <input
              id="event-date"
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="event-journey">Jornada</label>
            <select
              id="event-journey"
              value={form.journey}
              onChange={(event) => setForm({ ...form, journey: event.target.value })}
            >
              {JOURNEYS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Creando…' : 'Crear evento'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Eventos ({events.length})</h2>
        <div className="field">
          <label htmlFor="filter-status">Filtrar por estado</label>
          <select
            id="filter-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="activo">Activo</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : events.length === 0 ? (
          <p className="muted">Aún no hay eventos registrados.</p>
        ) : (
          <ul className="admin__list">
            {events.map((event) => (
              <li key={event.id} className="admin__row">
                <div className="admin__info">
                  <strong>
                    {event.date} · {event.journey}
                  </strong>
                  <span className="muted">
                    Planificados: {event.planned ?? 0}
                    {event.participantsByStatus
                      ? ` · confirmados: ${event.participantsByStatus.confirmado ?? 0} · entregados: ${event.participantsByStatus.entregado ?? 0}`
                      : ''}
                  </span>
                  <span className="admin__chips">
                    <span
                      className={
                        event.status === 'activo'
                          ? 'chip chip--ok'
                          : event.status === 'borrador'
                            ? 'chip'
                            : 'chip chip--warn'
                      }
                    >
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                  </span>
                </div>
                <div className="admin__actions">
                  {event.status === 'borrador' ? (
                    <button
                      className="btn btn--secondary btn--small"
                      type="button"
                      onClick={() => void handlePublish(event.id)}
                    >
                      Publicar
                    </button>
                  ) : null}
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => onOpen(event.id)}
                  >
                    Abrir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
