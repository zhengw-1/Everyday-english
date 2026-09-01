import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TOPICS, topicPhrases } from '../src/topics.js';
import { createWordBreakdown } from '../src/words.js';

const PLACEHOLDER = /暂无中文释义|这个单词的中文释义还需要补充|这个词的意思/;

test('every word used in the learning categories has an actual Chinese meaning', () => {
  const missing = [];
  for (const topic of TOPICS) {
    for (const phrase of topicPhrases(topic.id)) {
      for (const word of createWordBreakdown(phrase)) {
        if (!word.meaning || PLACEHOLDER.test(word.meaning)) missing.push(`${phrase.en} -> ${word.word}`);
      }
    }
  }
  assert.deepEqual(missing, [], `Missing meanings: ${missing.join(', ')}`);
});

test('the browser bundle contains real meanings for the emergency sentence words', () => {
  const classic = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');
  assert.ok(classic.includes("打电话；叫"));
  assert.ok(classic.includes("九一一；美国紧急电话"));
  assert.doesNotMatch(classic, /['"]暂无中文释义/);
});

test('service worker cache version is bumped so phones do not keep the old word-meaning bundle', () => {
  const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(sw, /CACHE='elder-english-shell-v38'/);
  assert.match(sw, /self\.skipWaiting\(\)/);
});
