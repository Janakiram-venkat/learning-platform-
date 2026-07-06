# CLAUDE.md — Science Course Chapter Authoring Guide (Class 8)

This file documents the exact content pattern used in the existing
chapters (`CHAPTER 1: The Power of Curiosity`, `CHAPTER 2: Discovering
the Invisible World`, `CHAPTER 3: Health — The Ultimate Treasure`,
`CHAPTER 4: The Mystery of the Invisible Force`) so that every new
Class 8 Science chapter is generated in the same gamified,
story-driven format. Follow this spec exactly — it is a **template**,
not a suggestion — so the platform's rendering engine, XP system, and
badge system keep working across every chapter.

---

## 1. Big Picture Structure

```
CHAPTER (one science topic, e.g. "Microorganisms", "Force & Pressure")
 └── 8 MODULES  (sub-topics inside the chapter)
      └── ~15–18 SCREENS per module, always ending in:
           1. MODULE QUIZ        (5 MCQs)
           2. MINI BOSS MISSION  (5-challenge story climax)
           3. MODULE REWARD SCREEN
           4. UNLOCK NEXT MODULE (teaser + assets list)
 └── After Module 8: FINAL CERTIFICATE + CHAPTER COMPLETE summary
```

Every chapter = **exactly 8 modules**. Every module is a
self-contained "mission" inside one continuous story arc that runs
across the whole chapter (an artifact is broken/stolen in Module 1
and fully restored/mastered by Module 8).

---

## 2. World & Story Setup (do this first, before writing screens)

Each chapter invents its own themed world. Reuse this recipe:

- **A "world/academy" name** tied to the topic
  (e.g. *Science Detective Academy*, *Microbe World*, *Health Kingdom*,
  *Electromagnetism Lab*).
- **A recurring mentor character** (always science-teacher energy,
  e.g. Dr. Curio 👩‍🔬, Professor Owl 🦉) who explains concepts.
- **A recurring robot/guide character** for missions/status updates
  (e.g. Logic Bot 🤖).
- **1–2 student peer characters** (e.g. Anaya 👧, Arjun 👦) who ask
  relatable questions and react like real students — this is what
  makes "Learn Cards" feel like a story instead of a textbook.
- **A recurring villain/threat** representing "not understanding the
  topic" (e.g. Mystery Fog 👹, a disease army, a broken crystal).
  It should be defeat-able only through correctly learning the
  science content.
- **A magical "crystal"/artifact** that is shattered/stolen at the
  start of the chapter and is restored piece-by-piece, one module at
  a time, finally fully restored in Module 8.

Keep the same characters and world across all 8 modules of one
chapter for continuity. A brand-new chapter (new topic) gets a brand
new world/characters, but should follow the identical structural
beats below.

---

## 3. Module Template (repeat this 8×)

### 3.1 Header
```
CHAPTER <N> – MODULE <M>
<MODULE TITLE IN CAPS>                    <2 topic emojis>
```

### 3.2 MODULE OVERVIEW block
```
Duration          ⏱ XX–YY Minutes        (30–45 min range)
XP Available      ⭐ 450–550 XP           (round number)
Badges Earned     🏅 <Badge 1>
                  🏅 <Badge 2>
                  🏅 <Badge 3>            (exactly 3 badges)

LEARNING OBJECTIVES
By the end of this module students will:
✅ <objective 1>
✅ <objective 2>
✅ ... (6 objectives total, curriculum-aligned, one sentence each)
```

### 3.3 STORY INTRODUCTION / STORY CONTINUATION
- Module 1 of a chapter: "STORY INTRODUCTION" — establish world,
  show the artifact breaking/threat appearing, mentor asks for help.
- Modules 2–8: "STORY CONTINUATION" — recap previous win in 1 line,
  introduce the new problem/threat for this module.
- Always ends with:
  - A short "MISSION" line (one sentence, action-oriented).
  - `XP  +10 XP` (every module starts with a flat 10 XP "entry" bonus).

### 3.4 Content Screens (SCREEN 1 → ~SCREEN 13)
Each screen is a small self-contained unit. Format:
```
SCREEN <n>
<SCREEN TITLE IN CAPS>                    <1–2 emojis>
<Screen Type Label>
<1–3 sentences of content / instructions>

<supporting bullet list, if any, using emoji bullets>

Discovery / Goal / Reward   (pick whichever applies)
<one-line takeaway, goal, or badge>

XP
+<n> XP
```

