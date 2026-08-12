/**
 * build-index.mjs — builds the retrieval index for the CV chatbot.
 *
 * Sources: the CV text (data/cv.txt, produced by extract-cv.mjs), every README
 * fetched by fetch-github.mjs (data/readmes/*.md), and the structured content in
 * src/data/content.js.
 *
 * Chunks are split on markdown headings so each one stays semantically whole,
 * then packed to ~500 tokens with ~80 tokens of overlap. Embeddings come from
 * Gemini via api/_embed.js — the same module the serverless function uses for
 * the query side, so the two halves cannot fall out of sync on model,
 * dimensionality or normalisation. The vectors are committed, so retrieval
 * needs no vector database and no network access to serve.
 *
 * Output: data/rag-index.json. It lives outside src/ deliberately — the API
 * function imports it, the client never does, so ~1.5 MB of float vectors stay
 * out of the browser bundle.
 *
 * Run: npm run build:index
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { embedMany, EMBED_MODEL, EMBED_DIM, TASK_DOCUMENT } from "../api/_embed.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "rag-index.json");
const README_DIR = path.join(ROOT, "data", "readmes");
const CV_TEXT = path.join(ROOT, "data", "cv.txt");

/** ~4 chars per token is close enough for chunk sizing; nothing depends on precision. */
const CHARS_PER_TOKEN = 4;
const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 80;
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

/* ---------------------------------------------------------------- chunking */

