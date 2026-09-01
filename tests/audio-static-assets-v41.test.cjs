const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('app-classic.js', 'utf8');

assert(source.includes('function audioAssetUrl'), 'static audio URL resolver should exist');
assert(source.includes('new AudioCtor('), 'speech should use a real audio element for built-in audio');
assert(source.includes('audioAssetUrl(text, scope)'), 'speech should resolve built-in text to a local audio asset');
assert(source.includes('audio.play?.()'), 'built-in audio must call play immediately');

const audioDir = 'audio';
assert(fs.existsSync(audioDir), 'audio asset directory should exist');
const files = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(x => x.endsWith('.mp3')) : [];
assert(files.length > 0, 'built-in speech audio files should be bundled locally');

console.log(`static audio v41 assets test found ${files.length} mp3 files`);
