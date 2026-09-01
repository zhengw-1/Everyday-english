import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeQueue, evaluateAnswer, applyPracticeResult } from '../src/practice.js';

const items = [
  { id:'1', zh:'你好', en:'Hello.', note:'打招呼', correct:0, wrong:0 },
  { id:'2', zh:'我需要帮助', en:'I need help.', note:'求助', correct:0, wrong:0 },
  { id:'3', zh:'谢谢', en:'Thank you.', note:'感谢', correct:0, wrong:0 }
];

test('createPracticeQueue builds multiple-choice questions', () => {
  const q = createPracticeQueue(items, 3);
  assert.equal(q.length, 3);
  assert.ok(q.every(x => x.options.includes(x.answer)));
});

test('evaluateAnswer ignores punctuation and case', () => {
  assert.equal(evaluateAnswer({answer:'Hello.'}, ' hello '), true);
  assert.equal(evaluateAnswer({answer:'Hello.'}, 'Goodbye'), false);
});

test('applyPracticeResult updates phrase stats', () => {
  const saved = structuredClone(items);
  applyPracticeResult(saved, '1', true);
  applyPracticeResult(saved, '1', false);
  assert.equal(saved[0].correct, 1);
  assert.equal(saved[0].wrong, 1);
});

test('a single saved phrase still gets at least two answer choices', () => {
  const q = createPracticeQueue([items[0]], 1);
  assert.ok(q[0].options.length >= 2);
});

test('practice queue includes varied word and sentence exercise types', () => {
  const q = createPracticeQueue(items, 'all');
  const types = new Set(q.map(x => x.type));
  for (const type of ['word','word-reverse','word-listen','sentence-order','sentence-meaning','sentence-listen','sentence-fill']) {
    assert.ok(types.has(type), `missing practice type: ${type}`);
  }
});

test('sentence order questions contain shuffled word tiles and the full answer', () => {
  const q = createPracticeQueue([{ id:'x', zh:'我喜欢你', en:'I like you.' }], 'all');
  const order = q.find(x => x.type === 'sentence-order');
  assert.ok(order);
  assert.deepEqual(order.tokens.map(x => x.text), ['I','like','you']);
  assert.equal(order.answer, 'I like you.');
});

test('multiple-choice practice questions always have at least two distinct choices', () => {
  const q = createPracticeQueue([{ id:'x', zh:'我喜欢你', en:'I like you.' }], 'all');
  for (const item of q.filter(x => x.options)) {
    assert.ok(new Set(item.options).size >= 2, `not enough choices for ${item.type}`);
    assert.ok(item.options.includes(item.answer));
  }
});
