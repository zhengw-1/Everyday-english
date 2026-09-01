
import { strict as assert } from 'node:assert';
import { createWordBreakdown, getPracticeWords } from '../src/words.js';

const sentence = { zh: '我头晕。', en: 'I feel dizzy.', note: 'dizzy 是头晕的。' };

const words = createWordBreakdown(sentence);
assert.deepEqual(words.map(x => x.word), ['I', 'feel', 'dizzy']);
assert.equal(words.find(x => x.word === 'dizzy').meaning, '头晕的');

const practiceWords = getPracticeWords(sentence);
assert.equal(practiceWords.length, 3);
assert.equal(practiceWords[2].word, 'dizzy');

const html = await (await import('node:fs/promises')).readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /data-nav="categories"/);
assert.doesNotMatch(html, /class="save">⭐/);
assert.doesNotMatch(html, /class="listen"[^>]*>🔊/);

console.log('senior-ui-v3 tests: PASS');
