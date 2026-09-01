export { speakEnglish } from './espeak.js';

export function normalizeRecognizedText(text) { return String(text || '').trim(); }
export function getRecognitionConstructor(scope = globalThis) {
  return scope?.SpeechRecognition || scope?.webkitSpeechRecognition || null;
}
export function isRecognitionSupported(scope = globalThis) { return Boolean(getRecognitionConstructor(scope)); }
export function startChineseRecognition({ onStart, onText, onError, onEnd } = {}, scope = globalThis) {
  const Ctor = getRecognitionConstructor(scope);
  if (!Ctor) throw new Error('这个浏览器不支持语音输入，请用打字。');
  const recognition = new Ctor();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => onStart?.();
  recognition.onresult = e => onText?.(normalizeRecognizedText(e.results?.[0]?.[0]?.transcript || ''));
  recognition.onerror = e => onError?.(e.error || '语音输入失败');
  recognition.onend = () => onEnd?.();
  recognition.start();
  return recognition;
}
