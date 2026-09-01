import './styles.css';
import { loadState, saveState, mergePhrase, downloadBackup, readBackupFile, defaultState } from './state.js';
import { TOPICS, topicPhrases } from './topics.js';
import { createPracticeQueue, evaluateAnswer, applyPracticeResult } from './practice.js';
import { isRecognitionSupported, startChineseRecognition, speakEnglish } from './speech.js';
import { translateZhToEn } from './translation.js';
import { createWordBreakdown } from './words.js';

let state = loadState();
let route = 'home';
let currentTranslation = null;
let practiceFeedback = null;
const view = document.querySelector('#view');

function persist(){ saveState(state); applySettings(); }
function applySettings(){ document.documentElement.dataset.size = state.settings.textSize; }
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function nav(next){ route=next; practiceFeedback=null; render(); view.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }

function home(){
  const recommended=TOPICS.slice(0,6);
  return `<section class="hero"><span class="pill">每天学一点就够了</span><h1>今天想学什么？</h1><p class="muted">只学生活里马上能用的英语。不会也没关系，点一下就能听。</p></section><button class="big-action" data-nav="translate">🎤 说中文，帮我翻成英文</button><h2 class="section-title">推荐学这些</h2><div class="grid">${recommended.map(t=>`<button class="topic" data-topic="${t.id}"><span class="icon">${t.icon}</span><strong>${t.label}</strong></button>`).join('')}</div><button class="more-categories" data-nav="categories">更多学习内容</button>`}

function categoriesView(){return `<section class="hero"><h1>生活分类</h1><p class="muted">选择你今天想学的生活内容。</p></section><div class="grid">${TOPICS.map(t=>`<button class="topic" data-topic="${t.id}"><span class="icon">${t.icon}</span><strong>${t.label}</strong></button>`).join('')}</div>`}

function sentenceWordCards(en){return createWordBreakdown({en}).map(w=>`<button type="button" class="standard-audio-button word-card" data-word-speak="${escapeHtml(w.word)}"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small class="tap-hint">点击听</small></button>`).join(' ')}
function topicView(topicId){const topic=TOPICS.find(t=>t.id===topicId);const phrases=topicPhrases(topicId);if(!topic)return `<section class="hero"><h1>找不到这个分类</h1></section>`;return `<section class="hero"><button type="button" class="secondary" data-nav="categories">← 返回分类</button><div class="topic-heading"><span class="icon">${topic.icon}</span><h1>${escapeHtml(topic.label)}</h1></div></section><div class="topic-list">${phrases.map(item=>`<article class="card topic-phrase"><div class="en sentence-full">${escapeHtml(displayEnglish(item.en))}</div><div class="zh">${escapeHtml(item.zh)}</div><h3 class="word-section-title">点每个词听一听</h3><div class="sentence-word-row">${sentenceWordCards(item.en)}</div><div class="note">${escapeHtml(item.note||'生活里可以直接用。')}</div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(item.en)}">听整句<small class="tap-hint">点击听</small></button><button type="button" class="secondary built-save" data-topic="${escapeHtml(topicId)}" data-zh="${escapeHtml(item.zh)}" data-en="${escapeHtml(item.en)}" data-note="${escapeHtml(item.note||'生活里可以直接用。')}">保存</button></div></article>`).join('')}</div>`}

