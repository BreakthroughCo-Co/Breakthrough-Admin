import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { AudioTranscriptionVault, AudioVaultSession } from '../../lib/audioTranscriptionVault';
import {
  Mic,
  Lock,
  Play,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Volume2
} from 'lucide-react';

export const AudioTranscriptionVaultModule: React.FC = () => {
  const { clients, practitioners, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };
  const selectedPrac = practitioners[0] || { id: 'p-1', name: 'Practitioner' };

  const session: AudioVaultSession = AudioTranscriptionVault.processAudioSession(
    selectedClient as any,
    selectedPrac as any
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Clinical Session Audio & Multi-Speaker Transcription Vault
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                AES-256 Encrypted
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Encrypted session recordings with speaker diarization and automated SOAP extraction
            </p>
          </div>
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Multi-Speaker Diarized Transcript
          </span>
          <div className="space-y-2.5">
            {session.segments.map((seg, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-300 font-mono text-[10px]">{seg.speaker}</span>
                  <span className="text-slate-500 text-[10px]">{seg.timestamp}</span>
                </div>
                <p className="text-slate-300">&ldquo;{seg.transcriptText}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Extracted Clinical SOAP Note
          </span>
          <div className="space-y-2 text-xs text-slate-300">
            <div>
              <strong className="text-slate-400 block">Subjective:</strong>
              {session.extractedClinicalSOAP.subjective}
            </div>
            <div>
              <strong className="text-slate-400 block">Objective:</strong>
              {session.extractedClinicalSOAP.objective}
            </div>
            <div>
              <strong className="text-slate-400 block">Assessment:</strong>
              {session.extractedClinicalSOAP.assessment}
            </div>
            <div>
              <strong className="text-slate-400 block">Plan:</strong>
              {session.extractedClinicalSOAP.plan}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
