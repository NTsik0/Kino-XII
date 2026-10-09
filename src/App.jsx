import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/layout/Footer';
import Logo from './components/layout/Logo';
import { FilterOptionsProvider } from './context/FilterOptionsContext';
import { ToastProvider } from './context/ToastContext';
import './components/layout/Layout.css';

function Placeholder({ title }) {
  return (
    <div className="container page-head">
      <h1>{title}</h1>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <ToastProvider>
      <FilterOptionsProvider>
        <div className="app">
          <header className="navbar is-solid">
            <div className="container navbar-inner">
              <Link to="/">
                <Logo />
              </Link>
            </div>
          </header>
          <main className={`app-main ${pathname === '/' ? '' : 'has-nav-offset'}`}>
            <Routes>
              <Route path="/" element={<Placeholder title="Home" />} />
              <Route path="*" element={<Placeholder title="Page not found" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </FilterOptionsProvider>
    </ToastProvider>
  );
}
