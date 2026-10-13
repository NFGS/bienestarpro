import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  getEventDetail,
  registerDelivery,
  searchParticipant,
} from '../lib/api';
import { ApiError } from '../lib/api';
import type { EventDetail, ParticipantSearch } from '../lib/api';

interface Props {
  token: string;
  eventId: string;
  onBack: () => void;
}

export default function DeliveryPage({ token, eventId, onBack }: Props) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [scanCode, setScanCode] = useState('');
  const [manualDocument, setManualDocument] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [found, setFound] = useState<ParticipantSearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await getEventDetail(token, eventId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el evento.');
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleScan(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await registerDelivery(token, eventId, {
        method: 'qr',
        qrToken: scanCode.trim(),
        clientUuid: crypto.randomUUID(),
      });
      setNotice(
        result.idempotent
          ? 'Entrega ya registrada (sincronización repetida)'
          : 'Entrega registrada correctamente',
      );
      setScanCode('');
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'not_confirmed') {
        setError(
          'El aprendiz no ha confirmado su asistencia. Usa la entrega manual con autorización si corresponde.',
        );
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo registrar la entrega.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    setFound(null);
    try {
      setFound(await searchParticipant(token, eventId, manualDocument.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se encontró al aprendiz.');
    } finally {
      setSaving(false);
    }
  }

  async function handleManualDelivery(): Promise<void> {
    if (!found) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await registerDelivery(token, eventId, {
        method: 'manual',
        learnerId: found.learnerId,
        clientUuid: crypto.randomUUID(),
        reason: manualReason,
        ...(found.confirmed ? {} : { override: true }),
      });
      setNotice(`Entrega manual registrada: ${found.fullName}`);
      setFound(null);
      setManualDocument('');
      setManualReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la entrega manual.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin">
        <p className="muted">Cargando entrega…</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="admin">
        <div className="banner banner--error" role="alert">
          {error ?? 'Evento no disponible'}
        </div>
        <button className="btn btn--secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </main>
    );
  }

  const status = detail.participantsByStatus;

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Entrega de refrigerios</h1>
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
        <p className="muted">
          {detail.date} · jornada {detail.journey}
        </p>
        <div className="counters">
          <div className="counters__item">
            <strong>{status.convocado ?? 0}</strong>
            <span className="muted">Convocados</span>
          </div>
          <div className="counters__item">
            <strong>{status.confirmado ?? 0}</strong>
            <span className="muted">Confirmados</span>
          </div>
          <div className="counters__item">
            <strong>{detail.deliveriesTotal}</strong>
            <span className="muted">Entregados</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Escanear código</h2>
        <p className="muted">
          Escanea el código del aprendiz o pégalo aquí (la cámara se integra en
          la versión instalada de la PWA).
        </p>
        <form onSubmit={handleScan} noValidate>
          <div className="field">
            <label htmlFor="scan-code">Código del aprendiz</label>
            <input
              id="scan-code"
              className="scan-input"
              value={scanCode}
              onChange={(event) => setScanCode(event.target.value)}
              placeholder="Pega el código del QR"
              required
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving || scanCode.trim().length < 10}>
            {saving ? 'Registrando…' : 'Registrar entrega'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Entrega manual (sin código)</h2>
        <form className="admin__form" onSubmit={handleSearch} noValidate>
          <div className="field">
            <label htmlFor="manual-document">Documento del aprendiz</label>
            <input
              id="manual-document"
              value={manualDocument}
              onChange={(event) => setManualDocument(event.target.value)}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn--secondary" type="submit" disabled={saving}>
            Buscar
          </button>
        </form>

        {found ? (
          <div className="admin__row">
            <div className="admin__info">
              <strong>{found.fullName}</strong>
              <span className="muted">{found.document}</span>
              <span className="admin__chips">
                <span className={found.confirmed ? 'chip chip--ok' : 'chip chip--warn'}>
                  {found.confirmed ? 'Confirmado' : `Estado: ${found.status}`}
                </span>
              </span>
              {!found.confirmed ? (
                <span className="muted">
                  Sin confirmación: la entrega quedará registrada como excepción
                  autorizada (motivo obligatorio).
                </span>
              ) : null}
            </div>
            <div className="admin__actions">
              <div className="field">
                <label htmlFor="manual-reason">Motivo</label>
                <input
                  id="manual-reason"
                  value={manualReason}
                  onChange={(event) => setManualReason(event.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <button
                className="btn btn--primary btn--small"
                type="button"
                disabled={saving || manualReason.trim().length < 3}
                onClick={() => void handleManualDelivery()}
              >
                Registrar entrega manual
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
