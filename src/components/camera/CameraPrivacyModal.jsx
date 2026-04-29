import { motion } from 'framer-motion';

export default function CameraPrivacyModal({ onAllow, onSkip }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 text-3xl">
            👁️
          </div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-1">
            DRISHTI CAM
          </h2>
          <p className="text-sm text-gray-500 italic">"Your camera sees what your words can't say."</p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            EduSense AI uses your camera to:
          </p>
          {[
            { icon: '✅', text: 'Detect if you look confused or confident' },
            { icon: '✅', text: 'Read your written work to find where you\'re stuck' },
            { icon: '✅', text: 'Read questions from your textbook or paper' },
            { icon: '❌', text: 'We never store your face images' },
            { icon: '❌', text: 'Images are analysed and immediately deleted' },
            { icon: '❌', text: 'No facial recognition or identity tracking' },
          ].map(item => (
            <div key={item.text} className="flex items-start gap-3">
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            id="btn-allow-camera"
            onClick={onAllow}
            className="btn-primary w-full py-3 text-base"
          >
            📷 Allow Camera
          </button>
          <button
            id="btn-skip-camera"
            onClick={onSkip}
            className="btn-ghost w-full text-sm text-gray-500"
          >
            Skip — Use Text Instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}
