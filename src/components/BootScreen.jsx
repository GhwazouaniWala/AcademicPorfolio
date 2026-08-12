import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import ragMeta from "../data/rag-meta.json";
import github from "../data/github.generated.json";

/**
 * First-load boot screen — a data-processing checklist.
 *
 * Deliberately plain: a list of pipeline stages that tick through in order,
 * with a progress bar under them. No canvas, no particle system. The earlier
 * versions tried to be clever with generative animation and read as gimmicky;
 * a legible sequence of steps is both calmer and unambiguous about what it is.
 *
 * The figures in the labels are real properties of this site — the indexed
 * chunk count, the embedding dimensionality, the number of linked repositories,
 * an 8-class classifier. They are read from the generated data files rather
 * than typed in, so they cannot quietly go stale the way a hard-coded
 * "384-dim" did when the embedding model changed. The steps themselves are a
 * stylised boot sequence, not live telemetry, and the copy avoids implying
 * otherwise — nothing here is measuring work as it happens.
 *
 * Driven entirely by timers and a CSS transition — no requestAnimationFrame
 * anywhere, including the dismissal. An AnimatePresence exit here was a real
 * hazard: rAF is suspended in background tabs and throttled under load, and
 * when it stalls the exit animation never completes, so the overlay stays
 * mounted over the page forever. A CSS opacity transition plus an unmount
 * timer cannot get stuck that way.
 *
 * Shown once per tab, skippable, and skipped entirely under reduced motion.
 */

const SESSION_KEY = "wg-booted";

const STAGES = [
  { label: "interface", detail: "react · vite" },
  { label: "retrieval index", detail: `${ragMeta.chunks} chunks · ${ragMeta.dim}-dim` },
  { label: "repositories", detail: `${Object.keys(github.repos || {}).length} linked` },
  { label: "vision runtime", detail: "8-class classifier" },
  { label: "ready", detail: "" },
];

const STEP_MS = 340;
const HOLD_MS = 320;

export default function BootScreen({ onDone }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return false;
    } catch {
      /* private mode — just show it */
    }
    return true;
  });
  const [done, setDone] = useState(0); // how many stages have completed
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    // Fade out via CSS, then unmount on a timer. Never waits on a frame.
    setLeaving(true);
    onDone?.();
    setTimeout(() => setVisible(false), 450);
  }

  // Scroll lock lives in its own effect, keyed only on `visible`. Bundled into
  // the timer effect below it was at the mercy of StrictMode's mount → cleanup
  // → mount cycle, whose cleanup released the lock and left the page scrollable
  // behind the overlay.
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      onDone?.();
      return;
    }
    if (reduce) {
      finish();
      return;
    }

    const timers = [];
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setDone(i + 1), STEP_MS * (i + 1)));
    });
    timers.push(setTimeout(finish, STEP_MS * STAGES.length + HOLD_MS));

    // Keyboard only, and armed late. A pointerdown listener here was dismissing
    // the screen roughly a second in — a click still in flight from the page
    // load, or a pointer event the browser replays on focus, both count. It was
    // never an advertised affordance either; the hint says "press any key".
    const skip = () => finish();
    const armSkip = setTimeout(() => window.addEventListener("keydown", skip), 400);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(armSkip);
      window.removeEventListener("keydown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduce]);

  const progress = done / STAGES.length;

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void px-6"
      style={{
        opacity: leaving ? 0 : 1,
        transition: "opacity 420ms cubic-bezier(0.16,1,0.3,1)",
        pointerEvents: leaving ? "none" : undefined,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="w-[min(90vw,340px)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">loading</p>

        <ul className="mt-5 space-y-2.5">
          {STAGES.map((stage, i) => {
            const complete = done > i;
            const active = done === i;
            return (
              <li key={stage.label} className="flex items-baseline gap-3 font-mono text-[11px]">
                <span
                  className={`w-3 shrink-0 text-center ${
                    complete || active ? "text-signal" : "text-faint"
                  }`}
                  aria-hidden="true"
                >
                  {complete ? "✓" : active ? "›" : "·"}
                </span>

                <span
                  className={complete || active ? "text-ink" : "text-faint"}
                  style={{
                    opacity: complete ? 1 : active ? 0.85 : 0.35,
                    transition: "opacity 250ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  {stage.label}
                </span>

                {stage.detail && (
                  <span
                    className="ml-auto tabular-nums text-faint"
                    style={{
                      opacity: complete ? 1 : 0.3,
                      transition: "opacity 250ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    {stage.detail}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 h-px w-full overflow-hidden bg-line">
          <div
            className="h-full origin-left"
            style={{
              background: "linear-gradient(90deg, var(--c-signal), var(--c-signal-2))",
              transform: `scaleX(${progress})`,
              transition: "transform 300ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-faint">
          press any key to skip
        </p>
      </div>
    </div>
  );
}
