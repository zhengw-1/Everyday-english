import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, validateBackup, mergePhrase, createBackupPayload } from '../src/state.js';

test('defaultState starts with elder-friendly defaults', () => {
  const s = defaultState();
  assert.equal(s.settings.textSize, 'large');
  assert.equal(s.settings.voiceRate, 0.82);
  assert.deepEqual(s.saved, []);
  assert.equal(s.practice, null);
});

test('validateBackup accepts a valid backup and rejects malformed data', () => {
  const good = createBackupPayload(defaultState());
  assert.equal(validateBackup(good), true);
  assert.equal(validateBackup({ version: 1, saved: 'bad' }), false);
});

test('mergePhrase de-duplicates the same Chinese and English phrase', () => {
  const s = defaultState();
  mergePhrase(s, { zh: '你好', en: 'Hello.', category: 'greeting', note: '打招呼' });
  mergePhrase(s, { zh: '你好', en: 'Hello.', category: 'greeting', note: '打招呼' });
  assert.equal(s.saved.length, 1);
});


test('defaultState supports multiple saved practice sessions', () => {
  const s = defaultState();
  assert.deepEqual(s.practiceSessions, []);
  assert.equal(s.currentPracticeId, null);
});

test('validateBackup accepts a backup containing multiple practice sessions', () => {
  const good = createBackupPayload({
    ...defaultState(),
    practiceSessions: [{ id: 'p1', category: 'doctor', type: 'word', queue: [], index: 0, answers: [] }],
    currentPracticeId: 'p1',
  });
  assert.equal(validateBackup(good), true);
});
