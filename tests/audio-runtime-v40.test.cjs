const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');
const start = source.indexOf('function audioAssetUrl');
const end = source.indexOf('\nconst STORAGE_KEY', start);
assert(start >= 0 && end > start, 'audio functions must be present');
const calls = [];
class Audio {
  constructor(url) { this.url=url; calls.push(['construct',url]); }
  play() { calls.push(['play',this.url]); return {catch(){}}; }
  pause() { calls.push(['pause']); }
}
class Utterance { constructor(text){this.text=text;} }
const scope = {
  location:{protocol:'https:'},
  Audio,
  __ELDER_ENGLISH_AUDIO_MANIFEST:{'Hello there':'./audio/hello.mp3'},
  speechSynthesis:{cancel(){calls.push('native-cancel')},speak(){calls.push('native-speak')}},
  SpeechSynthesisUtterance:Utterance
};
const context={console,...scope};
vm.runInNewContext(`${source.slice(start,end)}; globalThis.__speakEnglish=speakEnglish;`,context);
context.__speakEnglish('Hello there',0.82,scope);
assert.deepStrictEqual(calls,[['construct','./audio/hello.mp3'],['play','./audio/hello.mp3']], 'hosted built-in speech must play bundled audio synchronously');
console.log('audio runtime v41 test passed');
