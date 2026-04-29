import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Zap, Gift, ShoppingBag, Clock, TrendingUp, Award, Lock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getStudentBadges, getLeaderboard } from '../lib/supabase';
import { GamifiedCard, CoinDisplay, StreakFlame, PageTransition } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const BADGES_CONFIG = [
  { id: 'first_gap', name: 'Gap Hunter', emoji: '🎯', desc: 'Detected your first learning gap', coins: 50, earned: true },
  { id: 'streak_7', name: 'Sapta Saptak', emoji: '🔥', desc: '7-day learning streak', coins: 100, earned: true },
  { id: 'gap_bridged', name: 'Bodh Siddhi', emoji: '⚡', desc: 'Bridged 5 learning gaps', coins: 150, earned: false },
  { id: 'peer_teacher', name: 'Guru Bhav', emoji: '🧑‍🏫', desc: 'Successfully taught a peer', coins: 200, earned: false },
  { id: 'story_lover', name: 'Katha Priya', emoji: '📖', desc: 'Read 10 learning stories', coins: 75, earned: true },
  { id: 'streak_30', name: 'Sadhana Master', emoji: '🏆', desc: '30-day streak', coins: 500, earned: false },
  { id: 'polyglot', name: 'Bhasha Veer', emoji: '🌐', desc: 'Used 3 different languages', coins: 100, earned: false },
  { id: 'perfect_quiz', name: 'Shata Pratishat', emoji: '💯', desc: '5 perfect quiz scores in a row', coins: 250, earned: false },
];

const REWARDS = [
  { id: 'pdf_notes', name: 'Premium Notes PDF', desc: 'Curated notes for your grade', coins: 100, category: 'digital', icon: '📄' },
  { id: 'mock_test', name: 'Full Mock Test', desc: 'AI-generated practice exam', coins: 150, category: 'digital', icon: '📝' },
  { id: 'avatar_fire', name: 'Fire Avatar', desc: 'Exclusive animated avatar frame', coins: 200, category: 'digital', icon: '🔥' },
  { id: 'ai_tutor', name: '1-Week AI Tutor Pro', desc: 'Unlimited SAHAYAK sessions', coins: 300, category: 'digital', icon: '🤖' },
  { id: 'data_pack', name: 'Data Pack Voucher', desc: '1GB data recharge code', coins: 500, category: 'partner', icon: '📶', comingSoon: true },
  { id: 'stationery', name: 'Stationery Kit', desc: 'Notebook + pen set delivery', coins: 800, category: 'partner', icon: '✏️', comingSoon: true },
  { id: 'nptel', name: 'NPTEL Course Coupon', desc: 'Free certification course', coins: 1000, category: 'partner', icon: '🎓', comingSoon: true },
];

const EARN_ACTIVITIES = [
  { action: 'Complete daily lesson', coins: 10, icon: '📚' },
  { action: 'Perfect quiz (5/5)', coins: 25, icon: '💯' },
  { action: 'Bridge a gap (verified)', coins: 30, icon: '⚡' },
  { action: 'Teach a peer (verified)', coins: 40, icon: '🤝' },
  { action: '7-day streak', coins: 50, icon: '🔥' },
  { action: 'First topic complete', coins: 20, icon: '🎯' },
  { action: 'Refer a friend', coins: 100, icon: '👥' },
];

