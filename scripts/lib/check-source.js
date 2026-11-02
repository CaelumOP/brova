// Scans js/**/*.js and the root *.html files under `root` for the source rules
// in docs/designs/brova.md (Security Rules, Caching). Returns problems; the CLI prints them.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

// Built from parts so this file does not trip its own forbidden-name check.
const FORBIDDEN = [
  ["inner", "HTML"], ["outer", "HTML"], ["insertAdjacent", "HTML"], ["document.", "write"],
  ["document.", "writeln"], ["DOM", "Parser"], ["createContextual", "Fragment"],
  ["setHTML", "Unsafe"], ["src", "doc"],
].map((parts) => parts.join(""));
const FORBIDDEN_RE = FORBIDDEN.map((name) => [name, new RegExp(`\\b${name.replace(".", "\\.")}\\b`)]);

const STAMP = "?v=__BUILD__";
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)(["'`])([^"'`]*)\1/g;
const FETCH_RE = /\bfetch\s*\(\s*(["'`])([^"'`]*)\1/g;
const ATTR_RE = /\b(?:src|href)\s*=\s*(["'])([^"']*)\1/gi;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i; // http:, mailto:, data:, //host, #anchor

async function listJs(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listJs(full)));
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

function isLocalScriptOrStyle(url) {
  const file = url.split(/[?#]/)[0];
  return !EXTERNAL.test(url) && (file.endsWith(".js") || file.endsWith(".css"));
}

function checkLine(text, isHtml, report) {
  for (const [name, re] of FORBIDDEN_RE) {
    if (re.test(text)) report("forbidden-html-api", name);
  }
  for (const [, , spec] of text.matchAll(IMPORT_RE)) {
    if (spec.startsWith("/")) report("absolute-path", spec);
    else if (spec.startsWith(".") && spec.split("?")[0].endsWith(".js") && !spec.endsWith(STAMP)) {
      report("missing-build-stamp", spec);
    }
  }
  for (const [, , url] of text.matchAll(FETCH_RE)) {
    if (url.startsWith("/")) report("absolute-path", url);
  }
  if (!isHtml) return;
  for (const [, , url] of text.matchAll(ATTR_RE)) {
    if (url.startsWith("/")) report("absolute-path", url);
    else if (isLocalScriptOrStyle(url) && !url.endsWith(STAMP)) report("missing-build-stamp", url);
  }
}

export async function checkSource({ root }) {
  const rootEntries = await readdir(root, { withFileTypes: true });
  const html = rootEntries.filter((e) => e.isFile() && e.name.endsWith(".html")).map((e) => path.join(root, e.name));
  const files = [...(await listJs(path.join(root, "js"))), ...html].sort();
  const problems = [];
  for (const full of files) {
    const file = path.relative(root, full).split(path.sep).join("/");
    const lines = (await readFile(full, "utf8")).split(/\r?\n/);
    lines.forEach((text, i) => {
      checkLine(text, file.endsWith(".html"), (rule, found) => {
        problems.push({ file, line: i + 1, rule, text: found });
      });
    });
  }
  return problems;
}
