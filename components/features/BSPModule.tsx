'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, BSPDocument, ComprehensiveBSPResult, BSPReviewStatus } from '@/types';
import { generateComprehensiveAIBSP, exportBSPToPDF } from '@/lib/ai-assistant';
import { evaluateBSPReviewStatus, advanceBSPReviewWorkflow } from '@/lib/complianceService';
import {
  FileSpreadsheet,
  Plus,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Download,
  Lock,
  FileText,
  Shield,
  Layers,
  Activity,
  UserCheck,
  Eye,
  Printer,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const BSPModule: React.FC = () => {
  const {
    bspDocuments,
    clients,
    abcLogs,
    incidents,
    restrictivePractices,
    caseNotes,
    currentUser,
    addBSPDocument,
    updateBSPDocument,
    addAuditLog,
    addNotification,
    setActiveTab
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<number>(1);
  const [comprehensiveBsp, setComprehensiveBsp] = useState<ComprehensiveBSPResult | null>(null);

  const [summary, setSummary] = useState('');
  const [proactive, setProactive] = useState('');
  const [reactive, setReactive] = useState('');
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleGenerateAiBsp = async () => {
    if (!selectedClientObj) return;
    setIsGenerating(true);

    try {
      // Synthesize genuine 7-section NDIS BSP from participant's real clinical database
      const clientABC = abcLogs.filter((l) => l.clientId === selectedClientObj.id);
      const clientRPs = restrictivePractices.filter((r) => r.clientId === selectedClientObj.id);
      const clientIncidents = incidents.filter((i) => i.clientId === selectedClientObj.id);
      const clientNotes = caseNotes.filter((n) => n.clientId === selectedClientObj.id);

      const synthesized = await generateComprehensiveAIBSP(
        selectedClientObj,
        clientABC,
        selectedClientObj.goals,
        clientRPs,
        clientIncidents,
        clientNotes
      );

      setComprehensiveBsp(synthesized);
      setSummary(synthesized.summary);
      setProactive(synthesized.proactiveStrategies.join('\n'));
      setReactive(synthesized.reactiveStrategies.join('\n'));
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
      status: 'Active',
      summary: summary || comprehensiveBsp?.summary || 'Comprehensive Behaviour Support Plan focused on positive environmental adjustments.',
      primaryBehaviorsOfConcern: comprehensiveBsp?.primaryBehaviorsOfConcern || ['Agitation during transitions', 'Sensory overload response'],
      proactiveStrategies: proactive ? proactive.split('\n') : (comprehensiveBsp?.proactiveStrategies || ['Visual schedule board', 'Headphones accessible']),
      reactiveStrategies: reactive ? reactive.split('\n') : (comprehensiveBsp?.reactiveStrategies || ['De-escalation script', 'Sensory break']),
      restrictivePractices: comprehensiveBsp?.restrictivePractices || [],
      reviewDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      authorName: currentUser?.name || 'Practitioner',
      lastUpdated: new Date().toISOString(),
    });

    addAuditLog(
      'CREATE_BSP_PLAN',
      'BSP_DOCUMENT',
      selectedClientObj.id,
      `Created 12-month NDIS Behaviour Support Plan for ${selectedClientObj.name}. Review due in 365 days.`
    );

    addNotification({
      title: `BSP Published: ${selectedClientObj.name}`,
      message: `12-month statutory review countdown initialized. Review due in 12 months.`,
      type: 'clinical',
      severity: 'success',
      linkTab: 'bsp'
    });

    setSummary('');
    setProactive('');
    setReactive('');
    setComprehensiveBsp(null);
  };

  const handleAdvanceBSPWorkflow = (doc: BSPDocument, targetStatus: BSPReviewStatus) => {
    setWorkflowError(null);
    try {
      const result = advanceBSPReviewWorkflow(
        doc,
        targetStatus,
        {
          uid: currentUser?.id || 'prac-1',
          name: currentUser?.name || 'Practitioner',
          role: currentUser?.role || 'PRACTITIONER'
        },
        'Transitioned via 12-Month BSP Review Engine'
      );

      updateBSPDocument(doc.id, {
        status: targetStatus as any,
        reviewDate: result.newReviewDate || doc.reviewDate,
        lastUpdated: new Date().toISOString()
      });

      addAuditLog(
        'BSP_REVIEW_WORKFLOW_ADVANCED',
        'BSP_DOCUMENT',
        doc.id,
        `Advanced BSP ${doc.id} (${doc.clientName}) from "${doc.status}" to "${targetStatus}".`
      );

      addNotification({
        title: `BSP Review: ${doc.clientName}`,
        message: `Plan status updated to "${targetStatus}".`,
        type: 'clinical',
        severity: targetStatus === 'Re-Authorized' ? 'success' : 'info',
        linkTab: 'bsp'
      });
    } catch (err: any) {
      setWorkflowError(err.message);
    }
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">NDIS Behaviour Support Plans (BSP)</h2>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono font-medium">
                12-Month Statutory Review Workflow
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-synthesized PBS framework integrating client ABC observations, SMART goals, incidents, and restrictive practices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {comprehensiveBsp && (
            <button
              onClick={() => exportBSPToPDF(comprehensiveBsp, selectedClientObj)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all border border-slate-700 shadow-sm"
              title="Download formatted NDIS-compliant PDF report"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download BSP (PDF)</span>
            </button>
          )}

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
              <span>{isGenerating ? 'Synthesizing 7-Section BSP...' : 'Generate AI BSP Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {workflowError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{workflowError}</span>
        </div>
      )}

      {/* 7-Section Comprehensive AI BSP Interactive Viewer if Generated */}
      {comprehensiveBsp && (
        <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  7-Section Comprehensive BSP: {comprehensiveBsp.clientName}
                </h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  {comprehensiveBsp.version} &bull; Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Author: {comprehensiveBsp.authorName} &bull; Authorised under NDIS Commission Capability Framework
              </p>
            </div>

            <button
              onClick={() => exportBSPToPDF(comprehensiveBsp, selectedClientObj)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Export & Print NDIS PDF</span>
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
            {[
              { num: 1, label: '1. Profile' },
              { num: 2, label: '2. Behaviours' },
              { num: 3, label: '3. ABC Antecedents' },
              { num: 4, label: '4. Functions' },
              { num: 5, label: '5. Proactive' },
              { num: 6, label: '6. Replacement' },
              { num: 7, label: '7. Reactive / RPs' },
            ].map((tab) => (
              <button
                key={tab.num}
                onClick={() => setActiveTabSection(tab.num)}
                className={`py-2 px-2 rounded-lg transition-all text-center truncate ${
                  activeTabSection === tab.num
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Section Content Display */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
            {activeTabSection === 1 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 1: {comprehensiveBsp.sections.section1_participantProfile.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section1_participantProfile.content}
                </div>
              </div>
            )}

            {activeTabSection === 2 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 2: {comprehensiveBsp.sections.section2_presentingBehaviours.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section2_presentingBehaviours.content}
                </div>
              </div>
            )}

            {activeTabSection === 3 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 3: {comprehensiveBsp.sections.section3_antecedentAnalysis.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section3_antecedentAnalysis.content}
                </div>
              </div>
            )}

            {activeTabSection === 4 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 4: {comprehensiveBsp.sections.section4_functionalAssessment.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section4_functionalAssessment.content}
                </div>
              </div>
            )}

            {activeTabSection === 5 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 5: {comprehensiveBsp.sections.section5_proactiveStrategies.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section5_proactiveStrategies.content}
                </div>
              </div>
            )}

            {activeTabSection === 6 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 6: {comprehensiveBsp.sections.section6_replacementSkills.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section6_replacementSkills.content}
                </div>
              </div>
            )}

            {activeTabSection === 7 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Section 7: {comprehensiveBsp.sections.section7_reactiveAndRestrictivePractices.title}
                </h4>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  {comprehensiveBsp.sections.section7_reactiveAndRestrictivePractices.content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* Existing BSP Records & Review Workflow Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              12-Month BSP Review Tracking
            </h3>
            <span className="text-[10px] bg-slate-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-slate-800 font-bold">
              NDIS Quality Commission Compliant
            </span>
          </div>

          <div className="space-y-4">
            {bspDocuments.map((doc: BSPDocument) => {
              const clientObj = clients.find((c) => c.id === doc.clientId);
              const reviewAlert = evaluateBSPReviewStatus(doc);

              return (
                <div key={doc.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm block">{doc.clientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">NDIS #: {clientObj?.ndisNumber || '430891204'}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                        {doc.version} &bull; {doc.status}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        reviewAlert.daysRemaining <= 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : reviewAlert.daysRemaining <= 30
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {reviewAlert.daysRemaining <= 0 ? 'EXPIRED' : `${reviewAlert.daysRemaining}d until review`}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {doc.summary}
                  </p>

                  {/* 12-Month Review State Pipeline */}
                  <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">12-Month Review Milestone:</span>
                      <span className="text-slate-300 font-mono">Review Due: {doc.reviewDate || '2027-08-25'}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                      <div className={`p-1 rounded ${doc.status === 'Active' || doc.status === 'Current' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-950 text-slate-500'}`}>
                        1. Current
                      </div>
                      <div className={`p-1 rounded ${doc.status === 'Under Review' || doc.status === 'Due in 30 Days' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-950 text-slate-500'}`}>
                        2. In Review
                      </div>
                      <div className={`p-1 rounded ${doc.status === 'Panel Review' || doc.status === 'Panel Submitted' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-950 text-slate-500'}`}>
                        3. Panel Submit
                      </div>
                      <div className={`p-1 rounded ${doc.status === 'Re-Authorized' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-500'}`}>
                        4. Re-Authorized
                      </div>
                    </div>

                    {!isViewer && (
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        {doc.status !== 'Under Review' && (
                          <button
                            onClick={() => handleAdvanceBSPWorkflow(doc, 'Under Review')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-semibold text-[10px] transition-all"
                          >
                            Begin 12mo Review
                          </button>
                        )}
                        {doc.status === 'Under Review' && (
                          <button
                            onClick={() => handleAdvanceBSPWorkflow(doc, 'Panel Submitted')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-[10px] transition-all"
                          >
                            Submit to Panel
                          </button>
                        )}
                        {(doc.status === 'Panel Submitted' || doc.status === 'Panel Review' || doc.status === 'Under Review') && (
                          <button
                            onClick={() => handleAdvanceBSPWorkflow(doc, 'Re-Authorized')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Re-Authorize (+12mo)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* NDIS Commission Portal Export Bundle */}
                  <div className="pt-2 border-t border-slate-900/80 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => exportBSPToPDF(doc, clientObj)}
                        className="p-1.5 bg-teal-900/40 hover:bg-teal-900/60 text-teal-300 rounded border border-teal-800/60 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        title="Download / Print formatted BSP PDF"
                      >
                        <Download className="w-3 h-3 text-teal-400" />
                        <span>PDF Export</span>
                      </button>

                      <button
                        onClick={() => {
                          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<NDISBSPSubmission xmlns="http://www.ndiscommission.gov.au/bsp/v2">
  <Header>
    <PortalTarget>VIC Senior Practitioner Portal</PortalTarget>
    <SubmissionDate>${new Date().toISOString()}</SubmissionDate>
    <PractitionerID>${currentUser?.id || 'prac-1'}</PractitionerID>
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
                            submittedBy: currentUser?.name || 'Practitioner',
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
