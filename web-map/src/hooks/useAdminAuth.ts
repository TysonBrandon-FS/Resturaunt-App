import { useState } from 'react';

const CREDENTIALS_KEY = 'restaurant_admin_credentials';
const SESSION_KEY = 'restaurant_admin_session';

const DEFAULT_CREDENTIALS = {
  username: 'manager',
  password: '1234'
};

interface StoredCredentials {
  username: string;
  password: string;
}

interface StoredSession {
  loggedIn: boolean;
  username: string;
}

function seedAndReadSession(): StoredSession | null {
  const existingCreds = localStorage.getItem(CREDENTIALS_KEY);
  if (!existingCreds) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
  }

  const existingSession = localStorage.getItem(SESSION_KEY);
  if (!existingSession) return null;

  try {
    const session: StoredSession = JSON.parse(existingSession);
    if (session.loggedIn && session.username) {
      return session;
    }
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function useAdminAuth() {
  const [session, setSession] = useState<StoredSession | null>(() => seedAndReadSession());
  const [error, setError] = useState<string | null>(null);

  const login = (username: string, password: string) => {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) {
      setError('Invalid username or password');
      return;
    }

    try {
      const creds: StoredCredentials = JSON.parse(raw);
      if (creds.username === username && creds.password === password) {
        const newSession: StoredSession = { loggedIn: true, username };
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
        setSession(newSession);
        setError(null);
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Invalid username or password');
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setError(null);
  };

  return {
    isAuthenticated: session !== null,
    currentUser: session?.username ?? null,
    login,
    logout,
    error
  };
}
