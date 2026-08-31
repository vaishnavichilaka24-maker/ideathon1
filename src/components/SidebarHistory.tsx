import React, { useState } from 'react';
import { JournalSession, ReflectionMode, IncidentSeverity } from '../types';
import {
  HeartHandshake,
  Search,
  Plus,
  Trash2,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  AlertTriangle,
  Stethoscope,
  Shield,
} from 'lucide-react';

interface SidebarHistoryProps {
  sessions: JournalSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: (mode?: ReflectionMode) => void;
  onDeleteSession: (sessionId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const SEVERITY_BADGES: Record<IncidentSeverity, { label: string; bg: string; text: string }> = {
  routine: { label: 'Routine', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'moderate-stress': { label: 'High Stress', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'critical-incident': { label: 'Critical Incident', bg: 'bg-rose-500/10', text: 'text-rose-400' },
  'moral-injury': { label: 'Moral Distress', bg: 'bg-purple-500/10', text: 'text-purple-400' },
};

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute average stress level
  const totalStress = sessions.reduce((acc, s) => acc + (s.stressLevel || 5), 0);
  const avgStress = sessions.length > 0 ? (totalStress / sessions.length).toFixed(1) : '0';

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.previewText && s.previewText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.summary && s.summary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || s.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-20 md:hidden"
        />
      )}

      <aside
        id="sidebar-journal-history"
        className={`fixed md:static inset-y-0 left-0 z-20 w-80 bg-neutral-900/95 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 top-[61px] h-[calc(100vh-61px)]' : '-translate-x-full'
        } md:h-[calc(100vh-61px)]`}
      >
        {/* Top Header & Triage Summary */}
        <div className="p-4 border-b border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-neutral-100">Shift Debrief Archive</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-teal-300 font-mono">
              {sessions.length} debriefs
            </span>
          </div>

          {/* Cumulative Caregiver Stress Monitor Widget */}
          <div className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-neutral-400 text-[11px]">Cumulative Stress:</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-teal-300 text-sm font-mono">{avgStress}</span>
              <span className="text-neutral-500 text-[10px]">/10 avg</span>
            </div>
          </div>

          <button
            id="btn-sidebar-new-reflection"
            onClick={() => {
              onNewSession();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Shift Debrief</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="input-search-sessions"
              type="text"
              placeholder="Search shifts, trauma keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-teal-400/50"
            />
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('critical-incident')}
              className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                severityFilter === 'critical-incident'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('moral-injury')}
              className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                severityFilter === 'moral-injury'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Moral Distress
            </button>
            <button
              onClick={() => setSeverityFilter('moderate-stress')}
              className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                severityFilter === 'moderate-stress'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              High Stress
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto stroke-1 opacity-50 text-teal-400" />
              <p className="text-xs">
                {searchTerm ? 'No matching debriefs found.' : 'No shift debriefs recorded yet.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => onNewSession()}
                  className="text-xs text-teal-400 hover:underline font-semibold cursor-pointer"
                >
                  Start your first PFA debrief
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isDeleting = deletingId === session.id;
              const severityBadge = SEVERITY_BADGES[session.severity || 'moderate-stress'];

              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 rounded-2xl border text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800/90 border-teal-500/40 text-white shadow-xs'
                      : 'bg-neutral-900/40 border-neutral-800/60 hover:bg-neutral-800/50 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-xs font-bold truncate text-neutral-100">
                        {session.title || 'Caregiver Shift Debrief'}
                      </h3>
                    </div>

                    {/* Delete Session Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDeleting) {
                          onDeleteSession(session.id);
                          setDeletingId(null);
                        } else {
                          setDeletingId(session.id);
                          setTimeout(() => setDeletingId(null), 3500);
                        }
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer ${
                        isDeleting ? 'opacity-100 bg-rose-500/20 text-rose-400' : ''
                      }`}
                      title={isDeleting ? 'Click again to confirm delete' : 'Delete debrief'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preview Snippet */}
                  {session.previewText ? (
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
                      {session.previewText}
                    </p>
                  ) : null}

                  {/* Badges & Metrics Row */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-800/40 text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {formatDate(session.updatedAt || session.createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-md ${severityBadge.bg} ${severityBadge.text} text-[9px] font-semibold`}>
                        {severityBadge.label}
                      </span>
                      {session.summary && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30 text-[9px] font-semibold">
                          PFA Report
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 text-[10px] text-neutral-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-400">
            <Shield className="w-3 h-3" /> Firestore Encrypted
          </span>
          <span className="font-mono text-neutral-500">Gemini 3.6 Flash</span>
        </div>
      </aside>
    </>
  );
};
