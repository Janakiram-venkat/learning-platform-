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
const DATA_DIR = resolve(HERE, '../src/data/webdev');
const REGISTRY_FILE = resolve(DATA_DIR, 'index.js');

const check = process.argv.includes('--check');

// The data files import React-flavoured modules, so rather than executing them
// we read the plain-object literals they export. They're authored as simple
// arrays/objects precisely so this stays a regex away, not a bundler away.
function extract(file, name) {
  const source = readFileSync(file, 'utf8');
  // `\r?\n` because core.autocrlf checks these files out with CRLF endings on
  // Windows, and a bare `\n` then matches nothing and throws below.
  const m = source.match(new RegExp(`export const ${name} = ([\\s\\S]*?);\\r?\\n`));
  if (!m) throw new Error(`Could not find "export const ${name}" in ${file}`);
  // The literals contain only strings, numbers, booleans, null and identifiers
  // used as `section:` values — strip those identifiers to null before parsing.
  const body = m[1].replace(/section:\s*[A-Za-z_$][\w$]*/g, 'section: null');
  // Build-time only, evaluating a literal from our own source file.
  return new Function(`return (${body});`)();
}

const COURSE = extract(REGISTRY_FILE, 'COURSE');

// Which modules are public. An unreleased module is left out of the backend
// stubs entirely, so the dashboard's course list cannot advertise a module the
// sidebar refuses to draw — the two have to agree, and this is the one place
// that decides. MODULE_2_RELEASED is a plain boolean literal in the registry
// for exactly this reason; `import.meta.env.DEV` is a frontend-only concern and
// deliberately invisible here, because a dev server is not a release.
const MODULE_2_RELEASED = extract(REGISTRY_FILE, 'MODULE_2_RELEASED');

const MODULE_DIRS = [
  { dir: 'module1', released: true },
  { dir: 'module2', released: MODULE_2_RELEASED },
];

const modules = MODULE_DIRS
  .filter((m) => m.released)
  .map(({ dir }) => {
    const file = resolve(DATA_DIR, dir, 'index.js');
    return { MODULE: extract(file, 'MODULE'), SECTIONS: extract(file, 'SECTIONS') };
  });

if (!modules.length) throw new Error('No released modules — the course list would be empty.');

const courseJson = {
  ...COURSE,
  // The web-dev lesson page renders its own runners per block, so it opts out
  // of the shared Python editor panel.
  hasEditor: false,
  modules: modules.map(({ MODULE }) => ({
    id: MODULE.moduleId,
    title: MODULE.title,
    file: `module${MODULE.moduleId}.json`,
  })),
};

const targets = [
  [resolve(COURSE_DIR, 'course.json'), courseJson],
  ...modules.map(({ MODULE, SECTIONS }) => [
    resolve(COURSE_DIR, `module${MODULE.moduleId}.json`),
    {
      moduleId: MODULE.moduleId,
      title: MODULE.title,
      emoji: MODULE.emoji,
      tagline: MODULE.tagline,
      lessons: SECTIONS.map((s) => ({ lessonId: s.id, title: s.title, duration: s.duration })),
      hasProject: MODULE.hasProject,
      hasLab: false,
    },
  ]),
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
