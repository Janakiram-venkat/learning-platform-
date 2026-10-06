let uid = 0;
const nextId = () => `b${++uid}-${Date.now().toString(36)}`;

export const PALETTE = [
  { type: 'forward', label: 'Move forward', emoji: '⬆️' },
  { type: 'left', label: 'Turn left', emoji: '↩️' },
  { type: 'right', label: 'Turn right', emoji: '↪️' },
  { type: 'repeat', label: 'Repeat', emoji: '🔁' },
  { type: 'if', label: 'If wall ahead / else', emoji: '❓' },
];

export function makeBlock(type) {
  if (type === 'repeat') return { id: nextId(), type, count: 3, children: [] };
  if (type === 'if') return { id: nextId(), type, children: [], elseChildren: [] };
  return { id: nextId(), type };
}
