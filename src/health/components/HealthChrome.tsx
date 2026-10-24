import { ArrowLeft, X } from 'lucide-react';
import { ReactNode } from 'react';
import { useCopy } from '../copy';

export function HealthChrome({
  title,
  subtitle,
  onBack,
  onExit,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onExit: () => void;
  children?: ReactNode;
}) {
  const c = useCopy();
  return (
    <header className="fx-chrome">
      <div className="fx-chrome-row">
        {onBack ? (
          <button type="button" className="fx-icon-btn" onClick={onBack} aria-label={c.common.back}>
            <ArrowLeft size={21} strokeWidth={2.2} />
          </button>
        ) : (
          <span className="fx-chrome-logo" aria-hidden>
            <i />
          </span>
        )}
        <div className="fx-chrome-titles">
          <h1 className="fx-grad-text fx-chrome-title">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button type="button" className="fx-icon-btn" onClick={onExit} aria-label={c.chrome.exit}>
          <X size={21} strokeWidth={2.2} />
        </button>
      </div>
      {children}
    </header>
  );
}
