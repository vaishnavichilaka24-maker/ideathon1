import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  JournalSession,
  JournalMessage,
  ReflectionMode,
  CaregiverRole,
  IncidentSeverity,
  SomaticArea,
} from './types';
import {
  signInWithGoogle,
  signInAsGuest,
  logOut,
  subscribeToAuth,
} from './lib/firebase';
import {
  createJournalSession,
  subscribeUserSessions,
  subscribeSessionMessages,
  saveJournalMessage,
  updateSessionSummaryInDb,
  updateSessionTitle,
  updateSessionTriage,
  deleteJournalSession,
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { SidebarHistory } from './components/SidebarHistory';
import { JournalEditor } from './components/JournalEditor';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { ThreatModelModal } from './components/ThreatModelModal';
import { BoxBreathingGuide } from './components/BoxBreathingGuide';
import { CrisisSupportDrawer } from './components/CrisisSupportDrawer';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { SoundscapePlayer } from './components/SoundscapePlayer';
import { SphereOfControlModal } from './components/SphereOfControlModal';
import { DailyCompassionSparkModal } from './components/DailyCompassionSparkModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isSoundscapesOpen, setIsSoundscapesOpen] = useState(false);
  const [isSphereOpen, setIsSphereOpen] = useState(false);
  const [isCompassionSparkOpen, setIsCompassionSparkOpen] = useState(false);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user sessions when authenticated
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    const unsubscribe = subscribeUserSessions(
      user.uid,
      async (fetchedSessions) => {
        setSessions(fetchedSessions);
        if (fetchedSessions.length > 0) {
          setActiveSessionId((prev) => {
            const exists = fetchedSessions.some((s) => s.id === prev);
            return exists && prev ? prev : fetchedSessions[0].id;
          });
        } else {
          // If the user has no sessions yet, automatically create their first confidential debrief session
          try {
            const firstSession = await createJournalSession(
              user.uid,
              'Shift Critical Incident Debrief',
              'pfa-debrief',
              {
                role: 'healthcare',
                severity: 'moderate-stress',
                stressLevel: 6,
                somaticAreas: ['chest-tightness'],
              }
            );
            setActiveSessionId(firstSession.id);
          } catch (createErr) {
            console.warn('Auto-create initial debrief session notice:', createErr);
          }
        }
      },
      (err) => {
        console.warn('User sessions live-sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages of current active session
  useEffect(() => {
    if (!user || !activeSessionId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeSessionMessages(
      user.uid,
      activeSessionId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
      },
      (err) => {
        console.warn('Session messages live-sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, [user, activeSessionId]);

  // Auth Handlers
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      const message = err?.message || '';

      if (
        code === 'auth/unauthorized-domain' ||
        message.includes('unauthorized-domain') ||
        message.includes('authorized domain')
      ) {
        console.warn('Firebase unauthorized domain for Google Auth popup. Auto-activating confidential session fallback.');
        // Seamlessly activate instant guest/confidential session so user is never blocked
        try {
          const profile = await signInAsGuest('Frontline Caregiver');
          setUser(profile);
          setAuthError(null);
          return;
        } catch (guestErr) {
          console.error('Fallback guest sign-in error:', guestErr);
          setAuthError(
            `Domain '${window.location.hostname}' is not authorized in Firebase OAuth. Instant Guest session has been enabled for you below.`
          );
        }
      } else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        message.includes('popup-closed-by-user') ||
        message.includes('cancelled-popup-request')
      ) {
        // User closed or dismissed the popup window before completing sign-in
        console.info('Google Sign In was dismissed or closed by user.');
        setAuthError('Sign-in was cancelled. Click "Authenticate with Google" whenever you are ready, or use "Instant Guest Access".');
      } else if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
        console.warn('Google Sign In popup was blocked by browser.');
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups or use "Instant Guest Access".');
      } else if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
        console.warn('Google Sign In network error:', err);
        setAuthError('Network error during authentication. Please check your connection or use "Instant Guest Access".');
      } else {
        console.error('Google Sign In failed:', err);
        // If other error, attempt seamless instant guest session
        try {
          const fallback = await signInAsGuest('Frontline Caregiver');
          setUser(fallback);
          setAuthError(null);
          return;
        } catch {
          setAuthError(message || 'Failed to sign in with Google. You can use "Instant Guest Access" to start immediately.');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignInGuest = async (customName?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const profile = await signInAsGuest(customName || 'Confidential Responder');
      setUser(profile);
    } catch (err: any) {
      console.error('Guest Sign In failed:', err);
      setAuthError('Unable to start guest session. Please check your internet connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
    } catch (err: any) {
      console.error('Sign Out failed:', err);
    }
  };

  // Session Handlers
  const handleNewSession = async (mode: ReflectionMode = 'pfa-debrief') => {
    if (!user) return;
    try {
      const modeTitles: Record<ReflectionMode, string> = {
        'pfa-debrief': 'Shift Critical Incident Debrief',
        'compassion-fatigue': 'Compassion Fatigue Check-In',
        'moral-distress': 'Moral Injury & Ethics Processing',
        'grounding-anchor': 'Somatic Reset & Stabilization',
      };
      const title = modeTitles[mode] || 'Caregiver Shift Debrief';
      const session = await createJournalSession(user.uid, title, mode, {
        role: 'healthcare',
        severity: 'moderate-stress',
        stressLevel: 6,
        somaticAreas: ['chest-tightness'],
      });
      setActiveSessionId(session.id);
    } catch (err: any) {
      console.error('Failed to create new debrief session:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await deleteJournalSession(user.uid, sessionId);
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleUpdateTitle = async (title: string) => {
    if (!user || !activeSessionId) return;
    try {
      await updateSessionTitle(user.uid, activeSessionId, title);
    } catch (err: any) {
      console.error('Failed to update title:', err);
    }
  };

  const handleUpdateTriage = async (
    updates: Partial<Pick<JournalSession, 'role' | 'severity' | 'stressLevel' | 'somaticAreas' | 'mode'>>
  ) => {
    if (!user || !activeSessionId) return;
    try {
      await updateSessionTriage(user.uid, activeSessionId, updates);
    } catch (err: any) {
      console.error('Failed to update session triage fields:', err);
    }
  };

  const handleModeChange = async (newMode: ReflectionMode) => {
    if (!user || !activeSessionId) return;
    try {
      await handleUpdateTriage({ mode: newMode });
    } catch (err) {
      console.error('Failed to change mode:', err);
    }
  };

  // Multi-Turn Message Sender with Gemini Backend Proxy and Firestore Persistence
  const handleSendMessage = async (promptText: string) => {
    if (!user || !activeSessionId) {
      throw new Error('No active debrief session.');
    }

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    const mode = currentSession?.mode || 'pfa-debrief';
    const role = currentSession?.role || 'healthcare';
    const severity = currentSession?.severity || 'moderate-stress';
    const stressLevel = currentSession?.stressLevel ?? 6;
    const somaticAreas = currentSession?.somaticAreas || ['chest-tightness'];

    // 1. Save user prompt message to Firestore
    const userMsgId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const userMessage: JournalMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    await saveJournalMessage(user.uid, activeSessionId, userMessage, messages.length);

    // 2. Call server-side Gemini endpoint with fallback ladder
    setIsLoadingAi(true);
    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/converse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          history: historyPayload,
          mode,
          role,
          severity,
          stressLevel,
          somaticAreas,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const modelText = data.text || 'I hear you, and your feelings and experiences are valid.';
      const modelUsed = data.modelUsed || 'gemini-3.6-flash';

      // 3. Save Gemini response message to Firestore
      const modelMsgId = `gem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const modelMessage: JournalMessage = {
        id: modelMsgId,
        role: 'model',
        content: modelText,
        timestamp: new Date().toISOString(),
        modelUsed,
      };

      await saveJournalMessage(user.uid, activeSessionId, modelMessage, messages.length + 1);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Session Summarization Generator
  const handleGenerateSummary = async () => {
    if (!user || !activeSessionId) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession || messages.length === 0) return;

    const res = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: currentSession.title,
        role: currentSession.role || 'healthcare',
        severity: currentSession.severity || 'moderate-stress',
        stressLevel: currentSession.stressLevel ?? 6,
        entries: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate session summary.');
    }

    const data = await res.json();
    await updateSessionSummaryInDb(
      user.uid,
      activeSessionId,
      data.summary,
      data.modelUsed
    );
  };

  // Find active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewSession={() => handleNewSession('pfa-debrief')}
        onOpenThreatModel={() => setIsThreatModalOpen(true)}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onOpenCrisis={() => setIsCrisisOpen(true)}
        onOpenThemes={() => setIsThemesOpen(true)}
        onOpenSoundscapes={() => setIsSoundscapesOpen(true)}
      />

      {/* Main App Content */}
      <main className="flex-1 flex flex-col">
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400">Verifying secure sanctuary session...</p>
          </div>
        ) : !user ? (
          <AuthLanding
            onSignIn={handleSignIn}
            onSignInGuest={handleSignInGuest}
            isLoading={authLoading}
            errorMessage={authError}
            onClearError={() => setAuthError(null)}
            onOpenThreatModel={() => setIsThreatModalOpen(true)}
            onOpenBreathing={() => setIsBreathingOpen(true)}
            onOpenCrisis={() => setIsCrisisOpen(true)}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Archive */}
            <SidebarHistory
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => setActiveSessionId(id)}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Journal Editor View */}
            <JournalEditor
              session={activeSession}
              messages={messages}
              isLoadingAi={isLoadingAi}
              onSendMessage={handleSendMessage}
              onGenerateSummary={handleGenerateSummary}
              onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
              onUpdateTitle={handleUpdateTitle}
              onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
              onModeChange={handleModeChange}
              onUpdateTriage={handleUpdateTriage}
              onOpenBreathing={() => setIsBreathingOpen(true)}
              onDeleteSession={() => activeSession && handleDeleteSession(activeSession.id)}
              onOpenSphereOfControl={() => setIsSphereOpen(true)}
              onOpenCompassionSpark={() => setIsCompassionSparkOpen(true)}
              onOpenSoundscapes={() => setIsSoundscapesOpen(true)}
              onNewSession={handleNewSession}
            />
          </div>
        )}
      </main>

      {/* Modals & Tools */}
      <SessionSummaryModal
        session={activeSession}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />

      <BoxBreathingGuide
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />

      <CrisisSupportDrawer
        isOpen={isCrisisOpen}
        onClose={() => setIsCrisisOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
      />

      <SoundscapePlayer
        isOpen={isSoundscapesOpen}
        onClose={() => setIsSoundscapesOpen(false)}
      />

      <SphereOfControlModal
        isOpen={isSphereOpen}
        onClose={() => setIsSphereOpen(false)}
        session={activeSession}
        messages={messages}
      />

      <DailyCompassionSparkModal
        isOpen={isCompassionSparkOpen}
        onClose={() => setIsCompassionSparkOpen(false)}
        role={activeSession?.role || 'healthcare'}
      />
    </div>
  );
}
