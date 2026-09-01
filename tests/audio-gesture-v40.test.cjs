const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');

const speakStart = source.indexOf('function speakEnglish(text, rate = 0.82, scope = globalThis)');
const speakEnd = source.indexOf('\n}\n\nconst STORAGE_KEY', speakStart);
assert(speakStart >= 0, 'hosted speakEnglish function must exist');
assert(speakEnd > speakStart, 'hosted speakEnglish function must have a bounded body');

const body = source.slice(speakStart, speakEnd);
assert(body.includes('return speakNativeForDirectHtml(text, rate, scope);'), 'hosted speech must return native speech immediately');
assert(!body.includes('Promise.resolve(defaultSpeaker.speak(text, rate))'), 'hosted speech must not defer playback through async eSpeak');
assert(!body.includes('createEspeakSpeaker({ scope })'), 'hosted speech must not depend on the missing eSpeak worker for playback');
console.log('audio gesture v40 test passed');
