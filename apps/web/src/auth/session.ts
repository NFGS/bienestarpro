import type { SessionUser } from '../lib/api';

export interface StoredSession {
  accessToken: string;
  user: SessionUser;
}

const KEY = 'bienestarpro.session';

/**
 * Sesión en `sessionStorage` (temporal para la rebanada 1).
 * La estrategia definitiva (cookie httpOnly + refresh) se decidirá en un ADR
 * de la rebanada de identidad completa; no se persiste nada permanente aquí.
 */
export function saveSession(session: StoredSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}
