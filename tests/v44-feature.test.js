import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { defaultState, mergePhrase } from '../src/state.js';

const app = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');

test('translated saves are marked as translation saves', () => {
  const s = defaultState();
  mergePhrase(s, { zh: '我想喝茶。', en: 'I want tea.', category: 'custom', source: 'translation' });
  assert.equal(s.saved[0].source, 'translation');
});

test('My English has a separate 我的保存 section for translated English', () => {
  assert.match(app, /data-saved-tab="translations"/);
  assert.match(app, /我的保存/);
  assert.match(app, /source\s*===\s*['"]translation['"]/);
});

test('practice list includes a delete control for every saved session', () => {
  assert.match(app, /practice-delete/);
  assert.match(app, /删除这个练习/);
});

test('selected practice category uses that category built-in lessons', () => {
  assert.match(app, /function practiceItemsForCategory\(category\)/);
  assert.match(app, /return topicPhrases\(category\)/);
});

test('practice answer sound uses a louder peak gain', () => {
  const match = app.match(/exponentialRampToValueAtTime\((0\.\d+),now\+0\.015\)/);
  assert.ok(match, 'answer tone peak gain should be present');
  assert.ok(Number(match[1]) >= 0.2, `expected louder gain, got ${match[1]}`);
});
