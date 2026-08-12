/**
 * extract-cv.mjs — extracts the CV text for the RAG index.
 *
 * Reads public/Wala_Eddine_Ghazouani_CV.pdf and writes data/cv.txt. The text
 * lives outside src/ so it is committed and available to the indexer without
 * ever entering the client bundle.
 *
 * pdfjs-dist is a devDependency: the CV is a LaTeX (pdfTeX) export whose fonts
 * carry no ToUnicode maps, so recovering its text needs real font-encoding
 * handling rather than a regex over the content streams.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public", "Wala_Eddine_Ghazouani_CV.pdf");
const OUT_TEXT = path.join(ROOT, "data", "cv.txt");

/** Group text items into lines by their baseline, in reading order. */
function itemsToLines(items) {
  const lines = [];
  let current = "";
  let baseline = null;

  for (const item of items) {
    if (typeof item.str !== "string") continue;
    const y = Math.round(item.transform[5]);
    if (baseline !== null && Math.abs(y - baseline) > 2) {
      lines.push(current.trim());
      current = "";
    }
    baseline = y;
    current += item.str + (item.hasEOL ? " " : "");
  }
  lines.push(current.trim());

  return lines.filter(Boolean);
}

/**
 * Rejoin words the typesetter hyphenated across a line break. Left alone, a
 * chunk containing "applica-\ntion" embeds as two fragments and never matches
 * a query about "application".
 */
function dehyphenate(lines) {
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && /[a-z]-$/.test(prev) && /^[a-z]/.test(line)) {
      out[out.length - 1] = prev.slice(0, -1) + line;
    } else {
      out.push(line);
    }
  }
  return out;
}

async function main() {
  const raw = await readFile(SOURCE);
  if (raw.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error(
      `${path.basename(SOURCE)} is not a PDF (starts with ` +
        `${JSON.stringify(raw.subarray(0, 4).toString("latin1"))}) — the CV download is broken`,
    );
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(raw),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();
    pages.push(dehyphenate(itemsToLines(items)).join("\n"));
  }

  const text = pages.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 200) throw new Error("extracted CV text is implausibly short");

  await mkdir(path.dirname(OUT_TEXT), { recursive: true });
  await writeFile(OUT_TEXT, `${text}\n`, "utf8");
  console.log(`> extract-cv: ${doc.numPages} page(s) → data/cv.txt (${text.length} chars)`);
}

main().catch((e) => {
  console.error(`! extract-cv failed: ${e.message}`);
  process.exitCode = 1;
});
