import { motion, AnimatePresence } from 'framer-motion';

export default function EmotionIndicator({ emotion }) {
  if (!emotion) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={emotion.key}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: emotion.color }}
        />
        <span className="text-white text-xs font-semibold">{emotion.emoji} {emotion.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
