import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite, contentHash } from "../scripts/lib/build-site.js";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}/`, import.meta.url));

test("builds the valid root into outDir", async (t) => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "brova-build-"));
  t.after(() => rm(outDir, { recursive: true, force: true }));

  const result = await buildSite({ root: fixture("valid"), outDir, stamp: "abc1234" });
  assert.deepEqual(result, { exams: 2, problems: [] });

  const manifest = JSON.parse(await readFile(path.join(outDir, "data", "manifest.json"), "utf8"));
  assert.deepEqual(manifest.semesters.map((s) => s.id), ["first-2026-27"]);
  assert.deepEqual(manifest.courses.map((c) => c.code), ["SEC3302", "CS3019"]);
  // Sorted by course in config order: SEC3302 before CS3019.
  assert.deepEqual(manifest.exams.map((e) => e.id), ["sec3302-quiz-1", "cs3019-quiz-1"]);
  const [first] = manifest.exams;
  assert.deepEqual(Object.keys(first), [
    "id", "title", "course", "semester", "description", "date", "questionCount", "topics", "hash",
  ]);
  assert.equal(first.questionCount, 2);
  assert.deepEqual(first.topics, ["Firewalls", "Attacks"]);
  assert.match(first.hash, /^[0-9a-f]{8}$/);

  const app = await readFile(path.join(outDir, "js", "app.js"), "utf8");
  assert.ok(app.includes("abc1234") && !app.includes("__BUILD__"));
  const index = await readFile(path.join(outDir, "index.html"), "utf8");
  assert.ok(index.includes("app.js?v=abc1234") && !index.includes("__BUILD__"));

  for (const absent of ["scripts", "tests", "prompts", "docs", "node_modules", "fonts/.gitkeep", "data/exams/.gitkeep"]) {
    assert.equal(existsSync(path.join(outDir, absent)), false, `${absent} should not be copied`);
  }
  assert.ok(existsSync(path.join(outDir, "data", "exams", "sec3302-quiz-1.json")));
});

test("sorts exams within a course newest first, then by title", async (t) => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "brova-build-"));
  t.after(() => rm(outDir, { recursive: true, force: true }));
  await buildSite({ root: fixture("valid"), outDir, stamp: "x" });
  const { exams } = JSON.parse(await readFile(path.join(outDir, "data", "manifest.json"), "utf8"));
  for (let i = 1; i < exams.length; i++) {
    if (exams[i].course === exams[i - 1].course) assert.ok(exams[i].date <= exams[i - 1].date);
  }
});

test("the content hash changes when one explanation changes", () => {
  const questions = [{ type: "tf", topic: "T", question: "Q", correct: true, explanation: "E" }];
  const changed = [{ ...questions[0], explanation: "E2" }];
  assert.notEqual(contentHash(questions), contentHash(changed));
  assert.equal(contentHash(questions), contentHash(structuredClone(questions)));
});

test("an invalid root returns problems and leaves outDir alone", async () => {
  const outDir = path.join(os.tmpdir(), `brova-never-${Date.now()}`);
  const result = await buildSite({ root: fixture("invalid-exams"), outDir, stamp: "x" });
  assert.equal(result.exams, 0);
  assert.ok(result.problems.length > 0);
  assert.equal(existsSync(outDir), false);
});
