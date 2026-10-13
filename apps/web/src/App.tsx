import { useEffect, useState } from 'react';
import {
  clearSession,
  loadSession,
  saveSession,
} from './auth/session';
import type { StoredSession } from './auth/session';
import { me } from './lib/api';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
  const [session, setSession] = useState<StoredSession | null>(() =>
    loadSession(),
  );

  // Valida el token guardado contra la API (expiración o revocación).
  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      return;
    }
    me(stored.accessToken)
      .then((user) => {
        const refreshed = { accessToken: stored.accessToken, user };
        saveSession(refreshed);
        setSession(refreshed);
      })
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  if (!session) {
    return (
      <LoginPage
        onAuthenticated={(result) => {
          saveSession(result);
          setSession(result);
        }}
      />
    );
  }

  return (
    <HomePage
      user={session.user}
      onLogout={() => {
        clearSession();
        setSession(null);
      }}
    />
  );
}

export default App;
