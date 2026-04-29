import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { startVoiceInput, getLangSpeechCode } from '../lib/bhashini';
import { useAppStore } from '../store/useAppStore';

export default function VoiceInput({ onTranscript, placeholder = 'Click mic to speak...' }) {
  const { language } = useAppStore();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = () => {
    const speechLang = getLangSpeechCode(language);
    setRecording(true);
    setTranscript('');
    setInterim('');

    recognitionRef.current = startVoiceInput(
      speechLang,
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterim('');
          onTranscript?.(text);
        } else {
          setInterim(text);
        }
      },
      () => setRecording(false),
      (err) => {
        console.error('Speech error:', err);
        setRecording(false);
      }
    );
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Waveform or button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={recording ? stopRecording : startRecording}
        id="btn-voice-input"
        aria-label={recording ? 'Stop recording' : 'Start voice input'}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          recording
            ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'bg-primary text-white shadow-glow-orange'
        }`}
      >
        {recording ? <Square size={22} /> : <Mic size={22} />}

        {/* Pulse rings */}
        {recording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
            <span className="absolute -inset-3 rounded-full border border-red-300 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
          </>
        )}
      </motion.button>

      {/* Waveform bars */}
      {recording && (
        <div className="flex items-center gap-1 h-10">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{ animationDelay: `${i * 0.1}s`, height: `${8 + Math.random() * 24}px` }}
            />
          ))}
        </div>
      )}

      {/* Live transcript */}
      <AnimatePresence>
        {(interim || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm px-4 py-2 bg-primary/5 rounded-xl text-sm text-gray-700 dark:text-gray-300"
          >
            {interim || transcript}
            {interim && <span className="animate-pulse">|</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {!recording && !transcript && (
        <p className="text-xs text-gray-400">{placeholder}</p>
      )}
    </div>
  );
}
