// Bhashini API integration for Indian language translation and ASR

const BHASHINI_BASE = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const BHASHINI_KEY = import.meta.env.VITE_BHASHINI_KEY || '';
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY || '';

// Language codes for Bhashini
export const LANGUAGE_CODES = {
  en: 'en',
  hi: 'hi',
  bn: 'bn',
  ta: 'ta',
  te: 'te',
  mr: 'mr',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
  pa: 'pa',
  or: 'or',
};

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'কನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬী', flag: '🇮🇳' },
];

// Translate text via Google Cloud or Bhashini
export async function translateText(text, sourceLang, targetLang) {
  if (sourceLang === targetLang || !text) return text;

  // 1. Try Google Cloud Translation (Primary)
  if (GOOGLE_KEY) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        }),
      });
      const data = await res.json();
      if (data?.data?.translations?.[0]?.translatedText) {
        return data.data.translations[0].translatedText;
      }
    } catch (e) {
      console.warn('Google Translate failed, trying Bhashini...', e.message);
    }
  }

  // 2. Try Bhashini (Fallback)
  if (BHASHINI_KEY) {
    try {
      const res = await fetch(BHASHINI_BASE, {
        method: 'POST',
        headers: {
          'Authorization': BHASHINI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipelineTasks: [{
            taskType: 'translation',
            config: {
              language: { sourceLanguage: sourceLang, targetLanguage: targetLang },
            },
          }],
          inputData: {
            input: [{ source: text }],
          },
        }),
      });

      if (!res.ok) throw new Error('Bhashini translation failed');
      const data = await res.json();
      return data?.pipelineResponse?.[0]?.output?.[0]?.target || text;
    } catch (e) {
      console.warn('Bhashini fallback failed:', e.message);
    }
  }

  return text;
}

// Web Speech API — voice input
export function startVoiceInput(language = 'hi-IN', onResult, onEnd, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    onResult(transcript, event.results[event.results.length - 1].isFinal);
  };

  recognition.onend = onEnd;
  recognition.onerror = (e) => onError?.(e.error);
  recognition.start();

  return recognition;
}

// Web Speech API — voice output
export function speakText(text, lang = 'hi-IN', onEnd) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  if (match) utterance.voice = match;

  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// Language code to speech language
export function getLangSpeechCode(code) {
  const map = {
    en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN',
    te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
    ml: 'ml-IN', pa: 'pa-IN',
  };
  return map[code] || 'hi-IN';
}
