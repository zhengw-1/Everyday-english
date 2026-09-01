const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');
const start = source.indexOf('function audioAssetUrl');
const end = source.indexOf('\nconst STORAGE_KEY', start);
assert(start >= 0 && end > start, 'audio adapter block should exist');

const calls = [];
class FakeAudio {
  constructor(url) { this.url = url; calls.push(['construct', url]); }
  play() { calls.push(['play', this.url]); return Promise.resolve(); }
  pause() { calls.push(['pause']); }
}
const scope = {
  Audio: FakeAudio,
  __ELDER_ENGLISH_AUDIO_MANIFEST: {'Hello.':'./audio/hello.mp3'},
  speechSynthesis: { cancel(){calls.push(['native-cancel']);}, speak(){calls.push(['native-speak']);} },
  SpeechSynthesisUtterance: class {}
};
const context = { console, ...scope };
vm.runInNewContext(`${source.slice(start,end)}; globalThis.__speakEnglish = speakEnglish;`, context);
context.__speakEnglish('Hello.', 0.82, scope);
assert.deepStrictEqual(calls, [
  ['construct','./audio/hello.mp3'],
  ['play','./audio/hello.mp3']
], 'built-in speech must construct and play local audio directly without native speech');
console.log('audio static runtime v41 test passed');
