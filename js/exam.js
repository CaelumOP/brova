// Exam page: renders one exam, grades it, saves the score, and builds report links.
import {
  EXAM_ID_PATTERN, LoadError, bilingualName, el, fetchJson, installErrorHandlers, questionReportUrl, showBanner, updateState,
} from "./common.js?v=__BUILD__";
import { gradeExam, letterToIndex } from "./grading.js?v=__BUILD__";
import { tokenize } from "./syntax.js?v=__BUILD__";

installErrorHandlers();
const main = document.getElementById("main");
const params = new URLSearchParams(location.search);
const examId = params.get("id") ?? "";
const debug = params.get("debug") === "true";

// The one state object: the manifest entry, the exam, the answers by position
// (option index, true/false, or null), and the grading result once graded.
const state = { entry: null, exam: null, answers: [], result: null };
// DOM references, filled in by render().
const ui = { title: null, summary: null, mainButton: null, legend: null, questions: [], mapLinks: [] };

start();

async function start() {
  if (!EXAM_ID_PATTERN.test(examId)) {
    main.replaceChildren(el("p", {}, el("a", { href: "index.html" }, "Go to the home page")));
    showBanner("Invalid exam link", { kind: "notice" });
    return;
  }

  let manifest;
  try {
    [manifest, state.exam] = await Promise.all([fetchJson("data/manifest.json"), fetchJson(`data/exams/${examId}.json`)]);
  } catch (error) {
    if (!(error instanceof LoadError)) throw error;
    main.replaceChildren();
    if (error.kind === "network") showBanner("Could not reach the site. Check your connection.");
    else {
      const what = error.url.endsWith("manifest.json") ? "the exam list" : "this exam";
      showBanner(`Could not load ${what}${error.status ? ` (${error.status})` : ""}`, { url: error.url });
    }
    return;
  }

  state.entry = manifest.exams.find((e) => e.id === examId) ?? null;
  const course = manifest.courses.find((c) => c.code === state.exam.course);
  const semester = manifest.semesters.find((s) => s.id === state.exam.semester);
  if (!state.entry || !course || !semester) {
    main.replaceChildren();
    showBanner("Could not load this exam. Reload the page.");
    return;
  }
  updateState((s) => ({ ...s, lastSemester: semester.id }));
  state.answers = state.exam.questions.map(() => null);

  try {
    render(manifest, course, semester);
  } catch (error) {
    main.replaceChildren();
    showBanner("This exam could not be displayed", { reportError: { message: error.message, stack: error.stack } });
  }
}

// ---- Text helpers ----

