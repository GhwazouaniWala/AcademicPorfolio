import { useCallback, useRef, useState } from "react";

/**
 * Client for /api/chat.
 *
 * The endpoint speaks SSE over a POST, so EventSource is not an option — we
 * read the body stream and parse events by hand. Every failure mode resolves to
 * a message the panel can show; nothing throws into the component.
 */

const RETRIEVING = "searching";

function parseEvents(buffer) {
  const events = [];
  const frames = buffer.split("\n\n");
  const remainder = frames.pop() ?? "";

  for (const frame of frames) {
    let event = "message";
    const dataLines = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) continue;
    try {
      events.push({ event, data: JSON.parse(dataLines.join("\n")) });
    } catch {
      /* a partial frame that split badly — drop it rather than crash the stream */
    }
  }
  return { events, remainder };
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null); // mono readout under the composer
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStatus(null);
    setBusy(false);
  }, []);

  const send = useCallback(
    async (question) => {
      const text = question.trim();
      if (!text || busy) return;

      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [
        ...prev,
        { id: `u${Date.now()}`, role: "user", content: text },
        { id: `a${Date.now()}`, role: "assistant", content: "", sources: [], streaming: true },
      ]);
      setBusy(true);
      setStatus({ phase: RETRIEVING, label: "searching…" });

      const patchLast = (patch) =>
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          next[i] = { ...next[i], ...(typeof patch === "function" ? patch(next[i]) : patch) };
          return next;
        });

      const controller = new AbortController();
      abortRef.current = controller;

      // Offline is worth catching up front: the request would otherwise fail
      // with an opaque TypeError.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        patchLast({
          streaming: false,
          error: true,
          content: "You're offline. The assistant needs a connection — the rest of the page doesn't.",
        });
        setBusy(false);
        setStatus(null);
        return;
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let message = "The assistant is unreachable right now. Try again shortly.";
          try {
            const payload = await res.json();
            if (payload?.message) message = payload.message;
          } catch {
            if (res.status === 404) {
              message =
                "The assistant endpoint isn't running. It needs the deployed site (or `vercel dev`) — everything else here works offline.";
            }
          }
          patchLast({ streaming: false, error: true, content: message });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const { events, remainder } = parseEvents(buffer);
          buffer = remainder;

          for (const { event, data } of events) {
            if (event === "status") {
              setStatus({
                phase: data.phase,
                label:
                  data.phase === "searching"
                    ? `searching ${data.chunks} chunks…`
                    : data.phase === "matched"
                      ? `${data.matched} sources matched`
                      : "no sources matched",
              });
            } else if (event === "sources") {
              patchLast({ sources: data.sources });
            } else if (event === "delta") {
              patchLast((m) => ({ content: m.content + data.text }));
            } else if (event === "error") {
              patchLast((m) => ({
                streaming: false,
                error: !m.content,
                content: m.content || data.message,
              }));
            } else if (event === "done") {
              patchLast({ streaming: false, grounded: data.grounded });
            }
          }
        }

        patchLast({ streaming: false });
      } catch (err) {
        if (err?.name === "AbortError") return;
        patchLast({
          streaming: false,
          error: true,
          content:
            "The connection dropped mid-answer. Ask again — the question wasn't the problem.",
        });
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages],
  );

  return { messages, status, busy, send, reset };
}
