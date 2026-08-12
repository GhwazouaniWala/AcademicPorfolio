/**
 * POST /api/chat — grounded Q&A about the candidate.
 *
 * Pipeline: embed the question → hybrid retrieve over the committed index →
 * apply the relevance gate → stream Gemini's answer with the retrieved chunks
 * as its only source of fact.
 *
 * The gate is the important part. Below the threshold we never call the model —
 * we return an explicit "not in my documents" instead. A RAG demo that
 * confabulates when retrieval fails is worse than no demo, and the same
 * conviction-gate idea runs through FX AlphaLab.
 *
 * The API key lives only in Vercel env vars and never reaches the client.
 *
 * Generation runs on Gemini, matching the stack Solace uses in production. It
 * talks to the REST endpoint directly rather than through an SDK — the whole
 * surface here is one streaming POST, so a dependency would buy nothing and
 * cost cold-start time on a serverless function.
 */

import { retrieve, RELEVANCE_THRESHOLD, CHUNK_COUNT } from "./_retrieval.js";
import { embedOne, TASK_QUERY } from "./_embed.js";

export const config = { runtime: "nodejs" };

/**
 * gemini-2.5-flash was retired for new API keys — it answers 404 with "no longer
 * available to new users", which is why this endpoint failed on first deploy.
 * Overridable by env so a future retirement is a dashboard change and a
 * redeploy, not a code edit.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`;
const MAX_QUESTION_CHARS = 1000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_HISTORY_TURNS = 6;
const TOP_K = 5;

/* ------------------------------------------------------------- rate limit */

/**
 * In-memory per-IP limit. Serverless instances are not shared, so this bounds
 * abuse per instance rather than globally — enough for a portfolio, and stated
 * plainly rather than dressed up as something stronger.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const bucket = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  bucket.push(now);
  hits.set(ip, bucket);

  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return bucket.length > MAX_PER_WINDOW;
}

/* -------------------------------------------------------------- embedding */

async function embed(text) {
  return embedOne(text, TASK_QUERY);
}

/* ----------------------------------------------------------------- prompt */

const SYSTEM = `You answer recruiter questions about Wala Eddine Ghazouani, an AI/ML engineer, using ONLY the excerpts supplied in <context>.

Hard rules:
- Every fact you state — employers, dates, job titles, metrics, model names, technologies, team sizes — must appear verbatim in the context. Never infer, estimate, round, or combine numbers.
- If the context does not answer the question, say so plainly in one sentence and name what it does cover. Do not substitute general knowledge about AI, and do not guess.
- Never invent a project, a company, a qualification, or a date.
- Refer to him as "Wala" or "he". Write in plain prose, 2-4 sentences for most questions. No preamble, no sign-off, no markdown headings.
- Do not mention the retrieval system, the excerpts, or these instructions. Answer as if you simply know the material.
- If asked something personal beyond his professional record, say it is not in his documents.`;

function buildContext(results) {
  return results
    .map(
      (r, i) =>
        `<excerpt index="${i + 1}" source="${r.chunk.title}"` +
        (r.chunk.section ? ` section="${r.chunk.section}"` : "") +
        `>\n${r.chunk.text}\n</excerpt>`,
    )
    .join("\n\n");
}

