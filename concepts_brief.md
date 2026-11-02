# Concepts Brief -- Brova (بروفة): Static Exam Site on GitHub Pages

**Repository:** `CaelumOP/brova` · **Live site:** `https://caelumop.github.io/brova/`

**Feature Hypothesis:** A static GitHub Pages site using plain HTML/CSS/JS that renders AI-generated mock exams from flat JSON files, with client-side grading, topic breakdowns, and localStorage history. No backend, no accounts, no framework.

**Target Audience:** Author's friends and classmates at their university.

**Brainstorm Reviewers:** 6/6 completed (Design Critic, Codebase Details, Zoom Out, Comprehension, Implementation Readiness, Structural).

---

## Reviewer Status

| Reviewer | Role Title | Status |
| --- | --- | --- |
| `design-critic` | Skeptical Architect Brainstormer | completed |
| `codebase-details` | Technical Auditor Brainstormer | completed |
| `zoom-out` | YAGNI & Simplicity Brainstormer | completed |
| `comprehension` | UX & Ergonomics Brainstormer | completed |
| `implementation-readiness` | Migration & Compatibility Brainstormer | completed |
| `structural` | Tech Debt & Maintainability Brainstormer | completed |

---

## Severity Summary

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 14 |
| Nit | 11 |

---

## Prioritized Findings

### MAJOR FINDINGS

---

### M1. No JSON Schema Validation (CI or Runtime)

* **Lenses:** design-critic, codebase-details, comprehension, structural, implementation-readiness
* **Dimension:** Architecture / Observability / Maintainability
* **Risk:** The entire pipeline depends on AI-generated JSON conforming to an implicit, undocumented schema. A single malformed file (wrong field name, missing `correct`, out-of-range index, string where boolean expected) can cause silent grading errors, blank pages, or JS exceptions. Since the primary content source is non-deterministic (LLM output), malformed files are a recurring operational risk, not a theoretical edge case.
* **Requirement:** (a) Define a formal JSON Schema file (e.g., `data/exam-schema.json`). (b) The GitHub Action must validate every exam file against it and fail the build on violations, with a clear error naming the file and specific violation. (c) `exam.js` must include defensive runtime checks (bounds-check `correct` index, verify required fields, validate types) and display user-visible error messages rather than failing silently. (d) Provide a local validation script (`node validate.js <file>`) for pre-push feedback.

---

### M2. localStorage Schema Has No Version or Migration Strategy

* **Lenses:** design-critic, codebase-details, implementation-readiness, structural
* **Dimension:** Migration & Backward Compatibility / Maintainability
* **Risk:** localStorage stores exam history with a specific object structure (best score, attempts, topic breakdown). There is no version marker. When the schema changes (adding fields, restructuring keys), existing stored data will cause `undefined` reads, NaN scores, blank UI sections, or silent data loss. Because localStorage is on the user's device, the author cannot run a server-side migration -- the code itself must handle this at read time.
* **Requirement:** (a) Include a `schemaVersion` integer at the top level of every localStorage object. (b) Implement a migration function that runs on page load: read the stored version, apply sequential upgrade transforms, write back. (c) Define the initial schema shape (version 1) as a contract. (d) Wrap all localStorage access in try/catch with graceful degradation (app must work without localStorage). (e) Use a key namespace prefix (e.g., `examready_`) to avoid cross-project collisions on `*.github.io`.

---

### M3. Exam ID Uniqueness and Stability Are Unenforced

* **Lenses:** comprehension, implementation-readiness, structural
* **Dimension:** Migration & Backward Compatibility / UX
* **Risk:** localStorage history, manifest entries, and URL parameters all depend on exam `id` being unique and immutable. Nothing enforces this. If two exams share an ID, manifest overwrites silently, localStorage history merges incorrectly, and navigation links resolve ambiguously. If an AI-regenerated file changes its ID, stored history becomes orphaned. Over time, localStorage accumulates unbounded orphan entries with no pruning.
* **Requirement:** (a) The GitHub Action must enforce ID uniqueness across all exam files and fail the build on collision. (b) Establish that exam IDs are immutable once published. (c) Specify an ID format convention (e.g., `<course-code>-<semester>-<sequence>`). (d) Define cleanup strategy: either periodic localStorage prune for IDs absent from manifest, or a "Clear History" UI control.

