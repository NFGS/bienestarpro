import type { SessionUser } from '../lib/api';

interface Props {
  user: SessionUser;
  onLogout: () => void;
  onNavigate: (view: 'users' | 'audit' | 'groups') => void;
}

const ADMIN_ROLES = ['superadmin', 'coordinacion'];
const DIRECTORY_ROLES = ['superadmin', 'coordinacion', 'instructor', 'auxiliar'];

export default function HomePage({ user, onLogout, onNavigate }: Props) {
  return (
    <main className="home">
      <header className="home__header">
        <h1>Hola, {user.name}</h1>
        <button className="btn btn--secondary" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <section className="card">
        <h2>Inicio</h2>
        <p className="muted">
          Sesión activa como <strong>{user.email}</strong> (rol: {user.role}).
          Los módulos del piloto llegan en las siguientes rebanadas.
        </p>
        {DIRECTORY_ROLES.includes(user.role) ? (
          <div className="home__actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => onNavigate('groups')}
            >
              Fichas
            </button>
            {ADMIN_ROLES.includes(user.role) ? (
              <>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => onNavigate('users')}
                >
                  Usuarios
                </button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => onNavigate('audit')}
                >
                  Auditoría
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
