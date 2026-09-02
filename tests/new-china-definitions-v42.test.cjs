const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const app = fs.readFileSync('app-classic.js','utf8');
const block = app.match(/const NEW_CHINA_DATA = \[(.*?)\];/s)[1];
const defs = app.match(/const V11_WORD_DEFINITIONS = \{(.*?)\n\};/s)[1];
const v10Start = app.indexOf('const V10_WORD_DEFINITIONS = ');
const v10End = app.indexOf('const NEW_CHINA_DATA = ', v10Start) > v10Start ? app.indexOf('const NEW_CHINA_DATA = ', v10Start) : app.indexOf('const V11_WORD_DEFINITIONS = ', v10Start);
const oldDefs = v10Start >= 0 && v10End > v10Start ? app.slice(v10Start, v10End) : '';
const known = new Set([...app.matchAll(/"([^"]+)":\s*\[/g)].map(m=>m[1].toLowerCase()));
const english = [...block.matchAll(/\[".*?", "(.*?)",/g)].map(m=>m[1]);
const words = new Set();
for (const sentence of english) for (const w of sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []) words.add(w.toLowerCase());
for (const word of words) assert.ok(known.has(word), `missing definition for ${word}`);

test('New China vocabulary has real word definitions', () => assert.ok(words.size >= 40));
