import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal';
import Icon from '../Icon';
import { ErrorState } from '../States';
import SeatMap, { SeatMapSkeleton } from './SeatMap';
import SelectionPanel from './SelectionPanel';
import CheckoutStep from './CheckoutStep';
import Confirmation from './Confirmation';
import { useAuth } from '../../context/AuthContext';
import { useFilterOptions } from '../../context/FilterOptionsContext';
import { useToast } from '../../context/ToastContext';
import useCountdown, { holdDeadline } from '../../hooks/useCountdown';
import { createHold, createOrder, fetchSeatMap, fetchSession, releaseHold } from '../../api/endpoints';
import { countdown, longDate } from '../../utils/format';
import { ageBlockReason } from '../../utils/eligibility';
import './BookingModal.css';

const EXPIRED_MESSAGE = 'Your hold time expired. Please re-select your seats.';

const round2 = (n) => Math.round(n * 100) / 100;

function seatsTakenMessage(codes) {
  const list = codes.join(', ');
  return codes.length === 1
    ? `Sorry, seat ${list} was just taken by someone else. We kept the rest of your selection.`
    : `Sorry, seats ${list} were just taken by someone else. We kept the rest of your selection.`;
}

/** Mark the given seat codes as sold in a seat map (immutable). */
function markSold(seatMap, codes) {
  if (!seatMap) return seatMap;
  const set = new Set(codes);
  return {
    ...seatMap,
    sections: seatMap.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        seats: row.seats.map((seat) => (set.has(seat.code) ? { ...seat, state: 'sold', isMine: false } : seat)),
      })),
    })),
  };
}

