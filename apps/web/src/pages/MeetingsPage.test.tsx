import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MeetingsPage from './MeetingsPage';

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

describe('MeetingsPage', () => {
  it('lista las reuniones con su estado y resumen de convocados', async () => {
    mockFetch({
      '/api/meetings': [
        {
          id: 'm1',
          title: 'Comité de bienestar',
          description: '',
          startsAt: '2026-11-10T14:00:00.000Z',
          endsAt: null,
          location: 'Auditorio',
          status: 'agendada',
          organizerId: 'u1',
          organizerName: 'Coordinación Demo',
          reminderAt: null,
          reminderSentAt: null,
          createdAt: '2026-11-01T00:00:00.000Z',
          inviteesTotal: 2,
          groupsTotal: 1,
          confirmed: 1,
          pending: 1,
          rejected: 0,
          hasMinutes: false,
        },
      ],
      '/api/users': [
        {
          id: 'u1',
          centerId: 'c1',
          document: '1',
          email: 'demo@bienestarpro.local',
          name: 'Coordinación Demo',
          role: 'coordinacion',
          status: 'activo',
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
      '/api/groups': [],
    });

    render(<MeetingsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Comité de bienestar')).toBeTruthy();
    expect(screen.getByText('Agendada')).toBeTruthy();
    expect(
      screen.getByText(/2 convocados · 1 confirmados · 1 pendientes · 1 ficha/),
    ).toBeTruthy();
  });

  it('muestra el estado vacío cuando no hay reuniones', async () => {
    mockFetch({ '/api/meetings': [], '/api/users': [], '/api/groups': [] });

    render(<MeetingsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(
      await screen.findByText('Aún no hay reuniones agendadas.'),
    ).toBeTruthy();
  });
});
