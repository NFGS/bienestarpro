import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createGroup,
  createProgram,
  listGroups,
  listPrograms,
} from '../lib/api';
import type { GroupRow, ProgramRow } from '../lib/api';

const JOURNEYS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
];

interface Props {
  token: string;
  onBack: () => void;
  onOpen: (groupId: string) => void;
}

export default function GroupsPage({ token, onBack, onOpen }: Props) {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [journey, setJourney] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    programId: '',
    code: '',
    journey: 'manana',
    startDate: '',
  });
  const [newProgram, setNewProgram] = useState('');

  const load = useCallback(async () => {
    try {
      const [groupList, programList] = await Promise.all([
        listGroups(token, journey ? { journey } : undefined),
        listPrograms(token),
      ]);
      setGroups(groupList);
      setPrograms(programList);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el directorio.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, journey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateProgram(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createProgram(token, newProgram);
      setNotice(`Programa creado: ${created.name}`);
      setNewProgram('');
      setForm((current) => ({ ...current, programId: created.id }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el programa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGroup(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createGroup(token, {
        programId: form.programId,
        code: form.code,
        journey: form.journey,
        ...(form.startDate ? { startDate: form.startDate } : {}),
      });
      setNotice(`Ficha creada: ${created.code}`);
      setForm({ programId: form.programId, code: '', journey: 'manana', startDate: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la ficha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Fichas</h1>
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

      {programs.length === 0 ? (
        <section className="card">
          <h2>Primer paso: crea un programa</h2>
          <form className="admin__form" onSubmit={handleCreateProgram} noValidate>
            <div className="field">
              <label htmlFor="program-name">Nombre del programa</label>
              <input
                id="program-name"
                value={newProgram}
                onChange={(event) => setNewProgram(event.target.value)}
                required
                minLength={3}
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={saving}>
              Crear programa
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          <h2>Crear ficha</h2>
          <form className="admin__form" onSubmit={handleCreateGroup} noValidate>
            <div className="field">
              <label htmlFor="group-program">Programa</label>
              <select
                id="group-program"
                value={form.programId}
                onChange={(event) =>
                  setForm({ ...form, programId: event.target.value })
                }
                required
              >
                <option value="">Selecciona…</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="group-code">Número de ficha</label>
              <input
                id="group-code"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="field">
              <label htmlFor="group-journey">Jornada</label>
              <select
                id="group-journey"
                value={form.journey}
                onChange={(event) =>
                  setForm({ ...form, journey: event.target.value })
                }
              >
                {JOURNEYS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="group-start">Inicio (opcional)</label>
              <input
                id="group-start"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
              />
            </div>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={saving || !form.programId}
            >
              {saving ? 'Creando…' : 'Crear ficha'}
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Fichas ({groups.length})</h2>
        <div className="field">
          <label htmlFor="filter-journey">Filtrar por jornada</label>
          <select
            id="filter-journey"
            value={journey}
            onChange={(event) => setJourney(event.target.value)}
          >
            <option value="">Todas</option>
            {JOURNEYS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : groups.length === 0 ? (
          <p className="muted">Aún no hay fichas registradas.</p>
        ) : (
          <ul className="admin__list">
            {groups.map((group) => (
              <li key={group.id} className="admin__row">
                <div className="admin__info">
                  <strong>Ficha {group.code}</strong>
                  <span className="muted">{group.programName}</span>
                  <span className="admin__chips">
                    <span className="chip">{group.journey}</span>
                    <span
                      className={
                        group.status === 'activa' ? 'chip chip--ok' : 'chip chip--off'
                      }
                    >
                      {group.status}
                    </span>
                  </span>
                </div>
                <div className="admin__actions">
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => onOpen(group.id)}
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
