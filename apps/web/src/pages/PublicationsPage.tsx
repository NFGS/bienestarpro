import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  addPublicationMetric,
  createPublication,
  listGroups,
  listPrograms,
  listPublications,
  publishPublication,
} from '../lib/api';
import type { GroupRow, ProgramRow, PublicationRow } from '../lib/api';

const MANAGE_ROLES = ['superadmin', 'coordinacion'];
const JOURNEYS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
];

interface Props {
  token: string;
  role: string;
  onBack: () => void;
}

export default function PublicationsPage({ token, role, onBack }: Props) {
  const [publications, setPublications] = useState<PublicationRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'noticia',
    title: '',
    content: '',
    segmentType: '',
    segmentValue: '',
  });
  const canManage = MANAGE_ROLES.includes(role);

  const load = useCallback(async () => {
    try {
      const [publicationRows, groupRows, programRows] = await Promise.all([
        listPublications(token),
        listGroups(token),
        listPrograms(token),
      ]);
      setPublications(publicationRows);
      setGroups(groupRows);
      setPrograms(programRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las noticias.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createPublication(token, {
        type: form.type,
        title: form.title,
        content: form.content,
        ...(form.segmentType && form.segmentValue
          ? {
              segments: [
                { segmentType: form.segmentType, segmentValue: form.segmentValue },
              ],
            }
          : {}),
      });
      setNotice('Publicación creada en borrador');
      setForm({ ...form, title: '', content: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la publicación.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await publishPublication(token, id);
      setNotice(
        `Publicada: ${result.recipients} destinatarios, ${result.notificationsQueued} notificaciones en cola`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    }
  }

  async function handleRead(id: string, event: 'view' | 'read' | 'click'): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await addPublicationMetric(token, id, event);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la interacción.');
    }
  }

  function segmentLabel(segment: { segmentType: string; segmentValue: string }): string {
    if (segment.segmentType === 'jornada') {
      return `jornada ${segment.segmentValue}`;
    }
    if (segment.segmentType === 'ficha') {
      const group = groups.find((item) => item.id === segment.segmentValue);
      return group ? `ficha ${group.code}` : 'ficha';
    }
    const program = programs.find((item) => item.id === segment.segmentValue);
    return program ? `programa ${program.name}` : 'programa';
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Noticias y campañas</h1>
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

      {canManage ? (
        <section className="card">
          <h2>Crear publicación</h2>
          <form onSubmit={handleCreate} noValidate>
            <div className="admin__form">
              <div className="field">
                <label htmlFor="pub-type">Tipo</label>
                <select
                  id="pub-type"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                  <option value="noticia">Noticia</option>
                  <option value="campana">Campaña</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="pub-segment-type">Segmento (opcional)</label>
                <select
                  id="pub-segment-type"
                  value={form.segmentType}
                  onChange={(event) =>
                    setForm({ ...form, segmentType: event.target.value, segmentValue: '' })
                  }
                >
                  <option value="">Todo el centro</option>
                  <option value="ficha">Ficha</option>
                  <option value="jornada">Jornada</option>
                  <option value="programa">Programa</option>
                </select>
              </div>
              {form.segmentType ? (
                <div className="field">
                  <label htmlFor="pub-segment-value">Valor del segmento</label>
                  <select
                    id="pub-segment-value"
                    value={form.segmentValue}
                    onChange={(event) =>
                      setForm({ ...form, segmentValue: event.target.value })
                    }
                    required
                  >
                    <option value="">Selecciona…</option>
                    {form.segmentType === 'ficha'
                      ? groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            Ficha {group.code}
                          </option>
                        ))
                      : null}
                    {form.segmentType === 'jornada'
                      ? JOURNEYS.map((journey) => (
                          <option key={journey.value} value={journey.value}>
                            {journey.label}
                          </option>
                        ))
                      : null}
                    {form.segmentType === 'programa'
                      ? programs.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))
                      : null}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="pub-title">Título</label>
              <input
                id="pub-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="field">
              <label htmlFor="pub-content">Contenido</label>
              <textarea
                id="pub-content"
                rows={3}
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                required
                minLength={5}
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Creando…' : 'Crear publicación'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="card">
        <h2>Publicaciones ({publications.length})</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : publications.length === 0 ? (
          <p className="muted">Aún no hay publicaciones.</p>
        ) : (
          <ul className="admin__list">
            {publications.map((publication) => (
              <li key={publication.id} className="admin__row">
                <div className="admin__info">
                  <strong>{publication.title}</strong>
                  <span className="muted">
                    {publication.type === 'campana' ? 'Campaña' : 'Noticia'} ·{' '}
                    {publication.segments.length === 0
                      ? 'todo el centro'
                      : publication.segments.map(segmentLabel).join(', ')}
                  </span>
                  <span className="muted">
                    Vistas {publication.totals.views} · Lecturas{' '}
                    {publication.totals.reads} · Clics {publication.totals.clicks}
                  </span>
                  <span className="admin__chips">
                    <span
                      className={
                        publication.status === 'publicada' ? 'chip chip--ok' : 'chip'
                      }
                    >
                      {publication.status === 'publicada' ? 'Publicada' : 'Borrador'}
                    </span>
                  </span>
                </div>
                <div className="admin__actions">
                  {canManage && publication.status === 'borrador' ? (
                    <button
                      className="btn btn--primary btn--small"
                      type="button"
                      onClick={() => void handlePublish(publication.id)}
                    >
                      Publicar
                    </button>
                  ) : null}
                  {publication.status === 'publicada' ? (
                    <button
                      className="btn btn--secondary btn--small"
                      type="button"
                      onClick={() => void handleRead(publication.id, 'read')}
                    >
                      Marcar lectura
                    </button>
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
