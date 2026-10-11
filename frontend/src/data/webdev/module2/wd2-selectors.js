// Module 2, Section 2 — Selectors and the Cascade.
//
// Authoring notes for whoever edits this next:
//  - PREREQUISITES, checked against Module 1's actual content (not CLAUDE.md's
//    plan, which differs): Module 1 taught the `id` ATTRIBUTE — for form
//    labels and link anchors — and `<div>`, `<ul>`, `<li>`, `<a>`, `<table>`,
//    `<label>`. It never used `class` even once, and never used <nav>,
//    <section>, <header> or <span>. So this section has to TEACH the class
//    attribute, can lean on id as already familiar, and must build its pages
//    out of div/ul/li/a only.
//  - Section 1 (wd2-intro) taught rule anatomy, the three places CSS can live,
//    comments, and element selectors. This section is the first to select by
//    anything other than a tag name.
//  - PROPERTIES stay to the ones already seen: color, background-color,
//    font-size, font-family, font-weight, text-decoration. The box model is
//    Section 4 and flexbox is Section 5, so no padding/margin/border/display
//    here, however tempting — the lesson is selectors, and a property the
//    student cannot read yet is noise.
//  - Page 10 is the specificity task and the point of the section: the
//    student's rule is correct and still loses. Its FIRST check is a `not`
//    check, deliberately, because "found color: rgb(0, 0, 0), which is the
//    value this is meant to change" is the sentence that explains the bug.
//    Do not reorder it below the `value` check.
//  - The #todays-special rule on page 10 also sets font-size, and a check
//    pins it. That is what stops "delete the rule that beats me" being the
//    fix — without it the task can be passed without meeting specificity.

/** The page nearly every example and task on this page is built from. */
const MENU_HTML = [
  '<h1>Sunrise Cafe</h1>',
  '',
  '<div id="menu">',
  '  <h2>Today\'s Menu</h2>',
  '  <ul>',
  '    <li>Soup of the day</li>',
  '    <li>Fresh bread</li>',
  '    <li>Apple cake</li>',
  '  </ul>',
  '  <a href="#top">Back to top</a>',
  '</div>',
  '',
  '<p>Questions? <a href="#menu">Jump to the menu</a></p>',
].join('\n');

/** The same page with two items labelled — the result of page 3. */
const LABELLED_HTML = MENU_HTML
  .replace('<li>Soup of the day</li>', '<li class="special">Soup of the day</li>')
  .replace('<li>Apple cake</li>', '<li class="special">Apple cake</li>');

