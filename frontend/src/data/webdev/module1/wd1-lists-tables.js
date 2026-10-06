// Module 1, Section 4 — Lists & Tables.
//
// Authoring notes for whoever edits this next:
//  - Prerequisites, all taught already: elements vs tags, void elements, the
//    page skeleton, attributes, nesting, comments (Section 2); headings,
//    paragraphs, emphasis, links, images (Section 3). CSS is NOT taught yet —
//    the only CSS in this section is the bonus task on page 8, which hands the
//    student the whole rule and explains it line by line.
//  - Page 8 is a BONUS and deliberately not required. The section therefore
//    ends on an optional page: LessonPager gates "Complete & Continue" on
//    `required` pages only (pages 6 and 7 here), so a student can reach page 8,
//    skip it, and still finish. Don't mark it required without re-reading that.
//  - Page 8 shows only the css tab. CodeRunner renders whichever tabs it is
//    given but always RUNS every file it holds, so the html in `starter` still
//    draws the table. Both `starter` and `solution` carry the html for that
//    reason — the solution runner would otherwise preview a styled nothing.
//  - Table checks use DESCENDANT selectors ("table tr"), never the child
//    combinator. The parser inserts a <tbody> that nobody wrote, so "table > tr"
//    matches zero rows on perfectly correct markup.
//  - List checks DO use the child combinator ("ul > li"), which is correct and
//    intended: it counts the items of that list and not the items of a list
//    nested inside it.
//  - Pages 1 and 4 deliberately show INVALID markup that still renders. The
//    prose says plainly that it is invalid and describes the mechanism (the
//    parser leaves it where you put it; the marker belongs to <li>), and the
//    captions send the student to look at the result rather than asserting
//    pixel-level detail that varies between browsers.

/** The two lists page 3 asks for. */
const TASK3_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Cheese on Toast</title>',
  '  </head>',
  '  <body>',
  '    <h1>Cheese on Toast</h1>',
  '',
  '    <h2>Shopping list</h2>',
  '    <!-- An unordered list goes here: bread, cheese, butter.',
  '         Order does not matter, so <ul>. Three <li> items, minimum. -->',
  '',
  '    <h2>Method</h2>',
  '    <!-- An ordered list goes here: toast one side, add cheese, grill again.',
  '         Order matters, so <ol>. Three <li> items, minimum. -->',
  '  </body>',
  '</html>',
].join('\n');

const TASK3_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Cheese on Toast</title>',
  '  </head>',
  '  <body>',
  '    <h1>Cheese on Toast</h1>',
  '',
  '    <h2>Shopping list</h2>',
  '    <ul>',
  '      <li>Bread</li>',
  '      <li>Cheese</li>',
  '      <li>Butter</li>',
  '    </ul>',
  '',
  '    <h2>Method</h2>',
  '    <ol>',
  '      <li>Toast the bread on one side.</li>',
  '      <li>Put the cheese on the untoasted side.</li>',
  '      <li>Grill it again until it bubbles.</li>',
  '    </ol>',
  '  </body>',
  '</html>',
].join('\n');

/** The table page 6 asks for, and page 8 then styles. */
const TASK6_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Cooking times</title>',
  '  </head>',
  '  <body>',
  '    <h1>Cooking times</h1>',
  '',
  '    <table>',
  '      <!-- 1. A header row: <tr> with three <th> cells. -->',
  '',
  '      <!-- 2. Two data rows: each a <tr> with three <td> cells. -->',
  '    </table>',
  '  </body>',
  '</html>',
].join('\n');

const TASK6_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Cooking times</title>',
  '  </head>',
  '  <body>',
  '    <h1>Cooking times</h1>',
  '',
  '    <table>',
  '      <tr>',
  '        <th>Dish</th>',
  '        <th>Time</th>',
  '        <th>Heat</th>',
  '      </tr>',
  '      <tr>',
  '        <td>Cheese on toast</td>',
  '        <td>5 minutes</td>',
  '        <td>Hot grill</td>',
  '      </tr>',
  '      <tr>',
  '        <td>Roast potatoes</td>',
  '        <td>45 minutes</td>',
  '        <td>200 degrees</td>',
  '      </tr>',
  '    </table>',
  '  </body>',
  '</html>',
].join('\n');

