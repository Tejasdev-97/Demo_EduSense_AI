import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, RotateCcw, ChevronRight, AlertCircle, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { detectGap, getSocraticQuestions, getRoteReformulations } from '../lib/gemini';
import { saveGapEvent, addPendingSync } from '../lib/db';
import { insertGapEvent } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { GapTypeBadge, SpectrumMeter, ThinkingIndicator, PageTransition, GamifiedCard } from '../components/UI';
import VoiceInput from '../components/VoiceInput';
import DrishtiCam from '../components/camera/DrishtiCam';
import CameraInsightCard from '../components/camera/CameraInsightCard';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const SUBJECTS = ['Mathematics','Science','Social Science','English','Hindi','Physics','Chemistry','Biology','History','Geography','Economics','Computer Science'];

const SAMPLE_TOPICS = {
  Mathematics: ['Fractions','Area & Perimeter','Algebra','Trigonometry','Statistics'],
  Science: ['Photosynthesis','Evaporation','Newton\'s Laws','Cell Structure','Chemical Reactions'],
  'Social Science': ['Democracy','Water Resources','Mughal Empire','French Revolution','Globalisation'],
};

export default function GapTest() {
  const { profile, language, isOnline, setCurrentGapEvent } = useAppStore();
  const { t } = useT();
  const [phase, setPhase] = useState('setup'); // setup | question | detecting | result | socratic | verify
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [inputMode, setInputMode] = useState('text'); // text | voice
  const [gapResult, setGapResult] = useState(null);
  const [socraticQs, setSocraticQs] = useState([]);
  const [socraticIdx, setSocraticIdx] = useState(0);
  const [socraticAnswers, setSocraticAnswers] = useState([]);
  const [socraticAnswer, setSocraticAnswer] = useState('');
  const [cameraInsight, setCameraInsight] = useState(null);

  const handleVoiceTranscript = (text) => setAnswer(text);

  const handleSubmitAnswer = async (overrides = {}) => {
    const studentAnswer = overrides.answer || answer;
    if (!studentAnswer.trim() && !overrides.workAnalysis && !overrides.emotionKey) return;
    setPhase('detecting');
    try {
      const result = await detectGap({
        question: overrides.questionContext?.questionText || question,
        studentAnswer: studentAnswer || '(Camera analysis — see work)',
        subject, topic,
        grade: profile?.grade || 8,
        language: language || 'en',
        emotionDetected: overrides.emotionLabel || null,
        workAnalysis: overrides.workAnalysis || null,
      });

      // If camera provided a gap signal, prefer it if confidence is high
      if (overrides.workAnalysis?.confidence === 'high') {
        result.gapType      = overrides.gapType || result.gapType;
        result.spectrumScore = overrides.spectrumScore || result.spectrumScore;
      }

      setGapResult(result);
      setCurrentGapEvent(result);
      if (overrides.workAnalysis) {
        setCameraInsight({ workAnalysis: overrides.workAnalysis, capturedWorkImg: overrides.capturedWorkImg, emotionKey: overrides.emotionKey });
      }

      const evt = {
        studentId: profile?.id || 'guest',
        subject, topic,
        question: overrides.questionContext?.questionText || question,
        studentAnswer,
        gapType: result.gapType,
        spectrumScore: result.spectrumScore,
        isRote: result.isRote,
        confusedWith: result.confusedWith,
        inputModality: overrides.inputModality || inputMode,
      };
      await saveGapEvent(evt);

      if (profile?.id && isOnline) {
        const { error } = await insertGapEvent({ student_id: profile.id, ...evt, created_at: new Date() });
        if (error) await addPendingSync('gap_event', evt);
      }

      const qs = await getSocraticQuestions({ concept: topic, subject, language });
      setSocraticQs(qs);
      setSocraticIdx(0);
      setPhase('result');
    } catch (err) {
      toast.error(err.message || 'Gap detection failed');
      setPhase('question');
    }
  };

  const handleNextSocratic = () => {
    if (socraticAnswer.trim()) {
      setSocraticAnswers(prev => [...prev, socraticAnswer]);
      setSocraticAnswer('');
    }
    if (socraticIdx < socraticQs.length - 1) {
      setSocraticIdx(i => i + 1);
    } else {
      setPhase('done');
    }
  };

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🎯 {t('Comprehension Gap Test')}
            </h1>
            <p className="text-gray-500">{t('Detect exactly where your understanding breaks — not just scores')}</p>
          </div>

          {/* Phase: Setup */}
          <AnimatePresence mode="wait">
            {phase === 'setup' && (
              <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <GamifiedCard className="p-6">
                  <h2 className="font-heading text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('Choose Your Topic')}</h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Subject')}</label>
                    <select id="select-subject" value={subject} onChange={e => { setSubject(e.target.value); setTopic(''); }} className="input-base">
                      <option value="">Select subject</option>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Topic')}</label>
                    <input
                      id="input-topic"
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g., Fractions, Photosynthesis, Democracy..."
                      className="input-base"
                      list="topic-suggestions"
                    />
                    <datalist id="topic-suggestions">
                      {(SAMPLE_TOPICS[subject] || []).map(t => <option key={t} value={t} />)}
                    </datalist>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Your Question')}</label>
                    <textarea
                      id="input-question"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      placeholder="Type the question or problem you're working on..."
                      className="input-base resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    id="btn-start-test"
                    onClick={() => setPhase('question')}
                    disabled={!subject || !topic || !question}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {t('Start Test')} <ChevronRight size={18} />
                  </button>
                </GamifiedCard>
              </motion.div>
            )}

            {/* Phase: Question / Answer */}
            {phase === 'question' && (
              <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <GamifiedCard className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">{subject}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{topic}</span>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl mb-6">
                    <p className="font-medium text-gray-900 dark:text-white">{question}</p>
                  </div>

                  {/* Input mode toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
                    {['text', 'voice', 'camera'].map(m => (
                      <button
                        key={m}
                        id={`mode-${m}`}
                        onClick={() => setInputMode(m)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                          inputMode === m ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                        }`}
                      >
                        {m === 'text' ? '⌨️ Text' : m === 'voice' ? '🎤 Voice' : '📷 Camera'}
                      </button>
                    ))}
                  </div>

                  {inputMode === 'text' ? (
                    <textarea
                      id="input-answer"
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder={t('Type your answer here...')}
                      className="input-base resize-none mb-4"
                      rows={4}
                    />
                  ) : inputMode === 'voice' ? (
                    <div className="flex flex-col items-center py-6 mb-4">
                      <VoiceInput onTranscript={handleVoiceTranscript} />
                      {answer && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-gray-700 dark:text-gray-300 w-full">
                          <strong>Your answer:</strong> {answer}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <DrishtiCam
                        subject={subject}
                        topic={topic}
                        question={question}
                        grade={profile?.grade || 8}
                        language={language || 'en'}
                        onSubmit={handleSubmitAnswer}
                      />
                    </div>
                  )}

                  {inputMode !== 'camera' && (
                    <div className="flex gap-3">
                      <button onClick={() => setPhase('setup')} className="btn-ghost">
                        <RotateCcw size={16} /> {t('Back')}
                      </button>
                      <button
                        id="btn-submit-answer"
                        onClick={() => handleSubmitAnswer()}
                        disabled={!answer.trim()}
                        className="btn-primary flex-1 disabled:opacity-50"
                      >
                        <Send size={16} /> {t('Analyze Answer')}
                      </button>
                    </div>
                  )}
                </GamifiedCard>
              </motion.div>
            )}

            {/* Phase: Detecting */}
            {phase === 'detecting' && (
              <motion.div key="detecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 gap-6">
                {/* Radar animation */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                  <div className="absolute inset-2 rounded-full border border-primary/20" />
                  <div className="radar-ring absolute w-16 h-16" />
                  <div className="radar-ring absolute w-16 h-16" style={{ animationDelay: '0.7s' }} />
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 size={24} className="text-primary animate-spin" />
                  </div>
                </div>
                <ThinkingIndicator label="EduSense AI is analyzing your answer..." />
                <p className="text-sm text-gray-400">Detecting comprehension gaps...</p>
              </motion.div>
            )}

            {/* Phase: Result */}
            {phase === 'result' && gapResult && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {cameraInsight && (
                  <CameraInsightCard
                    workAnalysis={cameraInsight.workAnalysis}
                    capturedImage={cameraInsight.capturedWorkImg}
                    emotionKey={cameraInsight.emotionKey}
                  />
                )}
                <GamifiedCard className="p-6 mb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-xl font-semibold text-gray-900 dark:text-white">{t('Gap Analysis')}</h2>
                    <GapTypeBadge type={gapResult.gapType} />
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">{t('Understanding Level')}</p>
                    <SpectrumMeter score={gapResult.spectrumScore} />
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{gapResult.explanation}</p>
                  </div>

                  {gapResult.confusedWith && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        You may be confusing this with: <strong>{gapResult.confusedWith}</strong>
                      </p>
                    </div>
                  )}

                  {gapResult.isRote && (
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-pink-600" />
                      <p className="text-sm text-pink-700 dark:text-pink-400">
                        🦜 Possible rote memorization detected. Let's check with follow-up questions!
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {gapResult.gapType !== 'none' && (
                      <a href="/story" className="btn-primary text-sm py-3">
                        📖 {t('See Story Explanation')}
                      </a>
                    )}
                    <button
                      id="btn-start-socratic"
                      onClick={() => setPhase('socratic')}
                      className="btn-secondary text-sm py-3"
                    >
                      🤔 {t('Socratic Questions')}
                    </button>
                  </div>
                </GamifiedCard>
              </motion.div>
            )}

            {/* Phase: Socratic */}
            {phase === 'socratic' && socraticQs.length > 0 && (
              <motion.div key="socratic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GamifiedCard className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary font-semibold text-sm">Socratic Question {socraticIdx + 1}/{socraticQs.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-6">
                    <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${((socraticIdx + 1) / socraticQs.length) * 100}%` }} />
                  </div>

                  <div className="p-4 bg-secondary/5 rounded-xl mb-4">
                    <p className="font-medium text-gray-900 dark:text-white">🤔 {socraticQs[socraticIdx]}</p>
                  </div>

                  <textarea
                    id="input-socratic-answer"
                    value={socraticAnswer}
                    onChange={e => setSocraticAnswer(e.target.value)}
                    placeholder="Think out loud..."
                    className="input-base resize-none mb-4"
                    rows={3}
                  />

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl mb-4">
                    <p className="text-xs text-green-700 dark:text-green-400">
                      💚 There's no wrong answer here. Take your time and think through it.
                    </p>
                  </div>

                  <button id="btn-next-socratic" onClick={handleNextSocratic} className="btn-primary w-full">
                    {socraticIdx < socraticQs.length - 1 ? 'Next Question →' : 'Finish →'}
                  </button>
                </GamifiedCard>
              </motion.div>
            )}

            {/* Done */}
            {phase === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <GamifiedCard className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('Analysis Complete!')}</h2>
                  <p className="text-gray-500 mb-6">{t('Great job engaging with the questions.')}</p>
                  <div className="flex flex-col gap-3">
                    <a href="/story" className="btn-primary">📖 {t('See Story Explanation')}</a>
                    <a href="/progress" className="btn-secondary">📊 {t('View My Progress')}</a>
                    <button onClick={() => { setPhase('setup'); setAnswer(''); setGapResult(null); }} className="btn-ghost">
                      <RotateCcw size={16} /> {t('Try Another Topic')}
                    </button>
                  </div>
                </GamifiedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
