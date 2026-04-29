import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getStudentGaps } from '../lib/supabase';
import { GamifiedCard, SpectrumMeter, GapTypeBadge, Skeleton, PageTransition, EmptyState } from '../components/UI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useT } from '../hooks/useT';

const GAP_COLORS = { conceptual: '#EF4444', linguistic: '#3B82F6', procedural: '#F97316', prior_knowledge: '#EAB308', attention: '#8B5CF6', rote: '#EC4899', none: '#10B981' };

const DEMO_GAPS = [
  { id: '1', subject: 'Mathematics', topic: 'Fractions', gap_type: 'conceptual', spectrum_score: 45, created_at: '2026-04-25', bridged_at: null, permanently_closed_at: null },
  { id: '2', subject: 'Science', topic: 'Photosynthesis', gap_type: 'rote', spectrum_score: 60, created_at: '2026-04-24', bridged_at: '2026-04-25', permanently_closed_at: null },
  { id: '3', subject: 'Social Science', topic: 'Democracy', gap_type: 'linguistic', spectrum_score: 75, created_at: '2026-04-22', bridged_at: '2026-04-23', permanently_closed_at: '2026-04-25' },
  { id: '4', subject: 'Mathematics', topic: 'Algebra', gap_type: 'procedural', spectrum_score: 55, created_at: '2026-04-21', bridged_at: null, permanently_closed_at: null },
];

const WEEKLY_DATA = [
  { week: 'Week 1', gaps: 8, bridged: 3 },
  { week: 'Week 2', gaps: 12, bridged: 7 },
  { week: 'Week 3', gaps: 6, bridged: 5 },
  { week: 'Week 4', gaps: 9, bridged: 8 },
];

export default function Progress() {
  const { profile, isAuthenticated } = useAppStore();
  const { t } = useT();
  const [gaps, setGaps] = useState(DEMO_GAPS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      getStudentGaps(profile.id, 50).then(res => {
        if (res.data && res.data.length > 0) setGaps(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [profile]);

  const openGaps = gaps.filter(g => !g.bridged_at && g.gap_type !== 'none');
  const bridgedGaps = gaps.filter(g => g.bridged_at && !g.permanently_closed_at);
  const closedGaps = gaps.filter(g => g.permanently_closed_at);

  const gapTypeBreakdown = Object.entries(
    gaps.reduce((acc, g) => { acc[g.gap_type] = (acc[g.gap_type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 {t('Smriti — My Learning Story')}
            </h1>
            <p className="text-gray-500">{t('Your complete gap history, progress timeline, and learning patterns')}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <GamifiedCard className="p-4 text-center" glowColor="orange">
              <div className="text-3xl font-bold text-red-500 mb-1">{openGaps.length}</div>
              <p className="text-xs text-gray-500">{t('Open Gaps')}</p>
            </GamifiedCard>
            <GamifiedCard className="p-4 text-center" glowColor="orange">
              <div className="text-3xl font-bold text-yellow-500 mb-1">{bridgedGaps.length}</div>
              <p className="text-xs text-gray-500">{t('Being Verified')}</p>
            </GamifiedCard>
            <GamifiedCard className="p-4 text-center" glowColor="green">
              <div className="text-3xl font-bold text-green-500 mb-1">{closedGaps.length}</div>
              <p className="text-xs text-gray-500">{t('Permanently Closed')}</p>
            </GamifiedCard>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 gap-1 overflow-x-auto">
            {['timeline', 'charts', 'subjects'].map(tab => (
              <button
                key={tab}
                id={`progress-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} height="h-24" className="rounded-2xl" />)
              ) : gaps.length === 0 ? (
                <EmptyState icon="🎯" title={t('No gaps yet!')} description={t('Take a gap test to start your learning story')} action={<a href="/gap-test" className="btn-primary">{t('Start Gap Test')}</a>} />
              ) : (
                gaps.map((gap, i) => (
                  <motion.div
                    key={gap.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GamifiedCard className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Status icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          gap.permanently_closed_at ? 'bg-green-100' :
                          gap.bridged_at ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {gap.permanently_closed_at ? <CheckCircle className="text-green-600" size={20} /> :
                           gap.bridged_at ? <Clock className="text-yellow-600" size={20} /> :
                           <AlertCircle className="text-red-600" size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">{gap.topic}</span>
                            <GapTypeBadge type={gap.gap_type} showEmoji={false} />
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{gap.subject} · {new Date(gap.created_at).toLocaleDateString('en-IN')}</p>
                          <SpectrumMeter score={gap.spectrum_score} label={false} />
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-gray-400">{gap.spectrum_score}% {t('understanding')}</span>
                            {gap.permanently_closed_at && <span className="text-green-600 font-semibold">✓ {t('Mastered')}</span>}
                            {gap.bridged_at && !gap.permanently_closed_at && <span className="text-yellow-600">⟳ {t('48hr re-check pending')}</span>}
                            {!gap.bridged_at && <a href="/story" className="text-primary hover:underline">→ {t('Get explanation')}</a>}
                          </div>
                        </div>
                      </div>
                    </GamifiedCard>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Charts */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <GamifiedCard className="p-6">
                <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">{t('Weekly Gap Trend')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={WEEKLY_DATA}>
                    <defs>
                      <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bridgedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="gaps" stroke="#EF4444" fill="url(#gapGrad)" name={t('Gaps Detected')} />
                    <Area type="monotone" dataKey="bridged" stroke="#10B981" fill="url(#bridgedGrad)" name={t('Gaps Bridged')} />
                  </AreaChart>
                </ResponsiveContainer>
              </GamifiedCard>

              <GamifiedCard className="p-6">
                <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">{t('Gap Type Breakdown')}</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={gapTypeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {gapTypeBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={GAP_COLORS[entry.name] || '#999'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {gapTypeBreakdown.map(entry => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: GAP_COLORS[entry.name] }} />
                        <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{entry.name.replace('_', ' ')}</span>
                        <span className="ml-auto text-sm font-semibold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GamifiedCard>
            </div>
          )}

          {/* Subjects */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              {['Mathematics', 'Science', 'Social Science', 'English'].map(subj => {
                const subjGaps = gaps.filter(g => g.subject === subj);
                const avgScore = subjGaps.length ? Math.round(subjGaps.reduce((s, g) => s + g.spectrum_score, 0) / subjGaps.length) : 0;
                return (
                  <GamifiedCard key={subj} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t(subj)}</h3>
                      <span className="text-sm text-gray-500">{subjGaps.length} {t('gaps')} · {t('avg')} {avgScore}%</span>
                    </div>
                    <SpectrumMeter score={avgScore} label={false} />
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {subjGaps.slice(0, 3).map(g => (
                        <GapTypeBadge key={g.id} type={g.gap_type} showEmoji={false} />
                      ))}
                    </div>
                  </GamifiedCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
