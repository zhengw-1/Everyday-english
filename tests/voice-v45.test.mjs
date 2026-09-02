import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');
test('V46 no longer depends on eSpeak-generated audio', () => {
  assert.doesNotMatch(source, /createEspeakSpeaker/);
  assert.doesNotMatch(source, /eSpeak-NG playback failed/);
});
