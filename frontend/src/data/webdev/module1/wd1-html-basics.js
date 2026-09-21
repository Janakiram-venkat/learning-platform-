// Module 1, Section 2 — HTML Basics.
//
// Authoring notes for whoever edits this next:
//  - This is the section that introduces <!DOCTYPE>, <html>, <head> and <body>.
//    Section 1 deliberately avoids them, so nothing here may assume they were
//    already met. Everything after this section may.
//  - Pages 3 and 6 build ONE page together: page 6's starter IS page 3's
//    solution. Change one and change the other, or the story breaks.
//  - Page 8's broken snippet is deliberately NOT that page. Fixing a page the
//    student just built correctly reads as punishment; the prompt says so.
//  - Two things here cannot be checked, by design:
//      * <!DOCTYPE html> — buildSrcDoc strips the student's doctype and supplies
//        its own, so no check can see it. It is taught and explained, not graded.
//      * A literal <body> tag — the parser invents one when it is missing, so a
//        student who omits it still passes the content checks. Also taught only.
//    Don't add checks for either; they would pass or fail for the wrong reasons.
//  - `text` and `attrValue` matching is case-insensitive, whitespace-collapsed,
//    and a *substring* test (see lib/webdev/sandbox.js), so authored expectations
//    can be written naturally.
//  - CSS and JS stay out of this section. It is HTML only, and every task is
//    a single `html` tab.

/** The skeleton, written out once and reused wherever it is shown or checked. */
const SKELETON = [
  '<!DOCTYPE html>',
  '<html>',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1>Kitchen Notes</h1>',
  '    <p>Three things I can actually cook.</p>',
  '  </body>',
  '</html>',
].join('\n');

/** Page 3's answer, which becomes page 6's starting point. */
const TASK3_SOLUTION_HTML = SKELETON;

/** Page 6's answer — the same page, now labelled with attributes. */
const TASK6_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Kitchen Notes</title>',
  '  </head>',
  '  <body>',
  '    <h1 id="page-title">Kitchen Notes</h1>',
  '    <p>Three things I can actually cook.</p>',
  '  </body>',
  '</html>',
].join('\n');

/** Page 8's broken snippet, and the version the checks are looking for. */
const TASK8_STARTER_HTML = [
  '<!-- Two things are wrong below. The page still draws, which is the point: -->',
  '<!-- broken HTML rarely announces itself. -->',
  '',
  '<div id="notes">',
  '  <h1>Kitchen Notes<h1>',
  '  <p>Three things I can actually cook.</p>',
  '</div>',
  '',
  '<p>Everything else is toast.</p>',
].join('\n');

const TASK8_SOLUTION_HTML = [
  '<div id="notes">',
  '  <h1>Kitchen Notes</h1>',
  '  <p>Three things I can actually cook.</p>',
  '  <p>Everything else is toast.</p>',
  '</div>',
].join('\n');

