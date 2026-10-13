import { useEffect, useState } from 'react';
import {
  clearSession,
  loadSession,
  saveSession,
} from './auth/session';
import type { StoredSession } from './auth/session';
import { me } from './lib/api';
import AuditPage from './pages/AuditPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';

type View = 'home' | 'users' | 'audit';

function App() {
  const [session, setSession] = useState<StoredSession | null>(() =>
    loadSession(),
  );
  const [view, setView] = useState<View>('home');

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
          setView('home');
        }}
      />
    );
  }

  if (view === 'users') {
    return <UsersPage token={session.accessToken} onBack={() => setView('home')} />;
  }

  if (view === 'audit') {
    return <AuditPage token={session.accessToken} onBack={() => setView('home')} />;
  }

  return (
    <HomePage
      user={session.user}
      onNavigate={(next) => setView(next)}
      onLogout={() => {
        clearSession();
        setSession(null);
        setView('home');
      }}
    />
  );
}

export default App;
