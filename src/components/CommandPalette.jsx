import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Modal from "./Modal";
import { SECTIONS } from "./Nav";
import { featured, secondary } from "../data/projects";
import { certifications, profile } from "../data/content";
import generated from "../data/github.generated.json";

/**
 * ⌘K / Ctrl-K palette over everything addressable on the site.
 *
 * Scoring is a subsequence match, not a substring one, so "fxa" finds
 * "FX AlphaLab" — the usual reason a palette feels smart. Matches are ranked by
 * how tightly the typed letters cluster in the target, with a bonus for hits on
 * word boundaries, so "solace" beats a scattered coincidental match.
 */

/* --------------------------------------------------------------- fuzzy match */

/**
 * @returns {{score:number, hits:number[]}|null} null when the query is not a
 * subsequence of the text at all.
 */
function fuzzy(query, text) {
  if (!query) return { score: 0, hits: [] };
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  let score = 0;
  let ti = 0;
  let lastHit = -2;
  const hits = [];

  for (const char of q) {
    if (char === " ") continue;
    const found = t.indexOf(char, ti);
    if (found === -1) return null;

    // Consecutive letters are worth far more than scattered ones.
    if (found === lastHit + 1) score += 8;
    // A letter starting a word is a strong signal of intent.
    if (found === 0 || /[\s\-—·/]/.test(t[found - 1])) score += 6;
    // Later matches are weaker; prefer hits near the start.
    score += Math.max(0, 4 - found * 0.05);

    hits.push(found);
    lastHit = found;
    ti = found + 1;
  }

  // Shorter targets that satisfy the query are usually the better answer.
  return { score: score - text.length * 0.04, hits };
}

/** Highlight the matched characters so the ranking is legible, not magic. */
function Highlight({ text, hits }) {
  if (!hits?.length) return text;
  const set = new Set(hits);
  return [...text].map((char, i) =>
    set.has(i) ? (
      <mark key={i} className="bg-transparent text-signal">
        {char}
      </mark>
    ) : (
      <span key={i}>{char}</span>
    ),
  );
}

/* ------------------------------------------------------------------ commands */

