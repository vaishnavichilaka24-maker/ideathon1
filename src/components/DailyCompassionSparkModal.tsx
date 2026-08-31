import React, { useState } from 'react';
import { useSanctuaryTheme } from '../context/ThemeContext';
import { CaregiverRole } from '../types';
import {
  Sparkles,
  X,
  RotateCw,
  Heart,
  Copy,
  Check,
  Zap,
  Activity,
  Smile,
  ShieldAlert,
  Feather,
} from 'lucide-react';

interface DailyCompassionSparkModalProps {
  role: CaregiverRole;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyCompassionSparkModal: React.FC<DailyCompassionSparkModalProps> = ({
  role,
  isOpen,
  onClose,
}) => {
  const { themeConfig } = useSanctuaryTheme();
  const [mood, setMood] = useState('exhausted');
  const [sparkData, setSparkData] = useState<{
    affirmation: string;
    somaticMicroAction: string;
    mantra: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateSpark = async (selectedMood?: string) => {
    const targetMood = selectedMood || mood;
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/compassion-spark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, mood: targetMood }),
      });
      const data = await res.json();
      setSparkData(data);
    } catch (err) {
      console.error('Failed to generate spark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (sparkData) {
      navigator.clipboard.writeText(
        `Daily Caregiver Grounding Mantra:\n"${sparkData.mantra}"\n\nAffirmation: ${sparkData.affirmation}\n\nSomatic Micro-Reset: ${sparkData.somaticMicroAction}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="daily-compassion-spark-modal"
        className="w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: `${themeConfig.accentColor}25` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Daily Compassion Spark
              </h2>
              <p className="text-xs text-neutral-400">
                A 30-second restorative anchor tailored to your shift emotional energy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mood State Picker */}
        <div className="px-6 py-3 bg-neutral-950/70 border-b border-neutral-800 space-y-2">
          <span className="text-[11px] font-semibold text-neutral-400">
            How is your nervous system feeling right now?
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'exhausted', label: '🔋 Depleted / Exhausted' },
              { id: 'overstimulated', label: '⚡ Hyper-Vigilant / Wired' },
              { id: 'numb', label: '🧊 Emotionally Numb' },
              { id: 'grieving', label: '💧 Heavy / Grieving' },
              { id: 'seeking-calm', label: '🌱 Ready to Reset' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMood(m.id);
                  handleGenerateSpark(m.id);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                  mood === m.id
                    ? 'bg-neutral-200 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Card */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RotateCw className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-400">Synthesizing personalized grounding spark...</p>
            </div>
          ) : sparkData ? (
            <div className="space-y-4">
              {/* Mantra Display Card */}
              <div
                className="p-5 rounded-3xl text-center space-y-2 border relative overflow-hidden"
                style={{
                  backgroundColor: `${themeConfig.accentColor}12`,
                  borderColor: `${themeConfig.accentColor}40`,
                }}
              >
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                  Shift Grounding Mantra
                </span>
                <h3
                  className="text-lg sm:text-xl font-extrabold tracking-tight"
                  style={{ color: themeConfig.accentColor }}
                >
                  "{sparkData.mantra}"
                </h3>
              </div>

              {/* Affirmation */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <Feather className="w-4 h-4" style={{ color: themeConfig.accentColor }} />
                  <span>Compassion Truth</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed italic">
                  {sparkData.affirmation}
                </p>
              </div>

              {/* Somatic Action */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>30-Second Physical Release</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {sparkData.somaticMicroAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500 space-y-3">
              <Zap className="w-8 h-8 mx-auto opacity-40 text-amber-400" />
              <p className="text-xs max-w-xs mx-auto">
                Select your current emotional energy state above to receive an instant micro-grounding spark.
              </p>
              <button
                onClick={() => handleGenerateSpark()}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
              >
                Generate Micro-Spark
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <button
            onClick={handleCopy}
            disabled={!sparkData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Mantra'}</span>
          </button>

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
