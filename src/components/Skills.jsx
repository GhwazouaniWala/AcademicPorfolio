import { skills } from "../data/content";
import { SectionEyebrow } from "./About";
import { Reveal, Stagger, StaggerItem, useTilt } from "./Motion";

export default function Skills() {
  return (
    <section id="skills" className="relative band band-edge border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="02" label="Skills" />

      <Reveal className="mt-8 max-w-xl">
        <p className="text-xl leading-snug text-ink sm:text-2xl">
          The full stack of an AI system.{" "}
          <span className="text-muted">Fine-tuning through to the monitoring around it.</span>
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {skills.map((group, i) => (
          <SkillPanel key={group.group} group={group} index={i} />
        ))}
      </div>
    </section>
  );
}

function SkillPanel({ group, index }) {
  const { ref, tiltProps } = useTilt({ max: 5, scale: 1.008 });

  return (
    <Reveal delay={index * 0.08}>
      <div
        ref={ref}
        {...tiltProps}
        className="group glass relative h-full overflow-hidden rounded-2xl p-6"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--c-signal) 10%, transparent), transparent 60%)",
          }}
        />

        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
            {group.group}
          </p>
          <span className="font-mono text-[10px] tabular-nums text-faint">
            {String(group.items.length).padStart(2, "0")}
          </span>
        </div>

        <div className="my-4 h-px w-full hairline" />

        <Stagger className="flex flex-wrap gap-2" stagger={0.02}>
          {group.items.map((item) => (
            <StaggerItem
              key={item}
              as="span"
              y={8}
              className="rounded-md border border-line px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-signal/50 hover:text-ink"
            >
              {item}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Reveal>
  );
}