const section = {
  id: 'wd2-selectors',
  title: 'Selectors and the Cascade',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-why-more-selectors',
      type: 'content',
      title: 'When a tag name is not enough',
      blocks: [
        {
          type: 'text',
          md: [
            'Every selector you wrote in the last section was a tag name, and a tag name',
            'selects **all of them**. That was fine while you wanted all of them.',
            '',
            'Here is the first thing you cannot do with it. This menu has three items, and',
            'two of them are today\'s specials. Make just those two stand out.',
            '',
            'You cannot. `li` is the only selector you know for a list item, and it means',
            'every list item on the page.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'All or nothing',
          tabs: ['html', 'css'],
          files: {
            html: MENU_HTML,
            css: [
              '/* The only li selector you have so far. */',
              'li {',
              '  color: crimson;',
              '}',
            ].join('\n'),
          },
          caption:
            'All three items turn crimson, because that is what the li selector means. Try to get just the soup and the cake with what you know so far — the point of this example is that you cannot.',
        },
        {
          type: 'text',
          md: [
            'So CSS needs a way to say "these specific ones", and the way it does that is to',
            'let **you** label the elements you care about. You label them in the HTML, then',
            'select the label in the CSS.',
            '',
            'There are two labels, and the whole of this section grows out of them.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-class-and-id',
      type: 'content',
      title: 'Classes and ids',
      blocks: [
        {
          type: 'text',
          md: [
            '**A class is a label you can reuse.** You add it in the HTML with a `class`',
            'attribute:',
            '',
            '```html',
            '<li class="special">Soup of the day</li>',
            '```',
            '',
            'and you select it in the CSS by putting a **dot** in front of the name:',
            '',
            '```css',
            '.special {',
            '  color: crimson;',
            '}',
            '```',
            '',
            'As many elements as you like can carry the same class, and they do not have to',
            'be the same kind of tag — a `<li>` and an `<h2>` can both be `class="special"`.',
            'That is the point of it.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**An id is a label for exactly one element.** You have already used ids in',
            'Module 1 — to point a `<label>` at an input, and to give a link somewhere to',
            'jump to. It is the same attribute:',
            '',
            '```html',
            '<div id="menu">',
            '```',
            '',
            'and in CSS you select it with a **hash**:',
            '',
            '```css',
            '#menu {',
            '  background-color: cornsilk;',
            '}',
            '```',
            '',
            'The rule is one id per page. Not "one per element" — an id is supposed to',
            'identify a single thing, which is exactly why a link can jump to it.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A class and an id, side by side',
          tabs: ['html', 'css'],
          files: {
            html: LABELLED_HTML,
            css: [
              '/* One id, one element. */',
              '#menu {',
              '  background-color: cornsilk;',
              '}',
              '',
              '/* One class, two elements. */',
              '.special {',
              '  color: crimson;',
              '  font-weight: bold;',
              '}',
            ].join('\n'),
          },
          caption:
            'Two of the three items are crimson now, because only those two carry the class. Try adding class="special" to the bread as well and press Run — no CSS change needed, which is the whole advantage.',
        },
        {
          type: 'tip',
          md: [
            'The dot and the hash live **only in the CSS**. In the HTML you write',
            '`class="special"`, not `class=".special"`. Writing the dot in the attribute is',
            'the single most common slip here, and because CSS reports no errors, the',
            'symptom is just that the rule does nothing.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Which should you use? **Reach for a class almost every time.**',
            '',
            'Classes are reusable, and that is what styling wants: "all the specials", "all',
            'the warnings", "all the cards". An id can only ever style one element, so a',
            'stylesheet built from ids repeats itself constantly. Ids earn their keep for',
            'identifying things — link targets, form labels — which is what you already used',
            'them for.',
            '',
            'They differ in one more way, and it causes more confusion than everything above',
            'put together. That is the end of this section.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-label-and-select',
      type: 'task',
      title: 'Label it, then select it',
      required: true,
      prompt: [
        'Two things to do, one in each file.',
        '',
        '1. In **index.html**, add `class="special"` to **two** list items: the soup and',
        '   the cake. Leave the bread alone.',
        '2. In **style.css**, write a rule that makes everything with that class',
        '   **crimson**, and a rule that gives the `#menu` div a `background-color` of',
        '   **cornsilk**.',
        '',
        'The id is already in the HTML — you only need to select it.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: MENU_HTML,
        css: '/* Two rules: one for the class, one for the id. */\n',
      },
      checks: [
        {
          type: 'dom',
          selector: '.special',
          count: 2,
          message:
            'Exactly two elements should carry class="special" — the soup and the cake. Remember the attribute has no dot in it: class="special".',
        },
        {
          type: 'style',
          selector: '.special',
          prop: 'color',
          value: 'crimson',
          every: true,
          message:
            'Both specials should be crimson. Write a rule whose selector is `.special` — with the dot, this time, because this is the CSS.',
        },
        {
          type: 'style',
          selector: '#menu',
          prop: 'background-color',
          value: 'cornsilk',
          message:
            'The #menu div should have a cornsilk background. Its selector is `#menu`, with a hash.',
        },
        {
          // Catches the student who skipped the labelling and just wrote
          // `li { color: crimson }`, which satisfies the class check by
          // accident on a page where every li would be crimson anyway.
          type: 'style',
          selector: 'li:nth-child(2)',
          prop: 'color',
          not: 'crimson',
          message:
            'The bread has gone crimson too, so the colour is not coming from the class. Check that your rule selects `.special` and not `li`.',
        },
      ],
      hint: [
        'The HTML half:',
        '',
        '```html',
        '<li class="special">Soup of the day</li>',
        '```',
        '',
        'The CSS half — note the dot, which the attribute does not have:',
        '',
        '```css',
        '.special {',
        '  color: crimson;',
        '}',
        '```',
        '',
        'The id rule works the same way with a `#` instead of a `.`, and `#menu` is',
        'already in the HTML waiting for it.',
      ].join('\n'),
      solution: {
        html: LABELLED_HTML,
        css: [
          '#menu {',
          '  background-color: cornsilk;',
          '}',
          '',
          '.special {',
          '  color: crimson;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-quiz-class-id',
      type: 'quiz',
      title: 'Check-in: labels',
      required: true,
      questions: [
        {
          q: 'How do you select every element with `class="special"`?',
          options: ['`special`', '`.special`', '`#special`', '`class="special"`'],
          answerIndex: 1,
          explanation:
            'A dot in front of the name. `#special` would select an *id* called special, `special` would look for a tag called `<special>`, and the last one is how you write the attribute in HTML, not how you select it in CSS.',
        },
        {
          q: 'In the HTML, which is correct?',
          options: [
            '`<li class=".special">`',
            '`<li class="special">`',
            '`<li .special>`',
            '`<li select="special">`',
          ],
          answerIndex: 1,
          explanation:
            'No dot. The dot is CSS punctuation meaning "this is a class name" — the HTML attribute just holds the name itself. Putting the dot in the attribute creates a class literally called ".special", which your `.special` rule will not match.',
        },
        {
          q: 'You want to style six buttons the same way. Class or id?',
          options: [
            'A class, because more than one element can share it.',
            'An id, because ids are more specific.',
            'Six ids, one per button.',
            'Either — there is no practical difference.',
          ],
          answerIndex: 0,
          explanation:
            'A class. An id is meant to identify one element, so six buttons would need six ids and six rules that all say the same thing. One class and one rule covers all six, and covers the seventh button you add next week.',
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-combining',
      type: 'content',
      title: 'Grouping, descendants and children',
      blocks: [
        {
          type: 'text',
          md: [
            'Three ways of combining what you already have. All three are punctuation',
            'between selectors, and the punctuation is the whole meaning — so it is worth',
            'reading these slowly.',
            '',
            '**A comma means "and also".** One rule, applied to several selectors:',
            '',
            '```css',
            'h1, h2 {',
            '  font-family: sans-serif;',
            '}',
            '```',
            '',
            'That is identical to writing two rules with the same declarations in them. It',
            'is called **grouping**, and it exists so you stop repeating yourself.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Forgetting the comma changes the meaning completely rather than breaking',
            'anything. `h1, h2` is "every h1 and every h2". `h1 h2` — a space, no comma — is',
            '"every h2 **inside** an h1", which on most pages is nothing at all.',
            '',
            'A grouped rule that silently applies to nothing is almost always a missing',
            'comma.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**A space means "somewhere inside".**',
            '',
            '```css',
            '#menu a {',
            '  color: seagreen;',
            '}',
            '```',
            '',
            'Read it right to left: *every `<a>` that is somewhere inside `#menu`*. Links',
            'elsewhere on the page are untouched. This is called a **descendant** selector,',
            'and "descendant" means at any depth — directly inside, or nested ten levels',
            'down.',
            '',
            '**A `>` means "directly inside".**',
            '',
            '```css',
            'ul > li {',
            '  color: crimson;',
            '}',
            '```',
            '',
            'Only list items whose immediate parent is the `<ul>`. A **child** selector. If',
            'one of those list items held another list, the items in *that* list would be',
            'grandchildren, and this rule would skip them.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Descendant against child',
          tabs: ['html', 'css'],
          files: {
            html: [
              '<ul id="outer">',
              '  <li>Drinks</li>',
              '  <li>Food',
              '    <ul>',
              '      <li>Soup</li>',
              '      <li>Bread</li>',
              '    </ul>',
              '  </li>',
              '</ul>',
            ].join('\n'),
            css: [
              '/* "somewhere inside" - reaches Soup and Bread too. */',
              '#outer li {',
              '  font-weight: bold;',
              '}',
              '',
              '/* "directly inside" - only Drinks and Food. */',
              '#outer > li {',
              '  color: seagreen;',
              '}',
            ].join('\n'),
          },
          caption:
            'Everything is bold, because everything is a descendant. Only Drinks and Food are green, because only they are direct children. Add the > to the first rule and press Run: Soup and Bread stop being bold.',
        },
        {
          type: 'text',
          md: [
            'In practice you will reach for the space far more often than the `>`. "A link',
            'inside the menu" is usually what you mean, and you rarely care how deeply it',
            'is nested.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-combining-task',
      type: 'task',
      title: 'Reach into the menu',
      required: true,
      prompt: [
        'This page has two links: one inside the `#menu` div, and one in the paragraph',
        'underneath it. Style **only** the one inside the menu.',
        '',
        '1. Make every `<a>` inside `#menu` **seagreen**',
        '2. In one grouped rule, give both the `h1` and the `h2` a `font-family` of',
        '   **sans-serif**',
        '',
        'The link in the paragraph has to keep its normal colour, so a plain `a` rule',
        'will not do.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: MENU_HTML,
        css: '/* One descendant selector, one grouped selector. */\n',
      },
      checks: [
        {
          type: 'style',
          selector: '#menu a',
          prop: 'color',
          value: 'seagreen',
          message:
            'The "Back to top" link inside the menu should be seagreen. A space between two selectors means "somewhere inside": `#menu a`.',
        },
        {
          type: 'style',
          selector: 'p a',
          prop: 'color',
          not: 'seagreen',
          message:
            'The link in the paragraph went seagreen too, so your selector is catching every link. Put `#menu` and a space in front of the `a` so it only reaches inside the menu.',
        },
        {
          type: 'style',
          selector: 'h1',
          prop: 'font-family',
          value: 'sans-serif',
          message: 'The h1 should be sans-serif.',
        },
        {
          type: 'style',
          selector: 'h2',
          prop: 'font-family',
          value: 'sans-serif',
          message:
            'The h2 should be sans-serif too — put both selectors in one rule, separated by a comma.',
        },
      ],
      hint: [
        'The descendant rule reads right to left — "an `a`, inside `#menu`":',
        '',
        '```css',
        '#menu a {',
        '  color: seagreen;',
        '}',
        '```',
        '',
        'The grouped rule needs the comma. Without it, `h1 h2` means "an h2 inside an',
        'h1", which this page does not have:',
        '',
        '```css',
        'h1, h2 {',
        '  font-family: sans-serif;',
        '}',
        '```',
      ].join('\n'),
      solution: {
        html: MENU_HTML,
        css: [
          '#menu a {',
          '  color: seagreen;',
          '}',
          '',
          'h1, h2 {',
          '  font-family: sans-serif;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-pseudo-classes',
      type: 'content',
      title: 'Pseudo-classes: states and positions',
      blocks: [
        {
          type: 'text',
          md: [
            'Everything so far selected elements by something written in the HTML — a tag',
            'name, a class, an id, a position in the nesting. A **pseudo-class** selects by',
            'something that is not written down anywhere: a state the element is currently',
            'in, or where it sits among its siblings.',
            '',
            'They start with a single colon and attach to the end of a selector.',
            '',
            '**`:hover` — while the mouse is over it.**',
            '',
            '```css',
            'a:hover {',
            '  color: crimson;',
            '}',
            '```',
            '',
            'There is nothing in the HTML you could have selected to get this. The state',
            'exists for a second and then stops existing, and CSS can style it anyway. This',
            'is how every button on every site you have used reacts to your mouse.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**`:first-child` — the first one among its siblings.**',
            '',
            '```css',
            'li:first-child {',
            '  font-weight: bold;',
            '}',
            '```',
            '',
            'Read it as "an `li` that is the first child of its parent". There is a',
            '`:last-child` that does the mirror image.',
            '',
            'The useful thing about both is that they follow the content. Add a new item to',
            'the top of the list and the bold moves to it — you did not label anything, so',
            'there is no label to go and update.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A state and a position',
          tabs: ['html', 'css'],
          files: {
            html: MENU_HTML,
            css: [
              '/* Position: the first item in the list. */',
              'li:first-child {',
              '  font-weight: bold;',
              '}',
              '',
              '/* State: only while the mouse is over it. */',
              'a:hover {',
              '  color: crimson;',
              '}',
            ].join('\n'),
          },
          caption:
            'The soup is bold because it is first. Hover your mouse over either link in the preview to see the other rule fire — and note that nothing in the HTML changed to make it happen.',
        },
        {
          type: 'tip',
          md: [
            'A pseudo-class attaches with no space: `a:hover`, not `a :hover`. A space would',
            'make it a descendant selector, and mean something else entirely.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-pseudo-task',
      type: 'task',
      title: 'A state and a position',
      required: true,
      prompt: [
        'Two rules, both using a pseudo-class.',
        '',
        '1. Make the **first** item in the list `font-weight: bold` — without adding a',
        '   class to it, and without bolding the other two',
        '2. Make every `<a>` turn **crimson while the mouse is over it**',
        '',
        'Hover over a link in the preview to check the second one yourself.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: MENU_HTML,
        css: '/* One position, one state. Both are pseudo-classes. */\n',
      },
      checks: [
        {
          type: 'style',
          selector: 'li:first-child',
          prop: 'font-weight',
          value: 'bold',
          message:
            'The first list item should be bold. `li:first-child` selects it — no space before the colon.',
        },
        {
          type: 'style',
          selector: 'li:last-child',
          prop: 'font-weight',
          not: 'bold',
          message:
            'All three items are bold, so your selector is plain `li`. Add `:first-child` to the end of it.',
        },
        {
          // :hover is a state the page is not in, so nothing computed can see
          // it. This reads the stylesheet source instead — see lib/webdev/sandbox.js.
          type: 'cssRule',
          selector: 'a:hover',
          prop: 'color',
          message:
            'There is no `a:hover` rule yet. A hover state cannot be measured on a page that is not being hovered, so this one checks that you wrote the rule.',
        },
      ],
      hint: [
        'Neither pseudo-class takes a space before the colon:',
        '',
        '```css',
        'li:first-child {',
        '  font-weight: bold;',
        '}',
        '',
        'a:hover {',
        '  color: crimson;',
        '}',
        '```',
        '',
        'If all three items went bold, your selector is `li` rather than',
        '`li:first-child` — the pseudo-class is what narrows it down to one.',
      ].join('\n'),
      solution: {
        html: MENU_HTML,
        css: [
          'li:first-child {',
          '  font-weight: bold;',
          '}',
          '',
          'a:hover {',
          '  color: crimson;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 9
    {
      id: 'p9-specificity',
      type: 'content',
      title: 'The cascade: why one rule beats another',
      blocks: [
        {
          type: 'text',
          md: [
            'Now that you have several ways to select the same element, two rules can',
            'disagree. One says crimson, the other says black, and both apply. Something has',
            'to decide.',
            '',
            'That decision is the **cascade** — the "C" in Cascading Style Sheets — and it',
            'asks two questions, in this order.',
            '',
            '**Question one: which selector is more specific?**',
            '',
            'More specific means "describes fewer elements", and there is a rough pecking',
            'order:',
            '',
            '| Selector | Beats | Example |',
            '| --- | --- | --- |',
            '| An id | everything below | `#menu` |',
            '| A class or pseudo-class | tag names | `.special`, `:hover` |',
            '| A tag name | nothing | `li` |',
            '',
            'So `#menu` beats `.special`, which beats `li`. And it is not a points total you',
            'can make up for with volume: **one id beats any number of classes.** Ten class',
            'selectors stacked together still lose to a single id.',
            '',
            '**Question two — only if question one is a tie: which came last?**',
            '',
            'Two rules of equal specificity, and the one further down the stylesheet wins.',
            'This is why "put your own rules at the bottom" works, and also why it stops',
            'working the moment the rule you are fighting is more specific than yours.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Three rules, one element',
          tabs: ['html', 'css'],
          files: {
            html: '<ul>\n  <li id="pick" class="special">Soup of the day</li>\n</ul>',
            css: [
              '/* All three of these select the same li. */',
              '',
              'li {',
              '  color: seagreen;',
              '}',
              '',
              '.special {',
              '  color: crimson;',
              '}',
              '',
              '#pick {',
              '  color: navy;',
              '}',
            ].join('\n'),
          },
          caption:
            'It is navy: the id wins, even though it is a single rule against two. Now move the #pick rule to the very top and press Run — still navy, because source order is only consulted when specificity ties.',
        },
        {
          type: 'warning',
          md: [
            'You will eventually meet `!important`, which overrides all of this:',
            '',
            '```css',
            '.special {',
            '  color: crimson !important;',
            '}',
            '```',
            '',
            'Avoid it. It wins the argument by refusing to have it, and the next person who',
            'needs to override your rule has no move left except another `!important`. If',
            'you need one, the real answer is almost always a more specific selector.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'The practical upshot, and the thing to remember when a rule you wrote appears',
            'to do nothing at all:',
            '',
            'Your rule is probably fine. It is probably **losing**.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 10
    {
      id: 'p10-specificity-bug',
      type: 'task',
      title: 'Fix a rule that is losing',
      required: true,
      prompt: [
        'The heading below should be crimson. Look at style.css: the `.highlight` rule',
        'says `color: crimson`, it is spelled correctly, and it is the **last** rule in',
        'the file.',
        '',
        'The heading is black.',
        '',
        'Make it crimson. One condition: the `#todays-special` rule also sets the font',
        'size, and that has to survive — so deleting it is not the fix.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: [
          '<h1>Sunrise Cafe</h1>',
          '',
          '<h2 id="todays-special" class="highlight">Soup of the day</h2>',
          '',
          '<p>Served from noon.</p>',
        ].join('\n'),
        css: [
          '/* The cafe house style. It sets the size as well as the colour. */',
          '#todays-special {',
          '  color: black;',
          '  font-size: 30px;',
          '}',
          '',
          '/* Your rule. Correct, last in the file, and doing nothing. */',
          '.highlight {',
          '  color: crimson;',
          '}',
        ].join('\n'),
      },
      checks: [
        // FIRST, deliberately: this is the check whose failure explains the
        // bug. "found color: rgb(0, 0, 0), which is the value this is meant to
        // change" names the symptom better than "should be crimson" does.
        {
          type: 'style',
          selector: '#todays-special',
          prop: 'color',
          not: 'black',
          message:
            'The heading is still black, so your rule is still losing. A class selector cannot beat an id selector, no matter how far down the file it sits — being last only helps when the two selectors are equally specific.',
        },
        {
          type: 'style',
          selector: '#todays-special',
          prop: 'color',
          value: 'crimson',
          message: 'Once your rule wins, the heading should be crimson.',
        },
        {
          type: 'style',
          selector: '#todays-special',
          prop: 'font-size',
          approx: 30,
          message:
            'The 30px font size has gone. It comes from the `#todays-special` rule, so that rule has to stay in the file — raise your own selector instead of removing its competition.',
        },
      ],
      hint: [
        'The `.highlight` rule is a class. The rule it is fighting is an id. An id wins,',
        'and no amount of moving your rule down the file changes that — source order is',
        'the tiebreak, and this is not a tie.',
        '',
        'So stop fighting it with a class. Give your rule a selector at least as specific',
        'as the one beating it:',
        '',
        '```css',
        '#todays-special {',
        '  color: crimson;',
        '}',
        '```',
        '',
        'Now the two selectors are equally specific, and *that* is when being further',
        'down the file decides it. Leave the original rule where it is — its font-size',
        'is still doing its job.',
      ].join('\n'),
      solution: {
        html: [
          '<h1>Sunrise Cafe</h1>',
          '',
          '<h2 id="todays-special" class="highlight">Soup of the day</h2>',
          '',
          '<p>Served from noon.</p>',
        ].join('\n'),
        css: [
          '/* The cafe house style. It sets the size as well as the colour. */',
          '#todays-special {',
          '  color: black;',
          '  font-size: 30px;',
          '}',
          '',
          '/* Same specificity as the rule above, and further down, so it wins. */',
          '#todays-special {',
          '  color: crimson;',
          '}',
        ].join('\n'),
      },
    },

    // ---------------------------------------------------------------- 11
    {
      id: 'p11-quiz-wrap-up',
      type: 'quiz',
      title: 'Knowledge check: selectors and the cascade',
      required: true,
      questions: [
        {
          q: 'What does `#menu a` select?',
          options: [
            'The element with id "menu", and every link on the page.',
            'Every `<a>` somewhere inside the element with id "menu".',
            'Every element with id "menu" that is inside a link.',
            'A link whose id is "menu".',
          ],
          answerIndex: 1,
          explanation:
            'A space means "somewhere inside", and you read it right to left: an `<a>`, inside `#menu`. The first option is what a **comma** would have meant — `#menu, a` — which is a different rule entirely.',
        },
        {
          q: 'A `.special` rule and a `#pick` rule both set the colour of the same element, and `.special` is written last. Which wins?',
          options: [
            '`.special`, because it comes later in the file.',
            '`#pick`, because an id is more specific than a class.',
            'Neither — the browser skips both when they conflict.',
            'Whichever sets the darker colour.',
          ],
          answerIndex: 1,
          explanation:
            'Specificity is asked first, and source order only settles ties. An id beats a class, so `#pick` wins from anywhere in the file. This is the single most common reason a rule you just wrote appears to do nothing.',
        },
        {
          q: 'Why does `:hover` need a pseudo-class rather than a class you add yourself?',
          options: [
            'Because classes cannot be used on links.',
            'Because hovering is a state that is not written in the HTML.',
            'Because it only works on one element per page.',
            'Because a class would be less specific.',
          ],
          answerIndex: 1,
          explanation:
            'There is nothing in the HTML to select. The state starts when the mouse arrives and ends when it leaves, so no attribute could describe it — which is exactly the gap pseudo-classes fill.',
        },
        {
          q: 'Your rule has no effect at all. Which is the *most* likely cause, given this section?',
          options: [
            'CSS stopped loading after the error.',
            'The property you used does not exist.',
            'A more specific rule elsewhere is setting the same property.',
            'Rules only apply to the first matching element.',
          ],
          answerIndex: 2,
          explanation:
            'Usually your rule is fine and simply losing. Worth checking in order: is something more specific setting the same property, is your selector actually matching (a dot in the HTML attribute will do it), and only then whether you misspelled the property.',
        },
      ],
    },
  ],
};

export default section;
