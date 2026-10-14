import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SurveysPage from './SurveysPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetch(routes: Record<string, unknown>): void {
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

describe('SurveysPage', () => {
  it('lista las encuestas con estado, anonimato y totales', async () => {
    mockFetch({
      '/api/surveys': [
        {
          id: 's1',
          title: 'Pulso de bienestar',
          description: 'Cuéntanos cómo te sientes.',
          anonymous: true,
          status: 'publicada',
          minResponses: 3,
          publishedAt: '2026-11-01T00:00:00Z',
          createdAt: '2026-11-01T00:00:00Z',
          questionCount: 2,
          totalResponses: 4,
          segments: [],
        },
      ],
      '/api/groups': [],
      '/api/programs': [],
    });

    render(<SurveysPage token="token" onBack={vi.fn()} />);

    expect(await screen.findByText('Pulso de bienestar')).toBeTruthy();
    expect(screen.getByText('Publicada')).toBeTruthy();
    expect(screen.getByText('Anónima')).toBeTruthy();
    expect(
      screen.getByText(/2 preguntas · 4\s+respuestas/),
    ).toBeTruthy();
  });

  it('muestra el estado vacío cuando no hay encuestas', async () => {
    mockFetch({ '/api/surveys': [], '/api/groups': [], '/api/programs': [] });

    render(<SurveysPage token="token" onBack={vi.fn()} />);

    expect(
      await screen.findByText('Aún no hay encuestas creadas.'),
    ).toBeTruthy();
  });
});
