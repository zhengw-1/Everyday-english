const fs = require('fs');
const app = fs.readFileSync('app-classic.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
assert(app.includes("location?.protocol === 'file:'"), 'direct HTML mode must be detected');
assert(app.includes('speechSynthesis'), 'direct HTML test must have an immediate browser-audio fallback');
assert(app.includes('GitHub Pages/HTTPS uses eSpeak-NG'), 'hosted mode must remain eSpeak-NG primary');
console.log('direct-html-audio.test.cjs: PASS');
