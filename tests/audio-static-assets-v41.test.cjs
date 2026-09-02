const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app-classic.js','utf8');
assert.doesNotMatch(source, /function speakStaticAudio/);
assert.doesNotMatch(source, /audioAssetUrl\(/);
console.log('static audio playback removed in V46');
