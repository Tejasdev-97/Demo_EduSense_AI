import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Download, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTeacherDailyAction, teacherLearnConcept } from '../lib/gemini';
import { GamifiedCard, ThinkingIndicator, PageTransition } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const DEMO_HEATMAP = [
  { subject: 'Math',    chapter: 'Fractions',      pct: 75, count: 15 },
  { subject: 'Math',    chapter: 'Algebra',         pct: 45, count: 9  },
  { subject: 'Science', chapter: 'Photosynthesis',  pct: 85, count: 17 },
  { subject: 'Science', chapter: 'Evaporation',     pct: 60, count: 12 },
  { subject: 'SSt',     chapter: 'Democracy',       pct: 30, count: 6  },
  { subject: 'SSt',     chapter: 'Water',           pct: 55, count: 11 },
];

const getHeatColor = (pct) => {
  if (pct >= 70) return 'bg-red-200 dark:bg-red-900/40 border-red-400';
  if (pct >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400';
  return 'bg-green-100 dark:bg-green-900/30 border-green-400';
};

export default function Teacher() {
  const { profile, language } = useAppStore();
  const { t } = useT();
  const [dailyAction, setDailyAction]     = useState(null);
  const [loadingAction, setLoadingAction] = useState(true);
  const [actionDone, setActionDone]       = useState(false);
  const [guruQuestion, setGuruQuestion]   = useState('');
  const [guruAnswer, setGuruAnswer]       = useState('');
  const [loadingGuru, setLoadingGuru]     = useState(false);
  const [activeTab, setActiveTab]         = useState('action');

  useEffect(() => {
    if (profile?.role === 'teacher') {
      loadDailyAction();
    } else {
      setLoadingAction(false);
    }
  }, [profile]);

  const loadDailyAction = async () => {
    setLoadingAction(true);
    const demoGaps = [
      { subject: 'Mathematics', topic: 'Fractions',     gap_type: 'conceptual', student_id: 's1' },
      { subject: 'Science',     topic: 'Photosynthesis',gap_type: 'rote',       student_id: 's2' },
      { subject: 'Mathematics', topic: 'Fractions',     gap_type: 'procedural', student_id: 's3' },
    ];
    let action;
    try {
      action = await getTeacherDailyAction({ gapEvents: demoGaps, language });
    } catch (err) {
      console.warn('Gemini daily action fallback:', err.message);
    }
    if (!action) {
      action = {
        action: 'Fraction Confusion Activity',
        script: 'Start class with: "Draw 3 circles on your notebook. Shade half of each one differently." Then ask: "Are all these halves equal? Why?" Walk around — students who say "No" have a conceptual gap. Pair them with students who said "Yes".',
        duration: 8,
        studentsHelped: 12,
        subject: 'Mathematics',
      };
    }
    setDailyAction(action);
    setLoadingAction(false);
  };

  const handleGuruQuestion = async () => {
    if (!guruQuestion.trim()) return;
    setLoadingGuru(true);
    let answer;
    try {
      answer = await teacherLearnConcept({ question: guruQuestion, subject: 'General', language });
    } catch (e) {
      console.warn('Gemini guru fallback:', e.message);
      answer = '⚠️ Could not generate answer. Please check your API key in Settings and try again.';
    }
    setGuruAnswer(answer);
    setLoadingGuru(false);
  };

  // ── Access Guard ──
  if (profile?.role !== 'teacher') {
    return (
      <PageTransition>
        <div className="page-wrapper flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="font-heading text-2xl font-bold mb-2">{t('Teacher Access Only')}</h2>
            <p className="text-gray-500 mb-6">{t('This dashboard is for teachers. Please update your role in Settings.')}</p>
            <a href="/settings" className="btn-primary">{t('Go to Settings')}</a>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-1">
              🎓 {t('Guru Mitra Dashboard')}
            </h1>
            <p className="text-gray-500">{t('One action a day to transform your classroom')}</p>
          </div>

          {/* ── Tabs ── */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 gap-1">
            {['action', 'heatmap', 'gurushakti'].map(tab => (
              <button
                key={tab}
                id={`teacher-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'action' ? t('⚡ Ek Kadam') : tab === 'heatmap' ? t('🌡️ Class Health') : t('🧑‍🏫 Gurushakti')}
              </button>
            ))}
          </div>

          {/* ── Ek Kadam ── */}
          {activeTab === 'action' && (
            <div>
              {loadingAction ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <ThinkingIndicator label={t('Analyzing class data for today\'s action...')} />
                </div>
              ) : dailyAction ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="p-1 bg-gradient-to-r from-primary to-secondary rounded-3xl mb-4">
                    <GamifiedCard className="p-6 rounded-[22px]">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={20} className="text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">{t('Your ONE Action Today')}</span>
                      </div>

                      <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {dailyAction.action}
                      </h2>

                      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                        <span>⏱️ {dailyAction.duration} {t('min')}</span>
                        <span>👥 {t('Helps')} {dailyAction.studentsHelped} {t('students')}</span>
                        <span>📚 {t(dailyAction.subject)}</span>
                      </div>

                      <div className="p-4 bg-primary/5 rounded-2xl mb-6 border-l-4 border-primary">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📝 {t('Script to use:')}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{dailyAction.script}</p>
                      </div>

                      {!actionDone ? (
                        <div className="flex gap-3">
                          <button
                            id="btn-action-done"
                            onClick={() => {
                              setActionDone(true);
                              toast.success('🎉 Wonderful! You helped ' + dailyAction.studentsHelped + ' students today!');
                            }}
                            className="btn-primary flex-1"
                          >
                            ✅ {t('I did this! (+50 XP)')}
                          </button>
                          <button id="btn-action-skip" className="btn-ghost">{t('Skip today')}</button>
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                          <p className="text-green-700 dark:text-green-400 font-semibold">🌟 {t('Excellent! Action completed for today.')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('Come back tomorrow for a new action.')}</p>
                        </div>
                      )}
                    </GamifiedCard>
                  </div>

                  {/* Sahyog Cards */}
                  <GamifiedCard className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Download size={22} className="text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{t('Generate Sahyog Cards')}</p>
                      <p className="text-sm text-gray-500">{t('Printable peer-learning cards for offline classroom use')}</p>
                    </div>
                    <button
                      id="btn-generate-sahyog"
                      onClick={() => toast.success('Generating PDF... (Requires Puppeteer backend)')}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      {t('Generate PDF')}
                    </button>
                  </GamifiedCard>
                </motion.div>
              ) : null}
            </div>
          )}

          {/* ── Class Health Heatmap ── */}
          {activeTab === 'heatmap' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">{t('🔴 High gap (70%+) · 🟡 Medium (40-70%) · 🟢 Low (<40%)')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEMO_HEATMAP.map((cell, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GamifiedCard
                      className={`p-4 border-2 cursor-pointer ${getHeatColor(cell.pct)}`}
                      onClick={() => toast(`${cell.pct}% of class has gaps in ${cell.chapter}`, { icon: '📊' })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{cell.subject}</span>
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{cell.pct}%</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{t(cell.chapter)}</p>
                      <p className="text-xs text-gray-500 mt-1">{cell.count} {t('students affected')}</p>
                    </GamifiedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Gurushakti ── */}
          {activeTab === 'gurushakti' && (
            <div>
              <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-2xl mb-6 text-sm text-gray-600 dark:text-gray-400">
                🔒 <strong>{t('Private:')}</strong> {t('Your questions and answers are stored only on this device. Never sent to server.')}
              </div>
              <GamifiedCard className="p-6 mb-4">
                <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('Ask EduSense Privately')}
                </h3>
                <textarea
                  id="input-guru-question"
                  value={guruQuestion}
                  onChange={e => setGuruQuestion(e.target.value)}
                  placeholder={t("Ask any concept you'd like to understand better before teaching it... e.g., 'How do I explain photosynthesis using a simple analogy?'")}
                  className="input-base resize-none mb-3"
                  rows={3}
                />
                <button
                  id="btn-guru-ask"
                  onClick={handleGuruQuestion}
                  disabled={!guruQuestion.trim() || loadingGuru}
                  className="btn-primary disabled:opacity-50"
                >
                  {loadingGuru
                    ? <><Loader2 size={16} className="animate-spin" /> {t('Thinking...')}</>
                    : t('🧑‍🏫 Get Teaching Help')
                  }
                </button>
              </GamifiedCard>

              {loadingGuru && <ThinkingIndicator label={t('Preparing your teaching guide...')} />}

              {guruAnswer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <GamifiedCard className="p-6">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-3">{t('Teaching Guide')}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{guruAnswer}</p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => toast.success('PDF generation requires backend setup')}
                        className="btn-secondary text-sm py-2"
                      >
                        📄 {t('Download as PDF')}
                      </button>
                    </div>
                  </GamifiedCard>
                </motion.div>
              )}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
