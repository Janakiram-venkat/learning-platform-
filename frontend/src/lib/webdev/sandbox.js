// Builds the sandboxed document that a student's HTML/CSS/JS runs inside.
//
// The web-dev course has no server-side runner (unlike Python/Pyodide): the
// browser already is the runtime. We hand the composed document to an
// <iframe srcDoc sandbox="allow-scripts"> — deliberately WITHOUT
// allow-same-origin, so the frame gets an opaque origin and cannot reach the
// parent's DOM, cookies or localStorage. Everything the parent needs to know
// (console output, thrown errors, task check results) therefore has to come
// back over postMessage, which is what the runtime shim below is for.
//
// Because the frame can't be read from outside, task checks also run *inside*
// it. They're serialised into the document and their verdicts posted back.

/** Every message from the frame carries this, so the parent can ignore noise. */
export const RUNNER_SOURCE = 'webdev-runner';

/** A `</script>` inside injected JS would close the tag early. Neutralise it. */
const escapeScript = (s) => String(s ?? '').replace(/<\/script/gi, '<\\/script');

/**
 * Sample images the course can use by name.
 *
 * A srcDoc frame has no base URL, so `<img src="cat.jpg">` can never resolve to
 * a file — and the frame has no business fetching the wider internet either.
 * These stand in: tiny inline SVGs, matched on the *filename* so "cat.jpg",
 * "./cat.jpg" and "images/cat.jpg" all find the same picture.
 *
 * The extensions are deliberately .jpg/.png rather than .svg. Students meet
 * those in every tutorial they will ever read, and the point being taught is
 * the `src`/`alt` pair, not the file format.
 *
 * Anything NOT listed here is left alone and breaks, on purpose: a broken image
 * showing its alt text is the single best argument for writing alt text.
 */
const SAMPLE_IMAGES = {
  'cat.jpg':
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">' +
    '<rect width="240" height="160" fill="#ffd8a8"/>' +
    '<g fill="#5c4033"><path d="M78 62 L66 26 L104 46 Z"/><path d="M162 62 L174 26 L136 46 Z"/>' +
    '<ellipse cx="120" cy="92" rx="56" ry="44"/></g>' +
    '<circle cx="101" cy="84" r="9" fill="#ffffff"/><circle cx="139" cy="84" r="9" fill="#ffffff"/>' +
    '<circle cx="101" cy="85" r="4" fill="#1b1b1b"/><circle cx="139" cy="85" r="4" fill="#1b1b1b"/>' +
    '<path d="M112 103 h16 l-8 9 Z" fill="#ff9aa2"/>' +
    '<g stroke="#ffffff" stroke-width="2"><path d="M66 99 h32 M66 109 h32 M174 99 h-32 M174 109 h-32"/></g>' +
    '<text x="120" y="152" font-family="monospace" font-size="11" fill="#5c4033" text-anchor="middle">cat.jpg</text>' +
    '</svg>',
  'mountain.jpg':
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">' +
    '<rect width="240" height="160" fill="#cfe8ff"/>' +
    '<circle cx="198" cy="38" r="17" fill="#ffd66b"/>' +
    '<path d="M0 160 L74 52 L132 160 Z" fill="#4a7c59"/>' +
    '<path d="M94 160 L166 42 L240 160 Z" fill="#2f5d45"/>' +
    '<path d="M148 72 L166 42 L184 72 L166 64 Z" fill="#ffffff"/>' +
    '<text x="120" y="152" font-family="monospace" font-size="11" fill="#ffffff" text-anchor="middle">mountain.jpg</text>' +
    '</svg>',
  'logo.png':
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
    '<rect x="8" y="8" width="144" height="144" rx="28" fill="#1b1b1b"/>' +
    '<circle cx="80" cy="64" r="26" fill="#9ae66e"/>' +
    '<rect x="44" y="100" width="72" height="12" rx="6" fill="#ffffff"/>' +
    '<text x="80" y="140" font-family="monospace" font-size="11" fill="#ffffff" text-anchor="middle">logo.png</text>' +
    '</svg>',
};

/** The names students can type. Exported so lesson content can list them. */
export const SAMPLE_IMAGE_NAMES = Object.keys(SAMPLE_IMAGES);

/**
 * Normalise a student's `src` to the sample name it is asking for, or null if
 * it isn't asking for one. "./cat.jpg", "images/CAT.JPG" and "cat.jpg?v=2" all
 * come back as "cat.jpg"; anything with a scheme (http:, data:) is left alone.
 *
 * Written in ES5 with no outer references because its *source* is injected
 * into the sandbox shim (see buildSrcDoc), so the rule the frame applies and
 * the rule tested in Node are the same function, not two copies of it.
 *
 * @param {string} src
 * @returns {string|null}
 */
export function resolveSampleName(src) {
  var raw = String(src == null ? '' : src).trim();
  if (!raw) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  var clean = raw.split('?')[0].split('#')[0];
  var name = clean.substring(clean.lastIndexOf('/') + 1).toLowerCase();
  return name || null;
}

/** Is this `src` one of the built-in samples? @param {string} src */
export function isSampleImage(src) {
  const name = resolveSampleName(src);
  return !!name && Object.prototype.hasOwnProperty.call(SAMPLE_IMAGES, name);
}

/**
 * Narrow a `dom`/`style` check's selector down to the elements it really
 * matches: the selector first, then each authored filter in turn.
 *
 * Written in ES5 with no outer references, for the same reason
 * `resolveSampleName` is: its *source* is injected into the sandbox shim (see
 * buildSrcDoc), so the rule the frame applies and the rule a Node test applies
 * are the same function rather than two copies that can drift apart. Everything
 * it needs from the document arrives in `ctx`, which is what lets a test hand it
 * a parsed tree instead of a real DOM.
 *
 * @param {object} check
 * @param {{ queryAll: (selector: string) => Array<any>,
 *           norm: (value: any) => string,
 *           attrOf: (el: any, name: string) => string|null }} ctx
 * @returns {Array<any>}
 */
