import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';
import UserMenu from './UserMenu';

export default function Navbar({ overlay = false, children }) {
  const { user, booting, openLogin, openRegister } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar ${!overlay || scrolled ? 'is-solid' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" aria-label="Kino XII home">
          <Logo />
        </Link>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/sessions" className="nav-link">
            Sessions
          </NavLink>
        </nav>
        {children}
        <div className="nav-actions">
          {booting ? (
            <span className="skeleton" style={{ width: 120, height: 36, borderRadius: 10 }} />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={openRegister}>
                Sign up
              </button>
              <button type="button" className="btn btn-light btn-sm" onClick={() => openLogin()}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
