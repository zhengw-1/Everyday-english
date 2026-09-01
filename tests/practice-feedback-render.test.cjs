const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('classic bundle feedback renderer uses the bundled word breakdown function', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app-classic.js'), 'utf8');
  const start = src.indexOf('function feedbackHtml(q,f)');
  assert.notEqual(start, -1, 'feedbackHtml should exist');
  const end = src.indexOf('\n}', start) + 2;
  const fn = src.slice(start, end);
  assert.match(fn, /const words=wordBreakdown\(english\);/, 'feedback rendering must call the bundled wordBreakdown function');
  assert.doesNotMatch(fn, /createWordBreakdown\(/, 'classic bundle must not call an unavailable module-only function');
});
