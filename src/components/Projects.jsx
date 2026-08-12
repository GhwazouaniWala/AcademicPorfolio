import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { featured, secondary, relativeTime, absoluteDate } from "../data/projects";
import { SectionEyebrow } from "./About";
import { Waveform, Candlestick, Radar, ScriptGrid } from "./motifs/Motifs";
import { EASE, Reveal, useTilt } from "./Motion";
import Modal from "./Modal";
import ProjectGallery from "./ProjectGallery";

const MOTIFS = {
  waveform: Waveform,
  candlestick: Candlestick,
  radar: Radar,
  "script-grid": ScriptGrid,
};

export default function Projects() {
  // Which row the pointer/keyboard is on. Drives the sticky preview panel.
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState(null);

  const openProject = featured.concat(secondary).find((p) => p.id === openId) || null;

  return (
    <section id="projects" className="relative band band-edge border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="04" label="Projects" />

      <Reveal className="mt-8 max-w-2xl">
        <p className="text-xl leading-snug text-ink sm:text-2xl">
          Four systems taken from model to deployment.{" "}
          <span className="text-muted">
            Each one opens with its reasoning, screenshots pulled live from the repository, and the
            date of its last push.
          </span>
        </p>
      </Reveal>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_minmax(340px,420px)] lg:gap-14">
        {/* Index */}
        <ul className="border-t border-line">
          {featured.map((p, i) => (
            <ProjectRow
              key={p.id}
              project={p}
              index={i}
              active={active === i}
              onActivate={() => setActive(i)}
              onOpen={() => setOpenId(p.id)}
            />
          ))}
        </ul>

        {/* Preview — desktop only. On smaller screens the row itself carries a
            thumbnail, so nothing is lost. */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <PreviewPanel project={featured[active]} />
          </div>
        </div>
      </div>

      <div className="mt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          Additional work
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {secondary.map((p, i) => (
            <SecondaryCard key={p.id} project={p} index={i} onOpen={() => setOpenId(p.id)} />
          ))}
        </div>
      </div>

      <ProjectModal
        project={openProject}
        open={!!openProject}
        onClose={() => setOpenId(null)}
      />
    </section>
  );
}

