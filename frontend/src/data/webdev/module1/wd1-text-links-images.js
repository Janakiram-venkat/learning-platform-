// Module 1, Section 3 — Text, Links & Images.
//
// Authoring notes for whoever edits this next:
//  - Prerequisites, all taught in Section 2 and freely used here: tag vs
//    element, void elements, the doctype/html/head/body skeleton, attributes,
//    nesting, comments. Nothing here may assume CSS, JavaScript, lists or
//    tables — those come later.
//  - Pages 3, 5 and 7 build ONE page in three passes: p5's starter IS p3's
//    solution plus a section to link to, and p7's starter IS p5's solution.
//    Change one and change the next, or the story breaks. Every starter still
//    fails its own checks on its own.
//  - The sample image names (cat.jpg, mountain.jpg, logo.png) are defined in
//    lib/webdev/sandbox.js as SAMPLE_IMAGES. If that list changes, the prose on
//    page 6 and the starter on page 7 change with it.
//  - Link clicks inside the preview are intercepted by the sandbox shim: "#"
//    links scroll for real, everything else is reported in the Terminal instead
//    of navigating. Captions tell the student to open the Terminal tab, because
//    the Preview tab is what they will be looking at.
//  - Deliberately NOT claimed anywhere: that screen readers announce <strong>
//    or <em> differently. Most do not, by default. The honest difference is
//    that the meaning is *recorded* in the markup, and tools may use it.
//  - `text` and `attrValue` matching is case-insensitive, whitespace-collapsed
//    and a substring test (lib/webdev/sandbox.js), so checks below are strict
//    about the requirement and relaxed about everything else.

/** Page 3's answer, which becomes the base for page 5. */
const TASK3_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1>Kitchen Notes</h1>',
  '    <p>Three things I can actually cook, written down before I forget them again.</p>',
  '',
  '    <h2>Cheese on Toast</h2>',
  '    <p>Grill the bread on one side first. Cheese on the <strong>untoasted</strong> side,',
  '      then back under the grill. Do not walk away.</p>',
  '  </body>',
  '</html>',
].join('\n');

const TASK3_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <!-- Every line below is plain text. Wrap each one in the tag it deserves. -->',
  '    Kitchen Notes',
  '    Three things I can actually cook, written down before I forget them again.',
  '    Cheese on Toast',
  '    Grill the bread on one side first. Cheese on the untoasted side,',
  '    then back under the grill. Do not walk away.',
  '  </body>',
  '</html>',
].join('\n');

/** Page 5's starting point: page 3's answer, plus somewhere to link to. */
const TASK5_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1>Kitchen Notes</h1>',
  '    <p>Three things I can actually cook, written down before I forget them again.</p>',
  '',
  '    <!-- 1. Both links go in this paragraph, replacing the words that are here. -->',
  '    <p>Links go here.</p>',
  '',
  '    <!-- 2. This heading needs an id so a link can aim at it. -->',
  '    <h2>Recipes</h2>',
  '',
  '    <h3>Cheese on Toast</h3>',
  '    <p>Grill the bread on one side first. Cheese on the <strong>untoasted</strong> side,',
  '      then back under the grill. Do not walk away.</p>',
  '  </body>',
  '</html>',
].join('\n');

const TASK5_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1>Kitchen Notes</h1>',
  '    <p>Three things I can actually cook, written down before I forget them again.</p>',
  '',
  '    <p>I look everything else up on',
  '      <a href="https://developer.mozilla.org">MDN Web Docs</a>.',
  '      <a href="#recipes">Jump to the recipes</a>.</p>',
  '',
  '    <h2 id="recipes">Recipes</h2>',
  '',
  '    <h3>Cheese on Toast</h3>',
  '    <p>Grill the bread on one side first. Cheese on the <strong>untoasted</strong> side,',
  '      then back under the grill. Do not walk away.</p>',
  '  </body>',
  '</html>',
].join('\n');

/** Page 7's starting point: page 5's answer, with a gap where the image goes. */
const TASK7_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1>Kitchen Notes</h1>',
  '    <p>Three things I can actually cook, written down before I forget them again.</p>',
  '',
  '    <p>I look everything else up on',
  '      <a href="https://developer.mozilla.org">MDN Web Docs</a>.',
  '      <a href="#recipes">Jump to the recipes</a>.</p>',
  '',
  '    <!-- The picture goes on the line below. -->',
  '',
  '    <h2 id="recipes">Recipes</h2>',
  '',
  '    <h3>Cheese on Toast</h3>',
  '    <p>Grill the bread on one side first. Cheese on the <strong>untoasted</strong> side,',
  '      then back under the grill. Do not walk away.</p>',
  '  </body>',
  '</html>',
].join('\n');

