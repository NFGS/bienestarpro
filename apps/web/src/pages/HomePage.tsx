import type { SessionUser } from '../lib/api';

interface Props {
  user: SessionUser;
  onLogout: () => void;
}

export default function HomePage({ user, onLogout }: Props) {
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
      </section>
    </main>
  );
}
