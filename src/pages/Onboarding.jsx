import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { upsertProfile } from '../lib/supabase';
import { PageTransition } from '../components/UI';
import { LANGUAGES } from '../lib/bhashini';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const ROLES = [
  { value: 'student', emoji: '🎒', label: 'Student', desc: 'Class 3 to college' },
  { value: 'teacher', emoji: '📖', label: 'Teacher', desc: 'School or college faculty' },
  { value: 'parent', emoji: '👨‍👩‍👧', label: 'Parent', desc: 'Monitor child\'s learning' },
  { value: 'self_learner', emoji: '💡', label: 'Self Learner', desc: 'Learning independently' },
];

const GRADES = ['3','4','5','6','7','8','9','10','11','12','UG Year 1','UG Year 2','UG Year 3','PG'];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

const BACKGROUNDS = [
  { value: 'rural', emoji: '🌾', label: 'Rural', desc: 'Village or small town' },
  { value: 'urban', emoji: '🏙️', label: 'Urban', desc: 'City or metro' },
  { value: 'tribal', emoji: '🌲', label: 'Tribal', desc: 'Tribal/forest region' },
];

const OCCUPATIONS = [
  'Farming', 'Daily wage labor', 'Small business', 'Government job',
  'Teaching', 'Healthcare', 'Fishing', 'Handicraft', 'Dairy farming', 'Other',
];

const ACCESSIBILITY_NEEDS = [
  { key: 'dyslexiaMode', label: 'Dyslexia support', emoji: '📖' },
  { key: 'lowVision', label: 'Low vision / high contrast', emoji: '👁️' },
  { key: 'motorDifficulty', label: 'Motor difficulty (large buttons)', emoji: '✋' },
  { key: 'adhdMode', label: 'ADHD focus mode', emoji: '⚡' },
];

const STEPS_CONFIG = [
  { id: 'role', title: 'I am a…', subtitle: 'This helps us personalize your experience' },
  { id: 'grade', title: 'My Grade / Level', subtitle: 'We\'ll adapt content to your level' },
  { id: 'language', title: 'Preferred Language', subtitle: 'EduSense will respond in your language' },
  { id: 'location', title: 'My State', subtitle: 'Stories will use local cultural context' },
  { id: 'context', title: 'Family Background', subtitle: 'Helps create relatable examples' },
  { id: 'accessibility', title: 'Accessibility Needs', subtitle: 'We make learning easier for everyone' },
];

export default function Onboarding() {
  const { user, setProfile, setAccessibility } = useAppStore();
  const navigate = useNavigate();
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    role: '', grade: '', language: 'hi', state: '', background: 'rural',
    family_occupation: '', accessibility: {},
  });

  const set = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      const profile = {
        id: user?.id,
        name: user?.email?.split('@')[0] || 'Student',
        role: data.role,
        grade: isNaN(parseInt(data.grade)) ? null : parseInt(data.grade),
        language: data.language,
        state: data.state,
        background: data.background,
        family_occupation: data.family_occupation,
        accessibility_settings: data.accessibility,
        gyaan_coins: 0,
        streak_count: 0,
        visual_literacy_level: 1,
      };
      await upsertProfile(profile);
      setProfile(profile);

      // Apply accessibility
      Object.entries(data.accessibility).forEach(([key, value]) => {
        if (value) setAccessibility(key, true);
      });

      toast.success('Profile set up! Let\'s start learning 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0 && !data.role) return false;
    if (step === 1 && data.role === 'student' && !data.grade) return false;
    return true;
  };

  const renderStep = () => {
    switch (STEPS_CONFIG[step].id) {
      case 'role':
        return (
          <div className="grid grid-cols-2 gap-4">
            {ROLES.map(r => (
              <button
                key={r.value}
                id={`role-${r.value}`}
                onClick={() => set('role', r.value)}
                className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  data.role === r.value
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                }`}
              >
                <div className="text-3xl mb-2">{r.emoji}</div>
                <p className="font-semibold text-gray-900 dark:text-white">{t(r.label)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t(r.desc)}</p>
              </button>
            ))}
          </div>
        );

      case 'grade':
        if (data.role !== 'student' && data.role !== 'self_learner') {
          return (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-600 dark:text-gray-400">{t('Grade selection is for students only. Continue to next step.')}</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {GRADES.map(g => (
              <button
                key={g}
                id={`grade-${g}`}
                onClick={() => set('grade', g)}
                className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                  data.grade === g
                    ? 'bg-primary text-white shadow-glow-orange'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary/10'
                }`}
              >
                {t(g)}
              </button>
            ))}
          </div>
        );

      case 'language':
        return (
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                id={`lang-${lang.code}`}
                onClick={() => set('language', lang.code)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  data.language === lang.code
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{lang.native}</p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
                {data.language === lang.code && <Check size={16} className="ml-auto text-primary" />}
              </button>
            ))}
          </div>
        );

      case 'location':
        return (
          <div>
            <select
              id="select-state"
              value={data.state}
              onChange={e => set('state', e.target.value)}
              className="input-base mb-6"
            >
              <option value="">{t('Select your state / UT')}</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-sm text-gray-500 mb-3">{t('Background')}</p>
            <div className="grid grid-cols-3 gap-3">
              {BACKGROUNDS.map(b => (
                <button
                  key={b.value}
                  id={`bg-${b.value}`}
                  onClick={() => set('background', b.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    data.background === b.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{b.emoji}</div>
                  <p className="text-sm font-semibold">{t(b.label)}</p>
                  <p className="text-xs text-gray-500">{t(b.desc)}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'context':
        return (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('We use this to create culturally familiar examples in stories. For example, if your family farms, we\'ll use farming scenarios to explain math and science.')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATIONS.map(occ => (
                <button
                  key={occ}
                  id={`occ-${occ}`}
                  onClick={() => set('family_occupation', occ)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 ${
                    data.family_occupation === occ
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t(occ)}
                </button>
              ))}
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">{t('Select any that apply. You can always change these in Settings.')}</p>
            <div className="space-y-3">
              {ACCESSIBILITY_NEEDS.map(a => (
                <button
                  key={a.key}
                  id={`access-${a.key}`}
                  onClick={() => set('accessibility', { ...data.accessibility, [a.key]: !data.accessibility[a.key] })}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    data.accessibility[a.key]
                      ? 'border-secondary bg-secondary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-secondary/40'
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{t(a.label)}</span>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    data.accessibility[a.key] ? 'bg-secondary border-secondary' : 'border-gray-300'
                  }`}>
                    {data.accessibility[a.key] && <Check size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#0C0A09] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS_CONFIG.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card p-8">
            <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">
              {t('Step')} {step + 1} {t('of')} {STEPS_CONFIG.length}
            </p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {t(STEPS_CONFIG[step].title)}
            </h2>
            <p className="text-gray-500 text-sm mb-8">{t(STEPS_CONFIG[step].subtitle)}</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                id="btn-onboard-back"
                className="btn-ghost disabled:opacity-30"
              >
                <ArrowLeft size={18} /> {t('Back')}
              </button>

              {step < STEPS_CONFIG.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  id="btn-onboard-next"
                  className="btn-primary disabled:opacity-50"
                >
                  {t('Next')} <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  id="btn-onboard-finish"
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? t('Saving…') : t('Start Learning 🚀')}
                </button>
              )}
            </div>

            {step < STEPS_CONFIG.length - 1 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setStep(s => s + 1)}
                  id="btn-skip-step"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t('Skip for now')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
