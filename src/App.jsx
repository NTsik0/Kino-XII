import { useEffect } from 'react';
import { Route, Routes, useLocation, matchPath } from 'react-router-dom';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import SearchBar from './components/layout/SearchBar';
import HomePage from './pages/HomePage';
import MoviePage from './pages/MoviePage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { FilterOptionsProvider } from './context/FilterOptionsContext';
import { ToastProvider } from './context/ToastContext';
import './components/layout/Layout.css';

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
          <BookingProvider>
            <ScrollToTop />
            <div className="app">
              <Navbar overlay={overlay}>
                <SearchBar />
              </Navbar>
              <main className={`app-main ${overlay ? '' : 'has-nav-offset'}`}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies/:slug" element={<MoviePage />} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BookingProvider>
        </AuthProvider>
      </FilterOptionsProvider>
    </ToastProvider>
  );
}
