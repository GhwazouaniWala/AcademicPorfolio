import { featuredProjects, secondaryProjects } from "./content";
import generated from "./github.generated.json";

/**
 * Merge layer between hand-written project copy and build-time GitHub data.
 *
 * The contract, deliberately narrow: curated copy in content.js always wins.
 * GitHub only ever contributes things that cannot be hand-maintained honestly —
 * screenshots, topics, language stats, and the last-push date. It never
 * overwrites a tagline, a metric, a stack entry, or the `detail` text.
 */

const repos = generated?.repos || {};

function merge(project) {
  const gh = repos[project.id];
  if (!gh) return { ...project, github: null, images: [], languages: [], topics: [] };

  return {
    ...project,
    // Curated repo URL wins if present; the generated one is the canonical
    // fallback and is guaranteed to resolve.
    repo: project.repo || gh.url,
    github: {
      url: gh.url,
      name: gh.repo,
      owner: gh.owner,
      stars: gh.stars,
      pushedAt: gh.pushedAt,
      defaultBranch: gh.defaultBranch,
      // Only surfaced where curated copy leaves a gap.
      description: gh.description || null,
      intro: gh.readme?.intro || "",
    },
    images: gh.images || [],
    languages: gh.languages || [],
    topics: gh.topics || [],
  };
}

export const featured = featuredProjects.map(merge);
export const secondary = secondaryProjects.map(merge);
export const allProjects = [...featured, ...secondary];
export const githubGeneratedAt = generated?.generatedAt || null;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const rtf =
  typeof Intl !== "undefined" && Intl.RelativeTimeFormat
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    : null;

/**
 * "updated 3 weeks ago" — computed at render time from the absolute timestamp,
 * so the readout stays truthful between builds rather than freezing whatever
 * the string said when the data was fetched.
 */
export function relativeTime(iso, now = Date.now()) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const diff = then - now;
  const abs = Math.abs(diff);
  if (abs < HOUR) return rtf ? rtf.format(Math.round(diff / MINUTE), "minute") : "just now";
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return rtf.format(Math.round(diff / DAY), "day");
  if (abs < 30 * DAY) return rtf.format(Math.round(diff / WEEK), "week");
  if (abs < 365 * DAY) return rtf.format(Math.round(diff / (30 * DAY)), "month");
  return rtf.format(Math.round(diff / (365 * DAY)), "year");
}

/** Absolute date for the tooltip behind the relative readout. */
export function absoluteDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
