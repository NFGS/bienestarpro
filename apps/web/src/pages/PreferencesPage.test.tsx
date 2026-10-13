import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PreferencesPage from './PreferencesPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PreferencesPage', () => {
  it('carga las preferencias y permite guardar cambios', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? Promise.resolve({
            ok: true,
            json: async () => ({
              channels: ['email'],
              quietHoursStart: null,
              quietHoursEnd: null,
            }),
          })
        : Promise.resolve({
            ok: true,
            json: async () => ({
              channels: ['email'],
              quietHoursStart: '20:00',
              quietHoursEnd: '06:00',
            }),
          }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<PreferencesPage token="token" onBack={vi.fn()} />);

    const email = (await screen.findByLabelText(
      'Correo electrónico',
    )) as HTMLInputElement;
    expect(email.checked).toBe(true);
    const desde = (await screen.findByLabelText('Desde')) as HTMLInputElement;
    expect(desde.value).toBe('20:00');

    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar preferencias' }),
    );
    expect(await screen.findByText('Preferencias guardadas')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me/notification-preferences'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
