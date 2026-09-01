import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const classic = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const PLACEHOLDER = /暂无中文释义|这个单词的中文释义还需要补充|常见英文词|请结合整句话理解这个词|这个词的具体意思要结合句子来理解/;

test('learning word cards never use placeholder meanings', () => {
  assert.doesNotMatch(classic.match(/function wordBreakdown\(en\)\{[\s\S]*?\n\}/)?.[0] || '', PLACEHOLDER);
  assert.doesNotMatch(main, /暂无中文释义|这个单词的中文释义还需要补充|常见英文词|请结合整句话理解这个词|这个词的具体意思要结合句子来理解/);
});

test('sentence cards use the requested full-sentence then word-card layout', () => {
  assert.match(classic, /sentence-word-row/);
  assert.match(classic, /word-card/);
  assert.match(classic, /点击听/);
  assert.match(classic, /sentence-full/);
  const topic = classic.match(/function topicView\(topicId\)\{([\s\S]*?)\}\n\nfunction render/);
  assert.ok(topic, 'topicView must exist');
  const body = topic[1];
  assert.ok(body.indexOf('sentence-full') < body.indexOf('sentence-word-row'), 'full English sentence should appear before word cards');
  assert.doesNotMatch(classic, /点一个词，可以听发音，也可以看简单解释/);
});

test('practice feedback includes every word meaning, not a generic placeholder', () => {
  assert.match(classic, /const words=wordBreakdown\(english\);/);
  assert.match(classic, /practice-breakdown/);
  assert.doesNotMatch(classic, /这个词的具体意思要结合句子来理解/);
});

test('sentence practice questions carry the real Chinese sentence into feedback', async () => {
  const { createPracticeQueue } = await import('../src/practice.js');
  const queue = createPracticeQueue([{id:'x', zh:'请打911。', en:'Please call 911.'}], 'all');
  const sentenceQuestions = queue.filter(q => q.type.startsWith('sentence-'));
  assert.ok(sentenceQuestions.length > 0);
  for (const q of sentenceQuestions) assert.equal(q.sourceZh, '请打911。');
});
