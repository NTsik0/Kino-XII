import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader whenever `deps` change and exposes
 * { data, error, loading, reload }. Stale responses are ignored.
 */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const callId = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = ++callId.current;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        if (id === callId.current) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        if (id === callId.current) setState((s) => ({ data: s.data, error, loading: false }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
