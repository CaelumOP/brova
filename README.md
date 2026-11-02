# Brova · بروفة

[![Deploy](https://github.com/CaelumOP/brova/actions/workflows/deploy.yml/badge.svg)](https://github.com/CaelumOP/brova/actions/workflows/deploy.yml)

**https://caelumop.github.io/brova/**

Brova (بروفة, "rehearsal") is a mock-exam site for my courses. Pick an exam and
answer the multiple-choice and true/false questions: each answer is checked as
soon as you choose it, with the correct answer and an explanation. Click
**Finish and see score** for your total and your score per topic. Your last
score is saved in your browser.

It is a static site: plain HTML, CSS, and JavaScript on GitHub Pages, with no
server and no accounts. The design is in [`docs/designs/brova.md`](docs/designs/brova.md)
and the look in [`docs/designs/brova-ui.md`](docs/designs/brova-ui.md).

> **Everything here is public:** the site, the answer keys inside the exam files,
> and any question reports students file.

## Add an exam

1. Open [`prompts/generate-exam.md`](prompts/generate-exam.md), copy the prompt
   into an AI chat, fill in the course, semester, and what to cover, and attach
   your notes (or an existing question bank with answers).
2. Save the reply as `data/exams/<id>.json`, for example
   `sec3302-practice-2-first-2026-27.json`. Use lowercase letters, digits, and
   single hyphens.
3. Optional: run `npm run validate` (see "Check locally").
4. Push to `main`, from the command line or by uploading the file on github.com.

The GitHub Action checks the exam and, if it passes, publishes it. The site shows
it within about 10 minutes (GitHub Pages lets browsers cache pages that long).

**Do not rename an exam file later.** The file name is the exam's ID, so renaming
it loses everyone's saved scores for that exam and breaks links people shared.

## Add a course or semester

1. Edit [`data/config.json`](data/config.json): add the course (`code`, English
   and Arabic `name`) or the semester (`id`, `name`). Semesters are listed newest
   first; that order is the order on the site.
2. Add the same course code or semester ID to the tables in
   [`prompts/generate-exam.md`](prompts/generate-exam.md). A test fails until you do.

A course with no exams does not appear on the site.

## Check locally

Needs Node 24.

```bash
npm ci
```

```bash
npm run validate
```

```bash
npm run preview
```

Then open http://localhost:8080. `npm test` runs the unit tests, and `npm run check`
runs the source checks.

## When a run fails

Open the failed run under the repository's **Actions** tab and expand
**Validate and build**. Each problem is one line, for example:

```text
data/exams/sec3302-quiz.json: question 3: correct answer "E" but only 4 options [correct-out-of-range]
```

That is the file, the question number, what is wrong, and a rule name. Nothing is
published while any exam fails, and the live site keeps its previous version.
Every later push fails too until you either fix the file and push again, or undo
the bad commit:

```bash
git revert HEAD
```

```bash
git push
```

GitHub emails you about failed runs if Actions notifications are on (they are by
default).

## When a student reports a question

A student's report opens as a GitHub issue with the exam, the question, their
answer, and their reason. To fix it, edit the exam file, push, and close the
issue. The build recomputes the exam's version, so students' old scores for it
are marked "(older version)".

## Hosting limits

GitHub Pages allows about 100 GB of traffic per month and a 1 GB site. The site
is a few hundred KB plus the exam files, so this is far beyond what a class
needs.
