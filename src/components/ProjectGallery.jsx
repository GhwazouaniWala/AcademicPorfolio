import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EASE } from "./Motion";

/**
 * Screenshot gallery for the project modal: a horizontal thumbnail strip that
 * expands into a lightbox with arrow-key navigation.
 *
 * Every image carries the intrinsic width/height captured at build time, so the
 * frame is reserved before the bytes arrive and nothing reflows. If a repo has
 * no images the caller renders nothing at all — there is no empty state here by
 * design, because an empty frame reads as a broken one.
 */
export default function ProjectGallery({ images, projectName }) {
  const [expanded, setExpanded] = useState(null); // index or null
  const stripRef = useRef(null);
  const thumbRefs = useRef([]);
  const reduce = useReducedMotion();

  const count = images.length;

  const go = useCallback(
    (delta) => setExpanded((i) => (i === null ? null : (i + delta + count) % count)),
    [count],
  );

  // Close and return focus to the thumbnail currently being viewed.
  const closeLightbox = useCallback(() => {
    setExpanded((i) => {
      requestAnimationFrame(() => thumbRefs.current[i]?.focus());
      return null;
    });
  }, []);

  // Arrow-key navigation while the lightbox is open. Captured on window so it
  // works regardless of which control inside the lightbox holds focus, and
  // stops ESC from reaching the parent modal — ESC closes the image first.
  useEffect(() => {
    if (expanded === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [expanded, go, closeLightbox]);

  // Arrow keys also move between thumbnails in the strip itself.
  const onStripKeyDown = (e, i) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + count) % count;
    thumbRefs.current[next]?.focus();
    thumbRefs.current[next]?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  };

  if (count === 0) return null;

  const current = expanded === null ? null : images[expanded];

  return (
    <section aria-label={`${projectName} screenshots`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Screenshots</p>
        <p className="font-mono text-[10px] text-faint">
          {count} from repository README
        </p>
      </div>

      <ul
        ref={stripRef}
        className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
      >
        {images.map((img, i) => (
          <li key={img.src} className="shrink-0 snap-start">
            <button
              ref={(el) => (thumbRefs.current[i] = el)}
              type="button"
              onClick={() => setExpanded(i)}
              onKeyDown={(e) => onStripKeyDown(e, i)}
              className="focus-ring group block overflow-hidden rounded-lg border border-line bg-panel transition-colors hover:border-signal/40"
              aria-label={`Expand screenshot ${i + 1} of ${count}${img.alt ? `: ${img.alt}` : ""}`}
            >
              <img
                src={img.src}
                alt={img.alt || `${projectName} screenshot ${i + 1}`}
                width={img.width}
                height={img.height}
                loading="lazy"
                decoding="async"
                className="h-[104px] w-[168px] object-cover object-top opacity-85 transition-opacity group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-void/95 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.2, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label={`${projectName} screenshot ${expanded + 1} of ${count}`}
            onClick={closeLightbox}
          >
            <div
              className="flex w-full max-w-5xl items-center justify-between gap-4 pb-3"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-mono text-[11px] text-muted truncate">
                {current.alt || `${projectName} — screenshot`}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-faint tabular-nums">
                  {expanded + 1} / {count}
                </span>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="focus-ring rounded border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted hover:border-signal hover:text-signal transition-colors"
                >
                  Close esc
                </button>
              </div>
            </div>

            <div
              className="flex w-full max-w-5xl flex-1 items-center gap-3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {count > 1 && (
                <NavButton label="Previous screenshot" onClick={() => go(-1)}>
                  ‹
                </NavButton>
              )}
              <img
                key={current.src}
                src={current.src}
                alt={current.alt || `${projectName} screenshot ${expanded + 1}`}
                width={current.width}
                height={current.height}
                decoding="async"
                className="mx-auto max-h-full min-h-0 w-auto max-w-full rounded-lg border border-line object-contain"
              />
              {count > 1 && (
                <NavButton label="Next screenshot" onClick={() => go(1)}>
                  ›
                </NavButton>
              )}
            </div>

            <p
              className="pt-3 font-mono text-[10px] uppercase tracking-wider text-faint"
              onClick={(e) => e.stopPropagation()}
            >
              ← → to navigate
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function NavButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="focus-ring shrink-0 rounded-full border border-line bg-panel/80 px-3 py-2 font-mono text-lg leading-none text-muted hover:border-signal hover:text-signal transition-colors"
    >
      {children}
    </button>
  );
}
