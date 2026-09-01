const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');
const start = source.indexOf('function speakNativeForDirectHtml');
const end = source.indexOf('\nconst STORAGE_KEY', start);
assert(start >= 0 && end > start, 'audio functions must be present');

const calls = [];
class Utterance {
  constructor(text) { this.text = text; }
}
const scope = {
  location: { protocol: 'https:' },
  speechSynthesis: {
    cancel() { calls.push('cancel'); },
    speak(utterance) { calls.push(['speak', utterance.text, utterance.lang, utterance.rate]); }
  },
  SpeechSynthesisUtterance: Utterance
};
const context = { console, ...scope };
vm.runInNewContext(`${source.slice(start, end)}; globalThis.__speakEnglish = speakEnglish;`, context);

context.__speakEnglish('Hello there', 0.82, scope);
assert.deepStrictEqual(calls, [
  'cancel',
  ['speak', 'Hello there', 'en-US', 0.82]
], 'hosted speech must call speechSynthesis synchronously');
console.log('audio runtime v40 test passed');
