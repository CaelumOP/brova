import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXAM_ID_PATTERN, emptyState, errorReportUrl, loadState, questionReportUrl, truncate, updateState,
} from "../js/common.js";

test("EXAM_ID_PATTERN accepts real IDs and rejects unsafe ones", () => {
  assert.ok(EXAM_ID_PATTERN.test("sec3302-midterm-first-2026-27"));
  for (const bad of ["", "../x", "a--b", "-a", "a-", "A1", "<img src=x>"]) {
    assert.equal(EXAM_ID_PATTERN.test(bad), false, bad);
  }
});

function fakeStorage(initial) {
  const data = new Map(initial === undefined ? [] : [["brova", initial]]);
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    raw: () => data.get("brova"),
  };
}

test("loadState returns the empty state for bad or missing data", () => {
  assert.deepEqual(loadState(fakeStorage()), emptyState());
  assert.deepEqual(loadState(fakeStorage("{not json")), emptyState());
  assert.deepEqual(loadState(fakeStorage(JSON.stringify({ schemaVersion: 2, lastSemester: null, scores: {} }))), emptyState());
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(loadState(throwing), emptyState());
});

test("a valid state round-trips through updateState", () => {
  const storage = fakeStorage();
  const saved = updateState((s) => ({ ...s, lastSemester: "first-2026-27" }), storage);
  assert.equal(saved.lastSemester, "first-2026-27");
  assert.deepEqual(loadState(storage), saved);
});

test("two updateState calls in a row keep both changes", () => {
  const storage = fakeStorage();
  const score = (id) => (s) => ({ ...s, scores: { ...s.scores, [id]: { correct: 1, total: 2, at: "2026-11-03T00:00:00Z", hash: "abcd1234" } } });
  updateState(score("exam-x"), storage);
  updateState(score("exam-y"), storage);
  assert.deepEqual(Object.keys(loadState(storage).scores).sort(), ["exam-x", "exam-y"]);
});

test("updateState still returns the new state when storage throws", () => {
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const next = updateState((s) => ({ ...s, lastSemester: "x" }), throwing);
  assert.equal(next.lastSemester, "x");
});

const bodyOf = (url) => new URL(url).searchParams.get("body");
const titleOf = (url) => new URL(url).searchParams.get("title");

test("questionReportUrl encodes text and follows the template", () => {
  const url = questionReportUrl({
    examId: "sec3302-quiz", hash: "abcd1234", number: 7, questionText: 'Is "A & B" <safe>?',
    myAnswer: "B) Drops & logs", markedCorrect: "A) Allows", pageUrl: "https://caelumop.github.io/brova/exam.html?id=sec3302-quiz",
  });
  assert.ok(url.startsWith("https://github.com/CaelumOP/brova/issues/new?"));
  assert.ok(!url.includes(" ") && !url.includes("<"));
  assert.equal(titleOf(url), "Report: sec3302-quiz Q7");
  assert.equal(bodyOf(url), [
    "Exam: sec3302-quiz (version abcd1234)",
    'Question 7: Is "A & B" <safe>?',
    "My answer: B) Drops & logs",
    "Marked correct: A) Allows",
    "Page: https://caelumop.github.io/brova/exam.html?id=sec3302-quiz",
    "",
    "Reason:",
  ].join("\n"));
});

test("questionReportUrl leaves out Marked correct before grading", () => {
  const url = questionReportUrl({ examId: "x", hash: "h", number: 1, questionText: "Q", myAnswer: "Not answered", pageUrl: "p" });
  assert.ok(!bodyOf(url).includes("Marked correct"));
  assert.ok(bodyOf(url).includes("My answer: Not answered"));
});

test("question text is capped at exactly 500 characters including the …", () => {
  const url = questionReportUrl({ examId: "x", hash: "h", number: 1, questionText: "q".repeat(800), myAnswer: "True", pageUrl: "p" });
  const line = bodyOf(url).split("\n")[1].slice("Question 1: ".length);
  assert.equal(line.length, 500);
  assert.ok(line.endsWith("…"));
  assert.equal(truncate("short", 500), "short");
});

test("errorReportUrl caps the stack and leaves out missing lines", () => {
  const full = errorReportUrl({ message: "boom", source: "js/exam.js", line: 3, column: 9, stack: "s".repeat(2000), pageUrl: "p", userAgent: "UA" });
  const lines = bodyOf(full).split("\n");
  assert.deepEqual(lines.map((l) => l.split(":")[0]), ["Page", "Message", "Source", "Stack", "Browser"]);
  assert.equal(lines[3].length, "Stack: ".length + 1500);
  assert.equal(titleOf(full), "Error: boom");

  const bare = errorReportUrl({ message: { toString: () => "odd reason" }, pageUrl: "p", userAgent: "UA" });
  assert.deepEqual(bodyOf(bare).split("\n"), ["Page: p", "Message: odd reason", "Browser: UA"]);
});
