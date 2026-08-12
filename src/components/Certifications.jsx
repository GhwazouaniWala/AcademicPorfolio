import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { certifications } from "../data/content";
import { SectionEyebrow } from "./About";
import { Reveal, useTilt } from "./Motion";
import Modal from "./Modal";

/**
 * Certifications as a coverflow you browse rather than a carousel that spins
 * past you.
 *
 * The centre card faces the viewer flat; its neighbours rotate away on Y and
 * sink on Z, which reads as a ring turning without any of the card ever being
 * out of view or facing backwards. Movement is discrete and driven by intent —
 * arrows, drag, keyboard, or clicking a side card — with a slow auto-advance
 * that yields the moment you interact.
 *
 * Under prefers-reduced-motion none of this renders: the static grid below is
 * the real component, not a degraded one.
 */
export default function Certifications() {
  const reduce = useReducedMotion();
  const [openIndex, setOpenIndex] = useState(null);

  const open = openIndex === null ? null : certifications[openIndex];

  return (
    <section id="certifications" className="relative band band-edge border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="06" label="Certifications" />

      <Reveal className="mt-8 max-w-xl">
        <p className="text-xl leading-snug text-ink sm:text-2xl">
          {certifications.length} certificates.{" "}
          <span className="text-muted">
            Four from NVIDIA&apos;s Deep Learning Institute, two from 365 Data Science. Every one
            carries its credential ID — open a card to check it.
          </span>
        </p>
      </Reveal>

      {reduce ? (
        <StaticGrid onOpen={setOpenIndex} />
      ) : (
        <Coverflow onOpen={setOpenIndex} frozen={openIndex !== null} />
      )}

      <CertModal cert={open} open={openIndex !== null} onClose={() => setOpenIndex(null)} />
    </section>
  );
}

const AUTOPLAY_MS = 4200;
const VISIBLE = 2; // cards rendered either side of centre

