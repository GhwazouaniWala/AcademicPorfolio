/**
 * MediaPipe Tasks Vision FaceDetector, loaded on demand.
 *
 * The classifier is never handed a full frame: it only ever sees the crop this
 * detector produces, expanded by PREPROCESS.CROP_MARGIN. Feeding whole frames
 * would put background, shoulders, and other faces into a model trained on
 * tight face crops.
 *
 * The WASM binaries and the .task graph are fetched from the MediaPipe CDN when
 * the visitor presses start, so nothing is downloaded on page load.
 */

import { PREPROCESS } from "./constants";

/**
 * Both assets are served from our own origin rather than a CDN.
 *
 * jsdelivr returns `vision_wasm_internal.js` as `text/plain`, which the browser
 * refuses to execute under strict MIME checking — the detector never loads. And
 * self-hosting is what makes the "works with your network off" claim true: after
 * the first load, nothing here touches a third-party server.
 */
const WASM_DIR = "/mediapipe/wasm";
const MODEL = "/mediapipe/blaze_face_short_range.tflite";

let detector = null;

export async function loadFaceDetector() {
  if (detector) return detector;

  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_DIR);

  detector = await vision.FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });
  return detector;
}

export async function setRunningMode(mode) {
  if (detector) await detector.setOptions({ runningMode: mode });
}

export function disposeFaceDetector() {
  detector?.close?.();
  detector = null;
}

/**
 * Highest-confidence face box in a frame, in source pixels.
 * @returns {{x:number,y:number,width:number,height:number,score:number}|null}
 */
export function detect(source, timestampMs, isVideo = true) {
  if (!detector) return null;
  const result = isVideo
    ? detector.detectForVideo(source, timestampMs)
    : detector.detect(source);

  const best = (result?.detections || []).reduce(
    (a, d) => (!a || (d.categories?.[0]?.score ?? 0) > (a.categories?.[0]?.score ?? 0) ? d : a),
    null,
  );
  if (!best?.boundingBox) return null;

  const { originX, originY, width, height } = best.boundingBox;
  return {
    x: originX,
    y: originY,
    width,
    height,
    score: best.categories?.[0]?.score ?? 0,
  };
}

/**
 * Expand a face box by the training margin and square it off, clamped to the
 * frame. Squaring before the resize matters: scaling a non-square crop to
 * 224×224 stretches the face and shifts every feature the model keys on.
 */
export function expandToSquare(box, frameWidth, frameHeight) {
  const margin = PREPROCESS.CROP_MARGIN;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const side = Math.max(box.width, box.height) * (1 + margin * 2);

  let x = Math.round(cx - side / 2);
  let y = Math.round(cy - side / 2);
  let s = Math.round(side);

  // Clamp inside the frame without changing the aspect ratio.
  s = Math.min(s, frameWidth, frameHeight);
  x = Math.max(0, Math.min(x, frameWidth - s));
  y = Math.max(0, Math.min(y, frameHeight - s));

  return { x, y, width: s, height: s };
}
