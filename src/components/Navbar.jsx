import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Flame, BookOpen, MessageCircle, TrendingUp, Users,
  Gift, Settings, LogOut, Menu, X, Moon, Sun, Globe,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { LANGUAGES } from '../lib/bhashini';
import { useT } from '../hooks/useT';
import { signOut } from '../lib/supabase';
import LanguageSelector from './LanguageSelector';

const NAV_LINKS = [
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/chat', label: 'SAHAYAK', icon: MessageCircle },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/peer', label: 'Community', icon: Users },
  { to: '/gamification', label: 'Rewards', icon: Gift },
];

export default function Navbar() {
  const { darkMode, toggleDarkMode, gyaanCoins, streakCount, profile, isAuthenticated, logout, recentCoinBurst } = useAppStore();
  const { t } = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="container-main h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Flame size={18} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-gray-900 dark:text-white hidden sm:block">
            EduSense <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-orange-500/10 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-orange-400 hover:bg-primary/5'
                }`
              }
            >
              <Icon size={16} />
              {t(label)}
            </NavLink>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          {isAuthenticated && (
            <motion.div
              animate={streakCount > 0 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full"
            >
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{streakCount}</span>
            </motion.div>
          )}

          {/* Coins */}
          {isAuthenticated && (
            <motion.div
              animate={recentCoinBurst ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full"
            >
              <span className="text-base">🪙</span>
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{gyaanCoins}</span>
            </motion.div>
          )}

          {/* Language */}
          <div className="hidden md:block">
            <LanguageSelector compact />
          </div>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            id="btn-toggle-dark"
            className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                id="btn-profile-menu"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm"
              >
                {profile?.name?.[0]?.toUpperCase() || '?'}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-card-hover border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{profile?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{profile?.role} {profile?.grade ? `· Grade ${profile.grade}` : ''}</p>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Settings size={15} /> {t('Settings')}
                      </button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <LogOut size={15} /> {t('Sign Out')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary py-2 px-4 text-sm">
              {t('Sign In')}
            </Link>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            id="btn-mobile-menu"
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col lg:hidden z-50"
          >
            <div className="p-4 flex-1 overflow-y-auto">
              {isAuthenticated && (
                <div className="flex gap-3 mb-6 p-3 bg-primary/5 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Flame size={16} className="text-orange-500" />
                    <span className="text-sm font-semibold">{streakCount} streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🪙</span>
                    <span className="text-sm font-semibold">{gyaanCoins} coins</span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`
                    }
                  >
                    <Icon size={18} />
                    {t(label)}
                  </NavLink>
                ))}
              </div>
              <div className="mt-6">
                <LanguageSelector />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 nav-safe">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="w-full btn-outline text-red-500 border-red-300">
                  <LogOut size={16} /> {t('Sign Out')}
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  {t('Sign In')} / {t('Sign Up')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
