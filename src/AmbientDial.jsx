import React from 'react';

// Decorative only: the existing timer remains the source of time and progress.
export default function AmbientDial({ mode, running = true, remainingMs }) {
  const second = remainingMs == null ? null : Math.ceil(remainingMs / 1000);
  const countdown = running && second > 0 && second <= 3;
  return (
    <div className={`ambient-dial ambient-dial--${mode}${running ? '' : ' is-paused'}`} aria-hidden="true">
      <div className="ambient-dial__haze" />
      <div className="ambient-dial__breath" />
      <div className="ambient-dial__orbit"><div className="ambient-dial__trail" /></div>
      <div className="ambient-dial__rim" />
      {running && <div className="ambient-dial__entry" />}
      {countdown && <div key={second} className="ambient-dial__cue" />}
    </div>
  );
}
