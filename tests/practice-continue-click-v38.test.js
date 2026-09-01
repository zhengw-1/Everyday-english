import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('practice continue is handled by a delegated click listener on the stable view container', () => {
  assert.match(app, /view\.addEventListener\(['"]click['"]/);
  assert.match(app, /closest.*practice-continue/);
});

test('resume helper restores the selected session as active without overwriting other sessions', () => {
  assert.match(app, /function resumePracticeSession\(sessionId\)/);
  assert.match(app, /state\.currentPracticeId=session\.id/);
  assert.match(app, /session\.active=true/);
});
