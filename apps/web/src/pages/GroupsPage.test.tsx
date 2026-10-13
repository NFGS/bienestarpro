import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GroupsPage from './GroupsPage';

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

describe('GroupsPage', () => {
  it('lista las fichas del directorio con su programa y jornada', async () => {
    mockFetch({
      '/api/programs': [{ id: 'p1', name: 'ADSO', status: 'activo' }],
      '/api/groups': [
        {
          id: 'g1',
          programId: 'p1',
          code: '2847012',
          journey: 'manana',
          status: 'activa',
          startDate: null,
          endDate: null,
          programName: 'ADSO',
        },
      ],
    });

    render(<GroupsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Ficha 2847012')).toBeTruthy();
    expect(screen.getAllByText('ADSO').length).toBeGreaterThan(0);
    expect(screen.getByText('manana')).toBeTruthy();
  });

  it('cuando no hay programas invita a crear el primero', async () => {
    mockFetch({
      '/api/programs': [],
      '/api/groups': [],
    });

    render(<GroupsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText('Primer paso: crea un programa')).toBeTruthy(),
    );
  });
});