---

### M4. Semester/Course Free-Text Values Lack Normalization

* **Lenses:** comprehension
* **Dimension:** UX & Developer Ergonomics
* **Risk:** `semester` and `course` are free-text strings that serve as grouping keys for the navigation tree. Inconsistent values from AI generation (`"Fall 2026"` vs `"fall 2026"` vs `"F2026"`, `"CS 101"` vs `"CS101"`) produce fragmented, confusing navigation with duplicate groups for the same logical category.
* **Requirement:** (a) Define an enum of valid semester and course values in a configuration file that the Action validates against, OR (b) implement case-insensitive, whitespace-normalized grouping in the manifest generator, OR (c) document exact string conventions enforced by the AI prompt. The Action should warn on near-duplicate group names.

---

### M5. 0-Based Correct Index Is a Cognitive Hazard

* **Lenses:** comprehension
* **Dimension:** UX & Developer Ergonomics
* **Risk:** Using a 0-based index for the `correct` field in MC questions is a programmer convention, not a content-author convention. When reviewing or editing AI output, `correct: 2` meaning "the third option" is a persistent source of off-by-one errors. Every such error produces a silently wrong answer key with no visible indication.
* **Requirement:** Either (a) switch to 1-based indexing and document clearly, (b) use the option text itself as the correct value (string match), or (c) use letter keys ("A", "B", "C", "D") matching displayed labels. If 0-based is retained, the validation layer (M1) must bounds-check the index against options array length, and exams should surface answer keys for human review.

---

### M6. No Explicit Question Type Discriminator Field

* **Lenses:** implementation-readiness, structural
* **Dimension:** Migration & Backward Compatibility / Maintainability
* **Risk:** MC and T/F questions are distinguished implicitly by the presence/absence of `options`. Adding a third question type (short answer, matching, select-all) would require fragile heuristic detection. A T/F question could be misidentified if new fields overlap.
* **Requirement:** Each question object must include an explicit `type` field (e.g., `"mc"`, `"tf"`) from day one. The renderer should switch on this field and skip (with a visible warning) any unrecognized type. Since all exam files are AI-generated, adding this field to the prompt costs nothing. Design the renderer/grader as a registry or strategy pattern keyed by type to decouple adding new question types from modifying existing logic.

---

### M7. No Client-Side Error Reporting

* **Lenses:** codebase-details
* **Dimension:** Observability & Operational Debuggability
* **Risk:** The entire application runs client-side with zero error telemetry. Silent failures (malformed JSON breaking one exam, mobile-specific rendering bugs, localStorage quota exceeded) will go undetected indefinitely.
* **Requirement:** Specify a lightweight error capture strategy: (a) `window.onerror` / `window.onunhandledrejection` handler that logs structured error context in a copy-pasteable format, (b) a visible in-page error banner with a "Report this error" link that pre-fills a GitHub Issue with error details, or (c) integration with a free-tier error tracking service (e.g., Sentry free plan).

---

### M8. No Fetch Failure Handling

* **Lenses:** codebase-details
* **Dimension:** Observability & Operational Debuggability
* **Risk:** `app.js` and `exam.js` depend on fetch requests to relative paths. No handling is described for 404, network failures, or files that are not valid JSON. (Correction after review: GitHub Pages answers a missing file with a real HTTP 404 status, not HTTP 200 with an HTML page, so checking `response.ok` catches it.)
* **Requirement:** (a) All fetch calls must check `response.ok` before `.json()` and catch parse errors separately. (b) Display specific, user-visible error messages distinguishing "file not found" from "invalid JSON" from "network error." (c) Include the attempted URL in the error for reproducibility. (d) `app.js` should include a startup self-test verifying `manifest.json` loads successfully.

