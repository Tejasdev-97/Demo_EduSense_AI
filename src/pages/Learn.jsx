import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, ChevronRight, Lock, Check, Star, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateLearningPath } from '../lib/gemini';
import { GamifiedCard, PageTransition, ThinkingIndicator, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', emoji: '🔢', color: 'from-blue-400 to-cyan-500', chapters: ['Numbers', 'Fractions', 'Algebra', 'Geometry', 'Statistics'] },
  { id: 'sci', name: 'Science', emoji: '🔬', color: 'from-green-400 to-teal-500', chapters: ['Matter', 'Living World', 'Forces', 'Light', 'Electricity'] },
  { id: 'sst', name: 'Social Studies', emoji: '🌍', color: 'from-orange-400 to-yellow-500', chapters: ['History', 'Geography', 'Civics', 'Economics'] },
  { id: 'eng', name: 'English', emoji: '📖', color: 'from-purple-400 to-pink-500', chapters: ['Grammar', 'Literature', 'Writing', 'Comprehension'] },
  { id: 'hi', name: 'Hindi', emoji: '🕉️', color: 'from-red-400 to-orange-500', chapters: ['व्याकरण', 'साहित्य', 'लेखन', 'बोधन'] },
  { id: 'cs', name: 'Computer Science', emoji: '💻', color: 'from-gray-600 to-slate-500', chapters: ['Basics', 'Programming', 'Internet', 'Algorithms'] },
];

export default function Learn() {
  const { profile, language } = useAppStore();
  const { t } = useT();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);

  const handleSubjectSelect = async (subj) => {
    setSelectedSubject(subj);
    setGeneratingPath(true);

    try {
      const path = await generateLearningPath({
        subject: subj.name,
        grade: profile?.grade || 8,
        gaps: [],
        language,
      });
      setLearningPath(path);
    } catch (err) {
      // Use default path
      setLearningPath(subj.chapters.map((ch, i) => ({
        chapter: ch,
        type: i === 0 ? 'completed' : i <= 2 ? 'normal' : 'locked',
        prerequisiteFor: null,
        estimatedMinutes: 15,
        description: `Learn about ${ch}`,
      })));
    }
    setGeneratingPath(false);
  };

  if (!selectedSubject) {
    return (
      <PageTransition>
        <div className="page-wrapper">
          <div className="container-main">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📚 {t('Choose Your Subject')}
              </h1>
              <p className="text-gray-500">
                {profile?.grade ? `${t('Grade')} ${profile.grade} — ` : ''}{t('Your adaptive learning path awaits')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SUBJECTS.map((subj, i) => (
                <motion.div
                  key={subj.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <GamifiedCard
                    className="p-6 cursor-pointer group"
                    onClick={() => handleSubjectSelect(subj)}
                    glowColor={i % 3 === 0 ? 'orange' : i % 3 === 1 ? 'purple' : 'green'}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subj.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      {subj.emoji}
                    </div>
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">{t(subj.name)}</h3>
                    <p className="text-xs text-gray-500 mb-3">{subj.chapters.length} {t('chapters')}</p>
                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                      <Play size={14} /> {t('Start Learning')}
                    </div>
                  </GamifiedCard>
                </motion.div>
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
        <div className="container-main">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => { setSelectedSubject(null); setLearningPath(null); }} className="btn-ghost py-2 px-3">
              ← {t('Back')}
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
                {selectedSubject.emoji} {t(selectedSubject.name)}
              </h1>
              <p className="text-sm text-gray-500">{t('Adaptive learning path — gaps bridged, path updated')}</p>
            </div>
          </div>

          {generatingPath ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <ThinkingIndicator label={t('Generating your personalized learning path...')} />
            </div>
          ) : learningPath ? (
            <div>
              {/* Horizontal Roadmap */}
              <div className="overflow-x-auto pb-4 mb-8">
                <div className="flex items-center gap-0 min-w-max px-4">
                  {learningPath.map((node, i) => (
                    <div key={i} className="flex items-center">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => setActiveChapter(i)}
                        id={`chapter-node-${i}`}
                        className={`relative flex flex-col items-center group ${node.type === 'locked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
                          activeChapter === i ? 'border-primary shadow-glow-orange scale-110' :
                          node.type === 'completed' ? 'bg-green-100 border-green-400' :
                          node.type === 'micro' ? 'bg-yellow-100 border-yellow-400' :
                          node.type === 'bridge' ? 'bg-purple-100 border-purple-400' :
                          node.type === 'locked' ? 'bg-gray-100 border-gray-200' :
                          'bg-white dark:bg-gray-800 border-primary/30 hover:border-primary'
                        }`}>
                          {node.type === 'completed' ? '✅' :
                           node.type === 'locked' ? '🔒' :
                           node.type === 'micro' ? '⚡' :
                           node.type === 'bridge' ? '🌉' : '📖'}
                        </div>
                        <p className="text-xs text-center mt-2 font-medium w-20 leading-tight text-gray-700 dark:text-gray-300">
                          {node.chapter}
                        </p>
                        {node.type === 'micro' && (
                          <span className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {t('Foundation')}
                          </span>
                        )}
                      </motion.button>

                      {i < learningPath.length - 1 && (
                        <div className={`w-8 h-0.5 mt-[-20px] ${
                          node.type === 'completed' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapter Detail */}
              {activeChapter !== null && learningPath[activeChapter] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activeChapter}
                >
                  <GamifiedCard className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                          {learningPath[activeChapter].chapter}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            learningPath[activeChapter].type === 'micro' ? 'bg-yellow-100 text-yellow-700' :
                            learningPath[activeChapter].type === 'bridge' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {learningPath[activeChapter].type === 'micro' ? t('⚡ Foundation Lesson') : 
                             learningPath[activeChapter].type === 'bridge' ? t('🌉 Bridge Content') : t('📖 Chapter')}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {learningPath[activeChapter].estimatedMinutes || 15} min
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{learningPath[activeChapter].description}</p>

                    {learningPath[activeChapter].type !== 'locked' ? (
                      <div className="flex gap-3">
                        <a href="/gap-test" className="btn-primary flex-1">
                          <Play size={16} /> {t('Start Chapter')}
                        </a>
                        <a href="/chat" className="btn-secondary">
                          {t('Ask SAHAYAK')}
                        </a>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-500 text-center">
                        🔒 {t('Complete previous chapters to unlock this')}
                      </div>
                    )}
                  </GamifiedCard>
                </motion.div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
