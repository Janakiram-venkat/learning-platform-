// Author-time validation for lesson section data.
//
// Lesson content is hand-written data, and the failure mode of a typo is nasty:
// a task whose check can never pass, a quiz whose answerIndex points past the
// end of its options, two pages sharing an id so progress is recorded against
// the wrong one. None of that throws — it just quietly misbehaves in front of a
// student.
//
// So every section is checked on import in dev and the problems are printed
// with the exact page id to go and look at. In production the caller guards
// with `import.meta.env.DEV`, so this never runs and bundlers drop it.

const PAGE_TYPES = ['content', 'task', 'quiz'];
const BLOCK_TYPES = ['text', 'tip', 'warning', 'example'];
const CHECK_TYPES = ['dom', 'console', 'style', 'link', 'every', 'layout', 'cssRule'];
/** The ways a style/layout check can describe a value. */
const VALUE_MODES = ['value', 'not', 'min', 'max', 'approx'];
const BOXES = ['width', 'height'];
const RELATIONS = ['sameRow', 'stacked'];
const FILE_KEYS = ['html', 'css', 'js'];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Check one section and return a list of human-readable problems.
 * Pure — it prints nothing, so it can also be used from a build script.
 *
 * @param {object} section
 * @returns {string[]} Empty when the section is well-formed.
 */
export function checkSection(section) {
  const errors = [];
  const where = section?.id ? `section "${section.id}"` : 'an unnamed section';
  const fail = (msg) => errors.push(`${where}: ${msg}`);

  if (!section || typeof section !== 'object') return [`${where} is not an object.`];
  if (!isNonEmptyString(section.id)) fail('missing an "id".');
  if (!isNonEmptyString(section.title)) fail('missing a "title".');
  if (!Array.isArray(section.pages) || section.pages.length === 0) {
    fail('has no "pages" array.');
    return errors;
  }

  const seen = new Set();

  section.pages.forEach((page, i) => {
    const at = page?.id ? `page "${page.id}"` : `page #${i + 1}`;
    const bad = (msg) => fail(`${at} ${msg}`);

    if (!isNonEmptyString(page?.id)) {
      bad('has no "id" (progress is recorded against page ids, so each one needs a unique id).');
    } else if (seen.has(page.id)) {
      bad('has a duplicate id — two pages sharing an id share their progress.');
    } else {
      seen.add(page.id);
    }

    if (!PAGE_TYPES.includes(page?.type)) {
      bad(`has type "${page?.type}" — expected one of ${PAGE_TYPES.join(', ')}.`);
      return;
    }

    if (page.type === 'content') validateContent(page, bad);
    if (page.type === 'task') validateTask(page, bad);
    if (page.type === 'quiz') validateQuiz(page, bad);

    // A page the student can't fail can't gate anything, so `required` on a
    // content page is always an authoring slip.
    if (page.required && page.type === 'content') {
      bad('is marked required, but a content page has nothing to pass — it would lock the section forever.');
    }
  });

  return errors;
}

function validateContent(page, bad) {
  if (!Array.isArray(page.blocks) || page.blocks.length === 0) {
    bad('has no "blocks".');
    return;
  }
  page.blocks.forEach((block, i) => {
    const at = `block #${i + 1} (${block?.type})`;
    if (!BLOCK_TYPES.includes(block?.type)) {
      bad(`${at} is not a known block type — expected ${BLOCK_TYPES.join(', ')}.`);
      return;
    }
    if (['text', 'tip', 'warning'].includes(block.type) && !isNonEmptyString(block.md)) {
      bad(`${at} has no "md" text.`);
    }
    if (block.type === 'example') {
      if (!block.files || !FILE_KEYS.some((k) => isNonEmptyString(block.files[k]))) {
        bad(`${at} has no code in "files".`);
      }
      validateTabs(block.tabs, block.files, `${at}`, bad);
      if (!isNonEmptyString(block.caption)) {
        bad(`${at} has no caption — every example should say what to look at.`);
      }
    }
  });
}

function validateTask(page, bad) {
  if (!isNonEmptyString(page.prompt)) bad('has no "prompt".');
  if (!page.starter || !FILE_KEYS.some((k) => isNonEmptyString(page.starter[k]))) {
    bad('has no "starter" code.');
  }
  validateTabs(page.tabs, page.starter, 'task', bad);

  if (!Array.isArray(page.checks) || page.checks.length === 0) {
    bad('has no "checks" — a task with no checks can never be passed.');
  } else {
    page.checks.forEach((check, i) => validateCheck(check, `check #${i + 1}`, bad));
  }

  if (!page.solution) {
    bad('has no "solution" (offered after repeated failures).');
  } else if (page.tabs?.length) {
    // The solution is shown through the same tabs as the task, so a tab with
    // nothing behind it renders an empty editor.
    page.tabs.forEach((t) => {
      if (!isNonEmptyString(page.solution[t])) {
        bad(`solution has nothing for the "${t}" tab.`);
      }
    });
  }
}

