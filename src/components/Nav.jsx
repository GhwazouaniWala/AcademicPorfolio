import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLiveClock } from "../hooks/useLiveClock";
import { useScrollSpy } from "../hooks/useScrollSpy";
import { useTheme } from "../hooks/useTheme";
import { EASE } from "./Motion";

export const SECTIONS = [
  { id: "about", label: "About", index: "01" },
  { id: "skills", label: "Skills", index: "02" },
  { id: "experience", label: "Experience", index: "03" },
  { id: "projects", label: "Projects", index: "04" },
  { id: "models", label: "Models", index: "05" },
  { id: "certifications", label: "Certificates", index: "06" },
  { id: "demos", label: "Demos", index: "07" },
  { id: "contact", label: "Contact", index: "08" },
];

/**
 * A floating command bar in place of the old fixed sidebar.
 *
 * It docks to the top centre and condenses once you leave the hero, so it stays
 * out of the way of the content instead of permanently reserving 240px of the
 * viewport. Section state, reading progress, and the theme control all live
 * here, which keeps the page itself free of chrome.
 */
export default function Nav() {
  const activeId = useScrollSpy(SECTIONS.map((s) => s.id));
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setCondensed(v > 120));

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  // ESC closes the mobile sheet.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const active = SECTIONS.find((s) => s.id === activeId);

  return (
    <>
      <motion.header
        initial={false}
        animate={{ paddingTop: condensed ? 10 : 22 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-6"
      >
        <motion.nav
          initial={false}
          animate={{ scale: condensed && !reduce ? 0.97 : 1 }}
          transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
          className="glass flex w-full max-w-5xl items-center gap-2 rounded-full py-1.5 pl-2 pr-1.5 sm:gap-3 sm:pl-3"
          aria-label="Primary"
        >
          {/* Full link row — desktop */}
          <ul className="hidden flex-1 items-center gap-0.5 lg:flex">
            {SECTIONS.map((s) => {
              const on = activeId === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    aria-current={on ? "true" : undefined}
                    className="focus-ring relative rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                  >
                    {on && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        className="absolute inset-0 -z-10 rounded-full border border-line bg-panel"
                      />
                    )}
                    <span className={on ? "text-ink" : "text-muted hover:text-ink"}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Current-section readout — below desktop, where the full row will not fit */}
          <div className="flex flex-1 items-center gap-2 overflow-hidden lg:hidden">
            <span className="font-mono text-[10px] tabular-nums text-signal">
              {active?.index ?? "00"}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {active?.label ?? "Intro"}
            </span>
          </div>

          <ProgressRing
            progress={scrollYProgress}
            onTop={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          />
          <ThemeToggle />

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-signal hover:text-signal lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </motion.nav>
      </motion.header>

      <MobileSheet
        open={menuOpen}
        activeId={activeId}
        onClose={() => setMenuOpen(false)}
        onNavigate={scrollTo}
      />
    </>
  );
}

/**
 * Reading progress, and the way back to the top.
 *
 * Removing the wordmark took the only "return to the hero" control with it.
 * Rather than reintroduce chrome for it, the progress ring — already present,
 * already about vertical position — takes the job.
 */
function ProgressRing({ progress, onTop }) {
  const [pct, setPct] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setPct(Math.round(v * 100)));

  const r = 11;
  const c = 2 * Math.PI * r;

  return (
    <button
      onClick={onTop}
      aria-label="Back to top"
      title={`${pct}% read — back to top`}
      className="focus-ring group relative hidden h-8 w-8 shrink-0 items-center justify-center rounded-full sm:flex"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="-rotate-90">
        <circle cx="14" cy="14" r={r} fill="none" stroke="var(--c-line)" strokeWidth="1.5" />
        <circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          stroke="var(--c-signal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute font-mono text-[8px] tabular-nums text-faint transition-colors group-hover:text-signal">
        {pct}
      </span>
      <span className="sr-only">{pct}% of the page read</span>
    </button>
  );
}

function MobileSheet({ open, onClose, onNavigate, activeId }) {
  const time = useLiveClock();
  const reduce = useReducedMotion();

  // Lock scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.25, ease: EASE }}
        >
          <div className="absolute inset-0 bg-void/85 backdrop-blur-md" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ y: reduce ? 0 : "-6%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduce ? 0 : "-4%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="glass absolute inset-x-3 top-3 rounded-3xl p-5"
          >
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                autoFocus
                className="focus-ring rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted"
              >
                Close
              </button>
            </div>

            <ul className="mt-5 divide-y divide-[var(--c-line)]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => onNavigate(s.id)}
                    aria-current={activeId === s.id ? "true" : undefined}
                    className="focus-ring flex w-full items-center gap-4 py-3.5 text-left"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-faint">{s.index}</span>
                    <span
                      className={`font-display text-xl font-semibold ${
                        activeId === s.id ? "text-signal" : "text-ink"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-[10px] text-muted">
              <span className="flex items-center gap-2 text-signal">
                <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                AVAILABLE · JAN&ndash;JUN 2027
              </span>
              <span className="tabular-nums">TUNIS {time}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="focus-ring relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-signal hover:text-signal"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          initial={{ rotate: -70, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 70, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.28, ease: EASE }}
          aria-hidden="true"
        >
          {isLight ? (
            <>
              <circle cx="8" cy="8" r="3.2" />
              <path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3" />
            </>
          ) : (
            <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.8 5.8 0 1 0 6.6 6.6Z" />
          )}
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