export function matchElements(check, ctx) {
  var list = ctx.queryAll(check.selector);
  var norm = ctx.norm;
  if (check.text) {
    list = list.filter(function (el) {
      return norm(el.textContent).indexOf(norm(check.text)) !== -1;
    });
  }
  // "every cell has something in it" - a count of elements that are not
  // empty, which a substring test can't express.
  if (check.textNonEmpty) {
    list = list.filter(function (el) {
      return norm(el.textContent) !== "";
    });
  }
  if (check.attr) {
    list = list.filter(function (el) {
      if (!el.hasAttribute(check.attr)) return false;
      var actual = ctx.attrOf(el, check.attr);
      // attrNonEmpty is opt-in: presence alone has always been enough, and
      // sections written before this flag existed rely on that.
      if (check.attrNonEmpty && String(actual == null ? "" : actual).trim() === "") return false;
      if (check.attrValue == null) return true;
      return norm(actual).indexOf(norm(check.attrValue)) !== -1;
    });
  }
  // A last gate for the things a substring test can't say: "present, but not
  // one of these words", used by the alt-text task.
  if (check.attrNot && check.attr) {
    list = list.filter(function (el) {
      var actual = norm(ctx.attrOf(el, check.attr));
      for (var i = 0; i < check.attrNot.length; i++) {
        if (actual === norm(check.attrNot[i])) return false;
      }
      return true;
    });
  }
  if (check.attrNotPattern && check.attr) {
    var re = new RegExp(check.attrNotPattern, "i");
    list = list.filter(function (el) {
      var actual = ctx.attrOf(el, check.attr);
      return !re.test(String(actual == null ? "" : actual).trim());
    });
  }
  return list;
}

/**
 * The verdict of a `dom` check, given the elements it matched. Injected by
 * source alongside {@link matchElements}, for the same reason.
 *
 * @param {object} check
 * @param {Array<any>} list
 * @returns {boolean}
 */
export function domVerdict(check, list) {
  if (typeof check.count === "number") return list.length === check.count;
  if (typeof check.minCount === "number") return list.length >= check.minCount;
  return list.length > 0;
}

/**
 * The verdict of an `every` check: "all of these elements satisfy the filters",
 * not "at least one does".
 *
 * A `dom` check can only ever say *some* element matched, which is the wrong
 * question for a rubric item like "every image has alt text" — one described
 * image and four bare ones would pass it. This compares the filtered list
 * against the unfiltered one, so a single offender fails the check and the
 * detail says how many.
 *
 * `minCount` (default 1) is the "…and there is at least one of them at all"
 * half: vacuous truth over an empty page is not a passed rubric item.
 *
 * Injected by source alongside {@link matchElements}, hence ES5 with no outer
 * references. The caller supplies both lists because the two queries it needs
 * (`queryAll(selector)` and `matchElements(check, ctx)`) live outside it.
 *
 * @param {object} check
 * @param {Array<any>} all     Everything the selector matched.
 * @param {Array<any>} matched Those that also passed the check's filters.
 * @returns {true|{passed: false, detail: string}}
 */
export function everyVerdict(check, all, matched) {
  var need = typeof check.minCount === "number" ? check.minCount : 1;
  if (all.length < need) {
    return {
      passed: false,
      detail: all.length === 0
        ? "there is no " + check.selector + " on the page at all"
        : "there " + (all.length === 1 ? "is " : "are ") + all.length + " " + check.selector +
          " on the page, and this needs at least " + need,
    };
  }
  if (matched.length === all.length) return true;
  var missing = all.length - matched.length;
  return {
    passed: false,
    detail: missing + " of the " + all.length + " " + check.selector + " element" +
      (all.length === 1 ? "" : "s") + " on the page " + (missing === 1 ? "does not" : "do not"),
  };
}

/**
 * The default `norm` for {@link matchElements}: collapse whitespace, trim, lower
 * case. Mirrors the sandbox's own `norm`, and exported so a Node test builds its
 * ctx out of the same rule the frame uses.
 *
 * @param {any} s
 * @returns {string}
 */