---

### M9. GitHub Action Has No Observability or Failure Notification

* **Lenses:** codebase-details, structural
* **Dimension:** Observability / Maintainability
* **Risk:** The Action is the sole bridge between content and presentation. If it silently drops a file (parse error, encoding issue, filename collision), the operator will not know. If it fails entirely, the manifest becomes stale with no alert. The Action is also a single point of failure: runner updates, Node version deprecation, or YAML changes can break it silently.
* **Requirement:** (a) Log a structured summary listing total files found, files included, files skipped with reasons. (b) Fail the workflow (non-zero exit) on any parse failure, never silently skip. (c) The manifest script should be a standalone, testable file runnable locally. (d) Configure GitHub notification for workflow failures. (e) Consider a status badge in the README.

---

### M10. No Cache-Busting or Graceful Degradation for Non-Atomic Deployments

* **Lenses:** implementation-readiness
* **Dimension:** Migration & Backward Compatibility
* **Risk:** GitHub Pages is not atomic. A deployment that changes both `js/exam.js` and `data/exams/*.json` can serve mismatched versions from browser cache. A git revert creates a similar window. There is no cache-busting mechanism described.
* **Requirement:** (a) HTML pages should reference JS with a version query parameter (e.g., `app.js?v=2`) bumped on breaking changes. (b) `exam.js` must degrade gracefully when encountering exam JSON it cannot fully parse -- render what it can, skip unknown question types with a visible warning, rather than crashing.

---

### M11. LLM Token Budget Is Uncapped and Untracked

* **Lenses:** design-critic
* **Dimension:** Cost, Quota & Token Economics
* **Risk:** AI generates all exam files with no budget ceiling. A single exam (40 MC questions with options, topic, explanation) is roughly 8,000-12,000 output tokens. Feeding large lecture PDFs as context can spike input token costs unpredictably. Prompt iteration and regeneration compound the cost.
* **Requirement:** (a) Establish a per-semester token budget estimate (e.g., "expect ~1M total tokens per semester, approximately $15-20 at Sonnet tier"). (b) Define a standard prompt template to avoid ad-hoc prompt inflation. (c) Consider cheaper models (Haiku/Flash) for initial drafts and stronger models only for review passes.

---

### M12. GitHub Pages Bandwidth Ceiling Under Burst Load

* **Lenses:** design-critic
* **Dimension:** Cost, Quota & Token Economics
* **Risk:** GitHub Pages has a soft bandwidth limit of 100 GB per month and a 1 GB published-site size limit. GitHub may also rate-limit sites under heavy traffic, but publishes no exact request numbers. Not a blocker for a class-sized audience, but an unacknowledged constraint.
* **Requirement:** Document the published limits (100 GB/month bandwidth, 1 GB site size) as known constraints. If the site ever outgrows them, the same static files can move to another static host (Cloudflare Pages, Netlify) without code changes. No architectural change needed now.

---

### M13. No Mechanism for Students to Report Incorrect Answers

