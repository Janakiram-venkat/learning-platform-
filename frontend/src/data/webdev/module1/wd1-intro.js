// Module 1, Section 1 — Introduction to Web Development.
//
// Authoring notes for whoever edits this next:
//  - Pages 5, 6 and 7 build ONE page together. Page 6's starter is page 5's
//    solution; page 7's starter is page 6's solution. If you change a solution,
//    change the next page's starter to match, or the story breaks.
//  - Nothing here uses <!DOCTYPE>, <html> or <head>. The page skeleton is
//    taught in Section 2, and this section must not use it first.
//  - Check `text` and `value` matching is case- and whitespace-insensitive
//    (see lib/webdev/sandbox.js), so authored text can be written naturally.

/** The finished page students poke on page 1 and build for themselves by page 7. */
const FINISHED = {
  html: [
    '<h1>My First Page</h1>',
    '',
    '<p>I am learning to build websites.</p>',
    '',
    '<button id="hello">Say hello</button>',
  ].join('\n'),
  css: [
    'body {',
    '  background-color: lightyellow;',
    '  font-family: sans-serif;',
    '  padding: 20px;',
    '}',
    '',
    'h1 {',
    '  color: darkgreen;',
    '}',
  ].join('\n'),
  js: [
    'document.getElementById("hello").addEventListener("click", function () {',
    '  console.log("Hello from JavaScript!");',
    '});',
  ].join('\n'),
};

/** Page 5 hands this to the student; pages 6 and 7 inherit the fixed version. */
const TASK5_SOLUTION_HTML = [
  '<h1>My First Page</h1>',
  '',
  '<p>I am learning to build websites.</p>',
].join('\n');

/** Page 6's answer, which becomes page 7's (unchangeable) backdrop. */
const TASK6_SOLUTION_CSS = [
  'h1 {',
  '  color: darkgreen;',
  '}',
  '',
  'body {',
  '  background-color: lightyellow;',
  '}',
].join('\n');

