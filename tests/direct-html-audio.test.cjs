const assert = require('node:assert/strict');
const app = require('node:fs').readFileSync('app-classic.js','utf8');
assert.match(app, /speechSynthesis/);
assert.match(app, /synth\.speak\(utterance\)/);
assert.doesNotMatch(app, /speakStaticAudio\(/);
console.log('direct-html-audio V46 test passed');
