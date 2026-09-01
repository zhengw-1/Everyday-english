const fs = require('fs');
const app = fs.readFileSync('app-classic.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };

assert(app.includes('function rewriteWorkerDataReference'), 'classic speech adapter must rewrite worker data URL');
assert(app.includes('REMOTE_PACKAGE_BASE'), 'classic speech adapter must configure worker data package URL');
assert(app.includes('hasLocalData'), 'local eSpeak worker must require its matching data file');

console.log('espeak-worker-rewrite.test.cjs: PASS');
