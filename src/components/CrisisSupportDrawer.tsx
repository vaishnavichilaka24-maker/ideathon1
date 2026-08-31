import React from 'react';
import { Phone, MessageSquare, ExternalLink, X, ShieldAlert, HeartHandshake, Globe } from 'lucide-react';
import { CrisisHotline } from '../types';

interface CrisisSupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CRISIS_RESOURCES: CrisisHotline[] = [
  {
    id: 'frontline-help',
    name: 'Frontline Workers & First Responder Support Helpline',
    phone: '1-800-273-8255 (Press 1)',
    text: 'Text "FRONTLINE" to 741741',
    description: 'Confidential, 24/7 peer support specifically for doctors, nurses, EMTs, disaster responders, and social workers.',
    badge: 'Frontline Dedicated',
    country: 'US / International Access',
  },
  {
    id: 'samhsa-disaster',
    name: 'Disaster Distress Helpline (SAMHSA)',
    phone: '1-800-985-5990',
    text: 'Text "TalkWithUs" to 66746',
    description: 'Immediate crisis counseling for people experiencing emotional distress related to natural or human-caused disasters.',
    badge: 'Disaster & Aid',
    country: 'United States',
  },
  {
    id: '988-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    text: 'Text 988',
    description: 'Free, confidential support for people in suicidal crisis or emotional distress 24/7/365.',
    badge: 'Immediate Crisis',
    country: 'United States & Canada',
  },
  {
    id: 'crisis-text-line',
    name: 'Crisis Text Line',
    text: 'Text "HOME" to 741741',
    web: 'https://www.crisistextline.org',
    description: 'Connect with a crisis counselor 24/7 over SMS for compassion fatigue, anxiety, and moral distress.',
    badge: 'SMS / Text Support',
    country: 'US, UK, Canada, Ireland',
  },
  {
    id: 'iasp-global',
    name: 'International Association for Suicide Prevention (IASP)',
    web: 'https://www.iasp.info/resources/Crisis_Centres/',
    description: 'Global directory of crisis centers and helplines in over 50+ countries worldwide.',
    badge: 'Worldwide Directory',
    country: 'Global / International',
  },
];

export const CrisisSupportDrawer: React.FC<CrisisSupportDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-crisis-support"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-neutral-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-close-crisis-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          title="Close crisis directory"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex-shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-semibold mb-1">
              <HeartHandshake className="w-3 h-3" />
              Direct Human Care Lifelines
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Frontline Caregiver & Crisis Lifelines
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              If you or a colleague are experiencing severe secondary trauma, acute dissociation, or suicidal thoughts, please reach out to immediate human professionals. You do not have to carry this alone.
            </p>
          </div>
        </div>

        {/* Lifeline Cards */}
        <div className="space-y-3">
          {CRISIS_RESOURCES.map((resource) => (
            <div
              key={resource.id}
              className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {resource.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] text-neutral-300 font-mono">
                    {resource.country}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-300 font-medium">
                    {resource.badge}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {resource.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {resource.phone && (
                  <a
                    href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {resource.phone}</span>
                  </a>
                )}
                {resource.text && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>{resource.text}</span>
                  </div>
                )}
                {resource.web && (
                  <a
                    href={resource.web}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Directory Link</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between gap-3">
          <span>This application provides Psychological First Aid & reflective de-escalation tools and is not a replacement for formal psychiatric emergency services.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
          >
            I am safe / Return
          </button>
        </div>
      </div>
    </div>
  );
};
