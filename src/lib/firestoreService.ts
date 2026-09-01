import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizePayload } from './firebase';
import {
  JournalMessage,
  JournalSession,
  ReflectionMode,
  CaregiverRole,
  IncidentSeverity,
  SomaticArea,
} from '../types';

// Local storage key helpers for fallback offline/confidential mode
function getLocalSessionsKey(userId: string) {
  return `sanctuary_sessions_${userId}`;
}

function getLocalMessagesKey(userId: string, sessionId: string) {
  return `sanctuary_msgs_${userId}_${sessionId}`;
}

function readLocalSessions(userId: string): JournalSession[] {
  try {
    const raw = localStorage.getItem(getLocalSessionsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalSessions(userId: string, sessions: JournalSession[]): void {
  try {
    localStorage.setItem(getLocalSessionsKey(userId), JSON.stringify(sessions));
  } catch {}
}

function readLocalMessages(userId: string, sessionId: string): JournalMessage[] {
  try {
    const raw = localStorage.getItem(getLocalMessagesKey(userId, sessionId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(userId: string, sessionId: string, messages: JournalMessage[]): void {
  try {
    localStorage.setItem(getLocalMessagesKey(userId, sessionId), JSON.stringify(messages));
  } catch {}
}

/**
 * Creates a new user reflection session document under /users/{userId}/sessions/{sessionId}
 */
export async function createJournalSession(
  userId: string,
  title: string,
  mode: ReflectionMode,
  triageData?: {
    role?: CaregiverRole;
    severity?: IncidentSeverity;
    stressLevel?: number;
    somaticAreas?: SomaticArea[];
  }
): Promise<JournalSession> {
  const now = new Date().toISOString();
  const sessionId = 'session_' + Math.random().toString(36).substring(2, 11);

  const newSession: JournalSession = {
    id: sessionId,
    userId,
    title: title || 'Caregiver Shift Debrief',
    mode: mode || 'pfa-debrief',
    role: triageData?.role || 'healthcare',
    severity: triageData?.severity || 'moderate-stress',
    stressLevel: triageData?.stressLevel ?? 6,
    somaticAreas: triageData?.somaticAreas || ['chest-tightness'],
    createdAt: now,
    updatedAt: now,
    entryCount: 0,
    previewText: '',
  };

  // Always mirror to local storage
  const localList = readLocalSessions(userId);
  writeLocalSessions(userId, [newSession, ...localList.filter((s) => s.id !== sessionId)]);

  // Attempt Firestore sync if not synthetic local user
  if (!userId.startsWith('responder_')) {
    try {
      const sessionsCol = collection(db, 'users', userId, 'sessions');
      const newSessionRef = doc(sessionsCol, sessionId);
      await setDoc(newSessionRef, sanitizePayload(newSession));
    } catch (err) {
      console.warn('Firestore createJournalSession fallback to local:', err);
    }
  }

  return newSession;
}

/**
 * Subscribes to the list of sessions for a specific user
 */
export function subscribeUserSessions(
  userId: string,
  callback: (sessions: JournalSession[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  // Immediately provide cached/local data
  const initialLocal = readLocalSessions(userId);
  callback(initialLocal);

  if (userId.startsWith('responder_')) {
    const handleStorage = () => callback(readLocalSessions(userId));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  try {
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsCol, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: JournalSession[] = [];
        snapshot.forEach((docSnap) => {
          sessions.push(docSnap.data() as JournalSession);
        });
        writeLocalSessions(userId, sessions);
        callback(sessions);
      },
      (err) => {
        console.warn('Firestore subscribeUserSessions using local store:', err);
        callback(readLocalSessions(userId));
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Firestore subscription failed, running locally:', err);
    return () => {};
  }
}

/**
 * Subscribes to real-time interaction messages for a specific session
 */
export function subscribeSessionMessages(
  userId: string,
  sessionId: string,
  callback: (messages: JournalMessage[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  // Immediately emit cached/local messages
  callback(readLocalMessages(userId, sessionId));

  if (userId.startsWith('responder_')) {
    const handleStorage = () => callback(readLocalMessages(userId, sessionId));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  try {
    const messagesCol = collection(
      db,
      'users',
      userId,
      'sessions',
      sessionId,
      'interactions'
    );
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: JournalMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push(docSnap.data() as JournalMessage);
        });
        writeLocalMessages(userId, sessionId, messages);
        callback(messages);
      },
      (err) => {
        console.warn('Firestore subscribeSessionMessages using local store:', err);
        callback(readLocalMessages(userId, sessionId));
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Firestore message subscription failed, running locally:', err);
    return () => {};
  }
}

/**
 * Saves an interaction (prompt or model response) to Firestore
 * and updates the parent session metadata
 */
export async function saveJournalMessage(
  userId: string,
  sessionId: string,
  message: JournalMessage,
  currentCount: number
): Promise<void> {
  // Always update local cache
  const localMsgs = readLocalMessages(userId, sessionId);
  const updatedMsgs = [...localMsgs.filter((m) => m.id !== message.id), message];
  writeLocalMessages(userId, sessionId, updatedMsgs);

  const localSessions = readLocalSessions(userId);
  const updatedSessions = localSessions.map((s) => {
    if (s.id === sessionId) {
      return {
        ...s,
        updatedAt: message.timestamp,
        entryCount: currentCount + 1,
        previewText: message.role === 'user' ? message.content.slice(0, 120) : s.previewText,
      };
    }
    return s;
  });
  writeLocalSessions(userId, updatedSessions);

  if (!userId.startsWith('responder_')) {
    try {
      const messagesCol = collection(
        db,
        'users',
        userId,
        'sessions',
        sessionId,
        'interactions'
      );
      const messageDocRef = doc(messagesCol, message.id);
      const cleanMessage = sanitizePayload(message);

      await setDoc(messageDocRef, cleanMessage);

      // Update session updatedAt and preview
      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      const sessionUpdate: Partial<JournalSession> = {
        updatedAt: message.timestamp,
        entryCount: currentCount + 1,
      };

      if (message.role === 'user') {
        sessionUpdate.previewText = message.content.slice(0, 120);
      }

      await updateDoc(sessionDocRef, sanitizePayload(sessionUpdate));
    } catch (err) {
      console.warn('Firestore saveJournalMessage fallback to local:', err);
    }
  }
}

/**
 * Saves generated summary to the session document
 */
export async function updateSessionSummaryInDb(
  userId: string,
  sessionId: string,
  summary: string,
  modelUsed?: string
): Promise<void> {
  const localSessions = readLocalSessions(userId);
  const updatedSessions = localSessions.map((s) => {
    if (s.id === sessionId) {
      return {
        ...s,
        summary,
        summaryModelUsed: modelUsed || 'gemini-3.6-flash',
        updatedAt: new Date().toISOString(),
      };
    }
    return s;
  });
  writeLocalSessions(userId, updatedSessions);

  if (!userId.startsWith('responder_')) {
    try {
      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(
        sessionDocRef,
        sanitizePayload({
          summary,
          summaryModelUsed: modelUsed || 'gemini-3.6-flash',
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn('Firestore updateSessionSummaryInDb fallback to local:', err);
    }
  }
}

/**
 * Updates session title
 */
export async function updateSessionTitle(
  userId: string,
  sessionId: string,
  title: string
): Promise<void> {
  const localSessions = readLocalSessions(userId);
  const updatedSessions = localSessions.map((s) => {
    if (s.id === sessionId) {
      return {
        ...s,
        title,
        updatedAt: new Date().toISOString(),
      };
    }
    return s;
  });
  writeLocalSessions(userId, updatedSessions);

  if (!userId.startsWith('responder_')) {
    try {
      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(
        sessionDocRef,
        sanitizePayload({
          title,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn('Firestore updateSessionTitle fallback to local:', err);
    }
  }
}

/**
 * Updates session triage attributes (stress level, role, severity, somatic areas)
 */
export async function updateSessionTriage(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<JournalSession, 'role' | 'severity' | 'stressLevel' | 'somaticAreas' | 'mode'>>
): Promise<void> {
  const localSessions = readLocalSessions(userId);
  const updatedSessions = localSessions.map((s) => {
    if (s.id === sessionId) {
      return {
        ...s,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return s;
  });
  writeLocalSessions(userId, updatedSessions);

  if (!userId.startsWith('responder_')) {
    try {
      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(
        sessionDocRef,
        sanitizePayload({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn('Firestore updateSessionTriage fallback to local:', err);
    }
  }
}

/**
 * Deletes a session and its subcollection interactions
 */
export async function deleteJournalSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const localSessions = readLocalSessions(userId);
  writeLocalSessions(
    userId,
    localSessions.filter((s) => s.id !== sessionId)
  );
  try {
    localStorage.removeItem(getLocalMessagesKey(userId, sessionId));
  } catch {}

  if (!userId.startsWith('responder_')) {
    try {
      // Delete subcollection messages first
      const messagesCol = collection(
        db,
        'users',
        userId,
        'sessions',
        sessionId,
        'interactions'
      );
      const snapshot = await getDocs(messagesCol);
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // Delete parent session doc
      const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
      await deleteDoc(sessionDocRef);
    } catch (err) {
      console.warn('Firestore deleteJournalSession fallback to local:', err);
    }
  }
}
