import Dexie from 'dexie';

export const db = new Dexie('EduSenseAI');

db.version(1).stores({
  gapEvents:       '++id, studentId, subject, topic, synced, createdAt',
  chatMessages:    '++id, sessionId, synced, createdAt',
  cachedStories:   'id, subject, gapType, grade',
  quizBank:        '++id, subject, grade, topic',
  studentProgress: 'studentId, subject',
  pendingSync:     '++id, type, createdAt',
  explanations:    '++id, gapEventId, synced',
  verificationChecks: '++id, gapEventId, checkType, scheduledAt',
  learningPaths:   'studentId, subject',
  badges:          '++id, studentId, earnedAt',
  coinTransactions:'++id, studentId, createdAt',
});

// ── Helpers ──

export async function saveGapEvent(event) {
  return db.gapEvents.add({ ...event, synced: false, createdAt: new Date() });
}

export async function saveStory(story) {
  return db.cachedStories.put(story);
}

export async function getOfflineStory(subject, gapType, grade) {
  return db.cachedStories
    .where('[subject+gapType+grade]')
    .equals([subject, gapType, grade])
    .first()
    .catch(() =>
      db.cachedStories
        .where('subject').equals(subject)
        .and(s => s.gapType === gapType)
        .first()
    );
}

export async function addPendingSync(type, data) {
  return db.pendingSync.add({ type, data, createdAt: new Date() });
}

export async function getPendingSync() {
  return db.pendingSync.toArray();
}

export async function deletePendingSync(id) {
  return db.pendingSync.delete(id);
}

export async function saveChatMessage(sessionId, message) {
  return db.chatMessages.add({ sessionId, ...message, synced: false, createdAt: new Date() });
}

export async function getChatMessages(sessionId) {
  return db.chatMessages.where('sessionId').equals(sessionId).toArray();
}

export async function scheduleVerification(gapEventId, checkType, scheduledAt) {
  return db.verificationChecks.add({ gapEventId, checkType, scheduledAt, completed: false });
}

export async function getDueVerifications() {
  const now = new Date();
  return db.verificationChecks
    .filter(v => !v.completed && new Date(v.scheduledAt) <= now)
    .toArray();
}

export default db;
