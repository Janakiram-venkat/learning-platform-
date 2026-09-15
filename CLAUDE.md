# CLAUDE.md — Web Dev Course Authoring Guide (Pocket Lab)

This file documents the exact content pattern to use when authoring the
**`web-dev` course** for Pocket Lab, so every module/lesson/assignment/
project is generated consistently and matches how `courses/python/` is
already structured on this platform. Follow this spec exactly — it's a
**template**, not a suggestion — so the frontend course/lesson pages
and Monaco editor keep working the same way across every course.

---

## 1. Big Picture Structure

`web-dev` is **one course**, sitting parallel to `ai`, `gamedev`, and
`python` under `courses/`. It is **not** split into separate Static /
Responsive / Dynamic courses — those are just the three learning
*phases* that together make up this course's 10 modules.

```
COURSE: web-dev
 └── 10 MODULES (module1 → module10)
      ├── Modules 1–2   → Phase: Static Website
      ├── Modules 3–5   → Phase: Responsive Website
      └── Modules 6–10  → Phase: Dynamic Website (JavaScript)
```

Each module has content spread across four parallel locations (see §2),
all keyed by the same `moduleN` filename so they line up 1:1.

---

## 2. Repository Structure

```
courses/
  web-dev/
    course.json
    module1.json
    module2.json
    module3.json
    module4.json
    module5.json
    module6.json
    module7.json
    module8.json
    module9.json
    module10.json
    assignments/
      module1.json
      module2.json
      ...
      module10.json
    lessons/
      module1.json
      module2.json
      ...
      module10.json
    projects/
      module1.json
      module2.json
      ...
      module10.json
```

- **`course.json`** — top-level course metadata + module index.
- **top-level `moduleN.json`** — that module's overview/metadata
  (title, objectives, summary). This is what `/api/courses/{course_id}
  /modules/{module_id}` returns.
- **`lessons/moduleN.json`** — the actual teaching content (concept
  explanations + code examples) for that module, broken into lesson
  units.
- **`assignments/moduleN.json`** — the module's quiz (5 MCQs), the
  graded checkpoint for that module.
- **`projects/moduleN.json`** — the hands-on build task for that
  module (mini project or, for the last module of a phase, the
  capstone project).

`course_id` = `web-dev`. `module_id` = `module1` ... `module10`
(matches filenames exactly, no dash/underscore mismatch).

---

## 3. `course.json` Shape

```json
{
  "course_id": "web-dev",
  "title": "Web Development",
  "description": "Learn to build static, responsive, and dynamic websites from scratch.",
  "order": 4,
  "modules": [
    { "module_id": "module1", "title": "HTML Foundations: Structuring a Webpage", "order": 1 },
    { "module_id": "module2", "title": "CSS, Bootstrap & Bringing It to Life", "order": 2 }
  ]
}
```
List all 10 modules here in order. `order` at the course level is this
course's position relative to `ai`/`gamedev`/`python` on the Courses
page; `order` inside each module entry is its position within
`web-dev`.

---

## 4. Top-Level `moduleN.json` Shape (module overview)

