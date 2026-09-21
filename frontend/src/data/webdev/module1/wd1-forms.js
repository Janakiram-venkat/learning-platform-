// Module 1, Section 5 — Forms & Inputs (basics). The last section of Module 1.
//
// Authoring notes for whoever edits this next:
//  - Prerequisites: everything in Sections 1-4. CSS has been touched once (the
//    bonus task at the end of Section 4) and JavaScript has not been taught at
//    all — page 7 hands the student a working event listener as scaffolding and
//    says outright that it will be explained later. Nothing else here assumes JS.
//  - Nothing is ever SENT anywhere. The sandbox intercepts submit events and
//    prints a note instead (lib/webdev/sandbox.js). The prose says so plainly
//    and does not promise which later lesson covers servers, because none is
//    written yet.
//  - Page 5 uses the "link" check type, added to the in-frame grader for this
//    section: it compares one element's attribute against another element's
//    attribute (a label's `for` against an input's `id`) and reports which of
//    the four common mistakes was made.
//  - Page 7 is the section's JS mini-task. Its scaffolding clicks the button
//    once on run, ON PURPOSE: checks are graded shortly after load, so a
//    message that only appears on a real click would never be seen by the
//    grader. The comment in the starter says this out loud rather than hiding it.
//  - Page 7 opens on the Terminal (`pane: 'terminal'`), because its whole
//    output is console text and the preview is one button.
//  - Page 9 is the module wrap-up and carries the section's Complete & Continue
//    button. The Module Challenge and Mini Project are named but NOT linked —
//    both exist now, and the sidebar is the one place that navigates to them,
//    so a second set of links here would be a second thing to keep correct.
//  - Deliberately NOT claimed anywhere: what any particular screen reader
//    announces, what browser validation does with type="email", or what
//    type="button" does (not verified in the sandbox, so not taught here).

/** The finished form page 1 shows off and page 4 reuses. */
const DEMO_FORM_HTML = [
  '<h1>Join the cook-along</h1>',
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
  '  <p>',
  '    <input type="checkbox" id="news" name="news">',
  '    <label for="news">Send me the weekly recipe</label>',
  '  </p>',
  '',
  '  <button>Sign me up</button>',
  '</form>',
].join('\n');

/** Page 3: three inputs to add. */
const TASK3_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Sign up</title>',
  '  </head>',
  '  <body>',
  '    <h1>Sign up</h1>',
  '',
  '    <form>',
  '      <!-- 1. A text input goes here.     type="text"     -->',
  '',
  '      <!-- 2. An email input goes here.   type="email"    -->',
  '',
  '      <!-- 3. A checkbox goes here.       type="checkbox" -->',
  '',
  '      <button>Sign me up</button>',
  '    </form>',
  '  </body>',
  '</html>',
].join('\n');

const TASK3_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Sign up</title>',
  '  </head>',
  '  <body>',
  '    <h1>Sign up</h1>',
  '',
  '    <form>',
  '      <p><input type="text" name="name"></p>',
  '',
  '      <p><input type="email" name="email"></p>',
  '',
  '      <p><input type="checkbox" name="news"></p>',
  '',
  '      <button>Sign me up</button>',
  '    </form>',
  '  </body>',
  '</html>',
].join('\n');

/** Page 5: the label to wire up. */
const TASK5_STARTER_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Sign up</title>',
  '  </head>',
  '  <body>',
  '    <h1>Sign up</h1>',
  '',
  '    <form>',
  '      <p>',
  '        <!-- 1. This label needs a for attribute. -->',
  '        <label>Your name</label>',
  '',
  '        <!-- 2. This input needs a matching id. -->',
  '        <input type="text" name="name">',
  '      </p>',
  '',
  '      <button>Sign me up</button>',
  '    </form>',
  '  </body>',
  '</html>',
].join('\n');

const TASK5_SOLUTION_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Sign up</title>',
  '  </head>',
  '  <body>',
  '    <h1>Sign up</h1>',
  '',
  '    <form>',
  '      <p>',
  '        <label for="fullname">Your name</label>',
  '        <input type="text" id="fullname" name="name">',
  '      </p>',
  '',
  '      <button>Sign me up</button>',
  '    </form>',
  '  </body>',
  '</html>',
].join('\n');

/** Page 7: the JS mini-task. The button sits outside any form, so the only
 *  thing that happens when it is clicked is the student's own line. */
