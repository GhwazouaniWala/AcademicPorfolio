import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CLASS_LABELS, PREPROCESS, RUNTIME, SAMPLE_VIDEO } from "./constants";
import {
  detect,
  disposeFaceDetector,
  expandToSquare,
  loadFaceDetector,
  setRunningMode,
} from "./faceDetector";
import { EASE } from "../../Motion";

/**
 * Live facial-expression classifier, running entirely in the browser.
 *
 * Pipeline per analysed frame: MediaPipe FaceDetector finds the face box →
 * the box is expanded by the training crop margin and squared → the crop is
 * scaled to 224×224 → a Web Worker normalises it and runs EfficientNet-B0 in
 * ONNX Runtime (WASM, single-threaded + SIMD) → the softmax distribution is
 * averaged over a rolling 5-frame window.
 *
 * Nothing is uploaded. Every frame stays in this tab.
 */

const IDLE = "idle";
const LOADING = "loading";
const RUNNING = "running";
const FAILED = "failed";

export default function EmotionDemo() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const cropRef = useRef(null); // offscreen 224×224 scratch canvas
  const workerRef = useRef(null);
  const rafRef = useRef(0);
  const streamRef = useRef(null);
  const frameNo = useRef(0);
  const pending = useRef(false);
  const history = useRef([]);
  const stillCanvasRef = useRef(null);

  const [phase, setPhase] = useState(IDLE);
  const [error, setError] = useState(null);
  const [mock, setMock] = useState(false);
  const [probs, setProbs] = useState(() => CLASS_LABELS.map(() => 0));
  const [latency, setLatency] = useState(null);
  const [faceFound, setFaceFound] = useState(false);
  const [fps, setFps] = useState(0);
  const [stillMode, setStillMode] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const reduce = useReducedMotion();

  /* ------------------------------------------------------------- teardown */

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
    disposeFaceDetector();
    pending.current = false;
    history.current = [];
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setPhase(IDLE);
    setFaceFound(false);
    setLatency(null);
    setFps(0);
    setStillMode(false);
    setSampleMode(false);
    setNeedsPlay(false);
    setProbs(CLASS_LABELS.map(() => 0));
  }, []);

  useEffect(() => stop, [stop]);

  /* ----------------------------------------------------- smoothing buffer */

  const pushDistribution = useCallback((distribution) => {
    const buf = history.current;
    buf.push(distribution);
    if (buf.length > RUNTIME.SMOOTHING_WINDOW) buf.shift();

    // Mean of the distributions, not a majority vote over labels: the chart
    // shows all eight classes, so every class needs a smoothed value.
    const mean = CLASS_LABELS.map((_, i) => buf.reduce((a, d) => a + d[i], 0) / buf.length);
    setProbs(mean);
  }, []);

  /* --------------------------------------------------------------- worker */

  const bootWorker = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./inference.worker.js", import.meta.url), {
          type: "module",
        });
        workerRef.current = worker;

        worker.onmessage = (e) => {
          const msg = e.data;
          if (msg.type === "ready") {
            setMock(msg.mock);
            resolve(msg);
          } else if (msg.type === "result") {
            pending.current = false;
            setLatency(msg.latencyMs);
            pushDistribution(msg.probabilities);
          } else if (msg.type === "error") {
            pending.current = false;
            setError(msg.message);
            setPhase(FAILED);
          }
        };
        worker.onerror = (e) => reject(new Error(e.message || "worker failed to start"));
        worker.postMessage({ type: "init" });
      }),
    [pushDistribution],
  );

  /* ------------------------------------------------------- the frame loop */

  const analyse = useCallback((source, sourceW, sourceH, isVideo) => {
    const overlay = overlayRef.current;
    const crop = cropRef.current;
    if (!overlay || !crop) return;

    const box = detect(source, performance.now(), isVideo);
    setFaceFound(!!box);

    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!box) return;

    const square = expandToSquare(box, sourceW, sourceH);

    // Draw the box the classifier is actually fed, not the raw detection.
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--c-signal")
      .trim();
    ctx.lineWidth = 2;
    ctx.strokeRect(square.x, square.y, square.width, square.height);

    if (pending.current) return;

    const cctx = crop.getContext("2d", { willReadFrequently: true });
    cctx.drawImage(
      source,
      square.x,
      square.y,
      square.width,
      square.height,
      0,
      0,
      PREPROCESS.INPUT_SIZE,
      PREPROCESS.INPUT_SIZE,
    );
    const { data } = cctx.getImageData(0, 0, PREPROCESS.INPUT_SIZE, PREPROCESS.INPUT_SIZE);

    pending.current = true;
    workerRef.current?.postMessage(
      { type: "infer", id: frameNo.current, rgba: data, width: PREPROCESS.INPUT_SIZE },
      [data.buffer],
    );
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    frameNo.current += 1;
    if (frameNo.current % RUNTIME.FRAME_STRIDE === 0) {
      analyse(video, video.videoWidth, video.videoHeight, true);
    }
    if (frameNo.current % 15 === 0) {
      const now = performance.now();
      if (loop.last) setFps(Math.round(15000 / (now - loop.last)));
      loop.last = now;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [analyse]);

  /* ------------------------------------------------------ sample clip mode */

  /**
   * Runs the identical loop against the bundled reel instead of a camera. The
   * only difference from the webcam path is where the frames come from — same
   * detector, same crop, same stride, same smoothing.
   */
  const startSample = useCallback(async () => {
    setError(null);
    setNeedsPlay(false);
    setPhase(LOADING);
    try {
      await Promise.all([bootWorker(), loadFaceDetector()]);
      await setRunningMode("VIDEO");

      const video = videoRef.current;
      video.srcObject = null;
      video.src = SAMPLE_VIDEO.src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      overlayRef.current.width = video.videoWidth || 640;
      overlayRef.current.height = video.videoHeight || 640;

      history.current = [];
      setSampleMode(true);
      setPhase(RUNNING);
      rafRef.current = requestAnimationFrame(loop);

      // A clip that silently refuses to advance would leave the chart at zero
      // with no explanation. Autoplay policies, a throttled background tab, or
      // a decode failure all look identical from here — so check that the
      // playhead actually moved, and offer a manual play if it did not.
      const startedAt = video.currentTime;
      setTimeout(() => {
        if (videoRef.current && videoRef.current.currentTime <= startedAt + 0.05) {
          setNeedsPlay(true);
        }
      }, 1500);
    } catch (e) {
      setError(
        e?.message?.includes("play")
          ? "The browser blocked autoplay. Press play on the clip, or use a photo instead."
          : e?.message || "Could not load the sample clip.",
      );
      setPhase(FAILED);
    }
  }, [bootWorker, loop]);

  /* ---------------------------------------------------------------- start */

  const start = useCallback(async () => {
    setError(null);
    setPhase(LOADING);

    try {
      if (!window.isSecureContext) {
        throw Object.assign(new Error("insecure"), { kind: "insecure" });
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("unsupported"), { kind: "unsupported" });
      }

      // Everything heavy loads here, on click — never at page load.
      await Promise.all([bootWorker(), loadFaceDetector()]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      overlayRef.current.width = w;
      overlayRef.current.height = h;

      setPhase(RUNNING);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const name = e?.name;
      const kind = e?.kind;
      setError(
        kind === "insecure"
          ? "The camera needs a secure connection (https). This page isn't on one."
          : kind === "unsupported"
            ? "This browser doesn't expose a camera API. Try Chrome, Edge, Firefox, or Safari."
            : name === "NotAllowedError"
              ? "Camera permission was refused. You can still run the same pipeline on an image."
              : name === "NotFoundError" || name === "OverconstrainedError"
                ? "No camera found on this device. You can still run the same pipeline on an image."
                : e?.message || "Could not start the camera.",
      );
      setPhase(FAILED);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
  }, [bootWorker, loop]);

  /* ------------------------------------------------ still-image fallback */

  const runOnSource = useCallback(
    async (source) => {
      if (!source) return;
      setError(null);
      setPhase(LOADING);
      try {
        if (!workerRef.current) await bootWorker();
        await loadFaceDetector();
        await setRunningMode("IMAGE");

        const bitmap = await createImageBitmap(source);
        overlayRef.current.width = bitmap.width;
        overlayRef.current.height = bitmap.height;

        // Paint the still into the preview area in place of the video.
        const preview = videoRef.current;
        preview.srcObject = null;

        const still = document.createElement("canvas");
        still.width = bitmap.width;
        still.height = bitmap.height;
        still.getContext("2d").drawImage(bitmap, 0, 0);
        setSampleMode(false);
        setStillMode(true);
        setPhase(RUNNING);

        // One pass, then hold the result.
        history.current = [];
        analyse(still, bitmap.width, bitmap.height, false);
        stillCanvasRef.current = still;
        bitmap.close?.();
      } catch (e) {
        setError(e?.message || "Could not read that image.");
        setPhase(FAILED);
      }
    },
    [analyse, bootWorker],
  );

  // Paint the still frame under the overlay whenever it changes.
  useEffect(() => {
    if (!stillMode || !stillCanvasRef.current) return;
    const holder = document.getElementById("emotion-still-holder");
    if (!holder) return;
    holder.innerHTML = "";
    const c = stillCanvasRef.current;
    c.className = "absolute inset-0 h-full w-full object-cover";
    holder.appendChild(c);
  }, [stillMode, probs]);

  const top = probs.reduce(
    (best, p, i) => (p > best.p ? { p, i } : best),
    { p: -1, i: 0 },
  );

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {/* Privacy guarantee — stated before anything is switched on. */}
      <div className="flex items-center gap-2.5 border-b border-line bg-[color-mix(in_srgb,var(--c-signal)_8%,transparent)] px-5 py-3">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="shrink-0 text-signal"
          aria-hidden="true"
        >
          <path d="M8 1.6 2.8 3.9v3.5c0 3.2 2.2 6.1 5.2 7 3-0.9 5.2-3.8 5.2-7V3.9L8 1.6Z" />
          <path d="M5.9 8.1 7.4 9.6l2.9-3" />
        </svg>
        <p className="text-[12px] leading-snug text-ink">
          <strong className="font-semibold">Nothing is uploaded, stored, or tracked.</strong>{" "}
          <span className="text-muted">
            The model runs inside this tab, in a Web Worker. No image or video ever reaches a
            server, nothing is written to disk or to storage, there is no analytics call and no
            record of this session. Turn your network off and it still works. Close the tab and
            every trace is gone.
          </span>
        </p>
      </div>

      {mock && phase === RUNNING && (
        <p className="border-b border-attention/40 bg-attention/10 px-5 py-2.5 font-mono text-[11px] text-attention">
          SIMULATED — no model file present. Face detection is real; the class scores are
          synthetic and mean nothing.
        </p>
      )}

      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        {/* Preview */}
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line bg-void lg:border-b-0 lg:border-r">
          <div id="emotion-still-holder" className="absolute inset-0" />
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${sampleMode ? "" : "-scale-x-100"} ${
              phase === RUNNING && !stillMode ? "" : "opacity-0"
            }`}
          />
          <canvas
            ref={overlayRef}
            className={`absolute inset-0 h-full w-full object-cover ${
              stillMode ? "" : "-scale-x-100"
            } ${phase === RUNNING ? "" : "opacity-0"}`}
          />
          <canvas
            ref={cropRef}
            width={PREPROCESS.INPUT_SIZE}
            height={PREPROCESS.INPUT_SIZE}
            className="hidden"
          />

          {phase !== RUNNING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              {phase === LOADING ? (
                <p className="font-mono text-[11px] text-muted">
                  loading detector &amp; model…
                </p>
              ) : (
                <>
                  {error && (
                    <p className="max-w-xs text-[13px] leading-relaxed text-attention">{error}</p>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={startSample}
                      className="focus-ring group inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-void"
                      style={{
                        background: "linear-gradient(100deg, var(--c-signal), var(--c-signal-2))",
                      }}
                    >
                      Run the sample clip
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </button>
                    <p className="font-mono text-[9px] text-faint">
                      {SAMPLE_VIDEO.seconds}s · AI-generated faces · no real people · no camera
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <FileFallback onFile={runOnSource} />
                    <button
                      onClick={start}
                      className="focus-ring rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-signal hover:text-signal"
                    >
                      {error ? "Retry camera" : "Or use my camera"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {phase === RUNNING && needsPlay && (
            <button
              onClick={() => {
                videoRef.current?.play().then(() => setNeedsPlay(false)).catch(() => {});
              }}
              className="focus-ring absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-void/70 backdrop-blur-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-signal text-signal">
                ▶
              </span>
              <span className="max-w-[15rem] text-center font-mono text-[10px] uppercase tracking-wider text-muted">
                the browser paused the clip — press play
              </span>
            </button>
          )}

          {phase === RUNNING && (
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded bg-void/70 px-2 py-1 font-mono text-[9px] uppercase tracking-wider backdrop-blur">
              <span
                className={`h-1.5 w-1.5 rounded-full ${faceFound ? "bg-signal" : "bg-attention"}`}
              />
              {faceFound ? "face locked" : "no face"}
            </div>
          )}
        </div>

        {/* Readout */}
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              softmax · all {CLASS_LABELS.length} classes
            </p>
            <p className="font-mono text-[10px] text-faint tabular-nums">
              {latency !== null ? `${latency} ms` : "— ms"}
              {fps > 0 && <span className="ml-2">{fps} fps</span>}
            </p>
          </div>

          <ul className="mt-4 space-y-2">
            {CLASS_LABELS.map((label, i) => {
              const value = probs[i] || 0;
              const isTop = i === top.i && top.p > 0;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`w-[68px] shrink-0 font-mono text-[10px] ${
                      isTop ? "text-signal" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: isTop
                          ? "linear-gradient(90deg, var(--c-signal), var(--c-signal-2))"
                          : "var(--c-faint)",
                      }}
                      animate={{ width: `${Math.round(value * 100)}%` }}
                      transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
                    />
                  </span>
                  <span className="w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-faint">
                    {(value * 100).toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <Cell label="every" value={`${RUNTIME.FRAME_STRIDE}rd frame`} />
            <Cell label="smoothing" value={`${RUNTIME.SMOOTHING_WINDOW} frames`} />
            <Cell label="input" value={`${PREPROCESS.INPUT_SIZE}²`} />
          </dl>

          {phase === RUNNING && (
            <button
              onClick={stop}
              className="focus-ring mt-5 w-full rounded-full border border-line py-2 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-attention hover:text-attention"
            >
              {stillMode ? "Reset" : "Stop & release camera"}
            </button>
          )}

          {/* Attribution. The weights are Savchenko's, not Wala's — the work
              shown here is the integration and the browser pipeline. The models
              he did train are linked so the distinction is visible, not buried. */}
          <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-faint">
            Weights:{" "}
            <a
              href="https://github.com/av-savchenko/face-emotion-recognition"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-muted underline decoration-dotted underline-offset-2 hover:text-signal"
            >
              enet_b0_8_best_afew
            </a>{" "}
            by A. Savchenko (Apache-2.0) — the same checkpoint Solace runs in production. Wala
            built the integration: the crop pipeline, the ONNX browser runtime, and the
            smoothing. His own fine-tuned models are on{" "}
            <a
              href="https://huggingface.co/Ghazouaniwala"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-muted underline decoration-dotted underline-offset-2 hover:text-signal"
            >
              Hugging Face
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

/** No camera, or permission refused — run the identical pipeline on a still. */
function FileFallback({ onFile }) {
  const id = "emotion-still-input";
  return (
    <label
      htmlFor={id}
      className="focus-within:outline-signal cursor-pointer font-mono text-[10px] uppercase tracking-wider text-muted underline decoration-dotted underline-offset-4 hover:text-signal"
    >
      or run it on a photo instead
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </label>
  );
}

function Cell({ label, value }) {
  return (
    <div className="bg-void px-2.5 py-2.5">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-1 font-mono text-[11px] text-ink">{value}</dd>
    </div>
  );
}
