import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { formatProblem, validateAll } from "../scripts/lib/validate-exams.js";

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}/`, import.meta.url));

test("the valid root has no problems and ignores .gitkeep", async () => {
  const { problems, exams, checked } = await validateAll({ root: fixture("valid") });
  assert.deepEqual(problems, []);
  assert.deepEqual(exams.map((e) => e.id).sort(), ["cs3019-quiz-1", "sec3302-quiz-1"]);
  assert.equal(checked, 3);
});

test("each invalid exam reports its own rule", async () => {
  const { problems, exams } = await validateAll({ root: fixture("invalid-exams") });
  const expected = {
    "stray.txt": ["stray-file", null],
    "Bad_Name.json": ["file-name", null],
    "json-parse.json": ["json-parse", null],
    "schema-missing-explanation.json": ["schema", 1],
    "schema-unknown-type.json": ["schema", 1],
    "schema-unknown-code-language.json": ["schema", 1],
    "schema-code-language-without-code.json": ["schema", 1],
    "schema-whitespace-topic.json": ["schema", 1],
    "schema-tf-with-options.json": ["schema", 1],
    "schema-misspelled-field.json": ["schema", 1],
    "schema-mc-number-answer.json": ["schema", 1],
    "schema-duplicate-options.json": ["schema", 1],
    "unknown-course.json": ["unknown-course", null],
    "unknown-semester.json": ["unknown-semester", null],
    "invalid-date.json": ["invalid-date", null],
    "correct-out-of-range.json": ["correct-out-of-range", 2],
  };
  for (const [name, [rule, question]] of Object.entries(expected)) {
    const found = problems.filter((p) => p.file === `data/exams/${name}`);
    assert.ok(found.length > 0, `${name} reported nothing`);
    for (const p of found) {
      assert.equal(p.rule, rule, `${name}: ${p.message}`);
      assert.equal(p.question, question, `${name}: ${p.message}`);
    }
  }
  assert.equal(new Set(problems.map((p) => p.file)).size, Object.keys(expected).length);
  assert.deepEqual(exams, []);
});

test("schema messages name the field that is wrong", async () => {
  const { problems } = await validateAll({ root: fixture("invalid-exams") });
  const message = (name) => problems.find((p) => p.file === `data/exams/${name}`).message;
  assert.match(message("schema-misspelled-field.json"), /explantion/);
  assert.match(message("schema-unknown-type.json"), /type .*mc, tf/);
  assert.match(message("schema-tf-with-options.json"), /not allowed on a true\/false question/);
});

for (const rule of ["config-parse", "config-schema", "config-duplicate"]) {
  test(`config rule ${rule}`, async () => {
    const { problems, config } = await validateAll({ root: fixture(`invalid-config/${rule}`) });
    assert.ok(problems.length > 0);
    assert.ok(problems.every((p) => p.rule === rule && p.file === "data/config.json"));
    assert.equal(config, null);
  });
}

test("formatProblem prints the file, question, message, and rule", () => {
  assert.equal(
    formatProblem({ file: "data/exams/x.json", question: 3, rule: "correct-out-of-range", message: 'correct answer "E" but only 4 options' }),
    'data/exams/x.json: question 3: correct answer "E" but only 4 options [correct-out-of-range]',
  );
  assert.equal(
    formatProblem({ file: "data/config.json", question: null, rule: "config-duplicate", message: 'duplicate course code "SEC3302"' }),
    'data/config.json: duplicate course code "SEC3302" [config-duplicate]',
  );
});
