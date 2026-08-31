import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  JournalMessage,
  JournalSession,
  ReflectionMode,
  CaregiverRole,
  IncidentSeverity,
  SomaticArea,
} from '../types';
import { useSanctuaryTheme } from '../context/ThemeContext';
import {
  Send,
  HeartHandshake,
  ShieldCheck,
  Activity,
  FileText,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
  Menu,
  Edit2,
  Bot,
  User,
  Zap,
  Lock,
  Wind,
  Trash2,
  Stethoscope,
  Sliders,
  Sparkles,
  Compass,
  Music,
  Feather,
} from 'lucide-react';

interface JournalEditorProps {
  session: JournalSession | null;
  messages: JournalMessage[];
  isLoadingAi: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  onOpenSummaryModal: () => void;
  onUpdateTitle: (title: string) => void;
  onToggleSidebar: () => void;
  onModeChange: (mode: ReflectionMode) => void;
  onUpdateTriage?: (updates: Partial<Pick<JournalSession, 'role' | 'severity' | 'stressLevel' | 'somaticAreas' | 'mode'>>) => void;
  onOpenBreathing?: () => void;
  onDeleteSession?: () => void;
  onOpenSphereOfControl?: () => void;
  onOpenCompassionSpark?: () => void;
  onOpenSoundscapes?: () => void;
}

const ROLE_LABELS: Record<CaregiverRole, { label: string; icon: string }> = {
  healthcare: { label: 'Healthcare & Nursing', icon: '🩺' },
  humanitarian: { label: 'Humanitarian & Disaster Aid', icon: '🌍' },
  'first-responder': { label: 'First Responder & EMT', icon: '🚑' },
  'social-worker': { label: 'Social Work & Crisis Counselor', icon: '🤝' },
  'family-caregiver': { label: 'Family & Elder Caregiver', icon: '🏡' },
  'crisis-volunteer': { label: 'Community Crisis Volunteer', icon: '❤️' },
};

