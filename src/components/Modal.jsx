import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EASE } from "./Motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The site's one modal: portalled, focus-trapped, ESC to close, scroll locked
 * while open, focus restored to the trigger on close. Entrance is a spring;
 * under prefers-reduced-motion it becomes an instant fade.
 *
 * Pass `label` for the accessible name, or `labelledBy` if the title element
 * inside `children` already carries an id.
 */
export default function Modal({
  open,
  onClose,
  label,
  labelledBy,
  children,
  className = "",
  size = "lg",
  initialFocusRef,
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const reduce = useReducedMotion();
  const titleId = useId();

  // Remember the trigger so focus can go back where it came from.
  useEffect(() => {
    if (open) restoreRef.current = document.activeElement;
  }, [open]);

  // Scroll lock. Compensating for the scrollbar width keeps the page from
  // shifting sideways the moment the modal opens.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  // Move focus in on open, and back to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current ||
        panelRef.current?.querySelector(FOCUSABLE) ||
        panelRef.current;
      target?.focus?.();
    });
    return () => {
      cancelAnimationFrame(t);
      const el = restoreRef.current;
      if (el && typeof el.focus === "function" && document.contains(el)) el.focus();
    };
  }, [open, initialFocusRef]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (typeof document === "undefined") return null;

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size] || "max-w-3xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.25, ease: EASE }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy || undefined}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.97 }}
            animate={
              reduce
                ? { opacity: 1, transition: { duration: 0.12 } }
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 320, damping: 30, mass: 0.9 },
                  }
            }
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.12 } }
                : { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18, ease: EASE } }
            }
            className={`glass relative z-10 my-auto w-full ${width} rounded-xl bg-panel/95 focus:outline-none ${className}`}
            data-modal-title-id={titleId}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
