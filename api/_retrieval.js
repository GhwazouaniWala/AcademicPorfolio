/**
 * Hybrid retrieval over the committed index.
 *
 * Cosine similarity alone is not enough here. the embedding model is weaker on
 * proper nouns, so "What did he build at Wevioo?" scored 0.237 — indistinguishable
 * from an off-topic question — even though the CV names Wevioo three times.
 * Blending in a BM25 lexical score fixes exactly that class of query (employers,
 * model names, repo names) without giving up semantic matching.
 *
 * No vector database: 239 chunks is a linear scan over an in-memory array.
 */

import index from "../data/rag-index.json" with { type: "json" };

export const EMBED_MODEL = index.model;
export const CHUNK_COUNT = index.chunks.length;

/** Vector weight in the blend; the remainder is lexical. */
const VECTOR_WEIGHT = 0.65;

/**
 * Minimum blended score for an answer to be attempted.
 *
 * Re-measured against the committed index after the move to Gemini embeddings —
 * a different model puts scores on a different scale, so the old MiniLM-era
 * value of 0.27 would have waved every off-topic question straight through.
 * Real questions about the candidate now score 0.54-0.78; off-topic ones
 * ("capital of Peru", "recommend a pizza place") top out at 0.38. 0.46 sits in
 * that gap with margin on both sides. Below it we refuse rather than let the
 * model improvise — the same conviction-gate idea as FX AlphaLab, and the
 * single most important behaviour in this feature.
 */
export const RELEVANCE_THRESHOLD = 0.46;

const STOP = new Set(
  ("a an and are as at be by did do does for from has have he her his how i in is it its of on or " +
    "she that the their they this to was were what when where which who whom why will with you your")
    .split(" "),
);

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9+.#-]*/g) || []).filter(
    (t) => t.length > 1 && !STOP.has(t),
  );
}

/* ------------------------------------------------- BM25 index (built once) */

const N = index.chunks.length;
const docTokens = index.chunks.map((c) => tokenize(`${c.title} ${c.section} ${c.text}`));
const docLen = docTokens.map((t) => t.length);
const avgLen = docLen.reduce((a, b) => a + b, 0) / (N || 1);

const df = new Map();
docTokens.forEach((tokens) => {
  for (const t of new Set(tokens)) df.set(t, (df.get(t) || 0) + 1);
});

const termFreq = docTokens.map((tokens) => {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
});

const K1 = 1.4;
const B = 0.75;

/**
 * Lexical score as idf-weighted term *coverage*: what fraction of the question's
 * information-carrying terms this chunk actually contains, with BM25 saturation
 * damping repeated hits.
 *
 * Coverage rather than raw BM25 on purpose. BM25 is unbounded, so it has to be
 * normalised, and normalising per query makes the best-matching chunk score 1.0
 * on *every* question — including "write me a poem about cats", which then sails
 * past the relevance gate. Coverage is absolute: a question whose terms appear
 * nowhere in the corpus scores near zero no matter what ranks first.
 */
function lexicalScores(queryTokens) {
  const scores = new Float64Array(N);
  const unique = [...new Set(queryTokens)];

  let totalIdf = 0;
  const terms = [];
  for (const q of unique) {
    const n = df.get(q) || 0;
    // An unseen term still counts against coverage — that is the whole point.
    const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    totalIdf += idf;
    if (n) terms.push({ q, idf });
  }
  if (totalIdf === 0) return scores;

  for (const { q, idf } of terms) {
    for (let i = 0; i < N; i++) {
      const f = termFreq[i].get(q);
      if (!f) continue;
      const saturation = (f * (K1 + 1)) / (f + K1 * (1 - B + (B * docLen[i]) / avgLen));
      scores[i] += (idf * Math.min(1, saturation)) / totalIdf;
    }
  }
  return scores;
}

/* ---------------------------------------------------------------- retrieve */

/**
 * @param {number[]} queryVector unit-normalised embedding of the question
 * @param {string} question raw question text, for the lexical half
 * @param {number} k how many chunks to return
 */
export function retrieve(queryVector, question, k = 5) {
  const lexical = lexicalScores(tokenize(question));

  const scored = new Array(N);
  for (let i = 0; i < N; i++) {
    const v = index.chunks[i].vector;
    let dot = 0;
    for (let d = 0; d < queryVector.length; d++) dot += queryVector[d] * v[d];
    const lex = lexical[i];
    scored[i] = {
      score: VECTOR_WEIGHT * dot + (1 - VECTOR_WEIGHT) * lex,
      vectorScore: dot,
      lexicalScore: lex,
      chunk: index.chunks[i],
    };
  }

  scored.sort((a, b) => b.score - a.score);

  // Keep at most two chunks from the same document so one verbose README
  // cannot crowd out the CV.
  const picked = [];
  const perTitle = new Map();
  for (const s of scored) {
    const seen = perTitle.get(s.chunk.title) || 0;
    if (seen >= 2) continue;
    perTitle.set(s.chunk.title, seen + 1);
    picked.push(s);
    if (picked.length >= k) break;
  }

  return picked;
}
