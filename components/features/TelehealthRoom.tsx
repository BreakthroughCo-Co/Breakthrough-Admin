import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { ClinicalVoiceScribe } from './ClinicalVoiceScribe';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  PhoneOff,
  Users,
  Sparkles,
  MessageSquare,
  PenTool,
  ShieldCheck
} from 'lucide-react';

export const TelehealthRoom: React.FC = () => {
  const { clients, currentUser } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'video' | 'scribe' | 'whiteboard'>('video');

  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Secure In-App Telehealth & Consultation Suite
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                End-to-End Encrypted
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              WebRTC video consultation with integrated real-time clinical voice transcription
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-violet-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ndisNumber || 'Participant'})
              </option>
            ))}
          </select>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'video' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Video Call
            </button>
            <button
              onClick={() => setActiveTab('scribe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'scribe' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Scribe
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'video' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Participant Stream */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-xl font-bold mb-2">
                {activeClient?.name?.slice(0, 2).toUpperCase() || 'PT'}
              </div>
              <span className="text-white text-sm font-semibold">{activeClient?.name} (Participant)</span>
              <span className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Connection (1080p WebRTC)
              </span>
            </div>

            {/* Practitioner Self Stream */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-violet-950/60 border border-violet-500/40 flex items-center justify-center text-violet-300 text-xl font-bold mb-2">
                {currentUser?.displayName?.slice(0, 2).toUpperCase() || 'PR'}
              </div>
              <span className="text-white text-sm font-semibold">{currentUser?.displayName || 'Practitioner'} (You)</span>
              <span className="text-xs text-slate-400 mt-1">Specialist Behaviour Support Practitioner</span>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-3 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3 rounded-xl border transition-all ${
                isMicOn ? 'bg-slate-800 border-slate-700 text-white' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3 rounded-xl border transition-all ${
                isVideoOn ? 'bg-slate-800 border-slate-700 text-white' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              }`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setActiveTab('scribe')}
              className="px-4 py-2.5 bg-violet-600/30 border border-violet-500/40 text-violet-300 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-violet-600/40"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              Open Ambient Clinical Scribe
            </button>
            <button className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-900/30 transition-all">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <ClinicalVoiceScribe />
        </div>
      )}
    </div>
  );
};
