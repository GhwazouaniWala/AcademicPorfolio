import { useReducedMotion } from "framer-motion";

/**
 * Page backdrop: three slowly drifting colour fields behind a masked
 * instrument grid, plus the film grain. All CSS — no canvas, no WebGL, no
 * per-frame JavaScript — so it costs nothing on the main thread and the
 * compositor handles the drift.
 *
 * Under prefers-reduced-motion the fields render in place without animating,
 * which keeps the depth without the movement.
 */
export default function Backdrop() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true">
      <div className="aurora" data-static={reduce ? "true" : undefined}>
        <span />
        <span />
        <span />
      </div>
      <div className="instrument-grid" />
      <div className="grain" />
    </div>
  );
}
