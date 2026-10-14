/**
 * A tiny syntax colourer for lesson code, tuned for the dark `bg-well` panels.
 *
 * Deliberately not a real parser: lesson snippets are a few lines long and a
 * wrong colour on an edge case costs nothing, whereas a highlighting library
 * would cost every lesson page its weight. Python, Java and C++ get keyword,
 * builtin, string, number and comment colours; any other language falls back
 * to strings, numbers and comments, which read correctly almost everywhere.
 */

const PY_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
]);

const PY_BUILTINS = new Set([
  'print', 'input', 'len', 'range', 'int', 'str', 'float', 'bool', 'type',
  'list', 'dict', 'tuple', 'set', 'abs', 'round', 'min', 'max', 'sum',
  'sorted', 'enumerate', 'zip', 'isinstance', 'super', 'self', 'open',
]);

// Java and C++ share most of their keywords, so one set serves both.
const C_KEYWORDS = new Set([
  'public', 'private', 'protected', 'static', 'final', 'const', 'class', 'void',
  'int', 'long', 'short', 'byte', 'double', 'float', 'char', 'boolean', 'bool',
  'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break',
  'continue', 'return', 'new', 'true', 'false', 'null', 'import', 'package',
  'try', 'catch', 'finally', 'throw', 'throws', 'this', 'extends', 'implements',
  'interface', 'enum', 'var', 'auto', 'using', 'namespace', 'include', 'struct',
  'nullptr', 'virtual', 'template', 'typename',
]);

const C_BUILTINS = new Set([
  'String', 'System', 'Scanner', 'Math', 'Integer', 'Double', 'Character',
  'Boolean', 'println', 'print', 'printf', 'main', 'std', 'cout', 'cin', 'endl',
  'string', 'vector',
]);

// Order matters: comments and strings first so a `#` inside a string, or a
// keyword inside a comment, is not coloured as something else.
// Python comments start with `#`; `//` is floor division there, a comment in
// most other languages.
const PY_TOKEN = /(#[^\n]*)|([fFrRbB]?"(?:[^"\\\n]|\\.)*"?|[fFrRbB]?'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
const C_TOKEN = /(#[^\n]*|\/\/[^\n]*)|([fFrRbB]?"(?:[^"\\\n]|\\.)*"?|[fFrRbB]?'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
// Java and C++ comments are `//` only, so `#include` is not greyed out.
const JC_TOKEN = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

const CLS = {
  comment: 'text-mute italic',
  string: 'text-mint',
  number: 'text-signal',
  keyword: 'text-[#E58BFF] font-bold',
  builtin: 'text-led',
};

export function highlight(code, language = 'python') {
  const text = String(code ?? '');
  const isPy = language === 'python';
  const isC = language === 'java' || language === 'cpp';
  const out = [];
  let last = 0;
  let key = 0;

  for (const m of text.matchAll(isPy ? PY_TOKEN : isC ? JC_TOKEN : C_TOKEN)) {
    const [whole, comment, string, number, word] = m;
    let cls = null;
    if (comment) cls = CLS.comment;
    else if (string) cls = CLS.string;
    else if (number) cls = CLS.number;
    else if (word && isPy) {
      if (PY_KEYWORDS.has(word)) cls = CLS.keyword;
      else if (PY_BUILTINS.has(word)) cls = CLS.builtin;
    } else if (word && isC) {
      if (C_KEYWORDS.has(word)) cls = CLS.keyword;
      else if (C_BUILTINS.has(word)) cls = CLS.builtin;
    }
    if (!cls) continue;

    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={key++} className={cls}>{whole}</span>);
    last = m.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
