import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  adjustQuota,
  cafeteriaSummary,
  closeEvent,
  getEventDetail,
  listEventNotifications,
  markCafeteriaPrepared,
  publishEvent,
} from '../lib/api';
import type {
  CafeteriaSummary,
  EventDetail,
  NotificationRow,
} from '../lib/api';

const DELIVERY_ROLES = ['superadmin', 'coordinacion', 'auxiliar'];
const ACUSES_ROLES = ['superadmin', 'coordinacion', 'auxiliar'];

interface Props {
  token: string;
  role: string;
  eventId: string;
  onBack: () => void;
  onDeliver: (eventId: string) => void;
}

export default function EventDetailPage({
  token,
  role,
  eventId,
  onBack,
  onDeliver,
}: Props) {
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [cafeteria, setCafeteria] = useState<CafeteriaSummary | null>(null);
  const [acuses, setAcuses] = useState<NotificationRow[]>([]);
  const showAcuses = ACUSES_ROLES.includes(role);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotaForm, setQuotaForm] = useState<Record<string, { quota: string; reason: string }>>({});

  const load = useCallback(async () => {
    try {
      const [eventDetail, cafeteriaData, acuseRows] = await Promise.all([
        getEventDetail(token, eventId),
        cafeteriaSummary(token, eventId),
        ACUSES_ROLES.includes(role)
          ? listEventNotifications(token, eventId)
          : Promise.resolve([] as NotificationRow[]),
      ]);
      setDetail(eventDetail);
      setCafeteria(cafeteriaData);
      setAcuses(acuseRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el evento.');
    } finally {
      setLoading(false);
    }
  }, [token, eventId, role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshAcuses(): Promise<void> {
    try {
      setAcuses(await listEventNotifications(token, eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los acuses.');
    }
  }

  async function handlePublish(): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await publishEvent(token, eventId);
      setNotice(`Evento publicado con ${result.participants} aprendices convocados`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    }
  }

  async function handleAdjust(
    event: FormEvent<HTMLFormElement>,
    eventGroupId: string,
  ): Promise<void> {
    event.preventDefault();
    const values = quotaForm[eventGroupId];
    if (!values) {
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await adjustQuota(
        token,
        eventId,
        eventGroupId,
        Number(values.quota),
        values.reason,
      );
      setNotice('Cupo ajustado');
      setQuotaForm((current) => ({ ...current, [eventGroupId]: { quota: '', reason: '' } }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar el cupo.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePrepared(): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await markCafeteriaPrepared(token, eventId);
      setNotice('Preparación marcada');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar la preparación.');
    }
  }

  async function handleClose(): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await closeEvent(token, eventId);
      setNotice('Evento cerrado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el evento.');
    }
  }

  if (loading) {
    return (
      <main className="admin">
        <p className="muted">Cargando evento…</p>
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
        <h1>
          Evento {detail.date} · {detail.journey}
        </h1>
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
        <h2>Resumen</h2>
        <p className="muted">
          Convocados: {status.convocado ?? 0} · Confirmados:{' '}
          {status.confirmado ?? 0} · Entregados: {detail.deliveriesTotal} · No
          reclamados: {status.no_reclamado ?? 0}
        </p>
        <span
          className={
            detail.status === 'activo'
              ? 'chip chip--ok'
              : detail.status === 'borrador'
                ? 'chip'
                : 'chip chip--warn'
          }
        >
          {detail.status}
        </span>
        <div className="home__actions">
          {detail.status === 'borrador' ? (
            <button className="btn btn--primary" type="button" onClick={() => void handlePublish()}>
              Publicar evento
            </button>
          ) : null}
          {detail.status === 'activo' && DELIVERY_ROLES.includes(role) ? (
            <button className="btn btn--primary" type="button" onClick={() => onDeliver(eventId)}>
              Abrir entrega
            </button>
          ) : null}
          {detail.status === 'activo' ? (
            <button className="btn btn--secondary" type="button" onClick={() => void handleClose()}>
              Cerrar evento
            </button>
          ) : null}
        </div>
        {detail.closeSummary ? (
          <p className="muted">
            Cierre: planificados {String(detail.closeSummary.planned)} ·
            entregados {String(detail.closeSummary.delivered)} · no reclamados{' '}
            {String(detail.closeSummary.notClaimed)} · desperdicio{' '}
            {String(detail.closeSummary.wastePct)}%
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Cupos por ficha</h2>
        <ul className="admin__list">
          {detail.groups.map((group) => (
            <li key={group.id} className="admin__row">
              <div className="admin__info">
                <strong>Ficha {group.groupCode}</strong>
                <span className="muted">
                  Calculado: {group.calculatedQuota} · Efectivo:{' '}
                  {group.adjustedQuota ?? group.calculatedQuota}
                </span>
              </div>
              {detail.status !== 'cerrado' ? (
                <form
                  className="admin__actions"
                  onSubmit={(event) => void handleAdjust(event, group.id)}
                >
                  <label className="visually-hidden" htmlFor={`quota-${group.id}`}>
                    Nuevo cupo para la ficha {group.groupCode}
                  </label>
                  <input
                    id={`quota-${group.id}`}
                    type="number"
                    min={0}
                    className="quota-input"
                    placeholder="Cupo"
                    value={quotaForm[group.id]?.quota ?? ''}
                    onChange={(event) =>
                      setQuotaForm((current) => ({
                        ...current,
                        [group.id]: {
                          quota: event.target.value,
                          reason: current[group.id]?.reason ?? '',
                        },
                      }))
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Motivo"
                    value={quotaForm[group.id]?.reason ?? ''}
                    onChange={(event) =>
                      setQuotaForm((current) => ({
                        ...current,
                        [group.id]: {
                          quota: current[group.id]?.quota ?? '',
                          reason: event.target.value,
                        },
                      }))
                    }
                    required
                    minLength={3}
                  />
                  <button className="btn btn--secondary btn--small" type="submit" disabled={saving}>
                    Ajustar
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Cafetería</h2>
        <p className="muted">
          Total a preparar: {cafeteria?.totalToPrepare ?? 0} · Confirmados:{' '}
          {cafeteria?.confirmed ?? 0} · Entregados: {cafeteria?.delivered ?? 0}
        </p>
        <p className="muted">
          {cafeteria?.preparedAt
            ? `Preparación marcada: ${new Date(cafeteria.preparedAt).toLocaleString('es-CO')}`
            : 'Preparación sin marcar.'}
        </p>
        {!cafeteria?.preparedAt ? (
          <button className="btn btn--secondary" type="button" onClick={() => void handlePrepared()}>
            Marcar preparación
          </button>
        ) : null}
      </section>

      {showAcuses ? (
        <section className="card">
          <h2>Notificaciones (acuses)</h2>
          <p className="muted">
            Estado de la convocatoria y recordatorios enviados a los aprendices.
          </p>
          <button
            className="btn btn--secondary btn--small"
            type="button"
            onClick={() => void refreshAcuses()}
          >
            Actualizar
          </button>
          {acuses.length === 0 ? (
            <p className="muted">
              Sin notificaciones registradas para este evento (los
              destinatarios sin correo o teléfono no reciben convocatoria).
            </p>
          ) : (
            <ul className="admin__list">
              {acuses.map((item) => (
                <li key={item.id} className="admin__row">
                  <div className="admin__info">
                    <strong>
                      {item.recipientName ?? item.recipientEmail ?? 'Destinatario'}
                    </strong>
                    <span className="muted">
                      {item.type} · canal: {item.channelEffective ?? '—'} ·
                      intentos: {item.attempts}
                    </span>
                    {item.lastError ? (
                      <span className="muted">Último error: {item.lastError}</span>
                    ) : null}
                  </div>
                  <span
                    className={
                      item.status === 'sent'
                        ? 'chip chip--ok'
                        : item.status === 'failed'
                          ? 'chip chip--off'
                          : 'chip chip--warn'
                    }
                  >
                    {item.status === 'sent'
                      ? 'enviado'
                      : item.status === 'failed'
                        ? 'fallido'
                        : item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
