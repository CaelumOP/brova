import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { checkSource } from "../scripts/lib/check-source.js";

const root = fileURLToPath(new URL("./fixtures/source/", import.meta.url));

test("each violating file reports its rule, and clean files report nothing", async () => {
  const problems = await checkSource({ root });
  const found = problems.map((p) => `${p.file}:${p.line}:${p.rule}`).sort();
  assert.deepEqual(found, [
    "bad.html:4:absolute-path",
    "bad.html:7:forbidden-html-api",
    "bad.html:8:missing-build-stamp",
    "js/bad-absolute.js:1:absolute-path",
    "js/bad-html-api.js:2:forbidden-html-api",
    "js/bad-import.js:1:missing-build-stamp",
  ]);
});

test("the repository itself passes", async () => {
  const repo = fileURLToPath(new URL("../", import.meta.url));
  assert.deepEqual(await checkSource({ root: repo }), []);
});
