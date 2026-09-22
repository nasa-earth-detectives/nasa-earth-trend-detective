export function MissionHeader() {
  return (
    <div className="mission-signature">
      <svg className="mission-mark" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M4 21a16 16 0 0 1 32 0M2 21h36" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 27h24M12 32h16M17 37h6" stroke="currentColor" strokeWidth="1.5" />
        <path d="m5 21 10-7 7 7h14" stroke="var(--active-accent)" strokeWidth="2" />
      </svg>
      <div><p>Earth System</p><h1>Trend Detective</h1>
        <small>NASA Space Apps · 2026</small></div>
    </div>
  );
}
