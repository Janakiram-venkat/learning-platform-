// Module 1 — the Module Challenge.
//
// Six graded tasks, one per page, no reading in between. This is the checkpoint
// for everything Sections 1-5 taught: page skeleton, headings, links, images,
// lists, tables and labelled forms.
//
// Authoring notes for whoever edits this next:
//  - It is NOT a section. It is deliberately kept out of SECTIONS in index.js:
//    a section counts as a lesson everywhere in the app (sidebar, course
//    progress, unlock logic), and the challenge is an assignment, recorded
//    against `module101` in `completedAssignments` like every other course's
//    module challenge. See lib/webdev/challenge.js.
//  - Shape is otherwise exactly a section's, so `checkSection` validates it and
//    the same TaskPage renders its pages. The result screen is NOT a page: it
//    lives in ChallengePager, after the last task.
//  - Nothing here gates anything. A student can walk past a failed task, reach
//    the result screen, and come back to retry. The pass mark is one constant,
//    CHALLENGE_PASS_MARK in lib/webdev/challenge.js.
//  - Two tasks (2 and 3) start from a BROKEN page. Every bug is its own check,
//    and each of those tasks also carries checks that the original content
//    survived — so "delete everything" can never pass.
//  - Only concepts taught in Sections 1-5 appear: HTML only, no CSS and no
//    JavaScript. `cat.jpg` and `mountain.jpg` are the sandbox's built-in sample
//    images (lib/webdev/sandbox.js); nothing else resolves to a picture.
//  - No HTML entities anywhere in the starters or solutions. The checks compare
//    text content, and "&amp;" reads back as "&" — one more thing to get wrong
//    for no teaching value. Hence "Bean and Leaf Cafe", not "Bean & Leaf Café".

// --- Task 1: build the skeleton ---------------------------------------------

const T1_STARTER = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <!-- 1. a <title> goes here -->',
  '  </head>',
  '  <body>',
  '    <!-- 2. one <h1> with the cafe name -->',
  '',
  '    <!-- 3. two <p> paragraphs about it -->',
  '  </body>',
  '</html>',
].join('\n');

const T1_SOLUTION = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Bean and Leaf Cafe</title>',
  '  </head>',
  '  <body>',
  '    <h1>Bean and Leaf Cafe</h1>',
  '',
  '    <p>Small batch coffee, roasted on site every Tuesday morning.</p>',
  '    <p>We open early, close late, and always have a guest bean on.</p>',
  '  </body>',
  '</html>',
].join('\n');

// --- Task 2: fix the bug (text, links, images) ------------------------------

const T2_STARTER = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Bean and Leaf Cafe</title>',
  '  </head>',
  '  <body>',
  '    <h1>Bean and Leaf Cafe</h1>',
  '    <p>Small batch coffee, roasted on site every Tuesday morning.</p>',
  '',
  '    <h3>Our Menu</h3>',
  '    <p>Espresso, filter, and a rotating guest bean.</p>',
  '',
  '    <img src="cat.jpg">',
  '',
  '    <a>Book a table</a>',
  '  </body>',
  '</html>',
].join('\n');

const T2_SOLUTION = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Bean and Leaf Cafe</title>',
  '  </head>',
  '  <body>',
  '    <h1>Bean and Leaf Cafe</h1>',
  '    <p>Small batch coffee, roasted on site every Tuesday morning.</p>',
  '',
  '    <h2>Our Menu</h2>',
  '    <p>Espresso, filter, and a rotating guest bean.</p>',
  '',
  '    <img src="cat.jpg" alt="The cafe cat asleep on a stack of coffee sacks">',
  '',
  '    <a href="https://example.com/booking">Book a table</a>',
  '  </body>',
  '</html>',
].join('\n');

// --- Task 3: fix the bug (lists and tables) ---------------------------------

const T3_STARTER = [
  '<h1>This week at Bean and Leaf</h1>',
  '',
  '<h2>Guest beans</h2>',
  '<li>Kenya Nyeri</li>',
  '<li>Brazil Cerrado</li>',
  '<li>Ethiopia Guji</li>',
  '',
  '<h2>Opening hours</h2>',
  '<table>',
  '  <tr>',
  '    <td>Day</td>',
  '    <td>Hours</td>',
  '  </tr>',
  '  <tr>',
  '    <td>Weekdays</td>',
  '    <td>7am to 6pm</td>',
  '  </tr>',
  '  <tr>',
  '    <td>Weekends</td>',
  '    <td>8am to 4pm</td>',
  '  </tr>',
  '</table>',
].join('\n');

