import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, topicPhrases } from '../src/topics.js';

test('starter topics include daily life basics', () => {
  const ids = TOPICS.map(t => t.id);
  for (const id of ['vegetables','meat','greetings','emergency','months','seasons']) assert.ok(ids.includes(id));
});

test('topicPhrases returns bilingual phrases with simple notes', () => {
  const list = topicPhrases('emergency');
  assert.ok(list.length >= 3);
  assert.ok(list.every(p => p.zh && p.en && p.note));
});
