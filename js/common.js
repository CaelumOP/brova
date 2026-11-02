// Shared helpers for both pages. Nothing here touches `document` or `window` at
// import time, so Node tests can import this file.

export const REPO_URL = "https://github.com/CaelumOP/brova";
export const EXAM_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ---- DOM ----

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["svg", "path", "circle", "g", "rect", "line", "polyline"]);

// The only way pages build DOM. Text always goes in as text nodes, never as markup.
export function el(tag, attrs = {}, ...children) {
  const node = SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (name.startsWith("on")) {
      if (typeof value !== "function") throw new TypeError(`el: ${name} must be a function`);
      node.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value === true) {
      node.setAttribute(name, "");
    } else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(name, String(value));
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
  return node;
}

export function bilingualName(en, ar) {
  return el("span", { class: "name" }, en, " · ", el("span", { lang: "ar", dir: "rtl", class: "name-ar" }, ar));
}

// ---- Loading ----

export class LoadError extends Error {
  constructor({ kind, url, status = null }) {
    super(kind === "network" ? `Could not reach ${url}` : `Could not load ${url}`);
    this.name = "LoadError";
    this.kind = kind;
    this.url = url;
    this.status = status;
  }
}

export async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, { cache: "no-cache" });
  } catch {
    throw new LoadError({ kind: "network", url });
  }
  if (!response.ok) throw new LoadError({ kind: "load", url, status: response.status });
  try {
    return await response.json();
  } catch {
    throw new LoadError({ kind: "load", url, status: null });
  }
}

// ---- Saved state (localStorage key "brova") ----

const STATE_KEY = "brova";

export function emptyState() {
  return { schemaVersion: 1, lastSemester: null, scores: {} };
}

function isState(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    value.schemaVersion === 1 &&
    (value.lastSemester === null || typeof value.lastSemester === "string") &&
    value.scores !== null &&
    typeof value.scores === "object" &&
    !Array.isArray(value.scores)
  );
}

// Reading localStorage itself can throw when site data is blocked.
function storageOrDefault(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadState(storage) {
  try {
    const raw = storageOrDefault(storage)?.getItem(STATE_KEY);
    const value = raw ? JSON.parse(raw) : null;
    return isState(value) ? value : emptyState();
  } catch {
    return emptyState();
  }
}

// Every write goes through here: load, change, save in one step, so no page
// ever saves a copy it loaded earlier (another tab or the Back button may have
// written since then).
export function updateState(fn, storage) {
  const target = storageOrDefault(storage);
  const next = fn(loadState(target));
  try {
    target?.setItem(STATE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked or full: the site works without saved state.
  }
  return next;
}

// ---- Report links ----

// Cuts `text` so that it, including the final "…", is at most `cap` characters.
export function truncate(text, cap) {
  return text.length <= cap ? text : `${text.slice(0, cap - 1)}…`;
}

function issueUrl(title, lines) {
  return `${REPO_URL}/issues/new?${new URLSearchParams({ title, body: lines.join("\n") })}`;
}

export function questionReportUrl({ examId, hash, number, questionText, myAnswer, markedCorrect, pageUrl }) {
  return issueUrl(`Report: ${examId} Q${number}`, [
    `Exam: ${examId} (version ${hash})`,
    `Question ${number}: ${truncate(questionText, 500)}`,
    `My answer: ${myAnswer}`,
    ...(markedCorrect ? [`Marked correct: ${markedCorrect}`] : []),
    `Page: ${pageUrl}`,
    "",
    "Reason:",
  ]);
}

export function errorReportUrl({ message, source, line, column, stack, pageUrl, userAgent }) {
  const text = String(message);
  return issueUrl(`Error: ${truncate(text, 100)}`, [
    `Page: ${pageUrl}`,
    `Message: ${text}`,
    ...(source ? [`Source: ${source}:${line}:${column}`] : []),
    ...(stack ? [`Stack: ${truncate(stack, 1500)}`] : []),
    `Browser: ${userAgent}`,
  ]);
}

// ---- Banner and error handlers ----

// `kind` is "error" (load and render failures) or "notice" (invalid link, no exams).
export function showBanner(message, { url, reportError, kind = "error" } = {}) {
  const banner = document.getElementById("banner");
  if (!banner) return;
  const report = reportError
    ? el(
        "a",
        {
          href: errorReportUrl({ ...reportError, pageUrl: location.href, userAgent: navigator.userAgent }),
          target: "_blank",
          rel: "noopener",
        },
        "Report this error",
      )
    : null;
  banner.replaceChildren(
    el("div", { class: `banner banner-${kind}`, role: kind === "error" ? "alert" : "status" },
      el("p", {}, message, url ? [" ", el("span", { class: "banner-url" }, url)] : null),
      report),
  );
}

// True when `text` (a file name or a stack) points at this site's own files, or
// at nothing at all (code typed in the console). Errors from browser extensions
// and in-app browser scripts point at other URLs and are ignored.
function isOwnSource(text) {
  const siteBase = new URL("../", import.meta.url).href;
  if (!text || text.includes(siteBase)) return true;
  return !/[a-z][a-z0-9+.-]*:\/\//i.test(text);
}

export function installErrorHandlers() {
  window.addEventListener("error", (event) => {
    // "Script error." is a muted error from a script on another origin.
    if (event.message === "Script error." || !isOwnSource(event.filename)) return;
    showBanner("Something went wrong on this page.", {
      reportError: {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      },
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const stack = reason instanceof Error ? reason.stack : undefined;
    if (!(reason instanceof Error) || !isOwnSource(stack)) return;
    showBanner("Something went wrong on this page.", { reportError: { message: reason.message, stack } });
  });
}
