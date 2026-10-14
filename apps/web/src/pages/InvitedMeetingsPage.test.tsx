import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InvitedMeetingsPage from './InvitedMeetingsPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const MEETING = {
  id: 'm1',
  title: 'Comité de bienestar',
  description: 'Revisión mensual.',
  startsAt: '2026-11-10T14:00:00.000Z',
  endsAt: null,
  location: 'Auditorio',
  status: 'agendada',
  myRsvpStatus: 'pendiente',
  hasMinutes: false,
};

describe('InvitedMeetingsPage', () => {
  it('muestra la invitación con su estado de confirmación', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [MEETING] }),
    );

    render(<InvitedMeetingsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Comité de bienestar')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Confirmar asistencia')).toBeTruthy();
  });

  it('confirma la asistencia y refresca el estado', async () => {
    let posted = false;
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        const path = new URL(url).pathname;
        if (path === '/api/meetings/m1/rsvp' && init?.method === 'POST') {
          posted = true;
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'i1', rsvpStatus: 'confirmado' }),
          });
        }
        if (path === '/api/meetings/invited') {
          return Promise.resolve({ ok: true, json: async () => [MEETING] });
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'No encontrado' }),
        });
      }),
    );

    render(<InvitedMeetingsPage token="token" onBack={vi.fn()} onOpen={vi.fn()} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirmar asistencia' }),
    );

    expect(await screen.findByText('Asistencia confirmada.')).toBeTruthy();
    await waitFor(() => expect(posted).toBe(true));
  });
});
