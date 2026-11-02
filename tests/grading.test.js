import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeExam, gradeQuestion, letterToIndex } from "../js/grading.js";

const mc = (topic, correct) => ({ type: "mc", topic, question: "Q", options: ["a", "b", "c", "d", "e", "f"], correct, explanation: "E" });
const tf = (topic, correct) => ({ type: "tf", topic, question: "Q", correct, explanation: "E" });

test('"A"–"F" map to 0–5', () => {
  assert.deepEqual(["A", "B", "C", "D", "E", "F"].map(letterToIndex), [0, 1, 2, 3, 4, 5]);
});

test("gradeQuestion handles mc, tf keyed true and false, and unanswered", () => {
  assert.deepEqual(gradeQuestion(mc("T", "C"), 2), { status: "correct", correctAnswer: 2 });
  assert.deepEqual(gradeQuestion(mc("T", "C"), 0), { status: "incorrect", correctAnswer: 2 });
  assert.deepEqual(gradeQuestion(tf("T", true), true), { status: "correct", correctAnswer: true });
  assert.deepEqual(gradeQuestion(tf("T", false), false), { status: "correct", correctAnswer: false });
  assert.deepEqual(gradeQuestion(tf("T", false), true), { status: "incorrect", correctAnswer: false });
  assert.deepEqual(gradeQuestion(tf("T", true), null), { status: "unanswered", correctAnswer: true });
});

const exam = [mc("Firewalls", "A"), tf("Firewalls", true), mc("Attacks", "B")];

test("all correct, all wrong, and all unanswered", () => {
  const right = gradeExam(exam, [0, true, 1]);
  assert.deepEqual([right.correct, right.incorrect, right.unanswered, right.total, right.percent], [3, 0, 0, 3, 100]);
  const wrong = gradeExam(exam, [1, false, 0]);
  assert.deepEqual([wrong.correct, wrong.incorrect, wrong.unanswered, wrong.percent], [0, 3, 0, 0]);
  const blank = gradeExam(exam, [null, null, null]);
  assert.deepEqual([blank.correct, blank.incorrect, blank.unanswered, blank.percent], [0, 0, 3, 0]);
});

test("counts add up and results follow question order", () => {
  const r = gradeExam(exam, [0, null, 3]);
  assert.equal(r.correct + r.incorrect + r.unanswered, r.total);
  assert.deepEqual(r.results.map((x) => x.status), ["correct", "unanswered", "incorrect"]);
});

test("byTopic keeps first-appearance order with totals and percents", () => {
  const r = gradeExam(exam, [0, false, 1]);
  assert.deepEqual(r.byTopic, [
    { topic: "Firewalls", correct: 1, total: 2, percent: 50 },
    { topic: "Attacks", correct: 1, total: 1, percent: 100 },
  ]);
});

test("percent rounds: 2/3 → 67, 1/3 → 33, and a total of 0 → 0", () => {
  const three = [tf("T", true), tf("T", true), tf("T", true)];
  assert.equal(gradeExam(three, [true, true, false]).percent, 67);
  assert.equal(gradeExam(three, [true, false, false]).percent, 33);
  assert.equal(gradeExam([], []).percent, 0);
});
