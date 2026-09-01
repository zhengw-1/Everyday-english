import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('practice UI uses a simple word/translation and varied exercise layout', () => {
  assert.match(app, /class="practice-word"/);
  assert.match(app, /class="practice-word-meaning"/);
  assert.match(app, /class="order-answer"/);
  assert.match(app, /class="order-bank"/);
  assert.match(app, /draggable="true"/);
  for (const type of ['sentence-order','sentence-listen','sentence-fill','sentence-english']) {
    assert.match(app, new RegExp(`q\.type==='${type}'`));
  }
  assert.doesNotMatch(app, /看看每个单词/);
  assert.doesNotMatch(app, /点一个单词看简单解释/);
});

test('sentence ordering has large draggable touch-friendly tiles and a clear answer area', () => {
  const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.order-tile\{[^}]*min-height:\s*(?:58|64|68|72)px/s);
  assert.match(css, /\.order-tile\{[^}]*touch-action:\s*none/s);
  assert.match(css, /\.order-answer\{/);
  assert.match(css, /\.order-bank\{/);
});
