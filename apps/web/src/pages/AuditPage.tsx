import { useEffect, useState } from 'react';
import { listAudit } from '../lib/api';
import type { AuditRow } from '../lib/api';

interface Props {
  token: string;
  onBack: () => void;
}

export default function AuditPage({ token, onBack }: Props) {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAudit(token)
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'No se pudo cargar la auditoría.',
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Auditoría</h1>
        <button className="btn btn--secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </header>

      {error ? (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="card">
        <h2>Últimos eventos ({total} en total)</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Aún no hay eventos registrados.</p>
        ) : (
          <ul className="admin__list">
            {items.map((item) => (
              <li key={item.id} className="admin__row">
                <div className="admin__info">
                  <strong>{item.action}</strong>
                  <span className="muted">
                    {item.actorEmail ?? 'sistema'} ·{' '}
                    {new Date(item.createdAt).toLocaleString('es-CO')}
                  </span>
                  {item.entity ? (
                    <span className="chip">{item.entity}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
