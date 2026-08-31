import React from 'react';
import { UserProfile } from '../types';
import { useSanctuaryTheme } from '../context/ThemeContext';
import { soundscapeSynth } from '../lib/soundscapeSynth';
import {
  ShieldCheck,
  LogOut,
  PlusCircle,
  Sparkles,
  Wind,
  PhoneCall,
  Lock,
  HeartHandshake,
  Palette,
  Music,
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewSession: () => void;
  onOpenThreatModel: () => void;
  onOpenBreathing: () => void;
  onOpenCrisis: () => void;
  onOpenThemes: () => void;
  onOpenSoundscapes: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewSession,
  onOpenThreatModel,
  onOpenBreathing,
  onOpenCrisis,
  onOpenThemes,
  onOpenSoundscapes,
}) => {
  const { themeConfig } = useSanctuaryTheme();
  const activeSoundscape = soundscapeSynth.getCurrentType();

  return (
    <header
      id="app-header"
      className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-neutral-100 sticky top-0 z-30 px-3 py-2.5 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 transition-colors"
            style={{
              backgroundColor: `${themeConfig.accentColor}20`,
              borderColor: `${themeConfig.accentColor}50`,
              borderWidth: 1,
            }}
          >
            <HeartHandshake className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                Haven <span className="font-normal text-xs sm:text-sm" style={{ color: themeConfig.accentColor }}>| PFA Sanctuary</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                <Lock className="w-2.5 h-2.5" /> User Vault
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Psychological First Aid & Compassion Fatigue Debriefing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Theme Palette Switcher */}
          <button
            id="btn-nav-themes"
            onClick={onOpenThemes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition cursor-pointer"
            style={{
              backgroundColor: `${themeConfig.accentColor}15`,
              borderColor: `${themeConfig.accentColor}40`,
              color: themeConfig.accentColor,
            }}
            title="Change Sanctuary Color Theme & Atmosphere"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-semibold">{themeConfig.name.split('&')[0]}</span>
          </button>

          {/* Neuro-Acoustic Soundscapes */}
          <button
            id="btn-nav-soundscapes"
            onClick={onOpenSoundscapes}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition cursor-pointer ${
              activeSoundscape !== 'off'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700'
            }`}
            title="Open Neuro-Acoustic Frequencies (432Hz, Binaurals, Rain)"
          >
            <Music className={`w-3.5 h-3.5 ${activeSoundscape !== 'off' ? 'animate-bounce text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Soundscapes</span>
          </button>

          {/* Somatic Pacer Trigger */}
          <button
            id="btn-nav-breathing"
            onClick={onOpenBreathing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition cursor-pointer"
            title="Launch Somatic Box Breathing & Heart Rate Pacer"
          >
            <Wind className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="hidden lg:inline">Grounding Pacer</span>
          </button>

          {/* Frontline Crisis Hotline Trigger */}
          <button
            id="btn-nav-crisis"
            onClick={onOpenCrisis}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
            title="Open 24/7 Frontline Lifelines & Crisis Lines"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">Crisis Lifelines</span>
          </button>

          {/* Threat Model Trigger */}
          <button
            id="btn-threat-model"
            onClick={onOpenThreatModel}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition cursor-pointer"
            title="View Threat Summary Table and Security Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security Model</span>
          </button>

          {user && (
            <>
              <button
                id="btn-new-session-nav"
                onClick={onNewSession}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer"
                style={{
                  backgroundColor: themeConfig.accentColor,
                  color: '#0a0a0a',
                }}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Debrief</span>
              </button>

              <div className="h-5 w-px bg-neutral-800 mx-0.5" />

              {/* User Profile & Sign Out */}
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="w-7 h-7 rounded-full border border-neutral-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden 2xl:block text-left">
                  <p className="text-xs font-medium text-neutral-200 truncate max-w-[120px]">
                    {user.displayName || 'Caregiver'}
                  </p>
                </div>

                <button
                  id="btn-signout"
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