function validateQuiz(page, bad) {
  if (!Array.isArray(page.questions) || page.questions.length === 0) {
    bad('has no "questions".');
    return;
  }
  page.questions.forEach((q, i) => {
    const at = `question #${i + 1}`;
    if (!isNonEmptyString(q?.q)) bad(`${at} has no question text.`);
    if (!Array.isArray(q?.options) || q.options.length < 2) {
      bad(`${at} needs at least two options.`);
      return;
    }
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
      bad(`${at} has answerIndex ${q.answerIndex}, which is outside its ${q.options.length} options.`);
    }
    if (new Set(q.options).size !== q.options.length) {
      bad(`${at} has two identical options.`);
    }
    if (!isNonEmptyString(q.explanation)) {
      bad(`${at} has no explanation — students see one after answering.`);
    }
  });
}

function validateCheck(check, at, bad) {
  if (!CHECK_TYPES.includes(check?.type)) {
    bad(`${at} has type "${check?.type}" — expected ${CHECK_TYPES.join(', ')}.`);
    return;
  }
  if (!isNonEmptyString(check.message)) {
    bad(`${at} has no "message" — that text is all the student sees when it fails.`);
  }
  if (check.type === 'dom' && !isNonEmptyString(check.selector)) {
    bad(`${at} (dom) has no "selector".`);
  }
  // "every <selector> also satisfies these filters". A filterless one asks
  // whether every element is itself, which is true of any page.
  if (check.type === 'every') {
    if (!isNonEmptyString(check.selector)) bad(`${at} (every) has no "selector".`);
    const FILTERS = ['attr', 'text', 'textNonEmpty', 'attrNot', 'attrNotPattern'];
    if (!FILTERS.some((f) => check[f] != null)) {
      bad(`${at} (every) has no filter — it would pass on any page. Add one of ${FILTERS.join(', ')}.`);
    }
    if (typeof check.count === 'number') {
      bad(`${at} (every) uses "count", which it ignores — use "minCount" for "and there is at least one".`);
    }
  }
  if (check.type === 'console' && !isNonEmptyString(check.contains)) {
    bad(`${at} (console) has no "contains" text to look for.`);
  }
  // "one element's attribute names another element" — label[for] -> input[id].
  if (check.type === 'link') {
    ['selector', 'attr', 'target', 'targetAttr'].forEach((field) => {
      if (!isNonEmptyString(check[field])) bad(`${at} (link) has no "${field}".`);
    });
  }
  if (check.type === 'style') {
    if (!isNonEmptyString(check.selector)) bad(`${at} (style) has no "selector".`);
    if (!isNonEmptyString(check.prop)) bad(`${at} (style) has no CSS "prop".`);
    validateValueModes(check, `${at} (style)`, bad);
    validateCssProp(check, `${at} (style)`, bad);
  }

  // "How big is it, and where did it end up" — geometry, not a computed value.
  if (check.type === 'layout') {
    if (!isNonEmptyString(check.selector)) bad(`${at} (layout) has no "selector".`);

    const ways = ['prop', 'box', 'rel'].filter((k) => check[k] != null);
    if (ways.length === 0) {
      bad(`${at} (layout) must measure something — give it a "prop", a "box" (${BOXES.join('/')}) or a "rel" (${RELATIONS.join('/')}).`);
    } else if (ways.length > 1) {
      bad(`${at} (layout) sets ${ways.join(' and ')} — a layout check measures one thing, so split it into ${ways.length} checks.`);
    }

    if (check.box != null && !BOXES.includes(check.box)) {
      bad(`${at} (layout) has box "${check.box}" — expected ${BOXES.join(' or ')}.`);
    }
    if (check.rel != null && !RELATIONS.includes(check.rel)) {
      bad(`${at} (layout) has rel "${check.rel}" — expected ${RELATIONS.join(' or ')}.`);
    }
    // A relation compares positions, so it has no value to compare against.
    if (check.rel != null) {
      const stray = VALUE_MODES.filter((k) => check[k] != null);
      if (stray.length) {
        bad(`${at} (layout) has rel "${check.rel}" and also ${stray.join('/')}, which a relation ignores.`);
      }
    } else {
      validateValueModes(check, `${at} (layout)`, bad);
    }
    if (check.prop != null) validateCssProp(check, `${at} (layout)`, bad);
    // A box is a number of pixels, so only the numeric modes can describe it.
    if (check.box != null && (check.value != null || check.not != null)) {
      bad(`${at} (layout) measures a "box" in pixels — use min/max/approx rather than value/not.`);
    }
  }

  // "Did you write this rule?" — read from the student's CSS source, for the
  // states (:hover) and conditions (@media) nothing computed can report.
  if (check.type === 'cssRule') {
    if (!isNonEmptyString(check.selector)) bad(`${at} (cssRule) has no "selector".`);
    if (!isNonEmptyString(check.prop)) bad(`${at} (cssRule) has no CSS "prop".`);
    validateCssProp(check, `${at} (cssRule)`, bad);
    if (check.media != null && !isNonEmptyString(check.media)) {
      bad(`${at} (cssRule) has an empty "media" condition — drop it, or write one like "max-width: 600px".`);
    }
    // These describe a value read off the page, which this check never does.
    const unsupported = ['not', 'min', 'max', 'approx'].filter((k) => check[k] != null);
    if (unsupported.length) {
      bad(`${at} (cssRule) sets ${unsupported.join('/')}, which it ignores — it can only look for a property, optionally with a "value".`);
    }
  }

  // Available on style, layout and dom: "measure this at a viewport that wide".
  if (check.at != null) {
    if (!['style', 'layout', 'dom', 'every'].includes(check.type)) {
      bad(`${at} (${check.type}) has "at", which only a style, layout, dom or every check is measured with.`);
    }
    if (typeof check.at !== 'number' || !Number.isFinite(check.at) || check.at <= 0) {
      bad(`${at} has at "${check.at}" — expected a viewport width in pixels, like 375.`);
    }
  }
}

