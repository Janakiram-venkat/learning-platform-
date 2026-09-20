// Regenerate the web-dev backend stubs from the frontend lesson data.
//
//   node scripts/sync-webdev-course.mjs          # write
//   node scripts/sync-webdev-course.mjs --check  # verify only, non-zero if stale
//
// The frontend data (src/data/webdev/) is the source of truth for this course:
// the lesson page reads it directly and never asks the API. But the dashboard's
// course list DOES come from the backend, so backend/courses/webdev/ still has
// to exist and stay consistent. Rather than maintain the same module index in
// two places by hand, it's generated here.
//
// Only metadata crosses over — titles, ids, durations. No lesson content is
// duplicated, so there is nothing to drift apart.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COURSE_DIR = resolve(HERE, '../../backend/courses/webdev');
const DATA_FILE = resolve(HERE, '../src/data/webdev/module1/index.js');

const check = process.argv.includes('--check');

// The data file imports React-flavoured modules, so rather than executing it we
// read the two plain-object literals it exports. They're authored as simple
// arrays/objects precisely so this stays a regex away, not a bundler away.
const source = readFileSync(DATA_FILE, 'utf8');

function extract(name) {
  const m = source.match(new RegExp(`export const ${name} = ([\\s\\S]*?);\\n`));
  if (!m) throw new Error(`Could not find "export const ${name}" in ${DATA_FILE}`);
  // The literals contain only strings, numbers, booleans, null and identifiers
  // used as `section:` values — strip those identifiers to null before parsing.
  const body = m[1].replace(/section:\s*[A-Za-z_$][\w$]*/g, 'section: null');
  // Build-time only, evaluating a literal from our own source file.
  return new Function(`return (${body});`)();
}

const SECTIONS = extract('SECTIONS');
const MODULE = extract('MODULE');
const COURSE = extract('COURSE');

const courseJson = {
  ...COURSE,
  // The web-dev lesson page renders its own runners per block, so it opts out
  // of the shared Python editor panel.
  hasEditor: false,
  modules: [{ id: MODULE.moduleId, title: MODULE.title, file: `module${MODULE.moduleId}.json` }],
};

const moduleJson = {
  moduleId: MODULE.moduleId,
  title: MODULE.title,
  emoji: MODULE.emoji,
  tagline: MODULE.tagline,
  lessons: SECTIONS.map((s) => ({ lessonId: s.id, title: s.title, duration: s.duration })),
  hasProject: MODULE.hasProject,
  hasLab: false,
};

const targets = [
  [resolve(COURSE_DIR, 'course.json'), courseJson],
  [resolve(COURSE_DIR, `module${MODULE.moduleId}.json`), moduleJson],
];

let stale = 0;
for (const [path, value] of targets) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  let current = null;
  try { current = readFileSync(path, 'utf8'); } catch { /* new file */ }

  if (current === next) {
    console.log(`  up to date  ${path}`);
    continue;
  }
  stale += 1;
  if (check) {
    console.error(`  STALE       ${path}`);
  } else {
    writeFileSync(path, next, 'utf8');
    console.log(`  written     ${path}`);
  }
}

if (check && stale) {
  console.error(`\n${stale} file(s) out of date. Run: node scripts/sync-webdev-course.mjs`);
  process.exit(1);
}
console.log(stale ? '\nBackend stubs regenerated.' : '\nBackend stubs already match.');
