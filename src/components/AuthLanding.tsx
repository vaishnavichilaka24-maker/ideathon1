import React from 'react';
import { HeartHandshake, Shield, Database, Wind, Lock, CheckCircle2, PhoneCall, Stethoscope, Sparkles } from 'lucide-react';

interface AuthLandingProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onOpenThreatModel: () => void;
  onOpenBreathing: () => void;
  onOpenCrisis: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
  onOpenThreatModel,
  onOpenBreathing,
  onOpenCrisis,
}) => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-4 py-10 bg-neutral-950 text-neutral-100">
      <div className="max-w-5xl w-full mx-auto space-y-10">
        {/* Main Hero Box */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-xs font-semibold text-teal-300">
            <HeartHandshake className="w-4 h-4 text-teal-400" />
            Specialized Psychological First Aid (PFA) & Caregiver Sanctuary
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Decompress from the frontline in a <span className="text-teal-400">confidential trauma-informed</span> sanctuary.
          </h1>

          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Engineered specifically for healthcare workers, disaster response teams, humanitarian aid workers, and crisis caregivers. Unpack critical shift trauma, separate what was in your control from systemic weight, and restore your care reserves in a private, encrypted environment.
          </p>

          {errorMessage && (
            <div
              id="auth-error-banner"
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-left flex items-start gap-2.5 max-w-xl mx-auto"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-xs">Authentication Notice</p>
                <p className="text-xs text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Primary Action Call to Action */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-google-signin"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-sm transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Securing Session...' : 'Authenticate with Google'}</span>
            </button>

            <button
              id="btn-landing-breathing"
              onClick={onOpenBreathing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-teal-300 border border-teal-500/30 text-sm font-medium transition cursor-pointer"
            >
              <Wind className="w-4 h-4 text-teal-400" />
              <span>Somatic Box Breathing</span>
            </button>

            <button
              id="btn-landing-crisis"
              onClick={onOpenCrisis}
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-rose-300 border border-rose-500/30 text-sm font-medium transition cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>24/7 Lifelines</span>
            </button>
          </div>
        </div>

        {/* Specialized PFA Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Trauma-Informed Debriefing</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Step-by-step Psychological First Aid protocol to process acute shift fatigue, moral dilemmas, and grief without toxic positivity.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Strict Isolation & Field PII Redaction</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Automatic scrubbing of patient and victim identifiers. User data is isolated strictly to <code className="text-emerald-400">/users/{'{userId}'}</code> with zero cross-user access.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wind className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Somatic Vagal Regulation</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Tactical box breathing and physiological sigh pacers to downregulate sympathetic arousal and nervous system overload before recording.
            </p>
          </div>
        </div>

        {/* Security & Verification Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Encrypted cloud persistence with strict owner-bound Firestore security rules.</span>
          </div>
          <button
            onClick={onOpenThreatModel}
            className="text-xs text-neutral-300 hover:text-white underline underline-offset-2 cursor-pointer"
          >
            Review Security & Threat Model
          </button>
        </div>
      </div>
    </div>
  );
};

