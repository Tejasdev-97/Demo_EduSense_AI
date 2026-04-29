import { motion } from 'framer-motion';

const GAP_COLORS = {
  conceptual:      'bg-red-100 text-red-700 border-red-200',
  linguistic:      'bg-blue-100 text-blue-700 border-blue-200',
  procedural:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  prior_knowledge: 'bg-purple-100 text-purple-700 border-purple-200',
  attention:       'bg-orange-100 text-orange-700 border-orange-200',
  rote:            'bg-pink-100 text-pink-700 border-pink-200',
  none:            'bg-green-100 text-green-700 border-green-200',
};

const GAP_LABELS = {
  conceptual:      '🔴 Conceptual Gap',
  linguistic:      '🔵 Linguistic Gap',
  procedural:      '🟡 Procedural Gap',
  prior_knowledge: '🟣 Prior Knowledge Gap',
  attention:       '🟠 Attention Slip',
  rote:            '🩷 Rote Learning',
  none:            '🟢 No Gap Detected',
};

export default function CameraInsightCard({ workAnalysis, capturedImage, emotionKey }) {
  if (!workAnalysis) return null;
  const colorClass = GAP_COLORS[workAnalysis.gapType] || GAP_COLORS.conceptual;
  const label = GAP_LABELS[workAnalysis.gapType] || workAnalysis.gapType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-amber-50 dark:bg-gray-800 mb-4"
    >
      <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">📷 Camera Insight</p>
      </div>
      <div className="flex gap-3 p-4">
        {capturedImage && (
          <div className="flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
            <img src={capturedImage} alt="Captured work" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border mb-2 ${colorClass}`}>
            {label}
          </span>
          {workAnalysis.keyObservation && (
            <div className="mb-1">
              <p className="text-xs text-gray-500 font-medium">What we saw:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{workAnalysis.keyObservation}</p>
            </div>
          )}
          {workAnalysis.gapLocation && (
            <div>
              <p className="text-xs text-gray-500 font-medium">Gap at:</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{workAnalysis.gapLocation}</p>
            </div>
          )}
        </div>
      </div>
      {emotionKey && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400">Expression during analysis: <strong>{emotionKey}</strong></p>
        </div>
      )}
    </motion.div>
  );
}
