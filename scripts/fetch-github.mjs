/**
 * fetch-github.mjs — pulls real repository data from the GitHub REST API and
 * writes it to src/data/github.generated.json (committed, so the site builds
 * and renders with zero network access at runtime).
 *
 * Run:  npm run fetch:github
 * Auth: set GITHUB_TOKEN to lift the 60 req/hr unauthenticated rate limit.
 *
 * Failure policy: this script NEVER fails the build. If GitHub is unreachable,
 * rate-limits us, or returns garbage, we log a warning, leave the existing
 * committed JSON untouched, and exit 0.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(ROOT, "src", "data", "github.generated.json");
// READMEs land outside src/ so they are committed for the RAG indexer to read
// at build time but never pulled into the client bundle.
const OUT_READMES = path.join(ROOT, "data", "readmes");

/**
 * Canonical owner login. The account was renamed: `Ghazouaniwalae` 404s on the
 * API user endpoint and on github.com/<user>, though individual repo URLs still
 * 301 to the new login. We use the canonical login for every request so raw
 * asset URLs never depend on a redirect.
 */
const OWNER = "GhwazouaniWala";

/**
 * `id` matches the project id in src/data/content.js — that is the join key for
 * the merge. `repo` is the real name on GitHub, which is not always what the
 * curated copy assumed (`water-potability-mlops` does not exist; the repo is
 * `water-potability-Pipeline`).
 */
const REPOS = [
  { id: "solace", repo: "Solace" },
  { id: "fx-alphalab", repo: "fx-alphalabs" },
  { id: "critiq", repo: "Critiq" },
  { id: "wathiqa", repo: "Wathiqa" },
  { id: "neurashop", repo: "NeuraShop" },
  { id: "summify", repo: "Summify" },
  { id: "water-potability", repo: "water-potability-Pipeline" },
];

const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  console.warn(`  ! ${msg}`);
};