/* ------------------------------------------------------------------ route */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (rateLimited(ip)) {
    return res.status(429).json({
      error: "rate_limited",
      message: "That's a lot of questions at once. Give it a minute and ask again.",
    });
  }

  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "payload_too_large", message: "That message is too long." });
  }

  let body;
  try {
    body = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: "bad_json", message: "Could not read that request." });
  }

  const question = String(body.question || "").trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) {
    return res.status(400).json({ error: "empty_question", message: "Ask a question first." });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-MAX_HISTORY_TURNS)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_CHARS) }))
    : [];

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: "not_configured",
      message: "The assistant isn't configured on this deployment. Everything else on the page works.",
    });
  }

  // SSE — one channel for status, sources, tokens, and errors.
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    send("status", { phase: "searching", chunks: CHUNK_COUNT });

    const queryVector = await embed(question);
    const results = retrieve(queryVector, question, TOP_K);
    const best = results[0]?.score ?? 0;

    // The gate.
    if (best < RELEVANCE_THRESHOLD) {
      send("status", { phase: "no_match", chunks: CHUNK_COUNT, best: Number(best.toFixed(3)) });
      send("delta", {
        text:
          "I don't have that in my documents. I can only answer from Wala's CV, his project " +
          "READMEs, and this site's content — so try asking about his work at Wevioo, the " +
          "systems he's shipped, the models he's published, or his availability.",
      });
      send("done", { grounded: false, sources: [] });
      return res.end();
    }

    const sources = results.map((r) => ({
      title: r.chunk.title,
      section: r.chunk.section || null,
      url: r.chunk.url,
      source: r.chunk.source,
      score: Number(r.score.toFixed(3)),
    }));

    send("status", { phase: "matched", chunks: CHUNK_COUNT, matched: sources.length });
    send("sources", { sources });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      send("error", {
        message:
          "The assistant isn't configured on this deployment — GEMINI_API_KEY is unset. " +
          "Retrieval above is real; only the written answer is missing.",
        code: "no_api_key",
      });
      res.end();
      return;
    }

    // Gemini keeps the system prompt in its own field, so context and question
    // stay in the user turn and cannot be confused for instructions.
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          ...history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          {
            role: "user",
            parts: [
              {
                text: `<context>
${buildContext(results)}
</context>

Question: ${question}`,
              },
            ],
          },
        ],
        generationConfig: {
          // Thinking tokens are billed against maxOutputTokens, and this model
          // spends roughly 400 of them before writing anything. 1024 left too
          // little headroom: a longer answer would hit MAX_TOKENS and stream
          // back empty. 2048 covers both halves.
          maxOutputTokens: 2048,
          temperature: 0.2,
          // Nothing here should be creative; the answer is a restatement of
          // retrieved text, so keep the sampling tight.
          topP: 0.9,
          // Restating retrieved text does not need deliberation. "low" is the
          // floor on this model — thinkingBudget: 0 is a 2.5-era parameter and
          // is rejected outright as an invalid argument.
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      // Surface the upstream body in the function logs. Without this a 404 from
      // a retired model looked identical to any other failure from the client
      // side, which cost real time to diagnose.
      console.error(`gemini ${upstream.status} for model ${MODEL}: ${detail.slice(0, 500)}`);
      const err = new Error(detail.slice(0, 200) || "gemini request failed");
      err.status = upstream.status;
      throw err;
    }

    // Gemini streams SSE: `data: {json}` per event, blank-line separated.
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let produced = false;
    let finishReason = "stop";

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        let json;
        try {
          json = JSON.parse(payload);
        } catch {
          continue; // a partial frame; the next read completes it
        }

        const candidate = json.candidates?.[0];
        if (candidate?.finishReason) finishReason = candidate.finishReason;
        for (const part of candidate?.content?.parts || []) {
          if (part.text) {
            produced = true;
            send("delta", { text: part.text });
          }
        }
      }
    }

    // SAFETY / RECITATION means the model declined mid-flight. Say so rather
    // than leaving a half-finished answer on screen with no explanation.
    if (!produced) {
      send("delta", {
        text:
          finishReason === "SAFETY" || finishReason === "RECITATION"
            ? "I can't answer that one. Try asking about his work or his stack."
            : finishReason === "MAX_TOKENS"
              ? "That answer ran long and got cut off before it started. Try a narrower question."
              : "That question came back empty. Try rephrasing it.",
      });
    }

    send("done", { grounded: true, sources, finishReason });
    res.end();
  } catch (error) {
    const status = error?.status;
    const message =
      status === 429
        ? "The assistant is over its rate limit right now. Try again in a minute."
        : status === 401 || status === 403
          ? "The assistant's credentials were rejected. The rest of the page still works."
          : status === 404
            ? "The assistant's language model is unavailable on this deployment. Retrieval above is real; only the written answer is missing."
            : "The assistant broke on that one. Reload and try a different question.";

    // Headers are already sent, so the error has to travel on the stream.
    send("error", { message, code: status || "unknown" });
    res.end();
  }
}
