// Module 1 — the Mini Project.
//
// One page, built in five milestones, plus a final rubric. This is the build
// that puts Sections 1-5 together into something the student keeps: Module 2
// styles THIS page with CSS rather than starting from a fresh file.
//
// Authoring notes for whoever edits this next:
//
//  - It is NOT a section, for the same reason the challenge is not: a section
//    counts as a lesson everywhere in the app (sidebar, course progress,
//    `completedLessons`), and this is a project, recorded against `module101`
//    in `completedProjects` like every other course's mini project. See
//    lib/webdev/project.js.
//  - Shape is otherwise exactly a section's, so `checkSection` validates it and
//    the engine's TaskPage renders its pages. ProjectPager adds the two rules a
//    section does not have: milestone N opens when N-1 passes, and every page
//    shares ONE draft key.
//  - ONE DOCUMENT. Every milestone's `starter` is the same scaffold on purpose.
//    The student's draft overrides it from the moment they type (CodeRunner
//    prefers the saved draft over the starter), so the starter is only ever
//    seen on milestone 1 and whenever someone presses Reset — which, because
//    there is one draft, empties the whole project page. Milestone 1's prompt
//    says so.
//  - CUMULATIVE SOLUTIONS. Milestone N's solution is the whole page as it
//    stands at the end of milestone N, not just the new part, because that is
//    what the student's own editor holds by then. They are assembled from the
//    PART_* constants below so the five of them cannot drift apart.
//  - Each milestone's checks cover only ITS new requirements. Re-checking
//    everything is the rubric's job, which is what catches a student who
//    deletes their table while building the form.
//  - Prerequisites: everything here is taught in Sections 1-5. `<textarea>`
//    (milestone 5) is the thinnest of them — one tip on Section 5's input-types
//    page — so it is restated in this milestone's prompt, hint and solution at
//    the point of use rather than assumed.
//  - `cat.jpg`, `mountain.jpg` and `logo.png` are the sandbox's built-in sample
//    images (lib/webdev/sandbox.js); nothing else resolves to a picture.
//  - No HTML entities in the starters or solutions: the checks compare text
//    content, and "&amp;" reads back as "&" — one more thing to get wrong for
//    no teaching value.

// ---------------------------------------------------------------------------
// The page, part by part. The solutions below are these, joined.
// ---------------------------------------------------------------------------

const STARTER = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <!-- 1. a <title> for the browser tab -->',
  '  </head>',
  '  <body>',
  '    <!-- 2. one <h1> with your name in it -->',
  '',
  '    <!-- 3. one <p> introducing yourself -->',
  '  </body>',
  '</html>',
].join('\n');

const PART_SKELETON = [
  '    <h1>Asha Raman</h1>',
  '',
  '    <p>I am learning to build for the web, one page at a time. This is the first',
  '      page I have written from scratch.</p>',
].join('\n');

const PART_ABOUT = [
  '    <h2>About me</h2>',
  '',
  '    <p>I got into building things when I took an old laptop apart, and only about',
  '      half of it went back together. The half that worked was enough.</p>',
  '',
  '    <p>Outside school I fix bikes, I cook badly, and I read far too much science',
  '      fiction.</p>',
  '',
  '    <img src="cat.jpg" alt="My cat Mango asleep across my keyboard">',
  '',
  '    <p>I write up everything I build on',
  '      <a href="https://example.com/asha">my notes page</a>.</p>',
].join('\n');

const PART_LISTS = [
  '    <h2>Things I am into</h2>',
  '',
  '    <ul>',
  '      <li>Fixing bikes</li>',
  '      <li>Pixel art</li>',
  '      <li>Long walks with a podcast on</li>',
  '    </ul>',
  '',
  '    <h2>Goals for this year</h2>',
  '',
  '    <ol>',
  '      <li>Finish this web development course</li>',
  '      <li>Build a page for the bike club</li>',
  '      <li>Teach my sister to code</li>',
  '    </ol>',
].join('\n');