/** Live-work signal: last push to the repository, relative to now. */
function LastCommit({ project, className = "" }) {
  const iso = project.github?.pushedAt;
  const rel = relativeTime(iso);
  if (!rel) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] text-faint ${className}`}>
      <span className="h-1 w-1 rounded-full bg-signal/70" aria-hidden="true" />
      updated{" "}
      <time dateTime={iso} title={absoluteDate(iso)}>
        {rel}
      </time>
    </span>
  );
}

function ProjectRow({ project, index, active, onActivate, onOpen }) {
  const reduce = useReducedMotion();
  const Motif = MOTIFS[project.motif];
  const shot = project.images?.[0];

  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={onOpen}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        aria-haspopup="dialog"
        className="focus-ring group relative block w-full overflow-hidden py-7 text-left sm:py-9"
      >
        {/* wash that fills from the left on hover/focus */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-6 -right-6 -z-10 origin-left"
          style={{ background: "linear-gradient(90deg, var(--c-panel), transparent 70%)" }}
          initial={false}
          animate={{ opacity: active ? 1 : 0, scaleX: active ? 1 : 0.92 }}
          transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE }}
        />

        <div className="flex items-start gap-4 sm:gap-6">
          <span className="mt-1.5 font-mono text-[10px] tabular-nums text-faint">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <motion.h3
                className="font-display text-3xl font-bold leading-none text-ink sm:text-4xl"
                animate={{ x: active && !reduce ? 6 : 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {project.name}
              </motion.h3>
              <span className="font-mono text-[10px] text-faint">{project.period}</span>
            </div>

            <p className="mt-2 text-sm text-signal">{project.tagline}</p>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted">
              {project.description}
            </p>

            {/* mobile-only thumbnail, since the sticky preview is desktop-only */}
            {shot && (
              <img
                src={shot.src}
                alt=""
                width={shot.width}
                height={shot.height}
                loading="lazy"
                decoding="async"
                className="mt-4 h-40 w-full rounded-lg border border-line object-cover object-top lg:hidden"
              />
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-signal">
                Open case study
                <span
                  className={`ml-1.5 inline-block transition-transform ${active ? "translate-x-1" : ""}`}
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
              <LastCommit project={project} />
              {project.metrics?.[0] && (
                <span className="font-mono text-[10px] text-faint">
                  <span className="text-muted">{project.metrics[0].value}</span>{" "}
                  {project.metrics[0].label}
                </span>
              )}
            </div>
          </div>

          <Motif
            className={`hidden h-14 w-24 shrink-0 transition-colors sm:block ${
              active ? "text-signal" : "text-line"
            }`}
          />
        </div>
      </button>
    </li>
  );
}

/** Sticky panel that cross-fades to whichever project row is active. */
function PreviewPanel({ project }) {
  const reduce = useReducedMotion();
  const { ref, tiltProps } = useTilt({ max: 5, scale: 1.008 });
  const shot = project?.images?.[0];
  const Motif = MOTIFS[project?.motif];

  if (!project) return null;

  return (
    <div ref={ref} {...tiltProps} className="glass overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-panel">
        {/* Concurrent, not mode="wait": the images are absolutely positioned so
            they cross-fade over one another, and a fast pass down the list never
            queues up behind an unfinished exit. */}
        <AnimatePresence initial={false}>
          {shot ? (
            <motion.img
              key={shot.src}
              src={shot.src}
              alt={shot.alt || `${project.name} interface`}
              width={shot.width}
              height={shot.height}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
              initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.15 : 0.55, ease: EASE }}
            />
          ) : (
            <motion.div
              key={`${project.id}-motif`}
              className="absolute inset-0 flex items-center justify-center p-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {Motif && <Motif className="w-full max-w-[240px] text-signal" />}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute left-3 top-3 rounded bg-void/70 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted backdrop-blur">
          {shot ? "from repository README" : "no screenshots in README"}
        </span>
      </div>

      <div className="p-5">
        {/* Keyed remount rather than AnimatePresence — there is nothing to
            animate out here, and an exit would only delay the next swap. */}
        <div>
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.35, ease: EASE }}
          >
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
              {project.metrics?.map((m) => (
                <div key={m.label} className="bg-void px-3 py-3">
                  <div className="font-mono text-base leading-none text-gradient">{m.value}</div>
                  <div className="mt-1.5 text-[10px] leading-tight text-faint">{m.label}</div>
                </div>
              ))}
            </div>

            {project.languages?.length > 0 && (
              <div className="mt-4">
                <LanguageBar languages={project.languages} compact />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SecondaryCard({ project, index, onOpen }) {
  const { ref, tiltProps } = useTilt({ max: 6 });

  return (
    <Reveal delay={index * 0.06}>
      <article
        ref={ref}
        {...tiltProps}
        className="group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-5"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--c-signal) 12%, transparent), transparent 65%)",
          }}
        />
        <h4 className="font-display text-lg font-semibold text-ink">{project.name}</h4>
        <p className="mt-1 text-xs text-signal">{project.tagline}</p>
        <p className="mt-3 flex-1 text-[13px] leading-relaxed text-muted">{project.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-muted"
            >
              {s}
            </span>
          ))}
        </div>

        <LastCommit project={project} className="mt-4" />

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            onClick={onOpen}
            aria-haspopup="dialog"
            className="focus-ring rounded font-mono text-[11px] uppercase tracking-wider text-signal hover:opacity-80"
          >
            Details →
          </button>
          <a
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded font-mono text-[11px] uppercase tracking-wider text-muted hover:text-signal"
          >
            Repository ↗
          </a>
        </div>
      </article>
    </Reveal>
  );
}

function ProjectModal({ project, open, onClose }) {
  const titleId = useId();
  if (!project) return null;

  const gh = project.github;
  const iso = gh?.pushedAt;
  const rel = relativeTime(iso);

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="xl">
      <header className="flex items-start justify-between gap-4 border-b border-line p-6 sm:px-8">
        <div>
          <h3 id={titleId} className="font-display text-2xl font-bold text-ink">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-signal">{project.tagline}</p>
          {project.period && (
            <p className="mt-2 font-mono text-[11px] text-faint">{project.period}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="focus-ring shrink-0 rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal hover:text-signal"
        >
          Close esc
        </button>
      </header>

      <div className="space-y-7 p-6 sm:px-8 sm:py-7">
        <p className="text-sm leading-relaxed text-muted">{project.description}</p>

        {project.detail && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Reasoning</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{project.detail}</p>
          </div>
        )}

        {project.metrics?.length > 0 && (
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {project.metrics.map((m) => (
              <div key={m.label} className="bg-void px-3 py-3">
                <div className="font-mono text-lg leading-none text-gradient">{m.value}</div>
                <div className="mt-1.5 text-[10px] leading-tight text-faint">{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Omitted entirely when the repository README has no images. */}
        <ProjectGallery images={project.images} projectName={project.name} />

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Stack</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span
                key={s}
                className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {project.topics?.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              Repository topics
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.topics.map((t) => (
                <span
                  key={t}
                  className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-signal/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {project.languages?.length > 0 && <LanguageBar languages={project.languages} />}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="space-y-1 font-mono text-[10px] text-faint">
            {rel && (
              <p>
                last push{" "}
                <time dateTime={iso} className="text-muted">
                  {rel}
                </time>
                {absoluteDate(iso) && ` · ${absoluteDate(iso)}`}
              </p>
            )}
            {gh && (
              <p>
                source: github.com/{gh.owner}/{gh.name}
              </p>
            )}
          </div>
          <a
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ink transition-colors hover:border-signal hover:text-signal"
          >
            Open repository ↗
          </a>
        </div>
      </div>
    </Modal>
  );
}

function LanguageBar({ languages, compact = false }) {
  return (
    <div>
      {!compact && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          Language breakdown
        </p>
      )}
      <div
        className={`flex overflow-hidden rounded-full bg-line ${compact ? "mt-0 h-1" : "mt-3 h-1.5"}`}
        role="img"
        aria-label={languages.map((l) => `${l.name} ${l.pct}%`).join(", ")}
      >
        {languages.map((l, i) => (
          <span
            key={l.name}
            style={{
              width: `${l.pct}%`,
              background: i % 2 === 0 ? "var(--c-signal)" : "var(--c-signal-2)",
              opacity: 1 - i * 0.14,
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
        {languages.map((l, i) => (
          <span key={l.name} className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: i % 2 === 0 ? "var(--c-signal)" : "var(--c-signal-2)",
                opacity: 1 - i * 0.14,
              }}
            />
            {l.name} <span className="tabular-nums text-faint">{l.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
