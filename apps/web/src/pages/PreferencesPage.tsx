import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getMyPreferences, updateMyPreferences } from '../lib/api';

const CHANNELS = [
  { value: 'push', label: 'Notificación push' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Correo electrónico' },
];

interface Props {
  token: string;
  onBack: () => void;
}

export default function PreferencesPage({ token, onBack }: Props) {
  const [channels, setChannels] = useState<string[]>([
    'push',
    'whatsapp',
    'email',
  ]);
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyPreferences(token)
      .then((prefs) => {
        if (Array.isArray(prefs.channels) && prefs.channels.length > 0) {
          setChannels(prefs.channels);
        }
        setQuietStart(prefs.quietHoursStart ?? '');
        setQuietEnd(prefs.quietHoursEnd ?? '');
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'No se pudieron cargar tus preferencias.',
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  function toggleChannel(value: string): void {
    setChannels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateMyPreferences(token, {
        channels,
        ...(quietStart && quietEnd
          ? { quietHoursStart: quietStart, quietHoursEnd: quietEnd }
          : {}),
      });
      setNotice('Preferencias guardadas');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron guardar tus preferencias.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin">
        <p className="muted">Cargando preferencias…</p>
      </main>
    );
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Mis preferencias</h1>
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
        <h2>Canales de notificación</h2>
        <p className="muted">
          Elige por dónde quieres recibir los avisos. Si un canal falla, el
          sistema intenta el siguiente.
        </p>
        <form onSubmit={handleSave} noValidate>
          {CHANNELS.map((channel) => (
            <label key={channel.value} className="check-row">
              <input
                type="checkbox"
                checked={channels.includes(channel.value)}
                onChange={() => toggleChannel(channel.value)}
              />
              <span>{channel.label}</span>
            </label>
          ))}

          <h2 className="prefs__subtitle">Horario silencioso</h2>
          <p className="muted">
            En este rango no se envían avisos no críticos (se envían apenas
            termine).
          </p>
          <div className="admin__form">
            <div className="field">
              <label htmlFor="quiet-start">Desde</label>
              <input
                id="quiet-start"
                type="time"
                value={quietStart}
                onChange={(event) => setQuietStart(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="quiet-end">Hasta</label>
              <input
                id="quiet-end"
                type="time"
                value={quietEnd}
                onChange={(event) => setQuietEnd(event.target.value)}
              />
            </div>
          </div>

          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar preferencias'}
          </button>
        </form>
      </section>
    </main>
  );
}