const PART_TABLE = [
  '    <h2>My skills</h2>',
  '',
  '    <table>',
  '      <thead>',
  '        <tr>',
  '          <th>Skill</th>',
  '          <th>How long</th>',
  '          <th>How it is going</th>',
  '        </tr>',
  '      </thead>',
  '      <tr>',
  '        <td>HTML</td>',
  '        <td>3 weeks</td>',
  '        <td>Getting there</td>',
  '      </tr>',
  '      <tr>',
  '        <td>Bike repair</td>',
  '        <td>2 years</td>',
  '        <td>Confident</td>',
  '      </tr>',
  '      <tr>',
  '        <td>Pixel art</td>',
  '        <td>6 months</td>',
  '        <td>Slow, but fun</td>',
  '      </tr>',
  '    </table>',
].join('\n');

const PART_FORM = [
  '    <h2>Get in touch</h2>',
  '',
  '    <form>',
  '      <p>',
  '        <label for="name">Your name</label>',
  '        <input type="text" id="name">',
  '      </p>',
  '',
  '      <p>',
  '        <label for="email">Your email address</label>',
  '        <input type="email" id="email">',
  '      </p>',
  '',
  '      <p>',
  '        <label for="message">Your message</label>',
  '        <textarea id="message" rows="4"></textarea>',
  '      </p>',
  '',
  '      <button type="submit">Send it</button>',
  '    </form>',
].join('\n');

/** The whole page, built from the parts finished by the end of milestone N. */
function pageThrough(...parts) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '  <head>',
    '    <title>Asha Raman</title>',
    '  </head>',
    '  <body>',
    parts.join('\n\n'),
    '  </body>',
    '</html>',
  ].join('\n');
}

const SOLUTION_1 = pageThrough(PART_SKELETON);
const SOLUTION_2 = pageThrough(PART_SKELETON, PART_ABOUT);
const SOLUTION_3 = pageThrough(PART_SKELETON, PART_ABOUT, PART_LISTS);
const SOLUTION_4 = pageThrough(PART_SKELETON, PART_ABOUT, PART_LISTS, PART_TABLE);
const SOLUTION_5 = pageThrough(PART_SKELETON, PART_ABOUT, PART_LISTS, PART_TABLE, PART_FORM);

/** Alt text that describes nothing. Shared by the checks that grade alt text. */
const LAZY_ALT = ['image', 'photo', 'picture', 'me', 'my photo', 'cat.jpg', 'mountain.jpg', 'logo.png'];

// ---------------------------------------------------------------------------
// The project
// ---------------------------------------------------------------------------

/**
 * The Module 1 Mini Project.
 *
 * Same shape as a lesson section (id / title / pages), so `checkSection`
 * validates it and TaskPage renders its pages. The last page carries
 * `role: 'rubric'`, which is what tells ProjectPager it is the final checklist
 * rather than a sixth milestone.
 */
