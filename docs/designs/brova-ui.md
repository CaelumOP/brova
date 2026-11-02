# Brova UI — Direction B "Dark & modern"

* **Author:** CaelumOP
* **Status:** Accepted (resolves OQ-1 in [brova.md](brova.md)), 2026-11-02
* **Source:** the B artboards on the [Brova Mockups canvas](https://claude.ai/artifact/JBAkYk4zyk3YhDYVLa7hke): `B-Exam` (graded exam page), `B-Home` (home on a phone), `B-Logo` (wordmark and favicon options)

This document is the styling spec for Phase 5. Every value below comes from the B artboards unless it says "not in the mockups", in which case it follows the same tokens.

---

## Principles

* **Dark only.** `:root` holds the only set of values and sets `color-scheme: dark`. There is no light mode and no theme switcher; the site looks the same whatever the system setting is (author's decision, 2026-11-02).
* **Tokens only.** Colors, backgrounds, borders, and shadows come only from the custom properties below. Components never use a raw hex value.
* **One accent, one highlight.** Violet is the accent (links, primary buttons, the wordmark tile, score bars). Lime marks the correct answer a student missed (and the favicon's folded corner).
* **State is never color alone.** Every answer state has an icon and text, and the missed answer also has a dashed outline.
* **Palette.** Most values are Open Props colors (`open-props@1.7.23`), written directly into `:root`; the Open Props file itself is not shipped (round-2 decision A1). The "Open Props" column names each source color. Values marked "custom" are blends for dark tinted backgrounds that Open Props does not have.

---

## Color Tokens

Names are the CSS custom properties in `css/style.css`.

### Surfaces and text

| Token | Value | Open Props | Used for |
| --- | --- | --- | --- |
| `--color-bg` | `#0d0f12` | gray-11 | Page background, unselected option rows |
| `--color-surface` | `#16191d` | gray-10 | Header, cards, question cards, summary, map |
| `--color-raised` | `#212529` | gray-9 | Explanations, letter chips, "Not answered" badge, hover fill |
| `--color-border` | `#343a40` | gray-8 | Card and row borders, header rule |
| `--color-track` | `#343a40` | gray-8 | Empty part of score bars |
| `--color-text` | `#dee2e6` | gray-3 | Body text, topic bar fill. Softened from gray-0 at the author's request (pure white was harsh on the dark background); still about 14:1 on `--color-bg` |
| `--color-muted` | `#adb5bd` | gray-5 | Secondary text, Arabic name parts, eyebrows, separators, not-answered squares |

### Accent and brand

| Token | Value | Open Props | Used for |
| --- | --- | --- | --- |
| `--color-accent` | `#b197fc` | violet-3 | Links, breadcrumb links, percentages, "Why" label, focus outline, score bar fills (overall and card) |
| `--color-accent-hover` | `#d0bfff` | violet-2 | Link hover |
| `--color-accent-strong` | `#7048e8` | violet-7 | Primary button fill, wordmark tile (not score bars: against the track it is only 2.07:1) |
| `--color-on-accent` | `#ffffff` | white | Text on `--color-accent-strong` |

### Answer states

| Token | Value | Open Props | Used for |
| --- | --- | --- | --- |
| `--color-correct` | `#69db7c` | green-4 | Border and letter chip of your correct pick |
| `--color-correct-text` | `#8ce99a` | green-3 | "Correct" badge text, "Your answer" label, correct map squares |
| `--color-correct-bg` | `#13281a` | custom | Fill of your correct pick, badge, map square |
| `--color-incorrect` | `#ff8787` | red-4 | Border and letter chip of your wrong pick |
| `--color-incorrect-text` | `#ffa8a8` | red-3 | "Incorrect" badge text, labels, map squares, error banner icon |
| `--color-incorrect-bg` | `#2c1517` | custom | Fill of your wrong pick, badge, map square, error banner |
| `--color-missed` | `#a9e34b` | lime-4 | Dashed border and chip outline of the correct answer you missed |
| `--color-missed-text` | `#c0eb75` | lime-3 | "Correct answer" label and chip letter |
| `--color-missed-bg` | `#1c2a0d` | custom | Fill of the missed correct answer |
| `--color-on-status` | `#0d0f12` | gray-11 | Letter on a solid green or red chip |


### Code block

| Token | Value | Open Props | Used for |
| --- | --- | --- | --- |
| `--code-bg` | `#212529` | gray-9 | Code panel |
| `--code-bar` | `#2b3035` | custom | Language label bar |
| `--code-border` | `#495057` | gray-7 | Panel and bar border |
| `--code-label` | `#ced4da` | gray-4 | Language label text and icon |
| `--code-text` | `#dee2e6` | gray-3 | Plain code text (softened with `--color-text`) |
| `--syn-command` | `#d0bfff`, bold | violet-2 | First word of a shell line (the command) |
| `--syn-flag` | `#66d9e8` | cyan-3 | Flags (`-A`, `--dport`) |
| `--syn-value` | `#ffe066` | yellow-3 | Values and keywords (`INPUT`, `tcp`, `DROP`) |
| `--syn-number` | `#ffa94d` | orange-4 | Numbers |
| `--syn-string` | `#8ce99a` | green-3 | Quoted text (not in the mockups) |
| `--syn-comment` | `#adb5bd`, italic | gray-5 | Comments (not in the mockups) |

### Contrast checks

Computed with the WCAG formula:

* `--color-text` and `--color-muted` pass 4.5:1 on `--color-bg`, `--color-surface`, and `--color-raised`.
* White on `--color-accent-strong` (violet-7): 5.5:1.
* Every `--syn-*` color passes 4.5:1 on `--code-bg`.
* Score bar fills (`--color-accent`) pass the 3:1 non-text rule against `--color-track`; `--color-accent-strong` (2.07:1) does not, so it is never used for bars.
* Every status text token passes 4.5:1 on its own `-bg` token.

---

## Typography

Five families, all under the SIL Open Font License. The first four are self-hosted as `.woff2` files in `fonts/` (OQ-5 in [brova.md](brova.md)): the Latin subset for Space Grotesk, IBM Plex Sans, and JetBrains Mono, and the Arabic subset for IBM Plex Sans Arabic, in the weights below, which are exactly the weights the type scale uses. Reem Kufi is never loaded; the wordmark is drawn as SVG paths. Files live in `fonts/<family>/` with the package's `LICENSE`.

| Family | Weights | Used for |
| --- | --- | --- |
| Space Grotesk | 600, 700 | Page titles, card titles, question text (`legend`), next-exam title |
| IBM Plex Sans | 400, 600 | Body text, options, explanations, buttons |
| IBM Plex Sans Arabic | 400 | Arabic parts of course names (`lang="ar"`) |
| JetBrains Mono | 400, 500, 700 | Eyebrow labels, breadcrumb, scores, percentages, letter chips, map numbers, meta lines, code |
| Reem Kufi | 700 | The wordmark "بروفة" only, as SVG paths (not loaded as a font) |

Fallbacks: `system-ui, sans-serif` for the sans families and `ui-monospace, monospace` for JetBrains Mono.

### Type scale

| Role | Family | Size / line height | Weight | Notes |
| --- | --- | --- | --- | --- |
| Body | Plex Sans | 16px / 1.55 | 400 | |
| Exam title (h1, wide) | Space Grotesk | 36px / 1.15 | 700 | 28px below 600px wide (not in the mockups) |
| Home title (h1) | Space Grotesk | 26px / 1.2 | 700 | |
| Question text (`legend`) | Space Grotesk | 20px | 600 | |
| Card title | Space Grotesk | 17px | 600 | |
| Course heading (h2) | Plex Sans | 15px | 600 | Arabic part 400, muted |
| Explanation | Plex Sans | 15px | 400 | "Why" label 600 in `--color-accent` |
| Small text | Plex Sans | 14px | 400 or 600 | 400 for card descriptions; 600 for badges and answer labels |
| Eyebrow | JetBrains Mono | 13px | 500 | Uppercase, letter-spacing 0.04em, muted ("YOUR SCORE", "Q1 · PROTOCOLS", semester names) |
| Big score | JetBrains Mono | 48px / 1 | 700 | Percentage beside it 22px in `--color-accent` |
| Topic count | JetBrains Mono | 20px | 700 | Percentage 14px 400, muted |
| Meta line | JetBrains Mono | 12px | 400 | "25 Q · Protocols · Firewalls", muted |
| Code | JetBrains Mono | 15px / 1.6 | 400 | Label bar 12px |

---

## Spacing, Radius, Layout

### Spacing

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | 4px | Breadcrumb gaps, eyebrow-to-score gap |
| `--space-2` | 8px | Gap between option rows, inside badges |
| `--space-3` | 12px | Gap inside cards, header items, option row content |
| `--space-4` | 16px | Card padding (cards 14–16px), phone gutter |
| `--space-5` | 24px | Section gaps, summary padding, desktop gutter |
| `--space-6` | 32px | Gap between questions column and question map |

### Radius

| Token | Value | Used for |
| --- | --- | --- |
| `--radius-1` | 6px | Letter chips |
| `--radius-2` | 8px | Status badges, map squares |
| `--radius-3` | 10px | Option rows, buttons, explanations, code block, topic tiles, wordmark tile |
| `--radius-4` | 12px | Cards, question cards, summary, map card, next-exam card |
| `--radius-round` | 999px | Score bars |

### Layout

* **Container:** `max-width: 1120px`, centered. Padding 20px top, 24px sides, 64px bottom; 16px sides below 600px.
* **Exam page:** a wrapping flex row with a 32px gap. The questions column is `flex: 999 1 560px`; a side column (`flex: 1 1 280px`) holds the question map with the next-exam card below it. Below about 900px the side column wraps under the questions. At wide widths the side column is `position: sticky; top: 16px` with `max-height: calc(100vh - 32px)` and `overflow-y: auto` (a sticky map inside a short column would have no room to move), and the map's main button is pinned to the bottom of the column, so "Check Answers" stays visible even on a 105-question exam (not in the mockups).
* **Home page:** one column on phones. From 700px, exam cards sit in a grid, `repeat(auto-fill, minmax(300px, 1fr))` (not in the mockups).
* **No horizontal page scroll** at 320px and wider. Code blocks scroll inside their own box. To keep this:
  * every `fieldset` has `min-inline-size: 0` (browsers default it to the width of its widest content, so a long code line would widen the page);
  * question text, options, explanations, and banners have `overflow-wrap: anywhere`, so a long URL or path wraps;
  * flex rows that hold text (question header rows, option rows) wrap or let the text shrink.
* **Tap targets:** every control is at least 44×44px (option rows are 52px tall).

---

## Components

### Header and wordmark

* A full-width bar: `--color-surface`, 1px `--color-border` bottom rule, 12px vertical padding.
* A home link holding the wordmark tile. The wordmark SVG has `aria-hidden="true"`, and a visually hidden text inside the link gives it the accessible name "Brova بروفة, home" (the Arabic word in a `lang="ar"` span).
  * **Tile:** "بروفة" in Reem Kufi 700, white, on `--color-accent-strong`, radius 10px, padding 0 12px, 22px type with line height 1.6 (20px on phones).
* The lime "BROVA" beside the tile was removed at the author's request (2026-11-03). The English name "Brova" still appears in the tab title and the link's accessible name.
* In production, the tile's Arabic word is SVG paths exported from Reem Kufi 700, so the header does not need the font (OQ-5).

### Favicon

* The wordmark is too wide for a browser tab, so the favicon is a square mark from the same lettering: the Reem Kufi 700 "ب", converted to paths from the font and sized for a 32-unit grid (glyph 22 units wide, dot enlarged to radius 2.6 so it survives at 16px).
* Three options are on the `B-Logo` board, each shown at 16 and 32px on dark and light tabs:
  1. **Kufi ب, lime dot:** white ب on a violet-7 tile, its dot in lime-4.
  2. **Lime tile:** violet-12 (`#3a2578`) ب on a lime-4 tile with a lime-9 (`#5c940d`) edge so it holds up on light tabs; dot in violet-7.
  3. **Exam sheet:** white ب on a violet-7 tile whose top-right corner is folded over in lime-4, like a test paper.
* **Chosen: option 3, "Exam sheet"** (OQ-3 in [brova.md](brova.md), 2026-11-02). Its exact geometry on the 32-unit grid:
  * sheet: `M7 0H24L32 8V25A7 7 0 0 1 25 32H7A7 7 0 0 1 0 25V7A7 7 0 0 1 7 0Z`, fill violet-7 `#7048e8`;
  * folded corner: `M24 0V5.5A2.5 2.5 0 0 0 26.5 8H32Z`, fill lime-4 `#a9e34b`;
  * the ب, moved down 2.5 units to clear the fold, fill white: `M5 17.2 7.31 13.35H23.15V17.2ZM20.95 17.2V13.35H23.15V8.7L27 7.85V16.57Q27 16.9 26.73 17.04Q26.45 17.17 26.17 17.19Q25.9 17.2 25.9 17.2Z` inside `<g transform="translate(0 2.5)">`, plus its dot, a circle at (15.6, 21.3) with radius 2.6 inside the same group. In the shipped file the transform is flattened: the glyph's y values each gain 2.5, and the dot's final center is (15.6, 23.8), below the letter's body (which ends at y 19.7).
* The shipped files are `favicon.svg` (32-unit viewBox, paths only, no `<text>`) and a 32×32 `favicon.png` fallback.

### Breadcrumb

* `<nav aria-label="Breadcrumb">` with an `<ol>`: Home / {semester name} / {course code} / {exam title}.
* JetBrains Mono 13px, letter-spacing 0.03em. Links in `--color-accent`, no underline, each with a 44px tall tap area and 6px side padding. The `/` separators are `aria-hidden` and muted. The current page is plain muted text with `aria-current="page"`.
* It wraps on narrow screens.

### Home: semester sections and course headings

* Page title "Practice exams" (h1).
* Each semester is a `<details>` whose `<summary>` is the eyebrow style (mono 13px, uppercase, muted), at least 44px tall, with a chevron icon at the inline end that points up when open. The default marker is hidden.
* Course heading (h2): English name, a muted "·", then the Arabic name in IBM Plex Sans Arabic 400, muted, `lang="ar" dir="rtl"`. It wraps as a unit.
* "Clear my scores" sits at the bottom as a secondary button.

### Exam cards and score badges

* A link card: `--color-surface`, 1px `--color-border`, radius 12px, padding 14px 16px, 8px gap between lines. Hover: border turns `--color-accent-strong` (not in the mockups).
* Line 1: the title (card title style) and, at the inline end, the score badge.
* Line 2: the description, 14px muted.
* Line 3: a 4px score bar (`--color-track` with a `--color-accent` fill at the stored percent), only when a score exists.
* Line 4: the meta line, "{n} Q · {topics joined by ·}".
* **Score badge states:**
  * Score stored: "72%" in mono 14px 700, `--color-accent`. Screen readers hear "Last score 72%" (visually hidden prefix).
  * Older version: the percent in muted, followed by "(older version)" in 12px muted. The bar fill is `--color-muted`.
  * Not taken: "Not taken" in 13px muted, no bar.

### Exam header

* The breadcrumb, then the h1 with the exam title only (`tabindex="-1"`, focused after Retake), then the bilingual course name (English 600, "·", Arabic 15px muted), then "{description} {n} questions." in muted.

### Score summary and topic tiles

* A panel (`--color-surface`, 1px border, radius 12px, padding 24px, 22px gap) shown after "Finish and see score."
* Heading "Your score" (h2, eyebrow style, `tabindex="-1"`; focus moves here after grading).
* Score line: "18/25" big score and "72%" beside it.
* An 8px overall bar (`--color-accent` fill on `--color-track`), `role="img"` with `aria-label="72 percent correct"`.
* Topic tiles in a `<ul>`, a 3-column grid on wide screens that drops to 2 and then 1 column as space runs out: each tile has 1px border, radius 10px, padding 14px; the topic name in 14px muted, "6/8" in mono 20px 700 with "75%" in 14px muted, and a 4px bar filled with `--color-text`.
* Links to wrong questions are not in the summary any more; the question map covers that.

### Question cards

* A card per question: `--color-surface`, 1px border, radius 12px, padding 16px 20px 22px, 12px gap. `id="q-N"`.
* **Header row:** the eyebrow "Q{N} · {topic}" at the start; at the end, after grading, a status badge. Both sit inside the `legend`, so screen readers also hear the result. The legend is floated so it stays inside the card instead of cutting through its border. The Report control is placed at the top inline-end corner by CSS (see below). The header row wraps on narrow screens.
* **Status badge:** radius 8px, padding 4px 10px, 14px 600, with a 16px icon:
  * Correct: check icon, `--color-correct-text` on `--color-correct-bg`.
  * Incorrect: X icon, `--color-incorrect-text` on `--color-incorrect-bg`.
  * Not answered: dash icon, `--color-muted` on `--color-raised`.
* **Question text:** 20px Space Grotesk 600, 12px below it. The `legend` contains both the eyebrow and the question text, so screen readers hear "Q3 · Protocols" and the question when entering the group.
* **Options:** native radio rows (see the four states below), 8px apart. True/false options sit side by side in a 2-column grid from 480px wide, and stack in one column below that.
* **Explanation** (after grading, on every question): `--color-raised`, radius 10px, padding 14px 16px, 15px. It starts with the inline label "Why:" in `--color-accent` 600, followed by the explanation text on the same line.

### Option rows and the four answer states

Every row is a `<label>`: flex, 12px gap, at least 52px tall, padding 8px 12px, radius 10px. Inside: the radio (18px), a 28px letter chip (radius 6px, mono 14px 700), the option text, and an optional label at the inline end (14px 600). True/false rows have no letter chip.

| State | Border | Fill | Letter chip | End label |
| --- | --- | --- | --- | --- |
| Not chosen (and not the answer) | 1px `--color-border` | `--color-bg` | `--color-raised` fill, muted letter | none |
| Your pick, correct | 1px `--color-correct` | `--color-correct-bg` | solid `--color-correct`, `--color-on-status` letter | "Your answer" in `--color-correct-text` |
| Your pick, wrong | 1px `--color-incorrect` | `--color-incorrect-bg` | solid `--color-incorrect`, `--color-on-status` letter | "Your answer" in `--color-incorrect-text` |
| Correct answer you missed | 2px dashed `--color-missed` | `--color-missed-bg` | no fill, 2px `--color-missed` outline, `--color-missed-text` letter | arrow icon + "Correct answer" in `--color-missed-text` |

Before grading (not in the mockups): a selected row gets a 1px `--color-accent-strong` border and a `--color-raised` fill; hovering an unselected row fills it with `--color-raised`. After grading, all radios are disabled and the rows keep the graded look. An unanswered question shows only the missed-answer row in color.

### Report control

* A 44×44px icon-only link (`<a target="_blank" rel="noopener">`). In the DOM it comes after the question's answers, so keyboard users reach it after choosing an answer; CSS places it in the question card's top inline-end corner.
* Before grading, hidden until the question has an answer. After grading, shown on every question, including unanswered ones.
* Transparent, radius 10px, an 18px flag icon in `--color-muted`. Hover: `--color-raised` fill and `--color-text` icon (not in the mockups).
* `aria-label` and `title`: "Report question N".

### Code block

* Inside the question, below the legend: 1px `--code-border`, radius 10px, clipped corners.
* **Label bar:** `--code-bar`, padding 6px 14px, 1px bottom border, a 14px terminal icon and the question's `codeLanguage` ("shell"), or "code" when it has none, in mono 12px `--code-label`.
* **Code:** `<pre dir="ltr"><code>` on `--code-bg`, padding 16px 18px, mono 15px / 1.6, `--code-text`, `overflow-x: auto`.
* **Highlighting:** `js/syntax.js` splits the code into tokens (OQ-4 in [brova.md](brova.md), hand-written), and each token type maps to one `--syn-*` color: `.syn-command`, `.syn-flag`, `.syn-value`, `.syn-number`, `.syn-string`, `.syn-comment`. Plain text stays `--code-text`. Only shell code uses all six; other languages show strings and numbers only.

### Question map

* An `<aside aria-label="Question map">` card: `--color-surface`, 1px border, radius 12px, padding 16px, 14px gap.
* Heading "Questions" (eyebrow style).
* A 5-column grid of links, 6px gap, each 44px tall, radius 8px, mono 14px 700, linking to `#q-N`:
  * Correct: `--color-correct-bg` fill, `--color-correct-text` number, a 10px check icon in the corner.
  * Incorrect: `--color-incorrect-bg` fill, 1px `--color-incorrect` border, `--color-incorrect-text` number, a 10px X icon in the corner.
  * Not answered: no fill, 1px dashed `--color-muted` border, muted number, a 10px dash icon in the corner.
  * The icons mean the states never depend on color alone.
  * Before grading (not in the mockups): answered squares get a 1px `--color-accent-strong` border and accent number; unanswered squares look like "Not answered" without the icon.
  * Each link's accessible name says the state: "Question 2, incorrect", "Question 3, not answered", or before grading "Question 4, answered".
* A legend row (13px muted): a 12px swatch per state with its count, "Correct 18 · Incorrect 5 · Not answered 2" (after grading only).
* The primary button at the bottom: "Finish and see score" before finishing, "Retake this exam" after. (Each question is checked as soon as it is answered; see [brova.md](brova.md#examhtml-exam).)

### Next-exam card

* In the side column, below the map: a link card (surface, 1px border, radius 12px, padding 14px 16px, 4px gap).
* Eyebrow "Next in {course code}" (mono 12px uppercase muted), the exam title in Space Grotesk 17px 600 with an arrow icon in `--color-accent` at the end, and "{n} questions" in 14px muted.
* "Next" is the next older exam in the same course and semester. Hidden on the course's oldest exam (same rule as [brova.md](brova.md#examhtml-exam)).

### Buttons

* **Primary:** `--color-accent-strong` fill, `--color-on-accent` text, no border, radius 10px, at least 44px tall, 600 weight. Hover: `--color-accent` fill with `--color-bg` text (not in the mockups).
* **Secondary:** transparent, 1px `--color-border`, `--color-muted` text, 14px, radius 10px, at least 44px tall, padding 0 14px. Used for "Clear my scores".

### Banners (not in the mockups)

* `<div id="banner">` sits above `<main>` content inside the container. Radius 10px, padding 12px 16px, 1px border, 15px text, a 16px icon at the start.
* **Error** (load failures, render failure, uncaught errors): `--color-incorrect-bg` fill, 1px `--color-incorrect` border, `--color-text` message, icon in `--color-incorrect-text`. "Report this error" is a normal link in `--color-accent`.
* **Notice** ("Invalid exam link", "No exams yet"): `--color-raised` fill, 1px `--color-border`, `--color-text`, info icon in `--color-muted`.

### Focus outlines (not in the mockups)

* Every interactive element: `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`.
* Radio inputs keep the browser's own focus ring plus the row outline (`label:has(input:focus-visible)` gets the same outline).
* The summary heading shows the outline when focus is moved to it.

### Icons

Built with `el()`, which creates SVG elements in the SVG namespace (plain `createElement("svg")` would not render). Inline stroke SVGs on a 24-unit grid, `stroke="currentColor"`, stroke width 2 (2.2–2.5 for the 16px badge icons), round caps and joins, `aria-hidden="true"`. Shapes: check, X, dash, flag, arrow right, chevron down, terminal. They follow Lucide's shapes; if path data is copied from Lucide, keep its ISC license notice in the stylesheet or script that contains it.

---

## Assets

| File | Contents |
| --- | --- |
| `favicon.svg`, `favicon.png` | The "exam sheet" favicon (OQ-3), created in Phase 2 |
| `fonts/<family>/*.woff2`, `fonts/<family>/LICENSE` | Self-hosted fonts and their licenses (OQ-5) |
| `css/fonts.css` | `@font-face` rules pointing to `../fonts/<family>/` |
| `css/style.css` | All tokens and component styles; the color values come from Open Props 1.7.23 (no Open Props file is shipped) |
| `js/syntax.js` | The code tokenizer (OQ-4) |
