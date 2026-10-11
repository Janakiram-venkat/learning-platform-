// What to say when a student finishes a section, and where to send them.
//
// Pure, and separate from WebDevLessonPage for one reason: this is the decision
// a module boundary changes. "Finished a section" and "finished a module" look
// identical from inside the pager — both are just the last page of a section —
// and the difference is entirely a question about course structure. Keeping it
// a function of (module, next) means the boundary behaviour can be tested
// without a browser, which is the only way to be sure that releasing Module 2
// does not quietly change what Module 1's last section does.

/**
 * The celebration for a finished section.
 *
 * Three outcomes:
 *
 *   - mid-module, next section written  → "Section complete", advance to it
 *   - mid-module, next section unwritten → "Section complete", stay put
 *   - last section of the module         → "Module N complete", stay put
 *
 * The last case is the interesting one. It covers BOTH "there is no next
 * section at all" (the last released module) and "the next section is in the
 * next module" — because the Module Challenge and Mini Project come between the
 * two, and they are reached from the sidebar rather than by paging on. So a
 * module boundary is a deliberate full stop with a signpost, never an
 * auto-advance: `next` comes back null and the student stays where they are.
 *
 * That is also why releasing Module 2 does not change Module 1's last section.
 * Unreleased, `next` is null; released, `next.crossesModule` is true. Both land
 * in the same branch, and the only difference a student sees is one extra
 * sentence naming what is coming.
 *
 * @param {object} args
 * @param {{outro?: string}|null} args.module        The module the finished section belongs to.
 * @param {number} args.moduleNumber                 Its 1-based position, as the sidebar numbers it.
 * @param {{id: string, title: string, section: object|null, crossesModule: boolean}|null} args.next
 *        The next section, from the registry's getNextSection.
 * @returns {{title: string, message: string, next: string|null}}
 */
export function sectionOutro({ module, moduleNumber, next }) {
  const endOfModule = !next || next.crossesModule;
  const nextReady = !endOfModule && next?.section ? next : null;

  if (nextReady) {
    return {
      title: 'Section complete! ✅',
      message: `Nice work. Up next: ${nextReady.title}.`,
      next: nextReady.id,
    };
  }

  if (!endOfModule) {
    return {
      title: 'Section complete! ✅',
      message: `That is every section written so far. More of Module ${moduleNumber} is on the way.`,
      next: null,
    };
  }

  // The sidebar strips nothing, so the registry's "(coming soon)" suffix would
  // otherwise read as part of the next module's name in a sentence.
  const onward = next?.crossesModule
    ? ` After that, Module ${moduleNumber + 1} begins: ${next.title.replace(/\s*\(coming soon\)$/, '')}.`
    : '';

  return {
    title: `Module ${moduleNumber} complete! 🏆`,
    message: `${module?.outro ?? ''}${onward}`.trim(),
    next: null,
  };
}
