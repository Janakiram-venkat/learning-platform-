// Module 2, Section 1 — Intro to CSS.
//
// Authoring notes for whoever edits this next:
//  - ELEMENT SELECTORS ONLY. Classes, ids, the cascade and specificity are
//    Section 2 (wd2-selectors). Nothing here may select by class or id, or
//    this section uses a concept before the course has taught it.
//  - Module 1 already showed `h1 { color: ... }` and `body { background-color:
//    ... }` once, in wd1-intro, as "the paint layer". That is the only CSS a
//    student has seen, and it was deliberately unexplained. This section is
//    where it gets explained, so it can refer back to it but must not assume
//    anything was learned from it.
//  - Pages 6 and 8 are the "fix it" pages. Page 8's starter is deliberately
//    broken CSS: a missing semicolon that swallows the declaration after it,
//    and a rule commented out. Both bugs are the lesson, so do not "tidy" them.
//  - Check `value` matching resolves authored colour names through a probe
//    element (see lib/webdev/sandbox.js), so `value: 'crimson'` matches the
//    `rgb(220, 20, 60)` the browser reports. Write colours by name.

/** The unstyled page used on page 1, so the before/after is the same markup. */
const PLAIN_HTML = [
  '<h1>Sunrise Cafe</h1>',
  '',
  '<p>Open from 7am, every day of the week.</p>',
  '',
  '<h2>Today</h2>',
  '',
  '<p>Fresh bread at 8am. Soup from noon.</p>',
].join('\n');

/** The same markup with a stylesheet, for the "after" half of page 1. */
const STYLED_CSS = [
  'body {',
  '  font-family: sans-serif;',
  '  background-color: cornsilk;',
  '  padding: 24px;',
  '}',
  '',
  'h1 {',
  '  color: sienna;',
  '  font-size: 40px;',
  '}',
  '',
  'h2 {',
  '  color: darkolivegreen;',
  '}',
  '',
  'p {',
  '  color: dimgray;',
  '  line-height: 1.6;',
  '}',
].join('\n');

/** Page 6 starts from this and has to end up with an empty-attribute version. */
const INLINE_HTML = [
  '<h1 style="color: crimson;">Sunrise Cafe</h1>',
  '',
  '<p style="font-size: 18px;">Open from 7am, every day of the week.</p>',
].join('\n');

