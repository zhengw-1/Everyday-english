import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const extract = (name, nextName) => {
  const m = source.match(new RegExp(`const ${name} = (\\{.*?\\});\\n\\nconst ${nextName}`, 's'));
  assert.ok(m, `${name} constant should exist`);
  return Function(`return ${m[1]}`)();
};
const data = extract('DATA', 'WORDS');
const v9 = extract('V9_EXTRA_DATA', 'V10_MORE_DATA');
const v10 = extract('V10_MORE_DATA', 'TOPICS');
const words = Function(`return ${source.match(/const WORDS = (\{.*?\});\n\nObject.assign/s)[1]}`)();
const defs = Function(`return ${source.match(/const V10_WORD_DEFINITIONS = (\{.*?\});\nfunction cleanWord/s)[1]}`)();
const allDefs = {...words, ...defs};
const normWord = w => String(w).replace(/[.,!?;:()[\]{}"“”]/g,'').replace(/^I$/,'i').toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/gi,'');

test('each category exposes exactly 20 unique learning lessons', () => {
  for (const topic of Object.keys(data)) {
    const rows = [...(data[topic]||[]), ...(v9[topic]||[]), ...(v10[topic]||[])];
    const uniqueEnglish = [...new Set(rows.map(r => r[1].toLowerCase()))];
    assert.equal(uniqueEnglish.length, 20, `${topic} should have 20 unique lessons`);
  }
});

test('every word in the 20 lessons has an actual Chinese definition', () => {
  const missing = new Set();
  for (const topic of Object.keys(data)) {
    const rows = [...(data[topic]||[]), ...(v9[topic]||[]), ...(v10[topic]||[])];
    const unique = []; const seen = new Set();
    for (const row of rows) { const key=row[1].toLowerCase(); if(!seen.has(key)){seen.add(key); unique.push(row);} }
    for (const [, en] of unique.slice(0,20)) {
      for (const raw of String(en).split(/\s+/)) {
        const w = normWord(raw);
        if (w && !allDefs[w]) missing.add(w);
      }
    }
  }
  assert.deepEqual([...missing].sort(), []);
});

test('category lesson builder removes duplicate English sentences before the 20-item limit', () => {
  assert.match(source, /const key=norm\(en\);/);
  assert.match(source, /return unique\.slice\(0,20\)/);
});
