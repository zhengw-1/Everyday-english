let translatorPromise;

export async function translateZhToEn(text, onProgress = () => {}) {
  const input = String(text || '').trim();
  if (!input) throw new Error('请先说一句中文，或者打字。');
  if (!translatorPromise) {
    onProgress('第一次使用正在下载免费翻译工具，可能需要一点时间…');
    translatorPromise = (async () => {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm');
      env.allowLocalModels = false;
      return pipeline('translation', 'Xenova/opus-mt-zh-en', { dtype: 'q8' });
    })();
  } else {
    onProgress('正在翻译…');
  }
  const translator = await translatorPromise;
  const result = await translator(input, { max_new_tokens: 128 });
  const output = Array.isArray(result) ? result[0] : result;
  const translated = output?.translation_text || output?.generated_text || '';
  if (!translated) throw new Error('这次没有翻译成功，请再试一次。');
  onProgress('');
  return translated.trim();
}
