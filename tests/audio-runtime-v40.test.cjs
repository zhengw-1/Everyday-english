const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app-classic.js','utf8');
assert.match(source, /function speakEnglish\(/);
assert.match(source, /speechSynthesis/);
assert.doesNotMatch(source, /speakStaticAudio\(/);
console.log('audio runtime V46 test passed');
