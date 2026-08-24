'use client';

import React, { useState, useRef } from 'react';
import { KeepNoteItem, CATEGORY_CONFIG } from './GoogleKeepModule';
import { Client } from '@/types';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building,
  Layers,
  Award,
  Loader2
} from 'lucide-react';

interface NDISKeepPDFExportModalProps {
  notes: KeepNoteItem[];
  clients: Client[];
  onClose: () => void;
  onUpdateNoteSummary?: (noteId: string, summary: string) => void;
}

export const NDISKeepPDFExportModal: React.FC<NDISKeepPDFExportModalProps> = ({
  notes,
  clients,
  onClose,
  onUpdateNoteSummary
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingAllSummaries, setIsGeneratingAllSummaries] = useState(false);
  const [localSummaries, setLocalSummaries] = useState<Record<string, string>>({});
  const printAreaRef = useRef<HTMLDivElement>(null);

  const filingDate = new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const filingId = `NDIS-FILING-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleBatchGenerateSummaries = async () => {
    setIsGeneratingAllSummaries(true);
    try {
      for (const note of notes) {
        if (!note.executiveSummary && !localSummaries[note.id]) {
          const client = clients.find((c) => c.id === note.clientId);
          const prompt = `You are a Senior NDIS Positive Behaviour Support Specialist. Create a concise, professional 3-4 bullet-point executive summary for client file review and formal NDIS compliance filing based on the following field note:
Title: ${note.title}
Category: ${note.category}
Participant: ${client ? `${client.name} (NDIS: ${client.ndisNumber})` : note.clientName || 'General Participant'}
Observations: ${note.text}
Checklist items: ${note.checklist?.map((c) => `${c.completed ? '[DONE]' : '[PENDING]'} ${c.text}`).join('; ')}

Format strictly as:
• Key Clinical Finding: <one sentence>
• Intervention/Action Taken: <one sentence>
• Recommended Review/Next Step: <one sentence>`;

          const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model: 'gemini-3.7-flash' })
          });

          const data = await response.json();
          if (data.text) {
            setLocalSummaries((prev) => ({ ...prev, [note.id]: data.text }));
            if (onUpdateNoteSummary) {
              onUpdateNoteSummary(note.id, data.text);
            }
          }
        }
      }
    } catch (err) {
      console.error('Batch summary generation error:', err);
    } finally {
      setIsGeneratingAllSummaries(false);
    }
  };

  const handleCopyText = () => {
    const textContent = notes
      .map((note, index) => {
        const client = clients.find((c) => c.id === note.clientId);
        const summary = note.executiveSummary || localSummaries[note.id];
        const checklist =
          note.checklist && note.checklist.length > 0
            ? '\nAction Verification Checklist:\n' +
              note.checklist.map((c) => `  [${c.completed ? 'COMPLETED' : 'PENDING'}] ${c.text}`).join('\n')
            : '';
        const summaryText = summary ? `\n\nEXECUTIVE CLINICAL SUMMARY:\n${summary}` : '';

        return `========================================================
SECTION ${index + 1}: ${note.title.toUpperCase()}
Domain: ${note.category} | Date: ${new Date(note.createdAt).toLocaleDateString('en-AU')}
Participant: ${client ? `${client.name} (NDIS: ${client.ndisNumber})` : note.clientName || 'General'}
Labels: ${note.labels.join(', ') || 'None'}
--------------------------------------------------------
CLINICAL OBSERVATIONS & RECORDED CONTENT:
${note.text || 'No narrative text.'}
${summaryText}
${checklist}
`;
      })
      .join('\n\n');

    const fullDocument = `========================================================
FORMAL NDIS COMPLIANCE & CLINICAL PROGRESS FILING
Filing Ref: ${filingId} | Date: ${filingDate}
Provider: Breakthrough Behaviour Support & Care Services (ID: 4050019284)
Statutory Standard: NDIS Quality and Safeguards Commission Rules 2018
========================================================

${textContent}

========================================================
STATUTORY PRACTITIONER DECLARATION
I certify that the above clinical observations, compliance actions, and risk management entries reflect true and authentic field records compiled during authorized service delivery.

Senior Behaviour Support Practitioner: Marcus Vance (NDIS Reg: PR-94021)
Designation: Senior PBS Practitioner & Clinical Lead
Status: Verified & Submitted for Formal Care File Filing
========================================================`;

    navigator.clipboard.writeText(fullDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  NDIS Compliance & Progress Filing Document
                </h2>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  {notes.length} Note{notes.length === 1 ? '' : 's'} Selected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official export format aligned with NDIS Quality & Safeguards Commission compliance standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchGenerateSummaries}
              disabled={isGeneratingAllSummaries}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              title="Generate AI Executive Summaries for all notes"
            >
              {isGeneratingAllSummaries ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isGeneratingAllSummaries ? 'Synthesizing AI...' : 'Auto-Summarize All'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Copy Full Document Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
              title="Open Browser Print to Save as Formatted PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/50 space-y-6">
          {/* Paper Document Container */}
          <div
            ref={printAreaRef}
            id="ndis-printable-document"
            className="bg-white text-slate-900 rounded-xl p-8 sm:p-12 shadow-2xl space-y-8 font-sans max-w-3xl mx-auto border border-slate-200"
          >
            {/* Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-6 h-6 text-teal-700" />
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                      BREAKTHROUGH CARE SERVICES
                    </h1>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Positive Behaviour Support & Allied Health Clinical Governance
                  </p>
                  <p className="text-[11px] text-slate-500">
                    NDIS Registered Provider No: <strong>4050019284</strong> | Quality & Safeguards Verified
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block bg-teal-900 text-white font-bold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase">
                    Official Care Filing
                  </span>
                  <p className="text-[11px] font-mono text-slate-600 font-semibold">Ref: {filingId}</p>
                  <p className="text-[11px] text-slate-500">Date: {filingDate}</p>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Document Type:</span>{' '}
                  <strong className="text-slate-900">Clinical Observations & Compliance Progress Filing</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Source:</span>{' '}
                  <span className="font-semibold text-slate-800">Google Keep Clinical Field Ledger</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Author Lead:</span>{' '}
                  <span className="font-semibold text-slate-800">Marcus Vance (Senior Practitioner)</span>
                </div>
              </div>
            </div>

            {/* Document Body: Render Selected Notes */}
            <div className="space-y-8">
              {notes.map((note, index) => {
                const client = clients.find((c) => c.id === note.clientId);
                const summary = note.executiveSummary || localSummaries[note.id];
                const categoryCfg = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.Clinical;

                return (
                  <div
                    key={note.id}
                    className="border border-slate-300 rounded-xl p-5 bg-white space-y-4 shadow-sm break-inside-avoid"
                  >
                    {/* Note Item Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                            SECTION {index + 1}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 border border-teal-300 bg-teal-50 px-2 py-0.5 rounded">
                            {note.category}
                          </span>
                          {note.isPinned && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                              Priority Pinned
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-950 pt-1">{note.title}</h3>
                      </div>

                      <div className="text-right text-[11px] text-slate-500">
                        <div>Logged: {new Date(note.createdAt).toLocaleDateString('en-AU')}</div>
                        <div>Updated: {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>

                    {/* Participant Details Badge */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-slate-500">Participant:</span>{' '}
                        <strong className="text-slate-900">{client?.name || note.clientName || 'General Participant'}</strong>
                        {client?.ndisNumber && (
                          <span className="font-mono text-slate-600 text-[11px] ml-1.5">
                            (NDIS: {client.ndisNumber})
                          </span>
                        )}
                      </div>
                      {client?.primaryDisability && (
                        <div className="text-[11px] text-slate-600">
                          <span className="text-slate-400">Diagnosis:</span> {client.primaryDisability}
                        </div>
                      )}
                      {note.labels?.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px]">
                          {note.labels.map((l) => (
                            <span key={l} className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-medium">
                              #{l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Executive AI Summary (if present or generated) */}
                    {summary && (
                      <div className="bg-teal-50/80 border-l-4 border-teal-600 p-3.5 rounded-r-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                          <span>Executive Clinical Synthesis for Care Review</span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {summary}
                        </p>
                      </div>
                    )}

                    {/* Observation Body */}
                    {note.text && (
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Field Observation Narrative
                        </h4>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-serif">
                          {note.text}
                        </p>
                      </div>
                    )}

                    {/* Action Verification Checklist */}
                    {note.checklist && note.checklist.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Action Verification Checklist ({note.checklist.filter((c) => c.completed).length}/{note.checklist.length} Completed)
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                                <th className="py-1.5 px-3 w-10">Status</th>
                                <th className="py-1.5 px-3">Compliance / Clinical Action Item</th>
                                <th className="py-1.5 px-3 text-right w-28">Verification</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {note.checklist.map((c) => (
                                <tr key={c.id} className={c.completed ? 'bg-emerald-50/30' : 'bg-white'}>
                                  <td className="py-1.5 px-3 text-center">
                                    {c.completed ? (
                                      <span className="inline-block text-emerald-700 font-bold text-sm">✔</span>
                                    ) : (
                                      <span className="inline-block text-slate-400 font-bold text-sm">◻</span>
                                    )}
                                  </td>
                                  <td className={`py-1.5 px-3 ${c.completed ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                                    {c.text}
                                  </td>
                                  <td className="py-1.5 px-3 text-right text-[10px] font-mono text-slate-500">
                                    {c.completed ? 'Verified Complete' : 'Pending Review'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Statutory Compliance Certification & Signature Block */}
            <div className="border-t-2 border-slate-900 pt-6 space-y-4 break-inside-avoid">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>NDIS Statutory Declaration & Clinical Sign-Off</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  I hereby declare that the clinical observations, behaviour support protocols, and compliance checklists contained in this document represent true, authentic, and contemporaneous records compiled during authorized service delivery in adherence with the <em>NDIS Practice Standards (Quality and Safeguards Commission) Rules 2018</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
                <div className="border-b border-slate-400 pb-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Practitioner Signature</div>
                  <div className="font-serif italic text-base text-slate-900 pt-1">Marcus Vance, M.Ed., BCBA</div>
                  <div className="text-[11px] text-slate-600 font-medium">Marcus Vance (Senior Behaviour Support Lead)</div>
                </div>

                <div className="border-b border-slate-400 pb-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Verification Date & Registration</div>
                  <div className="font-mono text-sm text-slate-900 pt-1">{filingDate}</div>
                  <div className="text-[11px] text-slate-600">NDIS Practitioner ID: PR-94021-VIC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
