import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, CheckCircle, XCircle, Loader2, Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generatePeerCard } from '../lib/gemini';
import { GamifiedCard, PageTransition, ThinkingIndicator, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { useT } from '../hooks/useT';

const DEMO_PEERS = [
  { id: '1', name: 'Priya Sharma', grade: 8, topic: 'Fractions', spectrumScore: 90, language: 'hi', state: 'UP' },
  { id: '2', name: 'Arjun Patel', grade: 8, topic: 'Photosynthesis', spectrumScore: 88, language: 'gu', state: 'Gujarat' },
  { id: '3', name: 'Kavya Nair', grade: 8, topic: 'Democracy', spectrumScore: 92, language: 'ml', state: 'Kerala' },
];

export default function Peer() {
  const { profile, language, currentGapEvent } = useAppStore();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState('find');
  const [peerCard, setPeerCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [peerMessage, setPeerMessage] = useState('');

  const handleGenerateCard = async (peer) => {
    if (!currentGapEvent) { toast.error('Complete a gap test first to find relevant peers!'); return; }
    setSelectedPeer(peer);
    setLoadingCard(true);
    try {
      const card = await generatePeerCard({
        concept: currentGapEvent.confusedWith || 'the concept',
        gapType: currentGapEvent.gapType,
        language,
      });
      setPeerCard(card);
      setActiveTab('card');
    } catch (err) {
      toast.error('Could not generate peer card');
    }
    setLoadingCard(false);
  };

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🤝 {t('Peer Learning — Sahyog')}
            </h1>
            <p className="text-gray-500">{t('Learn together, grow together. Teach a peer, earn coins.')}</p>
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 gap-1">
            {['find', 'card', 'offline'].map(tab => (
              <button
                key={tab}
                id={`peer-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all capitalize ${
                  activeTab === tab ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                {tab === 'find' ? t('🔍 Find Peer') : tab === 'card' ? t('🃏 Peer Card') : t('📄 Offline Cards')}
              </button>
            ))}
          </div>

          {/* Find Peers */}
          {activeTab === 'find' && (
            <div>
              {!currentGapEvent && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl mb-6 text-sm text-yellow-700 dark:text-yellow-400">
                  💡 {t('Complete a Gap Test first to get matched with peers who can help you!')}
                </div>
              )}

              <div className="space-y-4">
                {DEMO_PEERS.map((peer, i) => (
                  <motion.div
                    key={peer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="peer-card">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {peer.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{peer.name}</p>
                          <p className="text-sm text-gray-500">Grade {peer.grade} · {peer.state}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                              ✓ {peer.spectrumScore}% on {peer.topic}
                            </span>
                          </div>
                        </div>
                        <button
                          id={`btn-connect-${peer.id}`}
                          onClick={() => handleGenerateCard(peer)}
                          disabled={loadingCard}
                          className="btn-primary py-2 px-4 text-sm flex-shrink-0"
                        >
                          {loadingCard && selectedPeer?.id === peer.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            t('Connect')
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <GamifiedCard className="p-5 mt-6 text-center bg-gradient-to-br from-accent/5 to-green-50 dark:from-accent/10 dark:to-green-900/20">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('Sibling Mode')}</p>
                <p className="text-xs text-gray-500 mb-3">{t('Link your sibling\'s phone and they\'ll get guided questions to help you!')}</p>
                <button id="btn-sibling-mode" className="btn-outline text-sm py-2">
                  📱 {t('Add Sibling')}
                </button>
              </GamifiedCard>
            </div>
          )}

          {/* Peer Card */}
          {activeTab === 'card' && peerCard && selectedPeer && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GamifiedCard className="p-6 mb-4" glowColor="purple">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold">
                    {selectedPeer.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t('Teaching Guide for')} {selectedPeer.name}</p>
                    <p className="text-xs text-gray-500">{t('Follow this script to help them understand')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-blue-600 mb-1">🚀 Opening Question</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{peerCard.openingQuestion}</p>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-green-600 mb-1">✅ Expected Answer</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{peerCard.expectedAnswer}</p>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-orange-600 mb-1">🔄 If They Get It Wrong</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{peerCard.ifWrong}</p>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-purple-600 mb-1">💡 Relatable Example</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{peerCard.relatedExample}</p>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-yellow-600 mb-1">💚 Encouragement</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{peerCard.encouragement}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    id="btn-send-peer-request"
                    onClick={() => toast.success('Peer request sent! +40 coins when they accept 🎉')}
                    className="btn-primary flex-1"
                  >
                    <Send size={16} /> Send Request (+40🪙)
                  </button>
                </div>
              </GamifiedCard>
            </motion.div>
          )}

          {activeTab === 'card' && !peerCard && (
            <EmptyState icon="🃏" title={t('No peer card yet')} description={t('Find a peer first to generate a teaching guide')} action={<button onClick={() => setActiveTab('find')} className="btn-primary">{t('Find a Peer')}</button>} />
          )}

          {/* Offline Cards */}
          {activeTab === 'offline' && (
            <GamifiedCard className="p-6 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Offline Sahyog Cards')}</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {t('Teachers can generate printable cards for physical peer learning sessions — no device needed!')}
              </p>
              <p className="text-sm text-primary font-semibold mb-4">{t('Available in Teacher Dashboard → Generate Sahyog Cards')}</p>
              <a href="/teacher" className="btn-primary">{t('Go to Teacher Dashboard')}</a>
            </GamifiedCard>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
