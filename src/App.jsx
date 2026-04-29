import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/useAppStore';
import { supabase } from './lib/supabase';
import { TranslationProvider } from './context/TranslationContext';
import Navbar from './components/Navbar';
import AccessibilityPanel from './components/AccessibilityPanel';
import { PageTransition } from './components/UI';

// Lazy pages
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Learn = lazy(() => import('./pages/Learn'));
const GapTest = lazy(() => import('./pages/GapTest'));
const Story = lazy(() => import('./pages/Story'));
const Chat = lazy(() => import('./pages/Chat'));
const Peer = lazy(() => import('./pages/Peer'));
const Progress = lazy(() => import('./pages/Progress'));
const Gamification = lazy(() => import('./pages/Gamification'));
const Teacher = lazy(() => import('./pages/Teacher'));
const Settings = lazy(() => import('./pages/Settings'));

// Offline page
function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-[#0C0A09] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-3">You're Offline</h1>
        <p className="text-gray-500 mb-6">EduSense AI is working in offline mode. Your cached lessons, stories, and progress are still available.</p>
        <div className="space-y-2">
          <a href="/learn" className="btn-primary w-full block">📚 Continue Learning (Offline)</a>
          <a href="/chat" className="btn-secondary w-full block">💬 Chat History</a>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Protected Route
function Protected({ children }) {
  const { isAuthenticated, guestMode } = useAppStore();
  if (!isAuthenticated && !guestMode) return <Navigate to="/auth" replace />;
  return children;
}

// Offline Banner
function OfflineBanner() {
  const { isOnline } = useAppStore();
  if (isOnline) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-500 text-white text-center py-2 text-sm font-semibold">
      📡 Working offline — changes will sync when you reconnect
    </div>
  );
}

export default function App() {
  const { setUser, setProfile, initTheme, setOnline, loadUserGeminiKey, setAccessibility, accessibility } = useAppStore();
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  useEffect(() => {
    // Init theme
    initTheme();

    // Load user API key
    loadUserGeminiKey();

    // Apply accessibility settings on mount
    const acc = useAppStore.getState().accessibility;
    Object.entries(acc).forEach(([key, val]) => {
      if (val) setAccessibility(key, val);
    });

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Load profile
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) setProfile(data);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // Online/offline
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <TranslationProvider>
    <div className="font-body text-primary-900 dark:text-gray-100">
      {/* Navbar — hidden on chat page for full-height layout */}
      {!isChat && <Navbar />}

      {/* Offline banner */}
      <OfflineBanner />

      {/* Main content */}
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/learn" element={<Protected><Learn /></Protected>} />
            <Route path="/gap-test" element={<GapTest />} />
            <Route path="/story" element={<Story />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/peer" element={<Protected><Peer /></Protected>} />
            <Route path="/progress" element={<Protected><Progress /></Protected>} />
            <Route path="/gamification" element={<Protected><Gamification /></Protected>} />
            <Route path="/teacher" element={<Protected><Teacher /></Protected>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Global accessibility panel */}
      {!isChat && <AccessibilityPanel />}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </div>
    </TranslationProvider>
  );
}
