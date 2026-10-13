import { useState } from 'react';
import type { FormEvent } from 'react';
import QRCode from 'qrcode';
import { ApiError, activateTotp, enrollTotp, login } from '../lib/api';
import type { LoginResponse } from '../lib/api';

interface Props {
  onAuthenticated: (result: LoginResponse) => void;
}

type Step = 'credentials' | 'totp' | 'enroll';

export default function LoginPage({ onAuthenticated }: Props) {
  const [step, setStep] = useState<Step>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');

  function fail(err: unknown): void {
    setError(
      err instanceof Error
        ? err.message
        : 'No se pudo completar la operación. Revisa tu conexión e intenta de nuevo.',
    );
  }

  async function startEnrollment(result: LoginResponse): Promise<void> {
    const enroll = await enrollTotp(result.accessToken);
    const qr = await QRCode.toDataURL(enroll.otpauthUrl, {
      width: 220,
      margin: 1,
    });
    setPendingToken(result.accessToken);
    setQrDataUrl(qr);
    setManualSecret(enroll.secret);
    setCode('');
    setStep('enroll');
  }

  async function handleCredentials(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.totpEnrollmentRequired) {
        await startEnrollment(result);
      } else {
        onAuthenticated(result);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'totp_required') {
        setCode('');
        setStep('totp');
      } else {
        fail(err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password, code);
      onAuthenticated(result);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await activateTotp(pendingToken, code);
      // Tras activar, se completa el ingreso con el mismo código (ventana ±30 s).
      const result = await login(identifier.trim(), password, code);
      onAuthenticated(result);
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth__card card">
        <div className="brand-bar" aria-hidden="true" />
        <h1>BienestarPro</h1>

        {error ? (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        ) : null}

        {step === 'credentials' ? (
          <>
            <p className="muted">Ingresa con tu documento o correo institucional.</p>
            <form onSubmit={handleCredentials} noValidate>
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
          </>
        ) : null}

        {step === 'totp' ? (
          <>
            <p className="muted">
              Tu cuenta tiene verificación en dos pasos. Ingresa el código de 6
              dígitos de tu aplicación de autenticación.
            </p>
            <form onSubmit={handleTotp} noValidate>
              <div className="field">
                <label htmlFor="totp-code">Código de verificación</label>
                <input
                  id="totp-code"
                  name="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button className="btn btn--primary" type="submit" disabled={loading || code.length !== 6}>
                {loading ? 'Verificando…' : 'Verificar e ingresar'}
              </button>
            </form>
            <button
              className="btn btn--secondary auth__back"
              type="button"
              onClick={() => {
                setError(null);
                setStep('credentials');
              }}
            >
              Volver
            </button>
          </>
        ) : null}

        {step === 'enroll' ? (
          <>
            <p className="muted">
              Tu rol exige verificación en dos pasos. Escanea el código con tu
              aplicación de autenticación (Google Authenticator, Authy u otra).
            </p>
            {qrDataUrl ? (
              <img
                className="qr"
                src={qrDataUrl}
                alt="Código QR para configurar la verificación en dos pasos"
              />
            ) : null}
            <p className="muted auth__secret">
              ¿No puedes escanear? Escribe este código en la aplicación:
              <br />
              <strong>{manualSecret}</strong>
            </p>
            <form onSubmit={handleEnroll} noValidate>
              <div className="field">
                <label htmlFor="enroll-code">Código de 6 dígitos que muestra la aplicación</label>
                <input
                  id="enroll-code"
                  name="enroll-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button className="btn btn--primary" type="submit" disabled={loading || code.length !== 6}>
                {loading ? 'Activando…' : 'Activar y continuar'}
              </button>
            </form>
          </>
        ) : null}
      </div>

      <p className="auth__note muted">
        Área de Bienestar al Aprendiz — Centro de Comercio y Turismo (SENA)
      </p>
    </main>
  );
}
