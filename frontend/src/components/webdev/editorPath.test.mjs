// Headless regression test for the Monaco model-sharing bug: two CodeRunners on
// one page (the task editor + the read-only solution) must never resolve to the
// same Monaco text model.
//
// Run with:  node src/components/webdev/editorPath.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { editorPath, nextRunnerId } from './editorPath.js';

const TAB_LABELS = ['index.html', 'style.css', 'script.js'];

test('each runner instance gets a distinct id', () => {
  const ids = Array.from({ length: 50 }, () => nextRunnerId());
  assert.equal(new Set(ids).size, ids.length);
});

test('two runners never share a path for the same file', () => {
  const task = nextRunnerId();
  const solution = nextRunnerId();
  for (const label of TAB_LABELS) {
    assert.notEqual(editorPath(task, label), editorPath(solution, label));
  }
});

test('one runner gets a distinct path per file tab', () => {
  const id = nextRunnerId();
  const paths = TAB_LABELS.map((label) => editorPath(id, label));
  assert.equal(new Set(paths).size, paths.length);
});

test('a path is stable for the same runner + file', () => {
  const id = nextRunnerId();
  assert.equal(editorPath(id, 'index.html'), editorPath(id, 'index.html'));
});

test('paths carry a scheme and keep the file extension', () => {
  const p = editorPath(nextRunnerId(), 'style.css');
  assert.match(p, /^file:\/\/\//);
  assert.ok(p.endsWith('/style.css'), `${p} should end in the file label`);
});

// Replays @monaco-editor/react's getOrCreateModel:
//   getModel(Uri.parse(path)) ?? createModel(value, language, Uri.parse(path))
// This is the exact lookup that made both editors land on one model.
function fakeMonaco() {
  const models = new Map();
  return {
    models,
    getOrCreateModel(path, value) {
      const existing = models.get(path);
      if (existing) return existing;
      const model = { uri: path, value };
      models.set(path, model);
      return model;
    },
  };
}

test('a task runner and a solution runner get separate models', () => {
  const monaco = fakeMonaco();
  const taskId = nextRunnerId();
  const solutionId = nextRunnerId();

  const taskModel = monaco.getOrCreateModel(editorPath(taskId, 'index.html'), '<p>mine</p>');
  const solutionModel = monaco.getOrCreateModel(editorPath(solutionId, 'index.html'), '<p>answer</p>');

  assert.notEqual(taskModel, solutionModel);
  assert.equal(monaco.models.size, 2);
  assert.equal(taskModel.value, '<p>mine</p>');
  assert.equal(solutionModel.value, '<p>answer</p>');
});

test('the old bare-filename path would have shared one model (guards the regression)', () => {
  const monaco = fakeMonaco();
  const a = monaco.getOrCreateModel('index.html', '<p>mine</p>');
  const b = monaco.getOrCreateModel('index.html', '<p>answer</p>');
  assert.equal(a, b, 'sanity: identical paths collide, which is the bug being fixed');
});

test('many runners on one page all stay separate', () => {
  const monaco = fakeMonaco();
  const runners = Array.from({ length: 5 }, () => nextRunnerId());
  for (const id of runners) {
    for (const label of TAB_LABELS) monaco.getOrCreateModel(editorPath(id, label), '');
  }
  assert.equal(monaco.models.size, runners.length * TAB_LABELS.length);
});