const section = {
  id: 'wd1-html-basics',
  title: 'HTML Basics',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-anatomy',
      type: 'content',
      title: 'What an element really is',
      blocks: [
        {
          type: 'text',
          md: [
            'Last section you wrote `<h1>My First Page</h1>` by copying its shape. It',
            'worked, but you were pattern-matching. Time to know what you were actually',
            'writing.',
            '',
            'That line has three parts:',
            '',
            '- `<h1>` — the **opening tag**. It says "a heading starts here."',
            '- `My First Page` — the **content**. The part a visitor reads.',
            '- `</h1>` — the **closing tag**. Same word, with a slash. It says "the heading ends here."',
            '',
            'All three together are one **element**. That distinction is worth holding on',
            'to: a *tag* is one of the pointy-bracket labels, and an *element* is the',
            'whole package — both tags and everything between them. People use the two',
            'words loosely in conversation, but when something breaks, knowing the',
            'difference is what lets you see what broke.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'One element, three parts',
          tabs: ['html'],
          files: {
            html: [
              '<h1>This whole line is one element</h1>',
              '',
              '<p>So is this one. Two tags, some content, one element.</p>',
            ].join('\n'),
          },
          caption:
            'Try deleting just the slash from one of the closing tags and pressing Run. Nothing turns red and no message appears — the page simply goes strange. That silence is what makes the slash worth checking first.',
        },
        {
          type: 'text',
          md: [
            '### The ones that come alone',
            '',
            'Most elements come in pairs, because most elements *contain* something. But a',
            'few have nothing to contain, so there is nothing for a closing tag to close.',
            'These are called **void elements**, and you write them as a single tag:',
            '',
            '- `<hr>` draws a horizontal line across the page — a divider.',
            '- `<br>` forces a line break in the middle of text.',
            '',
            'There is no `</hr>` and no `</br>`. Writing one is not a disaster; the browser',
            'just ignores it. But it tells anyone reading your code that you have not',
            'quite got the rule yet.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Elements that stand alone',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Before</h1>',
              '',
              '<hr>',
              '',
              '<p>After the line.<br>This sentence was pushed onto its own row by a br.</p>',
            ].join('\n'),
          },
          caption:
            'Remove the <br> and press Run: the two sentences join into one flowing line. HTML ignores the line breaks you type in the editor, so a break on screen has to be asked for.',
        },
        {
          type: 'tip',
          md: [
            'That last point catches everyone once. Pressing Enter in your HTML does',
            '**not** put a line break on the page. The browser treats any run of spaces,',
            'tabs and newlines as a single space. Your indentation is for humans reading',
            'the code; the browser is unmoved by it.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'So far every example you have seen has been a loose handful of elements. Real',
            'webpages are not loose. They are wrapped in a structure, and every single one',
            'on the internet has the same one.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-skeleton',
      type: 'content',
      title: 'Every page has the same skeleton',
      blocks: [
        {
          type: 'text',
          md: [
            'The examples in Section 1 were fragments. The sandbox quietly wrapped them in',
            'the missing structure so they would run, the way a helpful editor might.',
            'A real `.html` file has to carry that structure itself.',
            '',
            'Here it is. Four parts, and they never change:',
            '',
            '- `<!DOCTYPE html>` — the very first line. Not really a tag, and it has no closing partner. It tells the browser "read this with modern HTML rules." Leave it out and browsers fall back to imitating a browser from 1998, which goes wrong in ways that are genuinely hard to debug.',
            '- `<html>` — wraps *everything* else. The outermost box.',
            '- `<head>` — information **about** the page. Nothing in here is drawn on screen.',
            '- `<body>` — the page itself. Everything a visitor sees lives in here.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A complete HTML page',
          tabs: ['html'],
          files: { html: SKELETON },
          caption:
            'Look at the preview and count what you see: the heading and the paragraph, and nothing else. "Kitchen Notes" appears twice in the code but only once on the page — the <title> copy went somewhere else.',
        },
        {
          type: 'text',
          md: [
            '### head versus body',
            '',
            'This is the one idea in this section people most often have to be told twice,',
            'so it is worth being blunt about it: **`<head>` is not the top of the page.**',
            '',
            'The name suggests a header — a banner across the top. It is not that. `<head>`',
            'is the label on the outside of the parcel: who the page is, what it is called,',
            'what stylesheet it needs. Useful, invisible.',
            '',
            '`<title>` is the clearest example. It sets the text in the **browser tab**, and',
            'the name a bookmark gets saved under. It never appears on the page. If you',
            'want a heading a visitor can read, that is `<h1>`, and it goes in the `<body>`.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Put something visible in the `<head>` — a paragraph, a heading — and you will',
            'get no error at all. The browser silently shrugs and moves it into the body,',
            'or drops it. A page where content has mysteriously gone missing or jumped',
            'somewhere odd is almost always a `<head>`/`<body>` mix-up.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Notice the shape of that code, too. `<head>` and `<body>` are indented one',
            'step because they sit *inside* `<html>`, and `<title>` is indented again',
            'because it sits inside `<head>`. The browser does not care. You will, in about',
            'twenty lines\' time.',
            '',
            'Your turn to write one.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-task-skeleton',
      type: 'task',
      title: 'Build the skeleton',
      required: true,
      prompt: [
        'The doctype and the `<html>` element are there. The inside is empty — fill it in.',
        '',
        '1. Add a `<head>` containing a `<title>` of **Kitchen Notes**',
        '2. Add a `<body>` after it, containing:',
        '   - an `<h1>` saying **Kitchen Notes**',
        '   - a `<p>` saying **Three things I can actually cook.**',
        '',
        'Indent each element one step further than the one it sits inside, the way the',
        'example on the last page did. Press **Run** when you are done.',
        '',
        'If the tab at the top of the preview changes to say "Kitchen Notes", your',
        '`<title>` landed in the right place.',
      ].join('\n'),
      tabs: ['html'],
      starter: {
        html: [
          '<!DOCTYPE html>',
          '<html>',
          '  <!-- head goes here, then body. Delete this comment as you go. -->',
          '</html>',
        ].join('\n'),
      },
      checks: [
        {
          type: 'dom',
          selector: 'title',
          text: 'Kitchen Notes',
          message:
            'There is no <title> saying "Kitchen Notes" yet. It goes inside <head>, written as a pair: <title>Kitchen Notes</title>.',
        },
        {
          type: 'dom',
          selector: 'h1',
          text: 'Kitchen Notes',
          message:
            'The page needs an <h1> saying "Kitchen Notes" inside the <body>. This is the copy a visitor actually reads, so it cannot live in the <head>.',
        },
        {
          type: 'dom',
          selector: 'p',
          text: 'Three things I can actually cook',
          message:
            'Add a paragraph saying "Three things I can actually cook." underneath the heading, still inside the <body>.',
        },
      ],
      hint: [
        'Work outside-in. First put the two empty containers inside `<html>`:',
        '',
        '```html',
        '<head>',
        '</head>',
        '<body>',
        '</body>',
        '```',
        '',
        'Then drop the `<title>` between the head tags, and the heading and paragraph',
        'between the body tags. Every one of them is a pair, so every one needs its',
        'closing tag with the slash.',
      ].join('\n'),
      solution: { html: TASK3_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-quiz-structure',
      type: 'quiz',
      title: 'Check-in: elements and the skeleton',
      required: true,
      questions: [
        {
          q: 'How many elements is `<p>Hello</p>`?',
          options: [
            'Two — the opening tag is one and the closing tag is the other.',
            'One — the two tags and the content between them are a single element.',
            'Three — an opening tag, some content, and a closing tag.',
            'None — it only becomes an element once CSS is applied to it.',
          ],
          answerIndex: 1,
          explanation:
            'One element, made of three parts. The third option is the near-miss worth sitting with: those three parts are real, but they are parts *of* the element, not three elements. A tag is a label; the element is the whole package.',
        },
        {
          q: 'You write `<title>Kitchen Notes</title>` in the head. Where does that text appear?',
          options: [
            'As a large heading across the top of the page.',
            'Nowhere — <title> is a note to yourself that the browser ignores.',
            'In the browser tab, but not on the page itself.',
            'In the address bar, replacing the address you typed.',
          ],
          answerIndex: 2,
          explanation:
            'The tab, and your bookmarks. Not the page. The first answer is the trap, because "title" sounds exactly like the big text at the top of a page — but that is an `<h1>`, and it belongs in the body.',
        },
        {
          q: 'You wrote a heading but nothing shows up. You look again and find you put it inside <head>. Why is it invisible?',
          options: [
            '<head> only accepts text, not elements.',
            '<head> holds information about the page; only what is inside <body> gets drawn.',
            'Headings have to come after the paragraph, and there is no paragraph yet.',
            'It is there, but its colour defaults to white.',
          ],
          answerIndex: 1,
          explanation:
            'Nothing in the head is drawn — that is the whole division of labour. And notice you got no error: the browser said nothing at all, which is exactly why this one is worth recognising by sight.',
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-attributes',
      type: 'content',
      title: 'Attributes: extra information on a tag',
      blocks: [
        {
          type: 'text',
          md: [
            'A tag on its own says what kind of thing something is. Often you need to say',
            'more than that — which language the page is in, which particular heading this',
            'is, where a link goes. That extra information goes **inside the opening tag**,',
            'and it is called an **attribute**.',
            '',
            'Attributes are always the same shape: a name, an equals sign, and a value in',
            'quote marks.',
            '',
            '```html',
            '<h1 id="page-title">Kitchen Notes</h1>',
            '```',
            '',
            'Read that as: an `h1` element, whose `id` is `page-title`. The name is `id`,',
            'the value is `page-title`, and the content of the element — the bit a visitor',
            'reads — is still just `Kitchen Notes`.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Three rules cover almost every attribute you will ever write:',
            '',
            '1. **Opening tag only.** Never `</h1 id="page-title">`. A closing tag is bare.',
            '2. **Quote the value.** `id="page-title"`, not `id=page-title`.',
            '3. **Separate several with a space.** `<html lang="en" id="top">` — no commas.',
            '',
            'You have already met one attribute without knowing it. In Section 1 the button',
            'was written `<button id="hello">`, and the JavaScript looked it up by that',
            'exact name. That is what an `id` is for: a unique label so some other piece of',
            'code — CSS or JavaScript — can find one specific element on the page.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Two attributes doing real work',
          tabs: ['html'],
          files: {
            html: [
              '<!DOCTYPE html>',
              '<html lang="en">',
              '  <head>',
              '    <title>Attributes</title>',
              '  </head>',
              '  <body>',
              '    <h1 id="page-title">Hover over me</h1>',
              '    <p title="I am an attribute, not an element!">And hover over this line too.</p>',
              '  </body>',
              '</html>',
            ].join('\n'),
          },
          caption:
            'Rest your mouse on the paragraph for a second — the text in its title attribute pops up. Note that `title` here is an attribute on a paragraph, which is a completely different thing from the <title> element in the head. HTML reuses the word; you get used to it.',
        },
        {
          type: 'tip',
          md: [
            '`lang="en"` on the `<html>` tag says "this page is in English." It costs one',
            'attribute and it does real work: screen readers use it to pick the right',
            'pronunciation, and browsers use it to offer a sensible translation. Every',
            'page you write from here on should have it.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Forget a quote mark and HTML fails in its usual quiet way. Write',
            '`<h1 id="page-title>Kitchen Notes</h1>` and the browser keeps reading,',
            'looking for the quote that ends the value — swallowing your heading text and',
            'possibly the next few tags into the attribute.',
            '',
            'The symptom is text that has vanished from the page for no apparent reason.',
            'The cause is a missing `"` several lines up.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-task-attributes',
      type: 'task',
      title: 'Label your page',
      prompt: [
        'Here is the page you built two pages ago, exactly as you left it. Add two',
        'attributes to it:',
        '',
        '1. Give the `<html>` tag a `lang` of **en**',
        '2. Give the `<h1>` an `id` of **page-title**',
        '',
        'Neither one changes anything you can see — that is expected. Attributes are',
        'information *about* an element, and these two are for browsers, screen readers',
        'and your own later code to read. Press **Run** and the checks will confirm they',
        'landed.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK3_SOLUTION_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'html',
          attr: 'lang',
          attrValue: 'en',
          message:
            'The <html> tag does not have lang="en" yet. It goes inside the opening tag, after the tag name and a space: <html lang="en">.',
        },
        {
          type: 'dom',
          selector: 'h1',
          attr: 'id',
          attrValue: 'page-title',
          message:
            'The <h1> needs id="page-title". Add it inside the opening <h1> tag — not the closing one, and not between the tags where the heading text is.',
        },
      ],
      hint: [
        'An attribute slides in between the tag name and the closing `>`, with a space',
        'in front of it:',
        '',
        '```html',
        '<html lang="en">',
        '```',
        '',
        'The `<h1>` works the same way. Its closing `</h1>` stays exactly as it is —',
        'closing tags never carry attributes.',
      ].join('\n'),
      solution: { html: TASK6_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-nesting',
      type: 'content',
      title: 'Nesting: boxes inside boxes',
      blocks: [
        {
          type: 'text',
          md: [
            'You have been nesting since page 2 without the word for it. `<title>` sits',
            'inside `<head>`, which sits inside `<html>`. An element inside another element',
            'is **nested**, and the whole of HTML is built out of it.',
            '',
            'The vocabulary is borrowed from family trees. The outer element is the',
            '**parent**, the elements directly inside it are its **children**, and children',
            'of the same parent are **siblings**. So in the skeleton, `<head>` and `<body>`',
            'are siblings, and both are children of `<html>`.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### The one rule',
            '',
            'Nesting has exactly one rule, and it is the rule of physical boxes: **an',
            'element that opens inside another must close inside it too.** Boxes can',
            'contain boxes. Boxes cannot overlap.',
            '',
            '```html',
            '<div>',
            '  <p>Fine. The p opens and closes inside the div.</p>',
            '</div>',
            '',
            '<div>',
            '  <p>Broken. The div closes while the p is still open.',
            '</div>',
            '  </p>',
            '```',
            '',
            'Closing tags come off in the reverse order you put them on — last opened,',
            'first closed. Like taking off a coat and then a jumper.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '`<div>` in there is new, and it is the plainest element in HTML: a box with no',
            'meaning and no appearance of its own. Its entire job is to group other',
            'elements together so they can be moved or styled as a unit. You will use it',
            'constantly once you get to layout.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A group, and a line about it',
          tabs: ['html'],
          files: {
            html: [
              '<div id="recipe">',
              '  <h1>Cheese on Toast</h1>',
              '  <p>Bread. Cheese. Heat.</p>',
              '  <!-- The browser ignores this line entirely. -->',
              '</div>',
              '',
              '<p>This paragraph is outside the div, so its parent is the body instead.</p>',
            ].join('\n'),
          },
          caption:
            'The preview shows no sign of the div at all — no border, no gap, no trace. It is real and it is doing something; it just has nothing to say for itself visually. The comment is invisible too, but for a different reason: the browser never even reads it.',
        },
        {
          type: 'tip',
          md: [
            'That `<!-- ... -->` is an HTML **comment**. Everything between the arrows is',
            'skipped by the browser, which makes it the right place for a note to whoever',
            'reads your code next — usually you, three weeks later.',
            '',
            'It is also the fastest debugging tool there is: wrap a chunk of your page in a',
            'comment and it disappears, without you having to delete it and hope you can',
            'type it back.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'And this is where indentation earns its keep. The browser does not read it,',
            'but *you* do, and indentation is how you see nesting at a glance — which',
            'element is inside which, and whether the closing tags line up with the',
            'opening ones. Badly indented HTML hides exactly the bug the next page is',
            'about to hand you.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-task-debug',
      type: 'task',
      title: 'Fix the broken markup',
      required: true,
      prompt: [
        'This is a different snippet, not the page you built — your page is fine. This',
        'one has two faults, and neither one produces an error message. It draws',
        'happily, slightly wrong.',
        '',
        '1. One tag is missing its slash, so an element never closes.',
        '2. One paragraph is outside the `<div id="notes">` when it should be inside it,',
        '   alongside the other one.',
        '',
        'Find both and fix them. Reading the indentation is faster than reading the',
        'tags. Press **Run** when you think it is clean.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK8_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'h1',
          count: 1,
          message:
            'There should be exactly one <h1> on the page. Right now the browser thinks there are two, because a heading was opened a second time instead of being closed — look for the tag that needs a slash.',
        },
        {
          type: 'dom',
          selector: '#notes p',
          minCount: 2,
          message:
            'Both paragraphs should be inside the div with id="notes". Move the stray one in so that it opens and closes before the div\'s closing tag.',
        },
      ],
      hint: [
        'Take them one at a time.',
        '',
        'For the first: look hard at the two tags around the words "Kitchen Notes". One',
        'of them should have a `/` and does not — so instead of closing the heading, it',
        'opens a second one.',
        '',
        'For the second: the last paragraph sits below `</div>`, which means it is',
        'outside the box. Cut that whole line and paste it back in just above the',
        '`</div>`, indented to match the paragraph already there.',
      ].join('\n'),
      solution: { html: TASK8_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 9
    {
      id: 'p9-quiz-html-basics',
      type: 'quiz',
      title: 'Knowledge check: HTML basics',
      required: true,
      questions: [
        {
          q: 'Which of these is written as a single tag, with no closing partner?',
          options: ['<p>', '<hr>', '<div>', '<h1>'],
          answerIndex: 1,
          explanation:
            '`<hr>` is a void element — it draws a divider line and has no content, so there is nothing for a closing tag to close. There is no `</hr>`. The other three all wrap content and all need closing.',
        },
        {
          q: 'In `<h1 id="page-title">Kitchen Notes</h1>`, which part is the attribute\'s value?',
          options: ['h1', 'id', 'page-title', 'Kitchen Notes'],
          answerIndex: 2,
          explanation:
            '`id` is the attribute\'s name and `page-title` is its value. "Kitchen Notes" is the tempting answer, but that is the element\'s *content* — the part on the page. The value is what sits in the quote marks inside the opening tag.',
        },
        {
          q: 'What is wrong with `<div><p>Hello</div></p>`?',
          options: [
            'Nothing — closing tags can come in any order.',
            'A <div> is not allowed to contain a <p>.',
            'The tags overlap: <p> opened inside the div, so it must close before the div does.',
            'The <p> needs an id before it can go inside a <div>.',
          ],
          answerIndex: 2,
          explanation:
            'Last opened, first closed — so it should be `<div><p>Hello</p></div>`. A div containing a paragraph is completely normal; it is the *crossing* that is wrong, because boxes nest but never overlap.',
        },
        {
          q: 'Which of these does the browser skip over without reading?',
          options: [
            '<!-- a note to yourself -->',
            '<head>information about the page</head>',
            '<div>a box with no styling</div>',
            '<br>',
          ],
          answerIndex: 0,
          explanation:
            'A comment is genuinely ignored. The near-miss is the `<head>`: nothing in it is *drawn*, but the browser reads every word of it — that is how `<title>` reaches your tab. Invisible and unread are two different things.',
        },
        {
          q: 'What is `<!DOCTYPE html>` for?',
          options: [
            'It gives the page its name, the way <title> does.',
            'It is a comment explaining that the file contains HTML.',
            'It tells the browser to read the page using modern HTML rules.',
            'It is optional decoration that older editors used to add.',
          ],
          answerIndex: 2,
          explanation:
            'It puts the browser in standards mode. Leave it out and the browser imitates a very old one instead, which breaks layout in confusing ways — so "optional decoration" is the answer to rule out. It is one line, it goes first, and it never changes.',
        },
      ],
    },

    // ---------------------------------------------------------------- 10
    {
      id: 'p10-recap',
      type: 'content',
      title: 'You can write a real HTML file now',
      blocks: [
        {
          type: 'text',
          md: [
            'Last section you could change words inside tags somebody else had written.',
            'Now you can write the file from an empty editor: the doctype, the `<html>`',
            'wrapper, a `<head>` with a title in it, a `<body>` with content in it, and',
            'attributes on whichever tags need them.',
            '',
            'You also debugged HTML, which is a bigger deal than it sounds. Both faults on',
            'that last page were silent — no error, no red text, just a page that was',
            'quietly not what it claimed to be. Noticing that is most of the skill.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### The words worth keeping',
            '',
            '| Word | What it means |',
            '| --- | --- |',
            '| Tag | One pointy-bracket label, like `<p>` or `</p>` |',
            '| Element | An opening tag, its content, and its closing tag, all together |',
            '| Void element | An element with no content and no closing tag, like `<hr>` |',
            '| Attribute | `name="value"` inside an opening tag — extra information |',
            '| `id` | An attribute giving one element a unique name to be found by |',
            '| Nesting | An element inside another element |',
            '| Parent / child / sibling | Outer element / element inside it / elements sharing a parent |',
            '| `<head>` | Information about the page. Read by the browser, never drawn |',
            '| `<body>` | The page itself. Everything a visitor sees |',
            '| Comment | `<!-- ... -->`, skipped by the browser entirely |',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '**Next up: Text, Links & Images.** You have been working with two elements —',
            '`<h1>` and `<p>` — because that was enough to learn the rules with. Next',
            'section widens it out: headings at six different levels, the element that',
            'makes a link, and the one that puts a picture on the page. That last one is',
            'where attributes stop being a formality and start being the whole point,',
            'because a picture is useless until you say *which* picture.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'One thing to try before you go. Go back to the task on page 6 and change the',
            '`<title>` to something of your own, then look at the tab above the preview.',
            'Then add `<hr>` between the heading and the paragraph and run it again.',
            '',
            'That loop — change one thing, run it, look — is the whole job. You are going',
            'to do it several thousand more times.',
          ].join('\n'),
        },
      ],
    },
  ],
};

export default section;
