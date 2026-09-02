const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app-classic.js','utf8');
assert.match(source, /function speakEnglish\(/);
assert.match(source, /speechSynthesis/);
assert.match(source, /speakEnglish\(q\.answer/);
console.log('practice uses native English speech in V46');