export default function BookingModal({ sessionId, initialSession, onClose }) {
  const { user } = useAuth();
  const { ticketTypes, maxSeatsPerOrder } = useFilterOptions();
  const toast = useToast();
  const navigate = useNavigate();

  const [session, setSession] = useState(initialSession || null);
  const [seatMap, setSeatMap] = useState(null);
  const [mapState, setMapState] = useState({ loading: true, error: null });
  const [selection, setSelection] = useState([]); // [{ seatId, code, sectionName, ticketType }]
  const [hold, setHold] = useState(null);
  const [step, setStep] = useState('seats'); // seats | checkout | done
  const [notice, setNotice] = useState(null); // { type, text }
  const [holding, setHolding] = useState(false);
  const [order, setOrder] = useState(null);
  const holdingRef = useRef(false);
  const holdRef = useRef(null);
  holdRef.current = hold;

  const movie = session?.movie || initialSession?.movie;

  // ---------- Data ----------
  const loadMap = useCallback(
    async ({ restoreMine = false } = {}) => {
      setMapState((s) => ({ ...s, loading: !s.loaded, error: null }));
      try {
        const map = await fetchSeatMap(sessionId);
        setSeatMap(map);
        setMapState({ loading: false, error: null, loaded: true });
        if (restoreMine) {
          // A returning user keeps the seats they already hold.
          const mine = map.sections.flatMap((section) =>
            section.rows.flatMap((row) =>
              row.seats
                .filter((s) => s.isMine)
                .map((s) => ({ seatId: s.id, code: s.code, sectionName: section.name, ticketType: 'adult' })),
            ),
          );
          if (mine.length) setSelection(mine.slice(0, maxSeatsPerOrder));
        }
      } catch (error) {
        setMapState((s) => ({ ...s, loading: false, error }));
      }
    },
    [sessionId, maxSeatsPerOrder],
  );

  useEffect(() => {
    fetchSession(sessionId)
      .then(setSession)
      .catch(() => {});
    loadMap({ restoreMine: true });
  }, [sessionId, loadMap]);

  // ---------- Pricing and rules ----------
  const minAge = movie?.ageRating?.minAge ?? 0;
  const isTypeBlocked = useCallback(
    (type) =>
      type.blockedFromRatingAge !== null &&
      type.blockedFromRatingAge !== undefined &&
      minAge >= type.blockedFromRatingAge,
    [minAge],
  );
  const priceFor = useCallback(
    (slug) => {
      const type = ticketTypes.find((t) => t.slug === slug);
      return round2((session?.price || 0) * (type?.priceRatio ?? 1));
    },
    [ticketTypes, session?.price],
  );

  const violations = useMemo(() => {
    const out = {};
    selection.forEach((item) => {
      const type = ticketTypes.find((t) => t.slug === item.ticketType);
      if (type && isTypeBlocked(type))
        out[item.seatId] = `${type.name} tickets are not available for ${movie?.ageRating?.code} films`;
    });
    return out;
  }, [selection, ticketTypes, isTypeBlocked, movie]);

  const subtotal = useMemo(
    () => round2(selection.reduce((sum, i) => sum + priceFor(i.ticketType), 0)),
    [selection, priceFor],
  );

  const ageBlocked = ageBlockReason(user, movie);
  let blockReason = null;
  if (!user?.profileComplete) blockReason = 'Complete your profile to continue.';
  else if (ageBlocked) blockReason = ageBlocked;
  else if (!selection.length) blockReason = 'Select at least one seat to continue.';
  else if (Object.keys(violations).length) blockReason = 'Fix the highlighted seats to continue.';
  else if (selection.length > maxSeatsPerOrder) blockReason = `You can book up to ${maxSeatsPerOrder} seats per order.`;
  const canContinue = !blockReason && Boolean(session);

  // ---------- Hold timer ----------
  const deadline = useMemo(() => holdDeadline(hold), [hold]);

  const expireHold = useCallback(
    (message = EXPIRED_MESSAGE) => {
      setHold(null);
      setSelection([]);
      setStep('seats');
      setNotice({ type: 'warning', text: message });
      loadMap();
    },
    [loadMap],
  );

  const secondsLeft = useCountdown(step === 'done' ? null : deadline, () => expireHold());

  // ---------- Seat selection ----------
  const selectedIds = useMemo(() => new Set(selection.map((s) => s.seatId)), [selection]);

  const toggleSeat = (seat, section) => {
    if (selectedIds.has(seat.id)) {
      setSelection((list) => list.filter((s) => s.seatId !== seat.id));
      return;
    }
    if (selection.length >= maxSeatsPerOrder) {
      setNotice({ type: 'warning', text: `You can select up to ${maxSeatsPerOrder} seats per order.` });
      return;
    }
    setNotice((n) => (n?.type === 'warning' && n.text.startsWith('You can select') ? null : n));
    setSelection((list) => [
      ...list,
      { seatId: seat.id, code: seat.code, sectionName: section.name, ticketType: 'adult' },
    ]);
  };

  const changeType = (seatId, ticketType) =>
    setSelection((list) => list.map((s) => (s.seatId === seatId ? { ...s, ticketType } : s)));

  const removeSeat = (seatId) => setSelection((list) => list.filter((s) => s.seatId !== seatId));

  const handleContested = (codes, message) => {
    const contested = codes || [];
    setSeatMap((m) => markSold(m, contested));
    setSelection((list) => list.filter((s) => !contested.includes(s.code)));
    setNotice({ type: 'error', text: contested.length ? seatsTakenMessage(contested) : message });
    loadMap();
  };

  const handleRuleError = (err) => {
    if (/profile/i.test(err.message)) {
      toast.warning(err.message);
      onClose();
      navigate('/profile');
      return;
    }
    if (/expired/i.test(err.message)) {
      expireHold(err.message);
      return;
    }
    setNotice({ type: 'error', text: err.message });
  };

  // ---------- Step 1 → 2 ----------
  const goToCheckout = async () => {
    if (!canContinue || holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    setNotice(null);
    try {
      const next = await createHold(
        session.id,
        selection.map((s) => ({ seatId: s.seatId, ticketType: s.ticketType })),
      );
      setHold(next);
      setStep('checkout');
    } catch (err) {
      if (err?.cancelled) return;
      if (err.status === 409) handleContested(err.contested, err.message);
      else if (err.isRuleError) handleRuleError(err);
      else if (err.status === 422)
        setNotice({ type: 'error', text: Object.values(err.fieldErrors).join(' ') || err.message });
      else setNotice({ type: 'error', text: err.message });
    } finally {
      holdingRef.current = false;
      setHolding(false);
    }
  };

  // ---------- Step 2: pay ----------
  const pay = async (payload) => {
    try {
      const paid = await createOrder(payload);
      setOrder(paid);
      setHold(null);
      setStep('done');
    } catch (err) {
      if (err?.cancelled) throw Object.assign(new Error(''), { handled: true });
      if (err.status === 422 && err.errors) throw err; // field errors go back onto the form
      if (err.isRuleError) {
        handleRuleError(err);
        throw Object.assign(new Error(err.message), { handled: true });
      }
      if (err.status === 409) {
        setHold(null);
        setStep('seats');
        handleContested(err.contested, err.message);
        throw Object.assign(new Error(err.message), { handled: true });
      }
      throw err;
    }
  };

  // ---------- Close ----------
  const close = () => {
    // Free the seats right away instead of leaving them blocked for 8 minutes.
    const live = holdRef.current;
    if (live && step !== 'done') releaseHold(live.holdId).catch(() => {});
    onClose();
  };

  const goToMyTickets = () => {
    onClose();
    navigate('/profile?tab=tickets');
  };

  // ---------- Render ----------
  const s = session || initialSession;
  const meta = s
    ? [s.venue?.name, `Hall ${s.hall?.name}`, longDate(s.date), s.time, s.format?.name, s.language?.name]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Modal open onClose={close} width={1100} className="booking-modal" labelledBy="booking-title" hideClose>
      <header className="booking-head">
        <div>
          <h2 id="booking-title" className="booking-title">
            {movie?.title || 'Book tickets'}
          </h2>
          <p className="booking-meta">{meta}</p>
        </div>
        <div className="booking-head-right">
          {secondsLeft !== null && step !== 'done' && (
            <div className={`hold-chip ${secondsLeft <= 60 ? 'is-urgent' : ''}`} role="timer" aria-live="off">
              <span>Seats held</span>
              <strong>{countdown(secondsLeft)}</strong>
            </div>
          )}
          <button type="button" className="modal-x" onClick={close} aria-label="Close booking">
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

      {step !== 'done' && (
        <div className="step-tabs" role="tablist" aria-label="Booking steps">
          <button
            type="button"
            role="tab"
            aria-selected={step === 'seats'}
            className={step === 'seats' ? 'is-active' : ''}
            onClick={() => setStep('seats')}
          >
            1. Seats
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={step === 'checkout'}
            className={step === 'checkout' ? 'is-active' : ''}
            disabled={!hold}
            onClick={() => hold && setStep('checkout')}
          >
            2. Checkout
          </button>
        </div>
      )}

      {notice && step !== 'done' && (
        <div className={`form-alert ${notice.type === 'warning' ? 'is-warning' : ''} booking-notice`} role="alert">
          <Icon name={notice.type === 'warning' ? 'info' : 'alert'} size={16} />
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <Icon name="close" size={13} />
          </button>
        </div>
      )}

      {step === 'seats' && (
        <div className="booking-body">
          <div className="booking-map">
            {mapState.error && !seatMap ? (
              <ErrorState
                error={mapState.error}
                onRetry={() => loadMap({ restoreMine: true })}
                title="Could not load the hall"
              />
            ) : !seatMap ? (
              <SeatMapSkeleton />
            ) : (
              <SeatMap seatMap={seatMap} selectedIds={selectedIds} onToggle={toggleSeat} disabled={holding} />
            )}
          </div>
          <SelectionPanel
            selection={selection}
            ticketTypes={ticketTypes}
            isTypeBlocked={isTypeBlocked}
            priceFor={priceFor}
            violations={violations}
            maxSeats={maxSeatsPerOrder}
            subtotal={subtotal}
            onChangeType={changeType}
            onRemove={removeSeat}
            onNext={goToCheckout}
            canContinue={canContinue}
            blockReason={blockReason}
            busy={holding}
          />
        </div>
      )}

      {step === 'checkout' && hold && (
        <CheckoutStep user={user} hold={hold} ticketTypes={ticketTypes} onBack={() => setStep('seats')} onPay={pay} />
      )}

      {step === 'done' && order && <Confirmation order={order} onMyTickets={goToMyTickets} onClose={onClose} />}
    </Modal>
  );
}