**Rotate through these screen types** (don't repeat the same type
twice in a row); each module should use 6–9 different types out of:

| Screen Type | Purpose |
|---|---|
| Learn Card | Direct concept explanation, textbook fact reframed simply |
| Story | Character dialogue that motivates or applies the concept |
| Interactive Activity / Game | Tap/catch/collect mechanic reinforcing a list of examples |
| Sorting Game | Drag items into two labeled boxes (concept vs. non-example) |
| Exploration Room | Free-roam scene with 3–5 clickable "investigate" hotspots |
| Story Gallery | Meet 2–3 real historical scientists/figures tied to the topic |
| Interactive Simulator | Student manipulates a variable and observes a result |
| Adventure Puzzle | 3–4 mini-puzzles in sequence that "weaken" the villain |
| Interactive Challenge | Rule-based decision task (allowed vs. not allowed actions) |

**XP progression rule:** XP per screen increases steadily across the
module, roughly: `20, 25, 25, 25, 30, 30, 30, 35, 35, 35, 40, 40, 45`
— i.e. start low, ramp up, biggest single-screen XP goes to the
puzzle screen right before the quiz. Total screens' XP + quiz +
mini-boss + entry bonus should sum to the module's advertised
"XP Available" (450–550).

Award a badge (🏅) on 1–2 of the harder mid-module screens, not just
at the end.

### 3.5 MODULE QUIZ (second-to-last screen)
```
SCREEN <n>
MODULE QUIZ                📝

Question 1
<question stem>
A <option>
B <option>   ✅
C <option>
D <option>

... (5 questions total, one ✅ correct answer each, options short,
     plausible distractors, no "all of the above")
```

### 3.6 MINI BOSS MISSION (final content screen)
```
SCREEN <n>
MINI BOSS MISSION
<MISSION TITLE>                <emoji>
Story
<1–2 sentence stakes: the villain/threat must be stopped now>

Students complete:
Challenge 1   <short task>      <emoji>
Challenge 2   <short task>      <emoji>
Challenge 3   <short task>      <emoji>
Challenge 4   <short task>      <emoji>
Challenge 5   <short task>      <emoji>

Final Success
<3 celebratory bullet lines with emoji>
```
Always exactly **5 challenges**, each a one-line callback to one of
the module's screens (i.e. challenges should map 1:1 to the 5 most
important concepts just taught).

### 3.7 MODULE REWARD SCREEN
```
MODULE REWARD SCREEN
Congratulations!
You completed:
MODULE <M>
<MODULE TITLE>

Rewards Earned
🏅 <Badge 1>
🏅 <Badge 2>
🏅 <Badge 3>
⭐ +<total XP> XP

Knowledge Unlocked
✔ <fact 1>
✔ <fact 2>
✔ ... (5–7 one-line takeaways, plain-language recap of the module)
```

### 3.8 UNLOCK NEXT MODULE (skip this block on Module 8 — see §4)
```
UNLOCK NEXT MODULE
🚀 MODULE <M+1>
<NEXT MODULE TITLE>                <emoji>
<1-line story hook / cliffhanger>
<1-line new threat/problem statement>

Discover:
🔍 <topic teaser 1>
❓ <topic teaser 2>
... (4–6 teaser bullets)

ASSETS REQUIRED
Characters
<emoji> <Name>   (repeat all recurring + any new characters)

Backgrounds
<emoji> <Scene name>

Animations
   ●  <Animation name>   (4–6 items)

Games
   1. <Game name>
   2. <Game name>
   ... (matches the interactive screens used in the NEXT module,
        listed in advance so designers/devs know what to build)

Rewards
🏅 <badge> 🏅 <badge> 🏅 <badge>
⭐ <XP> XP
🎁 Unlock: <Cosmetic/tool reward name>   <2–4 flourish emoji>
```
This "assets required" block is a **build spec for the dev/design
team**, not student-facing copy — it tells them exactly what
characters, backgrounds, animation, and mini-games must be produced
before the next module can be built. Always include it.

---

## 4. End of Chapter (after Module 8's quiz + mini-boss)

Instead of "Module Reward Screen → Unlock Next Module", Module 8
ends with an extended finale:

1. **Closing story beats** — mentor + guide characters congratulate
   the student, villain is fully defeated, world is saved (3–4 short
   dialogue lines), final `XP +100 XP` bonus.
