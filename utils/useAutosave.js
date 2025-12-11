import { useEffect, useRef, useState } from 'react';

export function useAutosave(callback, deps, delay = 600) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const timeout = useRef(null);

  useEffect(() => {
    if (!callback) return;
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      try {
        setSaving(true);
        await callback();
        setSavedAt(new Date());
      } finally {
        setSaving(false);
      }
    }, delay);
    return () => timeout.current && clearTimeout(timeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { saving, savedAt };
}
