'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { RestrictivePractice, Client } from '@/types';
import { generateRestrictivePracticesCommissionReport } from '@/lib/complianceService';
import {
  Lock,
  Plus,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Calendar,
  X,
  Send,
  Download,
  Printer,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export const RestrictivePracticesModule: React.FC = () => {
  const { restrictivePractices, clients, currentUser, addRestrictivePractice, addAuditLog, addNotification } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isAdding, setIsAdding] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportingMonth, setReportingMonth] = useState('2026-08');

  const [type, setType] = useState<RestrictivePractice['practiceType']>('Environmental');
  const [description, setDescription] = useState('');
  const [authBody, setAuthBody] = useState('VIC Senior Practitioner');
  const [refNum, setRefNum] = useState('');
  const [authStatus, setAuthStatus] = useState<'Authorized' | 'Emergency / Unauthorized'>('Authorized');
  const [fadingPlanSummary, setFadingPlanSummary] = useState('Fading plan monitored by lead practitioner with environmental modifications.');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleAddPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj) return;

    addRestrictivePractice({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      practiceType: type,
      description: description || 'Authorised environmental barrier.',
      status: authStatus === 'Authorized' ? 'Authorized' : 'Proposed',
      authorizationBody: authBody,
      authorizationReference: refNum || `RPR-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      reductionPlanSummary: fadingPlanSummary,
      monthlyReportStatus: 'Submitted',
    });

    addAuditLog(
      'REGISTER_RESTRICTIVE_PRACTICE',
      'RESTRICTIVE_PRACTICE',
      selectedClientObj.id,
      `Registered ${type} restrictive practice for ${selectedClientObj.name}. Ref: ${refNum || 'Generated'}`
    );

    addNotification({
      title: `Restrictive Practice Registered: ${selectedClientObj.name}`,
      message: `${type} practice recorded under ${authBody}. Reference: ${refNum || 'Pending'}.`,
      type: 'compliance',
      severity: authStatus === 'Authorized' ? 'info' : 'high',
      linkTab: 'restrictive'
    });

    setIsAdding(false);
    setDescription('');
    setRefNum('');
  };

  const handleExportCommissionReport = (format: 'JSON' | 'CSV' | 'PRINT') => {
    const { report, csvExport, jsonExport, printableHtml } = generateRestrictivePracticesCommissionReport(
      restrictivePractices,
      reportingMonth
    );

    if (format === 'JSON') {
      const blob = new Blob([jsonExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NDIS_Commission_RP_MonthlyReturn_${reportingMonth}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'CSV') {
      const blob = new Blob([csvExport], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NDIS_Commission_RP_Return_${reportingMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'PRINT') {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(printableHtml);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
      }
    }

    addAuditLog(
      'EXPORT_NDIS_RP_REPORT',
      'RESTRICTIVE_PRACTICE',
      reportingMonth,
      `Exported NDIS Commission Restrictive Practices Monthly Return for ${reportingMonth} (${format}).`
    );

    addNotification({
      title: 'RP Monthly Return Exported',
      message: `NDIS Quality and Safeguards Commission report exported for ${reportingMonth}.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'restrictive'
    });
  };

  const authorizedCount = restrictivePractices.filter(r => r.status === 'Authorized' || r.status === 'Active').length;
  const emergencyCount = restrictivePractices.filter(r => r.status === 'Proposed' || (r.description && r.description.toLowerCase().includes('emergency'))).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Restrictive Practices Register</h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                NDIS Commission Standard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              State Senior Practitioner authorization tracking, reduction plans, and monthly portal reporting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all border border-teal-500/30 shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Monthly Return Exporter</span>
          </button>

          {!isViewer && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register Restrictive Practice</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Total Tracked</span>
          <span className="text-xl font-extrabold text-white font-mono">{restrictivePractices.length}</span>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Senior Practitioner Authorized</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono">{authorizedCount}</span>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Emergency / Unauthorized</span>
          <span className={`text-xl font-extrabold font-mono ${emergencyCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {emergencyCount}
          </span>
        </div>
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Portal Monthly Return</span>
          <span className="text-xl font-extrabold text-teal-400 font-mono">100% On-Time</span>
        </div>
      </div>

      {/* Practice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restrictivePractices.map((practice: RestrictivePractice) => (
          <div key={practice.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded font-bold border border-amber-500/20 uppercase tracking-wider">
                  {practice.practiceType} Restrictive Practice
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{practice.clientName}</h3>
              </div>

              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {practice.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              {practice.description}
            </p>

            <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/60 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Fading Protocol / Reduction Strategy:</span>
              <p className="text-slate-300 text-[11px] leading-snug">
                {practice.reductionPlanSummary || 'Fading plan monitored by lead practitioner with environmental modifications.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Auth Body</span>
                <span className="text-slate-200 font-semibold">{practice.authorizationBody}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Reference #</span>
                <span className="text-teal-400 font-bold">{practice.authorizationReference}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">
                Expiry: <span className="text-white font-mono">{practice.expiryDate}</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Monthly Log: {practice.monthlyReportStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Export Monthly Return Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                NDIS Commission Monthly Return Exporter
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reporting Period (YYYY-MM)</label>
                <input
                  type="month"
                  value={reportingMonth}
                  onChange={(e) => setReportingMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Provider Registration Number:</span>
                  <span className="text-teal-400 font-mono font-bold">PRV-NDIS-088194</span>
                </div>
                <div className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Extracted Practices to Report:</span>
                  <span className="text-white font-mono font-bold">{restrictivePractices.length} Records</span>
                </div>
                <div className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Authorized vs Emergency:</span>
                  <span className="text-emerald-400 font-mono font-bold">{authorizedCount} Auth / {emergencyCount} Emerg</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleExportCommissionReport('CSV')}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl border border-teal-500/30 flex flex-col items-center gap-1.5 text-center transition-all"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Download CSV (Portal)</span>
                </button>
                <button
                  onClick={() => handleExportCommissionReport('JSON')}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 flex flex-col items-center gap-1.5 text-center transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => handleExportCommissionReport('PRINT')}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex flex-col items-center gap-1.5 text-center transition-all"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Print Summary</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Practice Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Register Restrictive Practice
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPractice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Participant</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                >
                  {clients.map((c: Client) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ndisNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Practice Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-bold"
                  >
                    <option value="Environmental">Environmental</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Physical">Physical</option>
                    <option value="Seclusion">Seclusion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Authorization Status</label>
                  <select
                    value={authStatus}
                    onChange={(e) => setAuthStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                  >
                    <option value="Authorized">Senior Practitioner Authorized</option>
                    <option value="Emergency / Unauthorized">Emergency / Unauthorized</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorization Reference Number</label>
                <input
                  type="text"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                  placeholder="e.g. RPR-2026-VIC-9912"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Practice Description & Purpose</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exact physical barrier, chemical agent, or environmental lock..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Fading / Reduction Plan Summary</label>
                <textarea
                  rows={2}
                  value={fadingPlanSummary}
                  onChange={(e) => setFadingPlanSummary(e.target.value)}
                  placeholder="Describe reduction milestones and positive replacement strategies..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Register Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