const section = {
  id: 'wd1-intro',
  title: 'Introduction to Web Development',
  pages: [
    // ---------------------------------------------------------------- 1
    {
      id: 'p1-welcome',
      type: 'content',
      title: 'Welcome to the web',
      blocks: [
        {
          type: 'text',
          md: [
            'Every website you have ever used — the one you watch videos on, the one',
            'your school uses, the one you order food from — is built out of the same',
            'three things. By the end of this course you will be able to build them too.',
            '',
            'Not "understand how they work". **Build them.** Starting right now, on this page.',
            '',
            'Here is a small webpage. It is real and it is running — the box on the right',
            'is a live browser window showing the code on the left.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'A small webpage',
          tabs: ['html', 'css', 'js'],
          files: FINISHED,
          caption:
            'Click "Say hello", then open the Terminal tab to see the message it prints. Then change "My First Page" to your own name and press Run.',
        },
        {
          type: 'tip',
          md: [
            'You cannot break anything here. Every example in this course is a sandbox —',
            'a safe, walled-off copy. Change it, run it, see what happens. If it goes',
            'wrong, press **Reset** and you are back where you started.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'That whole page is under twenty lines of code. Before this section is over',
            'you will have written its words, its colours and its message to the Terminal',
            'yourself — the button wiring is the one part we save for later.',
            '',
            'But first: when you typed an address into your browser to get here, what',
            'actually happened?',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 'p2-how-the-web-works',
      type: 'content',
      title: 'How the web works',
      blocks: [
        {
          type: 'text',
          md: [
            'Imagine walking into a restaurant.',
            '',
            'You sit down and order the pasta. The kitchen cooks it. A waiter brings it',
            'to your table. You did not go into the kitchen, and you did not cook',
            'anything — you **asked**, and something **came back**.',
            '',
            'The web works exactly like that.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '- **You** are the browser — Chrome, Safari, Firefox, whatever you are reading this in.',
            '- **The kitchen** is a *server*: a computer somewhere else whose whole job is to hold files and hand them out when asked.',
            '- **Your order** is the web address you type in.',
            '- **The dish** is a set of files that the server sends back.',
            '',
            'That back-and-forth has a name. Your browser sends a **request**, and the',
            'server sends a **response**. That is the entire web, repeated billions of',
            'times a second.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### So what actually arrives?',
            '',
            'Here is the part that surprises most people. The server does **not** send a',
            'picture of the page. It sends **plain text** — ordinary typed characters,',
            'the same kind you would write in a notes app.',
            '',
            'Your browser reads that text and *draws* the page from it, live, on your',
            'screen. The drawing happens on your computer, not on the server.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Text in, page out',
          tabs: ['html'],
          files: {
            html: [
              '<h1>I am just text</h1>',
              '',
              '<p>Everything on the left is characters someone typed.</p>',
              '<p>Everything on the right was drawn by your browser.</p>',
            ].join('\n'),
          },
          caption:
            'The left side is exactly what a server would send. The right side is what your browser made of it. Same information, two very different things to look at.',
        },
        {
          type: 'tip',
          md: [
            'This is why a webpage can look different on a phone and a laptop. The server',
            'sends the same text to both, and each browser draws it to fit the screen',
            'it has.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Before you carry on, see if you can answer this in your head: if the server',
            'only ever sends text, where does the *colour* come from?',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 'p3-quiz-request-response',
      type: 'quiz',
      title: 'Check-in: asking and answering',
      required: true,
      questions: [
        {
          q: 'You type an address into your browser and press Enter. What happens first?',
          options: [
            'Your browser looks the page up in a list of pages stored on your computer.',
            'Your browser sends a request to a server, asking for the page.',
            'The server notices you are interested and sends the page over automatically.',
            'Your browser downloads the entire website, then shows you one page of it.',
          ],
          answerIndex: 1,
          explanation:
            'Nothing moves until your browser **asks**. It sends a request, and the server answers with a response. The tempting wrong answer is the last one — browsers do not download a whole site at once. They fetch one page, and then fetch more only if you click through to it.',
        },
        {
          q: 'What does the server actually send back to your browser?',
          options: [
            'A finished picture of the page, already drawn by the server.',
            'A small program that the server runs on your screen.',
            'Plain text files that your browser reads and turns into a page.',
            'Nothing yet — the page only arrives once you click something.',
          ],
          answerIndex: 2,
          explanation:
            'It sends **text**, and your browser does the drawing. Most people guess the first answer, because a webpage certainly looks like a picture. But if it were a picture you could not select the words on it, and the page could not rearrange itself when you resize the window — which it does.',
        },
        {
          q: 'In the restaurant analogy, which part is the server?',
          options: [
            'The menu you read before ordering.',
            'You, deciding what you want.',
            'The table you are sitting at.',
            'The kitchen that prepares what you asked for.',
          ],
          answerIndex: 3,
          explanation:
            'The kitchen takes orders and sends food back out — that is a server. You are the browser: you do the asking, and you never go into the kitchen yourself.',
        },
      ],
    },

    // ---------------------------------------------------------------- 4
    {
      id: 'p4-three-ingredients',
      type: 'content',
      title: 'The three ingredients',
      blocks: [
        {
          type: 'text',
          md: [
            'That text the server sends comes in three flavours, and each one has a',
            'completely different job. Think about a house.',
            '',
            '- **HTML** is the walls, floors and doorways — the *structure*. It decides that there is a room here and a window there. A house with only walls is usable, but bare.',
            '- **CSS** is the paint, the wallpaper, the tiles — the *style*. It changes nothing about where the rooms are; it changes how they look.',
            '- **JavaScript** is the wiring — the *behaviour*. It is why the light comes on when you flick the switch and the doorbell rings when someone presses it.',
            '',
            'Those are the three languages of the web. HTML says what is there, CSS says',
            'what it looks like, JavaScript says what it *does*.',
          ].join('\n'),
        },
        {
          type: 'example',
          label: 'Three layers, one page',
          tabs: ['html', 'css', 'js'],
          files: FINISHED,
          caption:
            'Try this: open the style.css tab, delete everything in it, and press Run. The page loses its colour but keeps all its words — that is CSS removed, HTML intact. Press Reset, then do the same to script.js: the button is still there, but clicking it does nothing.',
        },
        {
          type: 'text',
          md: [
            'That is worth doing rather than reading. Strip the CSS and the page turns',
            'plain but still works. Strip the JavaScript and the button goes dead but',
            'still looks like a button. Strip the HTML and there is nothing left at all —',
            'because there was never anything there *but* the HTML. The other two only',
            'ever decorate and animate what HTML already put on the page.',
          ].join('\n'),
        },
        {
          type: 'warning',
          md: [
            'The single most common beginner mistake, in any of the three languages:',
            '**forgetting to close a tag.**',
            '',
            'HTML comes in pairs. `<h1>` opens a heading and `</h1>` closes it — note the',
            'slash. Write `<h1>Hello<h1>` and you have opened *two* headings and closed',
            'none, and the browser will do something strange and silent rather than',
            'telling you off.',
            '',
            'If a page ever looks wildly wrong, a missing `/` is the first thing to check.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'Enough reading. You are going to build that page yourself, one layer at a',
            'time — words first, then colour, then behaviour.',
          ].join('\n'),
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 'p5-task-html',
      type: 'task',
      title: 'Layer one: the words (HTML)',
      prompt: [
        'Here is a page with two pieces of text on it, and both are shouting at you.',
        'Fix them.',
        '',
        '1. Make the heading say **My First Page**',
        '2. Make the paragraph say **I am learning to build websites.**',
        '',
        'Change only the words. Leave the `<h1>`, `</h1>`, `<p>` and `</p>` exactly as',
        'they are. Press **Run** when you are done.',
      ].join('\n'),
      tabs: ['html'],
      starter: {
        html: [
          '<!-- Anything between these arrows is a comment. The browser ignores it,',
          '     so it is a handy place to leave notes for yourself. -->',
          '',
          '<h1>CHANGE THIS HEADING</h1>',
          '',
          '<p>CHANGE THIS SENTENCE</p>',
        ].join('\n'),
      },
      checks: [
        {
          type: 'dom',
          selector: 'h1',
          text: 'My First Page',
          message:
            'The heading should say "My First Page". Look for the text sitting between <h1> and </h1> and replace it.',
        },
        {
          type: 'dom',
          selector: 'p',
          text: 'I am learning to build websites',
          message:
            'The paragraph should say "I am learning to build websites." Replace the text between <p> and </p>.',
        },
      ],
      hint: [
        'A tag is like a labelled box. The label is the tag, and the words you see on',
        'the page are what sits **inside** the box:',
        '',
        '`<h1>` … *this bit is what shows up* … `</h1>`',
        '',
        'So you never need to touch the pointy brackets. Just the words between them.',
      ].join('\n'),
      solution: { html: TASK5_SOLUTION_HTML },
    },

    // ---------------------------------------------------------------- 6
    {
      id: 'p6-task-css',
      type: 'task',
      title: 'Layer two: the colour (CSS)',
      prompt: [
        'Your words are right, but the page is very plain. Time for paint.',
        '',
        'Open the **style.css** tab and write two rules:',
        '',
        '1. Make the heading (`h1`) the colour **darkgreen**',
        '2. Give the page (`body`) a background colour of **lightyellow**',
        '',
        'A CSS rule looks like this — a *selector* saying what to style, then the',
        'changes in curly brackets:',
        '',
        '```css',
        'p {',
        '  color: blue;',
        '}',
        '```',
        '',
        '`body` means the whole page. Press **Run** to see it.',
      ].join('\n'),
      tabs: ['html', 'css'],
      starter: {
        html: TASK5_SOLUTION_HTML,
        css: [
          '/* This is a CSS comment. Write your rules underneath it. */',
          '',
        ].join('\n'),
      },
      checks: [
        {
          type: 'style',
          selector: 'h1',
          prop: 'color',
          value: 'darkgreen',
          message:
            'The heading is not dark green yet. You need an h1 rule setting "color" — and note the spelling: CSS uses color, not colour.',
        },
        {
          type: 'style',
          selector: 'body',
          prop: 'background-color',
          value: 'lightyellow',
          message:
            'The page background is not light yellow yet. Add a body rule setting "background-color".',
        },
      ],
      hint: [
        'Every rule has the same three parts. Here is one for the heading, with the',
        'colour left out for you to fill in:',
        '',
        '```css',
        'h1 {',
        '  color: ???;',
        '}',
        '```',
        '',
        'The `body` rule has the same shape — a different selector and a different',
        'property. Do not forget the semicolon `;` at the end of the line inside.',
      ].join('\n'),
      solution: {
        html: TASK5_SOLUTION_HTML,
        css: TASK6_SOLUTION_CSS,
      },
    },

    // ---------------------------------------------------------------- 7
    {
      id: 'p7-task-js',
      type: 'task',
      title: 'Layer three: the behaviour (JavaScript)',
      required: true,
      prompt: [
        'Your page has words and colour. The last layer is the wiring.',
        '',
        'JavaScript can do a lot, but it has one humble instruction you will use more',
        'than any other: `console.log`. It prints a message to the **Terminal** — a',
        'panel only you can see, which programmers use constantly to check what their',
        'code is doing.',
        '',
        'Write one line that prints exactly this message:',
        '',
        '```js',
        'console.log("Hello from JavaScript");',
        '```',
        '',
        'Type it out yourself rather than copying it — you will remember it better.',
        'Then press **Run** and watch the Terminal.',
        '',
        'Your page from the last two tasks is still there; the editor is just showing',
        'you the JavaScript this time. Click **Preview** if you want to see it.',
      ].join('\n'),
      tabs: ['js'],
      starter: {
        html: TASK5_SOLUTION_HTML,
        css: TASK6_SOLUTION_CSS,
        js: [
          '// Your page is still running - click Preview to see it.',
          '// Write your console.log line below this comment.',
          '',
        ].join('\n'),
      },
      checks: [
        {
          type: 'console',
          contains: 'Hello from JavaScript',
          message:
            'The Terminal should show "Hello from JavaScript". Check that the message is inside quote marks and that the line ends with a closing bracket.',
        },
      ],
      hint: [
        'The shape is: the word `console.log`, then round brackets, and your message',
        'inside them in quote marks.',
        '',
        'The quote marks matter. Without them JavaScript thinks `Hello` is the name of',
        'something you defined earlier, goes looking for it, finds nothing, and',
        'complains in red.',
      ].join('\n'),
      solution: {
        html: TASK5_SOLUTION_HTML,
        css: TASK6_SOLUTION_CSS,
        js: 'console.log("Hello from JavaScript");',
      },
    },

    // ---------------------------------------------------------------- 8
    {
      id: 'p8-quiz-ingredients',
      type: 'quiz',
      title: 'Knowledge check: the three ingredients',
      required: true,
      questions: [
        {
          q: 'Which language decides that there is a heading and a paragraph on the page at all?',
          options: ['CSS', 'JavaScript', 'HTML', 'The browser decides by itself'],
          answerIndex: 2,
          explanation:
            'HTML puts things on the page. CSS and JavaScript can only work with what HTML has already placed there — delete the HTML and the other two have nothing to act on.',
        },
        {
          q: 'You want the heading to be bigger and purple. Which language do you reach for?',
          options: ['CSS', 'HTML', 'JavaScript', 'You need all three'],
          answerIndex: 0,
          explanation:
            'Appearance is CSS: colour, size, spacing, fonts. A common mix-up is reaching for HTML, because the heading *lives* in the HTML — but HTML only says "this is a heading". How a heading looks is CSS\'s decision.',
        },
        {
          q: 'You want something to happen when a button is clicked. Which language?',
          options: ['HTML, because the button is written in HTML', 'CSS', 'JavaScript', 'No language — buttons do that on their own'],
          answerIndex: 2,
          explanation:
            'Reacting to a click is behaviour, and behaviour is JavaScript. The first option is the tempting one: HTML does create the button, but on its own that button is just a shape. Nothing happens when you press it until JavaScript says so.',
        },
        {
          q: 'What is wrong with this line?  `<h1>Hello<h1>`',
          options: [
            'Headings are not allowed to contain plain text.',
            'The closing tag is missing its slash — it should be </h1>.',
            'There should be a semicolon at the end of the line.',
            'Nothing is wrong with it.',
          ],
          answerIndex: 1,
          explanation:
            'A closing tag needs a slash: `</h1>`. Without it you have opened two headings and closed neither. The semicolon answer catches a lot of people who have seen CSS or JavaScript first — but HTML tags never end in a semicolon.',
        },
        {
          q: 'If HTML is the walls of a house and CSS is the paint, what is JavaScript?',
          options: [
            'The address that tells people where the house is.',
            'The furniture you put in each room.',
            'The wiring that makes the lights and the doorbell work.',
            'The builder who put the walls up.',
          ],
          answerIndex: 2,
          explanation:
            'JavaScript is the wiring: it makes things *happen*. Furniture is the near-miss worth thinking about — furniture is decoration you can see but not interact with, which makes it much closer to CSS than to JavaScript.',
        },
      ],
    },

    // ---------------------------------------------------------------- 9
    {
      id: 'p9-recap',
      type: 'content',
      title: 'You built a webpage',
      blocks: [
        {
          type: 'text',
          md: [
            'Look back at what you just did. You wrote the words with **HTML**, painted',
            'them with **CSS**, and made the page speak with **JavaScript**. That is the',
            'whole stack. Every website on earth is that same three-layer sandwich, just',
            'with more in each layer.',
            '',
            'You also know something most people using the internet do not: that a server',
            'sends nothing but text, and your browser does all the drawing.',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            '### The words worth keeping',
            '',
            '| Word | What it means |',
            '| --- | --- |',
            '| Browser | The program that asks for pages and draws them |',
            '| Server | A computer that holds files and hands them out when asked |',
            '| Request | Your browser asking for something |',
            '| Response | What the server sends back |',
            '| HTML | Structure — what is on the page |',
            '| CSS | Style — what it looks like |',
            '| JavaScript | Behaviour — what it does |',
            '| Tag | A label like `<h1>`, written in pairs that open and close |',
          ].join('\n'),
        },
        {
          type: 'tip',
          md: [
            '**Next up: HTML Basics.** You have been writing tags by copying their shape.',
            'Next section you will learn the actual rules behind them — what an',
            '*element* is, what an *attribute* does, and the scaffolding that every real',
            'webpage is wrapped in (the bit this section deliberately left out).',
          ].join('\n'),
        },
        {
          type: 'text',
          md: [
            'One last thing to try before you go. Go back to your page on the previous',
            'task and change `darkgreen` to a colour of your own — `crimson`, `teal`,',
            '`hotpink`, anything you like the sound of. Most English colour names just',
            'work. Finding that out for yourself is how a lot of web development goes.',
          ].join('\n'),
        },
      ],
    },
  ],
};

export default section;
