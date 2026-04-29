import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, MessageCircle, Users, TrendingUp, Flame, Target,
  ChevronRight, Trophy, Clock, Zap, AlertCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getStudentGaps, getLeaderboard } from '../lib/supabase';
import { getDueVerifications } from '../lib/db';
import { GamifiedCard, CoinDisplay, StreakFlame, GapTypeBadge, Skeleton, PageTransition, EmptyState } from '../components/UI';
import { useT } from '../hooks/useT';

const QUICK_ACTIONS = [
  { to: '/learn', icon: BookOpen, label: 'Continue Learning', color: 'from-orange-400 to-primary', desc: 'Resume where you left off' },
  { to: '/gap-test', icon: Target, label: 'Gap Test', color: 'from-purple-400 to-secondary', desc: 'Detect comprehension gaps' },
  { to: '/chat', icon: MessageCircle, label: 'Ask SAHAYAK', color: 'from-blue-400 to-cyan-500', desc: 'Your AI learning buddy' },
  { to: '/peer', icon: Users, label: 'Peer Help', color: 'from-green-400 to-accent', desc: 'Learn with classmates' },
];

export default function Dashboard() {
  const { profile, gyaanCoins, streakCount, isAuthenticated, guestMode } = useAppStore();
  const { t } = useT();
  const [recentGaps, setRecentGaps] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dueChecks, setDueChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const [gapsResult, lb, checks] = await Promise.all([
        getStudentGaps(profile.id, 5),
        getLeaderboard(5),
        getDueVerifications(),
      ]);
      setRecentGaps(gapsResult.data || []);
      setLeaderboard(lb);
      setDueChecks(checks);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (guestMode) {
    return (
      <PageTransition>
        <div className="page-wrapper">
          <div className="container-main">
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎭</div>
              <h1 className="font-heading text-3xl font-bold mb-4">{t('Guest Mode')}</h1>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {t('You\'re in guest mode. Try the Gap Test or SAHAYAK chat.')}
                {' '}{t('Create an account to save your progress.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/gap-test" className="btn-primary">{t('Gap Test')}</Link>
                <Link to="/chat" className="btn-secondary">{t('Ask SAHAYAK')}</Link>
                <Link to="/auth" className="btn-outline">{t('Create account')}</Link>
              </div>
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

          {/* Due Verification Alert */}
          {dueChecks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle size={20} className="text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-primary">{t('48-Hour Re-Check Due!')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have {dueChecks.length} gap verification(s) waiting.
                </p>
              </div>
              <Link to="/progress" className="btn-primary py-2 px-4 text-sm">{t('Check Now')}</Link>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gray-500 text-sm">{t(getGreeting())},</p>
              <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
                {profile?.name || t('Learner')} 👋
              </h1>
              {profile?.grade && (
                <p className="text-sm text-gray-500 mt-1">{t('Grade')} {profile.grade} · {profile.state}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <StreakFlame count={streakCount} size="md" />
              <CoinDisplay amount={gyaanCoins} size="lg" />
            </div>
          </div>

          {/* Daily Goal Progress */}
          <GamifiedCard className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-primary" />
                <span className="font-semibold text-gray-900 dark:text-white">{t('Today\'s Goal')}</span>
              </div>
              <span className="text-sm text-gray-500">3/5 lessons</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">2 more lessons to hit today's goal & earn bonus coins!</p>
          </GamifiedCard>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {QUICK_ACTIONS.map((action, i) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={action.to}>
                  <GamifiedCard className="p-5 text-center" glowColor={i % 2 === 0 ? 'orange' : 'purple'}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3`}>
                      <action.icon size={22} className="text-white" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </GamifiedCard>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Gaps */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">{t('Recent Gaps')}</h2>
                <Link to="/progress" className="text-sm text-primary hover:underline">{t('View all')}</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} height="h-20" className="rounded-2xl" />)}
                </div>
              ) : recentGaps.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title={t('No gaps yet!')}
                  description={t('Detect exactly where your understanding breaks — not just scores')}
                  action={<Link to="/gap-test" className="btn-primary">{t('Start Gap Test')}</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {recentGaps.map((gap, i) => (
                    <motion.div
                      key={gap.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <GamifiedCard className="p-4 flex items-start gap-4">
                        <GapTypeBadge type={gap.gap_type} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{gap.topic}</p>
                          <p className="text-xs text-gray-500">{gap.subject} · Score: {gap.spectrum_score}%</p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          gap.permanently_closed_at ? 'bg-green-100 text-green-700' :
                          gap.bridged_at ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {gap.permanently_closed_at ? '✓ Closed' : gap.bridged_at ? '⟳ Rechecking' : '⚠ Open'}
                        </div>
                      </GamifiedCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">{t('Leaderboard')}</h2>
                <Link to="/gamification" className="text-sm text-primary hover:underline">{t('Full board')}</Link>
              </div>
              <GamifiedCard className="overflow-hidden" glowColor="purple">
                <div className="p-4 bg-gradient-to-br from-secondary/10 to-primary/10 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" />
                    <span className="font-semibold text-sm">{t('Top Learners')}</span>
                  </div>
                </div>
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} height="h-10" />)}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('No learners yet!')}</p>
                    <p className="text-xs text-gray-400">{t('Start learning to appear here.')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.map((student, i) => (
                      <div key={student.id} className={`flex items-center gap-3 p-3 ${student.id === profile?.id ? 'bg-primary/5' : ''}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-400 text-white' :
                          i === 1 ? 'bg-gray-300 text-white' :
                          i === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }`}>{i + 1}</span>
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                          {student.name}
                        </span>
                        <span className="text-xs text-yellow-600 font-semibold">🪙 {student.gyaan_coins}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GamifiedCard>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