const TASK7_SOLUTION_HTML = TASK7_STARTER_HTML.replace(
  '    <!-- The picture goes on the line below. -->\n',
  '    <img src="cat.jpg" alt="A ginger cat staring directly at the camera">\n',
);

const section = {
  id: 'wd1-text-links-images',
  title: 'Text, Links & Images',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-headings',
      type: 'content',
      title: 'Headings are an outline, not a font size',
      blocks: [
        {
          type: 'text',
          md: [
            'You have been using `<h1>` since Section 1 and `<p>` almost as long. There',
            'are five more headings, and the only thing that separates them is a number:',
            '`<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`.',
            '',
            'It is tempting to read those numbers as sizes — h1 the big one, h6 the tiny',
            'one. That is what they *look* like, and it is the wrong way to think about',
            'them. The number is a **level**, the way a contents page has levels:',
            '',
            '```text',
            'Kitchen Notes              <- h1, the title of the whole page',
            '   Breakfast               <- h2, a section of it',
            '      Cheese on Toast      <- h3, part of that section',
            '      Porridge             <- h3, another part',
            '   Dinner                  <- h2, the next section',
            '```',
            '',
            'Read that column of tags on its own and you can tell what the page is about',
            'without reading a single sentence. That is the job headings are doing.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Three levels of heading',
          tabs: ['html'],
          files: {
            html: [
              '<!DOCTYPE html>',
              '<html lang="en">',
              '  <head>',
              '    <title>Kitchen Notes</title>',
              '  </head>',
              '  <body>',
              '    <h1>Kitchen Notes</h1>',
              '    <p>Everything I can cook without a recipe.</p>',
              '',
              '    <h2>Breakfast</h2>',
              '    <h3>Cheese on Toast</h3>',
              '    <p>Bread. Cheese. Heat.</p>',
              '    <h3>Porridge</h3>',
              '    <p>Oats, milk, and more patience than you think.</p>',
              '',
              '    <h2>Dinner</h2>',
              '    <h3>Pasta</h3>',
              '    <p>Boil water. Add pasta. Wait.</p>',
              '  </body>',
              '</html>',
            ].join('\n'),
          },
          caption:
            'Ignore the sizes for a moment and read only the headings, top to bottom: Kitchen Notes, Breakfast, Cheese on Toast, Porridge, Dinner, Pasta. That is a table of contents, and you got it for free by choosing the right numbers. Try changing one <h3> to an <h2> and re-reading the list — the recipe is suddenly a whole section of the site.',
        },
        {
          type: 'text',
          md: [
            '### And the paragraphs between them',
            '',
            '`<p>` is the element for a paragraph of text. Nothing more to it — open it,',
            'write your sentences, close it. Browsers put a gap above and below each one,',
            'which is why text separated into paragraphs looks like text and not like a',
            'wall.',
            '',
            'One thing to re-learn here, because it catches everyone twice: pressing Enter',
            'inside a `<p>` does **not** create a new paragraph. The browser folds every',
            'run of spaces, tabs and newlines into a single space. Two paragraphs means',
            'two `<p>` elements.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            'Two habits worth forming now, while your pages are small enough that they',
            'cost you nothing:',
            '',
            '- **One `<h1>` per page.** It is the title of *this page* — the one-line answer',
            '  to "what am I looking at?" More than one, and the answer is no longer one line.',
            '- **Do not skip levels.** `<h1>` then `<h3>` leaves a hole in the outline, the',
            '  way a contents page would if chapter 1 jumped straight to section 1.1.1.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'The one habit to avoid: **never pick a heading for its size.**',
            '',
            'You will want a small heading, notice that `<h5>` is small, and use `<h5>`.',
            'Your outline now says "this is a fifth-level subsection" about something that',
            'is not. The page looks right and reads wrong — to search engines, to anyone',
            'navigating by headings, and to you in a month.',
            '',
            'Pick the level that describes the structure. Sizes are CSS\'s job, and CSS is',
            'two sections away.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example above, add an `<h2>` called',
            '`Lunch` with an `<h3>` under it, and press Run. Then swap that `<h3>` for an',
            '`<h4>` and read the outline again — nothing visible breaks, but the meaning',
            'quietly changed.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-emphasis',
      type: 'content',
      title: 'Emphasis that means something',
      blocks: [
        {
          type: 'text',
          md: [
            'HTML has four elements for making words stand out inside a sentence, and they',
            'come in two pairs:',
            '',
            '- `<strong>` and `<em>` — these say something about the **meaning** of the words.',
            '- `<b>` and `<i>` — these say something about the **look** of the words.',
            '',
            'By default they render the way you would guess: `<strong>` and `<b>` both come',
            'out bold, `<em>` and `<i>` both come out italic. On screen, each pair is',
            'identical. The difference is entirely in what you have recorded.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Four elements, two appearances',
          tabs: ['html'],
          files: {
            html: [
              '<p>Do <strong>not</strong> walk away from the grill.</p>',
              '<p>Do <b>not</b> walk away from the grill.</p>',
              '',
              '<p>You want the <em>untoasted</em> side facing up.</p>',
              '<p>You want the <i>untoasted</i> side facing up.</p>',
            ].join('\n'),
          },
          caption:
            'The first two lines look the same as each other, and so do the last two. Nothing in the preview tells you which is which — that is exactly the point being made. The difference lives in the code, not on the screen.',
        },
        {
          type: 'text',
          md: [
            '### So when does it matter?',
            '',
            '`<strong>` means **this is important**. A warning, a deadline, the word that',
            'changes what the sentence does if you miss it.',
            '',
            '`<em>` means **stress this word**, the way your voice would. "You want the',
            '*untoasted* side facing up" — the emphasis is doing real work there; it tells',
            'you which side is the one that matters.',
            '',
            '`<b>` and `<i>` are for the cases where you want bold or italic text and there',
            'is no importance or stress behind it: a product name, a ship\'s name, a word',
            'in another language, the first few words of an article set in bold because',
            'that is the house style.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            'Why bother, when they look identical?',
            '',
            'Because `<strong>` and `<em>` put the *reason* into the file. A browser reading',
            'the page aloud, a tool summarising it, a search engine weighing it, a',
            'stylesheet that wants to restyle every important phrase at once — all of them',
            'can see `<strong>` and know what it means. `<b>` tells them only "somebody',
            'wanted this bold."',
            '',
            'Be careful what you expect from that, though. Most screen readers do **not**',
            'announce `<strong>` or `<em>` out loud by default; users generally do not want',
            'a voice saying "strong" every few words. The honest claim is that the meaning',
            'is written down and *available* — not that every tool acts on it.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'A rule of thumb that will serve you for years: **reach for `<strong>` and',
            '`<em>` first.** If you find yourself unable to say *why* something is',
            'important or stressed, that is the moment `<b>` or `<i>` is the right answer.',
            '',
            '**Try this before you move on.** In the example above, change one `<b>` to',
            '`<strong>` and press Run. Confirm for yourself that the preview does not',
            'change at all — then you will believe the rest of this page.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-task-article',
      type: 'task',
      title: 'Mark up an article',
      prompt: [
        'The page below has all the right words and none of the right tags. The body is',
        'four lines of plain text, so the browser runs them together into one grey',
        'smear. Give each line the element it deserves.',
        '',
        '1. `Kitchen Notes` is the title of the page → wrap it in an `<h1>`',
        '2. The line under it is a paragraph → wrap it in a `<p>`',
        '3. `Cheese on Toast` is a section of the page → wrap it in an `<h2>`',
        '4. The recipe itself is a paragraph → wrap it in a `<p>`',
        '5. Inside that recipe, the word **untoasted** is the word that matters. Wrap',
        '   just that one word in `<strong>` or `<em>` — either is defensible here.',
        '',
        'Delete the comment as you go. Press **Run** when the page has a shape.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK3_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'h1',
          text: 'Kitchen Notes',
          message:
            'No <h1> saying "Kitchen Notes" yet. Wrap that line: an opening <h1>, the words, then </h1> with the slash.',
        },
        {
          type: 'dom',
          selector: 'h2',
          text: 'Cheese on Toast',
          message:
            '"Cheese on Toast" is not in an <h2> yet. It is a section of this page, one level down from the page title — so h2, not another h1.',
        },
        {
          type: 'dom',
          selector: 'p',
          minCount: 2,
          message:
            'There should be two paragraphs: the line under the title, and the recipe itself. Each one needs its own <p>...</p> — pressing Enter between them is not enough.',
        },
        {
          type: 'dom',
          selector: 'strong, em',
          text: 'untoasted',
          message:
            'The word "untoasted" is not emphasised yet. Wrap that single word — not the whole sentence — in <strong> or <em>.',
        },
      ],
      hint: [
        'Work one line at a time, from the top. The pattern never changes:',
        '',
        '```html',
        '<h1>Kitchen Notes</h1>',
        '```',
        '',
        'Opening tag, the text that was already there, closing tag with a slash.',
        '',
        'The last one is different only in that it sits *inside* a paragraph rather than',
        'around one:',
        '',
        '```html',
        '<p>Cheese on the <strong>untoasted</strong> side.</p>',
        '```',
        '',
        'The `<strong>` opens and closes inside the `<p>`, which is the nesting rule from',
        'last section doing its job.',
      ].join('\n'),
      solution: { html: TASK3_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-links',
      type: 'content',
      title: 'Links: the thing that made it a web',
      blocks: [
        {
          type: 'text',
          md: [
            'A page that cannot point at another page is a document. Pages that point at',
            'each other are a *web*. The element that does the pointing is `<a>` — short',
            'for **anchor** — and it has one attribute that matters:',
            '',
            '```html',
            '<a href="https://developer.mozilla.org">MDN Web Docs</a>',
            '```',
            '',
            '- `href` is **where it goes**. Short for *hypertext reference*.',
            '- The text between the tags is **what the visitor sees and clicks**.',
            '',
            'Those two are completely independent, and beginners mix them up constantly.',
            '`<a href="MDN Web Docs">https://developer.mozilla.org</a>` is valid HTML that',
            'shows an address and links to nowhere.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### Three kinds of destination',
            '',
            '**Somewhere else on the internet.** Write the full address, starting with',
            '`https://`:',
            '',
            '```html',
            '<a href="https://developer.mozilla.org">MDN Web Docs</a>',
            '```',
            '',
            '**Somewhere on this page.** Write `#` followed by the `id` of the element you',
            'want to jump to. This is the `id` attribute from last section finally earning',
            'its keep:',
            '',
            '```html',
            '<a href="#recipes">Jump to the recipes</a>',
            '...',
            '<h2 id="recipes">Recipes</h2>',
            '```',
            '',
            'The two spellings have to match exactly, and only one of them carries the',
            '`#`: the link has it, the `id` does not.',
            '',
            '**Another page in your own project.** Write the filename, and you will meet',
            'this properly when you have more than one file: `<a href="about.html">About</a>`.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Three links, one page',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Kitchen Notes</h1>',
              '',
              '<p><a href="https://developer.mozilla.org">MDN Web Docs</a> — an address out on the internet.</p>',
              '<p><a href="https://example.com" target="_blank">example.com in a new tab</a> — same idea, plus target.</p>',
              '<p><a href="#recipes">Jump to the recipes</a> — a link to further down this page.</p>',
              '<p><a href="#nowhere">A link to an id that does not exist</a> — watch this one carefully.</p>',
              '',
              '<p>Scroll down.</p>',
              '<p>Keep going.</p>',
              '<p>Still going.</p>',
              '<p>Nearly there.</p>',
              '<p>One more.</p>',
              '',
              '<h2 id="recipes">Recipes</h2>',
              '<p>You have arrived. The id on that heading is what the link was aiming at.</p>',
            ].join('\n'),
          },
          caption:
            'Click all four links, then open the Terminal tab next to Preview. The #recipes link really does scroll the page — that one works for real. The other three cannot: this preview has no internet and nowhere to navigate to, so the sandbox catches each click and writes down where the link would have gone instead. The fourth link explains itself in the Terminal.',
        },
        {
          type: 'text',
          md: [
            '### target="_blank"',
            '',
            'Add `target="_blank"` and the link opens in a new tab instead of replacing the',
            'page the visitor is on:',
            '',
            '```html',
            '<a href="https://example.com" target="_blank">example.com</a>',
            '```',
            '',
            'Use it sparingly — it takes control of the window away from the visitor, and',
            'the Back button no longer does what they expect. It earns its place when',
            'leaving the page would lose something: a half-filled form, a video playing.',
            '',
            'You will also see `rel="noopener"` written alongside it everywhere:',
            '',
            '```html',
            '<a href="https://example.com" target="_blank" rel="noopener">example.com</a>',
            '```',
            '',
            'That was once a genuine security fix — a page opened with `target="_blank"`',
            'used to get a reference back to the page that opened it. Current versions of',
            'the major browsers now behave as if `rel="noopener"` were there whether you',
            'write it or not. It is a habit, and a harmless one; write it if you like the',
            'belt and braces, and do not be alarmed when you see it in other people\'s code.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Two ways a link quietly goes wrong.',
            '',
            '**A missing `https://`.** Write `href="www.example.com"` and you have not made',
            'an internet link — you have made a link to *a file called `www.example.com`',
            'sitting next to your page*. Anything without a scheme in front of it is read',
            'as a path inside your own project. (Try it in the example above: change one',
            '`href` to `www.example.com` and read what the Terminal says the link would do.)',
            '',
            '**A missing quote mark.** `<a href="https://example.com>Click</a>` — the',
            'browser keeps reading, looking for the quote that ends the value, and',
            'swallows your link text into the attribute. The symptom is a link that has',
            'vanished from the page entirely.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example, change the text between the',
            'MDN link\'s tags to `Click here` and run it again. Nothing breaks — and that',
            'is the problem. "Click here" tells a visitor scanning the page nothing at all',
            'about where they are about to go. Link text should name the destination.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-task-links',
      type: 'task',
      title: 'Add two links',
      prompt: [
        'Here is your article again, with one paragraph reserved for links and a',
        '`Recipes` heading further down. Add two links to that paragraph, replacing the',
        'words `Links go here.`',
        '',
        '1. A link to **https://developer.mozilla.org** whose clickable text is',
        '   **MDN Web Docs**',
        '2. A link to **#recipes** whose text is **Jump to the recipes**',
        '',
        'Then make the second one work: give the `<h2>Recipes</h2>` heading an `id` of',
        '**recipes**, so the link has something to land on.',
        '',
        'Press **Run**, then click both links in the preview and read the Terminal tab.',
        'One of them should scroll the page; the other should report where it would have',
        'gone.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK5_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrValue: 'https://developer.mozilla.org',
          message:
            'No link to https://developer.mozilla.org yet. It has to be an <a> element, and the address goes in an href attribute — src is for images, and a link ignores it completely.',
        },
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrValue: 'developer.mozilla.org',
          text: 'MDN Web Docs',
          message:
            'The MDN link has no readable text. The address lives in href="..."; the words "MDN Web Docs" go between the opening and closing tags: <a href="...">MDN Web Docs</a>.',
        },
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrValue: '#recipes',
          message:
            'No link with href="#recipes" yet. A link to somewhere on this same page is a # followed by the id it aims at — no https://, no filename.',
        },
        {
          type: 'dom',
          selector: '#recipes',
          message:
            'Nothing on the page has id="recipes", so the #recipes link has nowhere to land. Add it to the opening tag of the Recipes heading: <h2 id="recipes">. The id is written without the #.',
        },
      ],
      hint: [
        'Take the first link on its own. Three moving parts, in this order:',
        '',
        '```html',
        '<a href="https://developer.mozilla.org">MDN Web Docs</a>',
        '```',
        '',
        'the tag, the address inside `href="..."`, and the clickable words between the',
        'tags. The second link is the same shape with a different address:',
        '`href="#recipes"`.',
        '',
        'Both of them live *inside* the paragraph, so the `<p>` opens before them and',
        'closes after them.',
        '',
        'The `id` is separate work and it goes somewhere else entirely — on the opening',
        '`<h2>` tag, as `<h2 id="recipes">`, with no `#` in front of it. The `#` belongs',
        'only to the link.',
      ].join('\n'),
      solution: { html: TASK5_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-images',
      type: 'content',
      title: 'Images, and the attribute nobody skips twice',
      blocks: [
        {
          type: 'text',
          md: [
            'An image is one tag with two attributes:',
            '',
            '```html',
            '<img src="cat.jpg" alt="A ginger cat staring directly at the camera">',
            '```',
            '',
            '- `src` — **which picture**. Short for *source*: a filename, or a full address.',
            '- `alt` — **what the picture shows**, in words.',
            '',
            'Notice what is missing: there is no `</img>`. `<img>` is a **void element**,',
            'like the `<hr>` and `<br>` you met last section. It has no content to wrap —',
            'the picture *is* the content, and it arrives through `src`. This is the',
            'moment attributes stop being decoration: an `<img>` with no `src` is not a',
            'small image, it is nothing at all.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### Pictures in this sandbox',
            '',
            'In a real project, `src="cat.jpg"` means "a file named cat.jpg, sitting next',
            'to this page." There are no files here — your page lives in a preview pane,',
            'not a folder — so this course ships three pictures you can use by name:',
            '',
            '- `cat.jpg`',
            '- `mountain.jpg`',
            '- `logo.png`',
            '',
            'Type any other filename and you will get a broken image, which is not a bug',
            'and is worth seeing at least once.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'One that works, one that does not',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Two images</h1>',
              '',
              '<img src="mountain.jpg" alt="A snow-capped peak behind a green hillside">',
              '',
              '<img src="sunset.jpg" alt="The sun going down behind the sea">',
            ].join('\n'),
          },
          caption:
            'The first one draws. The second cannot — there is no sunset.jpg — so the browser falls back to the alt text, usually beside a small broken-image icon. Look at what that second line gives you: the page is damaged, and a visitor can still tell what was meant to be there. That is alt text doing the job it was invented for.',
        },
        {
          type: 'text',
          md: [
            '### Writing alt text that is worth having',
            '',
            'Ask yourself one question: **if this picture never loaded, what would I need',
            'the sentence in its place to say?**',
            '',
            'That question rules out most of the bad answers on its own.',
            '',
            '| Instead of | Write |',
            '| --- | --- |',
            '| `alt="image"` | `alt="A ginger cat staring directly at the camera"` |',
            '| `alt="cat.jpg"` | `alt="A ginger cat staring directly at the camera"` |',
            '| `alt="photo of a cat"` | `alt="A ginger cat staring directly at the camera"` |',
            '',
            'Describe what is *in* the picture and why it is there. A short sentence is',
            'plenty; you are not writing a caption for a gallery.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            'There is one case where the right alt text is no text at all:',
            '',
            '```html',
            '<img src="logo.png" alt="">',
            '```',
            '',
            'An `alt=""` that is deliberately empty says "this picture adds nothing a',
            'reader needs" — a decorative swirl, a divider, a background flourish. Tools',
            'that read pages aloud can then skip it instead of announcing something',
            'pointless.',
            '',
            'The important part is that it is **written and empty**, not **missing**.',
            'Leaving `alt` out altogether does not say "decorative"; it says nothing at',
            'all, and a tool reading the page has to fall back to guessing — often by',
            'reading out the filename.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Three alt texts to never write:',
            '',
            '- **The filename.** `alt="IMG_4021.jpg"` is what happens automatically when',
            '  you write nothing useful. It helps no one.',
            '- **The word "image".** `alt="image"`, `alt="photo"`, `alt="picture"` — the',
            '  reader already knows it is an image. You have used the one slot you had to',
            '  tell them something and said nothing.',
            '- **"Image of…" as a prefix.** `alt="image of a cat"` is the same waste in a',
            '  longer form. Start with the thing itself: `alt="A ginger cat…"`.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example above, delete the `alt` from',
            'the broken `sunset.jpg` image and press Run. Compare the two runs: with alt,',
            'the page tells you what is missing; without it, there is simply a hole where',
            'something used to be. That difference is the whole argument.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-task-image',
      type: 'task',
      title: 'Add an image with alt text worth reading',
      required: true,
      prompt: [
        'Your article is nearly finished. It needs a picture, on the empty line marked',
        'by the comment, between the links paragraph and the Recipes heading.',
        '',
        '1. Add an `<img>` with a `src` of **cat.jpg** — one of the three pictures this',
        '   sandbox provides',
        '2. Give it an `alt` describing what is in the picture. Something like',
        '   **A ginger cat staring directly at the camera** — your own wording is welcome,',
        '   as long as it is a real description.',
        '',
        'The checks are fussy about one thing only: the `alt` has to be a description.',
        '`image`, `photo`, `picture` and `cat.jpg` will all be rejected, because none of',
        'them would help anyone who could not see the picture.',
        '',
        'Remember that `<img>` is a void element — one tag, no closing partner. Press',
        '**Run** when it is in.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK7_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'img',
          attr: 'src',
          attrNonEmpty: true,
          message:
            'There is no <img> with a src yet. One tag does it, on the commented line: <img src="cat.jpg" alt="...">. Without a src there is no picture to show.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          message:
            'The image has no alt text. Add an alt attribute inside the same tag, after the src, describing what the picture shows: alt="A ginger cat staring directly at the camera".',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          attrNot: ['image', 'photo', 'picture', 'img', 'photograph', 'image of a cat', 'photo of a cat', 'a cat'],
          // Rejects a bare filename ("cat.jpg", "IMG_4021.JPG") and anything too
          // short to be a description. Everything else is accepted - the point is
          // to rule out the non-answers, not to grade the student's prose.
          attrNotPattern: '^(\\S+\\.(jpg|jpeg|png|gif|svg|webp)|.{0,3})$',
          message:
            'That alt text does not describe the picture. A filename or a word like "image", "photo" or "picture" tells a reader nothing they did not already know — write the short sentence you would want in the picture\'s place, such as "A ginger cat staring directly at the camera".',
        },
      ],
      hint: [
        'Start with the tag and only the src:',
        '',
        '```html',
        '<img src="cat.jpg">',
        '```',
        '',
        'Run it. A cat should appear. If it does not, check the spelling of `cat.jpg` —',
        'the sandbox knows three names and nothing else.',
        '',
        'Now add the second attribute inside that same tag, separated from the first by',
        'a space:',
        '',
        '```html',
        '<img src="cat.jpg" alt="A ginger cat staring directly at the camera">',
        '```',
        '',
        'Both attributes live in the one tag. There is no `</img>` to add afterwards —',
        'if you have written one, delete it.',
      ].join('\n'),
      solution: { html: TASK7_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-quiz-text-links-images',
      type: 'quiz',
      title: 'Knowledge check: text, links and images',
      required: true,
      questions: [
        {
          q: 'Your page has an `<h1>` and you now need a smaller heading under it. Which do you use?',
          options: [
            '<h2>, because it is the next level down in the outline.',
            '<h5>, because it is closest to the size you want.',
            'Another <h1>, so the two headings match.',
            'Any of them — the number only changes the size.',
          ],
          answerIndex: 0,
          explanation:
            'The number is a level, not a size. Picking `<h5>` for its size is the popular wrong answer and the one worth unlearning: it tells every tool reading your page that this is a fifth-level subsection of something that does not exist. Choose the level that matches the structure and let CSS decide how big it looks.',
        },
        {
          q: 'What is the difference between `<strong>` and `<b>`?',
          options: [
            '<strong> is bolder than <b>.',
            'They are identical; <b> is the old spelling and is no longer valid.',
            '<strong> says the words are important; <b> only asks for bold text.',
            '<strong> works in every browser, <b> only in modern ones.',
          ],
          answerIndex: 2,
          explanation:
            'Both render bold by default — that is why "they are identical" is so tempting — but `<b>` is still perfectly valid HTML with its own job: bold text where there is no importance behind it, like a product name. `<strong>` records *why* the words stand out, and that reason is available to tools that care.',
        },
        {
          q: 'In `<a href="https://example.com">Read the docs</a>`, what does href do?',
          options: [
            'It sets the words the visitor clicks on.',
            'It holds the address the link goes to.',
            'It names the link so other elements can find it.',
            'It decides whether the link opens in a new tab.',
          ],
          answerIndex: 1,
          explanation:
            '`href` is the destination; the clickable words are the text between the tags. Swapping those two is the classic beginner link bug — a page that displays an address and links nowhere. Naming an element for others to find is `id`, and new tabs are `target="_blank"`.',
        },
        {
          q: 'What is alt text for?',
          options: [
            'It shows as a caption underneath the image.',
            'It is the tooltip that appears when you hover over the image.',
            'It describes the image for anyone who cannot see it, including when the image fails to load.',
            'It tells the browser which file to load if the first one is missing.',
          ],
          answerIndex: 2,
          explanation:
            'It is the picture in words. The tooltip answer is the near-miss worth knowing: hover text is a different attribute, `title`, and it is not a substitute. And alt is never a backup file — a second `src` does not exist, which is exactly why alt matters when the first one fails.',
        },
        {
          q: 'Which of these is written as a single tag, with no closing partner?',
          options: ['<img>', '<a>', '<strong>', '<h1>'],
          answerIndex: 0,
          explanation:
            '`<img>` is a void element: there is nothing between an opening and closing tag because the picture arrives through the `src` attribute. `</img>` is not a thing. The other three all wrap content — and `<a>` in particular *must*, or there would be nothing to click.',
        },
      ],
    },
  ],
};

export default section;
