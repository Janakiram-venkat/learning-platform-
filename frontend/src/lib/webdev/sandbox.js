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
    '<circle cx="101" cy="85" r="4" fill="#16241d"/><circle cx="139" cy="85" r="4" fill="#16241d"/>' +
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
    '<rect x="8" y="8" width="144" height="144" rx="28" fill="#16241d"/>' +
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

  // Both injected by source from the parent module, so the Node tests grade
  // with this exact function rather than a second copy of the rule.
  var matchElementsFn = __MATCH_ELEMENTS__;
  var domVerdictFn = __DOM_VERDICT__;

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

    // Style checks report what they actually found when they fail. "The
    // heading is not dark green" is much less useful than that plus "found
    // color: rgb(0, 0, 0)", which tells the student whether their rule was
    // ignored entirely or just set to the wrong value.
    if (check.type === "style") {
      var targets = matchElements(check);
      if (!targets.length) {
        return { passed: false, detail: 'nothing on the page matches "' + check.selector + '"' };
      }
      var want = resolveStyle(check.prop, check.value);
      var found = null;
      for (var t = 0; t < targets.length; t++) {
        var got = norm(getComputedStyle(targets[t]).getPropertyValue(check.prop));
        if (got === want) return true;
        if (found === null) found = got;
      }
      return { passed: false, detail: "found " + check.prop + ": " + found };
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
        try {
          // runOne answers with a boolean, or with { passed, detail } when it
          // has something useful to say about why it failed.
          var out = runOne(check);
          var verdict = out === true || !!(out && out.passed);
          var note = out && out.detail ? out.detail : undefined;
          return { index: index, passed: verdict, message: check.message, detail: note };
        } catch (e) {
          return {
            index: index,
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
          results.push({ index: i, passed: false, message: c && c.message, detail: reason });
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
            return { index: i, passed: false, message: c && c.message, detail: reason };
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
    .replace('__DOM_VERDICT__', () => domVerdict.toString());

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
