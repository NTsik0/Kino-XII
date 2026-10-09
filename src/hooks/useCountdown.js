import { useEffect, useRef, useState } from 'react';

/**
 * Seconds left until `deadline` (ms timestamp). Recomputed from the clock on
 * every tick rather than decremented, so a backgrounded tab never drifts.
 * Calls onExpire once when it reaches zero.
 */
export default function useCountdown(deadline, onExpire) {
  const compute = () => (deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null);
  const [seconds, setSeconds] = useState(compute);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    if (!deadline) {
      setSeconds(null);
      return undefined;
    }
    let fired = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left <= 0 && !fired) {
        fired = true;
        expireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    // Catch up immediately when the tab becomes visible again.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [deadline]);

  return seconds;
}

/**
 * Turn a SeatHold into a local deadline. expiresAt is the source of truth;
 * secondsRemaining at response time corrects for a client clock that is off.
 */
export function holdDeadline(hold) {
  if (!hold) return null;
  const expires = Date.parse(hold.expiresAt);
  if (typeof hold.secondsRemaining === 'number') {
    const viaServer = Date.now() + hold.secondsRemaining * 1000;
    // Trust expiresAt unless the device clock is clearly skewed.
    if (Number.isNaN(expires) || Math.abs(expires - viaServer) > 5000) return viaServer;
  }
  return expires;
}
