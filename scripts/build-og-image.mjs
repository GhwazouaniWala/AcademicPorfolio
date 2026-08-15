/**
 * build-og-image.mjs - renders the social preview card (public/og.png).
 *
 * Link previews on LinkedIn, Slack, WhatsApp and X are the first thing a
 * recruiter sees, and they are fetched by crawlers that do not run JavaScript.
 * A React SPA gives them nothing, so the card has to be a real static image
 * committed to public/.
 *
 * Rendered with ffmpeg rather than a headless browser: the repo already depends
 * on ffmpeg for the demo reel, and adding puppeteer to draw one 1200x630 image
 * would be a ~300 MB dependency for a build step that runs by hand.
 *
 * The copy is read from src/data/content.js so the card cannot drift from the
 * site the way hand-typed numbers do.
 *
 * Fonts are copied into the temp directory and referenced by bare filename on
 * purpose. ffmpeg filtergraphs treat ":" as an argument separator, so a Windows
 * path like C:/Windows/Fonts needs escaping inside the graph; sidestepping that
 * removes a whole class of quoting bug. Text is passed via textfile= for the
 * same reason - no escaping of apostrophes, commas or middle dots.
 *
 * Run: npm run build:og
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, copyFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { profile } from "../src/data/content.js";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "og.png");

const W = 1200;
const H = 630;
const MARGIN = 90;

/* The site's dark palette, from src/index.css. */
const VOID = "0x0e131a";
const INK = "0xeaeff5";
const SIGNAL = "0x4fd6c1";
const FAINT = "0x8894a0";
const LINE = "0x2b3745";

const FONTS = {
  bold: "C:/Windows/Fonts/segoeuib.ttf",
  regular: "C:/Windows/Fonts/segoeui.ttf",
  mono: "C:/Windows/Fonts/consola.ttf",
};

async function main() {
  const dir = await mkdtemp(path.join(tmpdir(), "og-"));
  try {
    for (const [name, file] of Object.entries(FONTS)) {
      await copyFile(file, path.join(dir, `${name}.ttf`));
    }

    // The stat strip mirrors the hero. Consola is monospace, so its width is
    // predictable: pack the stats into as many lines as they need rather than
    // trusting one line to fit. The first version of this card silently ran the
    // fourth stat off the right edge, and a social card is not something you
    // look at again after shipping it.
    const MONO_SIZE = 21;
    const MONO_ADVANCE = MONO_SIZE * 0.6;
    const MAX_CHARS = Math.floor((W - MARGIN * 2) / MONO_ADVANCE);
    const SEP = "   //   ";

    const statLines = [];
    for (const stat of profile.stats) {
      const entry = `${stat.value} ${stat.label.replace(/ @ /, " at ")}`;
      const last = statLines.length - 1;
      if (last >= 0 && statLines[last].length + SEP.length + entry.length <= MAX_CHARS) {
        statLines[last] += SEP + entry;
      } else {
        statLines.push(entry);
      }
    }

    const lines = [
      { file: "name.txt", text: profile.name },
      { file: "role.txt", text: profile.role },
      { file: "sub.txt", text: "Multimodal AI  //  RAG  //  Speech  //  Computer vision  //  MLOps" },
      { file: "domain.txt", text: "walaghazouani.com" },
      ...statLines.map((text, i) => ({ file: `stat${i}.txt`, text })),
    ];
    for (const l of lines) await writeFile(path.join(dir, l.file), l.text, "utf8");

    const draw = (fontKey, textfile, x, y, size, color) =>
      [
        "drawtext=",
        `fontfile=${fontKey}.ttf`,
        `:textfile=${textfile}`,
        `:x=${x}:y=${y}`,
        `:fontsize=${size}`,
        `:fontcolor=${color}`,
      ].join("");

    const STATS_TOP = 470;
    const LINE_H = 30;
    const domainY = STATS_TOP + statLines.length * LINE_H + 18;

    const graph = [
      // A hairline rule and an accent tick, echoing the site's chrome.
      `drawbox=x=0:y=0:w=${W}:h=6:color=${SIGNAL}:t=fill`,
      `drawbox=x=${MARGIN}:y=430:w=64:h=2:color=${LINE}:t=fill`,
      draw("bold", "name.txt", MARGIN, 196, 70, INK),
      draw("regular", "role.txt", MARGIN, 292, 38, SIGNAL),
      draw("regular", "sub.txt", MARGIN, 352, 25, FAINT),
      ...statLines.map((_, i) =>
        draw("mono", `stat${i}.txt`, MARGIN, STATS_TOP + i * LINE_H, MONO_SIZE, FAINT),
      ),
      draw("mono", "domain.txt", MARGIN, domainY, 23, SIGNAL),
    ].join(",");

    await writeFile(path.join(dir, "graph.txt"), graph, "utf8");
    await mkdir(path.dirname(OUT), { recursive: true });

    await run(
      "ffmpeg",
      [
        "-y",
        "-f", "lavfi",
        "-i", `color=c=${VOID}:s=${W}x${H}`,
        "-filter_complex_script", "graph.txt",
        "-frames:v", "1",
        OUT,
      ],
      { cwd: dir },
    );

    console.log(`> wrote public/og.png (${W}x${H})`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(`! build-og-image failed: ${e.message}`);
  process.exitCode = 1;
});