const TASK7_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <title>Button practice</title>',
  '  </head>',
  '  <body>',
  '    <h1>Button practice</h1>',
  '    <p>This page is locked. All your work happens in the script.js tab.</p>',
  '',
  '    <button id="greet">Say hello</button>',
  '  </body>',
  '</html>',
].join('\n');

const TASK7_MESSAGE = 'Hello from the button';

const TASK7_STARTER_JS = [
  '// Scaffolding. You will learn how this works properly later in the course.',
  '// In English it says: "when the button with id=greet is clicked, run the',
  '// code between the curly braces".',
  'document.getElementById("greet").addEventListener("click", function () {',
  '',
  '  // YOUR ONE LINE GOES HERE.',
  '  // Print this exact message to the Terminal:  ' + TASK7_MESSAGE,
  '  // Use console.log("...") - single or double quotes, either is fine.',
  '',
  '});',
  '',
  '// This last line clicks the button once as soon as the page runs, so the',
  '// message shows up without you having to touch anything. Clicking the button',
  '// yourself works too - try it, and watch the Terminal.',
  'document.getElementById("greet").click();',
].join('\n');

const TASK7_SOLUTION_JS = [
  '// Scaffolding. You will learn how this works properly later in the course.',
  '// In English it says: "when the button with id=greet is clicked, run the',
  '// code between the curly braces".',
  'document.getElementById("greet").addEventListener("click", function () {',
  '',
  '  console.log("' + TASK7_MESSAGE + '");',
  '',
  '});',
  '',
  '// This last line clicks the button once as soon as the page runs, so the',
  '// message shows up without you having to touch anything. Clicking the button',
  '// yourself works too - try it, and watch the Terminal.',
  'document.getElementById("greet").click();',
].join('\n');