const T3_SOLUTION = [
  '<h1>This week at Bean and Leaf</h1>',
  '',
  '<h2>Guest beans</h2>',
  '<ul>',
  '  <li>Kenya Nyeri</li>',
  '  <li>Brazil Cerrado</li>',
  '  <li>Ethiopia Guji</li>',
  '</ul>',
  '',
  '<h2>Opening hours</h2>',
  '<table>',
  '  <thead>',
  '    <tr>',
  '      <th>Day</th>',
  '      <th>Hours</th>',
  '    </tr>',
  '  </thead>',
  '  <tr>',
  '    <td>Weekdays</td>',
  '    <td>7am to 6pm</td>',
  '  </tr>',
  '  <tr>',
  '    <td>Weekends</td>',
  '    <td>8am to 4pm</td>',
  '  </tr>',
  '</table>',
].join('\n');

// --- Task 4: build a table from a spec --------------------------------------

const T4_STARTER = [
  '<h2>Drinks</h2>',
  '',
  '<table>',
  '  <!-- a <thead> with one <tr> of three <th> cells: Drink, Size, Price -->',
  '',
  '  <!-- then one <tr> of three <td> cells for each of the three drinks -->',
  '</table>',
].join('\n');

const T4_SOLUTION = [
  '<h2>Drinks</h2>',
  '',
  '<table>',
  '  <thead>',
  '    <tr>',
  '      <th>Drink</th>',
  '      <th>Size</th>',
  '      <th>Price</th>',
  '    </tr>',
  '  </thead>',
  '  <tr>',
  '    <td>Espresso</td>',
  '    <td>Single</td>',
  '    <td>2.20</td>',
  '  </tr>',
  '  <tr>',
  '    <td>Flat white</td>',
  '    <td>Regular</td>',
  '    <td>3.40</td>',
  '  </tr>',
  '  <tr>',
  '    <td>Filter</td>',
  '    <td>Large</td>',
  '    <td>2.80</td>',
  '  </tr>',
  '</table>',
].join('\n');

// --- Task 5: build a labelled form ------------------------------------------

const T5_STARTER = [
  '<h2>Join the cook-along</h2>',
  '',
  '<form>',
  '  <!-- a <label> and a text <input>, joined by for and id -->',
  '',
  '  <!-- a <label> and an email <input>, joined by for and id -->',
  '',
  '  <!-- a <button> to finish with -->',
  '</form>',
].join('\n');

const T5_SOLUTION = [
  '<h2>Join the cook-along</h2>',
  '',
  '<form>',
  '  <p>',
  '    <label for="name">Your name</label>',
  '    <input type="text" id="name" name="name">',
  '  </p>',
  '',
  '  <p>',
  '    <label for="email">Email address</label>',
  '    <input type="email" id="email" name="email">',
  '  </p>',
  '',
  '  <button>Sign me up</button>',
  '</form>',
].join('\n');

// --- Task 6: the mixed one --------------------------------------------------

const T6_STARTER = [
  '<!-- Build the whole block here. Nothing is started for you this time. -->',
].join('\n');

const T6_SOLUTION = [
  '<h2>Weekend workshops</h2>',
  '',
  '<ul>',
  '  <li>Tasting the difference</li>',
  '  <li>Grinding and brewing</li>',
  '  <li>Latte art for beginners</li>',
  '</ul>',
  '',
  '<img src="mountain.jpg" alt="The hillside farm our Ethiopia Guji beans come from">',
  '',
  '<p><a href="https://example.com/workshops">See the full workshop list</a></p>',
].join('\n');

/**
 * The Module 1 Challenge.
 *
 * Same shape as a lesson section (id / title / pages), so `checkSection`
 * validates it and the lesson engine's TaskPage renders its pages. Every page
 * is a task; there is no reading and no quiz.
 */
