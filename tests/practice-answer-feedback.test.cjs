const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const file of ['app.js', 'app-classic.js']) {
  test(`practice answer feedback in ${file} is not blocked by speech errors`, () => {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const start = src.indexOf('function answerQuestion(answer)');
    assert.notEqual(start, -1, 'answerQuestion should exist');
    const end = src.indexOf('\n}', start) + 2;
    const fn = src.slice(start, end);
    assert.match(fn, /try\s*\{\s*speakEnglish\(/s, 'speech should be guarded so UI feedback can still render');
    assert.match(fn, /catch\s*\(/s, 'speech errors must not prevent feedback rendering');
    assert.match(fn, /(?:state\.practice|current)\.answers\.push\(/s);
    assert.match(fn, /render\(\);/s);
  });
}
