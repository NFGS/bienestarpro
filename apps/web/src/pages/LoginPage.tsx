import { useState } from 'react';
import type { FormEvent } from 'react';
import { login } from '../lib/api';
import type { LoginResponse } from '../lib/api';

interface Props {
  onAuthenticated: (result: LoginResponse) => void;
}

export default function LoginPage({ onAuthenticated }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      onAuthenticated(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Revisa tu conexión e intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth__card card">
        <div className="brand-bar" aria-hidden="true" />
        <h1>BienestarPro</h1>
        <p className="muted">
          Ingresa con tu documento o correo institucional.
        </p>

        {error ? (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="identifier">Documento o correo</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              minLength={4}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>

      <p className="auth__note muted">
        Área de Bienestar al Aprendiz — Centro de Comercio y Turismo (SENA)
      </p>
    </main>
  );
}
