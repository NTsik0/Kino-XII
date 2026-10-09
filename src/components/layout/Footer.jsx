import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <Link to="/" aria-label="Kino XII home">
          <Logo small />
        </Link>
        <p>© {new Date().getFullYear()} Kino XII. All rights reserved.</p>
      </div>
    </footer>
  );
}
