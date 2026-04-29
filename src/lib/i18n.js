// i18n.js — Google Translate API batch translation with localStorage cache

const KEY  = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;
const BASE = 'https://translation.googleapis.com/language/translate/v2';

// In-memory cache (lives for the session)
const mem = new Map();

function ck(text, lang) { return `${lang}|${text}`; }

function fromStorage(k) {
  try { return localStorage.getItem('tr_' + k) || null; } catch { return null; }
}
function toStorage(k, v) {
  try { localStorage.setItem('tr_' + k, v); } catch { /* quota */ }
}

export async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;
  const k = ck(text, targetLang);
  if (mem.has(k)) return mem.get(k);
  const stored = fromStorage(k);
  if (stored) { mem.set(k, stored); return stored; }
  if (!KEY) return text;

  try {
    const res  = await fetch(`${BASE}?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: targetLang, source: 'en', format: 'text' }),
    });
    const data = await res.json();
    const out  = data?.data?.translations?.[0]?.translatedText || text;
    mem.set(k, out);
    toStorage(k, out);
    return out;
  } catch { return text; }
}

export async function translateBatch(texts, targetLang) {
  if (!texts.length || !targetLang || targetLang === 'en') return texts;

  const results = new Array(texts.length);
  const pending = [];   // { text, idx }

  texts.forEach((text, i) => {
    const k = ck(text, targetLang);
    if (mem.has(k))              { results[i] = mem.get(k); return; }
    const stored = fromStorage(k);
    if (stored)                  { mem.set(k, stored); results[i] = stored; return; }
    pending.push({ text, i });
  });

  if (!pending.length || !KEY) {
    pending.forEach(({ text, i }) => { results[i] = text; });
    return results;
  }

  try {
    // Google Translate allows max 128 strings per request
    const chunks = [];
    for (let c = 0; c < pending.length; c += 100)
      chunks.push(pending.slice(c, c + 100));

    for (const chunk of chunks) {
      const res  = await fetch(`${BASE}?key=${KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: chunk.map(p => p.text), target: targetLang, source: 'en', format: 'text' }),
      });
      const data = await res.json();
      const trs  = data?.data?.translations || [];
      chunk.forEach(({ text, i }, ci) => {
        const out = trs[ci]?.translatedText || text;
        results[i] = out;
        const k = ck(text, targetLang);
        mem.set(k, out);
        toStorage(k, out);
      });
    }
  } catch {
    pending.forEach(({ text, i }) => { results[i] = text; });
  }

  return results;
}
