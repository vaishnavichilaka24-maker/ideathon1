import React from 'react';
import { useSanctuaryTheme } from '../context/ThemeContext';
import { Palette, X, Check, Sparkles, Sun, Moon, Waves, Heart, Shield } from 'lucide-react';
import { SanctuaryTheme } from '../types';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, availableThemes } = useSanctuaryTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="theme-selector-modal"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sanctuary Atmosphere & Color Themes
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400">
                Personalize your therapeutic color space for maximum comfort, grounding, and focus.
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

        {/* Theme Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {availableThemes.map((t) => {
              const isSelected = theme === t.id;

              return (
                <button
                  key={t.id}
                  id={`theme-option-${t.id}`}
                  onClick={() => setTheme(t.id as SanctuaryTheme)}
                  className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/90 border-neutral-400 shadow-lg ring-2 ring-neutral-400/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                  }`}
                  style={{
                    borderColor: isSelected ? t.accentColor : undefined,
                  }}
                >
                  <div className="space-y-2">
                    {/* Theme Header with Icon & Check */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-xs sm:text-sm font-bold text-neutral-100">
                          {t.name}
                        </span>
                      </div>
                      {isSelected ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-neutral-950 font-bold"
                          style={{ backgroundColor: t.accentColor }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-neutral-700 group-hover:border-neutral-500" />
                      )}
                    </div>

                    {/* Subtitle / Psychological Intent */}
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {t.subtitle}
                    </p>
                  </div>

                  {/* Swatches strip */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-neutral-800/60">
                    <div
                      className="w-4 h-4 rounded-full shadow-xs border border-white/10"
                      style={{ backgroundColor: t.accentColor }}
                      title="Primary Accent"
                    />
                    <div
                      className="w-4 h-4 rounded-full shadow-xs border border-white/10 opacity-70"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <div className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-800" />
                    <span
                      className="text-[10px] ml-auto font-mono uppercase tracking-wider font-semibold"
                      style={{ color: t.accentColor }}
                    >
                      {t.id}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <span className="text-neutral-400 text-[11px]">
            Changes persist automatically across all debriefing tools and sessions.
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
