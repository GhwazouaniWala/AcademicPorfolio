import { profile, education, languages } from "../data/content";
import { Reveal, RevealText, useTilt } from "./Motion";

export default function About() {
  const { ref, tiltProps } = useTilt({ max: 5, scale: 1.006 });

  return (
    <section id="about" className="relative border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="01" label="About" />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div className="max-w-2xl space-y-5">
          <RevealText
            as="p"
            text="I build AI systems that show their work — retrieval you can inspect, confidence scores instead of guesses, agents that fall back gracefully instead of failing silently."
            className="block text-xl font-medium leading-snug text-ink sm:text-2xl"
          />
          <Reveal delay={0.1}>
            <p className="leading-relaxed text-muted">
              That habit started at Wevioo, where I shipped Solace end to end — two fine-tuned
              models, a real-time inference pipeline, and a RAG layer that has to cite a named
              clinical technique or say nothing at all. It carried into leading FX AlphaLab&apos;s
              macro agent, and into freelance work on Upwork building RAG systems and automation
              for clients who need to trust what the model outputs, not just read it.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="leading-relaxed text-muted">
              I&apos;m a final-year Data Science engineering student at ESPRIT, and I&apos;m looking
              for a 6-month final-year internship where I can keep working across the full stack of
              an AI system — fine-tuning, orchestration, and the monitoring that tells you when
              it&apos;s actually working in production.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <div ref={ref} {...tiltProps} className="glass h-fit rounded-2xl p-6 font-mono text-xs">
            <ReadoutRow label="Location" value={profile.location} />
            <ReadoutRow label="Relocation" value={profile.relocation} />

            <div className="my-4 h-px hairline" />
            <p className="mb-3 text-[10px] uppercase tracking-wider text-muted">Education</p>
            {education.map((e) => (
              <div key={e.degree} className="mb-3 last:mb-0">
                <p className="leading-snug text-ink">{e.degree}</p>
                <p className="mt-0.5 text-muted">{e.school}</p>
                <p className="mt-0.5 text-signal">{e.period}</p>
              </div>
            ))}

            <div className="my-4 h-px hairline" />
            <p className="mb-3 text-[10px] uppercase tracking-wider text-muted">Languages</p>
            <div className="space-y-1.5">
              {languages.map((l) => (
                <div key={l.name} className="flex justify-between">
                  <span className="text-ink">{l.name}</span>
                  <span className="text-muted">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ReadoutRow({ label, value }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-4 last:mb-0">
      <span className="shrink-0 pt-0.5 text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

export function SectionEyebrow({ index, label }) {
  return (
    <Reveal className="flex items-center gap-3" y={12}>
      <span className="font-mono text-xs text-gradient">{index}</span>
      <span className="h-px max-w-8 flex-1 bg-line" />
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">{label}</h2>
    </Reveal>
  );
}
