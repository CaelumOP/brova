// Home page: semesters > courses > exam cards, with each exam's last score.
import {
  LoadError, bilingualName, el, emptyState, fetchJson, icon, installErrorHandlers, loadState, showBanner, updateState,
} from "./common.js?v=__BUILD__";

installErrorHandlers();
const main = document.getElementById("main");

start();

async function start() {
  let manifest;
  try {
    manifest = await fetchJson("data/manifest.json");
  } catch (error) {
    if (!(error instanceof LoadError)) throw error;
    main.replaceChildren();
    if (error.kind === "network") showBanner("Could not reach the site. Check your connection.");
    else showBanner(`Could not load the exam list${error.status ? ` (${error.status})` : ""}`, { url: error.url });
    return;
  }
  render(manifest);
  renderBadges(manifest);
  // The Back button can restore this page from the browser's cache without
  // running any script, so redraw the badges from saved state when that happens.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) renderBadges(manifest);
  });
}

function examLink(id) {
  return `exam.html?${new URLSearchParams({ id })}`;
}

function render(manifest) {
  const heading = el("h1", {}, "Practice exams");
  if (manifest.exams.length === 0) {
    main.replaceChildren(heading);
    showBanner("No exams yet.", { kind: "notice" });
    return;
  }

  const sections = manifest.semesters
    .filter((semester) => manifest.exams.some((e) => e.semester === semester.id))
    .map((semester) => {
      const groups = manifest.courses
        .map((course) => ({ course, exams: manifest.exams.filter((e) => e.semester === semester.id && e.course === course.code) }))
        .filter((group) => group.exams.length > 0)
        .map(({ course, exams }) =>
          el("section", { class: "course", id: `c-${semester.id}-${course.code}` },
            el("h2", {}, bilingualName(course.name.en, course.name.ar)),
            el("ul", { class: "cards" }, exams.map((exam) => el("li", {}, examCard(exam))))));
      const summary = el("summary", {}, el("span", {}, semester.name), icon("chevron-down", 18));
      const details = el("details", { class: "semester", id: `s-${semester.id}`, "data-semester": semester.id }, summary, groups);
      // Save on the summary's click (also fired by Enter and Space), not on the
      // toggle event, which also fires later for sections opened from code.
      summary.addEventListener("click", () => {
        if (!details.open) updateState((s) => ({ ...s, lastSemester: semester.id }));
      });
      return details;
    });

  const clear = el("button", { type: "button", class: "button-secondary", onclick: () => clearScores(manifest) }, "Clear my scores");
  main.replaceChildren(heading, ...sections, el("p", { class: "clear-scores" }, clear));
  openSemester(sections);
}

function examCard(exam) {
  return el("a", { class: "card", href: examLink(exam.id), "data-exam": exam.id },
    el("span", { class: "card-line" },
      el("span", { class: "card-title" }, exam.title),
      el("span", { class: "card-badge" })),
    exam.description ? el("span", { class: "card-description" }, exam.description) : null,
    el("span", { class: "bar card-bar", hidden: true }, el("span", { class: "bar-fill" })),
    el("span", { class: "card-meta" }, [`${exam.questionCount} Q`, ...exam.topics].join(" · ")));
}

function openSemester(sections) {
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  const fromLink = target?.closest("details.semester");
  if (fromLink) {
    // A breadcrumb link: open only that semester, remember it, and scroll to the target.
    fromLink.open = true;
    updateState((s) => ({ ...s, lastSemester: fromLink.dataset.semester }));
    target.scrollIntoView();
    return;
  }
  const { lastSemester } = loadState();
  const remembered = sections.find((d) => d.dataset.semester === lastSemester);
  (remembered ?? sections[0]).open = true;
}

function renderBadges(manifest) {
  const { scores } = loadState();
  for (const exam of manifest.exams) {
    const card = main.querySelector(`[data-exam="${exam.id}"]`);
    if (!card) continue;
    const badge = card.querySelector(".card-badge");
    const bar = card.querySelector(".card-bar");
    const score = scores[exam.id];
    if (!score) {
      badge.className = "card-badge not-taken";
      badge.replaceChildren("Not taken");
      bar.hidden = true;
      continue;
    }
    const percent = score.total === 0 ? 0 : Math.round((100 * score.correct) / score.total);
    const older = score.hash !== exam.hash;
    badge.className = older ? "card-badge older" : "card-badge";
    badge.replaceChildren(
      el("span", { class: "visually-hidden" }, "Last score "),
      `${percent}%`,
      ...(older ? [el("span", { class: "older-label" }, " (older version)")] : []),
    );
    bar.hidden = false;
    bar.classList.toggle("older", older);
    bar.firstElementChild.style.width = `${percent}%`;
  }
}

function clearScores(manifest) {
  if (!window.confirm("Clear all saved scores and the remembered semester?")) return;
  updateState(() => emptyState());
  renderBadges(manifest);
}
