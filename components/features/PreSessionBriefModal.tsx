'use client';

import React, { useState } from 'react';
import type { Client, CaseNote, ABCLog, Incident, BSPDocument } from '@/types';
import { Sparkles, X, BrainCircuit, RefreshCw } from 'lucide-react';

interface Props {
  client: Client;
  recentNotes: CaseNote[];
  recentABCLogs: ABCLog[];
  recentIncidents: Incident[];
  bspDocuments: BSPDocument[];
  onClose: () => void;
}

export const PreSessionBriefModal: React.FC<Props> = ({
  client,
  recentNotes,
  recentABCLogs,
  recentIncidents,
  bspDocuments,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);

  const generateBrief = async () => {
    setIsLoading(true);
    try {
      const openIncidents = recentIncidents.filter(
        i => (i as any).status === 'Open' || (i as any).status === 'Investigating'
      );
      const activeBSP = bspDocuments.find(
        b => b.clientId === client.id && (b.status === 'Active' || (b.status as any) === 'Current')
      );
      const prompt = `You are a senior NDIS Behaviour Support Practitioner. Generate a concise pre-session clinical briefing.

Participant: ${client.name} (NDIS: ${client.ndisNumber})
Risk Level: ${client.riskLevel} | Disability: ${client.primaryDisability}
Active Goals: ${(client.goals || []).filter(g => g.status === 'In Progress').map(g => `${g.title} (${g.progressPercent || 0}%)`).join(', ') || 'None'}

Recent Sessions (last 3):
${recentNotes.slice(0, 3).map(n => `[${n.date}] ${n.subjective?.substring(0, 100)} | Assessment: ${n.assessment?.substring(0, 80)}`).join('\n') || 'None'}

Recent ABC Events (last 5):
${recentABCLogs.slice(0, 5).map((a: any) => `[${a.timestamp?.slice(0, 10)}] ${a.antecedent} → ${a.behavior} (Function: ${a.perceivedFunction})`).join('\n') || 'None'}

Open Incidents: ${openIncidents.length > 0 ? openIncidents.map((i: any) => `${i.title || i.description} (${i.severity})`).join(', ') : 'None'}
Active BSP: ${activeBSP ? `${activeBSP.summary?.substring(0, 100)} — Review: ${activeBSP.reviewDate}` : 'No active BSP on file'}

Provide a structured briefing with:
1. Current presentation indicators to watch
2. Key behaviour patterns this session
3. Open risks/concerns
4. Top 3 session focus areas
5. Proactive strategies to deploy

Be concise and clinically appropriate. Maximum 400 words.`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are a Senior NDIS Behaviour Support Practitioner. Provide a clear, evidence-based pre-session brief.',
        }),
      });
      const data = await res.json();
      setBrief(data.text || 'Unable to generate brief. Please check Gemini API configuration.');
    } catch {
      setBrief('AI brief generation failed. Please ensure the Gemini API is configured and online.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Pre-Session Clinical Brief</h2>
              <p className="text-xs text-slate-400">
                {client.name} · {client.ndisNumber} · Risk:{' '}
                <span
                  className={
                    client.riskLevel === 'Critical' || client.riskLevel === 'High'
                      ? 'text-rose-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {client.riskLevel}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-4 gap-3 shrink-0">
          {[
            ['Recent Notes', recentNotes.length, 'text-white'],
            ['ABC Events', recentABCLogs.length, 'text-amber-400'],
            [
              'Open Incidents',
              recentIncidents.filter(i => (i as any).status === 'Open').length,
              recentIncidents.filter(i => (i as any).status === 'Open').length > 0
                ? 'text-rose-400'
                : 'text-emerald-400',
            ],
            [
              'Active Goals',
              (client.goals || []).filter(g => g.status === 'In Progress').length,
              'text-teal-400',
            ],
          ].map(([label, val, color]) => (
            <div key={label as string} className="text-center">
              <div className={`text-lg font-black ${color}`}>{val}</div>
              <div className="text-[10px] text-slate-500 font-bold">{label}</div>
            </div>
          ))}
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {!brief && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <Sparkles className="w-10 h-10 text-teal-400 mx-auto opacity-60" />
              <div>
                <p className="text-sm font-bold text-slate-200">Generate AI pre-session clinical brief</p>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesises notes, ABC patterns, incidents & goals into a 2-minute read.
                </p>
              </div>
              <button
                onClick={generateBrief}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg"
              >
                Generate Brief
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-sm text-slate-400">Analysing clinical records...</p>
            </div>
          )}
          {brief && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  AI Clinical Brief
                </span>
                <button
                  onClick={generateBrief}
                  className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4">
                <pre className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {brief}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Close & Begin Session
          </button>
        </div>
      </div>
    </div>
  );
};
