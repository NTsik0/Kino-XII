import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import './Modal.css';

let openCount = 0;

/**
 * Shared modal: dimmed + blurred backdrop, closes on X, Escape and a click
 * on the overlay. Body scroll is locked while any modal is open.
 */
export default function Modal({ open, onClose, title, subtitle, children, className = '', width = 400, labelledBy, hideClose }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    openCount += 1;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Only the top-most modal reacts.
        const all = document.querySelectorAll('.modal-overlay');
        if (all[all.length - 1]?.contains(panelRef.current)) {
          e.stopPropagation();
          onCloseRef.current?.();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector('input:not([disabled]), button:not([disabled])');
      (first || panelRef.current)?.focus();
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      openCount -= 1;
      if (openCount <= 0) {
        openCount = 0;
        document.body.style.overflow = '';
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={`modal-panel ${className}`}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? 'modal-title' : undefined)}
        tabIndex={-1}
      >
        {(title || !hideClose) && (
          <div className="modal-head">
            {title && (
              <div>
                <h2 id="modal-title" className="modal-title">
                  {title}
                </h2>
                {subtitle && <p className="modal-subtitle">{subtitle}</p>}
              </div>
            )}
            {!hideClose && (
              <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
