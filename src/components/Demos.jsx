import { lazy, Suspense, useState } from "react";
import ragIndex from "../data/rag-meta.json";
import { SectionEyebrow } from "./About";
import { Reveal, useTilt } from "./Motion";

// ~1.6 MB of ONNX Runtime and MediaPipe sit behind this boundary. Nothing here
// is fetched until someone presses "Load the demo".
const EmotionDemo = lazy(() => import("./demos/emotion/EmotionDemo"));

/**
 * Live demos.
 *
 * Only real, running things belong in this section. The retrieval assistant is
 * the one that ships today; the on-device expression classifier is still being
 * built and is deliberately absent rather than represented by a placeholder
 * card that implies more than exists.
 */
export default function Demos() {
  return (
    <section id="demos" className="relative border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="07" label="Live demos" />

      <Reveal className="mt-8 max-w-2xl">
        <p className="text-xl leading-snug text-ink sm:text-2xl">
          Running systems, not screenshots.{" "}
          <span className="text-muted">
            Open them and watch what they actually do.
          </span>
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <RagCard />
        <EmotionCard />
      </div>
    </section>
  );
}

function EmotionCard() {
  const [mounted, setMounted] = useState(false);
  const { ref, tiltProps } = useTilt({ max: 5, scale: 1.006 });

  if (mounted) {
    return (
      <div className="lg:col-span-2">
        <Suspense
          fallback={
            <div className="glass flex h-64 items-center justify-center rounded-2xl">
              <span className="font-mono text-[11px] text-muted">loading demo…</span>
            </div>
          }
        >
          <EmotionDemo />
        </Suspense>
      </div>
    );
  }

  return (
    <Reveal delay={0.06}>
      <article ref={ref} {...tiltProps} className="glass h-full rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
            On-device computer vision
          </span>
          <span className="font-mono text-[10px] text-faint">no backend</span>
        </div>

        <h3 className="mt-4 font-display text-2xl font-bold text-ink">
          Facial expression, live
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The expression classifier from Solace, running in your browser. MediaPipe finds your
          face, the crop is normalised exactly as it was in training, and EfficientNet-B0 runs
          in ONNX Runtime inside a Web Worker — every 3rd frame, smoothed over 5. You get the
          full distribution across all 8 classes, not just the winning label.
        </p>

        <p className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-muted">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
          No camera required — run it on a bundled face. Nothing is uploaded, stored, or tracked.
        </p>

        <button
          data-demo-launch
          onClick={() => setMounted(true)}
          className="focus-ring group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-void"
          style={{ background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))" }}
        >
          Load the demo
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </article>
    </Reveal>
  );
}

function RagCard() {
  const { ref, tiltProps } = useTilt({ max: 5, scale: 1.006 });

  const openChat = () => {
    document.querySelector('button[aria-haspopup="dialog"][class*="fixed"]')?.click();
  };

  return (
    <Reveal>
      <article ref={ref} {...tiltProps} className="glass h-full rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
            Retrieval-augmented Q&amp;A
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            live
          </span>
        </div>

        <h3 className="mt-4 font-display text-2xl font-bold text-ink">Ask about my work</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A hybrid retriever over my CV, every project README, and this site&apos;s content.
          It embeds your question, scores it against the index, and answers only from what
          it retrieved — showing you which documents it used. Below a relevance threshold it
          refuses outright instead of improvising, the same conviction gate that decides what
          reaches the user in FX AlphaLab.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
          <Stat value={ragIndex.chunks} label="indexed chunks" />
          <Stat value={ragIndex.dim} label="vector dimensions" />
          <Stat value={ragIndex.sources} label="source documents" />
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={openChat}
            className="focus-ring group inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-void"
            style={{ background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))" }}
          >
            Open the assistant
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <span className="font-mono text-[10px] text-faint">
            {ragIndex.model.split("/").pop()} · cosine + BM25
          </span>
        </div>
      </article>
    </Reveal>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-void px-3 py-3">
      <dt className="font-mono text-lg leading-none text-gradient tabular-nums">{value}</dt>
      <dd className="mt-1.5 text-[10px] leading-tight text-faint">{label}</dd>
    </div>
  );
}
