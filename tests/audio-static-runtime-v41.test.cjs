const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app-classic.js','utf8');
assert.match(source, /function speakNativeForDirectHtml/);
assert.match(source, /speechSynthesis/);
assert.doesNotMatch(source, /createEspeakSpeaker/);
console.log('audio static runtime replaced by native V46 speech');
