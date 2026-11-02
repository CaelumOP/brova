# Prompt: generate a Brova exam

Copy everything below the line into an AI chat. Fill in the three things in
`[square brackets]`, then attach or paste your lecture notes (or an existing
question bank). Save the reply as `data/exams/<id>.json` (see "File name" at the
end), run `npm run validate`, and push.

---

You are writing a practice exam for Brova, a mock-exam website for university
students. Reply with **only the exam as JSON**: no commentary, no Markdown code
fence, nothing before or after it. Write all exam text in English.

**Exam details**

- Course code: `[course code from the list below]`
- Semester ID: `[semester ID from the list below]`
- What to cover: `[for example: "chapters 3 and 4, about 25 questions"]`

Course codes:

| Code | Course |
| --- | --- |
| `CS3019` | Design & Analysis of Algorithms |
| `SEC3104` | Security Risk Management |
| `SEC3204` | Software Security |
| `SEC3205` | Web Development & Security |
| `SEC3302` | Network Security |

Semester IDs:

| ID | Semester |
| --- | --- |
| `first-2026-27` | First Semester 2026/27 |

**Rules**

1. Follow the JSON Schema below exactly. Use no field that it does not list.
2. `title`: a short exam name, for example `Network Security — Practice Exam 2`.
   `description`: one sentence on what the exam covers. `date`: today's date as
   `YYYY-MM-DD`.
3. Multiple choice (`"type": "mc"`):
   - 2 to 6 options, all different, with exactly one correct answer.
   - `correct` is a letter: `"A"` is the first option, `"B"` the second, and so on.
   - Spread the correct letters across A, B, C, D (and E, F when used); do not
     let one letter dominate.
   - Do not write the letter inside the option text (no `"A) …"`); the site adds it.
4. True/false (`"type": "tf"`):
   - No `options` field.
   - `correct` is `true` or `false` (no quotes). Mix true and false answers.
5. Topics: use 3 to 6 topics for the whole exam. Every question on the same topic
   must use exactly the same `topic` text, letter for letter, because the site
   groups the score by topic.
6. Explanations: every question needs one. Say why the correct answer is right
   and, for multiple choice, why the most tempting wrong option is wrong. Then
   check that the explanation agrees with `correct`: if it argues for a
   different answer, fix one of them.
7. Code: put any code, command, or config snippet in `code`, never inside
   `question`. Use `\n` for line breaks. Set `codeLanguage` when the code is one
   of: `shell`, `python`, `c`, `java`, `javascript`, `html`, `sql`. Leave it out
   otherwise.
8. Write original questions from the material. Do not copy questions from real
   past exams.

**If you were given an existing question bank with answers instead of notes**

- Keep every question, every option, and every answer exactly as given; do not
  change, drop, or reorder anything. Remove letters like `A)` from the start of
  options.
- Use the bank's chapters or sections as topics.
- Write the explanations yourself, following rule 6.
- If you believe a given answer is wrong, keep it anyway, and start that
  question's explanation with `Check this answer:` followed by your reason, so
  the author can review it. Still reply with JSON only.

**JSON Schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Brova exam",
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "course", "semester", "description", "date", "questions"],
  "properties": {
    "title": { "$ref": "#/$defs/text" },
    "course": { "type": "string" },
    "semester": { "type": "string" },
    "description": { "type": "string" },
    "date": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
    "questions": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/question" }
    }
  },
  "$defs": {
    "text": { "type": "string", "minLength": 1, "pattern": "\\S" },
    "question": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "topic", "question", "correct", "explanation"],
      "properties": {
        "type": { "enum": ["mc", "tf"] },
        "topic": { "$ref": "#/$defs/text" },
        "question": { "$ref": "#/$defs/text" },
        "code": { "$ref": "#/$defs/text" },
        "codeLanguage": { "enum": ["shell", "python", "c", "java", "javascript", "html", "sql"] },
        "options": {
          "type": "array",
          "minItems": 2,
          "maxItems": 6,
          "uniqueItems": true,
          "items": { "$ref": "#/$defs/text" }
        },
        "correct": {},
        "explanation": { "$ref": "#/$defs/text" }
      },
      "dependentRequired": { "codeLanguage": ["code"] },
      "allOf": [
        {
          "if": { "required": ["type"], "properties": { "type": { "const": "mc" } } },
          "then": {
            "required": ["options"],
            "properties": { "correct": { "type": "string", "pattern": "^[A-F]$" } }
          }
        },
        {
          "if": { "required": ["type"], "properties": { "type": { "const": "tf" } } },
          "then": {
            "not": { "required": ["options"] },
            "properties": { "correct": { "type": "boolean" } }
          }
        }
      ]
    }
  }
}
```

**A worked example** (three questions; a real exam has more)

```json
{
  "title": "Network Security — Practice Exam 2",
  "course": "SEC3302",
  "semester": "first-2026-27",
  "description": "Firewall rules and common network attacks.",
  "date": "2026-11-03",
  "questions": [
    {
      "type": "mc",
      "topic": "Firewalls",
      "question": "What does this rule do on a Linux host?",
      "code": "iptables -A INPUT -p tcp --dport 22 -j DROP",
      "codeLanguage": "shell",
      "options": [
        "Allows incoming SSH connections",
        "Silently discards incoming TCP traffic to port 22",
        "Discards outgoing TCP traffic to port 22",
        "Refuses incoming SSH connections with an ICMP error"
      ],
      "correct": "B",
      "explanation": "The rule is added to the INPUT chain, matches TCP traffic to port 22 (SSH), and jumps to DROP, which discards packets without replying. REJECT, not DROP, would send an error back, so option D is wrong."
    },
    {
      "type": "tf",
      "topic": "Firewalls",
      "question": "A stateless packet filter keeps track of TCP connections.",
      "correct": false,
      "explanation": "Tracking connections is what a stateful firewall does. A stateless filter judges each packet on its own header fields."
    },
    {
      "type": "mc",
      "topic": "Network Attacks",
      "question": "Which attack fills a server's table of half-open TCP connections?",
      "options": ["Smurf attack", "SYN flood", "ARP spoofing", "DNS amplification", "Ping of death"],
      "correct": "B",
      "explanation": "A SYN flood sends SYN segments and never completes the handshake, so the server keeps state for each half-open connection until its backlog is full. DNS amplification also denies service, but by flooding the victim with large replies, not by using up connection state."
    }
  ]
}
```

---

## File name

Save the exam as `data/exams/<id>.json`. The ID uses lowercase letters, digits,
and single hyphens, for example `sec3302-practice-2-first-2026-27`. The suggested
pattern is `<course code>-<exam name>-<semester ID>`.

The file name is the exam's ID on the site, so renaming the file later loses
students' saved scores for it and breaks links people shared.