export default function Gamification() {
  const { gyaanCoins, streakCount, streakFreezeCount, badges: storeBadges, profile } = useAppStore();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLb, setLoadingLb] = useState(true);

  useEffect(() => {
    getLeaderboard(20).then(data => { setLeaderboard(data); setLoadingLb(false); });
  }, []);

  const handleRedeem = (reward) => {
    if (reward.comingSoon) {
      toast('🔜 Coming soon — partner integration in progress!', { icon: 'ℹ️' });
      return;
    }
    if (gyaanCoins < reward.coins) {
      toast.error(`Need ${reward.coins - gyaanCoins} more coins!`);
      return;
    }
    toast.success(`🎉 "${reward.name}" redeemed! Check your email.`);
  };

  const tabs = ['overview', 'badges', 'leaderboard', 'marketplace'];

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🏆 {t('Gyaan Yatra')}
            </h1>
            <p className="text-gray-500">{t('Your learning adventure — coins, streaks, badges & rewards')}</p>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <GamifiedCard className="p-5 text-center" glowColor="orange">
              <CoinDisplay amount={gyaanCoins} size="lg" />
              <p className="text-xs text-gray-500 mt-1">{t('Coins')}</p>
            </GamifiedCard>
            <GamifiedCard className="p-5 text-center" glowColor="orange">
              <StreakFlame count={streakCount} size="md" />
              <p className="text-xs text-gray-500 mt-1">{t('Streak')}</p>
            </GamifiedCard>
            <GamifiedCard className="p-5 text-center" glowColor="purple">
              <div className="text-3xl font-bold text-secondary mb-1">{streakFreezeCount}</div>
              <div className="flex items-center justify-center gap-1">
                <span>🧊</span>
                <p className="text-xs text-gray-500">{t('Streak Freezes')}</p>
              </div>
            </GamifiedCard>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize whitespace-nowrap min-w-fit ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* How to Earn */}
              <GamifiedCard className="overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-yellow-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">{t('How to Earn Coins')}</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {EARN_ACTIVITIES.map(a => (
                    <div key={a.action} className="flex items-center gap-3 p-3">
                      <span className="text-xl">{a.icon}</span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{a.action}</span>
                      <span className="text-sm font-bold text-yellow-600">+{a.coins}</span>
                    </div>
                  ))}
                </div>
              </GamifiedCard>

              {/* Recent Badges */}
              <GamifiedCard className="overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-secondary" />
                    <span className="font-semibold text-gray-900 dark:text-white">{t('Your Badges')}</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  {BADGES_CONFIG.filter(b => b.earned).map(b => (
                    <motion.div
                      key={b.id}
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center p-3 rounded-xl bg-secondary/5 badge-glow cursor-pointer"
                      title={b.desc}
                    >
                      <span className="text-2xl mb-1">{b.emoji}</span>
                      <p className="text-xs font-semibold text-center text-gray-700 dark:text-gray-300 leading-tight">{b.name}</p>
                    </motion.div>
                  ))}
                  {BADGES_CONFIG.filter(b => !b.earned).slice(0, 3).map(b => (
                    <div key={b.id} className="flex flex-col items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed" title={`Locked: ${b.desc}`}>
                      <Lock size={20} className="text-gray-400 mb-1" />
                      <p className="text-xs text-center text-gray-400 leading-tight">{b.name}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <button onClick={() => setActiveTab('badges')} className="text-sm text-primary hover:underline">{t('View all badges →')}</button>
                </div>
              </GamifiedCard>
            </div>
          )}

          {/* Badges */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {BADGES_CONFIG.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={badge.earned ? { scale: 1.05 } : {}}
                >
                  <GamifiedCard className={`p-5 text-center ${!badge.earned ? 'opacity-50 grayscale' : ''}`} glowColor={badge.earned ? 'purple' : undefined}>
                    <div className="text-5xl mb-3">{badge.emoji}</div>
                    <p className="font-heading font-semibold text-sm text-gray-900 dark:text-white mb-1">{badge.name}</p>
                    <p className="text-xs text-gray-500 mb-3">{badge.desc}</p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">🪙</span>
                      <span className="text-xs font-semibold text-yellow-600">{badge.coins}</span>
                    </div>
                    {!badge.earned && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-gray-400 text-xs">
                        <Lock size={12} /> {t('Locked')}
                      </div>
                    )}
                  </GamifiedCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === 'leaderboard' && (
            <GamifiedCard className="overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">{t('Leaderboard')}</span>
                </div>
              </div>

              {loadingLb ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('No learners yet!')}</p>
                  <p className="text-sm text-gray-400 mb-4">{t('Be the first one on the board.')}</p>
                  <a href="/gap-test" className="btn-primary text-sm py-2 px-4">{t('Take a Gap Test')}</a>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.map((student, i) => (
                    <div key={student.id} className={`flex items-center gap-4 p-4 ${student.id === profile?.id ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {student.name} {student.id === profile?.id ? t('(You)') : ''}
                        </p>
                        <p className="text-xs text-gray-500">{student.streak_count} {t('day streak')}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🪙</span>
                        <span className="font-bold text-yellow-600">{student.gyaan_coins}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GamifiedCard>
          )}

          {/* Marketplace */}
          {activeTab === 'marketplace' && (
            <div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl mb-6 flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Your Balance: {gyaanCoins} {t('Coins')}</p>
                  <p className="text-sm text-gray-500">{t('Earn by learning, teaching peers, and maintaining streaks')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {REWARDS.map((reward, i) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GamifiedCard className="p-5" glowColor={reward.comingSoon ? undefined : 'green'}>
                      <div className="text-4xl mb-3">{reward.icon}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{reward.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{reward.desc}</p>

                      {reward.comingSoon && (
                        <div className="mb-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-center text-gray-500 font-medium">
                          🔜 {t('Coming Soon')}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span>🪙</span>
                          <span className="font-bold text-yellow-600">{reward.coins}</span>
                        </div>
                        <button
                          id={`btn-redeem-${reward.id}`}
                          onClick={() => handleRedeem(reward)}
                          disabled={gyaanCoins < reward.coins && !reward.comingSoon}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            reward.comingSoon
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : gyaanCoins >= reward.coins
                                ? 'bg-accent text-white hover:bg-accent-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {reward.comingSoon ? t('Soon') : gyaanCoins >= reward.coins ? t('Redeem') : t('Not enough coins')}
                        </button>
                      </div>
                    </GamifiedCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
