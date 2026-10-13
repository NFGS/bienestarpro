const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  centerId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    },
  });

  if (!res.ok) {
    let message = 'No se pudo completar la solicitud.';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message) && body.message.length > 0) {
        message = body.message[0] as string;
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el mensaje genérico.
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

/** CU-01 / RF-01: inicio de sesión con documento o correo. */
export function login(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

/** Sesión actual (valida el token guardado). */
export function me(accessToken: string): Promise<SessionUser> {
  return request<SessionUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