const section = {
  id: 'wd1-forms',
  title: 'Forms & Inputs (basics)',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-what-forms-are',
      type: 'content',
      title: 'Forms: the part of a page that listens',
      blocks: [
        {
          type: 'text',
          md: [
            'Everything you have built so far talks *at* the visitor. Headings, paragraphs,',
            'pictures, tables — the page says its piece and the visitor reads it.',
            '',
            'A **form** is the other direction. It is the part of a page that collects',
            'something from a person: a name, an email address, a search, a yes or no.',
            'Every login box, every search bar, every checkout page you have ever used is',
            'a form.',
            '',
            'It is built out of pieces you mostly already recognise:',
            '',
            '- `<form>` — the container. It groups the inputs that belong together.',
            '- `<input>` — one box the person types in, ticks, or chooses.',
            '- `<label>` — the words telling them what that box is for.',
            '- `<button>` — the thing they press when they are done.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A small, finished form',
          tabs: ['html'],
          files: { html: DEMO_FORM_HTML },
          caption:
            'Type your name into the first box, tick the checkbox, then press "Sign me up" — and watch the Terminal tab rather than the preview. Nothing moves, nothing reloads, and a line appears saying the form was submitted. That message is this sandbox telling you it caught the submission.',
        },
        {
          type: 'text',
          md: [
            '### Where does the data go?',
            '',
            'Nowhere. Not in these lessons, and it is worth being straight with you about',
            'that rather than letting you assume otherwise.',
            '',
            'On a real website, pressing that button sends what you typed to a **server** —',
            'another computer, somewhere else, whose job is to receive it, store it and',
            'reply. That is a whole subject of its own, and it is not part of this module.',
            '',
            'In this sandbox there is no server and nowhere to send anything, so the',
            'submission is caught and reported in the Terminal instead. Everything you',
            'build here is the *front* of the form: the part a person sees and fills in.',
            'That part is real, and it is the part you are learning to write.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '`<form>` is a container, exactly like `<div>` or `<ul>` — it draws nothing by',
            'itself. Its job is to say "these inputs belong together and are submitted',
            'together."',
            '',
            'An `<input>` outside any form still works and still accepts typing. What it',
            'loses is the grouping: nothing ties it to the inputs around it, and pressing',
            'Enter in it submits nothing, because there is no form for it to submit.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** Click into the name box in the example and',
            'press **Enter** without touching the button. The same submitted message',
            'appears — pressing Enter in a text field is a second way to submit a form, and',
            'it catches people out when they did not expect the page to react at all.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-input-types',
      type: 'content',
      title: 'One element, many shapes',
      blocks: [
        {
          type: 'text',
          md: [
            'Almost every box in a form is the same element: `<input>`. What changes is one',
            'attribute — `type` — and that attribute changes the control completely.',
            '',
            '```html',
            '<input type="text">',
            '<input type="checkbox">',
            '```',
            '',
            'The first is a box you type in. The second is a tick box. Same element, one',
            'word different.',
            '',
            '`<input>` is a **void element**, like `<img>` and `<br>`: one tag, no closing',
            'partner, nothing between. There is no `</input>`.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### The five worth knowing first',
            '',
            '| `type` | What you get |',
            '| --- | --- |',
            '| `text` | A single-line box for any words |',
            '| `email` | The same box, marked as holding an email address |',
            '| `number` | A box for a number, usually with little up/down arrows |',
            '| `checkbox` | A tick box: on or off, independently of any other |',
            '| `radio` | A round button where only one of the group can be chosen |',
            '',
            'There are more — dates, colours, passwords, files — and they all work the same',
            'way. Learn the shape and the rest are a lookup away.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'All five types, side by side',
          tabs: ['html'],
          files: {
            html: [
              '<form>',
              '  <p>Text: <input type="text" name="nickname"></p>',
              '',
              '  <p>Email: <input type="email" name="email"></p>',
              '',
              '  <p>Number: <input type="number" name="portions"></p>',
              '',
              '  <p>Checkbox: <input type="checkbox" name="news"></p>',
              '',
              '  <p>',
              '    Pick one:',
              '    <input type="radio" name="meal" value="breakfast"> Breakfast',
              '    <input type="radio" name="meal" value="dinner"> Dinner',
              '    <input type="radio" name="meal" value="both"> Both',
              '  </p>',
              '</form>',
            ].join('\n'),
          },
          caption:
            'Click all three radio buttons in turn: choosing one clears the last, because all three share name="meal". Now tick the checkbox — it has no partners, so it just goes on and off. The number box has small arrows at its right-hand edge; the text and email boxes look identical to each other, which is the point of the next paragraph.',
        },
        {
          type: 'text',
          md: [
            '### Radio buttons and the shared name',
            '',
            'Radio buttons are the one type that does not work alone. Look at the example:',
            'all three have `name="meal"`, and that shared name is the *only* thing making',
            'them a group. Choosing one clears the others because the browser treats',
            'same-named radios as a single question with one answer.',
            '',
            'Give them different names and you break the group — you get three separate',
            'questions, all tickable at once, which is a checkbox with a round shape.',
            'Getting this wrong is the classic radio-button bug.',
            '',
            'So what is `name` for the rest of the time? It is the **label the data travels',
            'under** when the form is submitted. The server gets "nickname = Sam", and',
            '`name="nickname"` is where "nickname" comes from. `value` is the matching',
            'half: for a text box the value is whatever was typed, but a radio button has',
            'nothing to type, so you write its value yourself — `value="dinner"` is the',
            'answer that particular button stands for.',
            '',
            'Nothing is submitted anywhere here, so `name` and `value` do no visible work',
            'in this course — except for radio grouping, which is entirely a `name` job.',
            'Write them anyway. They are how the form means anything.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'You will meet the `placeholder` attribute — the grey hint text inside a box:',
            '',
            '```html',
            '<input type="text" placeholder="Your name">',
            '```',
            '',
            'It is useful, and it is **not a label**. The hint disappears the moment',
            'someone starts typing, so anyone who looks away mid-answer loses the only',
            'clue about what the box was for.',
            '',
            'The next page is about labels, which are the real answer. Placeholders are a',
            'nice extra on top of one, never a replacement for one.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example, change the second radio',
            'button\'s `name` from `meal` to `meal2` and run it. Now you can select it *and*',
            'one of the others at the same time — the group has split in half, and nothing',
            'on screen warns you.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-task-inputs',
      type: 'task',
      title: 'Add three inputs',
      prompt: [
        'The form below is empty apart from its button. Add three inputs, one at each',
        'comment, and delete the comments as you go.',
        '',
        '1. An input with `type="text"`',
        '2. An input with `type="email"`',
        '3. An input with `type="checkbox"`',
        '',
        'Those three `type` values are exactly what the checks look for. Everything else',
        'is yours: put each one in a `<p>` if you like, give them `name` attributes, add',
        'placeholder text. Remember that `<input>` is a void element — one tag, and no',
        'closing tag to write.',
        '',
        'Press **Run** when all three are in.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK3_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'input',
          attr: 'type',
          attrValue: 'text',
          message:
            'There is no <input type="text"> yet. The element is <input>, and the kind of box it becomes is decided by the type attribute inside the tag.',
        },
        {
          type: 'dom',
          selector: 'input',
          attr: 'type',
          attrValue: 'email',
          message:
            'There is no <input type="email"> yet. It is the same <input> tag as the text one with a different type — not a different element.',
        },
        {
          type: 'dom',
          selector: 'input',
          attr: 'type',
          attrValue: 'checkbox',
          message:
            'There is no <input type="checkbox"> yet. Check the spelling of the type value: it is one word, all lower case, with no space or hyphen in it.',
        },
      ],
      hint: [
        'All three lines are the same shape:',
        '',
        '```html',
        '<input type="text">',
        '```',
        '',
        'Write that one first and run it — a box should appear above the button. Then',
        'copy the line twice and change the word inside the quotes to `email` and then',
        '`checkbox`.',
        '',
        'There is no `</input>` to add. If you have written one, delete it; the tag is',
        'finished the moment you close the `>`.',
      ].join('\n'),
      solution: { html: TASK3_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-labels',
      type: 'content',
      title: 'Labels: telling people what the box is for',
      blocks: [
        {
          type: 'text',
          md: [
            'An input is an empty box. On its own it says nothing about what should go in',
            'it. The words that answer that question are a `<label>`, and a label is not',
            'just text sitting nearby — it can be *attached* to its input.',
            '',
            '```html',
            '<label for="name">Your name</label>',
            '<input type="text" id="name">',
            '```',
            '',
            'Two attributes do the attaching, and they are a matched pair:',
            '',
            '- `id` on the **input** — a unique name for it, exactly the `id` you met in',
            '  Section 2 and used for `#` links in Section 3.',
            '- `for` on the **label** — the id of the input this label belongs to.',
            '',
            'They have to be spelled identically. `for="name"` finds `id="name"` and',
            'nothing else — not `name="name"`, not a label that happens to sit next to it.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Attached, and not attached',
          tabs: ['html'],
          files: {
            html: [
              '<h3>Attached labels</h3>',
              '<form>',
              '  <p>',
              '    <label for="dish">Favourite dish</label>',
              '    <input type="text" id="dish">',
              '  </p>',
              '  <p>',
              '    <input type="checkbox" id="news">',
              '    <label for="news">Send me the weekly recipe</label>',
              '  </p>',
              '</form>',
              '',
              '<h3>Just words next to a box</h3>',
              '<form>',
              '  <p>',
              '    Favourite dish',
              '    <input type="text">',
              '  </p>',
              '  <p>',
              '    <input type="checkbox">',
              '    Send me the weekly recipe',
              '  </p>',
              '</form>',
            ].join('\n'),
          },
          caption:
            'Click the words "Favourite dish" in the top form — the cursor jumps into the box next to it. Click the words "Send me the weekly recipe" and the tick box toggles. Now try clicking the same words in the bottom form: nothing happens at all. The two forms look near enough identical and only one of them is wired up.',
        },
        {
          type: 'text',
          md: [
            'That click is the part you can see, and it is the smaller half of the benefit.',
            'A checkbox is a tiny target — perhaps twelve pixels across. A label attached',
            'to it turns the whole phrase into part of that target, which matters enormously',
            'on a phone, and to anyone whose hands are not perfectly steady.',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            'The larger half is that an attached label gives the input a **name** — not the',
            '`name` attribute, but a name in the sense of "what is this control called?"',
            '',
            'Software that presents your page to someone who cannot see it has to answer',
            'that question somehow. With a `<label for="...">` there is a definite answer,',
            'written down by you. Without one, there is an unlabelled text box, and the',
            'software is left guessing from whatever text happens to be nearby.',
            '',
            'This is the same idea as `alt` on an image in Section 3: you are writing down',
            'in words what the page means, for everyone who is not looking at your pixels.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'Three ways the connection silently fails, all of which *look* fine:',
            '',
            '- **The spellings drift apart.** `for="email"` and `id="e-mail"` connect',
            '  nothing. Copy and paste the value rather than retyping it.',
            '- **The wrong attribute on the label.** It is `for`, not `id` and not `name`.',
            '  An `id` on a label labels the label.',
            '- **The input has no `id` at all.** Then there is nothing for `for` to point',
            '  at, however correct the label looks.',
            '',
            'In every case the page draws perfectly and the clicking just quietly does not',
            'work. Clicking your own labels is the fastest test there is.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the top form of the example, change',
            '`id="dish"` to `id="dishes"` and leave the label alone. Run it and click the',
            'label: the cursor no longer jumps. Then fix it back. That is exactly the bug',
            'the next page asks you to avoid.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-task-label',
      type: 'task',
      title: 'Wire up a label',
      required: true,
      prompt: [
        'The form below has a label and a text input sitting next to each other, and no',
        'connection between them. Join them up.',
        '',
        '1. Give the `<input>` an `id` of **fullname**',
        '2. Give the `<label>` a `for` of **fullname**',
        '',
        'Both spellings must match exactly — that matching is the whole exercise. Leave',
        'the label\'s text (**Your name**) where it is; a label with no words between its',
        'tags has nothing to click.',
        '',
        'Press **Run**, then click the words "Your name" in the preview. If the cursor',
        'jumps into the box, you have done it.',
      ].join('\n'),
      tabs: ['html'],
      starter: { html: TASK5_STARTER_HTML },
      checks: [
        {
          type: 'dom',
          selector: 'input',
          attr: 'id',
          attrNonEmpty: true,
          message:
            'The <input> has no id yet. Add one inside its opening tag — id="fullname" — because a label can only point at an input that has an id to point at.',
        },
        {
          type: 'link',
          selector: 'label',
          attr: 'for',
          target: 'input',
          targetAttr: 'id',
          requireText: true,
          message:
            'The label is not connected to the input. It needs for="fullname" in its opening tag, matching the input\'s id="fullname" exactly — the attribute on the label is "for", not "id" and not "name".',
        },
      ],
      hint: [
        'Do the input first. An `id` goes inside the opening tag, after the tag name:',
        '',
        '```html',
        '<input type="text" id="fullname" name="name">',
        '```',
        '',
        'Now the label points at it. The attribute is `for`, and its value is the id you',
        'just wrote — no `#` in front of it, unlike the links in Section 3:',
        '',
        '```html',
        '<label for="fullname">Your name</label>',
        '```',
        '',
        'If the check still fails, read the two values side by side one character at a',
        'time. `fullname`, `full-name` and `fullName` are three different ids, and only',
        'one of them is the one you wrote on the input.',
      ].join('\n'),
      solution: { html: TASK5_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-buttons',
      type: 'content',
      title: 'Buttons, and what pressing one does',
      blocks: [
        {
          type: 'text',
          md: [
            'A form needs a way to say "done". There are two ways to write one, and they',
            'produce the same thing on screen:',
            '',
            '```html',
            '<button>Sign me up</button>',
            '<input type="submit" value="Sign me up">',
            '```',
            '',
            'The difference is where the words live. `<button>` is a normal pair of tags,',
            'so its label is the content between them — which means it can hold other',
            'elements too, like an icon next to the text. `<input type="submit">` is a void',
            'element like every other input, so its words have to arrive as an attribute,',
            'and `value` is the attribute that carries them.',
            '',
            '`<button>` is the one to reach for. It is easier to read, easier to style, and',
            'it does not make you write text inside quote marks.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### A button inside a form submits it',
            '',
            'This is the part that surprises people. A `<button>` inside a `<form>` submits',
            'that form when pressed, **without you asking it to**. You wrote no attribute',
            'and no code; submitting is simply what a button in a form does by default.',
            '',
            'On a real website, that submission sends the values to a server and the page',
            'is replaced by whatever comes back. A beginner who did not expect it sees the',
            'page apparently reload and everything they typed vanish.',
            '',
            'In this sandbox nothing is sent and nothing reloads — the submission is caught',
            'and a line appears in the Terminal instead. That line is your evidence that',
            'the button really did submit.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Press it and watch the Terminal',
          tabs: ['html'],
          files: {
            html: [
              '<h1>Two buttons, one form</h1>',
              '',
              '<form>',
              '  <p>',
              '    <label for="dish">Favourite dish</label>',
              '    <input type="text" id="dish" name="dish">',
              '  </p>',
              '',
              '  <button>Sign me up</button>',
              '  <input type="submit" value="Or press this one">',
              '</form>',
            ].join('\n'),
          },
          caption:
            'Open the Terminal tab first, then press each button in turn and watch a line appear for each press. Both do exactly the same thing despite being written differently. Now click into the text box and press Enter — a third line. Three ways to submit one form, and none of them needed any code from you.',
        },
        {
          type: 'tip',
          md: [
            'That default is worth remembering the other way round too: a button that is',
            '**not** inside a form submits nothing, because there is no form to submit.',
            'Pressing it does nothing at all until you give it something to do.',
            '',
            'Giving a button something to do is JavaScript\'s job, and that is the whole',
            'third layer of the web — the one waiting at the end of this module. The next',
            'page lets you try one line of it.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**Try this before you move on.** In the example, cut the `<button>` line and',
            'paste it *below* the `</form>` tag, then run it and press it. No line appears',
            'in the Terminal: it is the same button, outside the form, and it has nothing',
            'left to submit.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-task-button-js',
      type: 'task',
      title: 'Make the button say something',
      pane: 'terminal',
      prompt: [
        'A taste of the third layer. This is optional, and it is the only JavaScript in',
        'Module 1 — everything except one line is written for you.',
        '',
        'The **script.js** tab is the only editable one. Inside it, the scaffolding',
        'already says "when the button is clicked, run this". You write the line that',
        'says what to do:',
        '',
        '```js',
        'console.log("' + TASK7_MESSAGE + '");',
        '```',
        '',
        '`console.log` prints a message to the Terminal. Put that line where the comment',
        'tells you to, inside the curly braces.',
        '',
        'The message must be **' + TASK7_MESSAGE + '** — the check ignores capitals, extra',
        'spaces and whether you used single or double quotes, but the words have to be',
        'those. Press **Run**, and look at the Terminal.',
      ].join('\n'),
      tabs: ['js'],
      starter: { html: TASK7_HTML, js: TASK7_STARTER_JS },
      checks: [
        {
          type: 'console',
          contains: TASK7_MESSAGE,
          collapseSpace: true,
          message:
            'The Terminal does not show "' + TASK7_MESSAGE + '". Your line goes inside the curly braces of the click handler, and it looks like console.log("' + TASK7_MESSAGE + '"); — check the brackets, the quotes around the message, and the semicolon at the end.',
        },
      ],
      hint: [
        'The line you need is written out in full in the prompt above. The only',
        'question is where it goes: inside the curly braces `{ }` of the handler,',
        'replacing the comment that says YOUR ONE LINE GOES HERE.',
        '',
        'So the finished middle of the file reads:',
        '',
        '```js',
        'document.getElementById("greet").addEventListener("click", function () {',
        '  console.log("' + TASK7_MESSAGE + '");',
        '});',
        '```',
        '',
        'If the Terminal stays empty, look for a missing `)` or `"` — JavaScript, unlike',
        'HTML, does complain when it cannot understand a line, and the complaint will be',
        'in that same Terminal in red.',
      ].join('\n'),
      solution: { html: TASK7_HTML, js: TASK7_SOLUTION_JS },
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-quiz-forms',
      type: 'quiz',
      title: 'Knowledge check: forms and inputs',
      required: true,
      questions: [
        {
          q: 'In `<label for="email">Email</label>`, what does `for` point at?',
          options: [
            'The name attribute of an input.',
            'The id attribute of an input.',
            'The type of input the label is describing.',
            'The form the label is inside.',
          ],
          answerIndex: 1,
          explanation:
            '`for` holds an id, and only an id. The `name` answer is the one that catches people, because inputs so often have both and they are often spelled the same — but `name` is the label the data travels under when a form is submitted, and it plays no part in connecting a label.',
        },
        {
          q: 'You want three radio buttons where only one can be chosen. What makes them a group?',
          options: [
            'Being inside the same <form>.',
            'Being next to each other in the HTML.',
            'Sharing the same name attribute.',
            'Sharing the same id attribute.',
          ],
          answerIndex: 2,
          explanation:
            'The shared `name` is the entire mechanism — same name, one answer. Sitting together inside one form is the popular wrong answer and is not enough: give them different names and all three become independently tickable. Sharing an `id` would be worse still, since an id is meant to be unique on the page.',
        },
        {
          q: 'Why attach a label to an input instead of just writing the words beside it?',
          options: [
            'Because plain text next to an input is invalid HTML.',
            'Because it makes the input compulsory to fill in.',
            'Because it names the control for software that cannot see the page, and makes the words part of the clickable area.',
            'Because the browser will not submit an input that has no label.',
          ],
          answerIndex: 2,
          explanation:
            'Two real benefits, one visible and one not. The others are myths worth discarding: loose text beside an input is perfectly valid, and forms happily submit unlabelled inputs. Nothing breaks without a label — it just leaves people guessing, which is exactly why it is easy to forget.',
        },
        {
          q: 'What happens when you press a `<button>` that is inside a `<form>` and you have written no JavaScript?',
          options: [
            'Nothing — a button needs code before it does anything.',
            'It submits the form, because that is a button\'s default behaviour in a form.',
            'It clears every input in the form.',
            'It depends on the button\'s type attribute, which has no default.',
          ],
          answerIndex: 1,
          explanation:
            'Submitting is the default, which is why a form seems to "reload for no reason" the first time it happens to you. "Nothing" is the intuitive answer and is only true *outside* a form — the same button with no form around it genuinely does nothing at all.',
        },
        {
          q: 'You fill in a form on one of these lesson pages and press the button. Where does what you typed go?',
          options: [
            'To this site\'s server, which stores it with your progress.',
            'Nowhere — the sandbox stops the submission and prints a note instead.',
            'Into your browser\'s saved passwords.',
            'It is emailed to the address in the email field.',
          ],
          answerIndex: 1,
          explanation:
            'Nowhere at all. A real site would send it to a server, which is a subject this module does not cover — so everything you have built here is the front half of a form: the part a person sees and fills in. Nothing you type into these examples is stored or sent anywhere.',
        },
      ],
    },

    // ---------------------------------------------------------------- 9
    {
      id: 'p9-module-recap',
      type: 'content',
      title: 'That is Module 1',
      blocks: [
        {
          type: 'text',
          md: [
            'Five sections ago you had not written a tag. You can now build a complete',
            'HTML page from an empty editor: structured, linked, illustrated, tabulated',
            'and able to ask a visitor a question.',
            '',
            'Worth noticing what else happened along the way. You debugged markup that',
            'rendered perfectly and was still wrong — twice. You wrote alt text and labels,',
            'which are the parts of a page nobody sees and everybody depends on. And you',
            'learned to be suspicious of "it looks fine", which is the single most useful',
            'instinct in this entire trade.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### Everything in Module 1',
            '',
            '| Section | What you can do now |',
            '| --- | --- |',
            '| The three layers | Tell HTML, CSS and JavaScript apart: structure, appearance, behaviour |',
            '| HTML basics | Tags vs elements, void elements, `<!DOCTYPE>`/`<html>`/`<head>`/`<body>`, attributes, nesting, comments |',
            '| Text, links & images | `<h1>`–`<h6>` as an outline, `<p>`, `<strong>`/`<em>` vs `<b>`/`<i>`, `<a href>`, `<img src alt>` |',
            '| Lists & tables | `<ul>`/`<ol>`/`<li>`, nested lists, `<table>`/`<tr>`/`<th>`/`<td>` |',
            '| Forms & inputs | `<form>`, the five common `<input>` types, radio groups, `<label for>`, `<button>` |',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### The words that keep coming back',
            '',
            '| Word | What it means |',
            '| --- | --- |',
            '| Element | An opening tag, its content and its closing tag |',
            '| Void element | One tag, no closing partner: `<img>`, `<br>`, `<hr>`, `<input>` |',
            '| Attribute | `name="value"` inside an opening tag |',
            '| `id` | A unique name for one element, so something else can point at it |',
            '| Nesting | An element inside another, closing in the reverse order it opened |',
            '| Valid | Markup that follows the rules — which is not the same as "it renders" |',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '**What comes next.** Two pieces finish this module off: the **Module',
            'Challenge**, six tasks that put everything above together, and the **Mini',
            'Project**, where you build one page about yourself across five milestones.',
            '',
            'Both are in the sidebar, under this section\'s list. Take them in that order —',
            'the challenge is the shorter of the two.',
            '',
            'After that, Module 2 is CSS: the layer that decides what all of this *looks*',
            'like. You have had one taste of it already, styling a table header in the',
            'bonus task at the end of the last section.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '**One last thing to try.** Go back to any task in this module — the article,',
            'the table, the sign-up form — and change something that was not asked for.',
            'Add a row, a link, a second heading. Break it on purpose and read what the',
            'page does about it.',
            '',
            'Nothing here is graded twice, and nothing can be permanently broken: every',
            'editor has a Reset button. Press **Complete & Continue** when you are done.',
          ].join('\n'),
        },
      ],
    },
  ],
};

export default section;
