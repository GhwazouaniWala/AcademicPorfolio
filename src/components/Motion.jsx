import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/** The single easing curve for the whole site. Do not introduce a second one. */
export const EASE = [0.16, 1, 0.3, 1];

/** Fade-and-rise on scroll into view. Collapses to a plain fade when the user
 *  has asked for reduced motion. */
export function Reveal({ children, delay = 0, y = 24, className, as = "div", ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  return (
    <Tag
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0.2 : 0.7, delay: reduce ? 0 : delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Parent for a staggered group. Pair with StaggerItem children. */
export function Stagger({ children, className, stagger = 0.06, delay = 0, as = "div", ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delay,
          },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, y = 18, as = "div", ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  return (
    <Tag
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : y },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.6, ease: EASE } },
      }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Per-word reveal for headings. Words are the right unit — per-character reads
 * as a gimmick at this size and wrecks the line rhythm mid-animation.
 * Screen readers get the whole string from aria-label; the spans are hidden.
 */
export function RevealText({ text, className, as = "span", delay = 0, stagger = 0.045 }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.span;
  const words = String(text).split(" ");

  if (reduce) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", opacity: 0 },
              show: { y: "0%", opacity: 1, transition: { duration: 0.75, ease: EASE } },
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Pointer-tracked tilt for glass panels. Returns a ref plus the handlers to
 * spread onto the element; the transform is written straight to style so it
 * never triggers layout. Also exposes --mx/--my in element-local percentages
 * so a child can render a cursor-following sheen.
 *
 * Disabled entirely under reduced motion and on coarse pointers, where a tilt
 * is either unwanted or unreachable.
 */
export function useTilt({ max = 7, scale = 1.015, glare = true } = {}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const active = fine && !reduce;

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.removeProperty("--glare");
  };

  const onPointerMove = (e) => {
    const el = ref.current;
    if (!active || !el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform =
      `perspective(1000px) rotateX(${(-(py - 0.5) * max).toFixed(2)}deg) ` +
      `rotateY(${((px - 0.5) * max).toFixed(2)}deg) scale(${scale})`;
    if (glare) {
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--glare", "1");
    }
  };

  return {
    ref,
    active,
    tiltProps: {
      onPointerMove,
      onPointerLeave: reset,
      onBlur: reset,
      style: active ? { transition: "transform 260ms cubic-bezier(0.16,1,0.3,1)" } : undefined,
    },
  };
}

/**
 * Buttons that lean toward the cursor. Small displacement on purpose — enough
 * to feel responsive, not enough to make the target hard to hit.
 */
export function Magnetic({ children, strength = 0.28, className, ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.5 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={reduce ? undefined : { x: sx, y: sy }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-linked vertical drift. Positive `distance` moves slower than scroll. */
export function Parallax({ children, distance = 60, className, ...rest }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const smooth = useSpring(y, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <motion.div ref={ref} style={reduce ? undefined : { y: smooth }} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Thin reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[65] h-[2px] origin-left"
      style={{
        scaleX: reduce ? scrollYProgress : scaleX,
        background: "linear-gradient(90deg, var(--c-signal), var(--c-signal-2))",
      }}
    />
  );
}
