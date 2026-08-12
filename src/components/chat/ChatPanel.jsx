import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "../Motion";
import { useChat } from "./useChat";

const STARTERS = [
  "What did he build at Wevioo?",
  "Show me his multi-agent work",
  "Does he have MLOps experience?",
  "When is he available to start?",
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The chat panel. Follows the modal's interaction rules — ESC to close, focus
 * trapped inside, scroll locked behind it, focus restored on exit.
 */
export default function ChatPanel({ open, onClose }) {
  const { messages, status, busy, send, reset } = useChat();
  const [draft, setDraft] = useState("");
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const restoreRef = useRef(null);
  const reduce = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    if (open) restoreRef.current = document.activeElement;
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(t);
      const el = restoreRef.current;
      if (el?.focus && document.contains(el)) el.focus();
    };
  }, [open]);

  // Keep the newest message in view as tokens arrive.
  useLayoutEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []).filter(
      (n) => n.offsetParent !== null || n === document.activeElement,
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const submit = (e) => {
    e?.preventDefault();
    if (!draft.trim() || busy) return;
    send(draft);
    setDraft("");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-end p-0 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-void/70 backdrop-blur-sm sm:bg-void/40"
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
            aria-labelledby={titleId}
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
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
                : { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.18, ease: EASE } }
            }
            className="glass relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-panel/95 sm:h-[min(78vh,640px)] sm:w-[min(100%,440px)] sm:rounded-2xl"
          >
            <Header titleId={titleId} onClose={onClose} onReset={reset} hasMessages={messages.length > 0} />

            <div
              ref={logRef}
              className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
              role="log"
              aria-live="polite"
              aria-label="Conversation"
            >
              {messages.length === 0 ? (
                <EmptyState onPick={(q) => send(q)} />
              ) : (
                messages.map((m) => <Message key={m.id} message={m} />)
              )}
            </div>

            <Composer
              draft={draft}
              setDraft={setDraft}
              onSubmit={submit}
              busy={busy}
              status={status}
              inputRef={inputRef}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Header({ titleId, onClose, onReset, hasMessages }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
          Ask about my work
        </h2>
        <p className="mt-0.5 font-mono text-[10px] text-faint">
          answers retrieved from the CV, repo READMEs &amp; this site
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {hasMessages && (
          <button
            onClick={onReset}
            className="focus-ring rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal hover:text-signal"
          >
            Clear
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close assistant"
          className="focus-ring rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal hover:text-signal"
        >
          Esc
        </button>
      </div>
    </header>
  );
}

function EmptyState({ onPick }) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">
        This is a retrieval system, not a canned FAQ. Every answer is pulled from Wala&apos;s
        actual documents and shows the sources it used — and if the documents don&apos;t cover
        your question, it says so instead of guessing.
      </p>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        Try one
      </p>
      <ul className="mt-3 space-y-2">
        {STARTERS.map((q) => (
          <li key={q}>
            <button
              onClick={() => onPick(q)}
              className="focus-ring group flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5 text-left text-[13px] text-ink transition-colors hover:border-signal/50 hover:bg-[color-mix(in_srgb,var(--c-signal)_7%,transparent)]"
            >
              {q}
              <span className="shrink-0 text-signal opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-line bg-panel-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        className={`whitespace-pre-wrap text-[13px] leading-relaxed ${
          message.error ? "text-attention" : "text-ink"
        }`}
      >
        {message.content}
        {message.streaming && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-signal align-baseline"
            aria-hidden="true"
          />
        )}
      </p>
      {message.sources?.length > 0 && <Sources sources={message.sources} />}
    </div>
  );
}

/** Collapsible provenance chips — the point is that retrieval is inspectable. */
function Sources({ sources }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring rounded font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-signal"
      >
        <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>▸</span>{" "}
        {sources.length} source{sources.length === 1 ? "" : "s"}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {sources.map((s, i) => {
                const label = s.section ? `${s.title} › ${s.section}` : s.title;
                const inner = (
                  <>
                    <span className="truncate">{label}</span>
                    <span className="ml-auto shrink-0 font-mono text-[9px] tabular-nums text-faint">
                      {s.score}
                    </span>
                  </>
                );
                const cls =
                  "flex items-center gap-2 rounded border border-line px-2 py-1.5 font-mono text-[10px] text-muted transition-colors";
                return (
                  <li key={`${s.title}-${i}`}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target={s.url.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`focus-ring ${cls} hover:border-signal/40 hover:text-signal`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <span className={cls}>{inner}</span>
                    )}
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Composer({ draft, setDraft, onSubmit, busy, status, inputRef }) {
  return (
    <form onSubmit={onSubmit} className="border-t border-line px-5 py-4">
      <div className="flex items-end gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Ask a question about Wala&apos;s work
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSubmit(e);
          }}
          placeholder="Ask about his experience, projects, or stack…"
          maxLength={1000}
          className="focus-ring max-h-28 min-h-[38px] flex-1 resize-none rounded-lg border border-line bg-void px-3 py-2.5 text-[13px] text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send question"
          className="focus-ring flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg font-mono text-sm text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
          style={{ background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))" }}
        >
          ↑
        </button>
      </div>

      <p className="mt-2 flex items-center gap-2 font-mono text-[10px] text-faint" aria-live="polite">
        {status ? (
          <>
            <span
              className={`h-1 w-1 rounded-full ${
                status.phase === "no_match" ? "bg-attention" : "bg-signal"
              } ${busy ? "animate-pulse" : ""}`}
              aria-hidden="true"
            />
            {status.label}
          </>
        ) : (
          <>grounded in real documents · enter to send</>
        )}
      </p>
    </form>
  );
}
