import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, GraduationCap, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { upsertProfile } from '../lib/supabase';
import { PageTransition } from '../components/UI';
import { LANGUAGES } from '../lib/bhashini';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const GRADES = ['3','4','5','6','7','8','9','10','11','12','UG Year 1','UG Year 2','UG Year 3','PG'];
const SUBJECTS = ['Mathematics','Science','Social Science','English','Hindi','Physics','Chemistry','Biology','History','Geography','Computer Science','Physical Education'];

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
  'Farming','Daily wage labor','Small business','Government job',
  'Teaching','Healthcare','Fishing','Handicraft','Dairy farming','Other',
];

const ACCESSIBILITY_NEEDS = [
  { key: 'dyslexiaMode', label: 'Dyslexia support', emoji: '📖' },
  { key: 'lowVision', label: 'Low vision / high contrast', emoji: '👁️' },
  { key: 'motorDifficulty', label: 'Motor difficulty (large buttons)', emoji: '✋' },
  { key: 'adhdMode', label: 'ADHD focus mode', emoji: '⚡' },
];

// Steps for STUDENTS
const STUDENT_STEPS = [
  { id: 'grade',         title: 'Your Grade',          subtitle: 'We\'ll adapt content to your level' },
  { id: 'language',     title: 'Preferred Language',   subtitle: 'EduSense will respond in your language' },
  { id: 'location',     title: 'Your State',            subtitle: 'Stories will use local cultural context' },
  { id: 'context',      title: 'Family Background',    subtitle: 'Helps create relatable examples' },
  { id: 'accessibility',title: 'Accessibility Needs',  subtitle: 'We make learning easier for everyone' },
];

// Steps for TEACHERS
const TEACHER_STEPS = [
  { id: 'subject',      title: 'Subject You Teach',    subtitle: 'We\'ll tailor insights to your subject' },
  { id: 'language',     title: 'Preferred Language',   subtitle: 'EduSense will respond in your language' },
  { id: 'location',     title: 'Your State',            subtitle: 'Local context for your classroom' },
  { id: 'accessibility',title: 'Accessibility Needs',  subtitle: 'Make your dashboard accessible' },
];

export default function Onboarding() {
  const { user, profile, setProfile, setAccessibility } = useAppStore();
  const navigate = useNavigate();
  const { t } = useT();

  // Detect role from profile saved during signup
  const userRole = profile?.role || 'student';
  const steps = userRole === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    grade: profile?.grade ? String(profile.grade) : '',
    subject: profile?.subject || '',
    language: 'hi',
    state: '',
    background: 'rural',
    family_occupation: '',
    accessibility: {},
  });

  const setField = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const canNext = () => {
    const currentStep = steps[step].id;
    if (currentStep === 'grade' && !data.grade) return false;
    if (currentStep === 'subject' && !data.subject) return false;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        id: user?.id,
        name: profile?.name || user?.email?.split('@')[0] || (userRole === 'teacher' ? 'Teacher' : 'Student'),
        role: userRole,
        grade: userRole === 'student' ? (isNaN(parseInt(data.grade)) ? data.grade : parseInt(data.grade)) : null,
        subject: userRole === 'teacher' ? data.subject : null,
        language: data.language,
        state: data.state,
        background: data.background,
        family_occupation: data.family_occupation,
        accessibility_settings: data.accessibility,
        gyaan_coins: profile?.gyaan_coins ?? 0,
        streak_count: profile?.streak_count ?? 0,
        visual_literacy_level: profile?.visual_literacy_level ?? 2,
      };

      await upsertProfile(updatedProfile);
      setProfile(updatedProfile);

      // Apply accessibility settings immediately
      Object.entries(data.accessibility).forEach(([key, value]) => {
        if (value) setAccessibility(key, true);
      });

      toast.success(userRole === 'teacher'
        ? '🏫 Teacher dashboard is ready!'
        : '🚀 Let\'s start learning!'
      );

      // Route teachers to teacher dashboard, students to student dashboard
      navigate(userRole === 'teacher' ? '/teacher' : '/dashboard');
    } catch (err) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const currentId = steps[step].id;

    switch (currentId) {
      case 'grade':
        return (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {GRADES.map(g => (
              <button
                key={g} id={`grade-${g}`} type="button"
                onClick={() => setField('grade', g)}
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

      case 'subject':
        return (
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map(s => (
              <button
                key={s} id={`subj-${s}`} type="button"
                onClick={() => setField('subject', s)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all border-2 ${
                  data.subject === s
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-secondary/40'
                }`}
              >
                {t(s)}
              </button>
            ))}
          </div>
        );

      case 'language':
        return (
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code} id={`lang-${lang.code}`} type="button"
                onClick={() => setField('language', lang.code)}
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
            <select id="select-state" value={data.state} onChange={e => setField('state', e.target.value)} className="input-base mb-6">
              <option value="">{t('Select your state / UT')}</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-sm text-gray-500 mb-3">{t('Background')}</p>
            <div className="grid grid-cols-3 gap-3">
              {BACKGROUNDS.map(b => (
                <button
                  key={b.value} id={`bg-${b.value}`} type="button"
                  onClick={() => setField('background', b.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    data.background === b.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{b.emoji}</div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(b.label)}</p>
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
              {t('We use this to create culturally familiar examples in stories.')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATIONS.map(occ => (
                <button
                  key={occ} id={`occ-${occ}`} type="button"
                  onClick={() => setField('family_occupation', occ)}
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
                  key={a.key} id={`access-${a.key}`} type="button"
                  onClick={() => setField('accessibility', { ...data.accessibility, [a.key]: !data.accessibility[a.key] })}
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

          {/* ── Role Badge ── */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {userRole === 'teacher' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                <BookOpen size={16} />
                {t('Setting up Teacher Profile')}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                <GraduationCap size={16} />
                {t('Setting up Student Profile')}
              </div>
            )}
          </div>

          {/* ── Progress Bar ── */}
          <div className="flex items-center gap-1 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? (userRole === 'teacher' ? 'bg-secondary' : 'bg-primary') : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          {/* ── Step Card ── */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card p-8">
            <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${userRole === 'teacher' ? 'text-secondary' : 'text-primary'}`}>
              {t('Step')} {step + 1} {t('of')} {steps.length}
            </p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {t(steps[step].title)}
            </h2>
            <p className="text-gray-500 text-sm mb-8">{t(steps[step].subtitle)}</p>

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

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                id="btn-onboard-back"
                className="btn-ghost disabled:opacity-30"
              >
                <ArrowLeft size={18} /> {t('Back')}
              </button>

              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  id="btn-onboard-next"
                  className={`disabled:opacity-50 ${userRole === 'teacher' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {t('Next')} <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  id="btn-onboard-finish"
                  className={`disabled:opacity-50 ${userRole === 'teacher' ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {loading ? t('Saving…') : (userRole === 'teacher' ? '🏫 ' + t('Go to Teacher Dashboard') : '🚀 ' + t('Start Learning'))}
                </button>
              )}
            </div>

            {step < steps.length - 1 && (
              <div className="text-center mt-4">
                <button onClick={() => setStep(s => s + 1)} id="btn-skip-step"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
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
