/// <reference lib="webworker" />
/**
 * Expression-classification worker.
 *
 * Runs off the main thread so preprocessing and inference never stall the
 * camera preview or the UI. Receives raw RGBA crops, returns a full softmax
 * distribution plus the measured inference latency.
 *
 * ORT is configured single-threaded with SIMD on purpose. Multi-threaded WASM
 * needs SharedArrayBuffer, which needs COOP/COEP headers, which would make the
 * cross-origin Google Fonts <link> in index.html fail — trading a working page
 * for a marginal speed-up.
 *
 * Messages in:  {type:'init'} | {type:'infer', id, rgba, width, height}
 * Messages out: {type:'ready', backend, mock} | {type:'result', ...} | {type:'error', message}
 */

import { CLASS_LABELS, MODEL_URL, PREPROCESS } from "./constants";

let session = null;
let ort = null;
let inputName = null;
/** True when no model file was found and predictions are synthetic. */
let usingMock = false;

/* ----------------------------------------------------------- preprocessing */

/**
 * RGBA bytes → normalised NCHW Float32Array.
 * The caller has already cropped and scaled to INPUT_SIZE; this only converts
 * layout and applies normalisation, so the two halves stay independently
 * checkable against PREPROCESS.
 */
function toTensorData(rgba, size) {
  const { MEAN, STD } = PREPROCESS;
  const plane = size * size;
  const out = new Float32Array(3 * plane);

  for (let i = 0; i < plane; i++) {
    const p = i * 4;
    // RGB channel order, planar (NCHW): all R, then all G, then all B.
    out[i] = (rgba[p] / 255 - MEAN[0]) / STD[0];
    out[plane + i] = (rgba[p + 1] / 255 - MEAN[1]) / STD[1];
    out[2 * plane + i] = (rgba[p + 2] / 255 - MEAN[2]) / STD[2];
  }
  return out;
}

function softmax(logits) {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  let sum = 0;
  const out = new Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    out[i] = Math.exp(logits[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

/* ------------------------------------------------------ THE SWAP POINT ---- *
 * Everything above this line is the real pipeline and runs unchanged against a
 * real model. Below is the stand-in used when public/models/enet_b0_8_best_afew.onnx
 * is absent.
 *
 * To ship the real thing: drop the exported INT8 model at that path. `init()`
 * finds it, `usingMock` stays false, and mockLogits() is never called. Nothing
 * else changes — no flags, no rebuild of this file.
 *
 * The mock is deliberately loud rather than plausible: the UI refuses to
 * present it as a measurement, and it derives its numbers from image
 * statistics so it visibly reacts to the frame without pretending to
 * recognise an emotion.
 * -------------------------------------------------------------------------- */
function mockLogits(rgba, size) {
  // Cheap frame statistics: mean luma and the horizontal brightness gradient.
  let luma = 0;
  let left = 0;
  let right = 0;
  const plane = size * size;
  const half = size / 2;

  for (let i = 0; i < plane; i += 7) {
    const p = i * 4;
    const y = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    luma += y;
    if (i % size < half) left += y;
    else right += y;
  }
  const n = Math.ceil(plane / 7);
  const meanLuma = luma / n / 255;
  const tilt = (left - right) / (luma || 1);

  const seed = [0.2, -0.4, -0.3, -0.1, 0.9, 1.2, 0.1, 0.3];
  return seed.map(
    (base, i) => base + Math.sin(meanLuma * 6 + i * 1.7) * 0.6 + tilt * Math.cos(i) * 2,
  );
}

/* ------------------------------------------------------------------- init */

async function init() {
  ort = await import("onnxruntime-web/wasm");

  // Single-threaded + SIMD. See the header comment for why threads are off.
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;

  let available = false;
  try {
    const head = await fetch(MODEL_URL, { method: "HEAD" });
    available =
      head.ok && !(head.headers.get("content-type") || "").includes("text/html");
  } catch {
    available = false;
  }

  if (!available) {
    usingMock = true;
    postMessage({ type: "ready", backend: "mock", mock: true });
    return;
  }

  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  inputName = session.inputNames[0];
  postMessage({
    type: "ready",
    backend: "wasm",
    mock: false,
    io: { input: inputName, output: session.outputNames[0] },
  });
}

/* ---------------------------------------------------------------- inference */

async function infer({ id, rgba, width }) {
  const size = width;
  const started = performance.now();
  let probabilities;

  if (usingMock) {
    probabilities = softmax(mockLogits(rgba, size));
    // Keep the frame budget honest — a mock that returns in 0 ms would make the
    // latency readout meaningless.
    await new Promise((r) => setTimeout(r, 8));
  } else {
    const data = toTensorData(rgba, size);
    const tensor = new ort.Tensor("float32", data, [1, 3, size, size]);
    const output = await session.run({ [inputName]: tensor });
    const logits = Array.from(output[session.outputNames[0]].data);

    // Fail loudly on a shape mismatch. Quietly slicing to 8 would relabel every
    // output and still look plausible on screen — the exact failure this demo
    // is supposed to demonstrate not having.
    if (logits.length !== CLASS_LABELS.length) {
      throw new Error(
        `model returned ${logits.length} values, expected ${CLASS_LABELS.length} ` +
          `(${CLASS_LABELS.join(", ")}). Check that the export ends at the classifier ` +
          `rather than the feature layer.`,
      );
    }
    probabilities = softmax(logits);
  }

  postMessage({
    type: "result",
    id,
    probabilities,
    latencyMs: Math.round(performance.now() - started),
    mock: usingMock,
  });
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === "init") await init();
    else if (msg.type === "infer") await infer(msg);
  } catch (error) {
    postMessage({ type: "error", message: error?.message || String(error) });
  }
};
