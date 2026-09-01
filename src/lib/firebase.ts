import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Initialize Firebase client safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use provisioned firestore database ID if specified in configuration
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips any undefined fields recursively before sending objects to Firestore.
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

const LOCAL_USER_KEY = 'sanctuary_local_caregiver_user';

export function getStoredLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredLocalUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {}
}

/**
 * Sign in using Firebase Authentication via Google Provider
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Caregiver',
    photoURL: user.photoURL,
  };
  setStoredLocalUser(profile);
  return profile;
}

/**
 * Sign in anonymously for confidential / shared terminal access
 */
export async function signInAsGuest(customName?: string): Promise<UserProfile> {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    const profile: UserProfile = {
      uid: user.uid,
      email: null,
      displayName: customName || 'Confidential Responder (Guest)',
      photoURL: null,
    };
    setStoredLocalUser(profile);
    return profile;
  } catch (err: any) {
    console.warn('Firebase anonymous auth unavailable or restricted. Initializing confidential local session:', err);
    let existing = getStoredLocalUser();
    if (!existing) {
      existing = {
        uid: 'responder_' + Math.random().toString(36).substring(2, 10),
        email: null,
        displayName: customName || 'Confidential Responder',
        photoURL: null,
      };
    } else if (customName) {
      existing.displayName = customName;
    }
    setStoredLocalUser(existing);
    return existing;
  }
}

/**
 * Sign out of Firebase Authentication
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
  setStoredLocalUser(null);
}

/**
 * Listen to user auth state changes
 */
export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  try {
    return onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (user) {
          const profile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (user.isAnonymous ? 'Confidential Responder (Guest)' : 'Caregiver'),
            photoURL: user.photoURL,
          };
          setStoredLocalUser(profile);
          callback(profile);
        } else {
          const local = getStoredLocalUser();
          if (local && local.uid.startsWith('responder_')) {
            callback(local);
          } else {
            callback(null);
          }
        }
      },
      (err) => {
        console.warn('Firebase onAuthStateChanged notice:', err);
        const local = getStoredLocalUser();
        callback(local || null);
      }
    );
  } catch (err) {
    console.warn('Firebase subscribeToAuth catch:', err);
    const local = getStoredLocalUser();
    callback(local || null);
    return () => {};
  }
}

