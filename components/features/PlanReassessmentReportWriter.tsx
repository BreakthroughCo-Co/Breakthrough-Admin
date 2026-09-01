import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { PlanReportGenerator, PlanReassessmentReport } from '../../lib/planReportGenerator';
import {
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const PlanReassessmentReportWriter: React.FC = () => {
  const { clients, caseNotes, abcLogs, restrictivePractices, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<PlanReassessmentReport | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleGenerate = () => {
    if (!selectedClient) return;
    setIsGenerating(true);
    setTimeout(() => {
      const generated = PlanReportGenerator.generateReport(
        selectedClient,
        caseNotes,
        abcLogs,
        restrictivePractices
      );
      setReport(generated);
      setIsGenerating(false);
      addNotification({
        title: 'NDIS Plan Report Generated',
        message: `Plan reassessment dossier prepared for ${selectedClient.name}.`,
        type: 'success',
      });
    }, 600);
  };

  const handleExportText = () => {
    if (!report) return;
    const content = `NDIS COMPREHENSIVE PLAN REASSESSMENT REPORT
======================================================
Participant: ${report.clientName} (ID: ${report.clientId})
Report Date: ${report.reportDate}
Plan Period: ${report.planPeriod}

1. EXECUTIVE SUMMARY
-------------------
${report.executiveSummary}

2. CLINICAL PROGRESS & BEHAVIOURAL ASSESSMENT
--------------------------------------------
${report.clinicalProgressAssessment}

3. GOAL OUTCOME LEDGER
---------------------
${report.goalOutcomeLedger.map((g, i) => `Goal ${i + 1}: ${g.goalDescription}\nProgress: ${g.progressPercentage}%\nObservation: ${g.clinicalObservation}\n`).join('\n')}

4. RESTRICTIVE PRACTICES REVIEW
------------------------------
Active Authorizations: ${report.restrictivePracticesSummary.activePracticesCount}
Estimated Reduction: ${report.restrictivePracticesSummary.reductionPercentage}%
Recommendation: ${report.restrictivePracticesSummary.clinicalRecommendation}

5. RECOMMENDED FUNDING REQUEST (NEXT 12 MONTHS)
-----------------------------------------------
${report.recommendedFundingRequest.map((f) => `- ${f.supportItemCode} (${f.supportItemName}): ${f.recommendedHoursPerYear} hrs/yr ($${f.totalEstimatedCost.toFixed(2)})\n  Justification: ${f.clinicalJustification}`).join('\n\n')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDIS_Reassessment_${report.clientName.replace(/\s+/g, '_')}_${report.reportDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Automated 12-Month NDIS Plan Reassessment Report
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  AI-Synthesized
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Aggregates case notes, goal milestones, and restrictive practice reductions into an NDIA submission dossier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ndisNumber || 'NDIS'})
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Synthesizing Dossier...' : 'Draft Plan Report'}
            </button>
          </div>
        </div>
      </div>

      {report && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-indigo-400">PARTICIPANT DOSSIER</span>
              <h3 className="text-lg font-bold text-white">{report.clientName}</h3>
              <p className="text-xs text-slate-400">Plan Period: {report.planPeriod}</p>
            </div>
            <button
              onClick={handleExportText}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Section 34 Dossier (.txt)
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Executive Summary</h4>
              <p className="text-sm text-slate-200 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Progress & Observations</h4>
              <p className="text-sm text-slate-200 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 leading-relaxed">
                {report.clinicalProgressAssessment}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal Outcome Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.goalOutcomeLedger.map((g, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-white">{g.goalDescription}</span>
                      <span className="text-indigo-400 font-bold">{g.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${g.progressPercentage}%` }} />
                    </div>
                    <p className="text-slate-400 text-[11px]">{g.clinicalObservation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended 12-Month NDIS Funding Allocation</h4>
              <div className="space-y-2">
                {report.recommendedFundingRequest.map((fund, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-indigo-300 font-semibold">{fund.supportItemCode}</span>
                      <p className="text-white font-medium">{fund.supportItemName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fund.clinicalJustification}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">${fund.totalEstimatedCost.toFixed(2)}</span>
                      <p className="text-[10px] text-slate-400">{fund.recommendedHoursPerYear} hrs / year</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
