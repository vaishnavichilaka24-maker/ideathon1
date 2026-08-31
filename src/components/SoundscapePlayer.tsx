import React, { useState, useEffect } from 'react';
import { soundscapeSynth } from '../lib/soundscapeSynth';
import { SoundscapeType } from '../types';
import { useSanctuaryTheme } from '../context/ThemeContext';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Waves,
  CloudRain,
  Radio,
  Sliders,
  X,
  Music,
} from 'lucide-react';

interface SoundscapePlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOUNDSCAPES: {
  id: SoundscapeType;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}[] = [
  {
    id: '432hz',
    name: '432 Hz Solfeggio Healing Drone',
    category: 'Harmonic Resonance',
    description: 'Natural tuning frequency that promotes parasympathetic vagal stimulation and heart rate stabilization.',
    icon: Sparkles,
  },
  {
    id: 'theta',
    name: 'Theta Wave Meditation (5.5 Hz Beat)',
    category: 'Binaural Entrainment',
    description: 'Differential carrier waves designed to induce deep restorative calmness and disperse hyperarousal.',
    icon: Radio,
  },
  {
    id: 'ocean',
    name: 'Oceanic Rhythmic Surf',
    category: 'Somatic Noise',
    description: 'Soft modulated wave swells that mimic maternal rhythmic breathing and soothe an overloaded nervous system.',
    icon: Waves,
  },
  {
    id: 'rain',
    name: 'Gentle Rain & Forest Resonance',
    category: 'Acoustic Solace',
    description: 'Continuous soothing frequency masking that drowns out clinical monitor alarms and sirens.',
    icon: CloudRain,
  },
];

export const SoundscapePlayer: React.FC<SoundscapePlayerProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useSanctuaryTheme();
  const [activeType, setActiveType] = useState<SoundscapeType>('off');
  const [volume, setVolume] = useState<number>(soundscapeSynth.getVolume());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    setActiveType(soundscapeSynth.getCurrentType());
  }, [isOpen]);

  // Handle timer countdown
  useEffect(() => {
    if (timerSecondsLeft === null) return;
    if (timerSecondsLeft <= 0) {
      soundscapeSynth.stop();
      setActiveType('off');
      setTimerMinutes(null);
      setTimerSecondsLeft(null);
      return;
    }

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSecondsLeft]);

  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (activeType === type) {
      soundscapeSynth.stop();
      setActiveType('off');
      setTimerMinutes(null);
      setTimerSecondsLeft(null);
    } else {
      soundscapeSynth.play(type);
      setActiveType(type);
      if (timerMinutes) {
        setTimerSecondsLeft(timerMinutes * 60);
      }
    }
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    soundscapeSynth.setVolume(newVal);
  };

  const handleSetTimer = (minutes: number | null) => {
    setTimerMinutes(minutes);
    if (minutes) {
      setTimerSecondsLeft(minutes * 60);
    } else {
      setTimerSecondsLeft(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="soundscape-player-modal"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: `${themeConfig.accentColor}25`, borderColor: themeConfig.accentColor }}
            >
              <Music className="w-5 h-5" style={{ color: themeConfig.accentColor }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Neuro-Acoustic Soundscapes & Frequencies
              </h2>
              <p className="text-xs text-neutral-400">
                Pure synthesizers (432Hz, Theta binaurals, Rain) to calm the vagus nerve during debriefing.
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

        {/* Master Control Banner */}
        <div className="px-6 py-3 bg-neutral-950/70 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          {/* Active Status Indicator */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                activeType !== 'off' ? 'animate-ping' : 'opacity-40'
              }`}
              style={{ backgroundColor: activeType !== 'off' ? themeConfig.accentColor : '#737373' }}
            />
            <span className="text-xs font-semibold text-neutral-200">
              {activeType === 'off'
                ? 'Soundscape Inactive'
                : `Playing: ${SOUNDSCAPES.find((s) => s.id === activeType)?.name}`}
            </span>
            {timerSecondsLeft !== null && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono">
                {formatTimer(timerSecondsLeft)} left
              </span>
            )}
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
              className="text-neutral-400 hover:text-neutral-200"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              id="soundscape-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-neutral-300 cursor-pointer"
            />
            <span className="text-[10px] text-neutral-500 font-mono w-7">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Soundscape Selection Cards */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SOUNDSCAPES.map((s) => {
              const isPlaying = activeType === s.id;
              const IconComp = s.icon;

              return (
                <button
                  key={s.id}
                  id={`soundscape-card-${s.id}`}
                  onClick={() => handleSelectSoundscape(s.id)}
                  className={`p-4 rounded-2xl border text-left transition relative group flex flex-col justify-between cursor-pointer ${
                    isPlaying
                      ? 'bg-neutral-800/90 border-neutral-400 shadow-md'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                  }`}
                  style={{
                    borderColor: isPlaying ? themeConfig.accentColor : undefined,
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: isPlaying
                              ? `${themeConfig.accentColor}30`
                              : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <IconComp
                            className="w-4 h-4"
                            style={{ color: isPlaying ? themeConfig.accentColor : '#a3a3a3' }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-100">{s.name}</span>
                      </div>

                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition"
                        style={{
                          backgroundColor: isPlaying ? themeConfig.accentColor : 'rgba(255,255,255,0.1)',
                          color: isPlaying ? '#0a0a0a' : '#a3a3a3',
                        }}
                      >
                        {isPlaying ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">{s.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="font-mono">{s.category}</span>
                    <span className="font-semibold" style={{ color: isPlaying ? themeConfig.accentColor : undefined }}>
                      {isPlaying ? 'Active Playing' : 'Tap to Play'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sleep / Decompression Timer Strip */}
          <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 font-medium">Decompression Timer:</span>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Off', val: null },
                { label: '10 min', val: 10 },
                { label: '20 min', val: 20 },
                { label: '30 min', val: 30 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSetTimer(item.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    timerMinutes === item.val
                      ? 'bg-neutral-700 text-white font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px]">
            100% Web Audio synthesis &bull; Zero background data usage &bull; Continuous background playback
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
