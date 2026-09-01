import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecognizedText, getRecognitionConstructor } from '../src/speech.js';

test('normalizeRecognizedText trims whitespace', () => {
  assert.equal(normalizeRecognizedText('  我头晕。  '), '我头晕。');
});

test('getRecognitionConstructor uses standard then webkit fallback', () => {
  class A {}
  class B {}
  assert.equal(getRecognitionConstructor({SpeechRecognition:A, webkitSpeechRecognition:B}), A);
  assert.equal(getRecognitionConstructor({webkitSpeechRecognition:B}), B);
  assert.equal(getRecognitionConstructor({}), null);
});
