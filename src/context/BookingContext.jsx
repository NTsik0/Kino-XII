import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { ageBlockReason } from '../utils/eligibility';
import BookingModal from '../components/booking/BookingModal';

const BookingContext = createContext(null);

export const PROFILE_REQUIRED_MESSAGE = 'Please complete your profile to enable booking.';

/**
 * Entry point for buying tickets. Opening a session goes through the gate:
 * log in (resuming afterwards), complete profile, then the age check.
 */
export function BookingProvider({ children }) {
  const { requireAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [active, setActive] = useState(null); // { sessionId, session? }

  const openBooking = useCallback(
    (session) =>
      requireAuth((user) => {
        if (!user.profileComplete) {
          toast.warning(PROFILE_REQUIRED_MESSAGE);
          navigate('/profile', { state: { fromBooking: true } });
          return;
        }
        const blocked = ageBlockReason(user, session.movie);
        if (blocked) {
          toast.error(blocked);
          return;
        }
        setActive({ sessionId: session.id, session });
      }, 'Log in to choose your seats.'),
    [requireAuth, toast, navigate],
  );

  const closeBooking = useCallback(() => setActive(null), []);

  const value = useMemo(() => ({ openBooking, closeBooking, active }), [openBooking, closeBooking, active]);

  return (
    <BookingContext.Provider value={value}>
      {children}
      {active && (
        <BookingModal
          key={active.sessionId}
          sessionId={active.sessionId}
          initialSession={active.session}
          onClose={closeBooking}
        />
      )}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
