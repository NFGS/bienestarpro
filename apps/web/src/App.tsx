import { useEffect, useState } from 'react';
import {
  clearSession,
  loadSession,
  saveSession,
} from './auth/session';
import type { StoredSession } from './auth/session';
import { me } from './lib/api';
import AuditPage from './pages/AuditPage';
import DeliveryPage from './pages/DeliveryPage';
import EventDetailPage from './pages/EventDetailPage';
import EventsPage from './pages/EventsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import GroupsPage from './pages/GroupsPage';
import HomePage from './pages/HomePage';
import InvitedMeetingsPage from './pages/InvitedMeetingsPage';
import LoginPage from './pages/LoginPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingsPage from './pages/MeetingsPage';
import PreferencesPage from './pages/PreferencesPage';
import PublicationsPage from './pages/PublicationsPage';
import SurveyAnswerPage from './pages/SurveyAnswerPage';
import SurveysPage from './pages/SurveysPage';
import TemplatesPage from './pages/TemplatesPage';
import UsersPage from './pages/UsersPage';

type View =
  | 'home'
  | 'users'
  | 'audit'
  | 'groups'
  | 'group-detail'
  | 'events'
  | 'event-detail'
  | 'delivery'
  | 'preferences'
  | 'templates'
  | 'publications'
  | 'surveys'
  | 'meetings'
  | 'meeting-detail';

const MANAGER_ROLES = ['superadmin', 'coordinacion'];

function App() {
  const [session, setSession] = useState<StoredSession | null>(() =>
    loadSession(),
  );
  const [view, setView] = useState<View>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

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

  if (view === 'groups') {
    return (
      <GroupsPage
        token={session.accessToken}
        onBack={() => setView('home')}
        onOpen={(groupId) => {
          setSelectedGroupId(groupId);
          setView('group-detail');
        }}
      />
    );
  }

  if (view === 'group-detail' && selectedGroupId) {
    return (
      <GroupDetailPage
        token={session.accessToken}
        role={session.user.role}
        groupId={selectedGroupId}
        onBack={() => setView('groups')}
      />
    );
  }

  if (view === 'events') {
    return (
      <EventsPage
        token={session.accessToken}
        onBack={() => setView('home')}
        onOpen={(eventId) => {
          setSelectedEventId(eventId);
          setView('event-detail');
        }}
      />
    );
  }

  if (view === 'event-detail' && selectedEventId) {
    return (
      <EventDetailPage
        token={session.accessToken}
        role={session.user.role}
        eventId={selectedEventId}
        onBack={() => setView('events')}
        onDeliver={(eventId) => {
          setSelectedEventId(eventId);
          setView('delivery');
        }}
      />
    );
  }

  if (view === 'delivery' && selectedEventId) {
    return (
      <DeliveryPage
        token={session.accessToken}
        eventId={selectedEventId}
        onBack={() => setView('event-detail')}
      />
    );
  }

  if (view === 'preferences') {
    return (
      <PreferencesPage
        token={session.accessToken}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'templates') {
    return (
      <TemplatesPage
        token={session.accessToken}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'publications') {
    return (
      <PublicationsPage
        token={session.accessToken}
        role={session.user.role}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'surveys') {
    return MANAGER_ROLES.includes(session.user.role) ? (
      <SurveysPage
        token={session.accessToken}
        onBack={() => setView('home')}
      />
    ) : (
      <SurveyAnswerPage
        token={session.accessToken}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'meetings') {
    return MANAGER_ROLES.includes(session.user.role) ? (
      <MeetingsPage
        token={session.accessToken}
        onBack={() => setView('home')}
        onOpen={(meetingId) => {
          setSelectedMeetingId(meetingId);
          setView('meeting-detail');
        }}
      />
    ) : (
      <InvitedMeetingsPage
        token={session.accessToken}
        onBack={() => setView('home')}
        onOpen={(meetingId) => {
          setSelectedMeetingId(meetingId);
          setView('meeting-detail');
        }}
      />
    );
  }

  if (view === 'meeting-detail' && selectedMeetingId) {
    return (
      <MeetingDetailPage
        token={session.accessToken}
        role={session.user.role}
        meetingId={selectedMeetingId}
        onBack={() => setView('meetings')}
      />
    );
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