const section = {
  id: 'wd2-intro',
  title: 'Intro to CSS',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-what-css-is',
      type: 'content',
      title: 'What CSS is for',
      blocks: [
        {
          type: 'text',
          md: [
            'You spent Module 1 writing HTML, and by the end of it you could build a whole',
            'page: headings, paragraphs, lists, images, a form. Every one of those pages had',
            'the same problem.',
            '',
            'They were all black text on a white background.',
            '',
            'That is not a mistake you made. It is what HTML *is*. HTML says what things',
            '**are** — "this is a heading", "this is a paragraph" — and says nothing at all',
            'about what they should look like. The browser then falls back on its own plain',
            'defaults, which is why every unstyled page in the world looks identical.',
            '',
            '**CSS** is the other half: the language for saying what things should look like.',
            'CSS stands for Cascading Style Sheets, and you can ignore the "cascading" part',
            'until the next section.',
            '',
            'Here is the same page twice. Identical HTML — look at the html tab in both and',
            'you will see the same seven lines. The only difference is the stylesheet.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Before: HTML on its own',
          tabs: ['html'],
          files: { html: PLAIN_HTML },
          caption:
            'The browser\'s defaults, and nothing else. Times New Roman, black text, a white background, headings in bold.',
        },
        {
          type: 'example',
          label: 'After: the same HTML, with CSS',
          tabs: ['html', 'css'],
          files: { html: PLAIN_HTML, css: STYLED_CSS },
          caption:
            'Open the html tab and compare it with the example above — it is the same markup, character for character. Everything that changed is in style.css.',
        },
        {
          type: 'text',
          md: [
            'That is the division of labour you will use for the rest of this course, and it',
            'is worth getting straight now:',
            '',
            '- **HTML** — what is on the page, and what each part means',
            '- **CSS** — how it looks',
            '',
            'Keeping them apart is the whole point. It means you can redesign a page',
            'completely without touching a word of its content, which is exactly what you',
            'just saw happen.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-rule-anatomy',
      type: 'content',
      title: 'Anatomy of a rule',
      blocks: [
        {
          type: 'text',
          md: [
            'All of CSS is made of one shape, repeated. It is called a **rule**, and it has',
            'two parts: who to style, and what to change.',
            '',
            '```css',
            'h1 {',
            '  color: sienna;',
            '}',
            '```',
            '',
            'Read it as a sentence: *"every h1 on this page — make its colour sienna."*',
            '',
            'Four words name the pieces, and they are worth learning because every error',
            'message and every tutorial you will ever read uses them:',
            '',
            '- **Selector** — `h1`. Which elements this rule is about. Here it is a tag name,',
            '  so it means *every* `<h1>` on the page.',
            '- **Property** — `color`. The thing you are changing. There is a fixed list of',
            '  these; you cannot invent one.',
            '- **Value** — `sienna`. What you are changing it to. Which values are allowed',
            '  depends on the property.',
            '- **Declaration** — `color: sienna;`. One property and value together. A rule',
            '  can hold as many as you like.',
            '',
            'And the punctuation, which is where beginners lose the most time:',
            '',
            '- **Curly braces** `{ }` wrap the declarations.',
            '- A **colon** separates a property from its value.',
            '- A **semicolon** ends each declaration.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'One selector, several declarations',
          tabs: ['html', 'css'],
          files: {
            html: '<h1>Sunrise Cafe</h1>\n\n<p>Open from 7am.</p>',
            css: [
              '/* Three declarations, all about the same element. */',
              'h1 {',
              '  color: sienna;',
              '  font-size: 40px;',
              '  font-family: sans-serif;',
              '}',
            ].join('\n'),
          },
          caption:
            'Try adding a fourth declaration inside the braces — `text-align: center;` — and press Run. Then try deleting the semicolon at the end of the color line and run it again, to see what that costs you.',
        },
        {
          type: 'warning',
          md: [
            'That last experiment is not a trick. A missing semicolon does not break the',
            'line it is missing from — it breaks the line **after** it, because the browser',
            'reads the two as one declaration and then throws the whole thing away. CSS',
            'never reports an error; it just silently skips what it cannot understand.',
            '',
            'So when a rule you wrote seems to do nothing at all, count your semicolons',
            'before you doubt the property.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-first-rules',
      type: 'task',
      title: 'Write your first rules',
      required: true,
      prompt: [
        'The cafe page has its HTML already. It needs a stylesheet.',
        '',
        'Open the **style.css** tab and write two rules:',
        '',
        '1. Make every `h1` the colour **sienna**',
        '2. Give every `p` a `font-size` of **18px**',
        '',
        'The html tab is there to read, not to change — you need it to know what',
        'selectors to write. Press **Run** when you are done.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: PLAIN_HTML,
        css: [
          '/* Write your two rules below. The shape is:',
          '',
          '   selector {',
          '     property: value;',
          '   }',
          '*/',
          '',
        ].join('\n'),
      },
      checks: [
        {
          type: 'style',
          selector: 'h1',
          prop: 'color',
          value: 'sienna',
          message:
            'The h1 should be sienna. Write a rule with `h1` as the selector and `color: sienna;` inside its braces.',
        },
        {
          type: 'style',
          selector: 'p',
          prop: 'font-size',
          approx: 18,
          message:
            'Each paragraph should have a font-size of 18px. Write a second rule with `p` as the selector and `font-size: 18px;` inside it.',
        },
      ],
      hint: [
        'Two separate rules, one after the other — they do not go inside each other:',
        '',
        '```css',
        'h1 {',
        '  color: sienna;',
        '}',
        '',
        'p {',
        '  /* the font-size declaration goes here */',
        '}',
        '```',
        '',
        'The selector goes *outside* the braces. Everything you are changing goes',
        'inside them, each declaration ending in a semicolon.',
      ].join('\n'),
      solution: {
        html: PLAIN_HTML,
        css: [
          'h1 {',
          '  color: sienna;',
          '}',
          '',
          'p {',
          '  font-size: 18px;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-quiz-anatomy',
      type: 'quiz',
      title: 'Check-in: the shape of a rule',
      required: true,
      questions: [
        {
          q: 'In the rule `p { color: navy; }`, which part is the property?',
          options: ['`p`', '`color`', '`navy`', '`color: navy;`'],
          answerIndex: 1,
          explanation:
            '`color` is the **property** — the thing being changed. `p` is the selector (who), `navy` is the value (what to), and `color: navy;` is the whole declaration. Those four words come up constantly, so it is worth being able to point at each one.',
        },
        {
          q: 'What does a selector of `p` mean?',
          options: [
            'The first paragraph on the page.',
            'The paragraph the student clicks on.',
            'Every paragraph on the page.',
            'Any element whose name starts with p.',
          ],
          answerIndex: 2,
          explanation:
            'A tag-name selector means **all of them** — every `<p>` on the page, however many there are. That is usually what you want, and when it is not, you need a way to be more specific. That is the next section.',
        },
        {
          q: 'You write a rule, press Run, and absolutely nothing changes. What is NOT a possible cause?',
          options: [
            'You misspelled the property name.',
            'You left out a semicolon on the line above.',
            'CSS printed an error message that you missed.',
            'You used a value the property does not accept.',
          ],
          answerIndex: 2,
          explanation:
            'CSS never reports errors. It silently skips anything it cannot understand and carries on, which is why "nothing happened" is the standard CSS failure and why you have to go looking. The other three are all real and all common.',
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-three-places',
      type: 'content',
      title: 'Three places CSS can live',
      blocks: [
        {
          type: 'text',
          md: [
            'You have been writing CSS in a file called **style.css**. That is one of three',
            'places it can go, and you should recognise all three because you will meet them',
            'in other people\'s code.',
            '',
            '**1. Inline** — a `style` attribute on a single element.',
            '',
            '```html',
            '<h1 style="color: crimson;">Sunrise Cafe</h1>',
            '```',
            '',
            'No selector, because there is nothing to select: it applies to this one element',
            'and nothing else.',
            '',
            '**2. A `<style>` block** — real CSS rules, written inside the HTML file.',
            '',
            '```html',
            '<style>',
            '  h1 {',
            '    color: crimson;',
            '  }',
            '</style>',
            '```',
            '',
            '**3. An external stylesheet** — the rules in their own `.css` file, linked from',
            'the HTML. This is what the css tab in this editor has been all along.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'All three at once',
          tabs: ['html', 'css'],
          files: {
            html: [
              '<style>',
              '  h2 {',
              '    color: darkolivegreen;',
              '  }',
              '</style>',
              '',
              '<h1>Sunrise Cafe</h1>',
              '',
              '<h2>Today</h2>',
              '',
              '<p style="font-style: italic;">Fresh bread at 8am.</p>',
            ].join('\n'),
            css: [
              '/* The external stylesheet. */',
              'h1 {',
              '  color: sienna;',
              '}',
            ].join('\n'),
          },
          caption:
            'Three colours from three different places: the h1 from style.css, the h2 from the <style> block in the HTML, and the italic paragraph from its own style attribute.',
        },
        {
          type: 'text',
          md: [
            'They all work. They are not all equally good.',
            '',
            '**Use an external stylesheet.** Almost always, and for a reason that has nothing',
            'to do with taste: a real site has many pages, and one stylesheet can style all',
            'of them at once. Change `h1 { color: sienna; }` in one file and every heading on',
            'every page follows.',
            '',
            'Inline styles are the opposite of that. One element, one page, and no way to',
            'reuse it — so a site built out of them has to be restyled element by element.',
            'They have their uses, and you will see them again when JavaScript starts',
            'changing styles while the page is running, but they are not how you write a',
            'stylesheet.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            'A real external stylesheet has to be connected to the HTML with a `<link>` tag',
            'in the `<head>`:',
            '',
            '```html',
            '<link rel="stylesheet" href="style.css">',
            '```',
            '',
            'This editor does that part for you, which is why the css tab just works. Worth',
            'knowing for the day you build a page outside it.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-move-inline-out',
      type: 'task',
      title: 'Move the styles out',
      required: true,
      prompt: [
        'This page does its styling with `style` attributes. Move it into the stylesheet',
        'so it can be reused.',
        '',
        '1. In **style.css**, write rules that give the `h1` the colour **crimson** and the',
        '   `p` a `font-size` of **18px**',
        '2. In **index.html**, delete both `style` attributes',
        '',
        'The page should look exactly the same when you are done — the styling has moved,',
        'not changed.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: INLINE_HTML,
        css: '/* The two rules go here. */\n',
      },
      checks: [
        {
          type: 'style',
          selector: 'h1',
          prop: 'color',
          value: 'crimson',
          message: 'The h1 should still be crimson — write an `h1` rule in style.css.',
        },
        {
          type: 'style',
          selector: 'p',
          prop: 'font-size',
          approx: 18,
          message: 'The paragraph should still be 18px — write a `p` rule in style.css.',
        },
        {
          // The two style checks above pass whether or not the attributes are
          // gone: getComputedStyle reports the inline style too. This is the
          // check that makes the task the task.
          type: 'dom',
          selector: '[style]',
          count: 0,
          message:
            'There is still a `style` attribute left in the HTML. Both of them should be gone — remove `style="..."` from the tag completely, so only the tag name is left.',
        },
      ],
      hint: [
        'Do the stylesheet first and press Run. The page will look unchanged, because',
        'both styles now apply from two places at once.',
        '',
        'Then delete the attributes. `<h1 style="color: crimson;">` becomes plain',
        '`<h1>` — the whole `style="..."` part goes, including the quotes. Run again:',
        'still the same page, now styled from one place.',
      ].join('\n'),
      solution: {
        html: '<h1>Sunrise Cafe</h1>\n\n<p>Open from 7am, every day of the week.</p>',
        css: [
          'h1 {',
          '  color: crimson;',
          '}',
          '',
          'p {',
          '  font-size: 18px;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-comments',
      type: 'content',
      title: 'Comments',
      blocks: [
        {
          type: 'text',
          md: [
            'A **comment** is a note in your code that the browser ignores. In CSS it starts',
            'with `/*` and ends with `*/`:',
            '',
            '```css',
            '/* Brand colours, agreed with the owner */',
            'h1 {',
            '  color: sienna; /* not brown - she was specific */',
            '}',
            '```',
            '',
            'It can sit on its own line or at the end of one, and it can run across as many',
            'lines as you like. HTML comments look different — `<!-- like this -->`, which you',
            'met in Module 1 — so do not mix them up: an HTML comment inside CSS is not a',
            'comment, it is a syntax error.',
            '',
            'Comments are for the *why*. `color: sienna;` already says what the rule does;',
            'what it cannot say is why that colour and not another one.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'There is a second use, and it is the one you will reach for most: **commenting',
            'out**. Wrap a rule in `/*` and `*/` and it stops applying, without you having to',
            'delete it.',
            '',
            'That makes it the fastest debugging tool in CSS. If a page looks wrong and you',
            'cannot see why, comment out one rule at a time until it looks right — the last',
            'one you switched off is the culprit.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A rule switched off',
          tabs: ['html', 'css'],
          files: {
            html: '<h1>Sunrise Cafe</h1>\n\n<p>Open from 7am.</p>',
            css: [
              'h1 {',
              '  color: sienna;',
              '}',
              '',
              '/* Switched off for now - too dark to read.',
              'p {',
              '  color: darkslategray;',
              '}',
              '*/',
            ].join('\n'),
          },
          caption:
            'The paragraph is plain black, because its rule is inside a comment. Delete the `/*` and the `*/` and press Run to switch it back on.',
        },
        {
          type: 'warning',
          md: [
            'The flip side: a comment you forgot to close swallows everything after it. `/*`',
            'with no matching `*/` comments out the entire rest of the file, and since CSS',
            'reports no errors, the symptom is simply that half your stylesheet stopped',
            'working.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-fix-the-stylesheet',
      type: 'task',
      title: 'Fix the stylesheet',
      required: true,
      prompt: [
        'This stylesheet was written to do three things. None of them are happening.',
        '',
        'The HTML is fine — every bug is in **style.css**. Find and fix them so that:',
        '',
        '1. The `h1` is **navy**',
        '2. The `h1` has a `font-size` of **36px**',
        '3. The `p` is **dimgray**',
        '',
        'Nothing here needs a new rule written from scratch. Everything you need is',
        'already in the file.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: '<h1>Sunrise Cafe</h1>\n\n<p>Open from 7am, every day of the week.</p>',
        css: [
          'h1 {',
          '  color: navy',
          '  font-size: 36px;',
          '}',
          '',
          '/* p {',
          '  color: dimgray;',
          '} */',
        ].join('\n'),
      },
      checks: [
        {
          type: 'style',
          selector: 'h1',
          prop: 'color',
          value: 'navy',
          message:
            'The h1 is not navy yet. The colour declaration is there — look at how it ends compared with the line below it.',
        },
        {
          type: 'style',
          selector: 'h1',
          prop: 'font-size',
          approx: 36,
          message:
            'The h1 is not 36px yet. This one is not broken on its own line — something on the line above it is taking it down too.',
        },
        {
          type: 'style',
          selector: 'p',
          prop: 'color',
          value: 'dimgray',
          message:
            'The paragraph is not dimgray yet. Its rule is written correctly, but it is not switched on.',
        },
      ],
      hint: [
        'Two bugs, and the first one costs you two of the three.',
        '',
        '**Bug one:** `color: navy` has no semicolon. So the browser reads it and the',
        'line below as a single declaration — `color: navy font-size: 36px` — decides that',
        'is not a colour it understands, and throws the whole thing away. That is why the',
        'font-size is missing too. Add the semicolon and both come back.',
        '',
        '**Bug two:** the `p` rule is wrapped in `/*` and `*/`, so it is a comment.',
        'Delete those four characters.',
      ].join('\n'),
      solution: {
        html: '<h1>Sunrise Cafe</h1>\n\n<p>Open from 7am, every day of the week.</p>',
        css: [
          'h1 {',
          '  color: navy;',
          '  font-size: 36px;',
          '}',
          '',
          'p {',
          '  color: dimgray;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 9
    {
      id: 'p9-quiz-wrap-up',
      type: 'quiz',
      title: 'Knowledge check: CSS and where it lives',
      required: true,
      questions: [
        {
          q: 'Why is an external stylesheet usually better than inline style attributes?',
          options: [
            'Inline styles are not supported by every browser.',
            'One stylesheet can style every page of a site at once.',
            'Inline styles make the page load more slowly.',
            'Inline styles cannot change colours, only sizes.',
          ],
          answerIndex: 1,
          explanation:
            'Reuse. One rule in one file styles every matching element on every page that links to it, so a change happens in one place. An inline style applies to exactly one element on one page and cannot be reused at all — which is the real cost, not support or speed.',
        },
        {
          q: 'Which of these is a CSS comment?',
          options: [
            '`<!-- a note -->`',
            '`// a note`',
            '`/* a note */`',
            '`# a note`',
          ],
          answerIndex: 2,
          explanation:
            '`/* ... */` is the CSS comment, and it is the only one. The first is an HTML comment — valid in an HTML file, a syntax error inside CSS. The others belong to other languages entirely.',
        },
        {
          q: 'You wrap a working rule in `/*` and `*/`. What happens?',
          options: [
            'The rule stops applying, but stays in the file.',
            'The rule is deleted from the file.',
            'The rule applies only to the first matching element.',
            'Nothing — comments only work on their own line.',
          ],
          answerIndex: 0,
          explanation:
            'It stops applying but the text stays exactly where it is, which is what makes commenting out so useful: you can switch a rule off, look at the page, and switch it back on without having retyped anything.',
        },
        {
          q: 'A heading has a `style` attribute setting it to red, and style.css has a rule setting every h1 to blue. What does this tell you about the style attribute?',
          options: [
            'It is ignored, because stylesheets always win.',
            'It applies to that one heading only.',
            'It applies to every heading on the page.',
            'It stops style.css from loading.',
          ],
          answerIndex: 1,
          explanation:
            'A `style` attribute has no selector, so it can only ever affect the element it is written on. Which of the two colours actually wins when they disagree is a different question — that is the "cascading" part of Cascading Style Sheets, and it is the next section.',
        },
      ],
    },
  ],
};

export default section;
