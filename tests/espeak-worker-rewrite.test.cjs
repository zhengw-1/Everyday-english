const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app-classic.js','utf8');
assert.doesNotMatch(source, /createEspeakSpeaker/);
assert.doesNotMatch(source, /DEFAULT_REMOTE_WORKER/);
console.log('eSpeak worker playback removed in V46');
