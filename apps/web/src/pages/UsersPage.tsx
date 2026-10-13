import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createUser, listUsers, updateUser } from '../lib/api';
import type { UserRow } from '../lib/api';

const ROLES = [
  'superadmin',
  'coordinacion',
  'auxiliar',
  'instructor',
  'vocero',
  'aprendiz',
  'cafeteria',
  'porteria',
];

interface Props {
  token: string;
  onBack: () => void;
}

export default function UsersPage({ token, onBack }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    document: '',
    email: '',
    password: '',
    role: 'aprendiz',
  });

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers(token));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.',
      );
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
      const created = await createUser(token, form);
      setNotice(`Usuario creado: ${created.name}`);
      setForm({ name: '', document: '', email: '', password: '', role: 'aprendiz' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(user: UserRow, role: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await updateUser(token, user.id, { role });
      setNotice(`Rol actualizado: ${user.name} → ${role}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el rol.');
    }
  }

  async function toggleStatus(user: UserRow): Promise<void> {
    setError(null);
    setNotice(null);
    const status = user.status === 'activo' ? 'inactivo' : 'activo';
    try {
      await updateUser(token, user.id, { status });
      setNotice(`Estado actualizado: ${user.name} → ${status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    }
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Usuarios</h1>
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
        <h2>Crear usuario</h2>
        <form className="admin__form" onSubmit={handleCreate} noValidate>
          <div className="field">
            <label htmlFor="new-name">Nombre completo</label>
            <input
              id="new-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-document">Documento</label>
            <input
              id="new-document"
              value={form.document}
              onChange={(event) => setForm({ ...form, document: event.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label htmlFor="new-email">Correo</label>
            <input
              id="new-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">Contraseña temporal</label>
            <input
              id="new-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label htmlFor="new-role">Rol</label>
            <select
              id="new-role"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Usuarios del centro ({users.length})</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <ul className="admin__list">
            {users.map((user) => (
              <li key={user.id} className="admin__row">
                <div className="admin__info">
                  <strong>{user.name}</strong>
                  <span className="muted">
                    {user.document} · {user.email}
                  </span>
                  <span
                    className={
                      user.status === 'activo' ? 'chip chip--ok' : 'chip chip--off'
                    }
                  >
                    {user.status}
                  </span>
                </div>
                <div className="admin__actions">
                  <label className="visually-hidden" htmlFor={`role-${user.id}`}>
                    Rol de {user.name}
                  </label>
                  <select
                    id={`role-${user.id}`}
                    value={user.role}
                    onChange={(event) => void changeRole(user, event.target.value)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => void toggleStatus(user)}
                  >
                    {user.status === 'activo' ? 'Desactivar' : 'Activar'}
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
