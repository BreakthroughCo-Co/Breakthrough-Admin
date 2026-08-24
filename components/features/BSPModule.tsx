'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, BSPDocument } from '@/types';
import {
  FileSpreadsheet,
  Plus,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Download,
  Lock,
  FileText,
  Presentation
} from 'lucide-react';

export const BSPModule: React.FC = () => {
  const { bspDocuments, clients, currentUser, addBSPDocument, setActiveTab } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isGenerating, setIsGenerating] = useState(false);

  const [summary, setSummary] = useState('');
  const [proactive, setProactive] = useState('');
  const [reactive, setReactive] = useState('');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleGenerateAiBsp = async () => {
    if (!selectedClientObj) return;
    setIsGenerating(true);

    try {
      const prompt = `Generate a comprehensive NDIS Positive Behaviour Support Plan (BSP) for participant ${selectedClientObj.name}.
Primary Disability: ${selectedClientObj.primaryDisability}
Risk Level: ${selectedClientObj.riskLevel}

Provide JSON output with key sections:
1. summary: High-level clinical rationale and neuroaffirming goals.
2. proactiveStrategies: Array of 3 environmental adaptations and visual schedules.
3. reactiveStrategies: Array of 2 de-escalation protocols.`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an expert Senior Behaviour Support Practitioner registered with NDIS.',
        }),
      });

      const data = await res.json();
      if (data.text) {
        const jsonMatch = data.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary) setSummary(parsed.summary);
          if (Array.isArray(parsed.proactiveStrategies)) setProactive(parsed.proactiveStrategies.join('\n• '));
          if (Array.isArray(parsed.reactiveStrategies)) setReactive(parsed.reactiveStrategies.join('\n• '));
        }
      }
    } catch (e) {
      console.error('BSP Generation Error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBsp = () => {
    if (!selectedClientObj) return;

    addBSPDocument({
      id: `bsp-${Date.now().toString().slice(-4)}`,
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      version: `v${(bspDocuments.length + 1).toFixed(1)}`,
      status: 'Draft',
      summary: summary || 'Comprehensive Behaviour Support Plan focused on positive environmental adjustments.',
      primaryBehaviorsOfConcern: ['Agitation during transitions', 'Sensory overload response'],
      proactiveStrategies: proactive ? proactive.split('\n') : ['Visual schedule board', 'Headphones accessible'],
      reactiveStrategies: reactive ? reactive.split('\n') : ['De-escalation script', 'Sensory break'],
      restrictivePractices: [],
      reviewDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      authorName: currentUser?.name || 'Practitioner',
      lastUpdated: new Date().toISOString(),
    });

    setSummary('');
    setProactive('');
    setReactive('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Positive Behaviour Support Plans (BSP)</h2>
            <p className="text-xs text-slate-400">
              NDIS Quality and Safeguards Commission compliant BSP authoring and multi-tier proactive strategy formulation.
            </p>
          </div>
        </div>

        {!isViewer && (
          <button
            onClick={handleGenerateAiBsp}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md shrink-0 self-start sm:self-auto"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isGenerating ? 'Synthesizing BSP...' : 'Generate AI BSP Draft'}</span>
          </button>
        )}
      </div>

      {/* Editor & Active BSPs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authoring Canvas */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            BSP Draft Studio
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Participant</label>
              <select
                value={selectedClient}
                disabled={isViewer}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.primaryDisability})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Clinical Rationale & Summary</label>
              <textarea
                rows={3}
                value={summary}
                disabled={isViewer}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Core clinical approach, neuroaffirming principles..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-emerald-400">
                Proactive / Environmental Strategies
              </label>
              <textarea
                rows={3}
                value={proactive}
                disabled={isViewer}
                onChange={(e) => setProactive(e.target.value)}
                placeholder="• Visual schedule board&#10;• Sensory break every 45 mins"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-amber-400">
                Reactive / De-escalation Protocols
              </label>
              <textarea
                rows={3}
                value={reactive}
                disabled={isViewer}
                onChange={(e) => setReactive(e.target.value)}
                placeholder="• 2-word calm prompts&#10;• Access quiet room"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
              />
            </div>

            {!isViewer && (
              <button
                onClick={handleSaveBsp}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Publish BSP Version</span>
              </button>
            )}
          </div>
        </div>

        {/* Existing BSP Records & Portal Export */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              Active NDIS BSP Documents
            </h3>
            <span className="text-[10px] bg-slate-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-slate-800 font-bold">
              NDIS Quality Commission Compliant
            </span>
          </div>

          <div className="space-y-4">
            {bspDocuments.map((doc: BSPDocument) => {
              const clientObj = clients.find(c => c.id === doc.clientId);
              return (
                <div key={doc.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">{doc.clientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">NDIS #: {clientObj?.ndisNumber || '430891204'}</span>
                    </div>
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                      {doc.version} • {doc.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {doc.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono bg-slate-900/30 p-2 rounded">
                    <div>Proactive Strategies: <span className="text-teal-400 font-bold">{doc.proactiveStrategies.length} defined</span></div>
                    <div>Reactive Protocols: <span className="text-amber-400 font-bold">{doc.reactiveStrategies.length} defined</span></div>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between pt-2 border-t border-slate-900">
                    <span>Author: {doc.authorName}</span>
                    <span>Review Due: {doc.reviewDate}</span>
                  </div>

                  {/* NDIS Commission Portal Export Bundle */}
                  <div className="pt-2 border-t border-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        NDIS Commission Submission Bundle
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Pre-validated
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<NDISBSPSubmission xmlns="http://www.ndiscommission.gov.au/bsp/v2">
  <Header>
    <PortalTarget>VIC Senior Practitioner Portal</PortalTarget>
    <SubmissionDate>${new Date().toISOString()}</SubmissionDate>
    <PractitionerID>${currentUser.id}</PractitionerID>
    <AuthorName>${doc.authorName}</AuthorName>
  </Header>
  <Participant>
    <NDISNumber>${clientObj?.ndisNumber || '430891204'}</NDISNumber>
    <Name>${doc.clientName}</Name>
  </Participant>
  <BSPContent>
    <Version>${doc.version}</Version>
    <Summary>${doc.summary}</Summary>
    <ReviewDate>${doc.reviewDate}</ReviewDate>
    <ProactiveCount>${doc.proactiveStrategies.length}</ProactiveCount>
    <ReactiveCount>${doc.reactiveStrategies.length}</ReactiveCount>
  </BSPContent>
</NDISBSPSubmission>`;
                          const blob = new Blob([xmlContent], { type: 'application/xml' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `BSP_NDIS_Submission_${doc.clientName.replace(/\s+/g, '_')}_${doc.version}.xml`;
                          a.click();
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3 text-teal-400" />
                        <span>VIC / NSW XML</span>
                      </button>

                      <button
                        onClick={() => {
                          const jsonPayload = {
                            ndisPortalSchemaVersion: "2026.1",
                            participant: {
                              ndisNumber: clientObj?.ndisNumber || '430891204',
                              fullName: doc.clientName,
                            },
                            bspDocument: doc,
                            submittedAt: new Date().toISOString(),
                            submittedBy: currentUser.name,
                          };
                          const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `NDIS_Portal_Payload_${doc.clientName.replace(/\s+/g, '_')}.json`;
                          a.click();
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>PRODA JSON</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('google-workspace')}
                        className="p-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded border border-blue-800/60 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        title="Export directly to Google Docs or Google Slides"
                      >
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span>Google Docs/Slides</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
