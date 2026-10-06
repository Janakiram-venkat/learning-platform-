// MiniDOM — just enough document for the real matcher to walk, in Node.
//
// Task checks are graded by `matchElements` + `domVerdict` + `everyVerdict`,
// which sandbox.js exports and injects into the frame BY SOURCE. So a headless
// test can grade HTML with the very functions the browser runs — the one thing
// it needs that Node has not got is a document. This is that document.
//
// Supports what the course's selectors actually use: tag names and descendant
// combinators ("table thead th"). No classes, ids, attribute selectors, child
// combinators or comma lists — if a future check needs one, `queryAll` throws
// rather than quietly matching nothing and turning a broken check into a green
// test.
//
// Shared by challenge.test.mjs and project.test.mjs. Its own correctness is
// asserted at the bottom of challenge.test.mjs: a broken parser here would
// make every content test in both files pass for the wrong reason.

import { normalizeText } from '../../../lib/webdev/sandbox.js';

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function parseAttrs(raw) {
  const attrs = {};
  const re = /([\w:.-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function makeEl(tag, attrs) {
  return {
    tag,
    attrs,
    children: [],
    parent: null,
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name); },
    getAttribute(name) { return this.hasAttribute(name) ? this.attrs[name] : null; },
    get textContent() {
      return this.children
        .map((c) => (typeof c === 'string' ? c : c.textContent))
        .join('');
    },
  };
}

/** @param {string} html @returns {object} A root element holding the document. */
export function parse(html) {
  const root = makeEl('#root', {});
  const stack = [root];
  const src = String(html).replace(/<!--[\s\S]*?-->/g, '');

  const tagRe = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>|<![^>]*>/g;
  let last = 0;
  let m;

  const pushText = (text) => {
    if (text) stack[stack.length - 1].children.push(text);
  };

  while ((m = tagRe.exec(src)) !== null) {
    pushText(src.slice(last, m.index));
    last = tagRe.lastIndex;

    if (m[2] === undefined) continue; // <!DOCTYPE …> and friends

    const tag = m[2].toLowerCase();
    if (m[1] === '/') {
      // Close the nearest open element with this tag; ignore a stray close.
      const at = stack.map((e) => e.tag).lastIndexOf(tag);
      if (at > 0) stack.length = at;
      continue;
    }

    const el = makeEl(tag, parseAttrs(m[3] || ''));
    el.parent = stack[stack.length - 1];
    el.parent.children.push(el);
    if (!VOID.has(tag) && !m[4]) stack.push(el);
  }
  pushText(src.slice(last));

  return root;
}

function allElements(node, out = []) {
  for (const child of node.children) {
    if (typeof child === 'string') continue;
    out.push(child);
    allElements(child, out);
  }
  return out;
}

function matchesChain(el, parts) {
  if (el.tag !== parts[parts.length - 1]) return false;
  let i = parts.length - 2;
  let cur = el.parent;
  while (i >= 0 && cur) {
    if (cur.tag === parts[i]) i -= 1;
    cur = cur.parent;
  }
  return i < 0;
}

/**
 * The ctx `matchElements` needs, over a parsed document.
 * @param {string} html
 * @returns {{ queryAll: (s: string) => object[], norm: Function, attrOf: Function }}
 */
export function ctxFor(html) {
  const root = parse(html);
  const elements = allElements(root);
  return {
    queryAll(selector) {
      if (/[.#[\]>+~,:]/.test(selector)) {
        throw new Error(
          `MiniDOM only understands tag names and descendant combinators, got "${selector}". ` +
          'Either simplify the check or teach MiniDOM the selector.',
        );
      }
      const parts = selector.trim().split(/\s+/).map((p) => p.toLowerCase());
      return elements.filter((el) => matchesChain(el, parts));
    },
    norm: normalizeText,
    attrOf: (el, name) => el.getAttribute(name),
  };
}
