import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createSurvey,
  downloadSurveyCsv,
  getSurveyResults,
  listGroups,
  listPrograms,
  listSurveys,
  publishSurvey,
} from '../lib/api';
import type {
  GroupRow,
  ProgramRow,
  QuestionInput,
  ResultQuestion,
  SurveyResults,
  SurveyRow,
} from '../lib/api';

const JOURNEYS = [
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
];

interface QuestionDraft {
  key: number;
  text: string;
  type: 'unica' | 'multiple' | 'escala';
  required: boolean;
  options: string[];
}

function emptyQuestion(key: number): QuestionDraft {
  return { key, text: '', type: 'unica', required: true, options: ['', ''] };
}

interface Props {
  token: string;
  onBack: () => void;
}

function ResultList({ questions }: { questions: ResultQuestion[] }) {
  return (
    <div>
      {questions.map((question) => (
        <div key={question.id} className="survey-results">
          <strong>{question.text}</strong>
          <span className="muted"> · {question.respondents} respuesta(s)</span>
          {question.type === 'escala' ? (
            <div>
              <p className="muted">
                Promedio: {question.average ?? '—'} (escala {question.scaleMin}–
                {question.scaleMax})
              </p>
              {question.distribution.map((item) => (
                <div key={item.value} className="survey-result-row">
                  <span>Valor {item.value}</span>
                  <span className="muted">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            question.options.map((option) => (
              <div key={option.optionId} className="survey-result-row">
                <span>{option.label}</span>
                <span className="muted">
                  {option.count} ({option.percentage}%)
                </span>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

/** CU-27 a CU-29 (RF-33 a RF-35): gestión de encuestas desde coordinación. */
export default function SurveysPage({ token, onBack }: Props) {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [results, setResults] = useState<Record<string, SurveyResults>>({});
  const [openResults, setOpenResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextKey, setNextKey] = useState(1);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(0)]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    anonymous: false,
    minResponses: 5,
    segmentType: '',
    segmentValue: '',
  });

  const load = useCallback(async () => {
    try {
      const [surveyRows, groupRows, programRows] = await Promise.all([
        listSurveys(token),
        listGroups(token),
        listPrograms(token),
      ]);
      setSurveys(surveyRows);
      setGroups(groupRows);
      setPrograms(programRows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar las encuestas.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateQuestion(key: number, patch: Partial<QuestionDraft>): void {
    setQuestions((drafts) =>
      drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function addQuestion(): void {
    setQuestions((drafts) => [...drafts, emptyQuestion(nextKey)]);
    setNextKey((key) => key + 1);
  }

  function removeQuestion(key: number): void {
    setQuestions((drafts) => drafts.filter((draft) => draft.key !== key));
  }

  function updateOption(questionKey: number, index: number, value: string): void {
    setQuestions((drafts) =>
      drafts.map((draft) => {
        if (draft.key !== questionKey) {
          return draft;
        }
        const options = [...draft.options];
        options[index] = value;
        return { ...draft, options };
      }),
    );
  }

  function addOption(questionKey: number): void {
    setQuestions((drafts) =>
      drafts.map((draft) =>
        draft.key === questionKey
          ? { ...draft, options: [...draft.options, ''] }
          : draft,
      ),
    );
  }

  function removeOption(questionKey: number, index: number): void {
    setQuestions((drafts) =>
      drafts.map((draft) =>
        draft.key === questionKey
          ? { ...draft, options: draft.options.filter((_, i) => i !== index) }
          : draft,
      ),
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (form.title.trim().length < 3 || form.description.trim().length < 3) {
      setError('El título y la descripción son obligatorios.');
      return;
    }
    if (form.segmentType && !form.segmentValue) {
      setError('Selecciona el valor del segmento o déjalo en "Todo el centro".');
      return;
    }
    const payloadQuestions: QuestionInput[] = [];
    for (const [index, question] of questions.entries()) {
      const text = question.text.trim();
      if (text.length < 3) {
        setError(`La pregunta ${index + 1} necesita un texto.`);
        return;
      }
      if (question.type === 'escala') {
        payloadQuestions.push({
          text,
          type: 'escala',
          required: question.required,
          scaleMin: 1,
          scaleMax: 5,
        });
        continue;
      }
      const options = question.options
        .map((option) => option.trim())
        .filter((option) => option.length > 0)
        .map((label) => ({ label }));
      if (options.length < 2) {
        setError(`La pregunta ${index + 1} necesita al menos dos opciones.`);
        return;
      }
      payloadQuestions.push({
        text,
        type: question.type,
        required: question.required,
        options,
      });
    }
    setSaving(true);
    try {
      await createSurvey(token, {
        title: form.title.trim(),
        description: form.description.trim(),
        anonymous: form.anonymous,
        ...(form.anonymous ? { minResponses: form.minResponses } : {}),
        questions: payloadQuestions,
        ...(form.segmentType && form.segmentValue
          ? {
              segments: [
                { segmentType: form.segmentType, segmentValue: form.segmentValue },
              ],
            }
          : {}),
      });
      setNotice('Encuesta creada en borrador.');
      setForm({ ...form, title: '', description: '', segmentValue: '' });
      setQuestions([emptyQuestion(nextKey)]);
      setNextKey((key) => key + 1);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la encuesta.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      const result = await publishSurvey(token, id);
      setNotice(
        `Publicada: ${result.recipients} destinatarios, ${result.notificationsQueued} notificaciones en cola.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    }
  }

  async function handleResults(id: string): Promise<void> {
    setError(null);
    if (openResults === id) {
      setOpenResults(null);
      return;
    }
    try {
      const data = await getSurveyResults(token, id);
      setResults((current) => ({ ...current, [id]: data }));
      setOpenResults(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron cargar los resultados.',
      );
    }
  }

  async function handleExport(id: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await downloadSurveyCsv(token, id);
      setNotice('CSV de resultados descargado.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo exportar el CSV.',
      );
    }
  }

  function segmentLabel(segment: {
    segmentType: string;
    segmentValue: string;
  }): string {
    if (segment.segmentType === 'jornada') {
      return `jornada ${segment.segmentValue}`;
    }
    if (segment.segmentType === 'ficha') {
      const group = groups.find((item) => item.id === segment.segmentValue);
      return group ? `ficha ${group.code}` : 'ficha';
    }
    const program = programs.find((item) => item.id === segment.segmentValue);
    return program ? `programa ${program.name}` : 'programa';
  }

  return (
    <main className="admin">
      <header className="home__header">
        <h1>Encuestas</h1>
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
        <h2>Crear encuesta</h2>
        <form onSubmit={(event) => void handleCreate(event)} noValidate>
          <div className="field">
            <label htmlFor="survey-title">Título</label>
            <input
              id="survey-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="survey-description">Descripción</label>
            <textarea
              id="survey-description"
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
              minLength={3}
            />
          </div>
          <div className="admin__form">
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(event) =>
                  setForm({ ...form, anonymous: event.target.checked })
                }
              />
              Encuesta anónima
            </label>
            {form.anonymous ? (
              <div className="field">
                <label htmlFor="survey-min">
                  Mínimo de respuestas por ficha para mostrar desgloses
                </label>
                <input
                  id="survey-min"
                  type="number"
                  min={3}
                  max={100}
                  value={form.minResponses}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      minResponses: Number(event.target.value) || 5,
                    })
                  }
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="survey-segment-type">Segmento (opcional)</label>
              <select
                id="survey-segment-type"
                value={form.segmentType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    segmentType: event.target.value,
                    segmentValue: '',
                  })
                }
              >
                <option value="">Todo el centro</option>
                <option value="ficha">Ficha</option>
                <option value="jornada">Jornada</option>
                <option value="programa">Programa</option>
              </select>
            </div>
            {form.segmentType ? (
              <div className="field">
                <label htmlFor="survey-segment-value">Valor del segmento</label>
                <select
                  id="survey-segment-value"
                  value={form.segmentValue}
                  onChange={(event) =>
                    setForm({ ...form, segmentValue: event.target.value })
                  }
                  required
                >
                  <option value="">Selecciona…</option>
                  {form.segmentType === 'ficha'
                    ? groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          Ficha {group.code}
                        </option>
                      ))
                    : null}
                  {form.segmentType === 'jornada'
                    ? JOURNEYS.map((journey) => (
                        <option key={journey.value} value={journey.value}>
                          {journey.label}
                        </option>
                      ))
                    : null}
                  {form.segmentType === 'programa'
                    ? programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))
                    : null}
                </select>
              </div>
            ) : null}
          </div>

          <h3 className="prefs__subtitle">Preguntas</h3>
          {questions.map((question, index) => (
            <div key={question.key} className="survey-question">
              <div className="field">
                <label htmlFor={`survey-q-${question.key}`}>
                  Pregunta {index + 1}
                </label>
                <input
                  id={`survey-q-${question.key}`}
                  value={question.text}
                  onChange={(event) =>
                    updateQuestion(question.key, { text: event.target.value })
                  }
                  placeholder="¿Qué quieres preguntar?"
                  required
                  minLength={3}
                />
              </div>
              <div className="admin__form">
                <div className="field">
                  <label htmlFor={`survey-q-${question.key}-type`}>Tipo</label>
                  <select
                    id={`survey-q-${question.key}-type`}
                    value={question.type}
                    onChange={(event) =>
                      updateQuestion(question.key, {
                        type: event.target.value as QuestionDraft['type'],
                      })
                    }
                  >
                    <option value="unica">Selección única</option>
                    <option value="multiple">Selección múltiple</option>
                    <option value="escala">Escala 1 a 5</option>
                  </select>
                </div>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) =>
                      updateQuestion(question.key, {
                        required: event.target.checked,
                      })
                    }
                  />
                  Obligatoria
                </label>
              </div>
              {question.type !== 'escala' ? (
                <div className="survey-options">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="survey-option-row">
                      <input
                        aria-label={`Opción ${optionIndex + 1} de la pregunta ${index + 1}`}
                        value={option}
                        onChange={(event) =>
                          updateOption(question.key, optionIndex, event.target.value)
                        }
                        placeholder={`Opción ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btn--secondary btn--small"
                        onClick={() => removeOption(question.key, optionIndex)}
                        disabled={question.options.length <= 2}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => addOption(question.key)}
                  >
                    + Opción
                  </button>
                </div>
              ) : (
                <p className="muted">Escala de 1 a 5.</p>
              )}
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => removeQuestion(question.key)}
                disabled={questions.length <= 1}
              >
                Eliminar pregunta
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={addQuestion}
          >
            + Agregar pregunta
          </button>
          <div className="prefs__subtitle">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Creando…' : 'Crear encuesta'}
            </button>
          </div>
          {form.anonymous ? (
            <p className="muted">
              En encuestas anónimas no se podrá identificar a los respondientes.
            </p>
          ) : null}
        </form>
      </section>

      <section className="card">
        <h2>Encuestas ({surveys.length})</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : surveys.length === 0 ? (
          <p className="muted">Aún no hay encuestas creadas.</p>
        ) : (
          <ul className="admin__list">
            {surveys.map((survey) => (
              <li key={survey.id} className="admin__row">
                <div className="admin__info">
                  <strong>{survey.title}</strong>
                  <span className="muted">{survey.description}</span>
                  <span className="muted">
                    {survey.questionCount} preguntas · {survey.totalResponses}{' '}
                    respuestas
                    {survey.segments.length === 0
                      ? ' · todo el centro'
                      : ` · ${survey.segments.map(segmentLabel).join(', ')}`}
                  </span>
                  <span className="admin__chips">
                    <span
                      className={
                        survey.status === 'publicada' ? 'chip chip--ok' : 'chip'
                      }
                    >
                      {survey.status === 'publicada' ? 'Publicada' : 'Borrador'}
                    </span>
                    <span className={survey.anonymous ? 'chip chip--ok' : 'chip chip--off'}>
                      {survey.anonymous ? 'Anónima' : 'Identificada'}
                    </span>
                  </span>
                </div>
                <div className="admin__actions">
                  {survey.status === 'borrador' ? (
                    <button
                      className="btn btn--primary btn--small"
                      type="button"
                      onClick={() => void handlePublish(survey.id)}
                    >
                      Publicar
                    </button>
                  ) : null}
                  {survey.status === 'publicada' ? (
                    <button
                      className="btn btn--secondary btn--small"
                      type="button"
                      onClick={() => void handleResults(survey.id)}
                    >
                      {openResults === survey.id ? 'Ocultar resultados' : 'Resultados'}
                    </button>
                  ) : null}
                  {survey.status === 'publicada' && survey.totalResponses > 0 ? (
                    <button
                      className="btn btn--secondary btn--small"
                      type="button"
                      onClick={() => void handleExport(survey.id)}
                    >
                      Exportar CSV
                    </button>
                  ) : null}
                </div>
                {openResults === survey.id && results[survey.id] ? (
                  <div className="survey-results survey-results--full">
                    <p className="muted">
                      Total: {results[survey.id]!.totalResponses} respuestas
                      {results[survey.id]!.hiddenSegments > 0
                        ? ` · ${results[survey.id]!.hiddenSegments} ficha(s) oculta(s) por el umbral de ${results[survey.id]!.survey.minResponses} respuestas`
                        : ''}
                    </p>
                    <ResultList questions={results[survey.id]!.questions} />
                    {results[survey.id]!.segments.map((segment) => (
                      <div key={segment.groupId} className="survey-results">
                        <strong>
                          Ficha {segment.groupCode ?? segment.groupId}
                          {segment.journey ? ` · ${segment.journey}` : ''} —{' '}
                          {segment.responses} respuestas
                        </strong>
                        <ResultList questions={segment.questions} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
