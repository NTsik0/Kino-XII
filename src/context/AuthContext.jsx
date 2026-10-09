import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getToken, onUnauthorized, setReauthHandler, setToken } from '../api/client';
import * as api from '../api/endpoints';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';

const AuthContext = createContext(null);

export class AuthCancelled extends Error {
  constructor() {
    super('Authentication cancelled');
    this.name = 'AuthCancelled';
    this.cancelled = true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken()));
  const [modal, setModal] = useState(null); // 'login' | 'register' | null
  const [loginReason, setLoginReason] = useState(null);
  const waiters = useRef([]); // promises waiting for a successful sign in
  const userRef = useRef(null);
  userRef.current = user;

  // Restore the session from a stored token.
  useEffect(() => {
    if (!getToken()) return;
    api
      .fetchMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const settleWaiters = useCallback((ok, value) => {
    const list = waiters.current;
    waiters.current = [];
    list.forEach(({ resolve, reject }) => (ok ? resolve(value) : reject(new AuthCancelled())));
  }, []);

  const onSignedIn = useCallback(
    ({ user: nextUser, token }) => {
      setToken(token);
      setUser(nextUser);
      setModal(null);
      setLoginReason(null);
      // Let React commit the new user before replaying the pending action.
      setTimeout(() => settleWaiters(true, nextUser), 0);
      return nextUser;
    },
    [settleWaiters],
  );

  const login = useCallback(async (credentials) => onSignedIn(await api.login(credentials)), [onSignedIn]);
  const register = useCallback(async (formData) => onSignedIn(await api.register(formData)), [onSignedIn]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* the token is cleared regardless of the response */
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await api.fetchMe();
    setUser(fresh);
    return fresh;
  }, []);

  /** Resolves with the user, opening the login modal first if needed. */
  const ensureAuth = useCallback((reason) => {
    if (userRef.current && getToken()) return Promise.resolve(userRef.current);
    return new Promise((resolve, reject) => {
      waiters.current.push({ resolve, reject });
      setLoginReason(reason || null);
      setModal((m) => m || 'login');
    });
  }, []);

  /** Runs `action` now if signed in, otherwise right after the user logs in. */
  const requireAuth = useCallback(
    (action, reason) =>
      ensureAuth(reason)
        .then((u) => action(u))
        .catch((err) => {
          if (!err?.cancelled) throw err;
          return undefined;
        }),
    [ensureAuth],
  );

  const closeModal = useCallback(() => {
    setModal(null);
    setLoginReason(null);
    settleWaiters(false);
  }, [settleWaiters]);

  // Wire the API client: an expired token opens the login modal and replays.
  useEffect(() => {
    setReauthHandler(() => ensureAuth('Your session has expired. Please log in again.'));
    onUnauthorized(() => setUser(null));
    return () => {
      setReauthHandler(null);
      onUnauthorized(null);
    };
  }, [ensureAuth]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: Boolean(user),
      booting,
      login,
      register,
      logout,
      refreshUser,
      ensureAuth,
      requireAuth,
      openLogin: (reason) => {
        setLoginReason(reason || null);
        setModal('login');
      },
      openRegister: () => setModal('register'),
    }),
    [user, booting, login, register, logout, refreshUser, ensureAuth, requireAuth],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={modal === 'login'}
        reason={loginReason}
        onClose={closeModal}
        onLogin={login}
        onSwitch={() => setModal('register')}
      />
      <RegisterModal
        open={modal === 'register'}
        onClose={closeModal}
        onRegister={register}
        onSwitch={() => setModal('login')}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
