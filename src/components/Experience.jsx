import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { experience } from "../data/content";
import { SectionEyebrow } from "./About";
import { Reveal, Stagger, StaggerItem } from "./Motion";

export default function Experience() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // The spine fills as the section scrolls past, so the timeline reads as a
  // progress instrument rather than a static rule.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section id="experience" className="relative border-t border-line px-6 lg:px-16 py-20 sm:py-24">
      <SectionEyebrow index="03" label="Experience" />

      <Reveal className="mt-8 max-w-xl">
        <p className="text-xl leading-snug text-ink sm:text-2xl">
          Two internships at Wevioo.{" "}
          <span className="text-muted">Freelance delivery in between.</span>
        </p>
      </Reveal>

      <div ref={ref} className="relative mt-12 max-w-3xl pl-8">
        {/* track + fill */}
        <div className="absolute left-0 top-1.5 bottom-0 w-px bg-line" aria-hidden="true" />
        <motion.div
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-0 w-px origin-top"
          style={{
            scaleY: reduce ? 1 : scaleY,
            background: "linear-gradient(180deg, var(--c-signal), var(--c-signal-2))",
          }}
        />

        {experience.map((job, i) => (
          <Reveal key={job.role + job.org} delay={i * 0.06} className="relative pb-12 last:pb-0">
            <span
              className="absolute -left-8 top-1.5 h-2.5 w-2.5 rounded-full bg-signal"
              style={{ boxShadow: "0 0 12px var(--c-signal)" }}
              aria-hidden="true"
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-xl font-semibold text-ink">
                {job.role} <span className="font-normal text-muted">— {job.org}</span>
              </h3>
              <span className="shrink-0 font-mono text-[11px] text-signal">{job.period}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-faint">{job.place}</p>

            <Stagger className="mt-3 space-y-2" stagger={0.07}>
              {job.points.map((p, idx) => (
                <StaggerItem
                  key={idx}
                  as="p"
                  className="flex gap-2.5 text-sm leading-relaxed text-muted"
                >
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                    aria-hidden="true"
                  />
                  <span>{p}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
