import { createWordBreakdown } from './words.js';
function norm(s) {
  return String(s || '').toLowerCase().replace(/[.,!?，。！？\'"“”‘’]/g,'').replace(/\s+/g,' ').trim();
}

export function tokenizeSentence(en) {
  return String(en || '').trim().replace(/[.!?]+$/,'').split(/\s+/).filter(Boolean).map((text, index) => ({ id: `token-${index}-${text.toLowerCase()}`, text }));
}

export function evaluateAnswer(question, answer) {
  return norm(question.answer) === norm(answer);
}

function choices(correct, pool = [], fallback = []) {
  return [correct, ...pool, ...fallback].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 4);
}

export function createPracticeQueue(items, mode = 'all') {
  const usable = items.filter(x => x && x.zh && x.en);
  if (typeof mode === 'number') {
    return usable.slice(0, mode).map((item, index) => ({
      id: `${item.id}-${index}`, sourceId: item.id, prompt: item.zh, answer: item.en,
      note: item.note || '这句话可以在日常生活里直接用。',
      options: [item.en, 'Thank you.', 'Please help me.', 'Where is it?'].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4),
      type: 'sentence-meaning', sourceEn: item.en,
    }));
  }

  const questions = [];
  const words = [];
  const seen = new Set();
  for (const item of usable) {
    createWordBreakdown(item).forEach(word => {
      const key = word.word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      words.push({ ...word, sourceId: item.id });
    });
  }
  words.forEach((w, wi) => {
    const distractors = words.filter(x => x.word.toLowerCase() !== w.word.toLowerCase()).map(x => x.meaning);
    questions.push({ id:`w-meaning-${wi}`, sourceId:w.sourceId, prompt:`${w.word.replace(/^I$/,'i')} 是什么意思？`, answer:w.meaning, note:w.explanation, options:choices(w.meaning,distractors,['我不知道','谢谢','请帮帮我']), type:'word', word:w.word });
    const otherWords = words.filter(x => x.word.toLowerCase() !== w.word.toLowerCase()).map(x => x.word).slice(0,3);
    questions.push({ id:`w-reverse-${wi}`, sourceId:w.sourceId, prompt:`${w.meaning} 英文怎么说？`, answer:w.word, note:`${w.word.replace(/^I$/,'i')} = ${w.meaning}`, options:choices(w.word,otherWords,['hello','thank','help']), type:'word-reverse', word:w.word });
    questions.push({ id:`w-listen-${wi}`, sourceId:w.sourceId, prompt:'听这个词，再选它的意思。', answer:w.meaning, note:w.explanation, options:choices(w.meaning,distractors,['我不知道','谢谢','请帮帮我']), type:'word-listen', word:w.word });
  });

  usable.forEach((item, i) => {
    const tokens = tokenizeSentence(item.en);
    const distractors = usable.filter(x => x.id !== item.id).map(x => x.en).slice(0,3);
    questions.push({ id:`s-order-${i}`, sourceId:item.id, prompt:item.zh, answer:item.en, note:'把单词按正确顺序放好。', tokens, sourceEn:item.en, sourceZh:item.zh, type:'sentence-order' });
    questions.push({ id:`s-meaning-${i}`, sourceId:item.id, prompt:'这句话是什么意思？', answer:item.zh, note:'先看整句话，再选择中文意思。', options:choices(item.zh,usable.filter(x=>x.id!==item.id).map(x=>x.zh),['谢谢。','我需要帮助。','多少钱？']), sourceEn:item.en, sourceZh:item.zh, type:'sentence-meaning' });
    questions.push({ id:`s-listen-${i}`, sourceId:item.id, prompt:'先听完整句子，再选择中文意思。', answer:item.zh, note:'听懂整句话的意思。', options:choices(item.zh,usable.filter(x=>x.id!==item.id).map(x=>x.zh),['谢谢。','我需要帮助。','多少钱？']), sourceEn:item.en, sourceZh:item.zh, type:'sentence-listen' });
    if (tokens.length >= 2) {
      const blankIndex = Math.floor(tokens.length / 2);
      const missing = tokens[blankIndex].text;
      const pattern = tokens.map((t, ti) => ti === blankIndex ? '____' : t.text).join(' ');
      const wordChoices = [missing, ...tokens.filter((_,ti)=>ti!==blankIndex).map(t=>t.text), ...['you','is','the']].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);
      questions.push({ id:`s-fill-${i}`, sourceId:item.id, prompt:'选择缺少的单词。', answer:missing, note:`完整句子：${item.en}`, options:choices(missing,wordChoices,['you','is','the']), sourceEn:item.en, sourceZh:item.zh, pattern, type:'sentence-fill' });
    }
    questions.push({ id:`s-english-${i}`, sourceId:item.id, prompt:item.zh, answer:item.en, note:'选择最合适的英文句子。', options:choices(item.en,distractors,['Thank you.','Please help me.','Where is it?']), sourceEn:item.en, sourceZh:item.zh, type:'sentence-english' });
  });
  return questions;
}

export function applyPracticeResult(saved, sourceId, correct) {
  const item = saved.find(x => x.id === sourceId);
  if (!item) return;
  if (correct) item.correct = Number(item.correct || 0) + 1;
  else item.wrong = Number(item.wrong || 0) + 1;
}
