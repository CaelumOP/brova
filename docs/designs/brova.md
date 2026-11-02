# Brova (بروفة) — Static Mock Exam Site

* **Author:** CaelumOP
* **Status:** Proposed, revised 2026-11-02 after two review rounds: EGM (a multi-reviewer design review in which separate AI reviewers each check one aspect) and an outside review by Gemini. The round-2 decisions are summarized in `concepts_brief.md`; the review reports themselves are kept by the author, outside the repository.
* **Date:** 2026-11-02

---

## Overview

Brova (بروفة, Arabic for "rehearsal") is a static website on GitHub Pages where CaelumOP, a university student and the site's only author, publishes AI-generated mock exams for their courses. In this document, "the author" always means CaelumOP and "students" means the classmates who take the exams.

Students pick a semester and course, choose an exam, answer multiple choice and true/false questions, and get per-question feedback with explanations, a score, and a per-topic breakdown. The site has no backend, no accounts, and no framework: it is plain HTML, CSS, and JavaScript that reads exam data from JSON files.

The interface and the exams are in English, the language the courses are tested in. The site name and course names are always shown in English and Arabic side by side.

The look (colors, fonts, spacing, and every component) is specified in [brova-ui.md](brova-ui.md).

## The Problem

Students preparing for exams want practice material in the format of the real test. Writing mock exams by hand is slow. Google Forms quiz mode grades automatically, but creating quizzes in bulk from files requires writing Apps Script, it does not show which topics a student is weak in, and the author cannot control the page layout or how code snippets are shown. The author wants to generate exams with AI, publish one by adding a JSON file to the repository and pushing, and give classmates a site that works on a phone (see [Goals](#goals)), checks answers, and shows which topics to review.

## Goals

* After clicking "Check Answers," a student sees for each question whether they were right, the correct answer, and an explanation.
* The score summary shows the total score and correct/total for each topic in the exam.
* The home page is organized as semester > course > exam and reopens the semester the student last opened.
* The author publishes an exam by saving one JSON file in `data/exams/` and pushing to `main`. A GitHub Action validates every exam, builds the exam list, and deploys.
* An exam that fails validation never reaches the live site. The deploy is blocked and the previous version stays online.
* On phones, there is no horizontal page scrolling at viewport widths of 320 CSS px and wider (code blocks may scroll inside their own box), and every interactive control has a tap area of at least 44×44 CSS px.
* Once a student has answered a question, a small "Report" control appears beside it; after grading, every question has one, including unanswered ones. It opens a pre-filled GitHub Issue so the student can flag a wrong answer key.

## Non-Goals

* **No user accounts.** Scores live only in each student's browser.
* **No timer.** This is practice, not pressure simulation.
* **No server-side code.** Everything runs in the browser or in the GitHub Action at deploy time.
* **No Arabic interface in v1.** The interface is English. Only the site name and course names show Arabic beside the English. An Arabic interface is in the v2 backlog.
* **No author review of every answer key.** The author does not check each AI-generated answer before publishing. Students can report wrong keys with the per-question Report control; keys nobody reports stay live. See [Risks & Mitigations](#risks--mitigations).
* **No light mode and no theme switcher.** The site is dark only, whatever the system setting is (author's decision, 2026-11-02).
* **No score history.** Only the last score per exam is stored.
* **No option shuffling.** Options keep their authored order on every attempt, so the letters in a report match the letters in the file.
* **No offline/PWA support.**
* **No private site.** The site, the answer keys inside the JSON files, and filed reports are public. Accepted by the author.

## Decisions Log

No open questions remain. These were open while the design was drafted; each is now decided.

* **OQ-1: UI design direction.** *Resolved 2026-11-02.* From three mockup directions (A "Clean," B "Dark & modern," C "Bright"; the canvas is linked from [brova-ui.md](brova-ui.md)), the author chose B and logo D, the Kufi wordmark. [brova-ui.md](brova-ui.md) records the tokens, fonts, spacing, and every component. The colors are taken from Open Props, an open-source set of CSS color values; the values are copied into `css/style.css`, and the Open Props file itself is not shipped (round-2 decision A1).
* **OQ-2: Official course names.** *Resolved 2026-11-02.* The author supplied the official English titles from the course list, and the table in [Configuration](#configuration) uses them (with "&" as written there). SEC3104's Arabic name uses the standard spelling with a hamza, الأمنية.
* **OQ-3: Favicon.** *Resolved 2026-11-02.* The wordmark is too wide for a browser tab, so the favicon is option 3 from the `B-Logo` mockup board, "Exam sheet": the white Kufi "ب" on a violet sheet whose top-right corner is folded over in lime, like a test paper. See [brova-ui.md](brova-ui.md#favicon).
* **OQ-4: Syntax highlighting.** *Resolved 2026-11-02.* A small hand-written tokenizer, `js/syntax.js`, instead of a library stored in the repository ([Alternative J](#alternative-j-a-highlighting-library-stored-in-the-repository)). Shell code gets full coloring; the other languages color only quoted text and numbers until an exam needs more (round-2 decision A2). The language comes from the optional question field `codeLanguage` ([Exam JSON](#exam-json)). See [Static Assets](#static-assets) and Phase 5, item 29.
* **OQ-5: Font hosting.** *Resolved 2026-11-02.* The fonts are self-hosted in `fonts/`; nothing loads from Google ([Alternative K](#alternative-k-load-fonts-from-google-fonts)). System fonts only was rejected because it would not match the mockups. See [Static Assets](#static-assets) and Phase 5, item 30.

## Critical User Journeys (CUJs)

### CUJ 1: Student Takes an Exam

* **Given**: A student opens the site. The home page lists semesters, newest first. The semester they last opened is expanded; on a first visit, the newest semester is. Inside it, each course that has exams lists its exam cards.
* **When**: They open an exam, answer the questions (multiple choice as radio buttons labeled A, B, C..., true/false as True and False, code snippets in a monospace block), and click "Check Answers."
* **Then**: Each question is marked "Correct" (green, check icon), "Incorrect" (red, X icon), or "Not answered" (counted as wrong). If the student missed the correct option, it is outlined in dashed lime with "Correct answer". Every question shows its explanation. A summary at the top shows "18/25 72%" and a tile per topic with correct/total and a percent. The question map beside the questions (under them on phones) marks each question number by result, with an icon as well as a color, and links to it. Keyboard focus moves to the summary. The score is saved in the browser, and when the student returns to the home page, including with the browser's Back button, that exam's card shows "72%".

### CUJ 2: Author Adds an Exam

* **Given**: The author has lecture notes for SEC3302 (Network Security).
* **When**: They give an AI the prompt template from `prompts/generate-exam.md` plus the notes, save the returned JSON as `data/exams/<id>.json` (for example `sec3302-midterm-first-2026-27.json`), optionally run `npm run validate`, and push to `main` from the command line or by uploading on github.com.
* **Then**: The Action runs "Unit tests," "Source checks," and "Validate and build," then deploys. When the run finishes, the exam appears under its semester and course.

### CUJ 3: Student Reports a Question

* **Given**: A student has selected an answer to question 7, or has graded the exam (an unanswered question can then be reported too).
* **When**: They click the Report control beside question 7.
* **Then**: A new tab opens GitHub's new-issue form in `CaelumOP/brova`, pre-filled with the exam ID, the exam's content hash, the question number and text, the student's answer (or "Not answered"), and, only if the exam has been graded, the marked correct answer, followed by a "Reason:" line. The student needs a GitHub account. The author is notified when the issue is submitted, if they watch the repository (the owner does by default).

### CUJ 4: An Exam Fails Validation

* **Given**: An AI-generated exam has a question with `"correct": "E"` but only four options, and another question with no `explanation`.
* **When**: The author pushes it.
* **Then**: The "Validate and build" step fails and prints one line per problem, each naming the file, the question number, the message, and a rule code. Nothing is deployed; the live site is unchanged. GitHub emails the author if Actions failure notifications are on (they are by default). Every later push also fails until the file is fixed or removed. This is deliberate (see [Risks & Mitigations](#risks--mitigations)). Running `npm run validate` before pushing prints the same lines.

---

## Technical Plan (Architecture)

### System Overview

1. **Content generation** (author, offline): an AI writes exam JSON from lecture material using `prompts/generate-exam.md`. The author does not review each answer key (see Non-Goals).
2. **Check, build, deploy** (GitHub Action, on every push to `main`), in four named steps:
   1. **Unit tests**.
   2. **Source checks**: no HTML-injection APIs, every local `.js` and `.css` reference (HTML `src`/`href` and JS imports) carries the build stamp, and no root-absolute paths.
   3. **Validate and build**: validation of the config and every exam, then a build of `_site/` with the manifest, per-exam content hashes, and the commit SHA stamped into asset links. One step runs both.
   4. **Deploy** to GitHub Pages.

   Any failure stops the run before deploy.
3. **Hosting** (GitHub Pages) serves `_site/` at `https://caelumop.github.io/brova/`.
4. **Browser**: two pages fetch JSON, render exams, grade answers, and keep the state described in [localStorage](#localstorage).

### Static Assets

Besides the two pages and their scripts, the site serves `css/style.css` (every color, spacing, and component style; color values taken from Open Props), `css/fonts.css` with self-hosted font files in `fonts/`, `favicon.svg` and `favicon.png`, and `js/syntax.js`, the code tokenizer. The full list, fonts, and weights are in [brova-ui.md](brova-ui.md#assets). Nothing is loaded from another domain.

```text
AUTHOR                                        STUDENT
======                                        =======

Lecture notes                                 Browser (phone or laptop)
     |                                             |
     v                                             v
AI + prompts/generate-exam.md                 index.html + js/app.js
     |                                             | fetch
     v                                             v
data/exams/<id>.json                          data/manifest.json
     |                                             |
     | git push / upload on github.com             | open exam
     v                                             v
GitHub Action (deploy.yml)                    exam.html?id=<id> + js/exam.js
  1. Unit tests          (npm test)                | fetch both
  2. Source checks       (npm run check)           v
  3. Validate and build  (npm run build)      manifest.json + data/exams/<id>.json
       any failure --> no deploy                   |
     | pass                                        | grade (js/grading.js)
     v                                             v
  4. Upload _site/, deploy to Pages           score + topic tiles + localStorage
                                              + Report control -> GitHub Issue
```

### Data Architecture

#### Exam JSON

The file name is the exam ID: `data/exams/<id>.json`. The ID must match `EXAM_ID_PATTERN`, `^[a-z0-9]+(-[a-z0-9]+)*$`. The suggested naming convention, `<course-code>-<exam-name>-<semester-id>` (for example `sec3302-midterm-first-2026-27`), is advisory and not checked. Because the ID is the file name, two exams cannot share an ID, and the JSON has no `id` field. Renaming an exam file changes its ID, so students' stored scores for it are lost and shared links break.

```text
<id>.json
├── title: string, non-empty
├── course: a course code listed in config.json (e.g. "SEC3302")
├── semester: a semester id listed in config.json (e.g. "first-2026-27")
├── description: string (may be empty)
├── date: "YYYY-MM-DD" (orders exams within a course, newest first)
└── questions: array, at least 1. A question's number is its 1-based position.
    └── question
        ├── type: "mc" | "tf"
        ├── topic: non-empty string (reuse the exact same string for the same topic)
        ├── question: non-empty string
        ├── code: optional non-empty string (shown as a left-to-right monospace block)
        ├── codeLanguage: optional, allowed only with code: "shell" | "python" | "c" |
        │                 "java" | "javascript" | "html" | "sql" (label and syntax colors)
        ├── options: 2 to 6 distinct non-empty strings (mc only; not allowed on tf)
        ├── correct: "A".."F" within the option count (mc) | true / false (tf)
        └── explanation: non-empty string
```

Letter keys map by position: `"A"` is `options[0]`, `"B"` is `options[1]`, and so on. "Non-empty" means the string contains at least one character that is not a space. `date` must be a real calendar date (`2026-02-31` is rejected). `codeLanguage` controls the label; only `shell` gets full coloring (see [Phase 5, item 29](#phase-5-styling)).

**Content hash.** For each exam, `build.js` computes the first 8 hexadecimal characters of the SHA-256 of `JSON.stringify(questions)`. The hash changes whenever any question, option, answer, or explanation changes.

#### Configuration

`data/config.json` is edited by hand and checked against `data/config-schema.json` on every build.

```text
config.json
├── semesters: [{ id, name }]                newest first; this order is the display order
└── courses:   [{ code, name: { en, ar } }]  display order inside a semester
```

| id | name |
| --- | --- |
| first-2026-27 | First Semester 2026/27 |

The academic year is in the ID so next year's first semester gets its own section.

| code | name.en | name.ar |
| --- | --- | --- |
| CS3019 | Design & Analysis of Algorithms | تصميم وتحليل الخوارزميات |
| SEC3104 | Security Risk Management | إدارة المخاطر الأمنية |
| SEC3204 | Software Security | أمن البرامج |
| SEC3205 | Web Development & Security | تطوير وأمن الويب |
| SEC3302 | Network Security | أمن الشبكات |

The English names are the official titles (OQ-2).

#### Manifest

`build.js` writes `_site/data/manifest.json`. It is never committed.

```text
manifest.json
├── semesters: [{ id, name }]                copied from config
├── courses:   [{ code, name: { en, ar } }]  copied from config
└── exams: [{ id, title, course, semester, description, date,
              questionCount, topics: string[], hash }]
```

`exams` is sorted by semester (config order), then course (config order), then date (newest first), then title (`localeCompare` with `"en"`). `topics` lists each exam's distinct topics in order of first appearance. The manifest has no `schemaVersion` or `generatedAt` field: the brief's N6 idea of a version check in the browser was dropped with the other browser re-checks (Post-Review decision 5), because the manifest and the scripts come from the same deploy.

#### localStorage

The site uses one key, `brova`:

```text
{
  schemaVersion: 1,
  lastSemester: semester id | null,
  scores: { <examId>: { correct, total, at: ISO timestamp, hash } }
}
```

* `loadState` reads the key inside try/catch. A missing key gives the empty state `{ schemaVersion: 1, lastSemester: null, scores: {} }`. Data that cannot be parsed, or that has a different `schemaVersion`, is replaced with the empty state. Migration code is added only when schema version 2 is introduced.
* **Every write goes through `updateState(fn)`**, which loads the key, applies the change, and saves it in one step. No page keeps its own copy of the state between writes, so a second tab or a page restored by the Back button cannot overwrite a newer score.
* If localStorage is unavailable (blocked or throwing), the site works without score badges or the remembered semester.
* A card shows "(older version)" after its score when the stored `hash` differs from the manifest's `hash`.
* Safari and other WebKit browsers delete this data after 7 days of use without a visit, and other projects on `caelumop.github.io` share it. Both are accepted risks; see [Risks & Mitigations](#risks--mitigations).

### Page Behavior

#### index.html (home)

1. Fetches `data/manifest.json`.
2. Renders the page heading "Practice exams", then one collapsible `<details>` section per semester that has exams, in config order, with `id="s-<semester id>"`. Inside each, one group per course that has exams, in config order, with `id="c-<semester id>-<course code>"`, headed by the bilingual course name. Exam cards follow manifest order.
3. **Which semester opens:**
   * If the URL hash names a semester section or course group (the breadcrumb links), only that semester is opened, it is saved as `lastSemester`, and the target is scrolled into view.
   * Otherwise `lastSemester` opens if it exists in the manifest, or else the first semester.
   * The student may open several sections. Opening one saves it as `lastSemester`; closing one saves nothing. The save happens on the summary's `click` (also fired by Enter and Space), not on the `toggle` event, which also fires later for sections opened from code.
4. Each card shows title, description, question count, and topics. If a score is stored, it shows an "N%" badge (read by screen readers as "Last score N%") with a score bar, followed by "(older version)" when hashes differ. If no score is stored, it shows "Not taken". The card links to `exam.html?id=<id>`.
5. **Badges are rendered after the first load, and again on `pageshow` when `event.persisted` is true** (the browser restored the page with the Back button without running its scripts), so a score saved on the exam page appears without a reload.
6. With no exams in the manifest, shows "No exams yet."
7. A "Clear my scores" button at the bottom calls `window.confirm("Clear all saved scores and the remembered semester?")`. On OK, it saves the empty state and re-renders the badges (every card shows "Not taken").
8. On a load failure, shows a banner (see [Error Handling](#error-handling)).

#### exam.html (exam)

1. Reads `id` from the URL. If it does not match `EXAM_ID_PATTERN`, shows "Invalid exam link" with a link home and fetches nothing.
2. Fetches the manifest and the exam with `Promise.all`. Any failure shows one banner.
3. Looks up the exam's manifest entry (for its hash), then the course name in `manifest.courses` by `exam.course` and the semester name in `manifest.semesters` by `exam.semester`. If the entry is missing (a rare stale-cache case, since both files are fetched with `no-cache`), it shows "Could not load this exam. Reload the page." and stops.
4. Saves the exam's semester as `lastSemester`.
5. Renders inside try/catch. If rendering throws, shows "This exam could not be displayed" with a "Report this error" link.
6. **Header**: a breadcrumb, then the exam title as the `h1` (`tabindex="-1"`), the bilingual course name, and the description. The breadcrumb is Home / {semester name} / {course code} / {exam title}, linking to `index.html`, `index.html#s-<semester id>`, and `index.html#c-<semester id>-<course code>`.
7. **Questions**: each question is a `fieldset` with `id="q-N"`.
   * The `legend` holds two lines: the eyebrow "Q{N} · {topic}" and the question text, so screen readers hear the number when entering the group.
   * An optional code block: a label bar showing `codeLanguage` (or "code" when it is missing) above a `<pre dir="ltr"><code>` colored by `js/syntax.js`.
   * Native radio buttons. A multiple-choice label is a letter chip ("A") followed by the option text; true/false labels are "True" and "False".
8. **Question map**: an `<aside aria-label="Question map">` in a side column (under the questions on narrow screens) with one numbered link per question to `#q-N`.
   * Before grading, it marks which questions have an answer and updates when a radio button changes.
   * After grading, each square shows correct, incorrect, or not answered with an icon as well as a color, and the map shows the three counts. Each link's accessible name includes the state ("Question 2, incorrect").
   * The map holds the main button: "Check Answers" before grading, "Retake this exam" after.
9. **Next-exam card**: in the same side column, below the map, a link to the next older exam in the same course and semester (the next one in manifest order, which is newest first), showing its title and question count. Hidden on the course's oldest exam.
10. **Report control**: a link (`<a target="_blank" rel="noopener">`) with a flag icon and the accessible name "Report question N". In the DOM it comes after the question's answers; CSS places it in the question's top inline-end corner.
    * Before grading, it is hidden until the question has a selected answer.
    * After grading, it is shown on every question, including unanswered ones ("My answer: Not answered").
    * Its `href` is rebuilt whenever the answer or the grading state changes (see [Report Templates](#report-templates)).
11. **Check Answers**: grades through `js/grading.js`.
    * Marks each question Correct, Incorrect, or Not answered, with icon and text.
    * Marks the student's pick as correct or wrong, outlines a missed correct option in dashed lime with "Correct answer", shows every question's explanation, and disables the radio buttons.
    * Renders the summary at the top: score line, overall bar, and one tile per topic with correct/total and a percent.
    * Updates the question map, moves focus to the summary heading (`tabindex="-1"`), and saves `{ correct, total, at, hash }` through `updateState`.
12. **Retake**: clears selections, marks, explanations, the summary, and the question map states, and hides the Report controls again until an answer is chosen. Re-enables the radio buttons, scrolls to the top, and focuses the exam `h1`. The saved score is kept. Nothing is re-fetched.
13. **Debug mode**: with `&debug=true` in the URL, after "Check Answers" it calls `console.table` with each question's number, expected answer, given answer, and result.

### Bilingual Names

* The header shows the wordmark: "بروفة" in Kufi lettering on a violet tile, with "BROVA" in lime beside it (see [brova-ui.md](brova-ui.md)). The wordmark SVG has `aria-hidden="true"`; the home link's accessible name is "Brova بروفة, home", with the Arabic word in a `lang="ar"` span.
* The `<title>` is "Brova · بروفة". The exam page's title is "`{exam title}` — Brova · بروفة". The browser tab shows a square favicon from the same Kufi lettering (OQ-3: the "exam sheet" mark).
* Course names show as "Network Security · أمن الشبكات". The English name comes first, then the Arabic name in a smaller, muted style.
* The Arabic part is its own element with `lang="ar" dir="rtl"`, so it reads right to left inside the English page and screen readers pronounce it as Arabic. The rest of the page is `lang="en" dir="ltr"`.
* The stylesheet uses logical properties (`margin-inline-start`, `padding-inline`, `text-align: start`) so a future Arabic interface can reuse it.

### Report Templates

`js/common.js` builds both URLs with `URLSearchParams`. The page URL and the browser string are passed in as parameters (`pageUrl`, `userAgent`), so the builders read no globals and can be tested in Node. A field longer than its cap is cut so that the text plus the final "…" is exactly the cap.

**Question report**: `https://github.com/CaelumOP/brova/issues/new?title=…&body=…`

* Title: `Report: {examId} Q{N}`
* Body:

  ```text
  Exam: {examId} (version {hash})
  Question {N}: {question text, max 500 characters}
  My answer: {answer}
  Marked correct: {answer}
  Page: {pageUrl}

  Reason:
  ```

* `{answer}` is `{letter}) {option text}` for multiple choice, `True` or `False` for true/false, or `Not answered`.
* The `Marked correct:` line appears only after "Check Answers".

**Error report** (from the "Report this error" link):

* Title: `Error: {message, max 100 characters}`
* Body lines, in order:
  * `Page: {pageUrl}`
  * `Message: {message}` (a non-`Error` rejection reason is converted to a string)
  * `Source: {file}:{line}:{column}`, only when the error event provides them
  * `Stack: {stack, max 1500 characters}`, only when there is a stack
  * `Browser: {userAgent}`

### Security Rules

The site runs on `caelumop.github.io`, which it shares with any other project the author publishes there.

* **No HTML injection.** All text from exam files, the manifest, the URL, and errors is inserted through `el()` (text nodes, `createElement`, and `createElementNS` for SVG). These names must not appear in `js/**/*.js` or anywhere in the root `*.html` files: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `document.writeln`, `DOMParser`, `createContextualFragment`, `setHTMLUnsafe`, `srcdoc`. `scripts/check-source.js` enforces this in the Action. The check is a plain text search, so the names must not appear in comments either.
* **Strict exam ID.** The `id` URL parameter must match `EXAM_ID_PATTERN` before it is used in a fetch path or shown on the page. This blocks injected markup and paths like `../`.
* **Encoded links.** Report URLs are built with `URLSearchParams`.
* **No third-party origins.** The font files are stored in the repository and the colors are written into our own stylesheet, so nothing loads from another domain ([Static Assets](#static-assets)). The syntax tokenizer is hand-written (OQ-4) and returns plain tokens; highlighted code is built from `el()` spans, never from HTML strings.
* **Shared origin** and **public answer keys and reports** are accepted risks; see [Risks & Mitigations](#risks--mitigations).
* **Content-Security-Policy** is deferred to v2.

### Error Handling

Every failure shows a visible plain-text message. The one silent case is unavailable localStorage, which only hides score badges and the remembered semester. The browser does not re-check exam contents: the Action guarantees that every deployed exam passed validation.

| Situation | Detection | Student sees |
| --- | --- | --- |
| Scripts fail to load or link (failed download, JavaScript off, or a cached script that no longer matches a new one) | none needed: each page's `<main>` starts with static text that the app replaces when it renders | "Loading… If this stays, reload the page." |
| Invalid `id` in URL | pattern check | "Invalid exam link" + link home |
| Manifest or exam returns an error status or is not valid JSON | `!response.ok`, or `response.json()` throws | "Could not load the exam list" or "Could not load this exam", then the HTTP status in parentheses if there is one, for example "Could not load this exam (404)", and the URL |
| Network failure | `fetch` rejects | "Could not reach the site. Check your connection." |
| Exam missing from the manifest | lookup by ID | "Could not load this exam. Reload the page." |
| Rendering throws | try/catch around rendering | "This exam could not be displayed" + "Report this error" |
| Uncaught error from the site's own files | `window.onerror` and `unhandledrejection`, only when the error's source file is under the site's path or the rejection came from site code (errors from in-app browsers and extensions are ignored) | Banner + "Report this error" |
| localStorage unavailable | try/catch | Nothing (the silent case above) |

### Caching

* **Build stamp.** Source files reference local JS and CSS as `js/app.js?v=__BUILD__`, including module imports such as `./common.js?v=__BUILD__`. `build.js` replaces `__BUILD__` in the copied `.html` and `.js` files with the first 7 characters of `GITHUB_SHA`, or `local-<milliseconds since 1970>` when `GITHUB_SHA` is unset. `check-source.js` fails the build if a relative `.js` import, or an HTML `src`/`href` to a local `.js` or `.css` file, lacks `?v=__BUILD__`, because a missed suffix would load the same module twice. Favicons, fonts (referenced from `css/fonts.css`), and JSON are not stamped.
* **Revalidated data.** JSON is fetched with `cache: "no-cache"`.
* **Remaining window.** GitHub Pages lets browsers cache HTML for up to 10 minutes (`max-age=600`), so a browser can show a cached page with the previous stamps for up to 10 minutes after a deploy. Accepted (see [Risks & Mitigations](#risks--mitigations)).

---

## Risks & Mitigations

| Risk | Impact | Mitigation / decision |
| --- | --- | --- |
| An AI-written answer key or explanation is wrong and goes live | Students practice the wrong answer before a real exam | Prompt rules (explanations must justify the answer; vary the correct letter); the prompt asks the AI to check each explanation against its key; schema checks structure; per-question Report control. The author does not review each key: accepted. |
| One invalid exam blocks every deploy | New exams and fixes cannot go live until it is fixed | Deliberate: the live site never contains an invalid exam. Run `npm run validate` before pushing; when `main` is red, fix the file and push, or `git revert`. |
| Stale cached files right after a deploy | For up to 10 minutes a student can see an old page with new data, or, if a cached script no longer matches a new one, a page that stops at "Loading… If this stays, reload the page." | Build stamp plus its source check; JSON fetched with `no-cache`; the static loading text. The 10-minute HTML cache window is accepted. |
| Public answer keys and public reports | Anyone can read answers; reports show the student's GitHub name | Accepted by the author. |
| Shared `caelumop.github.io` storage | Other projects on the same origin can read and write the `brova` key | Unreadable data is reset; the key holds only scores and a semester ID. Accepted. |
| Safari deletes stored scores | Safari and other WebKit browsers delete site storage after 7 days of use without a visit, so a student returning weeks later sees "Not taken" everywhere | Accepted: scores are a convenience, not a record. |
| Questions derived from lecture material are public | Course material appears on a public site | The prompt requires original practice questions, not copies of real exams. Accepted by the author. |
| Dependence on GitHub Pages and Actions | Hosting or deploys stop if GitHub changes terms | The output is static files that any static host can serve unchanged. Accepted. |

---

## Alternatives Considered

Each entry lists Mechanism, Pros, Cons, and Reason for Rejection; "None" means the field has nothing to add.

### Alternative A: Google Forms Quiz Mode

* **Mechanism**: One Google Form per exam in quiz mode, which grades answers automatically.
* **Pros**: No code, no hosting, works on phones, free.
* **Cons**: Creating quizzes in bulk from files needs Apps Script. There is no per-topic breakdown, the author cannot control layout or how code is shown, and the author does not own the format.
* **Reason for Rejection**: Per-topic feedback, control over layout and code blocks, and publishing from plain JSON files are the reasons for the custom site.

### Alternative B: Jekyll (GitHub Pages' Built-in Build)

* **Mechanism**: Jekyll's `_data` folder reads JSON, and a Liquid page (`{{ site.data.exams | jsonify }}`) could produce the exam list without an Action.
* **Pros**: No Action to maintain; GitHub Pages builds it natively.
* **Cons**: Jekyll cannot check exams against a schema or stop a bad deploy. Files under `_data` are not published individually. Safe mode blocks plugins that generate a page per exam.
* **Reason for Rejection**: Validation before deploy is a goal, and only an Action can enforce it.

### Alternative C: React or Vue Single-Page App

* **Mechanism**: Build the two pages as components in a framework, bundled for deploy.
* **Pros**: Familiar component model; easier state updates.
* **Cons**: Adds a framework, a bundler, and a dependency chain to browser code estimated at a few hundred lines.
* **Reason for Rejection**: Two pages and one state object need none of the features a framework adds, and the bundler would be one more build step to keep working.

### Alternative D: Backend with Database

* **Mechanism**: A server stores exams, accounts, and scores.
* **Pros**: Accounts, scores across devices, server-side analytics.
* **Cons**: Free-tier limits and cold starts, security patching, backups, and a service that stops working when no one maintains it.
* **Reason for Rejection**: Out of proportion to a class-sized audience.

### Alternative E: Integer Index for the Correct Answer

* **Mechanism**: `"correct": 2` meaning `options[2]`.
* **Pros**: None beyond being a common convention.
* **Cons**: Off-by-one mistakes. Reports and the page show letters, so an integer key would not match what students quote.
* **Reason for Rejection**: Letter keys (`"A"` to `"F"`) match the labels students see and quote in reports, so the author can find a reported answer in the file directly.

### Alternative F: Three Themes at Launch

* **Mechanism**: Ship the three mockup directions as themes with a switcher.
* **Pros**: Students pick the look they like.
* **Cons**: Triples the CSS to maintain and test, and needs a switcher and a stored preference.
* **Reason for Rejection**: The author chose one look in the mockup phase (OQ-1, direction B) and then dropped light mode, so the site is dark only.

### Alternative G: Local Scripts Only, No Action

* **Mechanism**: The author runs validation and the build locally, commits the manifest, and pushes.
* **Pros**: No workflow file to maintain.
* **Cons**: Extra manual steps per exam; forgetting the build means the exam never appears; uploads through github.com are never validated.
* **Reason for Rejection**: Contradicts the goal of publishing by adding one file and pushing, and makes validation optional.

### Alternative H: Flat Exam List

* **Mechanism**: One list of exam cards with course labels.
* **Pros**: Simpler home page; no remembered semester.
* **Cons**: The list grows every semester, and a student must scan past other courses' exams.
* **Reason for Rejection**: Grouping by semester keeps each course's exams separate as semesters accumulate and lets the site reopen the semester a student last used.

### Alternative I: Deploy Only the Valid Exams

* **Mechanism**: Skip invalid exam files, deploy the rest, and mark the run as failed.
* **Pros**: One bad file does not hold back other new exams.
* **Cons**: A third outcome besides pass and fail, workflow logic for a partial site, and a live site that silently lacks an exam the author pushed.
* **Reason for Rejection**: Contradicts the goal that a failed validation blocks the deploy and leaves the previous version online.

### Alternative J: A Highlighting Library Stored in the Repository

* **Mechanism**: Store Prism core plus a few language files in `js/vendor/`. Page code calls only `Prism.tokenize()` and renders the tokens through `el()`.
* **Pros**: Better coloring for many languages, maintained by others.
* **Cons**: Prism's own file contains `innerHTML`, so `check-source.js` would need to skip `js/vendor/`, which weakens the one rule that keeps markup out of the page. Updates are manual.
* **Reason for Rejection**: The author expects most exam code to be shell commands (the courses are mostly network and software security), which a short tokenizer handles, and the source check stays without exceptions.

### Alternative K: Load Fonts from Google Fonts

* **Mechanism**: Link the Google Fonts stylesheet, as the mockups do.
* **Pros**: No font files in the repository; Google picks the smallest format per browser.
* **Cons**: Every visit makes requests to Google's domains, which breaks the "nothing loads from another domain" rule and shares visitors' IP addresses with Google. The site's look depends on a service it does not control.
* **Reason for Rejection**: Self-hosting the same open-licensed files costs about 200–300 KB (estimate) in the repository and keeps every request on the site's own origin.

### Alternative L: An Author-Written Version Number

* **Mechanism**: Each exam has a `version` field the author raises after editing it; stored scores record the version.
* **Pros**: Formatting-only edits need not mark scores as old.
* **Cons**: The author must remember to raise it, and AI-regenerated files would often forget.
* **Reason for Rejection**: The content hash is computed by the build, so nothing has to be remembered (Post-Review decision 3).

### Alternative M: A Google Form Report Channel

* **Mechanism**: The Report control opens a pre-filled Google Form instead of a GitHub Issue, so students need no GitHub account.
* **Pros**: Any student can report.
* **Cons**: Sends student data to another domain, adds a second form to maintain, and reports no longer appear next to the code.
* **Reason for Rejection**: The author accepted the GitHub-account requirement, and the site keeps every request on its own origin.

---

## Non-Functional Requirements

* **Security & privacy**: See [Security Rules](#security-rules). Stored data is limited to what [localStorage](#localstorage) lists. No analytics or tracking.
* **Performance**: No framework. The home page loads one manifest; the exam page loads the manifest and the exam in parallel. Estimates: browser code a few hundred lines, exam files a few kilobytes each, and fonts 200–300 KB, the largest download, cached after the first visit. Fonts use `font-display: swap`, so text shows in a fallback font until they load; nothing is preloaded.
* **Hosting limits**: GitHub Pages publishes a soft bandwidth limit of 100 GB per month and a 1 GB site size limit. GitHub Actions minutes are free for public repositories.
* **Rollout & rollback**: A failed run blocks the deploy. `git revert` of a bad commit followed by a push redeploys the previous state.
* **Accessibility**: Native `fieldset`/`legend` and radio semantics provide keyboard navigation and screen-reader grouping without custom ARIA. Correct/incorrect is shown with icon and text, not color alone, including in the question map. Score bar fills meet 3:1 contrast against their track. Focus outlines stay visible. Tap areas are at least 44×44 CSS px. Arabic name parts carry `lang="ar"`.
* **Dark only**: `:root` holds the only set of color values, and `color-scheme: dark` on `:root` makes native radio buttons and scrollbars dark too. There is no `prefers-color-scheme` block.

---

## Detailed Implementation Plan

Repository `CaelumOP/brova`; live site `https://caelumop.github.io/brova/`. Toolchain: Node 24 in CI and locally (the author's machine runs Node 24.12).

### Module Graph

* `js/app.js` imports `js/common.js`.
* `js/exam.js` imports `js/common.js`, `js/grading.js`, and `js/syntax.js`.
* `js/common.js`, `js/grading.js`, and `js/syntax.js` import nothing and must not touch `document` or `window` at import time, so Node tests can import them.
* Each CLI in `scripts/` is a thin wrapper around a module in `scripts/lib/`, which tests import directly. Library functions return their results and problems and never call `process.exit`; only the CLIs print and exit. This avoids entry-point checks (comparing `import.meta.url` with `process.argv[1]`), which break on Windows paths.
* **`root`**: every library function that takes `root` expects `root/data/config.json` and `root/data/exams/`, and, for the build and the source check, `root/index.html`, `root/exam.html`, and the static asset folders. The JSON Schemas are always read from the repository's `data/` folder, never from `root`, so test fixtures need no copy of them.

### Phase 1: Tooling and Content Checks

**Exit:** `npm test` and `npm run validate` pass locally on Node 24.

1. **`.gitignore`**: `node_modules/`, `_site/`.
2. **`.gitattributes`**: `* text=auto eol=lf`, so files edited on Windows are stored with LF line endings.
3. **`.nvmrc`**: `24`.
4. **`package.json` and `package-lock.json`**:
   * `"private": true`.
   * `"type": "module"`, so Node runs the scripts and tests as ES modules and tests can import `js/*.js`.
   * `"engines": { "node": ">=24" }`.
   * Dev dependencies at exact versions: `ajv` 8.20.0 and `http-server` 14.1.1.
   * Scripts:
     * `test`: `node --test`. Checked on Node 24.12: `node --test tests/` fails, while bare `node --test` finds `tests/*.test.js`.
     * `validate`: `node scripts/validate.js`
     * `check`: `node scripts/check-source.js`
     * `build`: `node scripts/build.js`
     * `preview`: `npm run build && http-server _site -c-1 -p 8080`
5. **`data/config-schema.json`** (JSON Schema draft 2020-12, `additionalProperties: false` throughout):
   * `semesters`: a non-empty array of `{ id, name }`, where `id` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and `name` is non-empty.
   * `courses`: a non-empty array of `{ code, name: { en, ar } }`, where `code` matches `^[A-Z]{2,4}[0-9]{4}$` and both names are non-empty.
   * Unique semester IDs and course codes are checked in code (rule `config-duplicate`).
   * Every "non-empty" string in both schemas has `minLength: 1` and `pattern: "\\S"`, so a string of only spaces fails.
6. **`data/exam-schema.json`** (draft 2020-12):
   * **Exam object**: `additionalProperties: false`. `required`: `title`, `course`, `semester`, `description`, `date`, `questions`. `date` uses the pattern `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` (not `format`, which would need another package); whether it is a real calendar date is checked in code (rule `invalid-date`). `questions` has `minItems: 1` and items `$ref: "#/$defs/question"`.
   * **Question object**: `additionalProperties: false`, with all eight fields declared under `properties`.
     * `type` is `{ enum: ["mc", "tf"] }`, so any other value fails.
     * `correct` is declared as `{}` (any type); the type rules below narrow it.
     * `required`: `type`, `topic`, `question`, `correct`, `explanation`.
     * `options` has `minItems: 2`, `maxItems: 6`, `uniqueItems: true`, and non-empty string items.
     * `codeLanguage` is an `enum` of the seven names in [Exam JSON](#exam-json), and `dependentRequired: { "codeLanguage": ["code"] }` rejects it on a question without `code`.
   * **Type rules**: an `allOf` with two `if`/`then` pairs:
     * if `{ required: ["type"], properties: { type: { const: "mc" } } }`, then `options` is required and `correct` is a string matching `^[A-F]$`;
     * if `{ required: ["type"], properties: { type: { const: "tf" } } }`, then `options` is not allowed and `correct` is a boolean.
   * **Checked with ajv 8.20.0 on 2026-11-02:**
     * valid mc and tf questions pass;
     * these all fail: a number as an mc answer, options on a tf question, a misspelled field, a missing `type`, duplicate options, and a missing explanation;
     * "E" with four options passes the schema, as intended. The `correct-out-of-range` rule catches it.
   * **Not yet checked with ajv** (added after that check; Phase 1's fixtures confirm each one fails): an unknown `type`, an unknown `codeLanguage`, a `codeLanguage` without `code`, and a whitespace-only `topic`.
7. **`data/config.json`**: the semester and five courses in [Configuration](#configuration).
8. **`data/exams/sec3302-practice-first-2026-27.json`**, which exercises every rendering path (mc, tf, code blocks, and 5 to 6 options):
   * an original practice exam that an AI writes from SEC3302 lecture material, not copied from any real exam;
   * title `Network Security — Practice Exam 1`, `date` set to the day it is written;
   * at least 8 questions, including both types, at least 3 topics, at least one question with `code` and `codeLanguage: "shell"`, one with `code` and no `codeLanguage`, and at least one mc question with 5 or 6 options;
   * the answer key is not reviewed (see Non-Goals).
9. **`scripts/lib/validate-exams.js`**: exports `validateAll({ root })`, which returns `{ problems, config, exams, checked }` (`checked` is the number of files looked at, the config included), and `formatProblem(problem)`, which `validate.js` and `build.js` both use to print. Schema messages are made readable: a blank-text pattern failure reads "must not be blank", options on a true/false question read "options are not allowed on a true/false question", and misspelled fields and `enum` failures name the field or the allowed values.
   * `problems` is a list of `{ file, question: number | null, rule, message }`, where `file` is the path relative to `root` (`data/config.json` or `data/exams/<name>`). `exams` is a list of `{ id, file, data }`.
   * **ajv setup:** `import Ajv2020Module from "ajv/dist/2020.js"; const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module; const ajv = new Ajv2020({ allErrors: true });`. Do not pass `strict: true`: full strict mode rejects the `required` inside `then` (checked with ajv 8.20.0 on 2026-11-02).
   * **Reading files:** read every file as UTF-8 and strip a leading byte-order mark.
   * **Order of checks:**
     1. The config is checked first. If it fails, stop, because the exam checks need it.
     2. Then each entry in `data/exams/`, sorted by name, skipping names that start with `.` (such as `.gitkeep`): `stray-file`, `file-name`, `json-parse`, `schema`.
     3. Only if the schema passes: `unknown-course`, `unknown-semester`, `invalid-date`, `correct-out-of-range`.
   * **Mapping ajv errors:**
     * an `instancePath` of `/questions/<i>/…` maps to question `i + 1`;
     * drop errors whose `keyword` is `"if"`, because they repeat the branch error;
     * for `additionalProperties` errors, append `params.additionalProperty` so the message names the misspelled field.
   * Rules:

     | rule | scope | message |
     | --- | --- | --- |
     | `config-parse` | file | `not valid JSON: {parser message}` |
     | `config-schema` | file | `{path} {ajv message}` |
     | `config-duplicate` | file | `duplicate {semester id \| course code} "{value}"` |
     | `stray-file` | file | `only .json files are allowed in data/exams` |
     | `file-name` | file | `file name must be lowercase letters, digits and single hyphens, ending in .json` |
     | `json-parse` | file | `not valid JSON: {parser message}` |
     | `schema` | question or file | `{path} {ajv message}` |
     | `unknown-course` | file | `course "{code}" is not in config.json` |
     | `unknown-semester` | file | `semester "{id}" is not in config.json` |
     | `invalid-date` | file | `date "{date}" is not a real calendar date` |
     | `correct-out-of-range` | question | `correct answer "{letter}" but only {n} options` |

   * An empty `data/exams/` is not a problem; the site shows "No exams yet."
10. **`scripts/validate.js`**: calls `validateAll`.
    * Prints one line per problem: `{file}: question {N}: {message} [{rule}]`, leaving out `question {N}: ` for file-level problems. For example: `data/exams/x.json: question 3: correct answer "E" but only 4 options [correct-out-of-range]`.
    * Then prints `{files} files checked, {count} problems`.
    * Exits 1 if there are any problems.
11. **`tests/validate.test.js` and `tests/fixtures/`**. Each fixture folder is a `root` (see [Module Graph](#module-graph)):
    * `fixtures/valid/`: `data/config.json`, `data/exams/` with two valid exams and a `.gitkeep`, plus `index.html`, `exam.html`, a one-line `css/style.css`, and a one-line `js/app.js` containing `__BUILD__`, so the build test can use it too.
    * `fixtures/invalid-exams/`: the valid `data/config.json`, and in `data/exams/` one bad file per exam rule, named after the rule (`schema-unknown-type.json`, `correct-out-of-range.json`, and so on; `stray.txt` for `stray-file`; `Bad_Name.json` for `file-name`). It includes the four "not yet checked" cases from item 6.
    * `fixtures/invalid-config/<rule>/data/config.json`: one folder per config rule, because a config failure stops before the exams are checked.

    One run over `invalid-exams` asserts that each file reports its own rule, and the question number where one applies. The valid root yields no problems, and `.gitkeep` is ignored.

### Phase 2: Build and Deploy

**Exit:** a push to `main` deploys a placeholder page to `https://caelumop.github.io/brova/`.

12. **`scripts/lib/check-source.js` and `scripts/check-source.js`**: `checkSource({ root })` returns `[{ file, line, rule, text }]`.
    * It scans every `js/**/*.js` file and the full text of the root `*.html` files (markup and inline scripts).
    * `forbidden-html-api`: any name from [Security Rules](#security-rules), in JS or HTML (plain text match, comments included; this catches `srcdoc` in markup).
    * `missing-build-stamp`: a static or dynamic `import` of a relative `.js` path in JS, or a `src`/`href` attribute in HTML pointing to a local `.js` or `.css` file, without `?v=__BUILD__`.
    * `absolute-path`: any `src`, `href`, `import`, or `fetch` argument starting with `/`.
    * The CLI prints `{file}:{line}: {rule}: {text}` and exits 1 if there are any problems.
13. **`scripts/lib/build-site.js` and `scripts/build.js`**: `buildSite({ root, outDir, stamp })` returns `{ exams, problems }`, where `exams` is a count. It never prints or exits, and it uses `outDir` everywhere, never `_site/`. Steps:
    1. Run `validateAll({ root })`. If there are problems, return them without touching `outDir`.
    2. Delete and recreate `outDir`.
    3. Compute each exam's content hash.
    4. Write `outDir/data/manifest.json` as described in [Manifest](#manifest).
    5. Copy `index.html`, `exam.html`, `favicon.svg`, `favicon.png`, `css/`, `js/`, `fonts/`, and `data/exams/` from `root` into `outDir`, skipping names that start with `.`. A missing item is an error (Phase 2 creates every one of them, item 15). Nothing else is copied.
    6. Replace every `__BUILD__` in the copied `.html` and `.js` files with `stamp`.

    `scripts/build.js` computes the stamp (the first 7 characters of `GITHUB_SHA`, or `local-<Date.now()>` when it is unset), calls `buildSite({ root: ".", outDir: "_site", stamp })`, prints any problems in the `validate.js` format and exits 1, or else prints `Built _site/ with {n} exams (stamp {stamp})`.
14. **`.github/workflows/deploy.yml`**:
    * **Triggers**: push to `main`; `workflow_dispatch`.
    * **Permissions**: `contents: read`, `pages: write`, `id-token: write`.
    * **Concurrency**: group `pages`, `cancel-in-progress: false`.
    * **Job `build`** (`ubuntu-latest`), in order:
      * `actions/checkout@v7`;
      * `actions/setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`;
      * steps "Install" (`npm ci`), "Unit tests" (`npm test`), "Source checks" (`npm run check`), and "Validate and build" (`npm run build`);
      * `actions/configure-pages@v6`;
      * `actions/upload-pages-artifact@v5` with `path: _site`.
    * **Job `deploy`** (needs `build`; environment `github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`): `actions/deploy-pages@v5` with `id: deployment`.
    * The action versions are the latest releases as of 2026-11-02, checked on GitHub.
    * **One-time setup**: repository Settings > Pages > Source: "GitHub Actions." No `.nojekyll` file is needed, because deploying through Actions does not run Jekyll.
15. **Placeholders**, so the build's copy list exists from Phase 2 on:
    * `index.html`: one heading reading `Brova · بروفة — coming soon`, replaced in Phase 4;
    * `exam.html`: the same heading, replaced in Phase 4;
    * `css/style.css` and `css/fonts.css`: empty, filled in Phase 5;
    * `js/.gitkeep` and `fonts/.gitkeep`, so git keeps the folders (the build skips dotfiles);
    * `favicon.svg` and `favicon.png`: the final favicon, built now from the values in [brova-ui.md](brova-ui.md#favicon) (moved here from Phase 5).
16. **`tests/build.test.js` and `tests/check-source.test.js`**:
    * The build test builds the `tests/fixtures/valid` root into a temporary `outDir` and asserts:
      * the manifest fields, `questionCount`, topic order, and sort order;
      * `hash` is 8 hexadecimal characters and changes when one explanation changes;
      * no `__BUILD__` remains;
      * `scripts/`, `tests/`, `prompts/`, `docs/`, and `node_modules/` are absent.
    * The source-check test runs `checkSource` on the `tests/fixtures/source/` root, whose `js/` and root HTML files hold one violation per rule (including a missing stamp on a `<script src>` in markup and a `srcdoc` attribute) plus one clean JS file and one clean HTML file.

### Phase 3: Browser Logic

**Exit:** `npm test` passes, including the new tests.

17. **`js/grading.js`** (pure, no DOM):
    * `letterToIndex(letter)` maps `"A"` to 0 through `"F"` to 5.
    * `gradeQuestion(question, answer)`:
      * `answer` is an option index (mc), `true`/`false` (tf), or `null`;
      * returns `{ status: "correct" | "incorrect" | "unanswered", correctAnswer }`, where `correctAnswer` is the option index (mc) or a boolean (tf).
    * `gradeExam(questions, answers)`:
      * `answers` is an array by position, the same length as `questions`;
      * returns `{ correct, incorrect, unanswered, total, percent, byTopic, results }`;
      * `results` is the `gradeQuestion` result for each question, by position;
      * `byTopic` is `[{ topic, correct, total, percent }]` in order of first appearance;
      * every `percent` is `total === 0 ? 0 : Math.round(100 * correct / total)`.
18. **`js/common.js`**:
    * `REPO_URL = "https://github.com/CaelumOP/brova"`; `EXAM_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/`.
    * `el(tag, attrs, ...children)` is the only way pages build DOM:
      * SVG tags (`svg`, `path`, `circle`, `g`, `rect`, `line`, `polyline`) are created with `createElementNS("http://www.w3.org/2000/svg", tag)`, and so are their children; everything else uses `createElement`. Without this, icons would not render.
      * attributes are set with `setAttribute`;
      * a key starting with `on` must have a function value, which becomes an event listener; any other value throws;
      * `true` sets an empty attribute; `null`, `undefined`, and `false` are skipped;
      * string and number children become text nodes; `null`, `undefined`, and `false` children are skipped; arrays of children are flattened.
    * `fetchJson(url)`:
      * fetches with `cache: "no-cache"`;
      * a network failure throws a `LoadError` with `{ kind: "network", url }`;
      * a non-OK status or invalid JSON throws a `LoadError` with `{ kind: "load", url, status }`, where `status` is `null` for invalid JSON.
    * `emptyState()`, `loadState(storage)`, `updateState(fn, storage)`:
      * `storage` defaults to `globalThis.localStorage`, accessed inside try/catch;
      * `updateState` loads the current state, passes it to `fn`, and saves what `fn` returns, in one call; pages never save a copy they loaded earlier;
      * any exception yields the empty state or skips the save.
    * `questionReportUrl({ examId, hash, number, questionText, myAnswer, markedCorrect, pageUrl })` and `errorReportUrl({ message, source, line, column, stack, pageUrl, userAgent })` build the URLs per [Report Templates](#report-templates), including the caps. `myAnswer` and `markedCorrect` are the finished text (`B) option text`, `True`, or `Not answered`).
    * `bilingualName(en, ar)` returns a `span` containing the English text, " · ", and `<span lang="ar" dir="rtl" class="name-ar">`.
    * `showBanner(message, { url, reportError, kind })` renders into `#banner`; `kind` is `"error"` (the default, `role="alert"`) or `"notice"` (`role="status"`), matching the two banner styles in [brova-ui.md](brova-ui.md).
    * `installErrorHandlers()` sets `window.onerror` and `unhandledrejection` to show a banner with a "Report this error" link, only for errors whose source file is under the site's own path (or rejections from site code).
18a. **`js/syntax.js`** (first version): exports `tokenize(code, language)`, which for now returns one `plain` token holding the whole code, so Phase 4 can render code blocks. Phase 5 (item 29) adds the coloring rules.
19. **`tests/grading.test.js`** covers:
    * all correct, all wrong, and all unanswered;
    * tf questions keyed `true` and `false`;
    * `"A"`–`"F"` mapping to 0–5;
    * `byTopic` order, totals, and percents;
    * 2/3 → 67, 1/3 → 33, and a total of 0 → 0;
    * separate `incorrect` and `unanswered` counts that add up with `correct` to `total`.
20. **`tests/common.test.js`**:
    * `EXAM_ID_PATTERN` accepts `sec3302-midterm-first-2026-27` and rejects `""`, `../x`, `a--b`, `-a`, `a-`, `A1`, and `<img src=x>`.
    * `loadState` with a fake storage returns the empty state for a missing key, invalid JSON, `schemaVersion: 2`, and a `getItem` that throws. A valid state round-trips through `updateState`, and two `updateState` calls in a row keep both changes.
    * `questionReportUrl`:
      * encodes special characters;
      * leaves out the "Marked correct" line when `markedCorrect` is absent;
      * caps question text so the result, including the final "…", is exactly 500 characters.
    * `errorReportUrl` caps the stack at 1500 characters, and leaves out the `Source:` and `Stack:` lines when they are missing.

### Phase 4: Pages

**Exit:** these [Verification Plan](#verification-plan) browser checks pass on the unstyled site, both locally (`npm run preview`) and on the live URL: Main flow, Back button, Bad links, Network failure, Invalid JSON, Render failure, Uncaught error, Empty groups, and Debug mode.

21. **`index.html` and `exam.html`**:
    * **Root and head:** `lang="en" dir="ltr"`, a viewport meta, and `<title>` `Brova · بروفة` (`exam.js` replaces it with the exam title format).
    * **Body:** a header with the bilingual site name linking to `index.html`, `<div id="banner">`, `<main>` containing only the static text `Loading… If this stays, reload the page.` (the app replaces it when it renders), and `<noscript>Brova needs JavaScript to show exams.</noscript>`.
    * **Stylesheets:** `css/fonts.css?v=__BUILD__` and `css/style.css?v=__BUILD__` (both can be empty until Phase 5).
    * **Favicon:** `<link rel="icon" href="favicon.svg" type="image/svg+xml">` and `<link rel="icon" href="favicon.png" sizes="32x32">` (the "exam sheet" mark from OQ-3, created in Phase 2).
    * **Scripts:** `<script type="module" src="js/app.js?v=__BUILD__">` in `index.html`, or `js/exam.js?v=__BUILD__` in `exam.html`.
    * All paths are relative.
22. **`js/app.js`**: implements [Page Behavior > index.html](#indexhtml-home), including rendering badges on `pageshow`.
23. **`js/exam.js`**: implements [Page Behavior > exam.html](#examhtml-exam), including the Report control and debug mode. It keeps `{ entry, exam, answers, result }` in one state object, updates `answers` when a radio button changes, and writes to localStorage only through `updateState`.

### Phase 5: Styling

**Exit:** these [Verification Plan](#verification-plan) checks pass: Phone and accessibility, Arabic names, Favicon, and No other domains.

All values come from [brova-ui.md](brova-ui.md).

24. **Color values**: no Open Props file is shipped (round-2 decision A1). The hex values in [brova-ui.md](brova-ui.md#color-tokens) are written into `:root` in `css/style.css`, with a comment that they come from `open-props@1.7.23` and the name of each (for example `gray-11`).
25. **`css/style.css`**:
    * **Opening comment:** colors, backgrounds, borders, and shadows come only from the custom properties in `:root`.
    * **`:root`:** defines every token in [brova-ui.md](brova-ui.md) (surface and text, accent and brand, answer states, code and syntax, `--space-1` to `--space-6`, `--radius-1` to `--radius-4`, `--radius-round`). It also sets `color-scheme: dark`. No light-mode block.
    * Logical properties only.
    * Styles for:
      * the header wordmark and the breadcrumb;
      * semester sections, and course headings with the muted Arabic part;
      * exam cards, "Not taken", score badges, and score bars (fill `--color-accent`, which meets 3:1 against the track);
      * question cards, status badges, and radio rows (tap area at least 44×44 CSS px);
      * the four answer states: not chosen, your correct pick, your wrong pick, and the missed correct answer (dashed lime), each with icon and text;
      * the Report control at the question's top inline-end corner (44×44 px);
      * code blocks (`direction: ltr; overflow-x: auto`) with the label bar;
      * the score summary and topic tiles;
      * the side column holding the question map and the next-exam card, with the map's height capped to the viewport and scrolling inside itself, stacking under the questions below 900 px wide;
      * buttons, banners, and visible focus outlines.
26. **Wordmark**: the header's "بروفة" as inline SVG paths with `aria-hidden="true"`, so the header does not depend on loading Reem Kufi and screen readers read the link's name instead. The paths are exported once from Reem Kufi 700 with a one-off font-to-path tool (for example a short Node script using the `opentype.js` package, run locally and not committed) and pasted into both HTML files.
27. **Icons**: the inline SVG icons listed in [brova-ui.md](brova-ui.md#icons), built with `el()` (which uses the SVG namespace).
28. **Phone layout rules** (the favicon moved to Phase 2, item 15):
    * every `fieldset` gets `min-inline-size: 0`, so a long code line scrolls inside its block instead of widening the page;
    * question text, options, explanations, and banners get `overflow-wrap: anywhere`, so a long URL or path wraps;
    * true/false options stack in one column below 480 px wide;
    * question header rows wrap.
29. **Syntax highlighting** (OQ-4, hand-written; round-2 decision A2):
    * **`js/syntax.js`**: `tokenize(code, language)` returns `{ type, text }` tokens. Types: `command`, `flag`, `value`, `number`, `string`, `comment`, `plain`.
    * **One left-to-right pass.** At each position, the first match wins: a `#` comment runs to the end of the line, so quotes inside a comment are ignored; then a quoted string (an unclosed quote runs to the end of the line); then a number; then a word.
    * **`shell` rules:** the first word of each line, and the word after `|`, `&&`, `;`, or `sudo`, is `command`; a word starting with `-` is `flag`; a word right after a flag is `value` only if it does not start with `-` and is not an operator.
    * **Every other language, and no language:** only `string` and `number` are colored. A language gets more rules only when an exam needs them.
    * **`exam.js`**: renders each token as a `<span class="syn-<type>">` through `el()`; `plain` tokens are text nodes.
    * **`tests/syntax.test.js`**: joining the tokens' text always gives back the exact input (including tabs, blank lines, and an unclosed quote); in `grep -r -i "admin" /etc/passwd`, `grep` is a command, `-r` and `-i` are flags, `"admin"` is a string, and `/etc/passwd` is plain; `# don't allow root` is one comment token; a non-shell sample colors only strings and numbers; an unknown language behaves like no language.
    * **`css/style.css`**: one rule per type, using the `--syn-*` tokens in [brova-ui.md](brova-ui.md#code-block).
30. **Fonts** (OQ-5, self-hosted):
    * **`fonts/<family>/`**: one `.woff2` file per weight and subset in the [brova-ui.md](brova-ui.md#typography) table (only the weights the type scale uses), plus the package's `LICENSE` file, as the font license requires. The Latin subset for Space Grotesk, IBM Plex Sans, and JetBrains Mono, and the Arabic subset for IBM Plex Sans Arabic.
    * **Source:** the Fontsource npm packages (`npm pack @fontsource/<family>@<exact version>`; checked 2026-11-02: `@fontsource/ibm-plex-sans-arabic` 5.3.0 ships `LICENSE`, per-subset CSS such as `arabic-400.css`, and `files/*.woff2`).
    * **`css/fonts.css`**: the `@font-face` rules copied from the package's per-subset CSS, keeping `font-display: swap` and `unicode-range`, with every `url(./files/...)` rewritten to `url(../fonts/<family>/...)` and the `.woff` fallbacks removed. A header comment records each package version. Linked from both pages before `css/style.css`, with the build stamp.
    * **Size:** if the total is over 300 KB, drop any weight the type scale does not use first.

### Phase 6: Authoring Docs

**Exit:** a second exam generated with the prompt passes `npm run validate`.

31. **`prompts/generate-exam.md`**. The prompt text tells the AI to:
    * output only the JSON, with no commentary, and write all exam text in English;
    * follow the schema, which the file includes in full (the contents of `data/exam-schema.json`);
    * use one of the listed course codes and semester IDs (the file lists them, copied from `config.json`);
    * for multiple choice, use 2 to 6 distinct options, exactly one correct answer, and letter keys `"A"`–`"F"` in option order, and vary which letter is correct;
    * for true/false, use `"type": "tf"`, no `options`, and `correct` as `true` or `false`, and mix true and false answers;
    * use 3 to 6 topics per exam, reusing the exact same topic string for every question on that topic;
    * write each explanation to say why the correct answer is right and, for multiple choice, why the most tempting wrong option is wrong, then check that the explanation agrees with `correct`;
    * put code snippets in `code`, not in `question`, and set `codeLanguage` when the language is one of the seven listed;
    * write original questions from the lecture material, not copies of real past exams.

    The file ends with the sample exam as a worked example.
32. **`README.md`**:
    * what Brova is, its URL, and the Action status badge;
    * how to add an exam: use the prompt, save the result as `data/exams/<id>.json`, and push;
    * how to add a course or semester: edit `data/config.json`, then update the lists in `prompts/generate-exam.md`;
    * how to check locally: `npm ci`, `npm run validate`, then `npm run preview` and open `http://localhost:8080`;
    * how to read a failed run: the lines under "Validate and build";
    * what to do when `main` is red: fix the file and push, or `git revert`;
    * how to fix a reported question: edit the file, push, and close the issue (the build recomputes the hash);
    * that renaming an exam file loses students' stored scores and breaks shared links;
    * the hosting limits;
    * a note that the site, the answer keys, and filed reports are public.

### Verification Plan

* **Unit tests**: `npm test` passes `tests/validate.test.js`, `tests/build.test.js`, `tests/check-source.test.js`, `tests/grading.test.js`, `tests/common.test.js`, and `tests/syntax.test.js`.
* **Validation**: `npm run validate` passes on the real exams. Copying `tests/fixtures/invalid-exams/data/exams/correct-out-of-range.json` into `data/exams/` makes it print `data/exams/correct-out-of-range.json: question {N}: correct answer "E" but only 4 options [correct-out-of-range]` and exit 1.
* **Source checks**: `npm run check` passes. It fails with `forbidden-html-api` when `x.innerHTML = ""` is temporarily added to a file in `js/`, and with `missing-build-stamp` when `?v=__BUILD__` is removed from an import or from the `<script src>` in `index.html`.
* **Build**: `npm run build` creates `_site/` with `data/manifest.json`, no `__BUILD__` left in any file, and none of `scripts/`, `tests/`, `prompts/`, `docs/`, or `node_modules/`.
* **Browser, local** (`npm run preview`, `http://localhost:8080`):
  * **Main flow**:
    * open the semester and the course, then the sample exam;
    * answer and click "Check Answers";
    * marks, highlighted correct options, and every question's explanation appear;
    * the score and topic tiles match a hand count;
    * focus moves to the summary;
    * the question map shows the right state for every question, its counts match, and each square jumps to its question;
    * a missed correct answer has the dashed lime outline and "Correct answer";
    * the breadcrumb's semester and course links open that semester on the home page;
    * with a second, older exam in the same course, the next-exam card links to it, and it is absent on the course's oldest exam.
  * **Back button**: after grading, press the browser's Back button. The home card shows the new "N%" without a reload. Then open another semester section and reload: the score is still there.
  * **Two tabs**: grade exam X in one tab and exam Y in another, then reload home. Both scores are shown.
  * **Unanswered** questions show "Not answered" and count as wrong.
  * **Retake** clears selections, marks, explanations, the summary, and the question map states, hides the Report controls until an answer is chosen, re-enables the inputs, focuses the exam title with the header in view, and keeps the saved score.
  * **Report control**:
    * hidden until an answer is selected, then shown beside that question;
    * after "Check Answers", shown on every question, and an unanswered question's report says `My answer: Not answered`;
    * opens a GitHub new-issue page in a new tab whose title and body match the template;
    * `Marked correct:` appears only after "Check Answers".
  * **Reload home**:
    * the last opened semester is expanded, and the card shows "N%" and its score bar; an untaken exam shows "Not taken";
    * after editing one explanation in the sample exam and rebuilding, the card shows "(older version)" after the score.
  * **Breadcrumb from another semester**: with semester A remembered, opening `index.html#c-<semester B>-<course>` opens only semester B, and a reload then opens B.
  * **Clear my scores** asks for confirmation, then every card shows "Not taken" and the remembered semester is cleared.
  * **Scripts fail**: block `js/exam.js` in DevTools and reload an exam. The page shows "Loading… If this stays, reload the page."
  * **Blocked storage** (Chrome: block site data for localhost; or Firefox: `dom.storage.enabled = false`): no errors, no badges, no remembered semester.
  * **Bad links**: `exam.html?id=<img src=x onerror=alert(1)>` shows "Invalid exam link" as text, and no alert dialog appears. `exam.html?id=does-not-exist` shows "Could not load this exam (404)" with the URL.
  * **Network failure**: in Chrome DevTools, block the request URL `data/manifest.json` and reload the home page. It shows "Could not reach the site. Check your connection."
  * **Invalid JSON**: replace the contents of one exam file in `_site/data/exams/` with `x`. Its page shows "Could not load this exam" with the URL.
  * **Render failure**: in `_site/data/exams/`, set one question's `options` to `5`. The page shows "This exam could not be displayed" with "Report this error".
  * **Uncaught error**: running `setTimeout(() => { throw new Error("test") })` in the console shows the banner, and its report link's body contains `test`. (A console error counts as the site's own; an error from a browser extension's file shows no banner.)
  * **Empty groups**: a course added to `config.json` with no exams does not appear after rebuilding.
  * **Debug mode**: `exam.html?id=…&debug=true` logs a table after "Check Answers".
  * **Phone and accessibility** (Chrome device toolbar at 320 px wide):
    * no horizontal page scroll, including on the sample exam's code block and on an option containing a 60-character URL (code blocks may scroll inside);
    * true/false options are stacked, and "Correct answer" fits on a graded true/false question;
    * radio rows, buttons, and Report controls measure at least 44×44 CSS px;
    * with the system set to light mode, the site still shows its dark colors, and the color pairs listed in [brova-ui.md](brova-ui.md#contrast-checks) are the ones used;
    * every control is reachable by Tab with a visible focus outline;
    * arrow keys move within a radio group, and buttons work with Enter and Space;
    * a screen reader reads the home link as "Brova بروفة, home" and each question group with its number;
    * at 1366×768 with a 40-question exam, "Check Answers" is reachable inside the question map.
  * **Arabic names**: the header wordmark "بروفة" with "BROVA", the tab title `Brova · بروفة`, and `Network Security · أمن الشبكات` show the Arabic right to left with correctly joined letters.
  * **Favicon**: at 16 px in a browser tab, on both a dark and a light browser theme, the violet sheet, the lime corner, and the white ب can each be told apart.
  * **No other domains**: with DevTools Network open, a full home-to-graded-exam flow requests nothing outside the site's own origin, and the fonts load from `fonts/` (no "Failed to decode downloaded font" warnings in the console).
* **Deployment**:
  * Pushing the sample exam passes all four Action steps (Unit tests, Source checks, Validate and build, Deploy). Note how long the live site takes to show it; GitHub's cache allows up to 10 minutes.
  * Pushing an exam with `"correct": "E"` and four options fails at "Validate and build" with the `correct-out-of-range` line. Nothing deploys and the live site is unchanged. After a revert and push, the run passes.

---

## Future Improvements (v2 Backlog)

* Arabic interface: right-to-left layout and translated interface text. The stylesheet already uses logical properties.
* Score history: attempts, best score, per-topic best.
* Theme switcher and more themes.
* Offline/PWA support.
* Content-Security-Policy.
* Error tracking service. This would mean revisiting the no-third-party and no-tracking rules.

---

*Drafted with EGM (the Elephant-Goldfish Model design-review workflow).*
