import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, PanInfo, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useCopy } from '../copy';

/** Portal target inside `.fit-app` so theme CSS variables keep working. */
export function usePortalRoot() {
  const [root, setRoot] = useState<HTMLElement | null>(() => document.querySelector<HTMLElement>('.fit-app'));
  useEffect(() => {
    setRoot(document.querySelector<HTMLElement>('.fit-app') ?? document.body);
  }, []);
  return root;
}

export function FxSheet({
  open,
  onClose,
  children,
  title,
  kicker,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  kicker?: string;
  tall?: boolean;
}) {
  const root = usePortalRoot();
  const c = useCopy();
  const controls = useDragControls();
  if (!root) return null;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="bd"
            type="button"
            className="fx-backdrop"
            aria-label={c.common.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={`fx-sheet${tall ? ' fx-sheet--tall' : ''}`}
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={onDragEnd}
          >
            <div className="fx-sheet-grabzone" onPointerDown={(e) => controls.start(e)}>
              <div className="fx-sheet-grab" />
            </div>
            <div className="fx-sheet-head" onPointerDown={(e) => controls.start(e)}>
              <div className="fx-sheet-title">
                {kicker && <span className="fx-kicker">{kicker}</span>}
                {title && <h2 className="fx-grad-text">{title}</h2>}
              </div>
              <button type="button" className="fx-icon-btn" onClick={onClose} aria-label={c.common.close}>
                <X size={20} />
              </button>
            </div>
            <div className="fx-sheet-body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    root
  );
}