```json
{
  "module_id": "module1",
  "title": "HTML Foundations: Structuring a Webpage",
  "phase": "static",
  "summary": "One-sentence learner-facing summary of this module.",
  "objectives": [
    "Understand how the browser renders HTML",
    "Structure a page using semantic tags",
    "Use IDs and classes to organize sections"
  ],
  "lesson_count": 6
}
```
`phase` is one of `"static"`, `"responsive"`, `"dynamic"` — used purely
for grouping/progress display on the frontend (e.g. a progress bar
split into three labeled segments even though it's one course).

---

## 5. `lessons/moduleN.json` Shape

An array of lesson units for that module — concept explanation + a
runnable code example each. No XP/badges; keep it direct and
instructional.

```json
[
  {
    "lesson_id": "module1-lesson1",
    "title": "How the Web Works & Your First HTML Page",
    "content_blocks": [
      { "type": "explanation", "body": "Plain-language teaching text, short sentences." },
      { "type": "code_example", "language": "html", "code": "<!DOCTYPE html>\n<html>...</html>" }
    ],
    "estimated_minutes": 15
  }
]
```
Every lesson must ship a runnable code example — no concept explained
in prose alone.

---

## 6. `assignments/moduleN.json` Shape (module quiz)

```json
{
  "module_id": "module1",
  "questions": [
    {
      "question": "Which tag is used to create a hyperlink?",
      "options": ["<link>", "<a>", "<href>", "<nav>"],
      "correct_index": 1
    }
  ]
}
```
Exactly 5 questions per module, one correct answer each, short
plausible distractors, no "all of the above."

---

## 7. `projects/moduleN.json` Shape

```json
{
  "module_id": "module1",
  "title": "Mini Project: Page Skeleton",
  "type": "mini | capstone",
  "instructions": "Build the unstyled HTML skeleton of a multi-section site using everything from this module.",
  "starter_code": "<!DOCTYPE html>\n<html>\n  <body>\n    <!-- start here -->\n  </body>\n</html>",
  "solution_code": "<!DOCTYPE html>...full reference solution..."
}
```
`type: "mini"` for most modules; `type: "capstone"` for the last
module of each phase (modules 2, 5, and 10 — see §8), where
`instructions` should describe the full target build (matching the
phase's reference sample provided during planning).

---

## 8. Module Breakdown (all 10, in order)

**Phase: Static Website**
- **Module 1 — HTML Foundations: Structuring a Webpage**
  Lessons: How the Web Works & First HTML Page · Text & Semantic
  Structure · Links, Images & Media · IDs, Classes & Sections · Forms
  & Buttons · *(project: mini)* Page Skeleton
- **Module 2 — CSS, Bootstrap & Bringing It to Life**
  Lessons: CSS Basics · Box Model, Colors & Typography · Backgrounds
  & Full-Screen Sections · Flexbox Layout · Bootstrap Framework (CDN +
  Grid Intro) · Bootstrap Components (Navbar, Carousel) · Just Enough
  JavaScript for Static Sites · *(project: capstone)* Multi-Section
  Static Site

**Phase: Responsive Website**
- **Module 3 — Responsive Design Foundations**
  Lessons: Why Responsive? Fixed vs Fluid · Viewport Meta Tag &
  Mobile-First · CSS Units for Responsive Design · Intro to Media
  Queries · Flexbox for Responsive Layouts · *(project: mini)* Reflow
  a Fixed Card
- **Module 4 — Bootstrap Grid System**
  Lessons: Breakpoints & the 12-Column Grid · Column Sizing per
  Breakpoint · Combining Grid with Flexbox Utilities · Responsive
  Visibility Utilities · Responsive Spacing & Sizing Utilities ·
  *(project: mini)* Responsive Hero Section
- **Module 5 — Bootstrap Components & Polished UI**
  Lessons: Gradients & Custom Buttons · Google Fonts + Typography at
  Scale · The Bootstrap Modal Component · Responsive Images Inside
  Modals & Cards · Accessibility Basics for Responsive UI ·
  *(project: capstone)* Full Responsive Page Rebuild

**Phase: Dynamic Website (JavaScript)**
- **Module 6 — JavaScript Fundamentals**
  Lessons: Variables & Data Types · Operators & Expressions ·
  Conditionals · Functions · Loops · *(project: mini)* Console
  Calculator
- **Module 7 — Arrays, Objects & Working with Data**
  Lessons: Arrays · Array Iteration · Objects · Arrays of Objects ·
  *(project: mini)* To-Do List Logic (console only)
- **Module 8 — The DOM**
  Lessons: What is the DOM? · Selecting Elements · Reading & Changing
  Content · Changing Styles & Classes · Creating & Removing Elements ·
  *(project: mini)* Render an Array to the Page
- **Module 9 — Events & Interactivity**
  Lessons: Event Listeners · The Event Object · Handling User Input ·
  Managing State That Changes Over Time · Random Numbers & Basic Game
  Logic · *(project: capstone)* Number Guessing Game
- **Module 10 — Bringing It Together**
  Lessons: Combining Arrays + DOM + Events · Add/Delete/Toggle Pattern
  · Filtering & Displaying Subsets · Saving State with localStorage ·
  Styling Interactive States · *(project: capstone)* To-Do List App

---

## 9. Live Preview Requirement (Backend Note)

Unchanged technical point regardless of folder structure: this course
does **not** need server-side code execution like Python's
`/api/run-python`. HTML/CSS/JS should render client-side in a
sandboxed `<iframe srcdoc="...">`, updated live as the student types.
No new backend endpoint is required for any of the 10 modules above.

---

## 10. Style Rules (apply everywhere)

- **Tone:** clear, direct, second-person instructional. No
  gamification language (no XP/badges/villains) unless product
  direction changes.
- **Reading level:** short sentences, beginner-friendly, define new
  terms on first use.
- **Every lesson ships a runnable code example.**
- **Every module has exactly:** 1 `moduleN.json` overview, 1
  `lessons/moduleN.json` (multiple lesson units), 1
  `assignments/moduleN.json` (5-question quiz), 1
  `projects/moduleN.json` (mini or capstone).
- **Progressive dependency:** never use a concept before its
  prerequisite lesson has taught it.
- **Capstone modules (2, 5, 10):** the project must be buildable into
  something equivalent to the phase's reference sample (Tourism
  static site → Module 2; gift-voucher responsive page → Module 5;
  number guesser & to-do list → Modules 9–10).
- **No backend dependency** anywhere in this course, per §9.

---

## 11. Workflow When Asked to "Create Module N"

1. Confirm the module number (1–10) and its phase, per §8.
2. Create/update `course.json`'s module index entry if not already
   present, per §3.
3. Write the top-level `moduleN.json` overview, per §4.
4. Write `lessons/moduleN.json` with all lesson units, per §5.
5. Write `assignments/moduleN.json` with exactly 5 quiz questions,
   per §6.
6. Write `projects/moduleN.json` — `type: "mini"` normally,
   `type: "capstone"` if this is module 2, 5, or 10 — per §7.
7. Proofread for: correct HTML/CSS/JS syntax, no undefined
   prerequisite concepts, consistent `module_id` naming across all
   four files for this module (`module1`, not `module-1` or `Module1`).