2. **FINAL CERTIFICATE screen**
   ```
   FINAL CERTIFICATE                🏆
   Certificate Awarded
   <CHAPTER RANK TITLE>              (e.g. "MASTER SCIENCE DETECTIVE")
   Awarded To: 👩‍🎓 Student Name
   Successfully completed:
   CHAPTER <N>
   <one-line chapter theme summary>

   Skills Mastered
   ✅ <skill 1> ... (one per module, 8 total)

   Rewards
   🏆 <Rank Title>
   🏅 <2 elite badges>
   ⭐ +1000 XP
   🎖 Chapter Completion Medal
   ```
3. **CHAPTER COMPLETION REWARDS** — total XP earned across all 8
   modules (sum, expressed as "5,200+ XP" style), and the full list
   of every badge earned across the chapter (typically ~22–24 badges:
   3 per module × 8 modules ≈ some reused/elite ones).
4. **Final ASSETS REQUIRED** — same shape as §3.8 but "Final
   Characters / Final Backgrounds / Final Games" for the boss-battle
   finale content, plus a `Completion Rewards` block with the
   certificate, medal, XP bonus, and an "Unlock: <Ultimate Toolkit
   name>" cosmetic reward.
5. **Footer summary line:**
   ```
   CHAPTER <N> COMPLETE                ✅
   Total Modules: 8
   Total Screens: ~140+
   Total Games: 40+
   Total XP: 5,200+
   ```

---

## 5. Style Rules (apply everywhere)

- **Tone:** upbeat, second-person mission framing ("You have been
  chosen...", "Students complete..."). Never dry textbook phrasing —
  every fact is reframed as a discovery inside the story.
- **Reading level:** short sentences, Class 8 vocabulary. One idea
  per line.
- **Emoji use:** every title, character entrance, and reward has 1–3
  supporting emoji. Don't overdo body text — emoji sit on bullets and
  headers, not mid-sentence.
- **Science accuracy first:** the game/story wrapper must never
  distort the underlying NCERT-level science fact. Write the correct
  concept plainly inside "Learn Card" / "Discovery" boxes; the story
  is decoration around a factually correct core.
- **No real-world dangerous content:** interactive "experiments" must
  be classroom-safe or purely virtual/simulated — never instructions
  a student could replicate with real chemicals, electricity mains,
  fire, or anything hazardous.
- **Consistent XP economy:** module totals stay in the 450–550 XP
  band; only the Module 8 finale and chapter certificate exceed that
  (+100 XP finale bonus, +1000 XP certificate bonus).
- **Badge naming:** `<Adjective> <Noun>` or `<Noun> <Role>` pattern
  (e.g. "Curious Explorer", "Microbe Hunter", "Evidence Seeker") — 2
  words, capitalized, no punctuation.

---

## 6. Suggested Class 8 Science Chapter List

The existing 4 chapters cover: (1) Nature of Science/Scientific
Method, (2) Microorganisms, (3) Health & Disease, (4) Electromagnetism.
To keep parity with a standard Class 8 syllabus, future chapters
could cover (pick topics not yet used, one topic per chapter, each
broken into 8 sub-topic modules as above):

- Crop Production and Management
- Synthetic Fibres and Plastics
- Metals and Non-Metals
- Coal and Petroleum
- Combustion and Flame
- Conservation of Plants and Animals
- Cell — Structure and Functions
- Reproduction in Animals
- Force, Pressure, and Friction
- Sound
- Chemical Effects of Electric Current
- Some Natural Phenomena (lightning, earthquakes)
- Light
- Stars and the Solar System
- Pollution of Air and Water

---

## 7. Workflow When Asked to "Create Chapter N"

1. Pick the topic (from §6 or as specified) and confirm it's not
   already covered.
2. Design the world/story wrapper per §2 — name the academy, mentor,
   guide-bot, 1–2 student characters, villain, and the artifact to
   restore.
3. Break the topic into 8 teachable sub-topics — these become the 8
   module titles, in a logical learning sequence (simple → complex).
4. Author each module fully per §3 (overview → story → ~13 screens →
   quiz → mini-boss → reward → next-module unlock).
5. Author the Module 8 finale + certificate per §4.
6. Proofread for: correct science content, consistent character
   voice, increasing XP per screen, exactly 5 quiz questions and 5
   mini-boss challenges per module, and a complete "Assets Required"
   list every time (needed by the design/dev team to build it).
7. Output as one file per chapter (matching the naming style
   `CHAPTER_<N>_.pdf` or `.docx`, whichever the platform ingests).
