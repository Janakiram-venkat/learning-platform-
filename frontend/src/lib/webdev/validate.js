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
const CHECK_TYPES = ['dom', 'console', 'style', 'link'];
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
    if (!isNonEmptyString(check.value)) bad(`${at} (style) has no expected "value".`);
    if (check.prop && /[A-Z]/.test(check.prop)) {
      bad(`${at} (style) prop "${check.prop}" should be CSS spelling (background-color), not JavaScript (backgroundColor).`);
    }
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
