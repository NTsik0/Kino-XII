import { useEffect } from 'react';
import { Route, Routes, useLocation, matchPath } from 'react-router-dom';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
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

// Pages whose hero sits under a transparent navbar.
const OVERLAY_ROUTES = ['/', '/movies/:slug'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const overlay = OVERLAY_ROUTES.some((p) => matchPath(p, pathname));

  return (
    <ToastProvider>
      <FilterOptionsProvider>
        <AuthProvider>
          <ScrollToTop />
          <div className="app">
            <Navbar overlay={overlay} />
            <main className={`app-main ${overlay ? '' : 'has-nav-offset'}`}>
              <Routes>
                <Route path="/" element={<Placeholder title="Home" />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Placeholder title="My Profile" />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Placeholder title="Page not found" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </FilterOptionsProvider>
    </ToastProvider>
  );
}
