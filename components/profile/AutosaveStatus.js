import React from 'react';

export default function AutosaveStatus({ saving, savedAt }) {
  if (saving) return <span className="autosave saving">saving…</span>;
  if (savedAt) return <span className="autosave saved">saved ✓</span>;
  return null;
}
