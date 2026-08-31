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
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const newSessionRef = doc(sessionsCol);
  const now = new Date().toISOString();

  const newSession: JournalSession = {
    id: newSessionRef.id,
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

  await setDoc(newSessionRef, sanitizePayload(newSession));
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
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: JournalSession[] = [];
      snapshot.forEach((docSnap) => {
        sessions.push(docSnap.data() as JournalSession);
      });
      callback(sessions);
    },
    (err) => {
      console.error('Firestore subscribeUserSessions error:', err);
      if (onError) onError(err);
    }
  );
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
      callback(messages);
    },
    (err) => {
      console.error('Firestore subscribeSessionMessages error:', err);
      if (onError) onError(err);
    }
  );
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
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  await updateDoc(
    sessionDocRef,
    sanitizePayload({
      summary,
      summaryModelUsed: modelUsed || 'gemini-3.6-flash',
      updatedAt: new Date().toISOString(),
    })
  );
}

/**
 * Updates session title
 */
export async function updateSessionTitle(
  userId: string,
  sessionId: string,
  title: string
): Promise<void> {
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  await updateDoc(
    sessionDocRef,
    sanitizePayload({
      title,
      updatedAt: new Date().toISOString(),
    })
  );
}

/**
 * Updates session triage attributes (stress level, role, severity, somatic areas)
 */
export async function updateSessionTriage(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<JournalSession, 'role' | 'severity' | 'stressLevel' | 'somaticAreas' | 'mode'>>
): Promise<void> {
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  await updateDoc(
    sessionDocRef,
    sanitizePayload({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  );
}

/**
 * Deletes a session and its subcollection interactions
 */
export async function deleteJournalSession(
  userId: string,
  sessionId: string
): Promise<void> {
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
}