* **Lenses:** comprehension
* **Dimension:** UX & Developer Ergonomics
* **Risk:** AI-generated content will contain factual errors. Students who discover wrong answer keys have no structured way to flag them. Without this, the feedback loop is informal and the author cannot easily locate which question needs correction.
* **Requirement:** Add a lightweight "Report this question" affordance that generates a pre-filled GitHub Issue link (using repo URL with query parameters for exam ID, question index, and the student's objection). This requires no backend and respects the static-only constraint.

---

### M14. The Entire Project May Be Replaceable by Existing Tools

* **Lenses:** zoom-out
* **Dimension:** Contrarian / YAGNI & Code Minimization
* **Risk:** Google Forms quiz mode already supports MC and T/F, auto-grades, shows correct answers with explanations, and provides per-question feedback -- with zero code, hosting, or deployment pipeline. Microsoft Forms, Quizizz, and Kahoot offer similar features. The author should validate that a custom site solves a problem these tools do not.
* **Requirement:** Before writing code, articulate the specific differentiators that justify a custom solution (e.g., AI-generated bulk content from lecture material, open-source sharing, specific UX preferences, portfolio/learning project value). If the differentiator is "AI-generated content," the AI could generate Google Forms via the Forms API.

---

### NIT FINDINGS

---

### N1. Three CSS Themes Are Premature

* **Lenses:** zoom-out
* **Dimension:** YAGNI
* **Risk:** Three themes triple the CSS surface area and introduce theme-switching logic, localStorage for preference, and visual QA across all three.
* **Recommendation:** Ship one clean theme. Add dark mode via `prefers-color-scheme` media query (a few lines of CSS, no UI changes). Build a theme switcher only if someone asks.

---

### N2. Topic-Based Score Breakdowns Add Complexity for Marginal Value

* **Lenses:** zoom-out
* **Dimension:** YAGNI
* **Risk:** Every question requires a `topic` field. Grading must group by topic, compute percentages, render breakdown UI. Topic taxonomy must be consistent across questions for meaningful results.
* **Recommendation:** Start with flat score + list of incorrect answers with explanations. Explanations already tell the student what to review. Add topic grouping only if users request it.

---

### N3. localStorage History Tracking Is Not an MVP Requirement

* **Lenses:** zoom-out
* **Dimension:** YAGNI
* **Risk:** Full history with best score, attempt count, dates, and per-topic breakdown adds state management, serialization, and migration concerns.
* **Recommendation:** For v1, just show the score at the end. Add "last score" indicator if repeat practice becomes a real pattern. Full history can wait for evidence of demand.

---

### N4. Hierarchical Navigation Assumes Scale That May Not Arrive

* **Lenses:** zoom-out
* **Dimension:** YAGNI
* **Risk:** A three-level tree (semester > course > exam) for an initial corpus of 3-6 exams is over-navigation.
* **Recommendation:** Start with a flat list of exams with course labels/filter. Add hierarchy only when exam count exceeds ~15-20 items.

---

### N5. GitHub Action Is Premature Automation

* **Lenses:** zoom-out
* **Dimension:** YAGNI
* **Risk:** CI infrastructure (YAML config, runner costs, failure modes) for a handful of files. A local script or hand-maintained manifest achieves the same result.
* **Recommendation:** Start with a one-line local script (`node scripts/build-manifest.js`) or hand-maintained manifest. Automate only after manual steps become genuinely painful.

---

### N6. manifest.json Lacks Version and Generation Metadata

* **Lenses:** implementation-readiness
* **Dimension:** Migration & Backward Compatibility
* **Risk:** If the manifest structure changes, `app.js` cannot detect format mismatches. Browser-cached stale manifest combined with updated JS causes silent breakage.
* **Recommendation:** Include a top-level `schemaVersion` and `generatedAt` timestamp. `app.js` should display a "please hard-refresh" message if the version is unrecognized.

---

### N7. No Exam Ordering Field

* **Lenses:** comprehension
* **Dimension:** UX
* **Risk:** No date or order field means exam display order within a course is undefined and fragile (filesystem order or alphabetical by filename).
* **Recommendation:** Add an optional `order` or `date` field. Alternatively, document that the Action sorts alphabetically by `title`.

---

### N8. No Offline/PWA Consideration

* **Lenses:** comprehension
* **Dimension:** UX
* **Risk:** Students on mobile may want to load exams on Wi-Fi and practice offline. A static site with JSON files is an ideal PWA candidate.
* **Recommendation:** Defer explicitly for v1 ("PWA caching is out of scope") or add a basic service worker that caches manifest and exam JSONs after first load.

---

### N9. Exam Content Mutation Invalidates Stored History

* **Lenses:** structural
* **Dimension:** Maintainability
* **Risk:** If an exam file is modified (fixing wrong answers, adding questions), stored "best score" corresponds to a different version. Users have no way to know.
* **Recommendation:** Include a version or content hash field in each exam JSON. On load, compare stored version against current; flag history as outdated or clear it.

---

### N10. Theme System Requires CSS Discipline

* **Lenses:** structural
* **Dimension:** Maintainability
* **Risk:** Without a framework, theme consistency relies on disciplined use of custom properties. Hardcoded values bypass the theme system.
* **Recommendation:** Establish a rule: no color, background, border-color, or box-shadow value outside the theme definition block. Document for future modifications.

---

### N11. No Grading Debug Mode

* **Lenses:** codebase-details
* **Dimension:** Observability
* **Risk:** No mechanism to verify grading correctness. Subtle bugs (off-by-one, type coercion) produce incorrect scores with no trace.
* **Recommendation:** Add a debug mode (e.g., `?debug=true` URL parameter) that logs each question's expected answer, user answer, and match result to the console.

---

## Architectural Coupling Topology

The design contains four implicit contracts, now addressed:

1. **AI prompt <-> JSON schema** -- enforced by `data/exam-schema.json` + `scripts/validate.js`
2. **JSON schema <-> frontend rendering/grading** -- runtime defensive checks in `exam.js`
3. **JSON schema <-> manifest script** -- the same validation script runs locally and in the GitHub Action, and the manifest is only built after validation passes
4. **localStorage data shape <-> frontend code version** -- `schemaVersion` field + migration function

---

## Resolutions

### Major Finding Resolutions

| ID | Finding | Resolution |
| --- | --- | --- |
| M1 | No JSON Schema Validation | Formal `data/exam-schema.json`. `scripts/validate.js` runs in the GitHub Action on every push and fails the deploy on any violation (the live site keeps the last good version). The same script can be run locally for quick feedback. Runtime checks in `exam.js`. User-visible errors. |
| M2 | localStorage No Version | `schemaVersion: 1` at top level. Version check on page load (unknown or corrupt data is reset). All access in try/catch. One namespaced key, `brova`. |
| M3 | Exam ID Uniqueness | Validation script enforces uniqueness. Convention: `<course-slug>-<exam-type>-<semester-slug>`. IDs immutable. "Clear History" button. |
| M4 | Semester/Course Normalization | `data/config.json` lists valid semesters and courses. Each course is a code plus a display name (e.g. `SEC3302` / أمن الشبكات). Exam files reference the course by code, so spelling variants of the name cannot split the navigation. Validation checks against it. AI prompt includes valid values. |
| M5 | 0-Based Index Error-Prone | Switch to letter keys `"A"` to `"F"` (questions may have 2 to 6 options). Validation rejects a letter beyond the question's option count (e.g. `"E"` with 4 options). Renderer maps letters to indices. |
| M6 | No Type Discriminator | Already in schema (`"mc"`, `"tf"`). Renderer switches on type, warns on unrecognized. |
| M7 | No Error Reporting | `window.onerror` handler. In-page error banner. "Report this error" -> pre-filled GitHub Issue. |
| M8 | No Fetch Handling | All fetches check `response.ok` (GitHub Pages returns a real 404 status for missing files). Separate catch for invalid JSON. User-visible messages with the URL, inserted as plain text. |
| M9 | Action No Observability | The Action logs files found, files validated, and every violation by file and question. It exits non-zero on any violation, which blocks the deploy; GitHub emails the repo owner on a failed run. Status badge in README. |
| M10 | No Cache-Busting | The build replaces a `__BUILD__` placeholder in JS/CSS links (`app.js?v=__BUILD__`) with the commit ID on every deploy, so there is no version number to bump by hand. JSON is fetched with `cache: "no-cache"`. Graceful degradation on unknown JSON fields. |
| M11 | LLM Budget Uncapped | Not applicable: the owner generates exams in the Claude and Gemini chat apps under a subscription, so there is no per-token cost. The standard prompt template in `prompts/generate-exam.md` still keeps prompts consistent. |
| M12 | GitHub Pages Bandwidth | Documented published limits: 100 GB/month bandwidth, 1 GB site size. If outgrown, the same static files move to another static host without code changes. |
| M13 | No Question Reporting | "Report" link per question -> pre-filled GitHub Issue with exam ID + question number. |
| M14 | Replaceable by Google Forms | Differentiators: AI bulk generation, instant per-question feedback, custom UX, ownership, portfolio value. |

### Nit Resolutions

| ID | Finding | Resolution |
| --- | --- | --- |
| N1 | Three Themes Premature | One theme + `prefers-color-scheme` auto dark mode. No switcher UI. |
| N2 | Topic Breakdowns Not MVP | Rejected by the owner: the topic breakdown was an explicit choice and stays in v1. Every question carries a required `topic`; the score summary shows correct/total per topic. |
| N3 | Full History Not MVP | v1: last score + total + date only. Full history is v2. |
| N4 | Hierarchical Nav Premature | Rejected by the owner: semester > course > exam navigation was an explicit choice and stays in v1. The site remembers the last semester and course the student opened. |
| N5 | GitHub Action Premature | Rejected by the owner: "drop a JSON file and push" was an explicit requirement, and the Action is the only place validation is enforced for every upload (including uploads made on github.com). The Action validates, builds the manifest, and deploys. |
| N6 | Manifest No Version | `schemaVersion: 1` + `generatedAt` timestamp. "Hard-refresh" message on mismatch. |
| N7 | No Exam Ordering | Optional `date` field. Sort by date desc, fallback alphabetical. |
| N8 | No PWA | Out of scope for v1. Documented as future enhancement. |
| N9 | Exam Mutation Invalidates History | `version` field in exam JSON. Compare on load, flag outdated history. |
| N10 | Theme CSS Discipline | Rule: all colors via `:root` custom properties only. Documented in `style.css`. |
| N11 | No Grading Debug Mode | `?debug=true` logs expected/actual/match per question to console. |

---

## Revised MVP Scope (v1)

After addressing all Goldfish findings, and restoring the owner's explicit choices that the first pass reversed (semester > course navigation, topic breakdown, drop-a-file-and-push), the v1 scope is:

1. **Two HTML pages**: `index.html` (semester > course > exam navigation, remembers last semester and course) + `exam.html` (exam renderer/grader)
2. **GitHub Action** on every push: validate all exams, build `manifest.json`, deploy to GitHub Pages. A failed validation blocks the deploy.
3. **Exam JSON** with explicit `type` field, letter-key correct answers (`"A"` to `"F"`), required `topic`, version field, optional date, optional code snippet
4. **Formal JSON Schema** (`data/exam-schema.json`) + `scripts/validate.js`, used by the Action and runnable locally
5. **Client-side grading**: instant per-question feedback, score summary with per-topic breakdown, explanations
6. **Minimal localStorage**: last score per exam, last semester/course, schemaVersion, try/catch, single `brova` key
7. **One CSS theme** built on Open Props tokens, with `prefers-color-scheme` dark mode, all colors via custom properties. Open Props is the current choice and may change after the UI mockups.
8. **Error handling**: fetch checks, user-visible errors, `window.onerror`, "Report" links -> GitHub Issues (students need a GitHub account; accepted)
9. **Security**: all exam data and URL values are inserted as plain text, never as HTML; the exam `id` from the URL must match a strict pattern before it is used
10. **Grading debug mode** via `?debug=true`
11. **Standard AI prompt template** in `prompts/generate-exam.md`
12. **`data/config.json`** with valid semesters and the current courses:

| Code | English name | Arabic name |
| --- | --- | --- |
| CS3019 | Design & Analysis of Algorithms | تصميم وتحليل الخوارزميات |
| SEC3104 | Security Risk Management | إدارة المخاطر الأمنية |
| SEC3204 | Software Security | أمن البرامج |
| SEC3205 | Web Development & Security | تطوير وأمن الويب |
| SEC3302 | Network Security | أمن الشبكات |

Initial semester: First Semester 2026/27 (الفصل الدراسي الأول 2026/27), ID `first-2026-27`.

13. **Language**: English interface by default, with a toggle to an Arabic interface (right-to-left layout, Arabic labels). Exams are written in English only, because the courses are tested in English. The site name (Brova · بروفة) and course names always show English and Arabic side by side, with the interface language first.

The site is public, including answer keys in the JSON files. Accepted by the owner.

### v2 Backlog

* Full localStorage history (attempts, best score, per-topic best)
* Theme switcher + additional themes
* PWA / offline support
* Error tracking service integration

---

## What the Hypothesis Gets Right

The design demonstrates strong minimalist instincts that are preserved:

* **No framework** -- vanilla HTML/CSS/JS for a site this small is the correct call
* **No backend, no database** -- static hosting with client-side JSON fetching is the simplest architecture
* **No user accounts** -- authentication would be disproportionate to audience size
* **No timer** -- avoids pressure and UX complexity for no clear benefit in practice mode
* **Flat `data/exams/` directory** -- no nested structure is appropriate for a small corpus
* **GitHub Pages hosting** -- zero infrastructure cost, familiar to the author

---

## Alternatives Weighed

| Alternative | Why Rejected |
| --- | --- |
| Google Forms quiz mode | No AI bulk generation, no per-question instant feedback, no custom UX, no ownership |
| Jekyll on GitHub Pages | Jekyll's `_data` folder does read JSON, and a Liquid template could build the exam list on every push with no Action. Rejected because Jekyll cannot check exams against a schema or block a bad deploy, and files in `_data` are not served individually, so every exam would ship in one combined file. |
| React/Vue SPA | Overkill for a quiz site, adds npm/build complexity, framework dependency |
| Backend + database | Unnecessary for target audience size, hosting cost, operational burden |
| 1-based correct index | Letter keys ("A", "B") are clearer than either 0-based or 1-based integers |
| Three themes at launch | Premature -- one theme + auto dark mode covers the need |
| Local scripts only (no Action) | Adds two manual steps to every new exam, and nothing validates an exam uploaded through github.com. Contradicts the drop-a-file-and-push requirement. |
| Flat exam list (no semester/course levels) | Owner chose semester > course > exam navigation. |

---

## Key Decisions & Staging for Next Steps

1. **JSON schema with letter-key answers** is the single source of truth
2. **Validation-first**: formal schema + validation script before any rendering code
3. **Error visibility**: every failure path shows a user-visible message, never silent
4. **Scope discipline**: v1 is intentionally small, v2 backlog is documented
5. **AI prompt template** standardizes exam generation across models
6. **Design system**: Open Props for CSS tokens, one theme + auto dark mode. Chosen by the owner, open to change after the UI mockups.
7. **Publishing**: drop a JSON file in `data/exams/` and push; the Action validates, builds, and deploys.
8. **UI design**: rough mockups are iterated after the design document, before implementation.
9. **Language**: English interface with an optional Arabic toggle; English-only exam content. *(Superseded after review: see below.)*

---

## Post-Review Decisions (2026-11-02)

After the EGM review (`consolidated_review_report.md`), the author decided the following. Where these conflict with anything above, these win; `docs/designs/brova.md` is the current design.

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Arabic interface | Moved to v2. The interface is English only. The site name (Brova · بروفة) and course names still always show Arabic beside the English. |
| 2 | Cache busting | Keep the automatic build stamp, and add a source check that fails the build if any local file reference lacks `?v=__BUILD__`. |
| 3 | Exam version | The author no longer writes a `version`. The build computes a short content hash of each exam's questions; "(older version)" compares hashes. |
| 4 | Remembered position | Only the last semester, not the last course. |
| 5 | Browser re-checks | Removed. The Action's validation is the only content check; the browser shows one load message, one network message, and one render-failure message. |
| 6 | Debug mode and error reports | Both kept. |
| 7 | Answer-key review | The author does not review every AI-generated answer key. Wrong keys are caught through student reports; recorded as an accepted risk. |
| 8 | Report button | A small button appears beside a question once the student has answered it. The report includes the marked correct answer only after "Check Answers." |

Also changed from the review's mechanical fixes:
* Question numbers are their position; questions have no `id` field. The exam ID is the file name, so the JSON has no `id` field either.
* `date` is required.
* `config.json` is validated too.
* One build mode writes `_site/`.
* Node 24.
* Exact versions for the dependencies and GitHub Actions.
* Implementation is split into six phases, and only Phase 5 (styling) waits for the UI mockups.

## UI Decisions (2026-11-02)

After the UI mockups (canvas "Brova Mockups"), the author decided the following. These override "Open Props ... may change after the UI mockups" (scope item 7 and key decision 6) and "UI design: rough mockups" (key decision 8). The full spec is `docs/designs/brova-ui.md`; OQ-1 in `docs/designs/brova.md` is resolved.

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Direction | B, "Dark & modern." Dark only: no light mode, no switcher, whatever the system setting is. The bright (C) and clean (A) directions are rejected. |
| 2 | Palette and fonts | Violet accent with lime as the second color. Open Props stays as the palette base. Fonts: Space Grotesk, IBM Plex Sans, IBM Plex Sans Arabic, JetBrains Mono. |
| 3 | Logo | Concept D: the Kufi wordmark "بروفة" (Reem Kufi) on a violet tile with "BROVA" in lime beside it. It shows both names, so the bilingual header rule still holds. |
| 4 | Favicon | Option 3, "Exam sheet": the white Kufi "ب" on a violet sheet with a folded lime corner (OQ-3, resolved). |
| 5 | New features from the mockups | Breadcrumb on the exam page; question map with per-question result and links; "Next in {course}" card; topic tiles instead of a topic table; dashed lime outline for the correct answer a student missed; syntax colors in code blocks. |

| 6 | Syntax highlighting | OQ-4, resolved: a hand-written tokenizer, `js/highlight.js`, not a library stored in the repository, so `check-source.js` needs no exemption. New optional question field `codeLanguage` (shell, python, c, java, javascript, html, sql); without it the label reads "code". |

| 7 | Fonts | OQ-5, resolved: self-hosted `.woff2` files in `fonts/` (about 200–300 KB, estimate), so nothing loads from Google. The wordmark is SVG paths, so Reem Kufi is not loaded. |

| 8 | Course names | OQ-2, resolved: the official English titles supplied by the author ("&" as written), and الأمنية with a hamza in SEC3104's Arabic name. |

No open questions remain in `docs/designs/brova.md`.

## Round-2 Review Decisions (2026-11-02)

After a second EGM review and an outside review by Gemini, the author approved every fix in `review_triage.md`. The decisions that changed earlier choices:

| # | Topic | Decision |
| --- | --- | --- |
| A1 | Open Props | The colors stay Open Props values, written into `css/style.css`; the Open Props file is not shipped. |
| A2 | Code coloring | Full coloring for shell only; other languages color quoted text and numbers until an exam needs more. The tokenizer is renamed `js/syntax.js`. |
| A3 | Report control | After grading, every question has one, including unanswered ones. Before grading it still appears only after an answer is chosen. It is a link, not a button. |
| A4 | Untaken exams | Cards show "Not taken", as in the mockup. |
| A5 | Score bars | Filled with the lighter violet `#b197fc` to pass 3:1 contrast. |
| A6 | True/false on phones | Options stack in one column below 480 px wide. |

Not adopted: stamped asset folders, validator warnings, a canonical content hash, font preloading, and a `storage` event listener (reasons in `review_triage.md`).

Where earlier sections of this brief conflict with the design doc, the design doc wins. In particular, the Arabic interface toggle (MVP item 13) moved to v2, and the manifest's `schemaVersion`/`generatedAt` (N6) were dropped under Post-Review decision 5.