function Coverflow({ onOpen, frozen }) {
  const n = certifications.length;
  const stageRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false); // hover / focus / drag
  const [layout, setLayout] = useState({ card: 280, gap: 130 });

  // Card size and neighbour spacing both scale with the stage so the deck
  // never has to be clipped mid-card on a narrow screen.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const card = Math.round(Math.max(210, Math.min(300, w * 0.66)));
      setLayout({ card, gap: Math.round(card * 0.52) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const go = useCallback((delta) => setIndex((i) => (i + delta + n) % n), [n]);

  // Auto-advance, suspended whenever the viewer is engaged or a modal is open.
  useEffect(() => {
    if (engaged || frozen) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [engaged, frozen, go]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  /** Shortest signed distance from the centre, so the deck wraps both ways. */
  const offsetOf = (i) => {
    const raw = (i - index + n) % n;
    return raw > n / 2 ? raw - n : raw;
  };

  return (
    <div className="mt-12">
      <div
        ref={stageRef}
        className="stage-clip edge-fade-x relative"
        style={{ height: 300 }}
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={() => setEngaged(false)}
        onFocusCapture={() => setEngaged(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setEngaged(false);
        }}
        onKeyDown={onKeyDown}
        role="group"
        aria-roledescription="carousel"
        aria-label="Certifications"
      >
        <div className="stage-3d absolute inset-0">
          {certifications.map((cert, i) => {
            const offset = offsetOf(i);
            const far = Math.abs(offset) > VISIBLE;
            const isCentre = offset === 0;

            return (
              <motion.div
                key={cert.name}
                className="absolute left-1/2 top-1/2"
                style={{ width: layout.card, zIndex: 10 - Math.abs(offset) }}
                initial={false}
                animate={{
                  x: offset * layout.gap - layout.card / 2,
                  y: "-50%",
                  z: -Math.abs(offset) * 190,
                  rotateY: offset * -38,
                  scale: isCentre ? 1 : 0.9,
                  opacity: far ? 0 : isCentre ? 1 : 0.55,
                  filter: isCentre ? "blur(0px)" : "blur(1.2px)",
                }}
                transition={{ type: "spring", stiffness: 220, damping: 30, mass: 0.85 }}
                // Dragging the deck is the fastest way to browse on touch.
                drag={isCentre ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragStart={() => setEngaged(true)}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
              >
                <CertCard
                  cert={cert}
                  position={i + 1}
                  total={n}
                  isCentre={isCentre}
                  hidden={far}
                  onSelect={() => (isCentre ? onOpen(i) : setIndex(i))}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-7 flex items-center justify-center gap-5">
        <NavButton label="Previous certificate" onClick={() => go(-1)}>
          ‹
        </NavButton>

        <div className="flex items-center gap-2">
          {certifications.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${c.name}`}
              aria-current={i === index ? "true" : undefined}
              className="focus-ring group h-4 w-4 rounded-full p-0"
            >
              <span
                className={`mx-auto block rounded-full transition-all duration-300 ${
                  i === index
                    ? "h-2 w-2 bg-signal"
                    : "h-1.5 w-1.5 bg-line group-hover:bg-faint"
                }`}
              />
            </button>
          ))}
        </div>

        <NavButton label="Next certificate" onClick={() => go(1)}>
          ›
        </NavButton>
      </div>

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        <span aria-hidden="true">drag · ← → · click a card</span>
        <span className="sr-only" aria-live="polite">
          {certifications[index].name}, {index + 1} of {n}
        </span>
      </p>
    </div>
  );
}

function NavButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-line font-mono text-lg leading-none text-muted transition-colors hover:border-signal hover:text-signal"
    >
      {children}
    </button>
  );
}

function CertCard({ cert, position, total, isCentre = true, hidden = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden ? "true" : undefined}
      aria-haspopup={isCentre ? "dialog" : undefined}
      aria-label={
        isCentre
          ? `${cert.name}, ${cert.issuer}, issued ${cert.issued || cert.year}. Open details.`
          : `${cert.name}. Bring to front.`
      }
      className={`focus-ring group glass relative flex h-[230px] w-full flex-col overflow-hidden rounded-2xl p-5 text-left transition-colors ${
        isCentre ? "hover:border-signal/40" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(140deg, transparent 30%, color-mix(in srgb, var(--c-signal) 14%, transparent) 50%, transparent 70%)",
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase leading-tight tracking-[0.18em] text-signal">
          {cert.issuer}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
          {cert.issued || cert.year}
        </span>
      </div>

      <h3 className="mt-auto font-display text-lg font-semibold leading-snug text-ink">
        {cert.name}
      </h3>

      <div className="mt-4 h-px w-full bg-line" />
      <span className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-faint">
        <span>
          Verified <span className="tabular-nums">· {position}/{total}</span>
        </span>
        <span
          className={`text-signal transition-opacity ${
            isCentre ? "opacity-0 group-hover:opacity-100" : "opacity-0"
          }`}
        >
          →
        </span>
      </span>
    </button>
  );
}

/** The prefers-reduced-motion presentation: no rotation, no drift, no autoplay. */
function StaticGrid({ onOpen }) {
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {certifications.map((c, i) => (
        <TiltCard key={c.name} cert={c} index={i} onOpen={() => onOpen(i)} />
      ))}
    </div>
  );
}

function TiltCard({ cert, index, onOpen }) {
  const { ref, tiltProps } = useTilt({ max: 6 });
  return (
    <div ref={ref} {...tiltProps}>
      <CertCard
        cert={cert}
        position={index + 1}
        total={certifications.length}
        onSelect={onOpen}
      />
    </div>
  );
}

function CertModal({ cert, open, onClose }) {
  const titleId = useId();
  if (!cert) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="sm">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
            {cert.issuer}
          </span>
          <button
            onClick={onClose}
            className="focus-ring shrink-0 rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal hover:text-signal"
          >
            Close esc
          </button>
        </div>

        <h3 id={titleId} className="mt-5 font-display text-2xl font-bold leading-snug text-ink">
          {cert.name}
        </h3>

        <dl className="mt-6 divide-y divide-[var(--c-line)] border-y border-line font-mono text-[11px]">
          <Row label="Issuer" value={cert.issuer} />
          <Row label="Issued" value={cert.issued || cert.year} />
          {cert.credentialId && <Row label="Credential ID" value={cert.credentialId} mono />}
        </dl>

        {cert.url ? (
          <a
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ink transition-colors hover:border-signal hover:text-signal"
          >
            Verify with {cert.issuer.includes("NVIDIA") ? "NVIDIA" : "365 Data Science"} ↗
          </a>
        ) : (
          <p className="mt-5 font-mono text-[10px] leading-relaxed text-faint">
            No public verification page — the identifier above is a course code rather than a
            certificate hash.
          </p>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 uppercase tracking-wider text-faint">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "break-all text-[10px]" : ""}`}>{value}</dd>
    </div>
  );
}
