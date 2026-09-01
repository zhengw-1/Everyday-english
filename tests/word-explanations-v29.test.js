import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const classic = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');
const topics = fs.readFileSync(new URL('../src/topics.js', import.meta.url), 'utf8');

test('topic sentence cards expose individual clickable audio words with 点击听', () => {
  assert.match(classic, /function topicView\(topicId\)/);
  assert.match(classic, /data-word-speak/);
  assert.match(classic, /点击听/);
});

test('practice feedback shows a word-by-word explanation for the answer sentence', () => {
  assert.match(classic, /function sentenceBreakdownHtml\(en\)/);
  assert.match(classic, /wordBreakdown\(en\)/);
  assert.match(classic, /单词解释/);
});

test('common word meanings use natural Chinese translations', () => {
  assert.match(classic, /[\"']good[\"']:\[\"很好；好/);
  assert.match(classic, /好的/);
});
