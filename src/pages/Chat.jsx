import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Volume2, VolumeX, Paperclip,
  ChevronDown, Trash2, Copy, Loader2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { chatWithSahayak, hasGeminiKey } from '../lib/gemini';
import { speakText, stopSpeaking, getLangSpeechCode, startVoiceInput } from '../lib/bhashini';
import { saveChatMessage } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { PageTransition, ThinkingIndicator } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const OUTPUT_FORMATS = [
  { value: 'plain',      label: '📄 Plain Text'   },
  { value: 'bullets',    label: '• Bullet Points'  },
  { value: 'mindmap',    label: '🗺️ Mind Map'      },
  { value: 'flashcards', label: '🃏 Flashcards'    },
  { value: 'story',      label: '📖 Story'         },
  { value: 'quiz',       label: '🎯 Quiz'          },
];

function ChatBubble({ message, onSpeak }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
          🤖
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <button
              onClick={() => onSpeak(message.content)}
              className="text-gray-400 hover:text-primary transition-colors"
              title="Read aloud"
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success('Copied!');
              }}
              className="text-gray-400 hover:text-primary transition-colors"
              title="Copy"
            >
              <Copy size={14} />
            </button>
            <span className="text-xs text-gray-400">SAHAYAK</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">
          👤
        </div>
      )}
    </motion.div>
  );
}

// ── No-Key Banner ──
function NoKeyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3"
    >
      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Gemini API key not found
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          SAHAYAK needs a key to work. Paste yours in Settings → Gemini API Key.
        </p>
      </div>
      <a
        href="/settings"
        className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0"
      >
        Settings <ExternalLink size={11} />
      </a>
    </motion.div>
  );
}

