import { motion } from 'framer-motion';
import { useT } from '../hooks/useT';

// ── GamifiedCard ──
export function GamifiedCard({ children, className = '', onClick, glowColor = 'orange' }) {
  const glowMap = { orange: 'hover:shadow-glow-orange', purple: 'hover:shadow-glow-purple', green: 'hover:shadow-glow-green' };
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`gamified-card ${glowMap[glowColor] || ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ── CoinDisplay ──
export function CoinDisplay({ amount, size = 'md', showBurst = false }) {
  const sizes = { sm: 'text-sm gap-1', md: 'text-base gap-1.5', lg: 'text-xl gap-2' };
  return (
    <motion.div
      animate={showBurst ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : {}}
      transition={{ duration: 0.5 }}
      className={`relative inline-flex items-center ${sizes[size]}`}
    >
      <span>🪙</span>
      <span className="font-heading font-bold text-yellow-700 dark:text-yellow-400">{amount.toLocaleString()}</span>
      {showBurst && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 rounded-full bg-yellow-300 opacity-30"
        />
      )}
    </motion.div>
  );
}

// ── StreakFlame ──
export function StreakFlame({ count, size = 'md' }) {
  const sizes = { sm: 28, md: 40, lg: 60 };
  const s = sizes[size] || 40;
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={{ scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative streak-glow rounded-full"
      >
        <svg width={s} height={s} viewBox="0 0 40 40" fill="none" className="drop-shadow-lg">
          <defs>
            <linearGradient id="fireGrad" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <path d="M20 4C20 4 28 14 28 22C28 26.4 24.4 30 20 30C15.6 30 12 26.4 12 22C12 19 13.5 16.5 15 15C15 15 14 20 18 21C18 21 16 17 20 14C20 14 18 18 22 19C22 19 24 16 22 11C22 11 26 14 26 20C27.5 18 27 16 26 13C27.5 14 30 17 30 22C30 27.5 25.5 32 20 32C14.5 32 10 27.5 10 22C10 14 20 4 20 4Z" fill="url(#fireGrad)" />
          <ellipse cx="20" cy="24" rx="5" ry="3" fill="#FBBF24" opacity="0.6" />
        </svg>
      </motion.div>
      <span className="font-heading font-bold text-orange-600 dark:text-orange-400 leading-none">{count}</span>
    </div>
  );
}

// ── GapTypeBadge ──
const GAP_INFO = {
  conceptual:      { label: 'Conceptual', color: 'badge-conceptual', emoji: '🧠' },
  linguistic:      { label: 'Linguistic', color: 'badge-linguistic', emoji: '💬' },
  procedural:      { label: 'Procedural', color: 'badge-procedural', emoji: '⚙️' },
  prior_knowledge: { label: 'Prior Knowledge', color: 'badge-prior_knowledge', emoji: '📚' },
  attention:       { label: 'Attention', color: 'badge-attention', emoji: '👁️' },
  rote:            { label: 'Rote Learning', color: 'badge-rote', emoji: '🦜' },
  none:            { label: 'Understood ✓', color: 'badge-none', emoji: '✅' },
};

export function GapTypeBadge({ type, showEmoji = true }) {
  const { t } = useT();
  const info = GAP_INFO[type] || GAP_INFO['none'];
  return (
    <span className={`badge-gap ${info.color}`}>
      {showEmoji && <span>{info.emoji}</span>}
      {t(info.label)}
    </span>
  );
}

// ── SpectrumMeter ──
export function SpectrumMeter({ score = 0, animate: doAnimate = true, label = true }) {
  const { t } = useT();
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#EAB308' : score >= 25 ? '#F97316' : '#EF4444';
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{t('Not aware')}</span>
          <span className="text-sm font-semibold" style={{ color }}>{score}%</span>
          <span className="text-xs text-gray-500">{t('Mastered')}</span>
        </div>
      )}
      <div className="spectrum-bar">
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15, delay: 0.2 }}
          className="spectrum-indicator"
        />
      </div>
    </div>
  );
}

// ── LoadingSkeleton ──
export function Skeleton({ className = '', height = 'h-4' }) {
  return <div className={`skeleton ${height} ${className}`} />;
}

// ── PageTransition ──
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ── EduSense Thinking Indicator ──
export function ThinkingIndicator({ label = 'EduSense AI is thinking...' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-xl">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
      <span className="text-sm text-primary font-medium">{label}</span>
    </div>
  );
}

// ── Empty State ──
export function EmptyState({ icon = '📚', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
