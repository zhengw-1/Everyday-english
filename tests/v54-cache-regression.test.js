import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('service worker does not cache its own update script or the app bundle forever', () => {
  assert.match(sw, /CACHE='elder-english-shell-v54'/);
  assert.match(sw, /url\.pathname\.endsWith\('\/sw\.js'\)/);
  assert.match(sw, /url\.pathname\.endsWith\('\/app-classic\.js'\)/);
  assert.match(sw, /fetch\(e\.request,\{cache:'no-cache'\}\)/);
});

test('index points to a versioned app bundle so deployed HTML cannot silently reuse an older bundle', () => {
  assert.match(html, /app-classic\.js\?v=54/);
});
