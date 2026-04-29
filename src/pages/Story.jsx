import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { generateStory } from '../lib/gemini';
import { speakText, stopSpeaking, getLangSpeechCode } from '../lib/bhashini';
import { saveStory } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { GamifiedCard, ThinkingIndicator, PageTransition, GapTypeBadge } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const STAGE_LABELS = ['Analyzing Gap', 'Creating Story', 'Generating Visuals', 'Ready!'];

// Placeholder panel images using gradient + emoji
const PANEL_COLORS = [
  'from-orange-300 to-yellow-400',
  'from-purple-300 to-pink-400',
  'from-blue-300 to-cyan-400',
  'from-green-300 to-teal-400',
];

const PANEL_EMOJIS = ['🌾', '💡', '🎯', '⭐'];

export default function Story() {
  const { currentGapEvent, profile, language } = useAppStore();
  const { t } = useT();
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(0);
  const [activePanel, setActivePanel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [helpedStatus, setHelpedStatus] = useState(null); // 'yes' | 'no'
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (currentGapEvent) {
      generateVisualStory();
    } else {
      // Demo story
      setPanels(getDemoStory());
      setLoading(false);
    }
  }, [currentGapEvent]);

  useEffect(() => {
    if (!autoPlay || activePanel >= panels.length - 1) return;
    const timer = setTimeout(() => setActivePanel(p => p + 1), 5000);
    return () => clearTimeout(timer);
  }, [autoPlay, activePanel, panels.length]);

  const generateVisualStory = async () => {
    setLoading(true);
    try {
      for (let i = 0; i <= 3; i++) {
        setStage(i);
        await new Promise(r => setTimeout(r, 600));
      }

      const storyPanels = await generateStory({
        concept: currentGapEvent?.confusedWith || 'the concept',
        subject: currentGapEvent?.subject || 'General',
        gapType: currentGapEvent?.gapType || 'conceptual',
        visualLiteracyLevel: profile?.visual_literacy_level || 2,
        language: language || 'hi',
        culturalProfile: {
          state: profile?.state,
          background: profile?.background,
          occupation: profile?.family_occupation,
        },
      });

      // Save offline
      await saveStory({
        id: `story-${Date.now()}`,
        subject: currentGapEvent?.subject,
        gapType: currentGapEvent?.gapType,
        grade: profile?.grade,
        panels: storyPanels,
      });

      setPanels(storyPanels);
    } catch (err) {
      console.error(err);
      toast.error('Story generation failed, showing demo story');
      setPanels(getDemoStory());
    }
    setLoading(false);
  };

  const getDemoStory = () => [
    { panelNumber: 1, sceneDescription: 'A farmer stands in a wheat field measuring it with a rope', dialogue: 'मैं अपने खेत की दूरी माप रहा हूँ!', conceptConnection: 'Perimeter is the boundary distance around a shape' },
    { panelNumber: 2, sceneDescription: 'Farmer walks around the entire boundary of the field', dialogue: 'चारों तरफ की दूरी = परिमाप!', conceptConnection: 'Walking around shows what perimeter means' },
    { panelNumber: 3, sceneDescription: 'Farmer inside the field looking at the total area of crops', dialogue: 'अंदर की जगह = क्षेत्रफल', conceptConnection: 'Area is the space inside the boundary' },
    { panelNumber: 4, sceneDescription: 'Side-by-side comparison of boundary rope vs filled crop area', dialogue: 'परिमाप ≠ क्षेत्रफल — अलग-अलग हैं!', conceptConnection: 'Final distinction between perimeter and area' },
  ];

  const handleSpeak = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const panel = panels[activePanel];
    if (!panel) return;
    setSpeaking(true);
    speakText(panel.dialogue, getLangSpeechCode(language), () => setSpeaking(false));
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="page-wrapper flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className={`absolute inset-0 rounded-full border-2 ${i <= stage ? 'border-primary' : 'border-gray-200'}`}
                  style={{ inset: `${i * 8}px` }}
                  animate={i <= stage ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              {STAGE_LABELS.map((label, i) => (
                <div key={label} className={`flex items-center gap-2 text-sm transition-all ${i <= stage ? 'text-primary font-medium' : 'text-gray-300 dark:text-gray-600'}`}>
                  {i < stage ? '✓' : i === stage ? <Loader2 size={12} className="animate-spin" /> : '○'}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📖 {t('Your Learning Story')}
            </h1>
            {currentGapEvent && (
              <div className="flex items-center justify-center gap-2">
                <GapTypeBadge type={currentGapEvent.gapType} />
                <span className="text-sm text-gray-500">{currentGapEvent.subject}</span>
              </div>
            )}
          </div>

          {/* Comic Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {panels.map((panel, i) => (
              <motion.div
                key={panel.panelNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActivePanel(i)}
                className={`comic-panel cursor-pointer ${activePanel === i ? 'ring-2 ring-primary shadow-glow-orange' : ''}`}
              >
                {/* Panel image placeholder */}
                <div className={`w-full aspect-video bg-gradient-to-br ${PANEL_COLORS[i]} flex items-center justify-center relative`}>
                  <span className="text-6xl">{PANEL_EMOJIS[i]}</span>
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white text-xs font-bold">
                    {panel.panelNumber}
                  </div>
                </div>

                {/* Dialogue bubble */}
                <div className="dialogue-bubble mx-3 mb-3 dark:bg-gray-800 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{panel.dialogue}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active Panel Detail */}
          <AnimatePresence mode="wait">
            {panels[activePanel] && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GamifiedCard className="p-5 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-2">
                        {t('Panel')} {activePanel + 1} — {t('What this teaches')}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {panels[activePanel].conceptConnection}
                      </p>
                    </div>
                    <button
                      id="btn-speak-panel"
                      onClick={handleSpeak}
                      className={`p-3 rounded-xl transition-all flex-shrink-0 ${speaking ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                      aria-label={speaking ? 'Stop speaking' : 'Listen to panel'}
                    >
                      {speaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                </GamifiedCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              id="btn-prev-panel"
              onClick={() => setActivePanel(p => Math.max(0, p - 1))}
              disabled={activePanel === 0}
              className="btn-ghost disabled:opacity-30"
            >
              <ChevronLeft size={18} /> {t('Previous')}
            </button>

            <div className="flex gap-1.5">
              {panels.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePanel(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${activePanel === i ? 'bg-primary w-6' : 'bg-gray-300 dark:bg-gray-600'}`}
                />
              ))}
            </div>

            <button
              id="btn-next-panel"
              onClick={() => setActivePanel(p => Math.min(panels.length - 1, p + 1))}
              disabled={activePanel === panels.length - 1}
              className="btn-ghost disabled:opacity-30"
            >
              {t('Next')} <ChevronRight size={18} />
            </button>
          </div>

          {/* Did this help? */}
          {!helpedStatus && (
            <GamifiedCard className="p-5 text-center">
              <p className="font-semibold text-gray-900 dark:text-white mb-4">{t('Did this story help you understand?')}</p>
              <div className="flex gap-4 justify-center">
                <button
                  id="btn-story-helped-yes"
                  onClick={() => { setHelpedStatus('yes'); toast.success('+25 to your understanding score! 🎉'); }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-semibold hover:bg-green-200 transition-all"
                >
                  <ThumbsUp size={18} /> {t('Yes, I get it!')}
                </button>
                <button
                  id="btn-story-helped-no"
                  onClick={() => { setHelpedStatus('no'); toast('Trying a different approach...', { icon: '🔄' }); }}
                  className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-semibold hover:bg-red-200 transition-all"
                >
                  <ThumbsDown size={18} /> {t('Not quite')}
                </button>
              </div>
            </GamifiedCard>
          )}

          {helpedStatus === 'yes' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <GamifiedCard className="p-6 text-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-heading text-xl font-bold text-green-700 dark:text-green-400 mb-2">{t('Bodh Siddhi!')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('You\'ll get a re-check in 48 hours to make sure it sticks.')}</p>
                <a href="/progress" className="btn-primary bg-green-500 hover:bg-green-600">{t('View My Progress')}</a>
              </GamifiedCard>
            </motion.div>
          )}

          {helpedStatus === 'no' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <GamifiedCard className="p-6 text-center">
                <p className="font-semibold mb-4">{t('Let\'s try a different approach')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/chat" className="btn-secondary">💬 {t('Ask SAHAYAK')}</a>
                  <a href="/peer" className="btn-outline">👥 {t('Get Peer Help')}</a>
                  <button onClick={() => { setHelpedStatus(null); generateVisualStory(); }} className="btn-ghost">
                    🔄 {t('New Story')}
                  </button>
                </div>
              </GamifiedCard>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
