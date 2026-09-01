const fs = require('fs');
const app = fs.readFileSync('app-classic.js', 'utf8');
const assert = (x, m) => { if (!x) throw new Error(m); };
assert(app.includes('audioAssetUrl'), 'bundled audio mode must resolve local audio');
assert(app.includes('speechSynthesis'), 'browser-native speech must remain the fallback for custom text');
assert(app.includes('audio.play?.()'), 'bundled audio must start immediately from the tap');
console.log('direct-html-audio.test.cjs: PASS');
