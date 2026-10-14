import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SurveyAnswerPage from './SurveyAnswerPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const SURVEY = {
  id: 's1',
  title: 'Clima de bienestar',
  description: 'Queremos conocer tu opinión.',
  anonymous: true,
  publishedAt: '2026-11-01T00:00:00Z',
  answered: false,
  questions: [
    {
      id: 'q1',
      text: '¿Te gustó la actividad?',
      type: 'unica',
      required: true,
      scaleMin: null,
      scaleMax: null,
      options: [
        { id: 'o1', label: 'Sí' },
        { id: 'o2', label: 'No' },
      ],
    },
  ],
};

function mockRoutes(routes: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const path = new URL(url).pathname;
      const body = routes[path];
      if (body === undefined) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'No encontrado' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => body });
    }),
  );
}

describe('SurveyAnswerPage', () => {
  it('muestra la encuesta anónima disponible con sus opciones', async () => {
    mockRoutes({ '/api/surveys/available': [SURVEY] });

    render(<SurveyAnswerPage token="token" onBack={vi.fn()} />);

    expect(await screen.findByText('Clima de bienestar')).toBeTruthy();
    expect(screen.getByText(/no se guarda tu identidad/)).toBeTruthy();
    expect(screen.getByLabelText('Sí')).toBeTruthy();
    expect(screen.getByLabelText('No')).toBeTruthy();
  });

  it('envía las respuestas seleccionadas y confirma en pantalla', async () => {
    let posted = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        if (path === '/api/surveys/s1/responses' && init?.method === 'POST') {
          posted = true;
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, anonymous: true }),
          });
        }
        if (path === '/api/surveys/available') {
          return Promise.resolve({ ok: true, json: async () => [SURVEY] });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'No encontrado' }),
        });
      }),
    );

    render(<SurveyAnswerPage token="token" onBack={vi.fn()} />);
    fireEvent.click(await screen.findByLabelText('Sí'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }));

    expect(await screen.findByText(/Respuestas enviadas/)).toBeTruthy();
    await waitFor(() => expect(posted).toBe(true));
  });
});
