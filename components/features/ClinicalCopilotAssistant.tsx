import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { ClinicalCopilotEngine, CopilotSuggestion } from '../../lib/clinicalCopilotEngine';
import {
  Sparkles,
  BrainCircuit,
  MessageSquare,
  Copy,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Zap
} from 'lucide-react';

export const ClinicalCopilotAssistant: React.FC = () => {
  const { clients, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [draftContent, setDraftContent] = useState(
    'Participant exhibited verbal agitation and hit table when presented with numeracy worksheet. Calmed after 10 mins.'
  );
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };

  const suggestions: CopilotSuggestion[] = ClinicalCopilotEngine.generateSuggestions(
    selectedClient as any,
    draftContent
  );

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    addNotification({
      title: 'Copilot Suggestion Copied',
      message: 'Clinical text copied to clipboard.',
      type: 'clinical',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Autonomous Clinical Copilot & AI Smart Prompts
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                Live CDI Engine
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Real-time SOAP note structuring, functional hypotheses generation, and de-escalation prompt synthesis
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

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">Draft Clinical Observations</label>
        <textarea
          rows={3}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder="Type rough session observations..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          AI Copilot Clinical Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {item.category}
                  </span>
                  <button
                    onClick={() => handleCopy(item.suggestedText, idx)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedIdx === idx ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === idx ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <h4 className="text-xs font-bold text-white mt-1">{item.title}</h4>
                <p className="text-xs text-slate-300 italic mt-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  &ldquo;{item.suggestedText}&rdquo;
                </p>
              </div>

              <span className="text-[10px] text-slate-500 block">
                <strong>Rationale:</strong> {item.clinicalRationale}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
