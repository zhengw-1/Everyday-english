
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import { TOPICS, topicPhrases } from '../src/topics.js';

const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const main = await fs.readFile(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(html, /<button class="brand" data-nav="home"/);
assert.match(html, /data-nav="categories"><span>分类<\/span>/);
assert.doesNotMatch(html, /data-nav="categories"><span class="nav-icon">/);
assert.doesNotMatch(html, /data-nav="translate"><span class="nav-icon">/);
assert.doesNotMatch(main, />🔊 /);
assert.doesNotMatch(main, />⭐ 保存/);
assert.doesNotMatch(main, />🧩 /);
assert.match(main, /更多学习内容/);
assert.ok(TOPICS.length >= 20);
assert.ok(topicPhrases('fruits').length > 0);
assert.ok(topicPhrases('medicine').length > 0);
assert.ok(topicPhrases('weather').length > 0);

console.log('senior-ui-v4 tests: PASS');
