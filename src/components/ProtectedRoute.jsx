import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmptyState, PageLoader } from './States';

/** Pages for signed-in users only. Guests get the login modal; the page renders once they log in. */
export default function ProtectedRoute({ children }) {
  const { user, booting, ensureAuth, openLogin } = useAuth();

  useEffect(() => {
    if (!booting && !user) ensureAuth().catch(() => {});
  }, [booting, user, ensureAuth]);

  if (booting) return <PageLoader />;
  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <EmptyState
          icon="user"
          title="Log in to continue"
          message="This page is only available to signed in users."
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openLogin()}>
              Log in
            </button>
          }
        />
      </div>
    );
  }
  return children;
}
