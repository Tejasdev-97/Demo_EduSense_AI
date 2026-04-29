import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Ear, Zap, Palette, Type, X, Accessibility
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const TOGGLES = [
  { key: 'dyslexiaMode', label: 'Dyslexia Mode', icon: Type, desc: 'OpenDyslexic font, wider spacing' },
  { key: 'lowVision', label: 'Low Vision', icon: Eye, desc: 'Larger text, high contrast' },
  { key: 'motorDifficulty', label: 'Motor Support', icon: Accessibility, desc: 'Larger touch targets, voice-first' },
  { key: 'adhdMode', label: 'ADHD Focus', icon: Zap, desc: 'Reduced motion, focus mode' },
];

const COLOR_BLIND_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanopia', label: 'Protanopia' },
  { value: 'tritanopia', label: 'Tritanopia' },
];

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const { accessibility, setAccessibility } = useAppStore();

  // Apply settings on mount
  useEffect(() => {
    Object.entries(accessibility).forEach(([key, value]) => {
      setAccessibility(key, value);
    });
  }, []);

  return (
    <>
      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        id="btn-accessibility"
        aria-label="Accessibility settings"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-secondary dark:bg-violet-500 text-white shadow-glow-purple flex items-center justify-center"
      >
        <Accessibility size={22} />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
            className="fixed bottom-20 right-6 z-50 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-card-hover border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-secondary/5">
              <div className="flex items-center gap-2">
                <Accessibility size={18} className="text-secondary" />
                <span className="font-heading font-semibold text-gray-900 dark:text-white">Accessibility</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {/* Toggles */}
              {TOGGLES.map(({ key, label, icon: Icon, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{label}</p>
                      <p className="text-xs text-gray-500 truncate">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAccessibility(key, !accessibility[key])}
                    id={`toggle-${key}`}
                    role="switch"
                    aria-checked={accessibility[key]}
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${
                      accessibility[key] ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`absolute top-0.5 bottom-0.5 aspect-square rounded-full bg-white shadow-sm transition-all duration-200 ${
                      accessibility[key] ? 'right-0.5 left-auto' : 'left-0.5 right-auto'
                    }`} />
                  </button>
                </div>
              ))}

              {/* Color Blind */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={15} className="text-secondary" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Color Blind Filter</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_BLIND_OPTIONS.map(({ value, label }) => (
                    <button
                      key={String(value)}
                      onClick={() => setAccessibility('colorBlind', value)}
                      id={`colorblind-${value || 'none'}`}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        accessibility.colorBlind === value
                          ? 'border-secondary bg-secondary/10 text-secondary font-semibold'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-secondary/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
