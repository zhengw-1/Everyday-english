const fs = require('fs');
const assert = require('assert');
const app = fs.readFileSync('app.js','utf8');
const manifestSource = fs.readFileSync('audio-manifest.js','utf8');
const manifest = Function(manifestSource + '; return globalThis.__ELDER_ENGLISH_AUDIO_MANIFEST;')();
function extract(name,next){const m=app.match(new RegExp(`const ${name} = (\\{.*?\\});\\n\\nconst ${next}`,'s')); if(!m) throw new Error('missing '+name); return Function('return '+m[1])();}
const data=(()=>{const m=app.match(/const DATA = (\{[\s\S]*?\});\n\nconst WORDS/); return Function('return '+m[1])();})();
const v9=extract('V9_EXTRA_DATA','V10_MORE_DATA');
const v10=extract('V10_MORE_DATA','TOPICS');
let missing=[];
for(const [topic,rows] of Object.entries(data)){
  const all=[...(rows||[]),...(v9[topic]||[]),...(v10[topic]||[])];
  const seen=new Set();
  for(const row of all){const en=String(row[1]); const key=en.toLowerCase(); if(seen.has(key)) continue; seen.add(key); if(seen.size>20) break; if(!manifest[en]) missing.push(`${topic}: ${en}`); for(const raw of en.split(/\s+/)){const w=raw.replace(/[.,!?;:()[\]{}"“”]/g,'').replace(/^[^a-z]+|[^a-z'-]+$/gi,''); if(w&&!manifest[w]) missing.push(`${topic} word: ${w}`);}}
}
assert.deepStrictEqual(missing,[],'every built-in lesson and word should have a bundled audio file');
console.log('audio coverage v41 test passed');
