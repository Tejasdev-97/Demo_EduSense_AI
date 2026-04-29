import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ── User ──
      user: null,
      profile: null,
      isAuthenticated: false,
      guestMode: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setGuestMode: (v) => set({ guestMode: v }),
      logout: () => set({ user: null, profile: null, isAuthenticated: false, guestMode: false }),

      // ── Theme ──
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },
      initTheme: () => {
        const { darkMode } = get();
        document.documentElement.classList.toggle('dark', darkMode);
      },

      // ── Language ──
      language: 'hi',
      setLanguage: (lang) => set({ language: lang }),

      // ── Gamification ──
      gyaanCoins: 0,
      streakCount: 0,
      streakFreezeCount: 0,
      lastStudyDate: null,
      badges: [],
      recentCoinBurst: false,

      setCoins: (n) => set({ gyaanCoins: n }),
      addCoins: (amount) => {
        set((s) => ({ gyaanCoins: s.gyaanCoins + amount, recentCoinBurst: true }));
        setTimeout(() => set({ recentCoinBurst: false }), 1000);
      },
      setStreak: (n) => set({ streakCount: n }),
      setStreakFreeze: (n) => set({ streakFreezeCount: n }),
      setLastStudyDate: (d) => set({ lastStudyDate: d }),
      addBadge: (badge) => set((s) => ({ badges: [...s.badges, badge] })),

      // ── Accessibility ──
      accessibility: {
        dyslexiaMode: false,
        lowVision: false,
        motorDifficulty: false,
        adhdMode: false,
        colorBlind: null, // 'deuteranopia' | 'protanopia' | 'tritanopia' | null
      },
      setAccessibility: (key, value) => {
        set((s) => ({
          accessibility: { ...s.accessibility, [key]: value },
        }));
        // Apply immediately to body
        const body = document.body;
        if (key === 'dyslexiaMode') body.classList.toggle('dyslexia-mode', value);
        if (key === 'lowVision') {
          body.classList.toggle('low-vision', value);
          body.classList.toggle('high-contrast', value);
        }
        if (key === 'motorDifficulty') body.classList.toggle('motor-difficulty', value);
        if (key === 'adhdMode') body.classList.toggle('adhd-mode', value);
        if (key === 'colorBlind') {
          body.classList.remove('color-blind-deuteranopia', 'color-blind-protanopia', 'color-blind-tritanopia');
          if (value) body.classList.add(`color-blind-${value}`);
        }
      },

      // ── Offline ──
      isOnline: navigator.onLine,
      setOnline: (v) => set({ isOnline: v }),

      // ── Active gap detection ──
      currentGapEvent: null,
      setCurrentGapEvent: (gap) => set({ currentGapEvent: gap }),

      // ── Chat ──
      chatHistory: [],
      addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      clearChat: () => set({ chatHistory: [] }),

      // ── API Keys ──
      userGeminiKey: null,
      setUserGeminiKey: (key) => {
        set({ userGeminiKey: key });
        if (key) localStorage.setItem('userGeminiKey', key);
        else localStorage.removeItem('userGeminiKey');
      },
      loadUserGeminiKey: () => {
        const key = localStorage.getItem('userGeminiKey');
        if (key) set({ userGeminiKey: key });
      },
    }),
    {
      name: 'edusense-store',
      partialize: (s) => ({
        darkMode: s.darkMode,
        language: s.language,
        accessibility: s.accessibility,
        guestMode: s.guestMode,
        gyaanCoins: s.gyaanCoins,
        streakCount: s.streakCount,
        streakFreezeCount: s.streakFreezeCount,
        lastStudyDate: s.lastStudyDate,
        badges: s.badges,
      }),
    }
  )
);
