import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  assignInstructor,
  createLearner,
  getGroupDetail,
  grantConsent,
  listUsers,
  removeInstructor,
  revokeConsent,
  updateLearner,
} from '../lib/api';
import type {
  ConsentRow,
  GroupDetail,
  UserRow,
} from '../lib/api';

const POLICY_VERSION = 'aviso-privacidad-v1';

interface Props {
  token: string;
  groupId: string;
  onBack: () => void;
}

function consentState(
  consents: ConsentRow[],
  learnerId: string,
): 'vigente' | 'revocado' | 'sin' {
  const list = consents.filter((consent) => consent.learnerId === learnerId);
  if (list.length === 0) {
    return 'sin';
  }
  return list.some((consent) => consent.revokedAt === null) ? 'vigente' : 'revocado';
}

export default function GroupDetailPage({ token, groupId, onBack }: Props) {
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learnerForm, setLearnerForm] = useState({
    document: '',
    fullName: '',
    email: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    instructorId: '',
    roleInGroup: 'director',
  });

  const load = useCallback(async () => {
    try {
      const [groupDetail, userList] = await Promise.all([
        getGroupDetail(token, groupId),
        listUsers(token),
      ]);
      setDetail(groupDetail);
      setUsers(userList.filter((user) => user.role === 'instructor'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la ficha.');
    } finally {
      setLoading(false);
    }
  }, [token, groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddLearner(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createLearner(token, {
        groupId,
        document: learnerForm.document,
        fullName: learnerForm.fullName,
        ...(learnerForm.email ? { email: learnerForm.email } : {}),
      });
      setNotice(`Aprendiz registrado: ${learnerForm.fullName}`);
      setLearnerForm({ document: '', fullName: '', email: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el aprendiz.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleLearnerStatus(learnerId: string, current: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const next = current === 'activo' ? 'retirado' : 'activo';
      await updateLearner(token, learnerId, { status: next });
      setNotice(`Estado del aprendiz actualizado: ${next}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el aprendiz.');
    }
  }

  async function handleGrantConsent(learnerId: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await grantConsent(token, learnerId, POLICY_VERSION);
      setNotice('Consentimiento registrado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el consentimiento.');
    }
  }

  async function handleRevokeConsent(consentId: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await revokeConsent(token, consentId);
      setNotice('Consentimiento revocado');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar el consentimiento.');
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await assignInstructor(token, groupId, assignmentForm);
      setNotice('Instructor asignado');
      setAssignmentForm({ instructorId: '', roleInGroup: 'director' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar el instructor.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveInstructor(assignmentId: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await removeInstructor(token, groupId, assignmentId);
      setNotice('Instructor retirado de la ficha');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo retirar el instructor.');
    }
  }

  if (loading) {
    return (
      <main className="admin">
        <p className="muted">Cargando ficha…</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="admin">
        <div className="banner banner--error" role="alert">
          {error ?? 'Ficha no disponible'}
        </div>
        <button className="btn btn--secondary" type="button" onClick={onBack}>
          Volver
        </button>
      </main>
    );
  }

  const availableInstructors = users.filter(
    (user) =>
      user.status === 'activo' &&
      !detail.instructors.some((assignment) => assignment.instructorId === user.id),
  );

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Ficha {detail.code}</h1>
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
        <h2>Datos de la ficha</h2>
        <p className="muted">
          {detail.programName} · jornada {detail.journey}
          {detail.startDate ? ` · inicia ${detail.startDate}` : ''}
        </p>
        <span
          className={detail.status === 'activa' ? 'chip chip--ok' : 'chip chip--off'}
        >
          {detail.status}
        </span>
      </section>

      <section className="card">
        <h2>Aprendices ({detail.learners.length})</h2>
        <form className="admin__form" onSubmit={handleAddLearner} noValidate>
          <div className="field">
            <label htmlFor="learner-document">Documento</label>
            <input
              id="learner-document"
              value={learnerForm.document}
              onChange={(event) =>
                setLearnerForm({ ...learnerForm, document: event.target.value })
              }
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label htmlFor="learner-name">Nombre completo</label>
            <input
              id="learner-name"
              value={learnerForm.fullName}
              onChange={(event) =>
                setLearnerForm({ ...learnerForm, fullName: event.target.value })
              }
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="learner-email">Correo (opcional)</label>
            <input
              id="learner-email"
              type="email"
              value={learnerForm.email}
              onChange={(event) =>
                setLearnerForm({ ...learnerForm, email: event.target.value })
              }
            />
          </div>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Registrando…' : 'Registrar aprendiz'}
          </button>
        </form>

        {detail.learners.length === 0 ? (
          <p className="muted">Aún no hay aprendices en esta ficha.</p>
        ) : (
          <ul className="admin__list">
            {detail.learners.map((learner) => {
              const consent = consentState(detail.consents, learner.id);
              const activeConsent = detail.consents.find(
                (item) => item.learnerId === learner.id && item.revokedAt === null,
              );
              return (
                <li key={learner.id} className="admin__row">
                  <div className="admin__info">
                    <strong>{learner.fullName}</strong>
                    <span className="muted">
                      {learner.document}
                      {learner.email ? ` · ${learner.email}` : ''}
                    </span>
                    <span className="admin__chips">
                      <span
                        className={
                          learner.status === 'activo' ? 'chip chip--ok' : 'chip chip--off'
                        }
                      >
                        {learner.status}
                      </span>
                      <span
                        className={
                          consent === 'vigente'
                            ? 'chip chip--ok'
                            : consent === 'revocado'
                              ? 'chip chip--warn'
                              : 'chip'
                        }
                      >
                        {consent === 'vigente'
                          ? 'Consentimiento vigente'
                          : consent === 'revocado'
                            ? 'Consentimiento revocado'
                            : 'Sin consentimiento'}
                      </span>
                    </span>
                  </div>
                  <div className="admin__actions">
                    {consent === 'vigente' && activeConsent ? (
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() => void handleRevokeConsent(activeConsent.id)}
                      >
                        Revocar consentimiento
                      </button>
                    ) : (
                      <button
                        className="btn btn--secondary btn--small"
                        type="button"
                        onClick={() => void handleGrantConsent(learner.id)}
                      >
                        Registrar consentimiento
                      </button>
                    )}
                    <button
                      className="btn btn--secondary btn--small"
                      type="button"
                      onClick={() => void toggleLearnerStatus(learner.id, learner.status)}
                    >
                      {learner.status === 'activo' ? 'Retirar' : 'Reactivar'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Instructores ({detail.instructors.length})</h2>
        {detail.instructors.length === 0 ? (
          <p className="muted">Sin instructores asignados.</p>
        ) : (
          <ul className="admin__list">
            {detail.instructors.map((assignment) => (
              <li key={assignment.id} className="admin__row">
                <div className="admin__info">
                  <strong>{assignment.name}</strong>
                  <span className="muted">{assignment.email}</span>
                  <span className="chip">{assignment.roleInGroup}</span>
                </div>
                <div className="admin__actions">
                  <button
                    className="btn btn--secondary btn--small"
                    type="button"
                    onClick={() => void handleRemoveInstructor(assignment.id)}
                  >
                    Retirar de la ficha
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {availableInstructors.length > 0 ? (
          <form className="admin__form" onSubmit={handleAssign} noValidate>
            <div className="field">
              <label htmlFor="assign-instructor">Instructor</label>
              <select
                id="assign-instructor"
                value={assignmentForm.instructorId}
                onChange={(event) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    instructorId: event.target.value,
                  })
                }
                required
              >
                <option value="">Selecciona…</option>
                {availableInstructors.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="assign-role">Rol en la ficha</label>
              <select
                id="assign-role"
                value={assignmentForm.roleInGroup}
                onChange={(event) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    roleInGroup: event.target.value,
                  })
                }
              >
                <option value="director">Director</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={saving || !assignmentForm.instructorId}
            >
              Asignar instructor
            </button>
          </form>
        ) : (
          <p className="muted">
            No hay instructores disponibles por asignar (se crean desde Usuarios).
          </p>
        )}
      </section>
    </main>
  );
}
