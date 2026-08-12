/**
 * Exercises the retrieval half of /api/chat: embeds each question through the
 * same module the handler uses, runs the same retrieve(), and reports what the
 * gate would decide.
 *
 * Needs GEMINI_API_KEY, since the query embedding is a real API call now.
 */
import { readFileSync } from "node:fs";
import { retrieve, RELEVANCE_THRESHOLD, CHUNK_COUNT } from "../api/_retrieval.js";
import { embedOne, TASK_QUERY } from "../api/_embed.js";

// Load .env so this runs standalone, the way the other scripts do.
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(String.fromCharCode(10))) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  /* no .env — rely on the ambient environment */
}

const cases = [
  ["answerable", "What did he build at Wevioo?"],
  ["answerable", "Does he have MLOps experience?"],
  ["answerable", "What models has he published to Hugging Face?"],
  ["answerable", "Tell me about the Arabic document project"],
  ["answerable", "When can he start an internship?"],
  ["answerable", "How big was the FX AlphaLab team?"],
  ["off-topic", "What is the capital of Peru?"],
  ["off-topic", "Write me a poem about cats"],
  ["off-topic", "Who won the 2019 cricket world cup?"],
  ["off-topic", "Recommend a good pizza place"],
];

console.log(`index ${CHUNK_COUNT} chunks · gate ${RELEVANCE_THRESHOLD}\n`);
let pass = 0;

for (const [kind, q] of cases) {
  const results = retrieve(await embedOne(q, TASK_QUERY), q, 5);
  const best = results[0].score;
  const answered = best >= RELEVANCE_THRESHOLD;
  const correct = kind === "answerable" ? answered : !answered;
  if (correct) pass++;

  console.log(
    `${correct ? "ok  " : "FAIL"} ${best.toFixed(3)} ${answered ? "ANSWER " : "REFUSE "} [${kind}] ${q}`,
  );
  if (answered) {
    for (const r of results.slice(0, 3)) {
      console.log(`         · ${r.chunk.title}${r.chunk.section ? " › " + r.chunk.section : ""}`.slice(0, 96));
    }
  }
}

console.log(`\n${pass}/${cases.length} gate decisions correct`);
process.exitCode = pass === cases.length ? 0 : 1;
