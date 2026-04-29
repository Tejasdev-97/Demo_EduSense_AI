import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isConfigured = !!import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Warn in dev if not configured
if (!isConfigured && import.meta.env.DEV) {
  console.warn('[EduSense] Supabase not configured — running in offline/demo mode. Add VITE_SUPABASE_URL to .env.local');
}

// ── Auth ──
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });

export const signInWithPhone = (phone) =>
  supabase.auth.signInWithOtp({ phone });

export const verifyOtp = (phone, token) =>
  supabase.auth.verifyOtp({ phone, token, type: 'sms' });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ── Profile ──
export async function upsertProfile(profile) {
  const { data, error } = await supabase.from('users').upsert(profile, { onConflict: 'id' });
  return { data, error };
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  return { data, error };
}

// ── Gap Events ──
export async function insertGapEvent(event) {
  const { data, error } = await supabase.from('gap_events').insert(event).select().single();
  return { data, error };
}

export async function updateGapEvent(id, updates) {
  const { data, error } = await supabase.from('gap_events').update(updates).eq('id', id).select().single();
  return { data, error };
}

export async function getStudentGaps(studentId, limit = 20) {
  const { data, error } = await supabase
    .from('gap_events')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
}

// ── Coins ──
export async function addCoinTransaction(studentId, amount, reason, type = 'earned') {
  const { data, error } = await supabase.from('coin_transactions').insert({
    student_id: studentId,
    amount,
    type,
    reason,
  });
  // Also update user balance
  await supabase.rpc('increment_coins', { uid: studentId, delta: type === 'earned' ? amount : -amount });
  return { data, error };
}

export async function getCoinBalance(userId) {
  const { data } = await supabase.from('users').select('gyaan_coins').eq('id', userId).single();
  return data?.gyaan_coins || 0;
}

// ── Badges ──
export async function insertBadge(badge) {
  const { data, error } = await supabase.from('badges').insert(badge).select().single();
  return { data, error };
}

export async function getStudentBadges(studentId) {
  const { data } = await supabase.from('badges').select('*').eq('student_id', studentId).order('earned_at', { ascending: false });
  return data || [];
}

// ── Learning Paths ──
export async function saveLearningPath(path) {
  const { data, error } = await supabase.from('learning_paths').upsert(path, { onConflict: 'student_id,subject' }).select().single();
  return { data, error };
}

// ── Teacher ──
export async function getClassGaps(studentIds) {
  const { data } = await supabase
    .from('gap_events')
    .select('*')
    .in('student_id', studentIds)
    .gte('created_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getTeacherClass(teacherId) {
  const { data } = await supabase.from('teacher_classes').select('*').eq('teacher_id', teacherId).single();
  return data;
}

// ── Leaderboard ──
export async function getLeaderboard(limit = 10) {
  const { data } = await supabase
    .from('users')
    .select('id, name, gyaan_coins, streak_count, grade')
    .order('gyaan_coins', { ascending: false })
    .limit(limit);
  return data || [];
}

export default supabase;
