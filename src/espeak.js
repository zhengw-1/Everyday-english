const DEFAULT_LOCAL_WORKER = './lib/espeak/espeakng.worker.js';
const DEFAULT_REMOTE_WORKER = 'https://cdn.jsdelivr.net/espeakng.js/latest/espeakng.worker.js';
const DEFAULT_REMOTE_DATA = 'https://cdn.jsdelivr.net/espeakng.js/latest/espeakng.worker.data';

export function mapVoiceRate(value) {
  const n = Number(value);
  if (n <= 0.7) return 120;
  if (n <= 0.9) return 145;
  return 175;
}

export function createSpeechQueueState() {
  let id = 0;
  return {
    currentText: '',
    next(text) {
      id += 1;
      this.currentText = String(text || '');
      return id;
    },
    isCurrent(requestId) {
      return requestId === id;
    }
  };
}

function audioContextFor(scope) {
  const Ctx = scope?.AudioContext || scope?.webkitAudioContext;
  if (!Ctx) return null;
  if (!scope.__elderEnglishAudioContext) scope.__elderEnglishAudioContext = new Ctx();
  const ctx = scope.__elderEnglishAudioContext;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function normalizeSamples(samples) {
  if (!samples) return new Float32Array();
  if (samples instanceof Float32Array) return samples;
  if (samples instanceof Int16Array) {
    const out = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) out[i] = samples[i] / 32768;
    return out;
  }
  return Float32Array.from(samples);
}

function playSamples(scope, samples, sampleRate = 22050) {
  const ctx = audioContextFor(scope);
  if (!ctx || !samples.length) return false;
  const buffer = ctx.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  if (scope.__elderEnglishSource) {
    try { scope.__elderEnglishSource.stop(); } catch (_) {}
    try { scope.__elderEnglishSource.disconnect(); } catch (_) {}
  }
  scope.__elderEnglishSource = source;
  source.onended = () => {
    if (scope.__elderEnglishSource === source) scope.__elderEnglishSource = null;
    try { source.disconnect(); } catch (_) {}
  };
  source.start();
  return true;
}

async function resourceExists(url, scope) {
  try {
    const head = await scope.fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return true;
  } catch (_) {}
  try {
    const get = await scope.fetch(url, { cache: 'no-store' });
    return get.ok;
  } catch (_) {
    return false;
  }
}

async function localWorkerExists(workerUrl, dataUrl, scope) {
  return resourceExists(workerUrl, scope) && resourceExists(dataUrl, scope);
}

function rewriteWorkerDataReference(source, dataUrl) {
  const replacement = `var REMOTE_PACKAGE_BASE=${JSON.stringify(dataUrl)};`;
  return String(source || '')
    .replace(/var REMOTE_PACKAGE_BASE=\"[^\"]+\";/, replacement)
    .replace(/var REMOTE_PACKAGE_NAME=\"[^\"]+\";/, replacement);
}

async function makeRemoteWorkerBlob(scope, workerUrl, dataUrl) {
  const response = await scope.fetch(workerUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error('无法加载 eSpeak-NG 语音引擎。');
  let source = await response.text();
  source = rewriteWorkerDataReference(source, dataUrl);
  return scope.URL.createObjectURL(new scope.Blob([source], { type: 'application/javascript' }));
}

export function createEspeakSpeaker({ scope = globalThis, localWorker = DEFAULT_LOCAL_WORKER, remoteWorker = DEFAULT_REMOTE_WORKER, remoteData = DEFAULT_REMOTE_DATA } = {}) {
  const queue = createSpeechQueueState();
  let ttsPromise = null;
  let workerBlobUrl = null;

  async function getTTS() {
    if (ttsPromise) return ttsPromise;
    ttsPromise = new Promise(async (resolve, reject) => {
      try {
        if (typeof scope.eSpeakNG !== 'function') throw new Error('eSpeak-NG wrapper 没有加载。');
        const localData = localWorker.replace(/\.js$/, '.data');
        const hasLocalData = await resourceExists(localData, scope);
        const hasLocalWorker = await localWorkerExists(localWorker, localData, scope);
        const workerPath = hasLocalWorker
          ? localWorker
          : await makeRemoteWorkerBlob(scope, remoteWorker, remoteData);
        if (!hasLocalWorker) workerBlobUrl = workerPath;
        const instance = new scope.eSpeakNG(workerPath, () => resolve(instance));
        instance.set_voice('en-us');
        instance.set_pitch(50);
      } catch (error) {
        reject(error);
      }
    });
    return ttsPromise;
  }

  async function speak(text, appRate = 0.82) {
    const value = String(text || '').trim();
    if (!value) return false;
    const requestId = queue.next(value);
    const ctx = audioContextFor(scope);
    if (!ctx) return false;

    try {
      const tts = await getTTS();
      if (!queue.isCurrent(requestId)) return true;
      tts.set_rate(mapVoiceRate(appRate));
      tts.set_pitch(50);
      tts.set_voice('en-us');
      const chunks = [];
      await new Promise((resolve, reject) => {
        try {
          tts.synthesize(value, (samples) => {
            if (samples) chunks.push(normalizeSamples(samples));
            else resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
      if (!queue.isCurrent(requestId)) return true;
      const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Float32Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return playSamples(scope, combined, 22050);
    } catch (error) {
      console.warn('eSpeak-NG playback failed:', error);
      return false;
    }
  }

  function stop() {
    queue.next('');
    if (scope.__elderEnglishSource) {
      try { scope.__elderEnglishSource.stop(); } catch (_) {}
      try { scope.__elderEnglishSource.disconnect(); } catch (_) {}
      scope.__elderEnglishSource = null;
    }
  }

  function cleanup() {
    stop();
    if (workerBlobUrl) {
      try { scope.URL.revokeObjectURL(workerBlobUrl); } catch (_) {}
      workerBlobUrl = null;
    }
  }

  return { speak, stop, cleanup };
}

function audioAssetUrl(text, scope = globalThis) {
  const manifest = scope?.__ELDER_ENGLISH_AUDIO_MANIFEST || globalThis?.__ELDER_ENGLISH_AUDIO_MANIFEST || {};
  return manifest[String(text || '')] || '';
}

function speakStaticAudio(text, scope) {
  const url = audioAssetUrl(text, scope);
  const AudioCtor = scope?.Audio || globalThis?.Audio;
  if (!url || !AudioCtor) return false;
  try {
    const previous = scope?.__elderEnglishAudio;
    if (previous) { previous.pause?.(); previous.currentTime = 0; }
    const audio = new AudioCtor(url);
    audio.preload = 'auto';
    audio.volume = 1;
    scope.__elderEnglishAudio = audio;
    const result = audio.play?.();
    if (result?.catch) result.catch(() => {});
    return true;
  } catch (_) { return false; }
}

function speakNativeForDirectHtml(text, rate, scope) {
  const synth = scope?.speechSynthesis;
  const Utterance = scope?.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return false;
  synth.cancel?.();
  const utterance = new Utterance(String(text || ''));
  utterance.lang = 'en-US';
  utterance.rate = Math.max(0.55, Math.min(1, Number(rate) || 0.82));
  utterance.pitch = 1;
  synth.speak(utterance);
  return true;
}

export function speakEnglish(text, rate = 0.82, scope = globalThis) {
  if (speakStaticAudio(text, scope)) return true;
  return speakNativeForDirectHtml(text, rate, scope);
}
