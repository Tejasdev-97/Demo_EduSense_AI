import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translateBatch } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';

const Ctx = createContext({ t: x => x, lang: 'en', ready: false });

export function TranslationProvider({ children }) {
  const { language } = useAppStore();
  const [map, setMap] = useState({});
  const [ready, setReady] = useState(false);
  const prevLang = useRef('en');

  // Queue for strings that haven't been translated yet
  const queueRef = useRef(new Set());
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (language === prevLang.current) return;
    prevLang.current = language;
    setMap({});
    queueRef.current.clear();
    
    if (!language || language === 'en') {
      setReady(true);
      return;
    }
    setReady(true);
  }, [language]);

  const processQueue = useCallback(async () => {
    if (queueRef.current.size === 0 || !language || language === 'en') return;
    const textsToTranslate = Array.from(queueRef.current);
    queueRef.current.clear();

    try {
      const translated = await translateBatch(textsToTranslate, language);
      setMap(prev => {
        const newMap = { ...prev };
        textsToTranslate.forEach((s, i) => {
          newMap[s] = translated[i] || s;
        });
        return newMap;
      });
    } catch (err) {
      console.error('Translation error:', err);
    }
  }, [language]);

  // t(englishText) → translated string (or original if no translation)
  const t = useCallback(
    (text) => {
      if (!text || typeof text !== 'string' || language === 'en') return text;
      if (map[text]) return map[text];

      // If not in map and not already queued, enqueue it
      if (!queueRef.current.has(text)) {
        queueRef.current.add(text);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(processQueue, 300); // Process queue every 300ms
      }
      return text; // Return English immediately until translated
    },
    [map, language, processQueue]
  );

  return <Ctx.Provider value={{ t, lang: language, ready }}>{children}</Ctx.Provider>;
}

export function useTranslation() { return useContext(Ctx); }
