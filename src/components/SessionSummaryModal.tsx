import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { JournalSession } from '../types';
import { HeartHandshake, X, Copy, Check, FileDown, ShieldCheck, Activity } from 'lucide-react';

interface SessionSummaryModalProps {
  session: JournalSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session) return null;

  const handleCopy = () => {
    if (session.summary) {
      navigator.clipboard.writeText(session.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportMarkdown = () => {
    if (!session.summary) return;
    const content = `# PFA Clinical Debrief Report - ${session.title}\n\n**Date**: ${new Date(
      session.createdAt
    ).toLocaleDateString()}\n**Role**: ${session.role || 'Frontline Caregiver'}\n**Shift Severity**: ${
      session.severity || 'Moderate Stress'
    }\n**Stress Rating**: ${session.stressLevel || 5}/10\n\n---\n\n${session.summary}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pfa-debrief-${session.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="session-summary-modal"
        className="w-full max-w-3xl max-h-[88vh] bg-neutral-900 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Psychological First Aid (PFA) Synthesis Report
              </h2>
              <p className="text-xs text-neutral-400">
                Shift Debrief: {session.title} &bull; Stress Load: {session.stressLevel ?? 6}/10
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

        {/* Clinical Triage Indicators Strip */}
        <div className="px-6 py-2.5 bg-neutral-950/50 border-b border-neutral-800/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 font-semibold border border-teal-500/20">
            Role: {session.role || 'Healthcare'}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-medium">
            Intensity: {session.severity || 'Moderate Stress'}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-semibold">
            Stress Level: {session.stressLevel ?? 6}/10
          </span>
          {session.somaticAreas && session.somaticAreas.length > 0 && (
            <span className="text-neutral-400 text-[11px]">
              Tension: {session.somaticAreas.join(', ')}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-200">
          {session.summary ? (
            <div className="prose prose-invert prose-sm max-w-none space-y-3">
              <ReactMarkdown>{session.summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400 space-y-2">
              <HeartHandshake className="w-8 h-8 mx-auto text-neutral-600" />
              <p>No PFA synthesis generated yet.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted in User-Isolated Firestore</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              disabled={!session.summary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition disabled:opacity-40 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>

            <button
              id="btn-copy-summary"
              onClick={handleCopy}
              disabled={!session.summary}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-neutral-950 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Synthesis'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
