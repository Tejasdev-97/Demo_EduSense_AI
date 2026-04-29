import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, User, Globe, Bell, Shield, Eye, EyeOff, Save, ExternalLink, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { upsertProfile } from '../lib/supabase';
import { testGeminiKey } from '../lib/gemini';
import { useT } from '../hooks/useT';
import { GamifiedCard, PageTransition } from '../components/UI';
import LanguageSelector from '../components/LanguageSelector';
import toast from 'react-hot-toast';

export default function Settings() {
  const { profile, setProfile, userGeminiKey, setUserGeminiKey } = useAppStore();
  const { t } = useT();
  const [apiKey, setApiKey] = useState(userGeminiKey || localStorage.getItem('userGeminiKey') || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [name, setName] = useState(profile?.name || '');
  const [notifications, setNotifications] = useState({ 'notif-streak': true, 'notif-recheck': true, 'notif-peer': false });

  const toggleNotif = (id) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
    toast(t('Notification settings saved'));
  };

  const saveApiKey = () => {
    setUserGeminiKey(apiKey.trim() || null);
    setTestResult(null);
    toast.success(apiKey ? t('🔑 Gemini API key saved!') : t('API key cleared'));
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) { toast.error('Please enter a key first'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiKey();
      setTestResult({ success: true, models: res.models });
      toast.success('Connection successful!');
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast.error('Connection failed');
    }
    setTesting(false);
  };

  const saveProfile = async () => {
    if (!profile?.id) { toast.error(t('Please sign in first')); return; }
    setSaving(true);
    try {
      const updated = { ...profile, name };
      await upsertProfile(updated);
      setProfile(updated);
      toast.success(t('Profile saved!'));
    } catch (err) {
      toast.error(t('Save failed'));
    }
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="page-wrapper">
        <div className="container-main max-w-2xl">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white mb-1">
              ⚙️ {t('Settings')}
            </h1>
            <p className="text-gray-500">{t('Profile, language, API keys, accessibility')}</p>
          </div>

          <div className="space-y-6">
            {/* Profile */}
            <GamifiedCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <User size={18} className="text-primary" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">{t('Profile')}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Display Name')}</label>
                  <input id="input-profile-name" type="text" value={name} onChange={e => setName(e.target.value)} className="input-base" placeholder={t('Your name')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Role')}</label>
                    <div className="input-base bg-gray-50 dark:bg-gray-900 text-gray-500 capitalize">{profile?.role || '—'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Grade')}</label>
                    <div className="input-base bg-gray-50 dark:bg-gray-900 text-gray-500">{profile?.grade || '—'}</div>
                  </div>
                </div>
                <button id="btn-save-profile" onClick={saveProfile} disabled={saving} className="btn-primary disabled:opacity-50">
                  <Save size={16} /> {saving ? t('Saving...') : t('Save Profile')}
                </button>
              </div>
            </GamifiedCard>

            {/* Language */}
            <GamifiedCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Globe size={18} className="text-secondary" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">{t('Language')}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-3">{t('EduSense AI will respond in your chosen language.')}</p>
              <LanguageSelector />
            </GamifiedCard>

            {/* Gemini API Key */}
            <GamifiedCard className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Key size={18} className="text-accent" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">{t('Gemini API Key')}</h2>
                {userGeminiKey && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full font-semibold">{t('Using Your Key')}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {t('Your key is stored')} <strong>{t('only in your browser')}</strong> — {t('never sent to our servers')}.
              </p>

              <div className="relative mb-3">
                <input
                  id="input-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input-base pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button id="btn-save-api-key" onClick={saveApiKey} className="btn-primary">
                  <Save size={16} /> Save Key
                </button>
                <button id="btn-test-api-key" onClick={handleTestKey} disabled={testing} className="btn-ghost border border-gray-200 dark:border-gray-700">
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                {apiKey && (
                  <button id="btn-clear-api-key" onClick={() => { setApiKey(''); setUserGeminiKey(null); setTestResult(null); toast('Key cleared'); }} className="btn-ghost text-red-500">
                    <Trash2 size={16} /> Clear
                  </button>
                )}
              </div>

              {testResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-xl border ${
                    testResult.success 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle2 className="text-green-600 dark:text-green-400 mt-0.5" size={18} />
                    ) : (
                      <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5" size={18} />
                    )}
                    <div>
                      <p className={`font-semibold text-sm ${testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                      </p>
                      {testResult.success ? (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Found {testResult.models.length} supported models including: {testResult.models.slice(0, 3).join(', ')}...
                        </p>
                      ) : (
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          Error: {testResult.message}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">How to get a free key:</p>
                <ol className="text-blue-600 dark:text-blue-300 space-y-1 list-decimal pl-4">
                  <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="underline">aistudio.google.com</a></li>
                  <li>Sign in with Google</li>
                  <li>Click "Get API Key" → "Create API Key"</li>
                  <li>Copy and paste it above</li>
                </ol>
                <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-600 font-medium mt-2 hover:underline">
                  <ExternalLink size={12} /> Open Google AI Studio
                </a>
              </div>
            </GamifiedCard>

            {/* Notifications */}
            <GamifiedCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Bell size={18} className="text-orange-500" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Notifications</h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'notif-streak', label: 'Daily streak reminder', desc: 'Remind me to study every day' },
                  { id: 'notif-recheck', label: '48-hour gap re-checks', desc: 'Alert when verification is due' },
                  { id: 'notif-peer', label: 'Peer learning requests', desc: 'When someone wants to help or needs help' },
                ].map(n => (
                  <div key={n.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.label}</p>
                      <p className="text-xs text-gray-500">{n.desc}</p>
                    </div>
                    <button
                      id={n.id}
                      role="switch"
                      aria-checked={notifications[n.id]}
                      onClick={() => toggleNotif(n.id)}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifications[n.id] ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    >
                      <span className={`absolute top-0.5 bottom-0.5 aspect-square rounded-full bg-white shadow-sm transition-all duration-200 ${notifications[n.id] ? 'right-0.5 left-auto' : 'left-0.5 right-auto'
                        }`} />
                    </button>
                  </div>
                ))}
              </div>
            </GamifiedCard>

            {/* Privacy */}
            <GamifiedCard className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-gray-500" />
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Privacy & Data</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✅ Your personal Gemini API key never leaves your browser</p>
                <p>✅ Teacher private questions stored only on your device</p>
                <p>✅ Supabase data encrypted in transit and at rest</p>
                <p>✅ Offline data stored locally via IndexedDB</p>
              </div>
            </GamifiedCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