function headers(accept = "application/vnd.github+json") {
  const h = {
    Accept: accept,
    "User-Agent": "portfolio-fetch-github",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function gh(pathname, accept) {
  const res = await fetch(`${API}${pathname}`, { headers: headers(accept) });
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
    throw new Error(
      `rate limited (resets ${new Date(reset).toISOString()}) — set GITHUB_TOKEN to raise the limit`,
    );
  }
  if (!res.ok) {
    const err = new Error(`GET ${pathname} → ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return accept === "application/vnd.github.raw" ? res.text() : res.json();
}

/* ------------------------------------------------------------------ README */

const BADGE_HOSTS =
  /shields\.io|badgen\.net|forthebadge\.com|badge\.fury\.io|codecov\.io|travis-ci|circleci\.com\/.*\.svg|app\.netlify\.com\/.*\/deploy-status|visitor-badge|hits\.seeyoufarm/i;

const isBadge = (src) => BADGE_HOSTS.test(src) || /\/badge\b/i.test(src);

/** Strip fenced code blocks so we never mine them for prose or images. */
function stripFences(md) {
  return md.replace(/^```[\s\S]*?^```/gm, "\n");
}

/**
 * First substantive paragraph: the first block of running prose. Skips the H1,
 * subtitle headings, HTML wrappers (`<div align="center">`), badge rows,
 * blockquote taglines, tables, lists, and anything too short to be a summary.
 */
function firstParagraph(md) {
  const blocks = stripFences(md).split(/\n\s*\n/);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (/^#{1,6}\s/.test(block)) continue; // heading
    if (/^\s*[-*+]\s|^\s*\d+\.\s/.test(block)) continue; // list
    if (/^\|/.test(block)) continue; // table
    if (/^>/.test(block)) continue; // blockquote tagline
    if (/^(-{3,}|={3,}|\*{3,})$/.test(block)) continue; // rule

    // A line that is nothing but images/badges/links-around-images.
    const imageOnly = block
      .split("\n")
      .every((l) => !l.trim() || /^(\[?!\[|<img|<\/?p|<\/?div|<br)/i.test(l.trim()));
    if (imageOnly) continue;

    const text = block
      .replace(/<[^>]+>/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 80) continue;
    return text;
  }
  return "";
}

const STACK_HEADING =
  /^#{2,4}\s*(?:[^\w\s]*\s*)?(tech(?:nical|nology)?\s*stack|the\s*stack|stack|built\s*with|technologies|tooling)\b/i;

/**
 * Tech-stack extraction. README structures vary wildly across these repos —
 * markdown tables, `<details>` blocks, and bold-prefixed prose paragraphs all
 * appear — so this runs several strategies over the stack section and keeps
 * whatever it can. Curated stacks in content.js always win, so this is
 * supplementary signal, never load-bearing copy.
 */
function extractStack(md) {
  const lines = stripFences(md).split("\n");
  const start = lines.findIndex((l) => STACK_HEADING.test(l));
  if (start === -1) return [];

  const level = (lines[start].match(/^#+/) || ["##"])[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }

  const section = lines.slice(start + 1, end);
  const out = [];
  const push = (s) => {
    const v = s
      .replace(/<[^>]+>/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.,;]$/, "");
    if (v && v.length <= 90 && !/^-+$/.test(v) && !out.includes(v)) out.push(v);
  };

  for (const line of section) {
    const t = line.trim();
    if (!t) continue;

    // Markdown table row: | Layer | Technology | Why |  → take column 2.
    if (/^\|/.test(t)) {
      const cells = t.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 2) continue;
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator
      if (/^(layer|category|component|area|part)$/i.test(cells[0])) continue; // header
      cells[1].split(/,|·|•/).forEach(push);
      continue;
    }

    // List item.
    if (/^[-*+]\s/.test(t)) {
      push(t.replace(/^[-*+]\s/, "").split(/\s[—–-]\s/)[0]);
      continue;
    }

    // Bold-prefixed prose: **Backend** — FastAPI · SQLAlchemy · Pydantic
    const bold = t.match(/^\*\*([^*]+)\*\*\s*[—–-]\s*(.+)$/);
    if (bold) {
      bold[2].split(/·|•|,|\s+\|\s+/).forEach(push);
      continue;
    }

    // Continuation line of the previous bold-prefixed paragraph.
    if (/·/.test(t) && !/^</.test(t)) t.split(/·|•/).forEach(push);
  }

  return out.slice(0, 24);
}

/** Every non-badge image in the README, in document order, with alt text. */
function extractImages(md, { owner, repo, branch }) {
  const src = stripFences(md);
  const found = [];
  const seen = new Set();

  const add = (url, alt) => {
    if (!url) return;
    const clean = url.trim().replace(/^<|>$/g, "").split(/\s+/)[0].replace(/["']/g, "");
    if (!clean || isBadge(clean)) return;
    if (/^data:/i.test(clean)) return;

    let abs;
    if (/^https?:\/\//i.test(clean)) {
      // Normalise a github.com/blob link into a raw link.
      abs = clean.replace(
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i,
        "https://raw.githubusercontent.com/$1/$2/$3",
      );
      if (!/raw\.githubusercontent\.com/i.test(abs)) return; // off-repo asset, skip
    } else {
      // Relative path → absolute raw URL on the repo's default branch.
      const rel = clean.replace(/^\.\//, "").replace(/^\//, "");
      abs = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${rel
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;
    }
    if (seen.has(abs)) return;
    seen.add(abs);
    found.push({ src: abs, alt: (alt || "").replace(/\s+/g, " ").trim() });
  };

  // Markdown: ![alt](src "title")
  for (const m of src.matchAll(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g)) {
    add(m[2], m[1]);
  }
  // HTML: <img src="..." alt="...">
  for (const m of src.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const s = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const a = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    add(s?.[1], a?.[1]);
  }

  return found;
}

/* -------------------------------------------------- intrinsic image sizes */

/**
 * Read intrinsic dimensions straight out of the image header via a ranged GET,
 * so the gallery can set width/height and reserve layout space. No dependency:
 * PNG stores them in the IHDR chunk, JPEG in the SOFn marker, WebP in VP8*.
 */
function parseDimensions(buf) {
  // PNG
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.length > 10 && buf.slice(0, 3).toString("latin1") === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP (VP8X / VP8L / VP8 )
  if (buf.length > 30 && buf.slice(0, 4).toString("latin1") === "RIFF") {
    const fmt = buf.slice(12, 16).toString("latin1");
    if (fmt === "VP8X") {
      return {
        width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      };
    }
    if (fmt === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  // JPEG — walk the marker segments to the first SOFn.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const len = buf.readUInt16BE(i + 2);
      // SOF0..SOF15, excluding DHT(c4)/JPG(c8)/DAC(cc)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

async function probeImage(url) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-131071", "User-Agent": "portfolio" } });
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const dims = parseDimensions(buf);
    if (!dims || !dims.width || !dims.height) return null;
    return dims;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------- main */

async function fetchRepo({ id, repo }) {
  const meta = await gh(`/repos/${OWNER}/${repo}`);
  const branch = meta.default_branch || "main";

  const languages = await gh(`/repos/${OWNER}/${repo}/languages`).catch(() => ({}));
  const total = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, bytes, pct: Math.round((bytes / total) * 1000) / 10 }))
    .filter((l) => l.pct >= 0.5)
    .slice(0, 6);

  let readme = "";
  try {
    readme = await gh(`/repos/${OWNER}/${repo}/readme`, "application/vnd.github.raw");
  } catch (e) {
    warn(`${repo}: no README (${e.message})`);
  }

  const images = readme ? extractImages(readme, { owner: OWNER, repo, branch }) : [];
  const sized = [];
  for (const img of images) {
    const dims = await probeImage(img.src);
    // No dimensions means we cannot reserve layout space and cannot prove the
    // asset resolves — drop it rather than risk a broken frame in the gallery.
    if (!dims) {
      warn(`${repo}: dropped unreadable image ${img.src}`);
      continue;
    }
    sized.push({ ...img, ...dims });
  }

  if (readme) {
    await mkdir(OUT_READMES, { recursive: true });
    await writeFile(path.join(OUT_READMES, `${id}.md`), readme, "utf8");
  }

  return {
    id,
    repo: meta.name,
    owner: OWNER,
    url: meta.html_url,
    homepage: meta.homepage || null,
    defaultBranch: branch,
    description: meta.description || null,
    topics: meta.topics || [],
    stars: meta.stargazers_count ?? 0,
    forks: meta.forks_count ?? 0,
    isFork: !!meta.fork,
    createdAt: meta.created_at,
    pushedAt: meta.pushed_at,
    languages: langs,
    readme: {
      intro: firstParagraph(readme),
      stack: extractStack(readme),
      path: `data/readmes/${id}.md`,
      bytes: readme.length,
    },
    images: sized,
  };
}

/* ------------------------------------------------------------ hugging face */

const HF_AUTHOR = "Ghazouaniwala";

/**
 * Published models, grouped by family. The account holds several numbered
 * revisions of the same model (silma-tts-derja v2, v2-1, v3a, v4a…); listing
 * each as a separate release would overstate the work, so revisions collapse
 * into their base model and only the newest is shown, with the revision count
 * kept as context.
 */
function familyOf(id) {
  const name = id.split("/")[1];
  return name.replace(/[-_]?v\d+[a-z]?(?:[-.]\d+)?$/i, "");
}

async function fetchHuggingFace() {
  const res = await fetch(
    `https://huggingface.co/api/models?author=${HF_AUTHOR}&full=true`,
    { headers: { "User-Agent": "portfolio-fetch" } },
  );
  if (!res.ok) throw new Error(`hugging face → ${res.status}`);
  const list = await res.json();

  const families = new Map();
  for (const m of list) {
    const key = familyOf(m.id);
    const entry = families.get(key) || { family: key, revisions: 0, downloads: 0, items: [] };
    entry.revisions += 1;
    entry.downloads += m.downloads || 0;
    entry.items.push(m);
    families.set(key, entry);
  }

  return [...families.values()]
    .map((f) => {
      // Newest revision represents the family.
      const latest = f.items
        .slice()
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0];
      return {
        family: f.family,
        id: latest.id,
        url: `https://huggingface.co/${latest.id}`,
        pipeline: latest.pipeline_tag || null,
        tags: (latest.tags || []).filter((t) => !t.includes(":")).slice(0, 8),
        revisions: f.revisions,
        downloads: f.downloads,
        lastModified: latest.lastModified,
      };
    })
    .sort((a, b) => b.downloads - a.downloads);
}

/* ------------------------------------------------------------------- main */

async function main() {
  console.log(`> fetch-github: owner=${OWNER} auth=${TOKEN ? "token" : "anonymous"}`);

  const repos = {};
  const failed = [];

  for (const entry of REPOS) {
    try {
      repos[entry.id] = await fetchRepo(entry);
      const r = repos[entry.id];
      console.log(
        `  ✓ ${entry.repo.padEnd(26)} ${String(r.images.length).padStart(2)} img · ` +
          `${r.languages.length} lang · pushed ${r.pushedAt}`,
      );
    } catch (e) {
      failed.push(`${entry.repo}: ${e.message}`);
      warn(`${entry.repo}: ${e.message}`);
    }
  }

  // Refuse to clobber good committed data with a partial or empty result.
  if (Object.keys(repos).length === 0) {
    console.warn(
      "! fetch-github: no repositories fetched — keeping the existing committed " +
        "src/data/github.generated.json. Build continues.",
    );
    return;
  }

  // A repo that failed this run keeps whatever was last committed for it, so a
  // partial fetch degrades to stale-but-real data instead of a hole.
  const stale = [];
  if (failed.length && existsSync(OUT_JSON)) {
    try {
      const prev = JSON.parse(await readFile(OUT_JSON, "utf8"));
      for (const [id, value] of Object.entries(prev.repos || {})) {
        if (!repos[id]) {
          repos[id] = value;
          stale.push(id);
          console.warn(`  ~ ${id}: kept previously committed data`);
        }
      }
    } catch {
      /* previous file unreadable — proceed with what we have */
    }
  }

  // Warnings describe the payload, not the run: a repo that fell back cleanly to
  // committed data is reported once in `stale`, not as a recurring error that
  // would otherwise accumulate in the file across partial fetches.
  let models = [];
  try {
    models = await fetchHuggingFace();
    console.log(`  ✓ hugging face: ${models.length} model families`);
  } catch (e) {
    warn(`hugging face: ${e.message}`);
    if (existsSync(OUT_JSON)) {
      try {
        models = JSON.parse(await readFile(OUT_JSON, "utf8")).models || [];
        console.warn("  ~ hugging face: kept previously committed data");
      } catch {
        /* nothing committed yet */
      }
    }
  }

  const carried = new Set(stale);
  const payload = {
    generatedAt: new Date().toISOString(),
    owner: OWNER,
    repos,
    models,
    stale,
    warnings: warnings.filter((w) => !carried.has(w.split(":")[0]) && !stale.some((id) => repos[id]?.repo && w.startsWith(`${repos[id].repo}:`))),
  };

  await writeFile(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`> wrote ${path.relative(ROOT, OUT_JSON)} (${Object.keys(repos).length} repos)`);
}

main().catch((e) => {
  // Never fail the build on a network problem.
  console.warn(`! fetch-github failed: ${e.message}`);
  console.warn("! keeping existing src/data/github.generated.json. Build continues.");
});
