import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "../Motion";

// The panel, the streaming client, and the message rendering are all behind
// this boundary — nothing here reaches the main bundle until someone opens it.
const ChatPanel = lazy(() => import("./ChatPanel"));

/**
 * Floating launcher for the grounded CV assistant.
 *
 * Hidden until the visitor has scrolled past the hero, so it never competes
 * with the first impression.
 */
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && !open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            data-chat-launcher
        aria-haspopup="dialog"
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.9 }}
            transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}
            className="focus-ring glass group fixed bottom-5 right-5 z-[55] flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-left transition-colors hover:border-signal/40 sm:bottom-7 sm:right-7"
          >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-signal/12 ring-1 ring-signal/35">
              <span
                className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-signal opacity-70"
                aria-hidden="true"
              />
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                className="relative text-signal"
                aria-hidden="true"
              >
                <path d="M2 4.2A2.2 2.2 0 0 1 4.2 2h7.6A2.2 2.2 0 0 1 14 4.2v5.1a2.2 2.2 0 0 1-2.2 2.2H6.4L3 14V4.2Z" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                Ask about my work
              </span>
              <span className="font-mono text-[9px] text-faint">
                grounded in my CV &amp; repos
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {open && (
        <Suspense fallback={<PanelSkeleton />}>
          <ChatPanel open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

/** Shown only for the moment the chunk is in flight. */
function PanelSkeleton() {
  return (
    <div
      className="glass fixed bottom-5 right-5 z-[75] flex h-[min(70vh,560px)] w-[min(calc(100vw-2.5rem),420px)] items-center justify-center rounded-2xl sm:bottom-7 sm:right-7"
      role="status"
      aria-live="polite"
    >
      <span className="font-mono text-[11px] text-muted">loading assistant…</span>
    </div>
  );
}