/** The colour page 8 checks for. Stated in the prompt, the hint and the check. */
const HEADER_COLOUR = '#dff0d8';

const TASK8_STARTER_CSS = [
  '/* One rule, on the line below.',
  '   Select every th, then set its background-color to ' + HEADER_COLOUR + ' */',
  '',
].join('\n');

const TASK8_SOLUTION_CSS = [
  'th {',
  '  background-color: ' + HEADER_COLOUR + ';',
  '}',
].join('\n');

const section = {
  id: 'wd1-lists-tables',
  title: 'Lists & Tables',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-unordered-lists',
      type: 'content',
      title: 'Lists: when the order does not matter',
      blocks: [
        {
          type: 'text',
          md: [
            'A shopping list is not a paragraph. Writing it as one — "bread, cheese,',
            'butter, milk" — loses the thing that makes it a list: each entry is its own',
            'separate item.',
            '',
            'HTML has two elements for this, and they always come as a pair:',
            '',
            '- `<ul>` — the **unordered list**. The container, the whole list.',
            '- `<li>` — a **list item**. One entry inside it.',
            '',
            '"Unordered" means the order carries no meaning. Bread before cheese says',
            'nothing; you could shuffle the lines and the list would mean exactly the same',
            'thing. That is the test for `<ul>`.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A shopping list',
          tabs: ['html'],
          files: {
            html: [
              '<h2>Shopping list</h2>',
              '',
              '<ul>',
              '  <li>Bread</li>',
              '  <li>Cheese</li>',
              '  <li>Butter</li>',
              '</ul>',
            ].join('\n'),
          },
          caption:
            'Two things arrived without you asking for them: a round bullet in front of each item, and an indent for the whole list. Both come from the browser\'s own built-in styling, and both can be changed with CSS later. Try adding a fourth <li> and running it again — the bullet comes with it automatically.',
        },
        {
          type: 'text',
          md: [
            '### The shape never changes',
            '',
            'One `<ul>` wraps the whole list. Inside it, one `<li>` per item, each opened',
            'and closed. That is the entire pattern:',
            '',
            '```html',
            '<ul>',
            '  <li>One item</li>',
            '  <li>Another item</li>',
            '</ul>',
            '```',
            '',
            'The indentation is for you, not the browser — but with lists it earns its keep',
            'more than anywhere else so far, because a list with a missing `</li>` is very',
            'hard to spot in a wall of left-aligned tags.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            '**Everything inside a `<ul>` belongs in an `<li>`.** This is the rule people',
            'break first:',
            '',
            '```html',
            '<ul>',
            '  Don\'t do this.',
            '  <li>Bread</li>',
            '</ul>',
            '```',
            '',
            'Run that and you will see the loose text appear above the bullet — it is not',
            'thrown away, and there is no error message. The browser keeps text where you',
            'put it, and the bullet does not come with it, because the bullet belongs to',
            '`<li>` rather than to the list.',
            '',
            'It still renders, and it is still **invalid HTML**: the rules for `<ul>` say',
            'its children are `<li>` elements. Those two facts sit together uncomfortably',
            'and you should get used to it now — "it looked fine" is not evidence that the',
            'markup is right. Anything that reads your page as *structure* rather than as',
            'pixels sees a list with a stray fragment in it.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Invalid, and still on screen',
          tabs: ['html'],
          files: {
            html: [
              '<ul>',
              '  This line is not in an li.',
              '  <li>This one is.</li>',
              '</ul>',
              '',
              '<li>And this li is not inside any list at all.</li>',
            ].join('\n'),
          },
          caption:
            'Look carefully at three things: the loose line has no bullet, the proper item does, and the stray <li> at the bottom still draws its own marker because an <li> carries its marker itself. Nothing warned you about any of it. This is the example to come back to the first time a list "looks wrong for no reason".',
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** Take the shopping list from the first example',
            'and delete one `</li>` — just the closing tag of the middle item. Run it, and',
            'see whether you can tell from the preview alone which item lost its tag.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-ordered-lists',
      type: 'content',
      title: 'Lists: when the order is the point',
      blocks: [
        {
          type: 'text',
          md: [
            'Now the other one. `<ol>` is the **ordered list**, and it is identical to',
            '`<ul>` in every way except one: the browser numbers the items instead of',
            'bulleting them.',
            '',
            'The items are still `<li>`. You do not write the numbers — that is the whole',
            'point of using `<ol>`. The browser counts.',
            '',
            '```html',
            '<ol>',
            '  <li>Toast the bread on one side.</li>',
            '  <li>Put the cheese on the untoasted side.</li>',
            '</ol>',
            '```',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### Choosing between them',
            '',
            'Forget the bullets and the numbers for a second and ask one question:',
            '**would shuffling these lines change what the list means?**',
            '',
            '- *Bread, cheese, butter.* Shuffled, it means the same. → `<ul>`',
            '- *Toast the bread, add cheese, grill it.* Shuffled, it is a different recipe',
            '  and a worse lunch. → `<ol>`',
            '',
            'Steps, rankings, instructions, anything counted down or counted off: `<ol>`.',
            'Ingredients, features, links, tags, names: `<ul>`.',
            '',
            'And do not choose based on the look. If you want numbered-looking items in a',
            'list where order does not matter, that is a CSS decision, not an HTML one —',
            'exactly like picking a heading level for its size two sections ago.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Both lists, same page',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Cheese on Toast</h1>',
              '',
              '<h2>Shopping list</h2>',
              '<ul>',
              '  <li>Bread</li>',
              '  <li>Cheese</li>',
              '  <li>Butter</li>',
              '</ul>',
              '',
              '<h2>Method</h2>',
              '<ol>',
              '  <li>Toast the bread on one side.</li>',
              '  <li>Put the cheese on the untoasted side.</li>',
              '  <li>Grill it again until it bubbles.</li>',
              '</ol>',
            ].join('\n'),
          },
          caption:
            'The two lists are written almost identically — the only difference in the code is ul versus ol — and the preview tells you instantly which one you are allowed to shuffle. Swap the <ol> tags for <ul> tags and run it: the recipe still works as a page, but the page has stopped saying that step 1 comes first.',
        },
        {
          type: 'tip',
          md: [
            'Both lists take exactly the same items, which means switching between them is',
            'a two-word edit: change the opening `<ul>` to `<ol>` and the closing `</ul>`',
            'to `</ol>`. Nothing inside needs touching.',
            '',
            'That is worth knowing because the choice is not always obvious first time, and',
            'changing your mind costs you nothing.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example above, add a fourth step to',
            'the method — `Eat it before it goes cold.` — and run it. You did not type a',
            '"4" anywhere, and the browser numbered it anyway. Now drag that new `<li>` to',
            'the top of the list and run it again: the numbers rearrange themselves. That',
            'self-renumbering is the real reason `<ol>` exists.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-task-lists',
      type: 'task',
      title: 'Write two lists',
      prompt: [
        'The page below has two headings and two comments where the lists should be.',
        'Write both lists, and delete the comments as you go.',
        '',
        '1. Under **Shopping list**, a `<ul>` with **at least three** `<li>` items —',
        '   bread, cheese and butter will do.',
        '2. Under **Method**, an `<ol>` with **at least three** `<li>` items — toast one',
        '   side, add the cheese, grill it again.',
        '',
        'Every item must have some text in it: an empty `<li></li>` counts as a missing',
        'item, not a blank one. The exact wording is yours; the counts and the choice of',
        '`ul` versus `ol` are not.',
        '',
        'Press **Run** when both lists are there.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK3_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'ul > li',
          minCount: 3,
          message:
            'The unordered list needs at least three <li> items directly inside it. Check that you have one <ul> wrapping the whole list, and one <li>...</li> pair per item inside it.',
        },
        {
          type: 'dom',
          selector: 'ol > li',
          minCount: 3,
          message:
            'The ordered list needs at least three <li> items directly inside it. The method is a sequence, so its container is <ol> — the items are still <li>, exactly as in the shopping list.',
        },
        {
          type: 'dom',
          selector: 'ul > li, ol > li',
          textNonEmpty: true,
          minCount: 6,
          message:
            'Six list items between the two lists, and every one of them needs text. An <li></li> with nothing between the tags draws a bullet and says nothing — put the words inside the tags, not after them.',
        },
      ],
      hint: [
        'Build the container first, then fill it. For the shopping list:',
        '',
        '```html',
        '<ul>',
        '</ul>',
        '```',
        '',
        'Then put the items inside, one line each:',
        '',
        '```html',
        '<ul>',
        '  <li>Bread</li>',
        '</ul>',
        '```',
        '',
        'and repeat that middle line until you have three.',
        '',
        'The method list is the same work with two letters changed — `<ol>` and `</ol>`',
        'instead of `<ul>` and `</ul>`. The `<li>` items do not change at all.',
      ].join('\n'),
      solution: { html: TASK3_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-nested-lists',
      type: 'content',
      title: 'Lists inside lists',
      blocks: [
        {
          type: 'text',
          md: [
            'A shopping list that has grown too long wants splitting up by aisle. The way',
            'to do that is to put a list **inside an item of another list**.',
            '',
            'And that phrase is the whole lesson: inside an *item*. A nested list goes',
            'inside an `<li>`, never straight inside the `<ul>`.',
            '',
            '```html',
            '<ul>',
            '  <li>Bakery',
            '    <ul>',
            '      <li>Bread</li>',
            '    </ul>',
            '  </li>',
            '</ul>',
            '```',
            '',
            'Read the nesting out loud and it makes sense: the outer list has an item',
            'called Bakery, and that item contains a list of its own. "Bread" is part of',
            '"Bakery" — which is exactly what you meant.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Notice where the `</li>` went. The item does not close after the word Bakery;',
            'it closes *after the inner list*, because the inner list is part of that item.',
            'This is the nesting rule from Section 2 — an element that opens inside another',
            'must close inside it too — applied to something with three levels.',
            '',
            'The indentation is doing real work here. Line up your closing tags with their',
            'openers and a mistake becomes visible; leave everything flat against the left',
            'margin and it does not.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A list with sub-lists',
          tabs: ['html'],
          files: {
            html: [
              '<h2>Shopping list</h2>',
              '',
              '<ul>',
              '  <li>Bakery',
              '    <ul>',
              '      <li>Bread</li>',
              '      <li>Rolls</li>',
              '    </ul>',
              '  </li>',
              '  <li>Dairy',
              '    <ul>',
              '      <li>Cheese</li>',
              '      <li>Butter</li>',
              '    </ul>',
              '  </li>',
              '  <li>Just one thing from frozen</li>',
              '</ul>',
            ].join('\n'),
          },
          caption:
            'The inner lists are indented further in and their bullets are a different shape — a hollow circle rather than a filled disc. Nobody asked for that; browsers change the marker as the nesting gets deeper, so the structure reads at a glance. Try adding a third level inside one of the sub-lists and see what the marker does.',
        },
        {
          type: 'warning',
          md: [
            'Here is the version that looks right and is not:',
            '',
            '```html',
            '<ul>',
            '  <li>Bakery</li>',
            '  <ul>',
            '    <li>Bread</li>',
            '  </ul>',
            '</ul>',
            '```',
            '',
            'The inner `<ul>` is a child of the outer `<ul>` instead of a child of the',
            '`<li>`. Run it and the page looks more or less the same: the browser keeps the',
            'list where you put it and indents it, because a nested list indents wherever',
            'it sits.',
            '',
            'It is still **invalid HTML** — a `<ul>` may only contain `<li>` elements — and',
            'the meaning you have written down is wrong. You meant "Bread is part of',
            'Bakery". What you wrote is "Bakery, and separately, here is another list".',
            'Nothing on screen will ever tell you the difference. The `</li>` moving to',
            'after the inner list is the entire fix.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'The wrong one and the right one, together',
          tabs: ['html'],
          files: {
            html: [
              '<h3>Invalid: the sub-list is a child of the ul</h3>',
              '<ul>',
              '  <li>Bakery</li>',
              '  <ul>',
              '    <li>Bread</li>',
              '  </ul>',
              '</ul>',
              '',
              '<h3>Valid: the sub-list is inside the li</h3>',
              '<ul>',
              '  <li>Bakery',
              '    <ul>',
              '      <li>Bread</li>',
              '    </ul>',
              '  </li>',
              '</ul>',
            ].join('\n'),
          },
          caption:
            'Compare the two previews closely. They are near enough identical, which is the point being made — the difference is invisible on screen and obvious in the code. When you cannot tell two versions apart by looking, the code is the only place the truth lives.',
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the valid list, move the `</li>` so that it',
            'sits immediately after the word `Bakery` instead of after the inner list. Run',
            'it. Then put it back. You have just written both versions yourself, which is',
            'the fastest way to stop mixing them up.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-tables',
      type: 'content',
      title: 'Tables: rows, then cells',
      blocks: [
        {
          type: 'text',
          md: [
            'A list is one column of things. When each thing has several *facts* about it —',
            'a dish, how long it takes, how hot the oven needs to be — you want a table.',
            '',
            'Tables are built out of four elements, and they are always written in this',
            'order: the table, then a row, then the cells in that row.',
            '',
            '- `<table>` — the whole table.',
            '- `<tr>` — a **table row**. One horizontal line of the table.',
            '- `<th>` — a **header cell**. The label at the top of a column.',
            '- `<td>` — a **table data** cell. An ordinary cell.',
            '',
            'The thing that surprises everyone: **you never write columns.** There is no',
            '`<column>` element. You write rows, each row holds the same number of cells,',
            'and the columns appear because the cells line up.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A three-column table',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Cooking times</h1>',
              '',
              '<table>',
              '  <tr>',
              '    <th>Dish</th>',
              '    <th>Time</th>',
              '    <th>Heat</th>',
              '  </tr>',
              '  <tr>',
              '    <td>Cheese on toast</td>',
              '    <td>5 minutes</td>',
              '    <td>Hot grill</td>',
              '  </tr>',
              '  <tr>',
              '    <td>Roast potatoes</td>',
              '    <td>45 minutes</td>',
              '    <td>200 degrees</td>',
              '  </tr>',
              '</table>',
            ].join('\n'),
          },
          caption:
            'Three rows of three cells, and three columns appeared. Look at the top row: those <th> cells come out bold and centred, while the <td> cells below are neither — that is the browser\'s own styling telling you which cells are labels. Now delete one <td> from the last row and run it again: the row ends early and the table goes lopsided, because nothing is holding that column open except the cells in it.',
        },
        {
          type: 'text',
          md: [
            '### th or td?',
            '',
            '`<th>` is for a cell that **labels** other cells — the top of a column, or',
            'sometimes the start of a row. `<td>` is for the data itself.',
            '',
            'The bold, centred look is a hint, not the reason. The reason is the same one',
            'as `<strong>` versus `<b>` last section: `<th>` records *what the cell is for*.',
            'A cell that says "Dish" at the top of a column of dishes is a label, and',
            'writing it as `<th>` is how you say so.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '**Tables have no borders.** Run the example again and look: the cells line up',
            'in columns, and there is not a single line drawn anywhere.',
            '',
            'Everybody expects a grid, because spreadsheets have one. HTML tables do not,',
            'and borders are a CSS job — one rule, which the bonus task at the end of this',
            'section hands you. Until then, a table that looks like plain text in neat',
            'columns is a table that is working perfectly.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '**Tables are for data, not for layout.** In the 1990s, before CSS could',
            'position anything, people built entire page layouts out of invisible tables —',
            'a sidebar was a cell, a banner was a cell.',
            '',
            'Do not do this. You will still find it in old tutorials, and you may still',
            'find it in the wild. A table says "this is a grid of related facts"; using one',
            'to push a sidebar to the left says something about your data that is simply',
            'not true, and it makes the page far harder to rearrange later. Use a table',
            'when you would have drawn a table on paper.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** Add a fourth row to the example — any dish,',
            'any time, any heat — and run it. Then delete the `<th>` row entirely and run',
            'it again: the table still works, and it has stopped telling you what any of',
            'the columns mean.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-task-table',
      type: 'task',
      title: 'Build a table',
      required: true,
      prompt: [
        'The page has an empty `<table>` and two comments. Fill it in, deleting the',
        'comments as you go. You need **three rows in total**:',
        '',
        '1. A header row: one `<tr>` containing **three** `<th>` cells — **Dish**, **Time**',
        '   and **Heat**.',
        '2. Two data rows: each one a `<tr>` containing **three** `<td>` cells. For',
        '   example *Cheese on toast / 5 minutes / Hot grill*, and *Roast potatoes /',
        '   45 minutes / 200 degrees*.',
        '',
        'That is 3 `<th>` cells and 6 `<td>` cells, and **every cell needs text in it** —',
        'an empty `<td></td>` is a missing cell, not a blank one. The wording inside the',
        'cells is up to you.',
        '',
        'Remember there is nothing to write for the columns. Three cells per row is what',
        'makes three columns. Press **Run** when the table is full.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK6_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'table tr',
          minCount: 3,
          message:
            'The table needs three rows: one header row and two data rows. Each row is its own <tr>...</tr> pair inside the <table> — cells cannot sit in the table on their own.',
        },
        {
          type: 'dom',
          selector: 'table th',
          minCount: 3,
          message:
            'The header row needs three <th> cells — Dish, Time and Heat. <th> is the header cell; if you have used <td> for the labels, swap those three over.',
        },
        {
          type: 'dom',
          selector: 'table td',
          minCount: 6,
          message:
            'The two data rows need three <td> cells each, which is six in total. Count the cells in each row: a row with only two <td> cells leaves a hole in the table.',
        },
        {
          type: 'dom',
          selector: 'table th, table td',
          textNonEmpty: true,
          minCount: 9,
          message:
            'All nine cells need text in them. An empty <td></td> still draws a cell, so the table can look complete while a column is actually blank — check each row has words between every pair of cell tags.',
        },
      ],
      hint: [
        'Build one row at a time, and run it after each one.',
        '',
        'The header row first:',
        '',
        '```html',
        '<tr>',
        '  <th>Dish</th>',
        '  <th>Time</th>',
        '  <th>Heat</th>',
        '</tr>',
        '```',
        '',
        'Run that and you should see three bold labels. Now a data row is that same',
        'shape with `td` instead of `th`:',
        '',
        '```html',
        '<tr>',
        '  <td>Cheese on toast</td>',
        '  <td>5 minutes</td>',
        '  <td>Hot grill</td>',
        '</tr>',
        '```',
        '',
        'Copy that row, change the words, and you have all three rows. Every `<tr>` gets',
        'exactly three cells — if a row looks short in the preview, count its cells.',
      ].join('\n'),
      solution: { html: TASK6_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-quiz-lists-tables',
      type: 'quiz',
      title: 'Knowledge check: lists and tables',
      required: true,
      questions: [
        {
          q: 'You are listing the ingredients for a recipe. Which list do you use?',
          options: [
            '<ol>, because a recipe is a sequence.',
            '<ul>, because the order of the ingredients carries no meaning.',
            'Either — the only difference is bullets or numbers.',
            '<ul> for short lists and <ol> for long ones.',
          ],
          answerIndex: 1,
          explanation:
            'Shuffling the ingredients changes nothing, so the list is unordered. The trap is thinking "recipe, therefore ordered" — the *method* is an ordered list, the ingredients above it are not. And "either" is the answer to rule out: bullets versus numbers is what you see, but ul versus ol is what you have said about the content.',
        },
        {
          q: 'Which of these is allowed directly inside a `<ul>`?',
          options: [
            'Any element, as long as it is closed properly.',
            'Plain text, as long as it is short.',
            'Only <li> elements.',
            'Only <li> and <ul> elements.',
          ],
          answerIndex: 2,
          explanation:
            'A `<ul>` contains list items and nothing else. The last option is the popular wrong answer, because nested lists are so common — but a nested `<ul>` goes inside an `<li>`, not beside it. Put one straight inside the `<ul>` and the page still renders, which is exactly why this one catches people.',
        },
        {
          q: 'What is the difference between `<th>` and `<td>`?',
          options: [
            '<th> is bold and centred; <td> is not.',
            '<th> labels a row or column; <td> holds the data itself.',
            '<th> can only be used in the first row of a table.',
            '<th> is the older element and <td> replaced it.',
          ],
          answerIndex: 1,
          explanation:
            'The bold and centred look is real, but it is the *result*, not the difference — and CSS can undo it in one line, at which point the first answer stops being true and the cell is still a header. `<th>` says the cell is a label. It is also not restricted to the first row: a label at the start of a row is a `<th>` too.',
        },
        {
          q: 'You want a sub-list under the item "Bakery". Where does the inner `<ul>` go?',
          options: [
            'Inside the <li> for Bakery, before its closing </li>.',
            'Directly inside the outer <ul>, after the Bakery item closes.',
            'After the outer </ul>, as a separate list.',
            'Anywhere — the indentation is what creates the nesting.',
          ],
          answerIndex: 0,
          explanation:
            'The sub-list is part of that item, so it lives inside that item — and the `</li>` therefore closes after the inner list, not after the word "Bakery". Option two is the version that renders almost identically and is invalid; option four is worth killing outright, because indentation is for human readers and the browser ignores it completely.',
        },
        {
          q: 'Why should you not use a table to lay out a page?',
          options: [
            'Tables are slow to draw and would make the page load badly.',
            'Tables cannot be styled with CSS.',
            'A table says its contents are a grid of related data, which a page layout is not.',
            'Tables only work in older browsers.',
          ],
          answerIndex: 2,
          explanation:
            'It is a question of meaning: using a table for layout writes down something untrue about your content, and it makes the page far harder to rearrange later. The other three are myths worth discarding — tables are perfectly fast, perfectly styleable, and perfectly modern. They are just for data.',
        },
      ],
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-task-style-table',
      type: 'task',
      title: 'Bonus: give the table a coloured header',
      prompt: [
        'This one is optional. You have already finished the section — the button at the',
        'bottom will take you on whether you do this or not.',
        '',
        'It is also your first taste of CSS, which is the whole of the next section. The',
        'HTML is finished and locked; only the **style.css** tab is yours. Here is the',
        'entire rule you need:',
        '',
        '```css',
        'th {',
        '  background-color: ' + HEADER_COLOUR + ';',
        '}',
        '```',
        '',
        'Read it as a sentence: *find every `th` on the page, and set its background',
        'colour to this*. The part before the curly brace picks the elements; the part',
        'inside says what to change about them.',
        '',
        'Type it into the CSS tab and press **Run**. The check is looking for exactly',
        '`' + HEADER_COLOUR + '` — any colour would work on a real page, but the check has',
        'to know which one to expect.',
      ].join('\n'),
      tabs: ['css'],
      starter: { html: TASK6_SOLUTION_HTML, css: TASK8_STARTER_CSS },
      checks: [
        {
          type: 'style',
          selector: 'th',
          prop: 'background-color',
          value: HEADER_COLOUR,
          message:
            'The header cells are not ' + HEADER_COLOUR + ' yet. Check three things in the CSS tab: the selector is th with no angle brackets, the property is background-color (with the hyphen), and the line ends in a semicolon inside the curly braces.',
        },
      ],
      hint: [
        'The rule has four parts, and all four have to be there:',
        '',
        '```css',
        'th {',
        '  background-color: ' + HEADER_COLOUR + ';',
        '}',
        '```',
        '',
        '1. `th` — which elements to change. Just the name, no `<` or `>`.',
        '2. `{` and `}` — the pair of curly braces holding the changes.',
        '3. `background-color:` — what to change. One word, with a hyphen in it.',
        '4. `' + HEADER_COLOUR + ';` — the new value, ended with a semicolon.',
        '',
        'If nothing happens when you run it, the usual culprit is a missing `}` or a',
        'missing `;`. CSS is as quiet about mistakes as HTML is.',
      ].join('\n'),
      solution: { html: TASK6_SOLUTION_HTML, css: TASK8_SOLUTION_CSS },
    },
  ],
};

export default section;