function buildCommands({ onNavigate, onOpenChat, onOpenDemo, theme }) {
  const items = [];

  for (const s of SECTIONS) {
    items.push({
      id: `section:${s.id}`,
      label: s.label,
      group: "Go to",
      hint: s.index,
      keywords: "section jump scroll",
      run: () => onNavigate(s.id),
    });
  }

  for (const p of [...featured, ...secondary]) {
    items.push({
      id: `project:${p.id}`,
      label: p.name,
      group: "Projects",
      hint: p.tagline,
      keywords: `${p.tagline} ${p.stack.join(" ")}`,
      run: () => onNavigate("projects"),
    });
    items.push({
      id: `repo:${p.id}`,
      label: `${p.name} — repository`,
      group: "Open",
      hint: "github.com",
      external: p.repo,
      keywords: "github source code repo",
      run: () => window.open(p.repo, "_blank", "noopener,noreferrer"),
    });
  }

  for (const m of generated?.models || []) {
    items.push({
      id: `model:${m.family}`,
      label: m.family,
      group: "Open",
      hint: `Hugging Face · ${m.downloads} downloads`,
      external: m.url,
      keywords: `model weights huggingface ${m.pipeline || ""} ${(m.tags || []).join(" ")}`,
      run: () => window.open(m.url, "_blank", "noopener,noreferrer"),
    });
  }

  for (const c of certifications) {
    items.push({
      id: `cert:${c.name}`,
      label: c.name,
      group: "Certifications",
      hint: `${c.issuer} · ${c.year}`,
      keywords: `certificate ${c.issuer}`,
      run: () => onNavigate("certifications"),
    });
  }

  items.push(
    {
      id: "action:chat",
      label: "Ask the CV assistant",
      group: "Actions",
      hint: "Retrieval over the CV and repos",
      keywords: "chat rag question ai bot search",
      run: onOpenChat,
    },
    {
      id: "action:demo",
      label: "Run the expression demo",
      group: "Actions",
      hint: "On-device, no camera needed",
      keywords: "face emotion vision onnx camera demo",
      run: onOpenDemo,
    },
    {
      id: "action:theme",
      label: `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
      group: "Actions",
      hint: "Toggle appearance",
      keywords: "dark light appearance colour color",
      run: () => document.querySelector('[role="switch"]')?.click(),
    },
    {
      id: "action:cv",
      label: "Download the CV",
      group: "Open",
      hint: "PDF",
      external: "/Wala_Eddine_Ghazouani_CV.pdf",
      keywords: "resume cv pdf download",
      run: () => window.open("/Wala_Eddine_Ghazouani_CV.pdf", "_blank", "noopener,noreferrer"),
    },
    {
      id: "action:email",
      label: "Send an email",
      group: "Open",
      hint: profile.email,
      keywords: "contact mail hire reach",
      run: () => {
        window.location.href = `mailto:${profile.email}`;
      },
    },
    {
      id: "action:github",
      label: "GitHub profile",
      group: "Open",
      hint: profile.github.replace("https://", ""),
      external: profile.github,
      keywords: "code source",
      run: () => window.open(profile.github, "_blank", "noopener,noreferrer"),
    },
    {
      id: "action:linkedin",
      label: "LinkedIn profile",
      group: "Open",
      hint: "linkedin.com",
      external: profile.linkedin,
      keywords: "contact network",
      run: () => window.open(profile.linkedin, "_blank", "noopener,noreferrer"),
    },
  );

  return items;
}

/* -------------------------------------------------------------------- palette */

export default function CommandPalette({ open, onOpenChange, onOpenChat, onOpenDemo, theme }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const reduce = useReducedMotion();

  const navigate = useCallback(
    (id) => {
      onOpenChange(false);
      // Let the modal release scroll lock before we scroll, or the jump is eaten.
      requestAnimationFrame(() =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
      );
    },
    [onOpenChange, reduce],
  );

  const commands = useMemo(
    () =>
      buildCommands({
        onNavigate: navigate,
        onOpenChat: () => {
          onOpenChange(false);
          requestAnimationFrame(() => onOpenChat?.());
        },
        onOpenDemo: () => {
          onOpenChange(false);
          requestAnimationFrame(() => onOpenDemo?.());
        },
        theme,
      }),
    [navigate, onOpenChange, onOpenChat, onOpenDemo, theme],
  );

  const results = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 8).map((c) => ({ ...c, hits: [] }));

    return commands
      .map((c) => {
        const onLabel = fuzzy(query, c.label);
        // Keywords widen what matches without polluting the visible highlight.
        const onKeywords = onLabel ? null : fuzzy(query, `${c.label} ${c.keywords || ""}`);
        const match = onLabel || onKeywords;
        if (!match) return null;
        return {
          ...c,
          score: onLabel ? match.score + 12 : match.score,
          hits: onLabel ? match.hits : [],
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, commands]);

  // Reset the cursor whenever the result set changes under it.
  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  // Keep the highlighted row in view during keyboard travel.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /**
   * Hover selects a row — but only when the pointer has genuinely moved.
   * Re-rendering the list under a stationary cursor fires mousemove, which
   * would otherwise yank the selection back to whatever sits under the mouse
   * on every arrow key press.
   */
  const pointer = useRef({ x: -1, y: -1 });
  const onRowHover = (e, index) => {
    const { clientX: x, clientY: y } = e;
    if (x === pointer.current.x && y === pointer.current.y) return;
    pointer.current = { x, y };
    setActive(index);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    }
  };

  const grouped = results.reduce((acc, r, i) => {
    (acc[r.group] ||= []).push({ ...r, index: i });
    return acc;
  }, {});

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      label="Command palette"
      size="md"
      initialFocusRef={inputRef}
      className="!bg-panel/95"
    >
      <div onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span className="font-mono text-[11px] text-signal" aria-hidden="true">
            ⌘K
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a section, project, model…"
            aria-label="Search sections, projects, models and actions"
            aria-controls="command-results"
            autoComplete="off"
            spellCheck="false"
            className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-faint sm:block">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="command-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[min(56vh,420px)] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted">
              Nothing matches “{query}”. Try a project name, a model, or a section.
            </p>
          ) : (
            Object.entries(grouped).map(([group, rows]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                  {group}
                </p>
                {rows.map((r) => {
                  const isActive = r.index === active;
                  return (
                    <button
                      key={r.id}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseMove={(e) => onRowHover(e, r.index)}
                      onClick={r.run}
                      className="focus-ring relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="palette-cursor"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          className="absolute inset-0 -z-10 rounded-lg border border-line bg-panel-2"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                        <Highlight text={r.label} hits={r.hits} />
                      </span>
                      {r.hint && (
                        <span className="hidden shrink-0 truncate font-mono text-[10px] text-faint sm:block sm:max-w-[45%]">
                          {r.hint}
                        </span>
                      )}
                      <span
                        className={`shrink-0 font-mono text-[10px] ${
                          isActive ? "text-signal" : "text-faint"
                        }`}
                        aria-hidden="true"
                      >
                        {r.external ? "↗" : "↵"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-faint">
          <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
          <span className="hidden sm:block">↑↓ navigate · ↵ open · esc close</span>
        </div>
      </div>
    </Modal>
  );
}

/** Global ⌘K / Ctrl-K listener, kept out of the palette so it costs nothing when closed. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return [open, setOpen];
}

/** The one-line hint in the footer, so the shortcut is discoverable. */
export function PaletteHint({ onOpen }) {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || "")), []);

  return (
    <button
      onClick={onOpen}
      className="focus-ring group flex items-center gap-2 rounded font-mono text-[11px] text-faint transition-colors hover:text-muted"
    >
      Press
      <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] transition-colors group-hover:border-signal group-hover:text-signal">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
      to jump anywhere
    </button>
  );
}
