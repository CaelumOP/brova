// Keeps prompts/generate-exam.md in step with the schema and config, and checks
// that its worked example passes validation (Phase 6 exit check).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateAll } from "../scripts/lib/validate-exams.js";

const read = async (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const prompt = await read("prompts/generate-exam.md");
const jsonBlocks = [...prompt.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]));

test("the prompt's schema matches data/exam-schema.json", async () => {
  assert.deepEqual(jsonBlocks[0], JSON.parse(await read("data/exam-schema.json")));
});

test("the prompt lists every course code and semester ID in config.json", async () => {
  const config = JSON.parse(await read("data/config.json"));
  for (const course of config.courses) assert.ok(prompt.includes(`\`${course.code}\``), course.code);
  for (const semester of config.semesters) assert.ok(prompt.includes(`\`${semester.id}\``), semester.id);
});

test("the prompt's worked example passes validation", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "brova-prompt-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "data", "exams"), { recursive: true });
  await writeFile(path.join(root, "data", "config.json"), await read("data/config.json"));
  await writeFile(path.join(root, "data", "exams", "sec3302-practice-2-first-2026-27.json"), JSON.stringify(jsonBlocks[1]));
  const { problems, exams } = await validateAll({ root });
  assert.deepEqual(problems, []);
  assert.equal(exams.length, 1);
});