export default function Chat() {
  const { profile, language } = useAppStore();
  const { t } = useT();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `नमस्ते! 🙏 I'm SAHAYAK, your EduSense AI learning companion.\n\nAsk me anything about your studies! I can explain concepts, create quizzes, tell stories, or just have a friendly chat about what you're learning.\n\nYou can also attach files or use your voice!`,
    }
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [recording, setRecording]   = useState(false);
  const [outputFormat, setOutputFormat] = useState('plain');
  const [formatOpen, setFormatOpen] = useState(false);
  const [keyAvailable, setKeyAvailable] = useState(hasGeminiKey());

  const bottomRef     = useRef(null);
  const recognitionRef = useRef(null);
  const sessionId     = useRef(`chat-${Date.now()}`);

  // Re-check key every time the window is focused (e.g. user saved key in Settings)
  useEffect(() => {
    const onFocus = () => setKeyAvailable(hasGeminiKey());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;

    // Re-check key each time — catches case where user just saved it
    setKeyAvailable(hasGeminiKey());

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await saveChatMessage(sessionId.current, userMsg);
    } catch (_) {}

    try {
      const allMessages = [...messages, userMsg];
      const reply = await chatWithSahayak({
        messages: allMessages,
        language,
        outputFormat,
        userProfile: profile,
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages(prev => [...prev, assistantMsg]);
      try { await saveChatMessage(sessionId.current, assistantMsg); } catch (_) {}

    } catch (err) {
      const isKeyError = !hasGeminiKey() || err.message?.toLowerCase().includes('api key');
      setKeyAvailable(false);

      const errorContent = isKeyError
        ? `🔑 No API key found!\n\nTo use SAHAYAK:\n1. Go to ⚙️ Settings (top nav)\n2. Find "Gemini API Key"\n3. Get a free key at aistudio.google.com\n4. Paste it and click Save Key\n\nI'll be ready as soon as you do! 🚀`
        : `⚠️ ${err.message || 'Connection error. Please try again.'}`;

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: errorContent },
      ]);
      if (!isKeyError) toast.error(err.message || 'SAHAYAK is offline');
    }

    setLoading(false);
  };

  const handleVoiceToggle = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input requires Chrome or Edge browser');
      return;
    }
    setRecording(true);
    recognitionRef.current = startVoiceInput(
      getLangSpeechCode(language),
      (text, isFinal) => {
        if (isFinal) {
          setRecording(false);
          sendMessage(text);
        }
      },
      () => setRecording(false),
      (err) => {
        setRecording(false);
        if (err === 'not-allowed') toast.error('Microphone access denied');
        else if (err !== 'no-speech') toast.error('Voice error: ' + err);
      }
    );
  };

  const handleSpeak = (text) => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    speakText(text, getLangSpeechCode(language), () => setSpeaking(false));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = `[Attached file: ${file.name}]\n${ev.target.result?.substring(0, 2000) || ''}`;
      sendMessage(content);
    };
    if (file.type.startsWith('text')) reader.readAsText(file);
    else reader.readAsDataURL(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: 'Chat cleared. नमस्ते! 🙏 What would you like to learn today?',
    }]);
  };

  const currentFormat = OUTPUT_FORMATS.find(f => f.value === outputFormat);

  return (
    <PageTransition>
      <div className="flex flex-col h-screen bg-[#FFFBF5] dark:bg-[#0C0A09] pt-16">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">SAHAYAK</p>
              <p className={`text-xs font-medium ${keyAvailable ? 'text-green-500' : 'text-amber-500'}`}>
                {keyAvailable ? '● Online — EduSense AI' : '⚠ No API key — Go to Settings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Output format selector */}
            <div className="relative">
              <button
                id="btn-format-select"
                onClick={() => setFormatOpen(!formatOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                {currentFormat ? t(currentFormat.label) : ''}
                <ChevronDown size={12} className={`transition-transform ${formatOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {formatOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                  >
                    {OUTPUT_FORMATS.map(f => (
                      <button
                        key={f.value}
                        id={`fmt-${f.value}`}
                        onClick={() => { setOutputFormat(f.value); setFormatOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          outputFormat === f.value
                            ? 'text-primary bg-primary/5 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {t(f.label)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {speaking && (
              <button onClick={() => { stopSpeaking(); setSpeaking(false); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                <VolumeX size={18} />
              </button>
            )}

            <button
              id="btn-clear-chat"
              onClick={clearChat}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Clear chat"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* ── No-key warning banner ── */}
        {!keyAvailable && <NoKeyBanner />}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} onSpeak={handleSpeak} />
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
                <ThinkingIndicator label={t('SAHAYAK is thinking...')} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="flex-shrink-0 px-4 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 nav-safe">

          {/* Quick suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
            {['Explain this concept', 'Give me a quiz', 'Tell a story', 'Simplify this'].map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium whitespace-nowrap hover:bg-primary/20 transition-all flex-shrink-0 disabled:opacity-40"
              >
                {t(s)}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            {/* File attach */}
            <label id="btn-attach-file" className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 cursor-pointer transition-all flex-shrink-0">
              <Paperclip size={20} />
              <input type="file" className="hidden" accept=".pdf,.txt,.jpg,.png,.docx" onChange={handleFileUpload} />
            </label>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                id="input-chat-message"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={keyAvailable ? t('Ask SAHAYAK anything...') : t('Ask anything... (add API key in Settings to enable AI)')}
                rows={1}
                className="w-full input-base resize-none max-h-32 overflow-y-auto py-3"
                style={{ height: 'auto', minHeight: '48px' }}
              />
            </div>

            {/* Voice */}
            <motion.button
              id="btn-voice-chat"
              whileTap={{ scale: 0.9 }}
              onClick={handleVoiceToggle}
              disabled={loading}
              className={`p-3 rounded-xl transition-all flex-shrink-0 disabled:opacity-40 ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-primary hover:bg-primary/10'
              }`}
              aria-label="Voice input"
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>

            {/* Send */}
            <motion.button
              id="btn-send-chat"
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </motion.button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
