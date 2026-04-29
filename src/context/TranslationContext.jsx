import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translateBatch } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';

const Ctx = createContext({ t: x => x, lang: 'en', ready: false });

// All static UI strings across the entire app
const UI_STRINGS = [
  // Navbar
  'Learn', 'SAHAYAK', 'Progress', 'Community', 'Rewards',
  'Sign In', 'Sign Up', 'Sign Out', 'Settings',
  // Auth
  'Welcome back!', 'Create account', 'Continue your learning journey',
  'Start detecting your learning gaps', 'Full Name', 'Email', 'Password',
  'Continue with Google', 'or with email', 'Try without login (Guest Mode)',
  // Dashboard
  'Good morning', 'Good afternoon', 'Good evening',
  'Today\'s Goal', 'lessons', 'more lessons to hit today\'s goal & earn bonus coins!',
  'Continue Learning', 'Resume where you left off',
  'Gap Test', 'Detect comprehension gaps',
  'Ask SAHAYAK', 'Your AI learning buddy',
  'Peer Help', 'Learn with classmates',
  'Recent Gaps', 'View all', 'Leaderboard', 'Full board',
  'Top Learners', 'No gaps yet!', 'No learners yet!',
  'Take a Gap Test', 'Start Gap Test', 'Start learning to appear here.',
  'Be the first one on the board.',
  '48-Hour Re-Check Due!', 'Check Now',
  // Gap Test
  'Comprehension Gap Test', 'Detect exactly where your understanding breaks — not just scores',
  'Choose Your Topic', 'Subject', 'Topic', 'Your Question',
  'Type the question or problem you\'re working on...',
  'Start Test', 'Type your answer here...', 'Analyze Answer',
  'Back', 'Gap Analysis', 'Understanding Level',
  'You may be confusing this with:',
  'Possible rote memorization detected. Let\'s check with follow-up questions!',
  'See Story Explanation', 'Socratic Questions',
  'Socratic Question', 'Think out loud...',
  'There\'s no wrong answer here. Take your time and think through it.',
  'Next Question →', 'Finish →', 'Analysis Complete!',
  'Great job engaging with the questions.',
  'View Your Story Explanation', 'View My Progress', 'Try Another Topic',
  // Story
  'Visual Story', 'Speak this panel', 'Your Feedback',
  'Did this story help you understand?',
  'Yes, I understand now!', 'Not quite, show me another angle',
  'Generate New Story', 'Select a subject', 'Select a topic',
  // Chat
  'Explain this concept', 'Give me a quiz', 'Tell a story', 'Simplify this',
  // Progress
  'My Progress', 'Gaps Closed', 'Gaps Open', 'Total Score', 'Day Streak',
  'Subjects', 'All Subjects', 'Timeline',
  'No progress data yet. Take a gap test to get started!',
  // Gamification
  'Gyaan Yatra', 'Coins', 'Streak', 'Badges', 'Shop',
  'My Badges', 'No badges yet! Bridge your first gap to earn one.',
  'Redeem', 'Not enough coins',
  // Settings
  'Profile Settings', 'Save Changes', 'Saved!', 'Your Name',
  'API Keys', 'Gemini API Key', 'Save Key', 'Clear', 'Key saved!',
  'Notifications', 'Daily Streak Reminder', 'Gap Recheck Alert', 'Peer Messages',
  'Dark Mode', 'Off', 'On',
  // General
  'Loading...', 'Submit', 'Cancel', 'Next', 'Back',
  '✓ Closed', '⟳ Rechecking', '⚠ Open',
  'Score', 'Grade', 'day streak',
  'You\'re in guest mode. Try the Gap Test or SAHAYAK chat.',
  'Create an account to save your progress.',
  'Guest Mode',
];

export function TranslationProvider({ children }) {
  const { language } = useAppStore();
  const [map, setMap]     = useState({});
  const [ready, setReady] = useState(false);
  const prevLang = useRef('en');

  useEffect(() => {
    if (language === prevLang.current) return;
    prevLang.current = language;

    if (!language || language === 'en') {
      setMap({});
      setReady(true);
      return;
    }

    setReady(false);
    translateBatch(UI_STRINGS, language)
      .then(translated => {
        const m = {};
        UI_STRINGS.forEach((s, i) => { m[s] = translated[i] || s; });
        setMap(m);
      })
      .catch(() => setMap({}))
      .finally(() => setReady(true));
  }, [language]);

  // t(englishText) → translated string (or original if no translation)
  const t = useCallback(
    (text) => (!text || language === 'en') ? text : (map[text] || text),
    [map, language]
  );

  return <Ctx.Provider value={{ t, lang: language, ready }}>{children}</Ctx.Provider>;
}

export function useTranslation() { return useContext(Ctx); }