export function normalizeText(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// CSS checkers
//
// Module 1 graded HTML structure, so a selector and a count said everything
// worth saying. Module 2 grades CSS, which asks three questions that need three
// different answers:
//
//   "is it painted this colour?"   -> getComputedStyle. The `style` check.
//   "is it this big / over there?" -> geometry and relative position, which no
//                                     computed value reports. The `layout` check.
//   "did you write this rule?"     -> the student's CSS source. The `cssRule`
//                                     check, for :hover and @media — states the
//                                     browser is not currently in, so nothing
//                                     computed can see them.
//
// The three functions below are the comparisons behind those checks, and like
// `matchElements` they are injected into the sandbox BY SOURCE (see RUNTIME),
// so the rule the browser applies and the rule a Node test applies are the same
// function rather than two copies that drift. Hence ES5 with no outer
// references: everything they need arrives as an argument.
// ---------------------------------------------------------------------------

/**
 * Compare one value read off the page against what a check asked for.
 *
 * Five modes, checked in this order, because they are mutually exclusive ways
 * of describing the same property:
 *
 *   not     — "anything but this". The specificity lesson's question: the
 *             student's rule has to actually win, and "not still black" is the
 *             only way to say that without pinning the exact colour.
 *   approx  — within `tolerance` (default 1) of a number. Layout values come
 *             back as fractional pixels, so `20px` of padding can measure
 *             19.9969.
 *   min/max — a range, for "at least this much" and "no wider than this".
 *   value   — exact equality, which is what Module 1's `style` check already did.
 *
 * `want` is the AUTHORED value already resolved to the computed form the browser
 * would report (the caller does that through a probe element, so "red" and
 * "rgb(255, 0, 0)" compare equal). The numeric modes ignore it.
 *
 * @param {object} check  The authored check.
 * @param {string} got    The value read off the page, normalised.
 * @param {string} [want] `check.value` / `check.not`, resolved and normalised.
 * @returns {true|{passed: false, detail: string}}
 */
export function compareStyleValue(check, got, want) {
  var g = String(got == null ? "" : got);
  var label = check.prop || check.box || "value";
  var sawNothing = g === "" ? "nothing" : g;

  if (check.not != null) {
    if (g !== want) return true;
    return {
      passed: false,
      detail: "found " + label + ": " + sawNothing + ", which is the value this is meant to change",
    };
  }

  if (check.approx != null || check.min != null || check.max != null) {
    var n = parseFloat(g);
    if (isNaN(n)) {
      return { passed: false, detail: "found " + label + ": " + sawNothing + ", which is not a measurement" };
    }
    if (check.approx != null) {
      var tol = check.tolerance == null ? 1 : check.tolerance;
      if (Math.abs(n - check.approx) <= tol) return true;
      return {
        passed: false,
        detail: "found " + label + ": " + g + ", and this wants about " + check.approx,
      };
    }
    if (check.min != null && n < check.min) {
      return { passed: false, detail: "found " + label + ": " + g + ", and this wants at least " + check.min };
    }
    if (check.max != null && n > check.max) {
      return { passed: false, detail: "found " + label + ": " + g + ", and this wants at most " + check.max };
    }
    return true;
  }

  if (g === want) return true;
  return { passed: false, detail: "found " + label + ": " + sawNothing };
}

/**
 * The verdict of a `layout` check's `rel`: are these elements in a row, or
 * stacked one above another?
 *
 * This is the flexbox question, and it is deliberately not a computed-style
 * question. `display: flex` on the parent tells you the student typed the
 * property; it does not tell you the cards ended up side by side — `flex-wrap`,
 * a width, or a `flex-direction` further down can all still stack them. Real
 * boxes are the only honest answer, so this compares vertical overlap: two
 * elements in the same row overlap vertically, two stacked ones cannot.
 *
 * Injected by source, hence ES5 with no outer references.
 *
 * @param {object} check
 * @param {Array<{top: number, height: number}>} boxes One per matched element.
 * @returns {true|{passed: false, detail: string}}
 */
export function relationVerdict(check, boxes) {
  if (!boxes || boxes.length < 2) {
    var n = boxes ? boxes.length : 0;
    return {
      passed: false,
      detail: 'this compares the position of two or more "' + check.selector + '" elements, and the page has ' +
        (n === 0 ? "none" : "only one"),
    };
  }

  var pairs = 0;
  var overlapping = 0;
  for (var i = 0; i < boxes.length; i++) {
    for (var j = i + 1; j < boxes.length; j++) {
      pairs += 1;
      var a = boxes[i];
      var b = boxes[j];
      // A shared row means the two boxes cover some of the same vertical space.
      if (a.top < b.top + b.height && b.top < a.top + a.height) overlapping += 1;
    }
  }

  if (check.rel === "sameRow") {
    if (overlapping === pairs) return true;
    return { passed: false, detail: "they are still stacked one above another, not side by side" };
  }
  if (check.rel === "stacked") {
    if (overlapping === 0) return true;
    return { passed: false, detail: "they are still side by side, not stacked one above another" };
  }
  return { passed: false, detail: 'unknown rel "' + check.rel + '"' };
}

/**
 * Find a rule in the student's CSS source: "did you write `.btn:hover { … }`?"
 *
 * The one checker that reads what was WRITTEN rather than what the browser
 * computed, because `:hover` and `@media` describe states the page is not
 * currently in. No width trick reaches a hover state, and nothing computed
 * reports a rule that is not currently applying, so the source is the only
 * place the answer lives.
 *
 * Matching is forgiving about everything that does not change meaning —
 * whitespace, case, the spacing around combinators and colons, the brackets
 * around a media condition — and strict about everything that does.
 *
 * Injected by source, hence ES5 with no outer references. `norm` arrives as an
 * argument for the same reason.
 *
 * @param {string} cssText Every stylesheet on the page, concatenated.
 * @param {object} check   { selector, prop, value?, media? }
 * @param {(v: any) => string} norm
 * @returns {true|{passed: false, detail: string}}
 */
export function findCssRule(cssText, check, norm) {
  // Comments can hold anything, including a commented-out version of the very
  // rule being asked for. Strip them first so one cannot pass a check.
  var src = String(cssText == null ? "" : cssText).replace(/\/\*[\s\S]*?\*\//g, "");

  // "Same meaning" normalisation: `.a > .b` and `.a>.b` are one selector, and
  // `(max-width: 600px)` and `max-width:600px` are one condition.
  function tidySelector(s) {
    return norm(s).replace(/\s*([>+~])\s*/g, "$1");
  }
  function tidyCondition(s) {
    return norm(s).replace(/[()]/g, "").replace(/\s*:\s*/g, ":").replace(/\s+and\s+/g, " and ");
  }

  var wantSelector = tidySelector(check.selector);
  var wantProp = norm(check.prop);
  var wantMedia = check.media == null ? null : tidyCondition(check.media);
  var wantValue = check.value == null ? null : norm(check.value);

  // What the walk learned, for a failure message that says which step broke.
  var selectorSeenAnywhere = false;
  var selectorSeenHere = false;   // ...inside the right media block
  var valuesFound = [];

  function scan(text, media) {
    var at = 0;
    while (at < text.length) {
      var open = text.indexOf("{", at);
      if (open === -1) return;

      var prelude = text.substring(at, open).trim();

      // Walk to this block's own closing brace, counting nested ones so an
      // @media body is taken whole rather than cut at its first inner rule.
      var depth = 1;
      var k = open + 1;
      while (k < text.length && depth > 0) {
        var ch = text.charAt(k);
        if (ch === "{") depth += 1;
        else if (ch === "}") depth -= 1;
        k += 1;
      }
      var body = text.substring(open + 1, depth === 0 ? k - 1 : text.length);
      at = k;

      if (prelude.charAt(0) === "@") {
        // Only @media nests rules in a way this course uses. Anything else
        // (@import, @font-face, @keyframes) holds no rule worth finding.
        // The recursive result has to be carried back out: a rule found inside
        // the block is still found.
        if (/^@media/i.test(prelude)) {
          if (scan(body, tidyCondition(prelude.replace(/^@media/i, ""))) === true) return true;
        }
        continue;
      }

      var selectors = prelude.split(",");
      var hit = false;
      for (var s = 0; s < selectors.length; s++) {
        if (tidySelector(selectors[s]) === wantSelector) hit = true;
      }
      if (!hit) continue;

      selectorSeenAnywhere = true;
      if (wantMedia !== null && media !== wantMedia) continue;
      selectorSeenHere = true;

      var decls = body.split(";");
      for (var d = 0; d < decls.length; d++) {
        var colon = decls[d].indexOf(":");
        if (colon === -1) continue;
        if (norm(decls[d].substring(0, colon)) !== wantProp) continue;
        var value = norm(decls[d].substring(colon + 1));
        if (wantValue === null || value.indexOf(wantValue) !== -1) return true;
        valuesFound.push(value);
      }
    }
    return undefined;
  }

  if (scan(src, null) === true) return true;

  var where = wantMedia === null ? "" : " inside @media (" + check.media + ")";
  if (!selectorSeenAnywhere) {
    return { passed: false, detail: 'there is no rule for "' + check.selector + '" in your CSS' };
  }
  if (!selectorSeenHere) {
    return {
      passed: false,
      detail: 'there is a rule for "' + check.selector + '", but not' + where,
    };
  }
  if (valuesFound.length) {
    return {
      passed: false,
      detail: 'the "' + check.selector + '" rule sets ' + check.prop + ": " + valuesFound[0],
    };
  }
  return {
    passed: false,
    detail: 'the "' + check.selector + '" rule' + where + " does not set " + check.prop,
  };
}

/**
 * The viewport width a width-sensitive check is graded at unless it says
 * otherwise.
 *
 * This constant exists because the visible preview is NOT a desktop viewport
 * and cannot be made into one. It is a pane inside a 1024px-capped lesson
 * sheet, which works out at roughly 469px on a desktop — and it is not even
 * stable at that: below the `lg` breakpoint the editor and the output unstack
 * and the preview jumps to about 940px. So grading a width-sensitive check
 * "where the student can see it" means grading it at a tablet width that
 * changes with the student's own screen. Two students would get two verdicts
 * for the same CSS, and `@media (max-width: 600px)` — the single most common
 * breakpoint anyone teaches — would be permanently active while grading.
 *
 * 1100 instead: a real desktop viewport, comfortably above any breakpoint this
 * course teaches, and the SAME on every device. A check that cares about width
 * either accepts this or names its own with `at`.
 */
export const DEFAULT_GRADING_WIDTH = 1100;

/**
 * The check types whose answer depends on the viewport width, and which are
 * therefore graded in a frame of known width rather than in the preview.
 *
 * `dom`, `console`, `link` and `every` are not here on purpose. They ask about
 * structure, text and terminal output, none of which a viewport width changes —
 * and `console` positively must stay in the preview, because that is the frame
 * whose console the student's own code wrote to.
 */
export const WIDTH_SENSITIVE_CHECKS = ['style', 'layout'];

/**
 * Which viewport width this check has to be measured at, or null for "the
 * preview frame, whatever width it happens to be".
 *
 * @param {object} check
 * @returns {number|null}
 */
export function gradingWidth(check) {
  if (check?.at != null) return Number(check.at);
  return WIDTH_SENSITIVE_CHECKS.includes(check?.type) ? DEFAULT_GRADING_WIDTH : null;
}

/**
 * Split a task's checks into the frames that have to measure them.
 *
 * A check with `at: 375` asks what the page looks like in a 375px-wide browser.
 * No amount of reading can answer that from another width: a `@media
 * (max-width: 600px)` rule is either applying or it is not. So the page is
 * rendered again in a hidden frame of exactly that width and the check is
 * graded there — and by {@link DEFAULT_GRADING_WIDTH}, so is every other
 * width-sensitive check, because the preview's own width is both too narrow and
 * not the same twice.
 *
 * What stays in the preview frame is everything a width cannot change:
 * structure, attributes, links, and console output.
 *
 * Every check keeps its authored position as `__index`, because the verdicts
 * come back from several frames and have to be put back in the order the author
 * wrote them.
 *
 * Pure, and the reason the multi-frame bookkeeping is testable at all.
 *
 * @param {Array<object>|null} checks
 * @returns {{ main: Array<object>|null,
 *             groups: Array<{width: number, checks: Array<object>}>,
 *             reporters: number }}
 *          `reporters` is how many frames will post a verdict — the count the
 *          parent waits for before it reports anything.
 */
export function partitionChecks(checks) {
  if (!checks || !checks.length) return { main: null, groups: [], reporters: 0 };

  const tagged = checks.map((check, index) => ({ ...check, __index: index }));
  const main = tagged.filter((c) => gradingWidth(c) === null);
  const widths = [...new Set(tagged.map(gradingWidth).filter((w) => w !== null))]
    .sort((a, b) => a - b);
  const groups = widths.map((width) => ({
    width,
    checks: tagged.filter((c) => gradingWidth(c) === width),
  }));

  return {
    main: main.length ? main : null,
    groups,
    reporters: (main.length ? 1 : 0) + groups.length,
  };
}

/**
 * The shim injected as the very first thing in <head>.
 *
 * Written as an old-school IIFE with no template literals or arrow functions:
 * it is embedded into a JS template string here, and it is also the one script
 * that must never itself throw, including in an older browser.
 */
const RUNTIME = `
(function () {
  var RUN_ID = "__RUN_ID__";
  var SOURCE = "__SOURCE__";
  var logs = [];

  function send(msg) {
    try {
      msg.source = SOURCE;
      msg.runId = RUN_ID;
      parent.postMessage(msg, "*");
    } catch (e) { /* frame detached mid-run */ }
  }

  function norm(s) {
    return String(s == null ? "" : s).replace(/\\s+/g, " ").trim().toLowerCase();
  }

  // Turn any console argument into one readable line of terminal text.
  function fmt(value) {
    if (typeof value === "string") return value;
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    var t = typeof value;
    if (t === "number" || t === "boolean" || t === "bigint") return String(value);
    if (t === "symbol") return value.toString();
    if (t === "function") return "function " + (value.name || "") + "()";
    if (value instanceof Error) return value.name + ": " + value.message;
    if (typeof Element !== "undefined" && value instanceof Element) {
      return "<" + value.tagName.toLowerCase() + (value.id ? " id=\\"" + value.id + "\\"" : "") + ">";
    }
    try {
      var seen = [];
      return JSON.stringify(value, function (k, v) {
        if (typeof v === "object" && v !== null) {
          if (seen.indexOf(v) !== -1) return "[Circular]";
          seen.push(v);
        }
        return v;
      }, 2);
    } catch (e) {
      return String(value);
    }
  }

  function emit(level, args) {
    var text = Array.prototype.map.call(args, fmt).join(" ");
    logs.push(text);
    send({ kind: "console", level: level, text: text });
  }

  // Keep the real console so the browser devtools still show everything.
  var real = {};
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    real[level] = console[level];
    console[level] = function () {
      try { real[level].apply(console, arguments); } catch (e) { /* ignore */ }
      emit(level === "debug" ? "log" : level, arguments);
    };
  });

  window.onerror = function (message, src, line, col) {
    var where = line ? " (line " + line + (col ? ":" + col : "") + ")" : "";
    send({ kind: "error", text: String(message) + where });
    return false; // let the browser log it too
  };

  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    send({ kind: "error", text: "Unhandled promise rejection: " + fmt(r) });
  });

  // A note from the sandbox itself, not from the student's code. Deliberately
  // NOT pushed into \`logs\`, so a sandbox note can never satisfy a console check.
  function note(text) {
    send({ kind: "console", level: "info", text: text });
  }

  // --- The tab bar ---------------------------------------------------------
  // <title> is invisible inside the frame, which makes it impossible to teach.
  // The parent draws a mock browser tab above the preview; this reports what
  // should be written on it.

  var lastTitle = null;
  function reportTitle() {
    var t = document.title || "";
    if (t === lastTitle) return;
    lastTitle = t;
    send({ kind: "title", text: t });
  }

  // --- Links ---------------------------------------------------------------
  // A real navigation would replace the preview with somewhere else entirely -
  // an error page, most likely, since the frame has an opaque origin. So an
  // off-page link is reported instead of followed, and an in-page one is
  // allowed through so the student can watch a fragment link actually work.
  //
  // Capture phase, so this runs before any handler the student wrote.
  // Keyboard activation is covered by the same listener: pressing Enter on a
  // focused link dispatches a click event, it does not navigate directly.
  document.addEventListener("click", function (e) {
    var el = e.target;
    var a = el && el.closest ? el.closest("a") : null;
    if (!a) return;
    if (!a.hasAttribute("href")) {
      note("This <a> has no href attribute, so it is not a link yet.");
      return;
    }

    var href = a.getAttribute("href");
    var blank = a.getAttribute("target") === "_blank"
      ? ' It has target="_blank", so it would open in a new tab.'
      : "";

    if (href.charAt(0) === "#") {
      var id = href.slice(1);
      if (!id) {
        note('This link goes to "#", which means the top of this page.');
        return;
      }
      if (document.getElementById(id)) {
        note("Jumping to #" + id + " on this page." + blank);
        return; // let the frame scroll - this one really works
      }
      e.preventDefault();
      note('This link points to #' + id + ', but nothing on this page has id="' + id + '" yet.');
      return;
    }

    e.preventDefault();
    note("This link would go to: " + href + blank);
  }, true);

  // --- Forms ---------------------------------------------------------------
  // Submitting a real form navigates: the browser leaves for the action URL, or
  // reloads with the values in the address bar. Either one would wipe the
  // preview mid-lesson. Reported instead.
  //
  // Capture phase, but preventDefault only - propagation is untouched, so a
  // student's own submit handler still runs. Covers both ways of submitting
  // (Enter in a field, clicking a submit button): both fire this same event.
  //
  // Nothing here touches label/input activation. Clicking a <label> is handled
  // by the browser itself and no listener below intercepts it, so it focuses a
  // text field and toggles a checkbox exactly as it would anywhere else.
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    note("Form submitted (nothing is sent anywhere)");
  }, true);

  // --- Images --------------------------------------------------------------
  // Map a handful of names onto built-in pictures WITHOUT touching the src the
  // student typed: srcset wins over src when the browser picks a source, so the
  // attribute stays exactly as written and the checks grade what was written.

  var SAMPLES = __SAMPLES__;
  // The same function the parent module exports and Node tests - injected by
  // source so there is only one copy of the rule.
  var resolveSampleName = __RESOLVE_SAMPLE__;

  function sampleFor(src) {
    var name = resolveSampleName(src);
    return name && Object.prototype.hasOwnProperty.call(SAMPLES, name) ? SAMPLES[name] : null;
  }

  function applySample(img) {
    if (img.getAttribute("data-webdev-sample") === "1") return;
    var typed = img.getAttribute("src");
    var svg = sampleFor(typed);
    if (!svg) return;

    var uri = "data:image/svg+xml;base64," + btoa(svg);
    img.setAttribute("data-webdev-sample", "1");
    // The student's own value, mirrored. runOne reads src through this, so a
    // check on src grades what they typed even if the fallback below fires.
    img.setAttribute("data-webdev-src", typed);
    img.setAttribute("srcset", uri);

    // Fallback for anything that ignores srcset here: only then is src itself
    // rewritten, and only after the mirror above is already in place.
    function rescue() {
      if (img.naturalWidth === 0 && img.getAttribute("src") !== uri) img.setAttribute("src", uri);
    }
    img.addEventListener("error", rescue);
    if (img.complete) rescue();
  }

  function sweepImages() {
    var imgs = document.getElementsByTagName("img");
    for (var i = 0; i < imgs.length; i++) applySample(imgs[i]);
  }

  // The document is still parsing when this runs, so everything below waits for
  // content - and repeats on load, which also catches elements added by the
  // student's own script.
  function afterParse() {
    sweepImages();
    reportTitle();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterParse);
  } else {
    afterParse();
  }
  window.addEventListener("load", function () {
    sweepImages();
    reportTitle();
    // A student who sets document.title from JS should see the tab change too.
    try {
      new MutationObserver(function () {
        reportTitle();
        sweepImages();
      }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    } catch (e) { /* no MutationObserver, no live updates */ }
  });

  // --- Task checks ---------------------------------------------------------
  // The parent can't read this document, so the verdicts are decided here.

  // Resolve an authored value ("red", "2rem") to the same computed form the
  // browser will report for the student's element, so "red" matches
  // "rgb(255, 0, 0)" instead of failing on spelling.
  function resolveStyle(prop, value) {
    var probe = document.createElement("div");
    probe.style.setProperty(prop, value);
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    var out = getComputedStyle(probe).getPropertyValue(prop);
    probe.parentNode.removeChild(probe);
    return norm(out);
  }

  // Read an attribute the way the student wrote it. Only src differs: a sample
  // image may have had its src rescued to a data URI (see applySample), and
  // grading that instead of "cat.jpg" would be grading our own code.
  function attrOf(el, name) {
    if (name === "src" && el.hasAttribute("data-webdev-src")) return el.getAttribute("data-webdev-src");
    return el.getAttribute(name);
  }

  // All injected by source from the parent module, so the Node tests grade
  // with this exact function rather than a second copy of the rule.
  var matchElementsFn = __MATCH_ELEMENTS__;
  var domVerdictFn = __DOM_VERDICT__;
  var everyVerdictFn = __EVERY_VERDICT__;
  var compareStyleValueFn = __COMPARE_STYLE__;
  var relationVerdictFn = __RELATION_VERDICT__;
  var findCssRuleFn = __FIND_CSS_RULE__;

  // Every stylesheet on the page, as text: the <style> this sandbox writes from
  // the css tab, plus any <style> the student put in their own HTML (which
  // Section 1 of Module 2 teaches them to do). Inline style="" attributes are
  // not rules and are correctly absent.
  function allCssText() {
    var styles = document.getElementsByTagName("style");
    var out = [];
    for (var i = 0; i < styles.length; i++) out.push(styles[i].textContent || "");
    return out.join("\\n");
  }

  // The authored value ("red", "2rem") resolved to the computed form the browser
  // reports, or undefined when the check is a numeric comparison with no
  // authored value to resolve.
  function wantedValue(check) {
    var authored = check.not != null ? check.not : check.value;
    if (authored == null) return undefined;
    // A "box" check measures a number of pixels rather than reading a property,
    // so there is no property to resolve the value through — and handing
    // resolveStyle an undefined prop would set a declaration named "undefined".
    if (!check.prop) return norm(authored);
    return resolveStyle(check.prop, authored);
  }

  // A width-sensitive check that fails is the one place the measurement width
  // matters to whoever reads the verdict. "found flex-direction: column" is
  // baffling on its own and obvious once it says which window it was measured
  // in - and it is the difference between a wrong rule and a rule being graded
  // at a width the author did not intend.
  function withWidth(out) {
    if (out === true || !out || out.passed) return out;
    var w = Math.round(window.innerWidth);
    return {
      passed: false,
      detail: (out.detail ? out.detail + " " : "") + "(measured at " + w + "px wide)",
    };
  }

  // "At least one of them" by default, "all of them" with every:true — the
  // difference between "a heading is green" and "every card has padding".
  function gradeEach(check, targets, read) {
    var want = wantedValue(check);
    var firstFailure = null;
    var failures = 0;

    for (var i = 0; i < targets.length; i++) {
      var out = compareStyleValueFn(check, read(targets[i]), want);
      if (out === true) {
        if (!check.every) return true;
      } else {
        failures += 1;
        if (firstFailure === null) firstFailure = out;
      }
    }

    if (check.every && failures === 0) return true;
    if (check.every && targets.length > 1) {
      return {
        passed: false,
        detail: failures + " of the " + targets.length + ' "' + check.selector + '" elements do not — ' +
          (firstFailure && firstFailure.detail ? firstFailure.detail : "no match"),
      };
    }
    return firstFailure || { passed: false, detail: "no match" };
  }

  var MATCH_CTX = {
    queryAll: function (selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector));
    },
    norm: norm,
    attrOf: attrOf,
  };

  function matchElements(check) {
    return matchElementsFn(check, MATCH_CTX);
  }

  function runOne(check) {
    if (check.type === "console") {
      var all = logs.join("\\n");
      var needle = String(check.contains);
      var hit = check.collapseSpace
        // Opt-in: also forgives run-together or extra spacing, for messages the
        // student types out by hand.
        ? norm(all).indexOf(norm(needle)) !== -1
        : check.caseSensitive
          ? all.indexOf(needle) !== -1
          : all.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
      if (hit) return true;
      // A console check that just says "no" is the least useful failure there
      // is. Say what the terminal actually holds.
      return {
        passed: false,
        detail: logs.length
          ? "the Terminal shows: " + logs.join(" | ").substring(0, 120)
          : "nothing was printed to the Terminal",
      };
    }

    // "This element points at that one": a label's for naming an input's id,
    // and anything else built the same way. No existing check type can compare
    // one element's attribute against another element's attribute, and every
    // way of getting it wrong deserves a different sentence back.
    if (check.type === "link") {
      var sources = Array.prototype.slice.call(document.querySelectorAll(check.selector));
      var targets = Array.prototype.slice.call(document.querySelectorAll(check.target));
      var withAttr = [];
      var s, t;

      for (s = 0; s < sources.length; s++) {
        if (norm(sources[s].getAttribute(check.attr)) !== "") withAttr.push(sources[s]);
      }

      for (s = 0; s < withAttr.length; s++) {
        if (check.requireText && norm(withAttr[s].textContent) === "") continue;
        var want = norm(withAttr[s].getAttribute(check.attr));
        for (t = 0; t < targets.length; t++) {
          if (norm(targets[t].getAttribute(check.targetAttr)) === want) return true;
        }
      }

      // Nothing matched. Work out which mistake it was.
      if (!sources.length) {
        return { passed: false, detail: "there is no " + check.selector + " element on the page" };
      }
      if (!withAttr.length) {
        return {
          passed: false,
          detail: 'the ' + check.selector + ' has no ' + check.attr + ' attribute - ' + check.attr +
            ' is what makes the connection, and an id or a name on it does not',
        };
      }
      if (check.requireText) {
        var anyText = false;
        for (s = 0; s < withAttr.length; s++) {
          if (norm(withAttr[s].textContent) !== "") anyText = true;
        }
        if (!anyText) {
          return {
            passed: false,
            detail: 'the ' + check.selector + ' has no text between its tags, so there is nothing to click or read',
          };
        }
      }
      var found = [];
      for (t = 0; t < targets.length; t++) {
        var got = targets[t].getAttribute(check.targetAttr);
        if (got) found.push('"' + got + '"');
      }
      return {
        passed: false,
        detail: check.attr + '="' + withAttr[0].getAttribute(check.attr) + '" does not match any ' +
          check.target + " " + check.targetAttr + " on the page" +
          (found.length
            ? " (found " + found.join(", ") + ")"
            : " (no " + check.target + " on the page has a " + check.targetAttr + " at all)"),
      };
    }

    if (check.type === "dom") {
      return domVerdictFn(check, matchElements(check));
    }

    // "ALL of them, not just one of them" - the rubric's question.
    if (check.type === "every") {
      return everyVerdictFn(check, MATCH_CTX.queryAll(check.selector), matchElements(check));
    }

    // Style checks report what they actually found when they fail. "The
    // heading is not dark green" is much less useful than that plus "found
    // color: rgb(0, 0, 0)", which tells the student whether their rule was
    // ignored entirely or just set to the wrong value.
    if (check.type === "style") {
      var styleTargets = matchElements(check);
      if (!styleTargets.length) {
        return { passed: false, detail: 'nothing on the page matches "' + check.selector + '"' };
      }
      return withWidth(gradeEach(check, styleTargets, function (el) {
        return norm(getComputedStyle(el).getPropertyValue(check.prop));
      }));
    }

    // "How big is it, and where did it end up" — the questions a computed value
    // cannot answer. "box" measures the real rendered size, which is the only
    // way to show what box-sizing changed; "rel" compares positions, which is
    // the only way to show that flexbox actually put the cards in a row.
    //
    // A layout check with "at" is graded in a frame of that width (the parent
    // mounts it; see partitionChecks), so by the time it reaches here the
    // window is already the right size and "at" needs no handling.
    if (check.type === "layout") {
      var layoutTargets = matchElements(check);
      if (!layoutTargets.length) {
        return { passed: false, detail: 'nothing on the page matches "' + check.selector + '"' };
      }

      if (check.rel) {
        var boxes = [];
        for (var b = 0; b < layoutTargets.length; b++) {
          var rect = layoutTargets[b].getBoundingClientRect();
          boxes.push({ top: rect.top, height: rect.height });
        }
        return withWidth(relationVerdictFn(check, boxes));
      }

      if (check.box) {
        return withWidth(gradeEach(check, layoutTargets, function (el) {
          var r = el.getBoundingClientRect();
          return (check.box === "height" ? r.height : r.width) + "px";
        }));
      }

      return withWidth(gradeEach(check, layoutTargets, function (el) {
        return norm(getComputedStyle(el).getPropertyValue(check.prop));
      }));
    }

    // "Did you write this rule?" — for :hover and @media, states the page is
    // not currently in, so the source is the only place to look.
    if (check.type === "cssRule") {
      return findCssRuleFn(allCssText(), check, norm);
    }

    return false;
  }

  // A verdict must ALWAYS be posted. A check that throws becomes a failed
  // check, and a grader that throws outright still reports every check as
  // failed with the reason attached — a frame that goes silent is worse than
  // one that reports bad news, because silence looks like a hang.
  function runChecks(checks) {
    var results;
    try {
      results = checks.map(function (check, index) {
        // __index is the check's position in what the AUTHOR wrote. It differs
        // from "index" whenever the parent split the checks across frames to
        // measure some of them at another width, and it is what lets the
        // verdicts be put back in the authored order.
        var at = check && check.__index != null ? check.__index : index;
        try {
          // runOne answers with a boolean, or with { passed, detail } when it
          // has something useful to say about why it failed.
          var out = runOne(check);
          var verdict = out === true || !!(out && out.passed);
          var note = out && out.detail ? out.detail : undefined;
          return { index: at, passed: verdict, message: check.message, detail: note };
        } catch (e) {
          return {
            index: at,
            passed: false,
            message: check.message,
            detail: "this check could not run: " + (e && e.message ? e.message : String(e)),
          };
        }
      });
    } catch (e) {
      var reason = "the grader failed: " + (e && e.message ? e.message : String(e));
      // Rebuild the result list with a plain loop rather than checks.map: if
      // the checks array is malformed enough to have broken the grader, its
      // own map may throw too, and a throw in here would escape and silence
      // the frame - the exact failure this whole block exists to prevent.
      // (No backticks in this comment: it lives inside a template literal.)
      results = [];
      try {
        var count = checks && typeof checks.length === "number" ? checks.length : 0;
        for (var i = 0; i < count; i++) {
          var c = checks[i];
          var ci = c && c.__index != null ? c.__index : i;
          results.push({ index: ci, passed: false, message: c && c.message, detail: reason });
        }
      } catch (inner) {
        results = [{ index: 0, passed: false, message: "This task could not be graded.", detail: reason }];
      }
      if (!results.length) {
        results = [{ index: 0, passed: false, message: "This task could not be graded.", detail: reason }];
      }
      send({ kind: "error", text: reason });
    }
    send({ kind: "checks", results: results });
  }

  window.__webdevRunChecks = runChecks;
  send({ kind: "ready" });
})();
`;

/** The tail script that grades the task, if there is one. */
function checksScript(checks, runId) {
  if (!checks || !checks.length) return '';
  const payload = escapeScript(JSON.stringify(checks));
  // Wait for load so images/late scripts have settled, then give the event
  // loop one tick — enough for a student's `setTimeout(…, 0)` to have fired.
  // Independent of the runtime script above: if that one failed to parse,
  // __webdevRunChecks won't exist, and without this fallback the frame would
  // simply never answer. Posting the bad news directly is the difference
  // between a visible error and an apparent hang.
  return `<script>
(function () {
  var checks = ${payload};
  function report() {
    try {
      if (typeof window.__webdevRunChecks === "function") {
        window.__webdevRunChecks(checks);
        return;
      }
      throw new Error("the sandbox runtime did not load");
    } catch (e) {
      var reason = e && e.message ? e.message : String(e);
      try {
        parent.postMessage({
          source: "${RUNNER_SOURCE}",
          runId: "${runId}",
          kind: "checks",
          results: checks.map(function (c, i) {
            return {
              index: c && c.__index != null ? c.__index : i,
              passed: false,
              message: c && c.message,
              detail: reason,
            };
          })
        }, "*");
      } catch (ignored) { /* frame detached */ }
    }
  }
  var run = function () { setTimeout(report, 30); };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
</script>`;
}

/**
 * Compose the full document for one run.
 *
 * Student HTML is accepted either as a fragment (`<h1>Hi</h1>`) or as a whole
 * page (`<!DOCTYPE html><html>…`), because both are things this course teaches
 * students to write. A whole page is injected into rather than wrapped, so the
 * student's own <head>/<body> stay exactly where they wrote them.
 *
 * @param {object} options
 * @param {string} [options.html]
 * @param {string} [options.css]
 * @param {string} [options.js]
 * @param {Array<object>} [options.checks] Task checks, graded inside the frame.
 * @param {number|string} options.runId    Echoed back on every message.
 * @returns {string} A complete HTML document for `<iframe srcDoc>`.
 */
export function buildSrcDoc({ html = '', css = '', js = '', checks = null, runId = 0 }) {
  const runtime = RUNTIME
    .replace('__RUN_ID__', String(runId))
    .replace('__SOURCE__', RUNNER_SOURCE)
    // Function form: a "$" in the payload would otherwise be a replacement token.
    .replace('__SAMPLES__', () => escapeScript(JSON.stringify(SAMPLE_IMAGES)))
    .replace('__RESOLVE_SAMPLE__', () => resolveSampleName.toString())
    .replace('__MATCH_ELEMENTS__', () => matchElements.toString())
    .replace('__DOM_VERDICT__', () => domVerdict.toString())
    .replace('__EVERY_VERDICT__', () => everyVerdict.toString())
    .replace('__COMPARE_STYLE__', () => compareStyleValue.toString())
    .replace('__RELATION_VERDICT__', () => relationVerdict.toString())
    .replace('__FIND_CSS_RULE__', () => findCssRule.toString());

  const head =
    `<script>${runtime}</script>` +
    (css.trim() ? `<style>\n${css}\n</style>` : '');

  const tail =
    (js.trim() ? `<script>\n${escapeScript(js)}\n</script>` : '') +
    checksScript(checks, runId);

  const body = String(html ?? '').replace(/<!doctype[^>]*>/i, '');

  // Fragment: wrap it in a minimal page of our own.
  if (!/<html[\s>]/i.test(body)) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">${head}</head>` +
      `<body>${body}${tail}</body></html>`;
  }

  // Whole page: splice our head and tail into the student's own structure.
  let doc = body;
  if (/<head[\s>]/i.test(doc)) {
    doc = doc.replace(/<head([^>]*)>/i, (match) => match + head);
  } else {
    doc = doc.replace(/<html([^>]*)>/i, (match) => `${match}<head>${head}</head>`);
  }

  if (/<\/body>/i.test(doc)) doc = doc.replace(/<\/body>/i, tail + '</body>');
  else if (/<\/html>/i.test(doc)) doc = doc.replace(/<\/html>/i, tail + '</html>');
  else doc += tail;

  return `<!DOCTYPE html>${doc}`;
}

/** A blank document — used to tear down a run (e.g. a runaway loop). */
export const BLANK_DOC = '<!DOCTYPE html><html><head></head><body></body></html>';
