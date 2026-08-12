import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from "framer-motion";
import { profile } from "../data/content";
import { EASE, Magnetic, RevealText } from "./Motion";

export default function Hero({ booted = true }) {
  // The boot sequence now lives in BootScreen, which covers the page on first
  // load. The hero just waits for it to finish before revealing itself.
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yRaw = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y = useSpring(yRaw, { stiffness: 120, damping: 30, mass: 0.4 });
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => setDone(true), reduce ? 0 : 120);
    return () => clearTimeout(t);
  }, [booted, reduce]);

  const show = (delay) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: done ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.75, delay: reduce ? 0 : delay, ease: EASE },
  });

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-28 pb-20 lg:px-16 lg:pt-0"
    >
      <motion.div style={reduce ? undefined : { y, opacity }} className="w-full">
        <div className="grid items-center gap-14 lg:grid-cols-[1.35fr_1fr]">
          <div className="max-w-3xl">
            <motion.p
              {...show(0)}
              className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-signal sm:text-xs"
            >
              {profile.role} &middot; {profile.subrole}
            </motion.p>

            <h1 className="font-display text-[13vw] font-bold leading-[0.94] tracking-tight text-ink sm:text-6xl lg:text-[5.5rem]">
              <RevealText text="Wala Eddine" className="block" />
              <RevealText text="Ghazouani" className="block text-gradient" delay={0.08} />
            </h1>

            <motion.p
              {...show(0.18)}
              className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            >
              {profile.summary}
            </motion.p>

            <motion.div {...show(0.26)} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href="#projects"
                  className="focus-ring group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-void"
                  style={{
                    background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))",
                  }}
                >
                  <span className="relative z-10">View systems shipped</span>
                  <span className="relative z-10 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={`mailto:${profile.email}`}
                  className="focus-ring inline-flex rounded-full border border-line px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-signal hover:text-signal"
                >
                  Get in touch
                </a>
              </Magnetic>
            </motion.div>
          </div>

          {/* Live telemetry panel — the stats, presented as an instrument readout
              rather than a row of tiles. */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 26 }}
            animate={done ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, delay: reduce ? 0 : 0.34, ease: EASE }}
            className="glass w-full rounded-2xl p-6 sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                Track record
              </p>
              <span className="font-mono text-[10px] text-signal">live</span>
            </div>
            <dl className="mt-1 divide-y divide-[var(--c-line)]">
              {profile.stats.map((s, i) => (
                <StatRow key={s.label} stat={s} index={i} ready={done} />
              ))}
            </dl>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        {...show(0.5)}
        className="pointer-events-none absolute bottom-7 left-6 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-faint lg:left-16 lg:flex"
        aria-hidden="true"
      >
        <span className="h-8 w-px bg-gradient-to-b from-transparent to-[var(--c-signal)]" />
        Scroll
      </motion.div>
    </section>
  );
}

/** Counts up to the numeric part of a stat once the hero has settled. */
function StatRow({ stat, index, ready }) {
  const reduce = useReducedMotion();
  const target = Number.parseFloat(stat.value);
  const numeric = Number.isFinite(target);
  const [n, setN] = useState(numeric && !reduce ? 0 : target);

  useEffect(() => {
    if (!ready || !numeric || reduce) return;
    const duration = 900;
    const start = performance.now() + index * 90;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      // Same curve as EASE, evaluated directly.
      setN(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, numeric, target, index, reduce]);

  const display = numeric ? String(Math.round(n)) : stat.value;

  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-[12px] leading-snug text-muted">{stat.label}</dt>
      <dd className="font-mono text-2xl leading-none text-gradient tabular-nums">{display}</dd>
    </div>
  );
}
