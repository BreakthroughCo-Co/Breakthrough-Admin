import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { ClinicalAgentSupervisor, ClinicalSupervisionReview } from '../../lib/clinicalAgentSupervisor';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Award,
  FileCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export const ClinicalSupervisorDashboard: React.FC = () => {
  const { caseNotes, clients, restrictivePractices, updateCaseNote, addNotification } = useManagementStore();
  const [selectedNoteId, setSelectedNoteId] = useState<string>(caseNotes[0]?.id || '');

  const selectedNote = caseNotes.find((n) => n.id === selectedNoteId) || caseNotes[0];
  const client = clients.find((c) => c.id === selectedNote?.clientId);
  const clientRPs = restrictivePractices.filter((rp) => rp.clientId === selectedNote?.clientId);

  const review: ClinicalSupervisionReview | null = selectedNote
    ? ClinicalAgentSupervisor.reviewCaseNote(selectedNote, client, clientRPs)
    : null;

  const handleApproveNote = () => {
    if (!selectedNote) return;
    updateCaseNote(selectedNote.id, {
      status: 'Approved',
      isVerified: true,
      verifiedBy: 'Clinical Director (AI-Supervised)',
    });
    addNotification({
      title: 'Case Note Supervised & Approved',
      message: `Note ${selectedNote.id} approved for NDIS claiming.`,
      type: 'clinical',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Autonomous Clinical Supervisor & Peer Reviewer
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                NDIS Practice Standards
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Automated audit agent evaluating SOAP note rigor, goal linkage, and restrictive practice compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-amber-500"
          >
            {caseNotes.slice(0, 10).map((n) => (
              <option key={n.id} value={n.id}>
                {n.clientName} - {n.sessionDate || n.date} ({n.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {review && selectedNote && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Note Quality Score Card */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Clinical Rigor Score
              </span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-extrabold text-white">{review.complianceScore}</span>
                <span className="text-slate-400 text-sm font-medium">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${
                    review.complianceScore >= 80
                      ? 'bg-emerald-500'
                      : review.complianceScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${review.complianceScore}%` }}
                />
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-400">Billing Clearance:</span>
                  <span className={`font-semibold ${review.isApprovedForBilling ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {review.isApprovedForBilling ? 'CLEAR FOR NDIS PACE' : 'REMEDIATION REQUIRED'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-400">Recommended GAS:</span>
                  <span className="font-bold text-amber-300">+{review.recommendedGASScore} (Progressive)</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleApproveNote}
              disabled={selectedNote.status === 'Approved'}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {selectedNote.status === 'Approved' ? 'Already Approved' : 'Sign Off & Approve Claiming'}
            </button>
          </div>

          {/* Audit Findings and Remediation */}
          <div className="lg:col-span-2 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Supervisory Audit Findings ({review.findings.length})
            </h3>

            {review.findings.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero clinical defects identified. Note meets full NDIS SOAP documentation standards.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {review.findings.map((f, idx) => {
                  const isCritical = f.severity === 'CRITICAL';
                  const isWarning = f.severity === 'WARNING';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs ${
                        isCritical
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          : isWarning
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold">{f.ruleId}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{f.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
