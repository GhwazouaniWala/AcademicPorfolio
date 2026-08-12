import { motion, useReducedMotion } from "framer-motion";
import generated from "../data/github.generated.json";
import { SectionEyebrow } from "./About";
import { Reveal, Stagger, StaggerItem, useTilt } from "./Motion";
import { relativeTime, absoluteDate } from "../data/projects";

/**
 * Models published to Hugging Face.
 *
 * Everything here is fetched at build time from the Hugging Face API — nothing
 * is hand-written. Numbered revisions of the same model are collapsed into one
 * entry by the fetch script, so five uploads of silma-tts-derja read as one
 * model with five revisions rather than five separate releases.
 */
export default function Models() {
  const models = generated?.models || [];
  if (models.length === 0) return null;

  const totalDownloads = models.reduce((a, m) => a + m.downloads, 0);

  return (
    <section id="models" className="relative border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="05" label="Published models" />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <Reveal className="max-w-xl">
          <p className="text-xl leading-snug text-ink sm:text-2xl">
            Fine-tuned and published, not just trained.{" "}
            <span className="text-muted">
              Speech, TTS, and handwriting models on Hugging Face — public weights anyone can pull.
            </span>
          </p>
        </Reveal>

        <Reveal delay={0.1} className="font-mono text-[11px] text-faint">
          <span className="text-gradient text-2xl tabular-nums">{totalDownloads}</span> total
          downloads across {models.length} models
        </Reveal>
      </div>

      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
        {models.map((m) => (
          <StaggerItem key={m.family}>
            <ModelCard model={m} max={models[0].downloads} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function ModelCard({ model, max }) {
  const { ref, tiltProps } = useTilt({ max: 7 });
  const reduce = useReducedMotion();
  const share = max > 0 ? Math.max(4, Math.round((model.downloads / max) * 100)) : 0;

  return (
    <a
      ref={ref}
      {...tiltProps}
      href={model.url}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-5"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--c-signal) 12%, transparent), transparent 62%)",
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
          {model.pipeline || "custom"}
        </span>
        {model.revisions > 1 && (
          <span className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-faint">
            {model.revisions} rev
          </span>
        )}
      </div>

      <h3 className="mt-4 break-words font-display text-lg font-semibold leading-snug text-ink">
        {model.family}
      </h3>

      <div className="mt-3 flex flex-wrap gap-1">
        {model.tags.slice(0, 4).map((t) => (
          <span key={t} className="font-mono text-[9px] text-muted">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between font-mono">
          <span className="text-2xl leading-none text-gradient tabular-nums">
            {model.downloads}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-faint">downloads</span>
        </div>

        {/* relative volume across the published set */}
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <motion.span
            className="block h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--c-signal), var(--c-signal-2))" }}
            initial={{ width: reduce ? `${share}%` : 0 }}
            whileInView={{ width: `${share}%` }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <p className="mt-3 font-mono text-[10px] text-faint">
          updated{" "}
          <time dateTime={model.lastModified} title={absoluteDate(model.lastModified)}>
            {relativeTime(model.lastModified)}
          </time>
          <span className="ml-2 text-signal opacity-0 transition-opacity group-hover:opacity-100">
            open ↗
          </span>
        </p>
      </div>
    </a>
  );
}
