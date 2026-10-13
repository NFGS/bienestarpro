import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('inicia sesión correctamente y entrega la sesión', async () => {
    const onAuthenticated = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'token-de-prueba',
          user: {
            id: '1',
            name: 'Demo',
            email: 'demo@bienestarpro.local',
            role: 'aprendiz',
            centerId: null,
          },
        }),
      }),
    );

    render(<LoginPage onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText('Documento o correo'), {
      target: { value: 'demo@bienestarpro.local' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Clave1234*' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(onAuthenticated).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'token-de-prueba' }),
    );
  });

  it('muestra el mensaje del API cuando las credenciales son inválidas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Credenciales inválidas' }),
      }),
    );

    render(<LoginPage onAuthenticated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Documento o correo'), {
      target: { value: 'demo@bienestarpro.local' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Clave1234*' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Credenciales inválidas');
  });
});