/** Split markdown into (heading, body) sections, keeping the heading trail. */
function sections(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let trail = [];
  let buffer = [];
  let heading = null;

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body) out.push({ section: trail.filter(Boolean).join(" › "), heading, body });
    buffer = [];
  };

  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      flush();
      const level = m[1].length;
      heading = m[2].replace(/[*_`#]/g, "").trim();
      trail = trail.slice(0, level - 1);
      trail[level - 1] = heading;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return out;
}

/** Pack a section's body into ~TARGET_CHARS windows with OVERLAP_CHARS of carry-over. */
function windows(body) {
  if (body.length <= TARGET_CHARS) return [body];

  // Prefer paragraph boundaries; fall back to sentence boundaries for long prose.
  const parts = body.split(/\n\s*\n/).flatMap((p) =>
    p.length <= TARGET_CHARS ? [p] : p.split(/(?<=[.!?])\s+/),
  );

  const out = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length + 2 > TARGET_CHARS) {
      out.push(current.trim());
      current = current.slice(-OVERLAP_CHARS);
    }
    current += (current ? "\n\n" : "") + part;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function chunkDocument({ text, source, title, url, baseSection = "" }) {
  const chunks = [];
  for (const sec of sections(text)) {
    const section = [baseSection, sec.section].filter(Boolean).join(" › ");
    for (const window of windows(sec.body)) {
      const clean = window
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")            // images carry no retrievable text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")          // keep link text, drop the URL
        .replace(/^\s*\|.*\|\s*$/gm, (row) =>             // flatten table rows to prose
          row.split("|").map((c) => c.trim()).filter(Boolean).join(" — "))
        .replace(/^\s*[-:]+\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (clean.length < 80) continue;
      // The heading trail rides along in the embedded text: without it a chunk
      // like "603 documents, cited by technique" has no idea it is about Solace.
      const prefix = [title, section].filter(Boolean).join(" — ");
      chunks.push({ text: clean, embedText: `${prefix}\n\n${clean}`, source, title, url, section });
    }
  }
  return chunks;
}

/* ----------------------------------------------------------------- sources */

async function cvChunks() {
  if (!existsSync(CV_TEXT)) {
    console.warn("  ! data/cv.txt missing — run `npm run extract:cv` first. Skipping CV.");
    return [];
  }
  const text = await readFile(CV_TEXT, "utf8");

  // The CV has no markdown headings; its section titles are short standalone
  // lines in title case. Promote those so chunks stay semantically whole.
  const KNOWN = /^(Professional Summary|Experience|Education|Projects?|Technical Skills|Skills|Certifications?|Languages|Publications?|Interests)\b/i;
  const marked = text
    .split("\n")
    .map((l) => (KNOWN.test(l.trim()) ? `## ${l.trim()}` : l))
    .join("\n");

  return chunkDocument({
    text: `# Curriculum Vitae\n${marked}`,
    source: "cv",
    title: "CV — Wala Eddine Ghazouani",
    url: "/Wala_Eddine_Ghazouani_CV.pdf",
  });
}

async function readmeChunks(generated) {
  if (!existsSync(README_DIR)) return [];
  const files = (await readdir(README_DIR)).filter((f) => f.endsWith(".md"));
  const out = [];

  for (const file of files) {
    const id = file.replace(/\.md$/, "");
    const repo = generated?.repos?.[id];
    const text = await readFile(path.join(README_DIR, file), "utf8");
    out.push(
      ...chunkDocument({
        text,
        source: "readme",
        title: repo?.repo ? `${repo.repo} — README` : `${id} README`,
        url: repo?.url || null,
      }),
    );
  }
  return out;
}

/** Render content.js into markdown so the same chunker handles it. */
async function contentChunks() {
  const mod = await import(pathToFileURL(path.join(ROOT, "src", "data", "content.js")).href);
  const { profile, skills, experience, education, certifications, languages, featuredProjects, secondaryProjects } = mod;
  const parts = [];

  parts.push(
    `## Profile\n${profile.name} — ${profile.role}, ${profile.subrole}. ` +
      `Based in ${profile.location}. ${profile.availability}. ${profile.relocation}. ` +
      `Contact: ${profile.email}. GitHub ${profile.github}. LinkedIn ${profile.linkedin}. ` +
      `Hugging Face ${profile.huggingface}.\n\n${profile.summary}\n\n` +
      profile.stats.map((s) => `- ${s.value} ${s.label}`).join("\n"),
  );

  parts.push(
    `## Skills\n` + skills.map((g) => `**${g.group}** — ${g.items.join(", ")}`).join("\n\n"),
  );

  parts.push(
    `## Experience\n` +
      experience
        .map(
          (j) =>
            `### ${j.role} — ${j.org} (${j.period}, ${j.place})\n` +
            j.points.map((p) => `- ${p}`).join("\n"),
        )
        .join("\n\n"),
  );

  parts.push(
    `## Education\n` + education.map((e) => `- ${e.degree}, ${e.school} (${e.period})`).join("\n"),
  );
  parts.push(
    `## Certifications\n` +
      certifications
        .map(
          (c) =>
            `- ${c.name} — ${c.issuer}, issued ${c.issued || c.year}` +
            (c.credentialId ? ` (credential ID ${c.credentialId})` : ""),
        )
        .join("\n"),
  );
  parts.push(`## Languages\n` + languages.map((l) => `- ${l.name}: ${l.level}`).join("\n"));

  const project = (p) =>
    `### ${p.name} — ${p.tagline}\n` +
    (p.period ? `Period: ${p.period}\n` : "") +
    `${p.description}\n\n` +
    (p.detail ? `${p.detail}\n\n` : "") +
    (p.metrics ? p.metrics.map((m) => `- ${m.value} ${m.label}`).join("\n") + "\n\n" : "") +
    `Stack: ${p.stack.join(", ")}\nRepository: ${p.repo}`;

  parts.push(`## Projects\n` + featuredProjects.map(project).join("\n\n"));
  parts.push(`## Additional projects\n` + secondaryProjects.map(project).join("\n\n"));

  return chunkDocument({
    text: `# Portfolio content\n\n${parts.join("\n\n")}`,
    source: "portfolio",
    title: "Portfolio site content",
    url: "/",
  });
}

/* ---------------------------------------------------------------- embedding */

// Gemini's free tier meters embeddings per minute by token, not by request, and
// this corpus is ~120k tokens. Small batches with a pause between them keep the
// run inside the window; api/_embed.js additionally honours the retryDelay
// Google returns on a 429, so a burst still recovers instead of aborting.
const BATCH = 16;
const PAUSE_MS = 15000;

async function embedAll(texts) {
  const vectors = [];
  const embedded = await embedMany(texts, TASK_DOCUMENT, {
    batchSize: BATCH,
    pauseMs: PAUSE_MS,
    onProgress: (n) => console.log(`  embedded ${n}/${texts.length}`),
  });
  // Round to 5 decimals: the vectors are unit-length, so this costs nothing
  // measurable in similarity and roughly halves the committed file.
  for (const v of embedded) vectors.push(v.map((x) => Math.round(x * 1e5) / 1e5));
  return vectors;
}

/* -------------------------------------------------------------------- main */

async function main() {
  console.log("> build-index");

  let generated = null;
  try {
    generated = JSON.parse(
      await readFile(path.join(ROOT, "src", "data", "github.generated.json"), "utf8"),
    );
  } catch {
    console.warn("  ! github.generated.json unreadable — README titles will be generic");
  }

  const chunks = [
    ...(await cvChunks()),
    ...(await contentChunks()),
    ...(await readmeChunks(generated)),
  ];

  const bySource = chunks.reduce((a, c) => ({ ...a, [c.source]: (a[c.source] || 0) + 1 }), {});
  console.log(`  ${chunks.length} chunks`, bySource);

  if (chunks.length === 0) throw new Error("no chunks produced — refusing to write an empty index");

  const vectors = await embedAll(chunks.map((c) => c.embedText));

  const payload = {
    generatedAt: new Date().toISOString(),
    model: EMBED_MODEL,
    dim: vectors[0].length,
    expectedDim: EMBED_DIM,
    chunks: chunks.map((c, i) => ({
      text: c.text,
      source: c.source,
      title: c.title,
      url: c.url,
      section: c.section,
      vector: vectors[i],
    })),
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload), "utf8");
  const kb = (JSON.stringify(payload).length / 1024).toFixed(0);
  console.log(`> wrote data/rag-index.json — ${payload.chunks.length} chunks, dim ${payload.dim}, ${kb} KB`);

  // A few numbers for the Demos section to display. The index itself must never
  // be imported by client code — this keeps ~1 MB of vectors out of the bundle.
  const meta = {
    generatedAt: payload.generatedAt,
    model: payload.model,
    dim: payload.dim,
    chunks: payload.chunks.length,
    sources: new Set(chunks.map((c) => c.title)).size,
  };
  await writeFile(
    path.join(ROOT, "src", "data", "rag-meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
  console.log(`> wrote src/data/rag-meta.json (${meta.sources} source documents)`);
}

main().catch((e) => {
  console.error(`! build-index failed: ${e.message}`);
  process.exitCode = 1;
});
