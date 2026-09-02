const assert = require('node:assert/strict');
const html = require('node:fs').readFileSync('index.html','utf8');
assert.doesNotMatch(html, /espeakng\.min\.js/);
assert.match(html, /app-classic\.js/);
console.log('direct-html-startup V46 test passed');
