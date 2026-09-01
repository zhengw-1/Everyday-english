import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapVoiceRate, createSpeechQueueState } from '../src/espeak.js';

test('maps the app voice settings to slow, senior-friendly eSpeak rates', () => {
  assert.equal(mapVoiceRate(0.68), 120);
  assert.equal(mapVoiceRate(0.82), 145);
  assert.equal(mapVoiceRate(1), 175);
});

test('speech queue state keeps only the newest playback request', () => {
  const state = createSpeechQueueState();
  const first = state.next('hello');
  const second = state.next('please help me');
  assert.equal(state.isCurrent(first), false);
  assert.equal(state.isCurrent(second), true);
  assert.equal(state.currentText, 'please help me');
});

test('direct file testing has a browser speech fallback when eSpeak workers cannot run', () => {
  const source = readFileSync(new URL('../src/espeak.js', import.meta.url), 'utf8');
  assert.match(source, /location\?\.protocol === 'file:'/);
  assert.match(source, /speechSynthesis/);
});
