import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createTemplate, listTemplates, updateTemplate } from '../lib/api';
import type { TemplateRow } from '../lib/api';

const TYPES = [
  { value: 'evento_convocatoria', label: 'Convocatoria de evento' },
  { value: 'evento_recordatorio', label: 'Recordatorio de evento' },
  { value: 'reunion_aviso', label: 'Aviso de reunión' },
  { value: 'generico', label: 'Genérico' },
];

const CHANNELS = [
  { value: 'email', label: 'Correo' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push', label: 'Push' },
];

interface Props {
  token: string;
  onBack: () => void;
}

export default function TemplatesPage({ token, onBack }: Props) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'evento_convocatoria',
    channel: 'email',
    content: '',
  });
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setTemplates(await listTemplates(token));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas.');
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
      const created = await createTemplate(token, form);
      setNotice(`Plantilla creada (versión ${created.version})`);
      setForm({ ...form, content: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(template: TemplateRow): Promise<void> {
    const content = editing[template.id] ?? template.content;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateTemplate(token, template.id, content);
      setNotice(`Nueva versión guardada (v${updated.version})`);
      setEditing((current) => {
        const next = { ...current };
        delete next[template.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la plantilla.');
    } finally {
      setSaving(false);
    }
  }

  const vigentes = templates.filter((template) => template.status === 'vigente');

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Plantillas de mensajes</h1>
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
        <h2>Crear plantilla</h2>
        <p className="muted">
          Variables disponibles: {'{{name}}'}, {'{{date}}'}, {'{{journey}}'},{' '}
          {'{{confirmUrl}}'}.
        </p>
        <form onSubmit={handleCreate} noValidate>
          <div className="admin__form">
            <div className="field">
              <label htmlFor="tpl-type">Tipo</label>
              <select
                id="tpl-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tpl-channel">Canal</label>
              <select
                id="tpl-channel"
                value={form.channel}
                onChange={(event) => setForm({ ...form, channel: event.target.value })}
              >
                {CHANNELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="tpl-content">Contenido</label>
            <textarea
              id="tpl-content"
              rows={3}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              required
              minLength={5}
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Creando…' : 'Crear plantilla'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Plantillas vigentes ({vigentes.length})</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : vigentes.length === 0 ? (
          <p className="muted">
            Sin plantillas propias: se usan las predeterminadas del sistema.
          </p>
        ) : (
          <ul className="admin__list">
            {vigentes.map((template) => (
              <li key={template.id} className="admin__row">
                <div className="admin__info">
                  <strong>
                    {TYPES.find((type) => type.value === template.type)?.label ??
                      template.type}{' '}
                    · {template.channel} · v{template.version}
                  </strong>
                  <textarea
                    rows={2}
                    value={editing[template.id] ?? template.content}
                    onChange={(event) =>
                      setEditing((current) => ({
                        ...current,
                        [template.id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="admin__actions">
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    disabled={saving}
                    onClick={() => void handleUpdate(template)}
                  >
                    Guardar nueva versión
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
