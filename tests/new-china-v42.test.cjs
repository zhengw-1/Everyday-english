const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const app = fs.readFileSync('app-classic.js','utf8');
const manifest = fs.readFileSync('audio-manifest.js','utf8');
const chunks = ['new-china-audio-1.js','new-china-audio-2.js','new-china-audio-3.js'].map(f => fs.readFileSync(f,'utf8')).join('\n');

test('New China topic is included with 20 lessons', () => {
  assert.match(app, /id:'new-china'/);
  const block = app.match(/const NEW_CHINA_DATA = \[(.*?)\];/s);
  assert.ok(block, 'new-china data block should exist');
  assert.equal((block[1].match(/\["/g) || []).length, 20);
});

test('New China lesson audio entries are bundled in the manifest', () => {
  const required = [
    'Hi, this is New China Restaurant.', 'What would you like?',
    'Is that for pickup or delivery?', 'What is your address?',
    'What is your phone number?', 'Small or large?',
    'With vegetables or no vegetables?', "General Tso's Chicken",
    'Chicken with Broccoli', 'Beef Lo Mein', 'Shrimp Fried Rice',
    'French Fries', 'Chicken Wings', 'Egg Roll', 'Pizza Roll'
  ];
  for (const phrase of required) {
    assert.ok(chunks.includes(JSON.stringify(phrase)+':'), phrase);
  }
});

test('New China audio is self-contained and does not require another upload folder', () => {
  for (const file of ['new-china-audio-1.js','new-china-audio-2.js','new-china-audio-3.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /data:audio\/mpeg;base64,/);
  }
});

test('New China individual word audio is bundled for every word card', () => {
  const vm = require('vm');
  const context = {};
  vm.runInNewContext(fs.readFileSync('audio-manifest.js','utf8'), context);
  for (const file of ['new-china-audio-1.js','new-china-audio-2.js','new-china-audio-3.js']) {
    vm.runInNewContext(fs.readFileSync(file,'utf8'), context);
  }
  const source = fs.readFileSync('app-classic.js','utf8');
  const block = source.match(/const NEW_CHINA_DATA = \[(.*?)\];/s)[1];
  const english = [...block.matchAll(/\[".*?", "(.*?)",/g)].map(m=>m[1]);
  const words = new Set();
  for (const sentence of english) for (const w of sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []) words.add(w);
  for (const word of words) assert.match(context.__ELDER_ENGLISH_AUDIO_MANIFEST[word] || '', /^data:audio\/mpeg;base64,/);
});
