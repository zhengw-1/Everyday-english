const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
assert(html.includes('<script src="./app-classic.js"></script>'), 'direct HTML startup must use classic script');
assert(!html.includes('type="module"'), 'direct HTML startup must not use module script');
console.log('direct-html-startup.test.cjs: PASS');
