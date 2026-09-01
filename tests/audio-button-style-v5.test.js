import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';

const css = await fs.readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const main = await fs.readFile(new URL('../src/main.js', import.meta.url), 'utf8');

assert.match(main, /class="word-card standard-audio-button"|class="standard-audio-button word-card"/,
  'word reading controls should use the shared audio-button class');
assert.match(css, /\.word-card\.standard-audio-button\s*\{[^}]*min-height:\s*68px;[^}]*padding:\s*14px 16px;[^}]*border-radius:\s*19px;/s,
  'word reading controls should match the regular reading-button dimensions');
assert.match(css, /\.word-card\.standard-audio-button\s*\{[^}]*background:\s*#edf5ef;[^}]*color:\s*#24382c;[^}]*box-shadow:\s*0 5px 0 #c7d3ca;/s,
  'word reading controls should use the shared reading-button visual treatment');

console.log('audio-button-style-v5 tests: PASS');
