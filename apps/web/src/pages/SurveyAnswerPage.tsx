import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listAvailableSurveys, submitSurveyResponse } from '../lib/api';
import type { AvailableSurvey, SurveyQuestionRow } from '../lib/api';

interface Props {
  token: string;
  onBack: () => void;
}

interface AnswerState {
  optionIds: string[];
  scaleValue: number | null;
}

function range(min: number, max: number): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value += 1) {
    values.push(value);
  }
  return values;
}

function SurveyForm({
  token,
  survey,
  onSubmitted,
}: {
  token: string;
  survey: AvailableSurvey;
  onSubmitted: (message: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    Object.fromEntries(
      survey.questions.map((question) => [
        question.id,
        { optionIds: [], scaleValue: null },
      ]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleOption(question: SurveyQuestionRow, optionId: string): void {
    setAnswers((current) => {
      const previous = current[question.id] ?? {
        optionIds: [],
        scaleValue: null,
      };
      const optionIds =
        question.type === 'unica'
          ? [optionId]
          : previous.optionIds.includes(optionId)
            ? previous.optionIds.filter((id) => id !== optionId)
            : [...previous.optionIds, optionId];
      return { ...current, [question.id]: { ...previous, optionIds } };
    });
  }

  function setScale(questionId: string, value: number): void {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? { optionIds: [], scaleValue: null }),
        scaleValue: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    const missing = survey.questions.some((question) => {
      if (!question.required) {
        return false;
      }
      const answer = answers[question.id];
      if (!answer) {
        return true;
      }
      return question.type === 'escala'
        ? answer.scaleValue === null
        : answer.optionIds.length === 0;
    });
    if (missing) {
      setError('Responde todas las preguntas obligatorias antes de enviar.');
      return;
    }
    const payload: {
      questionId: string;
      optionIds?: string[];
      scaleValue?: number;
    }[] = [];
    for (const question of survey.questions) {
      const answer = answers[question.id];
      if (!answer) {
        continue;
      }
      if (question.type === 'escala') {
        if (answer.scaleValue !== null) {
          payload.push({ questionId: question.id, scaleValue: answer.scaleValue });
        }
        continue;
      }
      if (answer.optionIds.length > 0) {
        payload.push({ questionId: question.id, optionIds: answer.optionIds });
      }
    }
    if (payload.length === 0) {
      setError('Responde al menos una pregunta antes de enviar.');
      return;
    }
    setSaving(true);
    try {
      await submitSurveyResponse(token, survey.id, payload);
      onSubmitted(
        survey.anonymous
          ? '¡Respuestas enviadas! Gracias por participar (en anonimato).'
          : '¡Respuestas enviadas! Gracias por participar.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron enviar tus respuestas.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      {error ? (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      ) : null}
      {survey.questions.map((question, index) => (
        <div key={question.id} className="survey-question">
          <strong>
            {index + 1}. {question.text}
            {question.required ? ' *' : ''}
          </strong>
          {question.type === 'escala' ? (
            <div
              className="survey-options"
              role="radiogroup"
              aria-label={question.text}
            >
              {range(question.scaleMin ?? 1, question.scaleMax ?? 5).map(
                (value) => (
                  <label key={value} className="check-row">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      checked={answers[question.id]?.scaleValue === value}
                      onChange={() => setScale(question.id, value)}
                    />
                    {value}
                  </label>
                ),
              )}
            </div>
          ) : (
            <div className="survey-options">
              {question.options.map((option) => (
                <label key={option.id} className="check-row">
                  <input
                    type={question.type === 'unica' ? 'radio' : 'checkbox'}
                    name={`q-${question.id}`}
                    checked={
                      answers[question.id]?.optionIds.includes(option.id) ?? false
                    }
                    onChange={() => toggleOption(question, option.id)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="btn btn--primary" type="submit" disabled={saving}>
        {saving ? 'Enviando…' : 'Enviar respuestas'}
      </button>
    </form>
  );
}

/** CU-28 (RF-34): encuestas publicadas aplicables al aprendiz autenticado. */
export default function SurveyAnswerPage({ token, onBack }: Props) {
  const [surveys, setSurveys] = useState<AvailableSurvey[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setSurveys(await listAvailableSurveys(token));
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

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : surveys.length === 0 ? (
        <section className="card">
          <p className="muted">No tienes encuestas pendientes por ahora.</p>
        </section>
      ) : (
        surveys.map((survey) => (
          <section key={survey.id} className="card">
            <h2>{survey.title}</h2>
            <p className="muted">{survey.description}</p>
            {survey.anonymous ? (
              <div className="banner banner--success">
                Encuesta anónima: en tus respuestas no se guarda tu identidad.
              </div>
            ) : null}
            {survey.answered ? (
              <p className="muted">Ya respondiste esta encuesta.</p>
            ) : (
              <SurveyForm
                token={token}
                survey={survey}
                onSubmitted={(message) => {
                  setNotice(message);
                  setError(null);
                  void load();
                }}
              />
            )}
          </section>
        ))
      )}
    </main>
  );
}