const wd1Challenge = {
  id: 'wd1-challenge',
  title: 'Module 1 Challenge',
  pages: [
    // --- 1 -------------------------------------------------------------------
    {
      id: 'c1-skeleton',
      type: 'task',
      title: 'Task 1 — Build the page skeleton',
      prompt: [
        'Start with the bones of a page. The file below has the structure tags and three',
        'comments. Replace each comment with the thing it asks for:',
        '',
        '1. A `<title>` in the `<head>`, with the cafe name in it',
        '2. One `<h1>` in the `<body>`, with the cafe name in it',
        '3. Two `<p>` paragraphs under the heading, each with a sentence in it',
        '',
        'The words are yours — the checks only ask that each element is there and is not',
        'empty. Press **Run** when you are done, and watch the mock browser tab above the',
        'preview to see your title appear.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T1_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'title',
          textNonEmpty: true,
          message:
            'The page has a <title> with words in it. It goes inside <head>, and it is what the browser tab above the preview reads.',
        },
        {
          type: 'dom',
          selector: 'h1',
          count: 1,
          textNonEmpty: true,
          message:
            'There is exactly one <h1>, with text between its tags. One <h1> per page: it is the name of the whole page.',
        },
        {
          type: 'dom',
          selector: 'p',
          minCount: 2,
          textNonEmpty: true,
          message:
            'There are at least two <p> paragraphs, each with a sentence in it. An empty <p></p> does not count.',
        },
      ],
      hint: [
        '- The title is a normal element with an opening and closing tag: `<title>…</title>`.',
        '  It belongs between `<head>` and `</head>`, not in the body.',
        '- Everything the visitor reads goes in the body. Delete each comment as you',
        '  replace it, so you can see what is left to do.',
      ].join('\n'),
      solution: { html: T1_SOLUTION },
    },

    // --- 2 -------------------------------------------------------------------
    {
      id: 'c2-fix-text',
      type: 'task',
      title: 'Task 2 — Fix the bugs: headings, images and links',
      prompt: [
        'This page renders, but three things are wrong with it. Find and fix all three.',
        '',
        '1. The section heading jumps from `<h1>` straight to `<h3>`. Heading levels go',
        '   down one at a time, so this one should be the next level down from `<h1>`.',
        '2. The image has no `alt` text, so anyone who cannot see it gets nothing.',
        '   Describe the picture in a few words — not "image" or "photo".',
        '3. The `<a>` has no `href`, so it is not a link at all. Point it at',
        '   `https://example.com/booking`.',
        '',
        'Fix them **in place**. The checks also make sure the heading, the paragraphs and',
        'the picture are still there, so deleting the broken parts will not pass.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T2_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h1',
          text: 'Bean and Leaf Cafe',
          count: 1,
          message:
            'The original <h1> "Bean and Leaf Cafe" is still there, exactly once. Fixing a page means repairing it, not emptying it.',
        },
        {
          type: 'dom',
          selector: 'p',
          minCount: 2,
          textNonEmpty: true,
          message: 'Both of the original paragraphs are still on the page.',
        },
        {
          type: 'dom',
          selector: 'h2',
          text: 'Our Menu',
          count: 1,
          message:
            'Bug 1: "Our Menu" is an <h2>. It sits directly under the <h1>, so it takes the next level down — not <h3>.',
        },
        {
          type: 'dom',
          selector: 'h3',
          count: 0,
          message:
            'Bug 1: there is no <h3> left on the page. Change the tag itself, at both ends — an <h3> closed with </h2> is not valid HTML.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'src',
          attrValue: 'cat.jpg',
          minCount: 1,
          message: 'The picture is still on the page, still loading cat.jpg.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          attrNot: ['image', 'photo', 'picture', 'cat.jpg', 'a cat'],
          minCount: 1,
          message:
            'Bug 2: the <img> has alt text that describes what is in the picture. "image", "photo" and the file name do not describe anything.',
        },
        {
          type: 'dom',
          selector: 'a',
          text: 'Book a table',
          attr: 'href',
          attrValue: 'example.com/booking',
          minCount: 1,
          message:
            'Bug 3: the "Book a table" link has href="https://example.com/booking". Without an href an <a> is just text.',
        },
      ],
      hint: [
        '- Read the page from the top and say the heading levels out loud: h1, then… h3.',
        '  That jump is the first bug.',
        '- `alt` and `href` are both **attributes**: they go inside the opening tag,',
        '  after the tag name, as `name="value"`. Nothing else about either line changes.',
      ].join('\n'),
      solution: { html: T2_SOLUTION },
    },

    // --- 3 -------------------------------------------------------------------
    {
      id: 'c3-fix-lists',
      type: 'task',
      title: 'Task 3 — Fix the bugs: a list and a table',
      prompt: [
        'Two more bugs, both about structure rather than spelling.',
        '',
        '1. The three guest beans are `<li>` items with no list around them. An `<li>` on',
        '   its own means nothing — wrap all three in a `<ul>`.',
        '2. The table\'s first row is its header row, but it is built from `<td>` data',
        '   cells. Turn those two cells into `<th>` header cells, and put that row inside',
        '   a `<thead>`.',
        '',
        'Leave the two data rows (Weekdays and Weekends) exactly as they are — the checks',
        'count them, so deleting a row fails.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T3_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'ul li',
          count: 3,
          textNonEmpty: true,
          message:
            'Bug 1: all three <li> items are inside a <ul>. One <ul> around the whole group, not one each.',
        },
        {
          type: 'dom',
          selector: 'li',
          text: 'Kenya Nyeri',
          minCount: 1,
          message: 'All three beans are still listed, Kenya Nyeri included.',
        },
        {
          type: 'dom',
          selector: 'table thead th',
          count: 2,
          textNonEmpty: true,
          message:
            'Bug 2: the table has a <thead> holding a row of two <th> cells. <th> is what marks a cell as a heading; <thead> is what marks the row as the header row.',
        },
        {
          type: 'dom',
          selector: 'table th',
          text: 'Hours',
          minCount: 1,
          message: 'The header still says Day and Hours — "Hours" is one of the <th> cells.',
        },
        {
          type: 'dom',
          selector: 'table td',
          count: 4,
          textNonEmpty: true,
          message:
            'Both data rows survived: four <td> cells with text in them. If this says a number other than 4, a row was deleted or a header cell is still a <td>.',
        },
      ],
      hint: [
        '- A `<ul>` wraps the whole group. Open it above the first `<li>`, close it below',
        '  the last one, and leave the three items themselves alone.',
        '- For the table, two tags change from `td` to `th` (at both ends), and the `<tr>`',
        '  holding them gets wrapped in `<thead>…</thead>`.',
      ].join('\n'),
      solution: { html: T3_SOLUTION },
    },

    // --- 4 -------------------------------------------------------------------
    {
      id: 'c4-table',
      type: 'task',
      title: 'Task 4 — Build a table from a spec',
      prompt: [
        'Build the drinks table. It needs a header row and three data rows:',
        '',
        '| Drink | Size | Price |',
        '| --- | --- | --- |',
        '| Espresso | Single | 2.20 |',
        '| Flat white | Regular | 3.40 |',
        '| Filter | Large | 2.80 |',
        '',
        'The top row is the header: three `<th>` cells inside a `<tr>`, inside a',
        '`<thead>`. Each of the three drinks is then a `<tr>` of three `<td>` cells.',
        'Nine `<td>` cells in total.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T4_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'table',
          minCount: 1,
          message: 'There is a <table> on the page.',
        },
        {
          type: 'dom',
          selector: 'table thead th',
          count: 3,
          textNonEmpty: true,
          message:
            'The header row is three <th> cells inside a <thead>: Drink, Size and Price.',
        },
        {
          type: 'dom',
          selector: 'table th',
          text: 'Price',
          minCount: 1,
          message: 'One of the header cells says "Price".',
        },
        {
          type: 'dom',
          selector: 'table td',
          count: 9,
          textNonEmpty: true,
          message:
            'There are nine <td> cells with text in them — three rows of three. Header cells are <th> and are not counted here.',
        },
        {
          type: 'dom',
          selector: 'table td',
          text: 'Flat white',
          minCount: 1,
          message: 'The Flat white row made it in, spelled as it is in the table above.',
        },
      ],
      hint: [
        '- A table is rows first, cells second: `<tr>` holds the row, and the `<th>` or',
        '  `<td>` cells go inside it. Three cells in a row means three tags inside one `<tr>`.',
        '- Write the header row and press **Run** before you write the rest. A half-built',
        '  table still renders, so you can see it growing.',
      ].join('\n'),
      solution: { html: T4_SOLUTION },
    },

    // --- 5 -------------------------------------------------------------------
    {
      id: 'c5-form',
      type: 'task',
      title: 'Task 5 — Build a labelled form',
      prompt: [
        'Fill in the form. It needs:',
        '',
        '1. A `<label>` reading **Your name**, and a text `<input>` joined to it',
        '2. A `<label>` reading **Email address**, and an `<input type="email">` joined to it',
        '3. A `<button>` with words on it',
        '',
        'Joining a label to its input is the part that matters: give the input an `id`,',
        'and give the label a `for` with the **same** value. Two inputs means two',
        'different ids.',
        '',
        'Press **Run**, then click the words "Your name" in the preview. If the cursor',
        'lands in the box, they are joined.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T5_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'form label',
          count: 2,
          textNonEmpty: true,
          attr: 'for',
          attrNonEmpty: true,
          message:
            'There are two <label> elements inside the form, each with words between its tags and a for attribute.',
        },
        {
          type: 'dom',
          selector: 'form input',
          count: 2,
          attr: 'id',
          attrNonEmpty: true,
          message: 'There are two <input> elements inside the form, each with an id.',
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
          type: 'dom',
          selector: 'form input',
          attr: 'type',
          attrValue: 'email',
          minCount: 1,
          message: 'One of the inputs is type="email".',
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
        '  `<input type="text" id="name">`. The word in both quotes is the same word.',
        '- Nothing is sent anywhere when you press the button. The sandbox catches the',
        '  submit and prints a note in the Terminal instead.',
      ].join('\n'),
      solution: { html: T5_SOLUTION },
    },

    // --- 6 -------------------------------------------------------------------
    {
      id: 'c6-mixed',
      type: 'task',
      title: 'Task 6 — Put it all together',
      prompt: [
        'Last one, and this time the editor is empty. Build a "Weekend workshops" block',
        'containing all four of these:',
        '',
        '1. An `<h2>` heading with words in it',
        '2. A `<ul>` of exactly three `<li>` workshops',
        '3. An `<img>` loading `mountain.jpg`, with real `alt` text',
        '4. An `<a>` link with text and an `href`',
        '',
        'Order is up to you. `mountain.jpg` is one of the sample pictures the sandbox',
        'knows about, so it will actually appear in the preview.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: T6_STARTER },
      checks: [
        {
          type: 'dom',
          selector: 'h2',
          minCount: 1,
          textNonEmpty: true,
          message: 'There is an <h2> heading with text in it.',
        },
        {
          type: 'dom',
          selector: 'ul li',
          count: 3,
          textNonEmpty: true,
          message: 'There is a <ul> holding exactly three <li> items, each with text.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'src',
          attrValue: 'mountain.jpg',
          minCount: 1,
          message:
            'There is an <img> with src="mountain.jpg". Any other file name shows a broken picture, because the sandbox only knows a handful of names.',
        },
        {
          type: 'dom',
          selector: 'img',
          attr: 'alt',
          attrNonEmpty: true,
          attrNot: ['image', 'photo', 'picture', 'mountain.jpg', 'mountain'],
          minCount: 1,
          message:
            'The image has alt text describing what is in it, not the file name and not the word "image".',
        },
        {
          type: 'dom',
          selector: 'a',
          attr: 'href',
          attrNonEmpty: true,
          textNonEmpty: true,
          minCount: 1,
          message:
            'There is an <a> with both an href and words between its tags. A link with no text is invisible to click on.',
        },
      ],
      hint: [
        '- Build it one piece at a time and press **Run** after each. Four small',
        '  successes are much easier to debug than one big paste.',
        '- Everything here appeared in Tasks 1-5. If a piece will not pass, open the task',
        '  it came from and look at what you wrote there.',
      ].join('\n'),
      solution: { html: T6_SOLUTION },
    },
  ],
};

export default wd1Challenge;
