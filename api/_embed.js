/**
 * Gemini embeddings — the single definition shared by the build-time indexer
 * and the runtime query path.
 *
 * Both must agree on model, dimensionality and normalisation, or every cosine
 * score is quietly wrong. Keeping one module means they cannot drift: the
 * indexer imports this file too.
 *
 * Why not a local model: the previous implementation ran all-MiniLM through
 * @xenova/transformers inside the serverless function. That dependency is
 * ~134 MB and drags in sharp and onnxruntime-node (~92 MB more), against
 * Vercel's 250 MB function limit — and it re-downloaded the weights from the
 * Hugging Face CDN on every cold start. Gemini already has the API key it
 * needs for generation, so embedding there costs two fetch calls and no bundle.
 */

export const EMBED_MODEL = "gemini-embedding-001";

/**
 * 768 of the model's 3072 dimensions. Matryoshka truncation: plenty of
 * separation for a 239-chunk corpus, and it keeps the committed index near
 * 1.5 MB rather than 6 MB.
 */
export const EMBED_DIM = 768;

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}`;

/**
 * Asymmetric retrieval: documents and queries are embedded with different task
 * types, which is what makes a short question land near a long passage.
 */
export const TASK_DOCUMENT = "RETRIEVAL_DOCUMENT";
export const TASK_QUERY = "RETRIEVAL_QUERY";

/**
 * Scale to unit length.
 *
 * Required, not optional. At the full 3072 dimensions Gemini returns normalised
 * vectors, but a truncated `outputDimensionality` does not — measured L2 of
 * 0.59 at 768. Cosine similarity is only a dot product for unit vectors, so
 * skipping this silently rescales every score.
 */
function normalise(values) {
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum);
  if (!norm) return values;
  return values.map((v) => v / norm);
}

async function post(path, body, { retries = 6, timeoutMs = 60000 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 401 });

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    let waitMs = Math.min(60000, 1000 * 2 ** (attempt - 1));
    try {
      const res = await fetch(`${ENDPOINT}:${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) return res.json();

      const detail = await res.text().catch(() => "");

      // 4xx other than rate limiting will not improve on retry.
      if (res.status !== 429 && res.status < 500) {
        throw Object.assign(new Error(detail.slice(0, 200) || `embed to ${res.status}`), {
          status: res.status,
        });
      }

      // On a quota error Google returns how long to wait. Honour it: the free
      // tier is a per-minute window, and a short exponential backoff burns its
      // retries long before the window rolls over.
      if (res.status === 429) {
        const hinted = /"retryDelay"\s*:\s*"(\d+)s"/.exec(detail);
        if (hinted) waitMs = Math.max(waitMs, (Number(hinted[1]) + 1) * 1000);
        else waitMs = Math.max(waitMs, 20000);
      }
      lastError = Object.assign(new Error(`embed to ${res.status}`), { status: res.status });
    } catch (e) {
      if (e.status && e.status < 500 && e.status !== 429) throw e;
      lastError = e;
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, waitMs));
  }
  throw lastError;
}

/** Embed a single string. Returns a unit-length array of EMBED_DIM floats. */
export async function embedOne(text, taskType = TASK_QUERY) {
  const json = await post("embedContent", {
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBED_DIM,
  });
  return normalise(json.embedding.values);
}

/** Embed many strings, batched. Order of the result matches the input. */
export async function embedMany(texts, taskType = TASK_DOCUMENT, { batchSize = 16, pauseMs = 0, onProgress = null } = {}) {
  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const json = await post("batchEmbedContents", {
      requests: slice.map((text) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBED_DIM,
      })),
    });
    for (const e of json.embeddings) out.push(normalise(e.values));
    onProgress?.(out.length);
    if (pauseMs && i + batchSize < texts.length) await new Promise((r) => setTimeout(r, pauseMs));
  }
  return out;
}