const SEVERITY_LABELS: Record<IncidentSeverity, { label: string; color: string; border: string }> = {
  routine: { label: 'Routine Shift', color: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/30' },
  'moderate-stress': { label: 'High Stress Load', color: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/30' },
  'critical-incident': { label: 'Critical Incident', color: 'text-rose-400 bg-rose-500/10', border: 'border-rose-500/30' },
  'moral-injury': { label: 'Moral Distress / Dilemma', color: 'text-purple-400 bg-purple-500/10', border: 'border-purple-500/30' },
};

const SOMATIC_OPTIONS: { id: SomaticArea; label: string }[] = [
  { id: 'chest-tightness', label: 'Chest Tightness' },
  { id: 'shallow-breathing', label: 'Shallow Breathing' },
  { id: 'jaw-clenching', label: 'Jaw Clenching' },
  { id: 'gut-tension', label: 'Gut Tension' },
  { id: 'headache', label: 'Headache' },
  { id: 'fatigue-exhaustion', label: 'Heavy Exhaustion' },
  { id: 'calm', label: 'Grounded / Calm' },
];

const PFA_STARTER_PROMPTS: Record<ReflectionMode, string[]> = {
  'pfa-debrief': [
    'I just finished a traumatic shift and need to process what happened before going home...',
    'Help me unpack the events of today step-by-step and separate what was my responsibility from what was out of my control.',
    'I had to deliver devastating news to a family today and I am carrying an overwhelming burden of guilt.',
  ],
  'compassion-fatigue': [
    'I feel completely emotionally numb and exhausted. I worry I have no empathy left for tomorrow.',
    'I have been working 6 consecutive high-acuity shifts and feel disconnected from my loved ones.',
    'How do I gently recharge my emotional reserves without feeling guilty for taking downtime?',
  ],
  'moral-distress': [
    'We faced severe institutional resource shortages today and could not provide the standard of care our patients deserved.',
    'I felt forced to prioritize protocols over human dignity today and feel ethically compromised.',
    'How do I process the anger I feel toward administrative systems while still showing up for my team?',
  ],
  'grounding-anchor': [
    'My heart is racing from adrenaline after a code. Guide me through a 3-minute somatic reset.',
    'I feel detached and overwhelmed. Help me orient back to physical safety and psychological balance.',
    'Give me 3 grounding cognitive affirmations to close out this shift and leave work at the door.',
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  session,
  messages,
  isLoadingAi,
  onSendMessage,
  onGenerateSummary,
  onOpenSummaryModal,
  onUpdateTitle,
  onToggleSidebar,
  onModeChange,
  onUpdateTriage,
  onOpenBreathing,
  onDeleteSession,
  onOpenSphereOfControl,
  onOpenCompassionSpark,
  onOpenSoundscapes,
}) => {
  const { themeConfig } = useSanctuaryTheme();
  const [inputText, setInputText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSanitizing, setIsSanitizing] = useState(false);
  const [showTriageControls, setShowTriageControls] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session) {
      setTitleInput(session.title);
    }
  }, [session?.id, session?.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoadingAi || !session) return;

    setErrorBanner(null);
    try {
      if (!textToSend) {
        setInputText('');
      }
      await onSendMessage(text);
    } catch (err: any) {
      console.error('Send debrief failed:', err);
      setErrorBanner(err?.message || 'Failed to complete debriefing exchange with Gemini.');
      if (!textToSend) {
        setInputText(text);
      }
    }
  };

  const handleSanitizeAndRedact = async () => {
    if (!inputText.trim() || isSanitizing) return;
    setIsSanitizing(true);
    setErrorBanner(null);
    try {
      const response = await fetch('/api/gemini/anonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sanitize text.');
      }
      setInputText(data.sanitizedText);
    } catch (err: any) {
      console.error('Sanitization failed:', err);
      setErrorBanner(err?.message || 'Failed to redact identifiable details.');
    } finally {
      setIsSanitizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim() && session) {
      onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTriggerSummary = async () => {
    if (!session || messages.length === 0) return;
    setIsGeneratingSummary(true);
    setErrorBanner(null);
    try {
      await onGenerateSummary();
      onOpenSummaryModal();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to synthesize PFA debrief report.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleStressSliderChange = (newVal: number) => {
    if (onUpdateTriage && session) {
      onUpdateTriage({ stressLevel: newVal });
    }
  };

  const handleToggleSomaticArea = (area: SomaticArea) => {
    if (!session || !onUpdateTriage) return;
    const currentAreas = session.somaticAreas || [];
    const exists = currentAreas.includes(area);
    const updated = exists ? currentAreas.filter((a) => a !== area) : [...currentAreas, area];
    onUpdateTriage({ somaticAreas: updated });
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 text-center bg-neutral-950">
        <HeartHandshake className="w-12 h-12 text-teal-400/60 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-neutral-200">No Active Debrief Session</h2>
        <p className="text-xs max-w-md mt-1 text-neutral-400">
          Select a previous shift debrief from your archive or launch a new Psychological First Aid session.
        </p>
      </div>
    );
  }

  const currentMode = session.mode || 'pfa-debrief';
  const starterList = PFA_STARTER_PROMPTS[currentMode] || PFA_STARTER_PROMPTS['pfa-debrief'];
  const currentRole = session.role || 'healthcare';
  const currentSeverity = session.severity || 'moderate-stress';
  const currentStressLevel = session.stressLevel ?? 6;
  const currentSomatic = session.somaticAreas || ['chest-tightness'];

  return (
    <div id="journal-editor-container" className="flex-1 flex flex-col h-[calc(100vh-61px)] bg-neutral-950 overflow-hidden">
      {/* Top Header & Triage Bar */}
      <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            title="Toggle Archive"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Editable Debrief Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                id="input-edit-title"
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="w-full px-2.5 py-1 rounded-xl bg-neutral-950 border text-xs font-semibold text-white focus:outline-hidden"
                style={{ borderColor: themeConfig.accentColor }}
              />
              <button
                onClick={handleSaveTitle}
                className="px-2.5 py-1 text-neutral-950 rounded-lg text-xs font-bold cursor-pointer"
                style={{ backgroundColor: themeConfig.accentColor }}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 group">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {session.title}
              </h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
                title="Edit Title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons & Special Innovative Journal Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sphere of Control Cognitive Tool */}
          {onOpenSphereOfControl && (
            <button
              id="btn-sphere-control"
              onClick={onOpenSphereOfControl}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer"
              style={{
                backgroundColor: `${themeConfig.accentColor}15`,
                borderColor: `${themeConfig.accentColor}40`,
                color: themeConfig.accentColor,
              }}
              title="Separate what you can control vs systemic burdens"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sphere of Control</span>
            </button>
          )}

          {/* Daily Compassion Spark */}
          {onOpenCompassionSpark && (
            <button
              id="btn-compassion-spark"
              onClick={onOpenCompassionSpark}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-medium transition cursor-pointer"
              title="Generate a 30-second daily micro-spark anchor"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Daily Spark</span>
            </button>
          )}

          {/* Triage & Somatic Check Toggle */}
          <button
            onClick={() => setShowTriageControls(!showTriageControls)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showTriageControls
                ? 'bg-neutral-800 text-white border-neutral-600'
                : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Adjust Shift Severity & Somatic Check-In"
          >
            <Sliders className="w-3.5 h-3.5" style={{ color: themeConfig.accentColor }} />
            <span className="hidden xl:inline">Triage & Somatics</span>
          </button>

          {/* PFA Synthesis Button */}
          {session.summary ? (
            <button
              id="btn-view-summary"
              onClick={onOpenSummaryModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer"
              style={{
                backgroundColor: `${themeConfig.accentColor}20`,
                borderColor: `${themeConfig.accentColor}50`,
                color: themeConfig.accentColor,
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PFA Report</span>
            </button>
          ) : (
            <button
              id="btn-generate-summary"
              onClick={handleTriggerSummary}
              disabled={messages.length === 0 || isGeneratingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Generate a Psychological First Aid clinical synthesis of this debrief"
            >
              {isGeneratingSummary ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ color: themeConfig.accentColor }} />
              ) : (
                <Zap className="w-3.5 h-3.5" style={{ color: themeConfig.accentColor }} />
              )}
              <span>{isGeneratingSummary ? 'Synthesizing...' : 'Generate Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Somatic & Shift Triage Dropdown Drawer */}
      {showTriageControls && (
        <div className="p-4 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-300 space-y-3 transition">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Role Select */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Caregiver Role:</span>
              <select
                value={currentRole}
                onChange={(e) => onUpdateTriage && onUpdateTriage({ role: e.target.value as CaregiverRole })}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-hidden"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Select */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Shift Intensity:</span>
              <select
                value={currentSeverity}
                onChange={(e) => onUpdateTriage && onUpdateTriage({ severity: e.target.value as IncidentSeverity })}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white focus:outline-hidden"
              >
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stress Level Slider */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">
                Stress Load: <strong style={{ color: themeConfig.accentColor }}>{currentStressLevel}/10</strong>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={currentStressLevel}
                onChange={(e) => handleStressSliderChange(Number(e.target.value))}
                className="w-24 cursor-pointer"
                style={{ accentColor: themeConfig.accentColor }}
              />
            </div>
          </div>

          {/* Somatic Check-In Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 font-medium">Somatic Check-In (Where is tension held right now?):</span>
            <div className="flex flex-wrap gap-1.5">
              {SOMATIC_OPTIONS.map((opt) => {
                const isSelected = currentSomatic.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleToggleSomaticArea(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                      isSelected
                        ? 'text-neutral-100'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${themeConfig.accentColor}25` : undefined,
                      borderColor: isSelected ? `${themeConfig.accentColor}60` : undefined,
                      color: isSelected ? themeConfig.accentColor : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Protocol Mode Switcher Pills */}
      <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-neutral-500 font-medium hidden md:inline">Protocol:</span>
          {(
            [
              { id: 'pfa-debrief', label: '1. Incident Debrief', desc: 'Standard PFA' },
              { id: 'compassion-fatigue', label: '2. Compassion Fatigue', desc: 'Empathy burnout' },
              { id: 'moral-distress', label: '3. Moral Injury', desc: 'Systemic barriers' },
              { id: 'grounding-anchor', label: '4. Somatic Reset', desc: 'Adrenaline reset' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                currentMode === m.id
                  ? 'text-neutral-950 font-bold shadow-xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800'
              }`}
              style={{
                backgroundColor: currentMode === m.id ? themeConfig.accentColor : undefined,
                borderColor: currentMode === m.id ? themeConfig.accentColor : undefined,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Purge / Burn Option for Shared Hardware */}
        {onDeleteSession && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to completely purge and permanently delete this debrief session?')) {
                onDeleteSession();
              }
            }}
            className="p-1 text-neutral-500 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
            title="Permanently Purge & Burn Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div
          id="editor-error-banner"
          className="mx-4 mt-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => handleSend()}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="py-8 space-y-6 text-center">
            <div
              className="w-14 h-14 rounded-3xl bg-neutral-900 border mx-auto flex items-center justify-center shadow-md transition-colors"
              style={{
                borderColor: `${themeConfig.accentColor}40`,
                backgroundColor: `${themeConfig.accentColor}10`,
              }}
            >
              <HeartHandshake className="w-7 h-7" style={{ color: themeConfig.accentColor }} />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                {currentMode === 'compassion-fatigue'
                  ? 'Compassion Fatigue & Depletion Sanctuary'
                  : currentMode === 'moral-distress'
                  ? 'Moral Injury & Ethics Processing'
                  : currentMode === 'grounding-anchor'
                  ? 'Somatic Reset & Stabilization'
                  : 'Psychological First Aid Shift Debrief'}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Take a breath. You are safe here in your private sanctuary. Unpack what occurred on your shift. Gemini is configured with trauma-informed Psychological First Aid protocols to help ground you.
              </p>
            </div>

            {/* Prompt Starters */}
            <div className="max-w-xl mx-auto space-y-2 pt-2 text-left">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Select a debriefing anchor to begin:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {starterList.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`prompt-starter-${idx}`}
                    onClick={() => handleSend(prompt)}
                    className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:bg-neutral-900 text-left text-xs text-neutral-300 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>"{prompt}"</span>
                    <Send className="w-3.5 h-3.5 text-neutral-600 transition transform group-hover:translate-x-0.5" style={{ color: themeConfig.accentColor }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isModel = msg.role === 'model';
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex gap-3.5 ${isModel ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-semibold shadow-xs border ${
                    isModel ? 'bg-neutral-900' : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                  style={{
                    borderColor: isModel ? `${themeConfig.accentColor}50` : undefined,
                    color: isModel ? themeConfig.accentColor : undefined,
                  }}
                >
                  {isModel ? <HeartHandshake className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body Card */}
                <div
                  className={`relative group max-w-2xl rounded-3xl p-4 text-xs sm:text-sm leading-relaxed border transition ${
                    isModel
                      ? 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-100'
                  }`}
                >
                  {/* Header metadata */}
                  <div className="flex items-center justify-between gap-3 mb-2 pb-1 border-b border-neutral-800/60 text-[10px] sm:text-[11px] text-neutral-400">
                    <span className="font-semibold text-neutral-300">
                      {isModel ? 'PFA Debrief Facilitator (Gemini)' : 'You (Caregiver)'}
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-800 text-neutral-400 font-mono">
                          {msg.modelUsed}
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Render Message with Markdown */}
                  <div className="prose prose-invert prose-xs max-w-none text-neutral-200 space-y-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Floating Action: Copy */}
                  <button
                    onClick={() => handleCopyText(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Copy message"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoadingAi && (
          <div className="flex gap-3.5 items-start">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${themeConfig.accentColor}15`,
                borderColor: `${themeConfig.accentColor}40`,
                color: themeConfig.accentColor,
              }}
            >
              <HeartHandshake className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: themeConfig.accentColor }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s]"
                style={{ backgroundColor: themeConfig.accentColor }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s]"
                style={{ backgroundColor: themeConfig.accentColor }}
              />
              <span className="ml-1 text-neutral-400">Gemini is processing your debrief with PFA guidelines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with PII Sanitization Toolbar */}
      <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-900/90">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Sanitization Tool Bar */}
          <div className="flex items-center justify-between text-[11px] px-1 text-neutral-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSanitizeAndRedact}
                disabled={!inputText.trim() || isSanitizing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-[11px] font-medium transition disabled:opacity-40 cursor-pointer"
                title="Redacts patient names, hospital locations, and PII before submitting"
              >
                {isSanitizing ? (
                  <RotateCw className="w-3 h-3 animate-spin" style={{ color: themeConfig.accentColor }} />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                )}
                <span>{isSanitizing ? 'Sanitizing PII...' : 'Redact Patient / PII Names'}</span>
              </button>
              <span className="text-[10px] text-neutral-500 hidden sm:inline">Scrub confidential IDs</span>
            </div>

            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              Press <strong>Enter</strong> to send &bull; <strong>Shift+Enter</strong> for newline
            </span>
          </div>

          <div
            className="flex items-end gap-2 bg-neutral-950 border border-neutral-800 rounded-3xl p-2 transition shadow-inner"
            style={{
              borderColor: inputText.trim() ? `${themeConfig.accentColor}60` : undefined,
            }}
          >
            <textarea
              id="input-reflection-prompt"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Debrief your shift events, emotional weight, or moral dilemmas..."
              className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-hidden p-2 min-h-[44px] max-h-36"
            />

            <button
              id="btn-send-reflection"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoadingAi}
              className="p-2.5 rounded-2xl text-neutral-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              style={{
                backgroundColor: themeConfig.accentColor,
              }}
              title="Submit Debrief"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
