import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPracticeQueue, evaluateAnswer } from '../src/practice.js';

const app = fs.readFileSync(new URL('../app-classic.js', import.meta.url), 'utf8');

test('Practice can list a saved session even when there are no saved phrases', () => {
  const practiceView = app.match(/function practiceView\(\)\{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(practiceView, /if\(!state\.saved\.length\)/);
  assert.match(app, /#exitPractice[\s\S]*savePracticeSession\(current\)[\s\S]*persist\(\)[\s\S]*render\(\)/);
});

test('multiple-choice options are shuffled while the answer remains the validation source', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const questions = createPracticeQueue([{ id: 'one', zh: '你好', en: 'Hello.' }], 'all');
    const question = questions.find(item => item.type === 'word');
    assert.notEqual(question.options[0], question.answer);
    assert.equal(evaluateAnswer(question, question.answer), true);
  } finally {
    Math.random = originalRandom;
  }
  assert.match(app, /function practiceChoices\([\s\S]*return shuffleCopy\(/);
});
