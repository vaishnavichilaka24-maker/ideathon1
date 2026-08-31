import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw, X, Heart, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BoxBreathingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletedCycle?: () => void;
}

type BreathingTechnique = 'box' | '478' | 'physio-sigh';

export const BoxBreathingGuide: React.FC<BoxBreathingGuideProps> = ({
  isOpen,
  onClose,
  onCompletedCycle,
}) => {
  const [technique, setTechnique] = useState<BreathingTechnique>('box');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const techniques = {
    box: {
      name: 'Box Breathing (4-4-4-4)',
      tagline: 'Standard Tactical Calming for First Responders & Field Staff',
      phases: [
        { label: 'Inhale through nose', duration: 4, action: 'expand' },
        { label: 'Hold breath gently', duration: 4, action: 'hold' },
        { label: 'Exhale slowly through mouth', duration: 4, action: 'contract' },
        { label: 'Hold empty lungs', duration: 4, action: 'hold-empty' },
      ],
    },
    '478': {
      name: '4-7-8 Deep Parasympathetic Reset',
      tagline: 'Vagal Nerve Activation for Post-Shift Adrenaline Surges',
      phases: [
        { label: 'Deep Inhale', duration: 4, action: 'expand' },
        { label: 'Hold & Relax Shoulders', duration: 7, action: 'hold' },
        { label: 'Whoosh Exhale', duration: 8, action: 'contract' },
      ],
    },
    'physio-sigh': {
      name: 'Physiological Sigh (2 Inhales + Long Exhale)',
      tagline: 'Fastest biological hack to reduce acute cortisol spikes',
      phases: [
        { label: 'Deep Inhale', duration: 3, action: 'expand' },
        { label: 'Quick Top-Up Inhale', duration: 1, action: 'expand-more' },
        { label: 'Slow Complete Exhale', duration: 6, action: 'contract' },
        { label: 'Somatic Pause', duration: 2, action: 'hold-empty' },
      ],
    },
  };

  const currentConfig = techniques[technique];
  const currentPhase = currentConfig.phases[phaseIndex];

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          setPhaseIndex((currIdx) => {
            const nextIdx = currIdx + 1;
            if (nextIdx >= currentConfig.phases.length) {
              setCompletedCycles((c) => {
                const newC = c + 1;
                if (onCompletedCycle) onCompletedCycle();
                return newC;
              });
              return 0;
            }
            return nextIdx;
          });
          const nextIdx = (phaseIndex + 1) % currentConfig.phases.length;
          return currentConfig.phases[nextIdx].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, phaseIndex, technique, currentConfig.phases, onCompletedCycle]);

  // Reset phase when technique changes
  const switchTechnique = (t: BreathingTechnique) => {
    setTechnique(t);
    setPhaseIndex(0);
    setSecondsRemaining(techniques[t].phases[0].duration);
    setIsActive(true);
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-box-breathing"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 flex flex-col items-center">
        {/* Close Button */}
        <button
          id="btn-close-breathing-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          title="Close pacer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 font-medium">
            <Wind className="w-3.5 h-3.5" />
            Somatic Vagus Nerve Grounding
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {currentConfig.name}
          </h2>
          <p className="text-xs text-neutral-400 max-w-md">
            {currentConfig.tagline}
          </p>
        </div>

        {/* Technique Switcher Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {(['box', '478', 'physio-sigh'] as BreathingTechnique[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTechnique(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                technique === t
                  ? 'bg-teal-500 text-neutral-950 font-semibold shadow-md'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {t === 'box' ? 'Box (4-4-4-4)' : t === '478' ? '4-7-8 Reset' : 'Physiological Sigh'}
            </button>
          ))}
        </div>

        {/* Dynamic Breathing Canvas Orb */}
        <div className="relative w-56 h-56 flex items-center justify-center my-2">
          {/* Animated Pulse Waves */}
          <motion.div
            animate={{
              scale:
                currentPhase.action === 'expand'
                  ? 1.45
                  : currentPhase.action === 'expand-more'
                  ? 1.55
                  : currentPhase.action === 'hold'
                  ? 1.45
                  : 1.0,
              opacity: currentPhase.action === 'hold' ? 0.85 : 0.6,
            }}
            transition={{
              duration: currentPhase.duration,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-500/15 to-cyan-500/10 blur-xl pointer-events-none"
          />

          {/* Central Orb */}
          <motion.div
            animate={{
              scale:
                currentPhase.action === 'expand'
                  ? 1.35
                  : currentPhase.action === 'expand-more'
                  ? 1.45
                  : currentPhase.action === 'hold'
                  ? 1.35
                  : 0.9,
            }}
            transition={{
              duration: currentPhase.duration,
              ease: 'easeInOut',
            }}
            className="w-40 h-40 rounded-full bg-neutral-950 border-2 border-teal-400/50 shadow-[0_0_40px_rgba(20,184,166,0.25)] flex flex-col items-center justify-center text-center p-3 relative z-10"
          >
            <span className="text-3xl font-bold text-teal-300 font-mono tracking-wider">
              {secondsRemaining}s
            </span>
            <span className="text-xs font-semibold text-neutral-200 mt-1 uppercase tracking-wider px-2">
              {currentPhase.label}
            </span>
          </motion.div>
        </div>

        {/* Phase Timeline Indicators */}
        <div className="flex items-center gap-2 mt-6 mb-6">
          {currentConfig.phases.map((p, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === phaseIndex
                  ? 'w-10 bg-teal-400'
                  : 'w-2 bg-neutral-800'
              }`}
            />
          ))}
        </div>

        {/* Controls & Metrics */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Completed Cycles: <strong className="text-white">{completedCycles}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition cursor-pointer"
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isActive ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={() => {
                setPhaseIndex(0);
                setSecondsRemaining(currentConfig.phases[0].duration);
                setCompletedCycles(0);
                setIsActive(true);
              }}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