function translateView(){return `<section class="hero"><h1>说中文，我帮你翻</h1><p class="muted">按麦克风说完一句，或者直接打字。</p></section><div class="card"><textarea id="zhInput" class="input-box" placeholder="例如：这个多少钱？">${escapeHtml(currentTranslation?.zh||'')}</textarea><div class="button-row"><button class="mic" id="micBtn">🎤 说中文</button><button class="translate-btn" id="translateBtn">翻译</button></div><div id="status" class="status" aria-live="polite"></div></div><div id="resultArea">${currentTranslation?resultCard(currentTranslation):''}</div>`}
function resultCard(x){
  const words=createWordBreakdown(x);
  return `<div class="card translation-result"><div class="zh">${escapeHtml(x.zh)}</div><div class="en">${escapeHtml(x.en)}</div><div class="button-row"><button class="listen" data-speak="${escapeHtml(x.en)}">念给我听</button><button class="save" id="saveCurrent">保存</button></div><div class="word-learning"><h3>一句一句看懂</h3><div class="word-grid">${words.map(w=>`<button type="button" class="standard-audio-button word-card" data-word-speak="${escapeHtml(w.word)}" data-word-meaning="${escapeHtml(w.meaning)}" data-word-explanation="${escapeHtml(w.explanation)}"><strong>${escapeHtml(w.word)}</strong><span>${escapeHtml(w.meaning)}</span></button>`).join('')}</div><div class="word-detail">点一个单词，我会告诉你它在这句话里怎么用。</div></div></div>`
}
function feedbackHtml(q,f){
  const isWord=q.type?.startsWith('word');
  const english=isWord?displayEnglish(q.word||q.answer):displayEnglish(q.sourceEn||q.answer);
  const chinese=isWord?(q.type==='word-reverse' ? String(q.prompt||'').replace(/ 英文怎么说？$/,'') : q.answer):(q.sourceZh||q.prompt||q.answer);
  const words=createWordBreakdown({en:english});
  return `<div class="feedback ${f.correct?'correct':'wrong'}"><strong>${f.correct?'✓ 对了！':'✕ 还差一点'}</strong><div class="feedback-answer">${escapeHtml(english)}</div><div class="feedback-translation">${escapeHtml(chinese)}</div>${!f.correct?`<div class="feedback-hint">正确答案：${escapeHtml(isWord?q.answer:english)}</div>`:''}<div class="word-learning practice-breakdown"><h3>${isWord?'单词解释':'句子里的单词'}</h3><div class="word-grid">${words.map(w=>`<div class="word-explanation"><strong>${escapeHtml(displayEnglish(w.word))}</strong><span>${escapeHtml(w.meaning)}</span><small>${escapeHtml(w.explanation)}</small></div>`).join('')}</div></div><div class="button-row"><button type="button" class="standard-audio-button listen" data-speak="${escapeHtml(english)}">听答案<small class="tap-hint">点击听</small></button><button class="secondary" id="retryQuestion">再练一次</button></div><button class="big-action" id="nextQuestion" style="margin-top:12px">下一题 →</button></div>`;
}
async function doTranslate(){const input=document.querySelector('#zhInput');const status=document.querySelector('#status');const text=input?.value?.trim();if(!text){status.textContent='请先说一句中文，或者打字。';return;}try{status.textContent='正在准备…';const en=await translateZhToEn(text,msg=>{status.textContent=msg});currentTranslation={zh:text,en};status.textContent='翻译好了。';document.querySelector('#resultArea').innerHTML=resultCard(currentTranslation);bind();}catch(e){status.textContent=e.message||'翻译失败，请再试一次。';}}
function doMic(){const status=document.querySelector('#status');if(!isRecognitionSupported()){status.textContent='这个浏览器不能用语音输入，请直接打字。';return;}try{startChineseRecognition({onStart:()=>{status.textContent='正在听…说完一句就可以。';document.querySelector('#micBtn').textContent='🎙️ 正在听';},onText:text=>{document.querySelector('#zhInput').value=text;status.textContent='听到了，正在翻译…';doTranslate();},onError:()=>{status.textContent='没有听清楚。可以再说一次，或者打字。';},onEnd:()=>{const b=document.querySelector('#micBtn');if(b)b.textContent='🎤 说中文';}});}catch(e){status.textContent=e.message;}}
function answerQuestion(answer){if(practiceFeedback)return;const q=state.practice.queue[state.practice.index];const correct=evaluateAnswer(q,answer);practiceFeedback={correct,answer};state.practice.answers.push({sourceId:q.sourceId,correct,at:new Date().toISOString()});applyPracticeResult(state.saved,q.sourceId,correct);persist();render();}

render();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
