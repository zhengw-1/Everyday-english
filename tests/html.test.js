import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('main HTML exposes simple elder-facing navigation', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const label of ['翻译','我的英语','练习','设置']) assert.ok(html.includes(label));
});

test('v2 is loadable as a browser app and uses senior-sized controls', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id=["']app["']/);
  const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /font-size:\s*(?:24|28)px/i);
  assert.match(css, /min-height:\s*(?:76|82)px/i);
});
