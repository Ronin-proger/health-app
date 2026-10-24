export function FitSkeleton() {
  return (
    <div className="fx-skel" aria-busy="true" aria-live="polite">
      <div className="fx-skel-row">
        <div className="fx-skel-block" style={{ width: '58%', height: 30 }} />
        <div className="fx-skel-block" style={{ width: 54, height: 54, borderRadius: 999 }} />
      </div>
      <div className="fx-skel-block" style={{ height: 118 }} />
      <div className="fx-skel-block" style={{ height: 210 }} />
      <div className="fx-skel-grid">
        <div className="fx-skel-block" style={{ height: 84 }} />
        <div className="fx-skel-block" style={{ height: 84 }} />
        <div className="fx-skel-block" style={{ height: 84 }} />
        <div className="fx-skel-block" style={{ height: 84 }} />
      </div>
    </div>
  );
}
