const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');
assert(source.includes('Promise.resolve(defaultSpeaker.speak(text, rate))'), 'GitHub speech should handle async eSpeak failures');
assert(source.includes('speakNativeForDirectHtml(text, rate, scope);'), 'speech fallback should use browser native speech');
console.log('audio fallback v39 test passed');
