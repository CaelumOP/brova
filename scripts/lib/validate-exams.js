// Checks data/config.json and every file in data/exams/ under `root`.
// Returns problems instead of printing or exiting; scripts/validate.js does that.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020Module from "ajv/dist/2020.js";

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

// The schemas always come from this repository, never from `root`.
const SCHEMA_DIR = new URL("../../data/", import.meta.url);
const CONFIG_FILE = "data/config.json";
const EXAMS_DIR = "data/exams";
const FILE_NAME = /^[a-z0-9]+(-[a-z0-9]+)*\.json$/;

async function loadSchema(name) {
  return JSON.parse(await readFile(new URL(name, SCHEMA_DIR), "utf8"));
}

function parseJson(text) {
  return JSON.parse(text.replace(/^﻿/, ""));
}

function isRealDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Turns one ajv error into readable text, relative to the question when there is one.
function describe(error, where) {
  const field = where.replace(/^\//, "").replaceAll("/", ".");
  let message = error.message;
  if (error.keyword === "pattern" && error.params.pattern === "\\S") message = "must not be blank";
  if (error.keyword === "not") message = "options are not allowed on a true/false question";
  if (error.keyword === "additionalProperties") message += `: ${error.params.additionalProperty}`;
  if (error.keyword === "enum") message += `: ${error.params.allowedValues.join(", ")}`;
  return field ? `${field} ${message}` : message;
}

function schemaProblems(file, errors, problem) {
  const seen = new Set();
  for (const error of errors) {
    if (error.keyword === "if") continue; // repeats the error from the matching branch
    const match = /^\/questions\/(\d+)(\/.*)?$/.exec(error.instancePath);
    const question = match ? Number(match[1]) + 1 : null;
    const message = describe(error, match ? (match[2] ?? "") : error.instancePath);
    const key = `${question}:${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problem(file, question, "schema", message);
  }
}

export function formatProblem({ file, question, rule, message }) {
  const where = question === null ? "" : `question ${question}: `;
  return `${file}: ${where}${message} [${rule}]`;
}

export async function validateAll({ root }) {
  const ajv = new Ajv2020({ allErrors: true });
  const checkConfig = ajv.compile(await loadSchema("config-schema.json"));
  const checkExam = ajv.compile(await loadSchema("exam-schema.json"));
  const problems = [];
  const exams = [];
  const problem = (file, question, rule, message) => problems.push({ file, question, rule, message });

  // 1. The config comes first; the exam checks need it.
  let config;
  try {
    config = parseJson(await readFile(path.join(root, CONFIG_FILE), "utf8"));
  } catch (error) {
    problem(CONFIG_FILE, null, "config-parse", `not valid JSON: ${error.message.replace(/\s+/g, " ")}`);
    return { problems, config: null, exams, checked: 1 };
  }
  if (!checkConfig(config)) {
    for (const error of checkConfig.errors) {
      problem(CONFIG_FILE, null, "config-schema", describe(error, error.instancePath));
    }
  } else {
    for (const [kind, values] of [
      ["semester id", config.semesters.map((s) => s.id)],
      ["course code", config.courses.map((c) => c.code)],
    ]) {
      const duplicates = values.filter((value, i) => values.indexOf(value) !== i);
      for (const value of new Set(duplicates)) {
        problem(CONFIG_FILE, null, "config-duplicate", `duplicate ${kind} "${value}"`);
      }
    }
  }
  if (problems.length > 0) return { problems, config: null, exams, checked: 1 };

  // 2. Every entry in data/exams/, except names starting with "." (such as .gitkeep).
  let entries = [];
  try {
    entries = await readdir(path.join(root, EXAMS_DIR), { withFileTypes: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const names = entries
    .map((entry) => ({ name: entry.name, isFile: entry.isFile() }))
    .filter(({ name }) => !name.startsWith("."))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const courses = new Set(config.courses.map((c) => c.code));
  const semesters = new Set(config.semesters.map((s) => s.id));

  for (const { name, isFile } of names) {
    const file = `${EXAMS_DIR}/${name}`;
    const before = problems.length;
    if (!isFile || !name.endsWith(".json")) {
      problem(file, null, "stray-file", "only .json files are allowed in data/exams");
      continue;
    }
    if (!FILE_NAME.test(name)) {
      problem(file, null, "file-name", "file name must be lowercase letters, digits and single hyphens, ending in .json");
      continue;
    }
    let data;
    try {
      data = parseJson(await readFile(path.join(root, file), "utf8"));
    } catch (error) {
      problem(file, null, "json-parse", `not valid JSON: ${error.message.replace(/\s+/g, " ")}`);
      continue;
    }
    if (!checkExam(data)) {
      schemaProblems(file, checkExam.errors, problem);
      continue;
    }
    // 3. Rules the schema cannot express.
    if (!courses.has(data.course)) problem(file, null, "unknown-course", `course "${data.course}" is not in config.json`);
    if (!semesters.has(data.semester)) problem(file, null, "unknown-semester", `semester "${data.semester}" is not in config.json`);
    if (!isRealDate(data.date)) problem(file, null, "invalid-date", `date "${data.date}" is not a real calendar date`);
    data.questions.forEach((q, i) => {
      if (q.type !== "mc") return;
      const index = q.correct.charCodeAt(0) - "A".charCodeAt(0);
      if (index >= q.options.length) {
        problem(file, i + 1, "correct-out-of-range", `correct answer "${q.correct}" but only ${q.options.length} options`);
      }
    });
    if (problems.length === before) exams.push({ id: name.slice(0, -".json".length), file, data });
  }

  return { problems, config, exams, checked: names.length + 1 };
}
