import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EventsPage from './EventsPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('EventsPage', () => {
  it('lista los eventos con su estado y resumen de participantes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'e1',
            date: '2026-11-10',
            journey: 'manana',
            status: 'activo',
            planned: 3,
            participantsByStatus: { convocado: 2, confirmado: 1, entregado: 0 },
            confirmationDeadline: null,
            cafeteriaPreparedAt: null,
            closeSummary: null,
          },
        ],
      }),
    );

    render(<EventsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('2026-11-10 · manana')).toBeTruthy();
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Planificados: 3 · confirmados: 1 · entregados: 0'),
    ).toBeTruthy();
  });

  it('muestra el estado vacío cuando no hay eventos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    render(<EventsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(
      await screen.findByText('Aún no hay eventos registrados.'),
    ).toBeTruthy();
  });
});
