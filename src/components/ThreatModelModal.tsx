import React from 'react';
import { ShieldCheck, X, Lock, AlertTriangle, Cpu, Database, Network } from 'lucide-react';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThreatRow {
  zone: string;
  icon: React.ReactNode;
  risk: string;
  countermeasure: string;
  owaspRef: string;
}

const THREAT_MATRIX: ThreatRow[] = [
  {
    zone: '1. Input Surfaces',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    risk: 'Prompt injection, malformed user payloads, oversized transcript spamming.',
    countermeasure:
      'Top-level request body parsing with 10MB limit, null-safe payload destructuring, strict input trimming and empty-state rejection.',
    owaspRef: 'OWASP Top 10 A03 / LLM02',
  },
  {
    zone: '2. Planning & Reasoning',
    icon: <Cpu className="w-4 h-4 text-blue-400" />,
    risk: 'System prompt override or instruction hijacking embedded within journal entries.',
    countermeasure:
      'Clear separation of system instructions from user transcripts; treating user reflections strictly as conversational context and data to analyze.',
    owaspRef: 'OWASP LLM01',
  },
  {
    zone: '3. Tool / Model Execution',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    risk: 'Gemini API key leakage, model downtime, or rate-limit exhaustion.',
    countermeasure:
      'Server-side Express proxy (keys never exposed to browser), dynamic secret resolution, 4-tier model fallback ladder (gemini-3.6-flash -> 3.1-flash-lite -> flash-latest -> 3.7-flash).',
    owaspRef: 'OWASP LLM05 / A01',
  },
  {
    zone: '4. Memory & State',
    icon: <Database className="w-4 h-4 text-purple-400" />,
    risk: 'Cross-tenant data exposure, unauthorized read/write access to another user’s reflections.',
    countermeasure:
      'Strict Firestore subcollection path isolation (/users/{userId}/...) protected by deployed Security Rules enforcing request.auth.uid == userId; recursive undefined-stripping prior to DB writes.',
    owaspRef: 'OWASP A01 Broken Access Control',
  },
  {
    zone: '5. Inter-System Communication',
    icon: <Network className="w-4 h-4 text-cyan-400" />,
    risk: 'Credential sniffing, unauthenticated requests, SSRF.',
    countermeasure:
      'Federated Google OAuth via Firebase Auth (zero plain password management), HTTPS transport on Cloud Run with container ingress routing.',
    owaspRef: 'OWASP A07 / LLM06',
  },
];

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        id="threat-model-modal"
        className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Agentic Threat Model & Security Matrix
              </h2>
              <p className="text-xs text-neutral-400">
                5 Threat Zones mapped to production countermeasures & OWASP standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                  <th className="py-3 px-4 font-semibold">Threat Zone</th>
                  <th className="py-3 px-4 font-semibold">Specific Threat / Vector</th>
                  <th className="py-3 px-4 font-semibold">Implemented Countermeasure</th>
                  <th className="py-3 px-4 font-semibold">Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {THREAT_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4 font-medium text-neutral-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <span>{row.zone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300 max-w-[200px]">{row.risk}</td>
                    <td className="py-3 px-4 text-neutral-400 max-w-[280px]">
                      {row.countermeasure}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-mono text-[11px] whitespace-nowrap">
                      {row.owaspRef}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Firestore Security Rules Block */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deployed Firestore Security Rules (firestore.rules)</span>
            </div>
            <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Zero Hardcoded Secrets &bull; Owner-Bound Firestore Isolation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