const wd1Project = {
  id: 'wd1-project',
  title: 'Build your personal profile page',
  pages: [
    // --- Milestone 1 ---------------------------------------------------------
    {
      id: 'm1-skeleton',
      type: 'task',
      required: true,
      title: 'Milestone 1 — The skeleton',
      prompt: [
        'You are going to build one page about yourself, in five stages. Everything you',
        'write stays in this editor from one milestone to the next, so by the end you will',
        'have a whole page rather than five separate exercises.',
        '',
        'Start with the bones. The file below already has the doctype, `<html>`, `<head>`',
        'and `<body>` — leave those in place and fill in the three comments:',
        '',
        '1. A `<title>` in the `<head>`. It names the browser tab, not the page.',
        '2. One `<h1>` in the `<body>`, with your name in it.',
        '3. One `<p>` under it, introducing yourself in a sentence or two.',
        '',
        'Use your own name and your own words — the checks only ask that each piece is',
        'there and is not empty. Press **Run** and watch the mock browser tab above the',
        'preview to see your title appear.',
        '',
        'One warning before you start: the **↺ Reset** button above the editor empties this',
        'page back to the starter above. Because the whole project is one document, that',
        'is the one button here that throws away work from every milestone.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'title',
          textNonEmpty: true,
          message:
            'The page has a <title> with words in it. It goes inside <head>, and it is what the mock browser tab above the preview reads.',
        },
        {
          type: 'dom',
          selector: 'h1',
          count: 1,
          textNonEmpty: true,
          message:
            'There is exactly one <h1>, with your name between its tags. One <h1> per page: it is the name of the whole page.',
        },
        {
          type: 'dom',
          selector: 'p',
          minCount: 1,
          textNonEmpty: true,
          message:
            'There is an intro paragraph: a <p> with a sentence in it. An empty <p></p> does not count.',
        },
      ],
      hint: [
        '- `<title>` and `<h1>` are two different things that often say the same words.',
        '  The title goes in the `<head>` and shows on the tab; the `<h1>` goes in the',
        '  `<body>` and shows on the page.',
        '- Delete each comment as you replace it, so what is left is what you still owe.',
      ].join('\n'),
      solution: { html: SOLUTION_1 },
    },

    // --- Milestone 2 ---------------------------------------------------------
    {
      id: 'm2-about',
      type: 'task',
      required: true,
      title: 'Milestone 2 — About me',
      prompt: [
        'Your page is still in the editor, exactly as you left it. Add an about section',
        'underneath what you have already written:',
        '',
        '1. An `<h2>` that reads **About me**. It is an `<h2>` and not another `<h1>`',
        '   because it is a section of the page, not the name of it.',
        '2. At least **two more** `<p>` paragraphs saying something about you.',
        '3. An `<img>` with `alt` text that describes the picture. Use `cat.jpg`,',
        '   `mountain.jpg` or `logo.png` — those are the three pictures this preview',
        '   knows about, and any other file name shows a broken image.',
        '4. At least one `<a>` link with an `href` and words to click on. Link anywhere',
        '   you like: a real site, or `https://example.com/yourname`.',
        '',
        'Write the `alt` text as if you were describing the picture to someone on the',
        'phone. "image", "photo" and the file name all fail the check, because none of',
        'them tell that person anything.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h2',
          text: 'About me',
          count: 1,
          message:
            'There is exactly one <h2> reading "About me". <h2> is the next level down from <h1>, which is what makes it a section of this page.',
        },
        {
          type: 'dom',
          selector: 'p',
          minCount: 3,
          textNonEmpty: true,
          message:
            'There are at least three paragraphs with text in them: your intro from milestone 1, plus two or more about you.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'src',
          attrNonEmpty: true,
          minCount: 1,
          message:
            'There is an <img> with a src. Use cat.jpg, mountain.jpg or logo.png so a real picture appears in the preview.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          attrNot: LAZY_ALT,
          minCount: 1,
          message:
            'The image has alt text that describes what is in the picture. "image", "photo" and the file name describe nothing.',
        },
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrNonEmpty: true,
          textNonEmpty: true,
          minCount: 1,
          message:
            'There is an <a> with both an href and words between its tags. Without an href it is not a link, and without text there is nothing to click.',
        },
      ],
      hint: [
        '- `alt` and `href` are both attributes: they go inside the opening tag, after the',
        '  tag name, written as `name="value"`.',
        '- Clicking your link in the preview will not leave the page — the sandbox catches',
        '  it and prints where it would have gone in the Terminal instead.',
      ].join('\n'),
      solution: { html: SOLUTION_2 },
    },

    // --- Milestone 3 ---------------------------------------------------------
    {
      id: 'm3-lists',
      type: 'task',
      required: true,
      title: 'Milestone 3 — Two lists',
      prompt: [
        'Add two more sections to the page, each with its own `<h2>` heading:',
        '',
        '1. **Things I am into** — a `<ul>` with at least three `<li>` items. A `<ul>` is',
        '   an unordered list: bullet points, where the order does not mean anything.',
        '2. **Goals for this year** — an `<ol>` with at least three `<li>` items. An `<ol>`',
        '   is ordered: it numbers itself, so use it when first really is first.',
        '',
        'Both kinds of list hold the same `<li>` items — the only difference is which tag',
        'you wrap them in. Your headings can say whatever you like; the checks only count',
        'the headings and the items.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h2',
          minCount: 3,
          textNonEmpty: true,
          message:
            'There are at least three <h2> headings now: "About me" from milestone 2, plus one for each of the two new lists.',
        },
        {
          type: 'dom',
          selector: 'ul li',
          minCount: 3,
          textNonEmpty: true,
          message:
            'There is a <ul> holding at least three <li> items with text in them. The <li> items go inside the <ul>, not next to it.',
        },
        {
          type: 'dom',
          selector: 'ol li',
          minCount: 3,
          textNonEmpty: true,
          message:
            'There is an <ol> holding at least three <li> items with text in them. Do not number them yourself — the <ol> does that.',
        },
      ],
      hint: [
        '- One list looks like this, and the other is the same with `ol` in place of `ul`:',
        '  `<ul>` on its own line, three `<li>Something</li>` lines, then `</ul>`.',
        '- If your bullets come out as one long line, the `<li>` items have ended up',
        '  outside the `<ul>`. Check that the closing `</ul>` is below the last item.',
      ].join('\n'),
      solution: { html: SOLUTION_3 },
    },

    // --- Milestone 4 ---------------------------------------------------------
    {
      id: 'm4-table',
      type: 'task',
      required: true,
      title: 'Milestone 4 — A table',
      prompt: [
        'Add a fourth section with an `<h2>` of its own and a `<table>` in it. Make it a',
        'skills table, or a weekly schedule if you prefer — your choice of columns. It',
        'needs:',
        '',
        '1. A `<thead>` holding one `<tr>` of at least **two** `<th>` header cells.',
        '2. At least **three** data rows after it, each a `<tr>` of `<td>` cells, one per',
        '   column.',
        '',
        'The difference between `<th>` and `<td>` is meaning, not looks: `<th>` says "this',
        'cell is the heading for its column", which is how a screen reader announces what',
        'each value belongs to. Two columns and three rows is six `<td>` cells in total.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h2',
          minCount: 4,
          textNonEmpty: true,
          message: 'There are at least four <h2> headings now — the new table section has one of its own.',
        },
        {
          type: 'dom',
          selector: 'table',
          minCount: 1,
          message: 'There is a <table> on the page.',
        },
        {
          type: 'dom',
          selector: 'table thead th',
          minCount: 2,
          textNonEmpty: true,
          message:
            'The table has a <thead> holding a row of at least two <th> cells with text. <th> marks a cell as a heading; <thead> marks the row as the header row.',
        },
        {
          // Cells alone cannot tell three rows of two from two rows of three,
          // so the rows are counted as well. Four <tr>: the header plus three.
          type: 'dom',
          selector: 'table tr',
          minCount: 4,
          message:
            'The table has at least four rows: the header row, plus three rows of data under it.',
        },
        {
          type: 'dom',
          selector: 'table td',
          minCount: 6,
          textNonEmpty: true,
          message:
            'There are at least six <td> cells with text in them — three data rows of two columns, or more. Header cells are <th> and are not counted here.',
        },
      ],
      hint: [
        '- A table is rows first, cells second: `<tr>` holds the row, and the `<th>` or',
        '  `<td>` cells go inside it. Three cells in a row means three tags inside one `<tr>`.',
        '- Write the header row and press **Run** before you write the rest. A half-built',
        '  table still renders, so you can watch it grow a row at a time.',
      ].join('\n'),
      solution: { html: SOLUTION_4 },
    },

    // --- Milestone 5 ---------------------------------------------------------
    {
      id: 'm5-contact',
      type: 'task',
      required: true,
      title: 'Milestone 5 — A contact form',
      prompt: [
        'Last piece. Add a fifth section, with an `<h2>` and a `<form>` holding three',
        'labelled fields and a button:',
        '',
        '1. A `<label>` and an `<input type="text">` for a name',
        '2. A `<label>` and an `<input type="email">` for an email address',
        '3. A `<label>` and a `<textarea>` for a message',
        '4. A `<button>` with words on it',
        '',
        '`<textarea>` is the one tag here you have only seen in passing, in Section 5\'s',
        'tip on multi-line boxes. It is a text box that is',
        'several lines tall, for anything longer than a line — and unlike `<input>` it has',
        'a closing tag: `<textarea id="message" rows="4"></textarea>`. Leave the inside',
        'empty; anything you type between the tags shows up as text already in the box.',
        '',
        'Joining a label to its field is the part that matters. Give the field an `id`,',
        'and give its label a `for` with the **same** value — three fields means three',
        'different ids. Press **Run** and click the word "Your name" in the preview: if',
        'the cursor lands in the box, they are joined.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h2',
          minCount: 5,
          textNonEmpty: true,
          message: 'There are at least five <h2> headings now — the contact section has one of its own.',
        },
        {
          type: 'dom',
          selector: 'form label',
          count: 3,
          textNonEmpty: true,
          attr: 'for',
          attrNonEmpty: true,
          message:
            'There are exactly three <label> elements inside the form, each with words between its tags and a for attribute.',
        },
        {
          type: 'dom',
          selector: 'form input',
          count: 2,
          attr: 'id',
          attrNonEmpty: true,
          message:
            'There are exactly two <input> elements inside the form, each with an id. The message box is a <textarea>, not a third input.',
        },
        {
          type: 'dom',
          selector: 'form input',
          attr: 'type',
          attrValue: 'email',
          minCount: 1,
          message:
            'One of the inputs is type="email". The type is what tells the browser, and a phone keyboard, what kind of answer this is.',
        },
        {
          type: 'dom',
          selector: 'form textarea',
          attr: 'id',
          attrNonEmpty: true,
          minCount: 1,
          message:
            'There is a <textarea> inside the form, with an id. Remember its closing </textarea> tag.',
        },
        {
          type: 'link',
          selector: 'label',
          attr: 'for',
          target: 'input',
          targetAttr: 'id',
          requireText: true,
          message:
            'A label\'s for matches an input\'s id. The two spellings have to be identical — that match is the whole connection.',
        },
        {
          type: 'link',
          selector: 'label',
          attr: 'for',
          target: 'textarea',
          targetAttr: 'id',
          requireText: true,
          message:
            'A label\'s for matches the textarea\'s id too. The message box needs a label as much as the other two fields do.',
        },
        {
          type: 'dom',
          selector: 'form button',
          textNonEmpty: true,
          minCount: 1,
          message: 'The form ends with a <button> that has words on it.',
        },
      ],
      hint: [
        '- Each pair is two lines: `<label for="name">Your name</label>` and then',
        '  `<input type="text" id="name">`. The word inside both sets of quotes is the',
        '  same word, and it is different for each field.',
        '- Nothing is sent anywhere when you press the button. The sandbox catches the',
        '  submit and prints a note in the Terminal instead of navigating away.',
      ].join('\n'),
      solution: { html: SOLUTION_5 },
    },

    // --- The rubric ----------------------------------------------------------
    //
    // Every item below re-checks the finished page. Milestone checks grade only
    // what that milestone added; these grade the whole thing, so a table
    // deleted while building the form is caught here, by name.
    {
      id: 'rubric',
      role: 'rubric',
      type: 'task',
      required: true,
      title: 'Your finished page, checked',
      prompt: [
        'This is the whole page, checked against everything the project asked for — not',
        'just the last milestone. It runs the moment you open it, and again every time',
        'you press **Run**.',
        '',
        'Any item below that has not ticked names what is missing. An item from an earlier',
        'milestone failing here means something got deleted or broken on the way to the',
        'end — the editor beside it is your page, so fix it right there and run it again.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: STARTER },
      checks: [
        // --- The page as a whole ---
        {
          type: 'dom',
          selector: 'title',
          textNonEmpty: true,
          message: 'The page has a title.',
        },
        {
          type: 'dom',
          selector: 'h1',
          count: 1,
          textNonEmpty: true,
          message: 'There is exactly one <h1>, and it is not empty.',
        },
        {
          type: 'dom',
          selector: 'h2',
          minCount: 5,
          textNonEmpty: true,
          message: 'Every section has its own <h2>: about, interests, goals, the table, and contact.',
        },
        {
          type: 'dom',
          selector: 'h4',
          count: 0,
          message:
            'Headings go down one level at a time. This page runs <h1> then <h2>, so nothing on it should have jumped to an <h4>.',
        },
        // --- Images ---
        {
          type: 'every',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          minCount: 1,
          message: 'Every image on the page has alt text.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          attrNot: LAZY_ALT,
          minCount: 1,
          message: 'That alt text describes the picture, rather than repeating the file name.',
        },
        // --- Text and links ---
        {
          type: 'dom',
          selector: 'p',
          minCount: 3,
          textNonEmpty: true,
          message: 'The intro and about paragraphs are still there: three or more <p> with text.',
        },
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrNonEmpty: true,
          textNonEmpty: true,
          minCount: 1,
          message: 'The link is still there, with both an href and text to click.',
        },
        // --- Lists ---
        {
          type: 'dom',
          selector: 'ul li',
          minCount: 3,
          textNonEmpty: true,
          message: 'The interests list is a <ul> with three or more items.',
        },
        {
          type: 'dom',
          selector: 'ol li',
          minCount: 3,
          textNonEmpty: true,
          message: 'The goals list is an <ol> with three or more items.',
        },
        // --- Table ---
        {
          type: 'dom',
          selector: 'table thead th',
          minCount: 2,
          textNonEmpty: true,
          message: 'The table still has a <thead> row of <th> header cells.',
        },
        {
          type: 'dom',
          selector: 'table tr',
          minCount: 4,
          message: 'The table still has its header row and three rows of data.',
        },
        {
          type: 'dom',
          selector: 'table td',
          minCount: 6,
          textNonEmpty: true,
          message: 'Those data rows still have their <td> cells, with text in them.',
        },
        // --- Form ---
        {
          type: 'every',
          selector: 'form label',
          attr: 'for',
          attrNonEmpty: true,
          minCount: 3,
          message: 'Every label in the form has a for attribute — all three of them.',
        },
        {
          type: 'every',
          selector: 'form input',
          attr: 'id',
          attrNonEmpty: true,
          minCount: 2,
          message: 'Every input in the form has an id for its label to point at.',
        },
        {
          type: 'every',
          selector: 'form textarea',
          attr: 'id',
          attrNonEmpty: true,
          minCount: 1,
          message: 'The message <textarea> has an id too.',
        },
        {
          type: 'link',
          selector: 'label',
          attr: 'for',
          target: 'input',
          targetAttr: 'id',
          requireText: true,
          message: 'A label and an input are actually joined: one label\'s for matches one input\'s id.',
        },
        {
          type: 'link',
          selector: 'label',
          attr: 'for',
          target: 'textarea',
          targetAttr: 'id',
          requireText: true,
          message: 'The message label and the textarea are joined the same way.',
        },
        {
          type: 'dom',
          selector: 'form input',
          attr: 'type',
          attrValue: 'email',
          minCount: 1,
          message: 'The email field is still type="email".',
        },
        {
          type: 'dom',
          selector: 'form button',
          textNonEmpty: true,
          minCount: 1,
          message: 'The form still ends with a <button> with words on it.',
        },
      ],
      hint: [
        '- Read the failing item, then find that part of your page in the editor. The items',
        '  are in page order: title and headings first, then the about section, the lists,',
        '  the table and the form.',
        '- If an item you passed earlier is failing now, you almost certainly deleted a',
        '  closing tag. An unclosed `<ul>` or `<table>` swallows everything written after',
        '  it, so several items fail at once for one missing line.',
      ].join('\n'),
      solution: { html: SOLUTION_5 },
    },
  ],
};

export default wd1Project;
