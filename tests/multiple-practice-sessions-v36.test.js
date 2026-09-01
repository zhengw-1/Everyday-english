import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const state = fs.readFileSync(new URL('../src/state.js', import.meta.url), 'utf8');

test('practice stores multiple saved sessions instead of one practice object', () => {
  assert.match(state, /practiceSessions/);
  assert.match(state, /currentPracticeId/);
  assert.match(app, /practiceSessions/);
  assert.match(app, /currentPracticeId/);
});

test('practice list shows category and practice type for each saved session', () => {
  assert.match(app, /练习类型/);
  assert.match(app, /categoryLabel/);
  assert.match(app, /practice-session-clue/);
  assert.match(app, /继续练习/);
  assert.match(app, /开始新练习/);
});

test('starting a practice creates a new saved session rather than overwriting the previous one', () => {
  assert.match(app, /state\.practiceSessions\.findIndex/);
  assert.match(app, /savePracticeSession\(session\)/);
  assert.doesNotMatch(app, /state\.practice=\{active:true,queue:createPracticeQueue\(state\.saved,'all'\)/);
});
