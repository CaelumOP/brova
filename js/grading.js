// Grading. Pure functions: no DOM, so Node tests can import them.

export function letterToIndex(letter) {
  return letter.charCodeAt(0) - "A".charCodeAt(0);
}

const percentOf = (correct, total) => (total === 0 ? 0 : Math.round((100 * correct) / total));

// `answer` is an option index (mc), true/false (tf), or null when unanswered.
export function gradeQuestion(question, answer) {
  const correctAnswer = question.type === "mc" ? letterToIndex(question.correct) : question.correct;
  const status = answer === null ? "unanswered" : answer === correctAnswer ? "correct" : "incorrect";
  return { status, correctAnswer };
}

// `answers` is an array by position, the same length as `questions`.
export function gradeExam(questions, answers) {
  const results = questions.map((q, i) => gradeQuestion(q, answers[i]));
  const count = (status) => results.filter((r) => r.status === status).length;
  const topics = new Map();
  questions.forEach((q, i) => {
    const tally = topics.get(q.topic) ?? { topic: q.topic, correct: 0, total: 0 };
    tally.total += 1;
    if (results[i].status === "correct") tally.correct += 1;
    topics.set(q.topic, tally);
  });
  const correct = count("correct");
  return {
    correct,
    incorrect: count("incorrect"),
    unanswered: count("unanswered"),
    total: questions.length,
    percent: percentOf(correct, questions.length),
    byTopic: [...topics.values()].map((t) => ({ ...t, percent: percentOf(t.correct, t.total) })),
    results,
  };
}