function letterOf(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function answerText(question, answer) {
  if (answer === null) return "Not answered";
  if (question.type === "tf") return answer ? "True" : "False";
  return `${letterOf(answer)}) ${question.options[answer]}`;
}

// ---- Rendering ----

function render(manifest, course, semester) {
  const { exam } = state;
  document.title = `${exam.title} — Brova · بروفة`;

  const crumb = (child, last = false) => el("li", {}, child, last ? null : el("span", { class: "crumb-sep", "aria-hidden": "true" }, " / "));
  const breadcrumb = el("nav", { "aria-label": "Breadcrumb", class: "breadcrumb" },
    el("ol", {},
      crumb(el("a", { href: "index.html" }, "Home")),
      crumb(el("a", { href: `index.html#s-${semester.id}` }, semester.name)),
      crumb(el("a", { href: `index.html#c-${semester.id}-${course.code}` }, course.code)),
      crumb(el("span", { "aria-current": "page" }, exam.title), true)));

  ui.title = el("h1", { tabindex: "-1" }, exam.title);
  const header = el("header", { class: "exam-header" },
    breadcrumb,
    ui.title,
    el("p", { class: "exam-course" }, bilingualName(course.name.en, course.name.ar)),
    el("p", { class: "exam-meta" }, [exam.description, `${exam.questions.length} questions.`].filter(Boolean).join(" ")));

  ui.summary = el("section", { class: "summary", hidden: true, "aria-labelledby": "summary-heading" });

  const questions = el("div", { class: "questions" }, exam.questions.map((q, i) => renderQuestion(q, i)));
  const side = el("div", { class: "side" }, renderMap(), renderNextCard(manifest));
  main.replaceChildren(header, ui.summary, el("div", { class: "exam-layout" }, questions, side));
}

function renderQuestion(question, index) {
  const number = index + 1;
  const status = el("span", { class: "status", hidden: true });
  const explanation = el("div", { class: "explanation", hidden: true },
    el("strong", { class: "why" }, "Why:"), " ", question.explanation);
  const report = el("a", {
    class: "report", target: "_blank", rel: "noopener", hidden: true,
    "aria-label": `Report question ${number}`, title: `Report question ${number}`,
  }, "Report");

  const values = question.type === "tf" ? [true, false] : question.options.map((_, i) => i);
  const rows = values.map((value) => {
    const input = el("input", {
      type: "radio", name: `q-${number}`, value: String(value),
      onchange: () => choose(index, value),
    });
    const label = question.type === "tf"
      ? [el("span", { class: "option-text" }, value ? "True" : "False")]
      : [el("span", { class: "chip" }, letterOf(value)), el("span", { class: "option-text" }, question.options[value])];
    const end = el("span", { class: "end-label" });
    return { value, input, end, row: el("label", { class: "option" }, input, label, end) };
  });

  const code = question.code
    ? el("div", { class: "code" },
        el("div", { class: "code-bar" }, el("span", { class: "code-label" }, question.codeLanguage ?? "code")),
        el("pre", { dir: "ltr" }, el("code", {},
          tokenize(question.code, question.codeLanguage).map((t) =>
            t.type === "plain" ? t.text : el("span", { class: `syn-${t.type}` }, t.text)))))
    : null;

  const fieldset = el("fieldset", { class: "question", id: `q-${number}` },
    el("legend", {},
      el("span", { class: "eyebrow" }, `Q${number} · ${question.topic}`),
      el("span", { class: "question-text" }, question.question)),
    el("div", { class: "question-status" }, status),
    code,
    el("div", { class: `options options-${question.type}` }, rows.map((r) => r.row)),
    explanation,
    report);

  ui.questions[index] = { status, explanation, report, rows };
  return fieldset;
}

function renderMap() {
  ui.mapLinks = state.exam.questions.map((_, i) =>
    el("a", { href: `#q-${i + 1}`, class: "map-square", "aria-label": `Question ${i + 1}, not answered` }, String(i + 1)));
  ui.legend = el("p", { class: "map-legend", hidden: true });
  ui.mainButton = el("button", { type: "button", class: "button-primary", onclick: () => (state.result ? retake() : grade()) }, "Check Answers");
  return el("aside", { class: "map", "aria-label": "Question map" },
    el("h2", { class: "eyebrow" }, "Questions"),
    el("div", { class: "map-grid" }, ui.mapLinks),
    ui.legend,
    ui.mainButton);
}

function renderNextCard(manifest) {
  const sameCourse = manifest.exams.filter((e) => e.course === state.exam.course && e.semester === state.exam.semester);
  const next = sameCourse[sameCourse.findIndex((e) => e.id === examId) + 1];
  if (!next) return null;
  return el("a", { class: "next-card", href: `exam.html?${new URLSearchParams({ id: next.id })}` },
    el("span", { class: "eyebrow" }, `Next in ${next.course}`),
    el("span", { class: "next-title" }, next.title),
    el("span", { class: "next-meta" }, `${next.questionCount} questions`));
}

// ---- Answering and reporting ----

function choose(index, value) {
  state.answers[index] = value;
  const link = ui.mapLinks[index];
  link.classList.add("answered");
  link.setAttribute("aria-label", `Question ${index + 1}, answered`);
  updateReport(index);
}

function updateReport(index) {
  const question = state.exam.questions[index];
  const { report } = ui.questions[index];
  const answer = state.answers[index];
  report.hidden = !state.result && answer === null;
  if (report.hidden) return;
  report.href = questionReportUrl({
    examId,
    hash: state.entry.hash,
    number: index + 1,
    questionText: question.question,
    myAnswer: answerText(question, answer),
    markedCorrect: state.result ? answerText(question, state.result.results[index].correctAnswer) : null,
    pageUrl: location.href,
  });
}

// ---- Grading ----

const STATUS_TEXT = { correct: "Correct", incorrect: "Incorrect", unanswered: "Not answered" };

function grade() {
  const { exam } = state;
  state.result = gradeExam(exam.questions, state.answers);
  const { result } = state;

  exam.questions.forEach((question, i) => {
    const { status, correctAnswer } = result.results[i];
    const q = ui.questions[i];
    q.status.hidden = false;
    q.status.className = `status status-${status}`;
    q.status.replaceChildren(STATUS_TEXT[status]);
    for (const row of q.rows) {
      row.input.disabled = true;
      const picked = row.value === state.answers[i];
      if (picked) {
        row.row.classList.add(status === "correct" ? "picked-correct" : "picked-wrong");
        row.end.replaceChildren("Your answer");
      } else if (row.value === correctAnswer) {
        row.row.classList.add("missed");
        row.end.replaceChildren("Correct answer");
      }
    }
    q.explanation.hidden = false;
    updateReport(i);

    const link = ui.mapLinks[i];
    link.classList.remove("answered");
    link.classList.add(`map-${status}`);
    link.setAttribute("aria-label", `Question ${i + 1}, ${STATUS_TEXT[status].toLowerCase()}`);
  });

  renderSummary(result);
  ui.legend.hidden = false;
  ui.legend.replaceChildren(`Correct ${result.correct} · Incorrect ${result.incorrect} · Not answered ${result.unanswered}`);
  ui.mainButton.replaceChildren("Retake this exam");
  ui.summary.querySelector("h2").focus();

  updateState((s) => ({
    ...s,
    scores: { ...s.scores, [examId]: { correct: result.correct, total: result.total, at: new Date().toISOString(), hash: state.entry.hash } },
  }));

  if (debug) {
    console.table(exam.questions.map((question, i) => ({
      number: i + 1,
      expected: answerText(question, result.results[i].correctAnswer),
      given: answerText(question, state.answers[i]),
      result: result.results[i].status,
    })));
  }
}

function bar(percent, label) {
  const fill = el("span", { class: "bar-fill" });
  fill.style.width = `${percent}%`;
  return el("span", { class: "bar", ...(label ? { role: "img", "aria-label": label } : {}) }, fill);
}

function renderSummary(result) {
  ui.summary.hidden = false;
  ui.summary.replaceChildren(
    el("h2", { id: "summary-heading", class: "eyebrow", tabindex: "-1" }, "Your score"),
    el("p", { class: "score-line" },
      el("span", { class: "big-score" }, `${result.correct}/${result.total}`), " ",
      el("span", { class: "score-percent" }, `${result.percent}%`)),
    bar(result.percent, `${result.percent} percent correct`),
    el("ul", { class: "topics" }, result.byTopic.map((t) =>
      el("li", { class: "topic" },
        el("span", { class: "topic-name" }, t.topic),
        el("span", { class: "topic-count" }, `${t.correct}/${t.total}`, " ", el("span", { class: "topic-percent" }, `${t.percent}%`)),
        bar(t.percent)))));
}

function retake() {
  state.result = null;
  state.answers = state.exam.questions.map(() => null);
  ui.questions.forEach((q, i) => {
    q.status.hidden = true;
    q.status.replaceChildren();
    for (const row of q.rows) {
      row.input.checked = false;
      row.input.disabled = false;
      row.row.classList.remove("picked-correct", "picked-wrong", "missed");
      row.end.replaceChildren();
    }
    q.explanation.hidden = true;
    q.report.hidden = true;
    const link = ui.mapLinks[i];
    link.className = "map-square";
    link.setAttribute("aria-label", `Question ${i + 1}, not answered`);
  });
  ui.summary.hidden = true;
  ui.summary.replaceChildren();
  ui.legend.hidden = true;
  ui.mainButton.replaceChildren("Check Answers");
  window.scrollTo(0, 0);
  ui.title.focus({ preventScroll: true });
}
