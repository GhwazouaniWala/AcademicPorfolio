import { useCallback, useSyncExternalStore } from "react";

const KEY = "wg-theme";
const EXPLICIT = "wg-theme-explicit";

/**
 * One theme, shared by every consumer.
 *
 * The rail renders a toggle on desktop and another on mobile; with per-hook
 * state those two would drift apart and report contradictory aria-checked
 * values. A module-level store keeps them describing the same thing.
 */

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* the choice just will not persist */
  }
}

function initial() {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

let theme = initial();
const listeners = new Set();

function apply(next) {
  theme = next;
  const root = document.documentElement;
  root.setAttribute("data-theme", next);
  write(KEY, next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", next === "light" ? "#f6f4ef" : "#080a0f");
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // Enable the cross-fade only after the first paint, so the initial render
  // lands on its colours instead of animating into them. A background tab
  // never runs rAF, so a timer backs it up — otherwise the transition would
  // stay disabled for anyone who opened the page in a background tab.
  const ready = () => document.documentElement.classList.add("theme-ready");
  requestAnimationFrame(ready);
  setTimeout(ready, 120);

  // Keep following the OS until the visitor chooses explicitly.
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", (e) => {
    if (read(EXPLICIT)) return;
    apply(e.matches ? "light" : "dark");
  });
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTheme() {
  const value = useSyncExternalStore(
    subscribe,
    () => theme,
    () => "dark",
  );

  const toggle = useCallback(() => {
    write(EXPLICIT, "1");
    apply(theme === "dark" ? "light" : "dark");
  }, []);

  return { theme: value, toggle };
}
