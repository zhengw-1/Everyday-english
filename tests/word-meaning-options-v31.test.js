import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPracticeQueue } from '../src/practice.js';
import { createWordBreakdown } from '../src/words.js';

const classic = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');

test('word meaning questions keep the simple question but offer actual Chinese meanings as choices', () => {
  const queue = createPracticeQueue([{ id:'stay-1', zh:'请留在这里。', en:'Please stay here.' }]);
  const q = queue.find(x => x.type === 'word' && x.word.toLowerCase() === 'stay');
  assert.ok(q);
  assert.equal(q.prompt, 'stay 是什么意思？');
  assert.equal(q.answer, '留下；待着；停留');
  assert.ok(q.options.includes('留下；待着；停留'));
  assert.ok(q.options.every(option => option !== '这个词'));
});

test('word breakdown always gives a real meaning for common practice words', () => {
  const words = createWordBreakdown({ en:'Please stay here.' });
  const stay = words.find(x => x.word.toLowerCase() === 'stay');
  assert.equal(stay.meaning, '留下；待着；停留');
  assert.doesNotMatch(stay.meaning, /这个词/);
});

test('classic bundle has no generic word-meaning placeholder', () => {
  assert.doesNotMatch(classic, /\['这个词的意思'/);
  assert.match(classic, /[\"']stay[\"']:\[\"留下；待着；停留/);
  assert.match(classic, /这个词是什么意思？/);
});
