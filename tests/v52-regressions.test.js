import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');

test('translator falls back to the smaller free q4 model and clears a failed loader', () => {
  assert.match(app, /dtype:\s*['"]q4['"]/);
  assert.match(app, /translatorPromise\s*=\s*null/);
  assert.match(app, /Promise\.race\(/);
});

test('Practice lists sessions started from an individual saved sentence', () => {
  assert.match(app, /function practiceListView\(\)[\s\S]*const sessions=\(state\.practiceSessions \|\| \[\]\);/);
  assert.doesNotMatch(app, /const sessions=\(state\.practiceSessions \|\| \[\]\)\.filter\(s=>s\.type!==['"]all['"]\)/);
});
