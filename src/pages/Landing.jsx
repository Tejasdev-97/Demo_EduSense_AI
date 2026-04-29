import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, Brain, Mic, BookOpen, Users, Trophy, Globe, Zap,
  ArrowRight, Star, ChevronDown, Wifi, Smartphone, Heart
} from 'lucide-react';
import { GamifiedCard, StreakFlame } from '../components/UI';
import { PageTransition } from '../components/UI';
import { useT } from '../hooks/useT';

const FEATURES = [
  { icon: Brain, color: 'from-red-400 to-orange-500', title: 'Gap Detection AI', desc: 'Identify conceptual, linguistic, rote, procedural gaps — not just scores' },
  { icon: Mic, color: 'from-purple-400 to-pink-500', title: 'VAANI Voice AI', desc: 'Speak in any Indian language. EduSense understands and responds.' },
  { icon: BookOpen, color: 'from-blue-400 to-cyan-500', title: 'DRISHTI Stories', desc: 'Culturally resonant visual stories that bridge learning gaps.' },
  { icon: Users, color: 'from-green-400 to-teal-500', title: 'Peer Learning', desc: 'Smart peer matching for collaborative gap bridging.' },
  { icon: Trophy, color: 'from-yellow-400 to-orange-500', title: 'Gyaan Yatra', desc: 'Coins, streaks, badges and rewards for every milestone.' },
  { icon: Wifi, color: 'from-gray-400 to-slate-500', title: 'Offline First', desc: 'Works in classrooms with zero internet. Stories pre-cached.' },
];

const STEPS = [
  { n: '01', title: 'Answer a Question', desc: 'By voice, text, or quiz — in your own language' },
  { n: '02', title: 'Gap Detected', desc: 'AI pinpoints exactly where understanding breaks' },
  { n: '03', title: 'Visual Story', desc: 'A culturally personalized comic story explains it' },
  { n: '04', title: 'Verified & Closed', desc: '48-hour re-check ensures the gap is truly bridged' },
];

const LANGUAGES_SHOWN = ['हिंदी', 'தமிழ்', 'বাংলা', 'తెలుగు', 'ಕನ್ನಡ', 'मराठी', 'ਪੰਜਾਬੀ', 'ગુજરાતી'];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
};

export default function Landing() {
  const { t } = useT();
  return (
    <PageTransition>
      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="relative z-10 text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={stagger.item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Flame size={16} className="text-primary" />
              <span className="text-sm font-semibold text-primary">India's First Comprehension Gap AI</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={stagger.item} className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              {t('Don\'t Just Score Better.')}{' '}
              <span className="gradient-text">{t('Understand Deeper.')}</span>
            </motion.h1>

            <motion.p variants={stagger.item} className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('EduSense AI detects exactly')} <em>{t('why')}</em> {t('a student doesn\'t understand')} — {t('not just')} <em>{t('that')}</em> {t('they got it wrong.')} {t('Multilingual, offline-first, gamified.')} {t('For every student in India.')}
            </motion.p>

            {/* Language pills */}
            <motion.div variants={stagger.item} className="flex flex-wrap justify-center gap-2 mb-10">
              {LANGUAGES_SHOWN.map(lang => (
                <span key={lang} className="px-3 py-1 bg-secondary/10 text-secondary dark:text-violet-500 rounded-full text-sm font-medium">
                  {lang}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={stagger.item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" id="cta-get-started" className="btn-primary text-lg px-8 py-4 rounded-2xl shadow-glow-orange">
                {t('Start Learning Free')} <ArrowRight size={20} />
              </Link>
              <Link to="/gap-test" id="cta-try-demo" className="btn-outline text-lg px-8 py-4 rounded-2xl">
                {t('Try Demo (No Login)')}
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={stagger.item} className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500">
              <div className="flex items-center gap-1"><Star size={14} className="text-yellow-400" /><span>Gamified</span></div>
              <div className="flex items-center gap-1"><Wifi size={14} className="text-green-500" /><span>Offline First</span></div>
              <div className="flex items-center gap-1"><Globe size={14} className="text-blue-500" /><span>10+ Languages</span></div>
              <div className="flex items-center gap-1"><Heart size={14} className="text-red-400" /><span>Free Always</span></div>
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400"
          >
            <ChevronDown size={28} />
          </motion.div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="container-main">
            <div className="text-center mb-14">
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">{t('The Process')}</p>
              <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">{t('How EduSense Works')}</h2>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-32" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-heading font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-glow-orange relative z-10">
                      {step.n}
                    </div>
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">{t(step.title)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(step.desc)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20 px-4">
          <div className="container-main">
            <div className="text-center mb-14">
              <p className="text-secondary font-semibold text-sm uppercase tracking-widest mb-2">{t('Features')}</p>
              <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">{t('Everything a student needs')}</h2>
              <p className="text-gray-500 mt-2 max-w-xl mx-auto">{t('From gap detection to gamified rewards — all in one offline-first platform.')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <GamifiedCard className="p-6" glowColor={i % 3 === 0 ? 'orange' : i % 3 === 1 ? 'purple' : 'green'}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                      <f.icon size={22} className="text-white" />
                    </div>
                    <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">{t(f.title)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(f.desc)}</p>
                  </GamifiedCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Gamification Preview ── */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="container-main">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Gyaan Yatra</p>
                <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Learning that feels like a game
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Earn Gyaan Coins for every gap bridged, streak maintained, peer helped. 
                  Unlock Vidya Ratna badges and spend coins in the reward marketplace.
                </p>
                <div className="space-y-3">
                  {[
                    { emoji: '🔥', text: 'Sadhana Streak — learn every day' },
                    { emoji: '🪙', text: 'Gyaan Coins — earn while learning' },
                    { emoji: '🏆', text: 'Vidya Ratna Badges — epic achievements' },
                    { emoji: '🛒', text: 'Reward Marketplace — spend your coins' },
                  ].map(item => (
                    <div key={item.emoji} className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Gamification card preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="gamified-card p-6 max-w-sm mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Today's Progress</p>
                      <p className="font-heading font-bold text-xl text-gray-900 dark:text-white">Arjun Kumar</p>
                    </div>
                    <StreakFlame count={14} size="md" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-600">340</p>
                      <p className="text-xs text-gray-500">Gyaan Coins</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">7</p>
                      <p className="text-xs text-gray-500">Gaps Bridged</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['🎓','⚡','🌟','🦁','🔥'].map((b, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-lg badge-glow">{b}</div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary to-secondary">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Ready to bridge every learning gap?
            </h2>
            <p className="text-white/80 mb-8">
              Join students across India learning smarter with EduSense AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" id="footer-cta-signup" className="bg-white text-primary font-semibold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 text-lg">
                {t('Start Learning Free')} <ArrowRight size={20} />
              </Link>
              <Link to="/gap-test" id="footer-cta-demo" className="border-2 border-white text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-lg">
                {t('Try Demo (No Login)')}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
          <div className="container-main flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-primary" />
              <span className="font-heading font-bold text-gray-900 dark:text-white">EduSense AI</span>
            </div>
            <p className="text-sm text-gray-500">Built for India's 260M students. Offline. Multilingual. Free.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
