import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client } from '@/types';
import { BrainCircuit, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export const ClientAISummaryPanel: React.FC<{ client: Client }> = ({ client }) => {
  const { caseNotes, incidents, addAuditLog, addNotification } = useManagementStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsGenerating(true);
    setSummary(null);
    setStatus(null);
    setError(null);

    const clientNotes = caseNotes.filter(n => n.clientId === client.id).slice(0, 5);
    const clientIncidents = incidents.filter(i => i.clientId === client.id).slice(0, 5);

    try {
      // Simulate calling the Cloud Function endpoint
      const response = await fetch('/api/gemini/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          caseNotes: clientNotes,
          incidents: clientIncidents
        }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');
      
      const data = await response.json();
      setSummary(data.summary);
      setStatus('pending');
      
      addAuditLog('AI_SUMMARY_GENERATED', 'CLIENT_RECORD', client.id, `Generated AI Summary for ${client.name}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate AI Summary. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    setStatus('approved');
    addAuditLog('AI_SUMMARY_APPROVED', 'CLIENT_RECORD', client.id, `Practitioner approved AI summary for ${client.name}`);
    addNotification({ title: 'Summary Approved', message: 'The AI clinical summary is now official.', type: 'system', severity: 'low' });
  };

  const handleDiscard = () => {
    setSummary(null);
    setStatus(null);
    addAuditLog('AI_SUMMARY_DISCARDED', 'CLIENT_RECORD', client.id, `Practitioner discarded AI summary for ${client.name}`);
  };

  if (!summary && !isGenerating && !error) {
    return (
      <button
        onClick={generateSummary}
        className="mt-4 w-full p-4 bg-indigo-950/30 hover:bg-indigo-950/50 rounded-xl border border-indigo-500/30 border-dashed flex items-center justify-center gap-2 text-indigo-300 transition-colors font-bold text-xs"
      >
        <BrainCircuit className="w-4 h-4" />
        Generate AI Clinical Summary (Firebase Cloud Function)
      </button>
    );
  }

  return (
    <div className={`mt-4 p-4 rounded-xl border space-y-3 text-xs ${
      status === 'approved' 
        ? 'bg-slate-900 border-teal-500/40' 
        : 'bg-indigo-950/40 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-bold ${status === 'approved' ? 'text-teal-400' : 'text-indigo-300'}`}>
          <BrainCircuit className="w-4 h-4" />
          {status === 'approved' ? 'Official Clinical Summary (AI-Assisted)' : 'AI-Generated Clinical Overview'}
        </div>
        
        {status === 'pending' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 text-[10px] font-bold border border-indigo-500/30">
            <AlertCircle className="w-3 h-3" />
            Requires Practitioner Review
          </div>
        )}
        {status === 'approved' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[10px] font-bold border border-teal-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Practitioner Approved
          </div>
        )}
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-6 text-indigo-300 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-bold">Synthesizing Client Data...</span>
        </div>
      ) : error ? (
        <div className="text-rose-400 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={generateSummary} className="ml-auto px-3 py-1 bg-rose-500/20 rounded">Retry</button>
        </div>
      ) : (
        <>
          <div className="text-slate-300 leading-relaxed text-[12px] space-y-2 font-sans markdown-body">
            <Markdown>{summary}</Markdown>
          </div>
          
          {status === 'pending' && (
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-indigo-500/30 mt-3">
              <button 
                onClick={handleDiscard}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Discard
              </button>
              <button 
                onClick={handleApprove}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve as Official
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
