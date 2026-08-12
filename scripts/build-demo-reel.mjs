/**
 * build-demo-reel.mjs — assembles the expression demo's sample video.
 *
 * The demo needs a moving face so the temporal half of the pipeline is visible:
 * inference every 3rd frame, distributions smoothed over 5. Three still images
 * could not show that — the bars just snapped between three fixed answers.
 *
 * The reel is built from StyleGAN faces (thispersondoesnotexist.com), so nobody
 * in it is a real person and no likeness or consent question arises. The frames
 * were chosen from a batch of twelve by actually running the classifier over
 * each one and keeping a spread — confident reads alternating with ambiguous
 * ones — so the chart visibly moves rather than sitting at Happiness 100%.
 *
 * Requires ffmpeg on PATH. Output is committed, so this only needs re-running
 * when the frames change.
 *
 * Run: npm run build:reel
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "data", "reel-frames");
const OUT = path.join(ROOT, "public", "models", "samples", "reel.mp4");

/** Measured top-1 prediction per frame — the reason each one is in the reel. */
const FRAMES = [
  { file: "reel-1.jpg", note: "Happiness 100% — confident" },
  { file: "reel-2.jpg", note: "Neutral 21% — very uncertain" },
  { file: "reel-3.jpg", note: "Happiness 98%" },
  { file: "reel-4.jpg", note: "Neutral 25% — wide distribution" },
  { file: "reel-5.jpg", note: "Happiness 100%" },
  { file: "reel-6.jpg", note: "Neutral 50%" },
];

const SIZE = 640;
const HOLD = 1.7; // seconds a face is fully visible
const FADE = 0.6; // cross-fade duration

async function main() {
  for (const f of FRAMES) {
    await stat(path.join(SRC, f.file)).catch(() => {
      throw new Error(`missing frame ${f.file}`);
    });
  }

  const args = [];
  for (const f of FRAMES) args.push("-loop", "1", "-t", String(HOLD), "-i", path.join(SRC, f.file));

  // Normalise every input first: identical size, pixel format and frame rate,
  // or xfade refuses to chain them.
  const filters = FRAMES.map(
    (_, i) => `[${i}:v]scale=${SIZE}:${SIZE},setsar=1,fps=25,format=yuv420p[v${i}]`,
  );

  // Chain the cross-fades. Each offset is where the *next* fade begins on the
  // timeline built so far, which shortens by FADE on every join.
  let prev = "v0";
  let offset = HOLD - FADE;
  FRAMES.slice(1).forEach((_, idx) => {
    const next = `v${idx + 1}`;
    const out = idx === FRAMES.length - 2 ? "out" : `x${idx}`;
    filters.push(
      `[${prev}][${next}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`,
    );
    prev = out;
    offset += HOLD - FADE;
  });

  await run(
    "ffmpeg",
    [
      "-y",
      ...args,
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[out]",
      "-c:v",
      "libx264",
      "-profile:v",
      "main",
      "-crf",
      "26",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      OUT,
    ],
    { maxBuffer: 1 << 26 },
  );

  const { size } = await stat(OUT);
  const seconds = HOLD + (FRAMES.length - 1) * (HOLD - FADE);
  console.log(
    `> build-demo-reel: ${FRAMES.length} frames → reel.mp4 ` +
      `(${seconds.toFixed(1)}s, ${(size / 1024).toFixed(0)} KB)`,
  );
}

main().catch((e) => {
  console.error(`! build-demo-reel failed: ${e.message}`);
  process.exitCode = 1;
});
