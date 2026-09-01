const fs = require('fs');
const app = fs.readFileSync('app-classic.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
assert(app.includes("location?.protocol === 'file:'"), 'direct HTML mode must be detected');
assert(app.includes('speechSynthesis'), 'browser-native speech must be available as the audio path');
assert(app.includes('return speakNativeForDirectHtml(text, rate, scope);'), 'audio must start synchronously through browser speech');
console.log('direct-html-audio.test.cjs: PASS');
