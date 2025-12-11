import React, { useState } from 'react';

export default function PrivacyVisibilitySection({ profile, onUpdate }) {
  const [values, setValues] = useState({
    isPublic: profile?.isPublic ?? true,
    showSalary: profile?.showSalary ?? false,
    showProfilePhoto: profile?.showProfilePhoto ?? true,
    anonymousMode: profile?.anonymousMode ?? false,
  });

  async function save(partial) {
    const next = { ...values, ...partial };
    setValues(next);
    const res = await fetch('/api/candidate/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    });
    if (res.ok) {
      const data = await res.json();
      onUpdate(data);
    }
  }

  return (
    <section className="card xl">
      <header className="card-header">
        <h2>Privacy & Visibility</h2>
        <p className="muted">Control what employers and the public can see.</p>
      </header>
      <div className="grid two">
        <ToggleRow
          label="Public profile"
          hint="Allow your profile to be discoverable by employers."
          checked={values.isPublic}
          onChange={(v) => save({ isPublic: v })}
        />
        <ToggleRow
          label="Show salary/day rate"
          hint="Display your compensation expectations on your public profile."
          checked={values.showSalary}
          onChange={(v) => save({ showSalary: v })}
        />
        <ToggleRow
          label="Show profile picture"
          hint="Include your profile photo when public."
          checked={values.showProfilePhoto}
          onChange={(v) => save({ showProfilePhoto: v })}
        />
        <ToggleRow
          label="Anonymous mode"
          hint="Blur photo and hide name to browse jobs anonymously."
          checked={values.anonymousMode}
          onChange={(v) => save({ anonymousMode: v })}
        />
      </div>
    </section>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="label">{label}</div>
        <div className="muted small">{hint}</div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="slider" />
      </label>
    </div>
  );
}
