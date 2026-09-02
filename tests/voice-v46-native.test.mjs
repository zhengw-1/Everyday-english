import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');

test('app uses the original native Voice A speech path', () => {
  const start = source.indexOf('function speakNativeForDirectHtml');
  const end = source.indexOf('const STORAGE_KEY', start);
  const block = source.slice(start, end);
  assert.match(block, /speechSynthesis/);
  assert.match(block, /SpeechSynthesisUtterance/);
  assert.match(block, /utterance\.lang\s*=\s*['"]en-US['"]/);
  assert.doesNotMatch(block, /getEnglishVoice|selectedEnglishVoice|findFemaleEnglishVoice|audioAssetUrl|speakStaticAudio/i);
});