/** Exactly one of value/not/min/max/approx — they describe the same property. */
function validateValueModes(check, at, bad) {
  const modes = VALUE_MODES.filter((k) => check[k] != null);
  if (modes.length === 0) {
    bad(`${at} has nothing to compare against — add one of ${VALUE_MODES.join(', ')}.`);
    return;
  }
  // min+max is the one legitimate pair: a range.
  const isRange = modes.length === 2 && modes.includes('min') && modes.includes('max');
  if (modes.length > 1 && !isRange) {
    bad(`${at} sets ${modes.join(' and ')} — only min+max combine, so split the rest into separate checks.`);
  }
  if (check.tolerance != null && check.approx == null) {
    bad(`${at} has a "tolerance" but no "approx" — tolerance is how far from approx still counts.`);
  }
  ['min', 'max', 'approx', 'tolerance'].forEach((k) => {
    if (check[k] != null && typeof check[k] !== 'number') {
      bad(`${at} has ${k} "${check[k]}" — expected a plain number of pixels, not a string.`);
    }
  });
}

/** CSS spelling, not JavaScript: background-color, never backgroundColor. */
function validateCssProp(check, at, bad) {
  if (check.prop && /[A-Z]/.test(check.prop)) {
    bad(`${at} prop "${check.prop}" should be CSS spelling (background-color), not JavaScript (backgroundColor).`);
  }
}

function validateTabs(tabs, files, at, bad) {
  if (tabs == null) return; // defaults to ['html'] downstream
  if (!Array.isArray(tabs) || tabs.length === 0) {
    bad(`${at} has an empty "tabs" array.`);
    return;
  }
  tabs.forEach((t) => {
    if (!FILE_KEYS.includes(t)) bad(`${at} lists unknown tab "${t}".`);
    else if (files && !(t in files)) bad(`${at} shows a "${t}" tab but has no ${t} content.`);
  });
}

/**
 * Validate a list of sections, printing anything wrong. Intended for dev only.
 *
 * @param {object[]} sections
 * @returns {string[]} All problems found, across all sections.
 */
export function validateSections(sections) {
  const problems = sections.flatMap((s) => checkSection(s));

  const ids = sections.map((s) => s?.id).filter(Boolean);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  dupes.forEach((id) => problems.push(`Two sections share the id "${id}".`));

  if (problems.length) {
    console.error(
      `[webdev] ${problems.length} problem${problems.length === 1 ? '' : 's'} in lesson data:\n` +
      problems.map((p) => `  • ${p}`).join('\n'),
    );
  }
  return problems;
}
