import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Flame, ArrowRight, Globe2 } from 'lucide-react';
import { signIn, signUp, signInWithGoogle } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { PageTransition } from '../components/UI';
import { useT } from '../hooks/useT';
import toast from 'react-hot-toast';

export default function Auth() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setGuestMode } = useAppStore();
  const { t } = useT();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password);
      }

      if (result.error) throw result.error;

      const user = result.data?.user;
      if (user) {
        setUser(user);
        // On signup, immediately save the name to the database
        if (mode === 'signup' && name) {
          const { upsertProfile } = await import('../lib/supabase');
          await upsertProfile({ id: user.id, name, gyaan_coins: 0, streak_count: 0 });
        }
        toast.success(mode === 'signin' ? 'Welcome back! 🎉' : 'Account created! 🚀');
        navigate(mode === 'signup' ? '/onboarding' : '/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error('Google sign-in failed');
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
        {/* Left Panel — Branding */}
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
              Not just pass. Not just score. <br />
              <em>Really understand.</em>
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

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              <Flame size={28} className="text-primary" />
              <span className="font-heading font-bold text-2xl text-gray-900 dark:text-white">EduSense AI</span>
            </div>

            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'signin' ? t('Welcome back!') : t('Create account')}
            </h1>
            <p className="text-gray-500 mb-8">
              {mode === 'signin' ? t('Continue your learning journey') : t('Start detecting your learning gaps')}
            </p>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              {['signin', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
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

            {/* Google */}
            <button
                id="btn-google-auth"
                type="button"
                onClick={async () => {
                  try {
                    const { signInWithGoogle } = await import('../lib/supabase');
                    await signInWithGoogle();
                  } catch (err) {
                    toast.error('Could not start Google login');
                  }
                }}
                className="btn-outline w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <Globe2 size={20} className="text-blue-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t('Continue with Google')}</span>
              </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">{t('or with email')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Full Name')}</label>
                    <input
                      id="input-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Arjun Kumar"
                      className="input-base"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="input-base pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="input-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Please wait...')}
                  </div>
                ) : (
                  <>
                    {mode === 'signin' ? t('Sign In') : t('Create Account')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Guest mode */}
            <div className="mt-6 text-center">
              <button onClick={handleGuest} id="btn-guest-mode" className="text-sm text-gray-500 hover:text-primary transition-colors underline underline-offset-2">
                {t('Try without login (Guest Mode)')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
