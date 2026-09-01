const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');

assert(!source.includes('<option value="all">综合练习</option>'), 'new practice screen must not offer the removed 综合练习 task');
assert(!source.includes("({all:'综合练习'"), 'practice labels must not expose the removed 综合练习 task');
assert(!source.includes("mode==='all'"), 'practice start flow must not select the removed all/comprehensive mode');

console.log('practice no-all v41 test passed');
