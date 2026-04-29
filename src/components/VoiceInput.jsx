import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, AlertCircle } from 'lucide-react';
import { startVoiceInput, getLangSpeechCode } from '../lib/bhashini';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

export default function VoiceInput({ onTranscript, placeholder = 'Tap mic to speak...' }) {
  const { language } = useAppStore();
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim]       = useState('');
  const [error, setError]           = useState('');
  const recognitionRef = useRef(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startRecording = () => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    setError('');
    setRecording(true);
    setTranscript('');
    setInterim('');

    recognitionRef.current = startVoiceInput(
      getLangSpeechCode(language),
      (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterim('');
          setRecording(false);
          onTranscript?.(text);
        } else {
          setInterim(text);
        }
      },
      () => setRecording(false),   // onEnd
      (err) => {
        console.error('Speech error:', err);
        setRecording(false);
        if (err === 'not-allowed') {
          setError('Microphone access denied. Please allow mic permission in your browser settings.');
          toast.error('Microphone permission denied');
        } else if (err === 'network') {
          setError('Network error. Please check your internet connection.');
        } else if (err === 'no-speech') {
          // Silently ignore — user just didn't speak
          setRecording(false);
        } else {
          setError('Voice error: ' + err);
        }
      }
    );
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Main mic button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={recording ? stopRecording : startRecording}
        id="btn-voice-input"
        aria-label={recording ? 'Stop recording' : 'Start voice input'}
        disabled={!isSupported}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
          recording
            ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'bg-primary text-white shadow-glow-orange hover:scale-105'
        }`}
      >
        {recording ? <Square size={22} /> : <Mic size={22} />}

        {/* Pulse rings when recording */}
        {recording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
            <span className="absolute -inset-3 rounded-full border border-red-300 animate-ping opacity-30" style={{ animationDelay: '0.3s' }} />
          </>
        )}
      </motion.button>

      {/* Animated waveform bars */}
      {recording && (
        <div className="flex items-center gap-1 h-10">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Live interim transcript */}
      <AnimatePresence>
        {(interim || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm px-4 py-2 bg-primary/5 rounded-xl text-sm text-gray-700 dark:text-gray-300 text-center"
          >
            {interim || transcript}
            {interim && <span className="animate-pulse ml-0.5">|</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 w-full max-w-sm px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Placeholder */}
      {!recording && !transcript && !error && (
        <p className="text-xs text-gray-400 text-center">{placeholder}</p>
      )}

      {/* Status label */}
      {recording && (
        <p className="text-xs text-red-500 font-medium animate-pulse">🔴 Listening… tap to stop</p>
      )}
    </div>
  );
}
