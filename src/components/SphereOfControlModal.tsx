import React, { useState, useEffect } from 'react';
import { useSanctuaryTheme } from '../context/ThemeContext';
import { SphereOfControlResult, JournalSession, JournalMessage } from '../types';
import {
  Compass,
  X,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Wind,
  Heart,
  Layers,
  ArrowRight,
  Minimize2,
} from 'lucide-react';

interface SphereOfControlModalProps {
  session: JournalSession | null;
  messagesText?: string;
  messages?: JournalMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export const SphereOfControlModal: React.FC<SphereOfControlModalProps> = ({
  session,
  messagesText,
  messages,
  isOpen,
  onClose,
}) => {
  const { themeConfig } = useSanctuaryTheme();
  const [data, setData] = useState<SphereOfControlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releasedItems, setReleasedItems] = useState<string[]>([]);

  const derivedText =
    messagesText ||
    (messages && messages.length > 0
      ? messages.map((m) => `${m.role === 'user' ? 'Caregiver' : 'Facilitator'}: ${m.content}`).join('\n')
      : session?.title || 'Caregiver debrief');

  useEffect(() => {
    if (isOpen && !data && derivedText.trim()) {
      handleAnalyze();
    }
  }, [isOpen, derivedText]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/sphere-of-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: derivedText,
          role: session?.role || 'frontline caregiver',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to decompose sphere of control.');
      }

      const resData = await response.json();
      setData(resData);
      setReleasedItems([]);
    } catch (err: any) {
      console.error('Sphere of control analysis failed:', err);
      setError(err?.message || 'Failed to generate cognitive reframing matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelease = (item: string) => {
    if (!releasedItems.includes(item)) {
      setReleasedItems((prev) => [...prev, item]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="sphere-of-control-modal"
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: `${themeConfig.accentColor}25` }}
            >
              <Compass className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sphere of Control & Cognitive Re-Framing
              </h2>
              <p className="text-xs text-neutral-400">
                Untangle secondary guilt by separating what you can influence from systemic burdens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Re-analyze debrief text"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                style={{ borderColor: themeConfig.accentColor, borderTopColor: 'transparent' }}
              />
              <p className="text-xs text-neutral-400">
                Gemini is deconstructing your debrief into cognitive boundaries...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <p>{error}</p>
              <button
                onClick={handleAnalyze}
                className="px-3 py-1 bg-rose-500/20 rounded-lg text-rose-200 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* Grounding Insight Banner */}
              <div
                className="p-4 rounded-2xl border bg-neutral-950/80 relative overflow-hidden"
                style={{ borderColor: `${themeConfig.accentColor}40` }}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: themeConfig.accentColor }} />
                  <div>
                    <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-1">
                      Clinical Reframing Anchor
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed italic">
                      "{data.reframeInsight}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Interactive Duality Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Within My Influence Column */}
                <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: themeConfig.accentColor }}
                      />
                      <h4 className="text-xs font-bold text-neutral-100">
                        Within My Sphere (Own & Honor)
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {data.inControl.length} anchors
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.inControl.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-xs text-neutral-200 flex items-start gap-2.5 shadow-xs"
                      >
                        <CheckCircle
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: themeConfig.accentColor }}
                        />
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Beyond My Control (Release Column) */}
                <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <h4 className="text-xs font-bold text-neutral-100">
                        Beyond My Power (Surrender & Release)
                      </h4>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {data.outOfControl.length - releasedItems.length} to release
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.outOfControl.map((item, idx) => {
                      const isReleased = releasedItems.includes(item);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all duration-500 ${
                            isReleased
                              ? 'bg-neutral-900/30 border-neutral-900 text-neutral-600 line-through opacity-40 scale-98'
                              : 'bg-neutral-900/80 border-rose-500/20 text-neutral-200'
                          }`}
                        >
                          <span className="leading-snug">{item}</span>
                          {!isReleased ? (
                            <button
                              onClick={() => handleRelease(item)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30 transition cursor-pointer flex-shrink-0 flex items-center gap-1"
                              title="Psychologically let go of this systemic burden"
                            >
                              <Wind className="w-3 h-3" />
                              <span>Release</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-500 italic font-mono flex-shrink-0">
                              Released 🕊️
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <Compass className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">
                Write notes in your shift debrief and tap Analyze to map your Sphere of Control.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Trauma-Informed Cognitive Behavioral Framework
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
