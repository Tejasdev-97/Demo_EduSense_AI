import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Flame, ArrowRight, Globe2, GraduationCap, BookOpen } from 'lucide-react';
import { signIn, signUp, signInWithGoogle, upsertProfile } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { PageTransition } from '../components/UI';
import { useT } from '../hooks/useT';
import toast from 'react-hot-toast';

const GRADES = ['3','4','5','6','7','8','9','10','11','12','UG Year 1','UG Year 2','UG Year 3','PG'];
const SUBJECTS = ['Mathematics','Science','Social Science','English','Hindi','Physics','Chemistry','Biology','History','Geography'];

export default function Auth() {
  const [mode, setMode] = useState('signin'); // signin | signup
  // Signup fields
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]       = useState(''); // 'student' | 'teacher'
  const [grade, setGrade]     = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setProfile, setGuestMode } = useAppStore();
  const { t } = useT();
  const navigate = useNavigate();

  // ── Helpers ──
  const resetForm = () => {
    setName(''); setEmail(''); setPassword('');
    setRole(''); setGrade(''); setSubject('');
  };

  const switchMode = (m) => { setMode(m); resetForm(); };

  // ── Sign In ──
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) throw result.error;
      const user = result.data?.user;
      if (user) {
        setUser(user);
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ──
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!role) return toast.error('Please choose Student or Teacher');
    if (!name.trim()) return toast.error('Please enter your name');
    if (!email || !password) return toast.error('Please enter email and password');
    if (role === 'student' && !grade) return toast.error('Please select your grade');
    if (role === 'teacher' && !subject) return toast.error('Please select your subject');

    setLoading(true);
    try {
      const result = await signUp(email, password);
      if (result.error) throw result.error;
      const user = result.data?.user;
      if (user) {
        setUser(user);
        const profile = {
          id: user.id,
          name: name.trim(),
          role,
          grade: role === 'student' ? grade : null,
          subject: role === 'teacher' ? subject : null,
          language: 'hi',
          gyaan_coins: 0,
          streak_count: 0,
          visual_literacy_level: 2,
        };
        await upsertProfile(profile);
        setProfile(profile);
        toast.success('Account created! 🚀 Let\'s set up your profile.');
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setGuestMode(true);
    toast('🎭 Guest mode — progress won\'t be saved across devices', { icon: 'ℹ️' });
    navigate('/gap-test');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#0C0A09] flex">

        {/* ── Left Branding Panel ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Flame size={40} className="text-white" />
              <span className="font-heading font-bold text-4xl">EduSense AI</span>
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-4 leading-tight">
              Every student deserves to truly understand.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Not just pass. Not just score. <br /><em>Really understand.</em>
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { n: '10+', l: 'Indian Languages' },
                { n: '100%', l: 'Offline Ready' },
                { n: '7', l: 'Gap Types Detected' },
                { n: '∞', l: 'Stories Generated' },
              ].map(s => (
                <div key={s.l} className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
                  <p className="font-heading font-bold text-3xl">{s.n}</p>
                  <p className="text-white/70 text-sm">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              <Flame size={28} className="text-primary" />
              <span className="font-heading font-bold text-2xl text-gray-900 dark:text-white">EduSense AI</span>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              {['signin', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  id={`tab-${m}`}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'signin' ? t('Sign In') : t('Sign Up')}
                </button>
              ))}
            </div>

            {/* ── SIGN IN FORM ── */}
            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {t('Welcome back!')}
                  </h1>
                  <p className="text-gray-500 mb-6">{t('Continue your learning journey')}</p>

                  {/* Google */}
                  <button
                    id="btn-google-signin"
                    type="button"
                    onClick={async () => {
                      try { await signInWithGoogle(); }
                      catch { toast.error('Google sign-in failed'); }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mb-4"
                  >
                    <Globe2 size={20} className="text-blue-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{t('Continue with Google')}</span>
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400">{t('or with email')}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Email')}</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="input-signin-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com" className="input-base pl-10" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Password')}</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="input-signin-password" type={showPass ? 'text' : 'password'} value={password}
                          onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-base pl-10 pr-10" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button id="btn-signin-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                      {loading
                        ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Signing in...')}</div>
                        : <>{t('Sign In')} <ArrowRight size={18} /></>
                      }
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── SIGN UP FORM ── */}
              {mode === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {t('Create account')}
                  </h1>
                  <p className="text-gray-500 mb-6">{t('Join EduSense AI — free forever')}</p>

                  {/* ── Role Selector ── */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t('I am a...')} <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="role-student"
                        onClick={() => { setRole('student'); setSubject(''); }}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 font-semibold transition-all ${
                          role === 'student'
                            ? 'border-primary bg-primary/5 text-primary shadow-glow-orange'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
                        }`}
                      >
                        <GraduationCap size={32} className={role === 'student' ? 'text-primary' : 'text-gray-400'} />
                        <span className="text-base">{t('Student')}</span>
                        <span className="text-xs font-normal text-gray-400">{t('Class 3 to college')}</span>
                      </button>

                      <button
                        type="button"
                        id="role-teacher"
                        onClick={() => { setRole('teacher'); setGrade(''); }}
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 font-semibold transition-all ${
                          role === 'teacher'
                            ? 'border-secondary bg-secondary/5 text-secondary shadow-glow-purple'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-secondary/40'
                        }`}
                      >
                        <BookOpen size={32} className={role === 'teacher' ? 'text-secondary' : 'text-gray-400'} />
                        <span className="text-base">{t('Teacher')}</span>
                        <span className="text-xs font-normal text-gray-400">{t('School or college faculty')}</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Conditional: Grade (Student) or Subject (Teacher) ── */}
                  <AnimatePresence mode="wait">
                    {role === 'student' && (
                      <motion.div key="grade-select" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('Select Grade')} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {GRADES.map(g => (
                            <button
                              key={g}
                              type="button"
                              id={`grade-${g}`}
                              onClick={() => setGrade(g)}
                              className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                                grade === g
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-primary/10'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {role === 'teacher' && (
                      <motion.div key="subject-select" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('Subject You Teach')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="select-subject"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          className="input-base"
                        >
                          <option value="">{t('Select a subject...')}</option>
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Name, Email, Password ── */}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Full Name')}</label>
                      <input id="input-signup-name" type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Arjun Kumar" className="input-base" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Email')}</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="input-signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com" className="input-base pl-10" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Password')}</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input id="input-signup-password" type={showPass ? 'text' : 'password'} value={password}
                          onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="input-base pl-10 pr-10"
                          required minLength={6} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button id="btn-signup-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
                      {loading
                        ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Creating account...')}</div>
                        : <>{t('Create Account')} <ArrowRight size={18} /></>
                      }
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Guest Mode ── */}
            <div className="mt-6 text-center">
              <button onClick={handleGuest} id="btn-guest-mode"
                className="text-sm text-gray-500 hover:text-primary transition-colors underline underline-offset-2">
                {t('Try without login (Guest Mode)')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
