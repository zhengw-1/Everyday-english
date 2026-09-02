const STORAGE_KEY = 'elder-english-state-v1';

export function defaultState() {
  return {
    version: 1,
    settings: { textSize: 'large', voiceRate: 0.82 },
    saved: [],
    practice: null,
    practiceSessions: [],
    currentPracticeId: null,
  };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!validateBackup(parsed)) return defaultState();
    if (!Array.isArray(parsed.practiceSessions)) parsed.practiceSessions = parsed.practice ? [parsed.practice] : [];
    parsed.currentPracticeId = parsed.currentPracticeId || parsed.practiceSessions.at(-1)?.id || null;
    parsed.practice = parsed.practiceSessions.find(x => x.id === parsed.currentPracticeId) || parsed.practice || null;
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(state));
}

export function mergePhrase(state, phrase) {
  const zh = String(phrase.zh || '').trim();
  const en = String(phrase.en || '').trim();
  if (!zh || !en) return null;
  const existing = state.saved.find(x => x.zh === zh && x.en === en);
  if (existing) return existing;
  const item = {
    id: phrase.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    zh,
    en,
    category: phrase.category || 'custom',
    note: phrase.note || '生活里可以直接用。',
    createdAt: phrase.createdAt || new Date().toISOString(),
    correct: Number(phrase.correct || 0),
    wrong: Number(phrase.wrong || 0),
    source: phrase.source || (phrase.category === 'custom' ? 'translation' : 'built-in'),
  };
  state.saved.unshift(item);
  return item;
}

export function createBackupPayload(state) {
  return JSON.parse(JSON.stringify({ ...state, version: 1 }));
}

export function validateBackup(value) {
  if (!value || value.version !== 1) return false;
  if (!value.settings || !['large','xlarge'].includes(value.settings.textSize)) return false;
  if (typeof value.settings.voiceRate !== 'number') return false;
  if (!Array.isArray(value.saved)) return false;
  if (value.practice !== null && typeof value.practice !== 'object') return false;
  if (value.practiceSessions !== undefined && !Array.isArray(value.practiceSessions)) return false;
  if (value.currentPracticeId !== undefined && value.currentPracticeId !== null && typeof value.currentPracticeId !== 'string') return false;
  return value.saved.every(x => x && typeof x.zh === 'string' && typeof x.en === 'string');
}

export function downloadBackup(state) {
  const blob = new Blob([JSON.stringify(createBackupPayload(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `生活英语备份-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file) {
  const value = JSON.parse(await file.text());
  if (!validateBackup(value)) throw new Error('这个备份文件不正确。');
  return value;
}
