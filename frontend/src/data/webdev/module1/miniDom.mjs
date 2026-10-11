// MiniDOM — just enough document for the real matcher to walk, in Node.
//
// Task checks are graded by `matchElements` + `domVerdict` + `everyVerdict`,
// which sandbox.js exports and injects into the frame BY SOURCE. So a headless
// test can grade HTML with the very functions the browser runs — the one thing
// it needs that Node has not got is a document. This is that document.
//
// Supports what the course's selectors actually use: tag names, classes, ids,
// descendant and child combinators, and comma lists — so "nav > ul li",
// ".card p" and "h1, h2" all work. Module 1 needed only tags and descendants;
// Module 2 is a CSS module, so almost every selector in it names a class or an
// id. Attribute selectors, sibling combinators and pseudo-classes are still
// unsupported, and `queryAll` THROWS on them rather than quietly matching
// nothing and turning a broken check into a green test.
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

// --- Selectors --------------------------------------------------------------

/** Everything a real engine supports that this one does not. */
const UNSUPPORTED = /[[\]+~:|^$*=]/;

/**
 * One compound selector — "div", ".card", "#main", "li.item.done".
 *
 * Tag names are lower-cased because HTML tag matching is case-insensitive;
 * class and id values are NOT, because in an HTML document they are
 * case-sensitive and folding them would match things a browser would not.
 *
 * @param {string} text
 * @returns {{tag: string|null, id: string|null, classes: string[]}}
 */
function parseCompound(text) {
  const shape = text.match(/^([a-zA-Z][\w-]*|\*)?((?:[.#][\w-]+)*)$/);
  if (!shape) throw new Error(`MiniDOM cannot parse the selector part "${text}".`);

  const classes = [];
  let id = null;
  for (const piece of shape[2].match(/[.#][\w-]+/g) || []) {
    if (piece[0] === '.') classes.push(piece.slice(1));
    else id = piece.slice(1);
  }
  const tag = shape[1] && shape[1] !== '*' ? shape[1].toLowerCase() : null;
  if (!tag && !id && !classes.length) throw new Error(`MiniDOM got an empty selector part in "${text}".`);
  return { tag, id, classes };
}

/**
 * One complex selector — a chain of compounds joined by combinators.
 * `.card > ul li` becomes three links, the first with no combinator.
 *
 * @param {string} selector
 * @returns {Array<{combinator: '>'|' '|null, compound: object}>}
 */
function parseSelector(selector) {
  const parts = selector.trim().replace(/>/g, ' > ').split(/\s+/).filter(Boolean);
  const chain = [];
  let pending = null;

  for (const part of parts) {
    if (part === '>') {
      if (!chain.length) throw new Error(`MiniDOM got a selector starting with ">": "${selector}".`);
      pending = '>';
      continue;
    }
    chain.push({ combinator: chain.length === 0 ? null : pending ?? ' ', compound: parseCompound(part) });
    pending = null;
  }

  if (!chain.length) throw new Error('MiniDOM got an empty selector.');
  if (pending) throw new Error(`MiniDOM got a selector ending with ">": "${selector}".`);
  return chain;
}

/** Does this one element satisfy this one compound? */
function matchesCompound(el, { tag, id, classes }) {
  if (tag && el.tag !== tag) return false;
  if (id && el.getAttribute('id') !== id) return false;
  if (!classes.length) return true;
  const own = String(el.getAttribute('class') || '').trim().split(/\s+/);
  return classes.every((c) => own.includes(c));
}

/**
 * Match a chain right-to-left from `el`, which is the candidate for the LAST
 * compound. A child combinator steps to exactly the parent; a descendant one
 * tries every ancestor, recursing so a failed guess backtracks — "div p span"
 * over nested divs needs that, and the old loop-and-decrement did not have it.
 */
function matchesChain(el, chain, i = chain.length - 1) {
  if (!matchesCompound(el, chain[i].compound)) return false;
  if (i === 0) return true;

  if (chain[i].combinator === '>') {
    return !!el.parent && matchesChain(el.parent, chain, i - 1);
  }
  for (let cur = el.parent; cur; cur = cur.parent) {
    if (matchesChain(cur, chain, i - 1)) return true;
  }
  return false;
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
      if (UNSUPPORTED.test(selector)) {
        throw new Error(
          `MiniDOM understands tags, classes, ids, descendant and child combinators and comma ` +
          `lists, but not "${selector}". Either simplify the check or teach MiniDOM the selector.`,
        );
      }
      // A comma list is a union, and an element matching two of its branches
      // must still appear once — document order, no duplicates, like a real
      // querySelectorAll.
      const chains = selector.split(',').map((s) => parseSelector(s));
      return elements.filter((el) => chains.some((chain) => matchesChain(el, chain)));
    },
    norm: normalizeText,
    attrOf: (el, name) => el.getAttribute(name),
  };
}
