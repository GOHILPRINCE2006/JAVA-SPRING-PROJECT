import { useCallback, useEffect, useState } from 'react';
import { isCancel } from '../api/client';

/**
 * Runs an async loader (receiving an AbortSignal) whenever `deps` change or reload() is called.
 * Returns { data, error, loading, reload }. Aborts the request when the component unmounts or deps change.
 */
export function useAsync(loader, deps) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const key = `${JSON.stringify(deps)}#${tick}`;

  useEffect(() => {
    const controller = new AbortController();
    loader(controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (isCancel(error) || controller.signal.aborted) return;
        setResult({ key, data: null, error });
      });
    return () => controller.abort();
    // `loader` is intentionally not a dependency: callers describe what should trigger a reload via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  const settled = result.key === key;
  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: !settled,
    reload,
  };
}
