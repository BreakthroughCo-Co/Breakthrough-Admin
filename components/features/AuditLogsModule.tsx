'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { AuditLog } from '@/types';
import { ComplianceReportModal } from './ComplianceReportModal';
import {
  Clock,
  Search,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  X,
  FileText,
  Printer
} from 'lucide-react';

export const AuditLogsModule: React.FC = () => {
  const { auditLogs } = useManagementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isComplianceReportOpen, setIsComplianceReportOpen] = useState(false);
  const [isMasked, setIsMasked] = useState(true);

  const modules = ['ALL', 'CLIENT', 'BILLING', 'INCIDENT', 'PRACTITIONER', 'SYSTEM'];
  const severities = ['ALL', 'Critical', 'High', 'Medium', 'Low'];
  const roles = ['ALL', 'ADMIN', 'PRACTITIONER', 'VIEWER'];

  // Utility to mask sensitive details (Emails, IPs, Phone Numbers)
  const maskSensitiveData = (text: string | undefined): string => {
    if (!text) return '';
    let maskedText = text;
    // Mask Email (e.g. user@example.com -> u***@e***.com)
    maskedText = maskedText.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (match, p1, p2) => {
      const p1Masked = p1.charAt(0) + '***';
      const p2Masked = p2.charAt(0) + '***' + (p2.includes('.') ? p2.substring(p2.indexOf('.')) : '');
      return `${p1Masked}@${p2Masked}`;
    });
    // Mask IPv4
    maskedText = maskedText.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '***.***.***.***');
    // Mask AU Phone numbers
    maskedText = maskedText.replace(/(?:\+?61|0)[2-478](?:[ -]?\d){8}\b/g, '[REDACTED PHONE]');
    return maskedText;
  };

  const setDatePreset = (preset: 'today' | '7d' | '30d' | 'thisMonth' | 'all') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7d') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === '30d') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const getAuditSeverity = (log: AuditLog): 'Low' | 'Medium' | 'High' | 'Critical' => {
    if (log.severity) return log.severity;
    const combined = `${log.action} ${log.details} ${log.entity}`.toUpperCase();
    if (
      combined.includes('DELETE') ||
      combined.includes('CRITICAL') ||
      combined.includes('RESTRICTIVE') ||
      combined.includes('REVOKE') ||
      combined.includes('OVERRIDE') ||
      combined.includes('DISQUALIFIED')
    ) {
      return 'Critical';
    }
    if (
      combined.includes('INCIDENT') ||
      combined.includes('SUBMIT') ||
      combined.includes('AUTHORIZE') ||
      combined.includes('REJECT') ||
      combined.includes('CLAIM') ||
      combined.includes('BILLING')
    ) {
      return 'High';
    }
    if (
      combined.includes('UPDATE') ||
      combined.includes('EDIT') ||
      combined.includes('CREATE') ||
      combined.includes('ADD') ||
      combined.includes('CASE NOTE')
    ) {
      return 'Medium';
    }
    return 'Low';
  };

  const filteredLogs = auditLogs.filter((l: AuditLog) => {
    const matchesModule =
      selectedModule === 'ALL' ||
      (l.entity && l.entity.toUpperCase().includes(selectedModule)) ||
      (l.action && l.action.toUpperCase().includes(selectedModule));

    const query = searchTerm.toLowerCase();
    const matchesText =
      !searchTerm ||
      l.action.toLowerCase().includes(query) ||
      l.actorName.toLowerCase().includes(query) ||
      l.actorRole.toLowerCase().includes(query) ||
      (l.entity && l.entity.toLowerCase().includes(query)) ||
      l.details.toLowerCase().includes(query);

    const severity = getAuditSeverity(l);
    const matchesSeverity = severityFilter === 'ALL' || severity === severityFilter;

    const matchesRole = roleFilter === 'ALL' || l.actorRole.toUpperCase() === roleFilter.toUpperCase();

    let matchesDate = true;
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      matchesDate = matchesDate && new Date(l.timestamp) >= start;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      matchesDate = matchesDate && new Date(l.timestamp) <= end;
    }

    return matchesModule && matchesText && matchesSeverity && matchesRole && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Timestamp',
      'Severity',
      'Action',
      'Actor Name',
      'Actor Role',
      'Entity',
      'Details',
      'IP Address'
    ];
    const rows = filteredLogs.map((l: AuditLog) => {
      const sev = getAuditSeverity(l);
      const displayedDetails = isMasked ? maskSensitiveData(l.details) : l.details;
      const displayedActor = isMasked ? maskSensitiveData(l.actorName) : l.actorName;
      const displayedIp = isMasked ? maskSensitiveData(l.ipAddress) : l.ipAddress;
      
      const cleanDetails = (displayedDetails || '').replace(/"/g, '""');
      const cleanAction = (l.action || '').replace(/"/g, '""');
      const cleanActor = (displayedActor || '').replace(/"/g, '""');
      return `"${l.id}","${l.timestamp}","${sev}","${cleanAction}","${cleanActor}","${l.actorRole}","${l.entity || ''}","${cleanDetails}","${displayedIp || ''}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NDIS_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Immutable Compliance Audit Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #0f172a; max-width: 950px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .badge { display: inline-block; padding: 3px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
            .badge-critical { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
            .badge-high { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .badge-medium { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
            .badge-low { background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
            .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            .table th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
            .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 20px; color: #0f172a;">Immutable Compliance Audit Report</h1>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px;">Breakthrough Allied Health OS • NDIS Quality & Safeguards Commission Compliance</p>
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>Events Listed: ${filteredLogs.length}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 15%;">Timestamp</th>
                <th style="width: 10%;">Severity</th>
                <th style="width: 20%;">Action & Entity</th>
                <th style="width: 18%;">Actor & Role</th>
                <th style="width: 37%;">Audit Details</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs
                .map((l: AuditLog) => {
                  const sev = getAuditSeverity(l);
                  const displayedActor = isMasked ? maskSensitiveData(l.actorName) : l.actorName;
                  const displayedDetails = isMasked ? maskSensitiveData(l.details) : l.details;
                  
                  const badgeClass =
                    sev === 'Critical'
                      ? 'badge-critical'
                      : sev === 'High'
                      ? 'badge-high'
                      : sev === 'Medium'
                      ? 'badge-medium'
                      : 'badge-low';
                  return `
                  <tr>
                    <td style="font-family: 'JetBrains Mono', monospace; font-size: 10px;">${l.timestamp}</td>
                    <td><span class="badge ${badgeClass}">${sev}</span></td>
                    <td>
                      <strong>${l.action}</strong>
                      ${l.entity ? `<div style="color: #64748b; font-size: 10px;">${l.entity}</div>` : ''}
                    </td>
                    <td>
                      <div><strong>${displayedActor}</strong></div>
                      <div style="font-size: 10px; color: #64748b;">${l.actorRole}</div>
                    </td>
                    <td>${displayedDetails}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Provider Reg: 405001234 • Certified NDIS Registered Provider</div>
            <div>Signed: Quality & Safeguards Governance Lead</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportAuditCertificate = () => {
    const text = `========================================================================
BREAKTHROUGH COACHING & CONSULTING - IMMUTABLE COMPLIANCE AUDIT CERTIFICATE
NDIS Provider Registration #: 405001234
Generated On: ${new Date().toISOString()}
========================================================================

RECORDED AUDIT LOGS:
${filteredLogs
  .map(
    (l: AuditLog) => {
      const displayedActor = isMasked ? maskSensitiveData(l.actorName) : l.actorName;
      const displayedDetails = isMasked ? maskSensitiveData(l.details) : l.details;
      return `[${l.timestamp}] | SEVERITY: ${getAuditSeverity(l)} | ACTION: ${l.action} | ACTOR: ${displayedActor} (${l.actorRole}) | DETAILS: ${displayedDetails}`;
    }
  )
  .join('\n')}

CERTIFICATION STATEMENT:
This document confirms that all clinical records, restrictive practice logs, and financial transactions
recorded above have been preserved in an immutable audit ledger compliant with the NDIS Quality and Safeguards Commission.
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDIS_Compliance_Audit_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const renderSeverityBadge = (severity: 'Low' | 'Medium' | 'High' | 'Critical') => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Low
          </span>
        );
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedModule('ALL');
    setSeverityFilter('ALL');
    setRoleFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedModule !== 'ALL' ||
    severityFilter !== 'ALL' ||
    roleFilter !== 'ALL' ||
    startDate ||
    endDate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Immutable Compliance Audit Ledger</h2>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700 font-bold">
                {filteredLogs.length} / {auditLogs.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete, unalterable trail of all clinical edits, status overrides, and NDIS submissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsComplianceReportOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md border border-blue-500/30"
            title="Generate and download/print Board-ready executive compliance PDF summary"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            <span>Executive Compliance PDF</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-lg border border-amber-500/30 flex items-center gap-2 transition-all shadow-sm"
            title="Print or save filtered audit ledger table as PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print / PDF Ledger</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-500/30 flex items-center gap-2 transition-all shadow-sm"
            title="Export filtered audit logs to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportAuditCertificate}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-lg border border-teal-500/30 flex items-center gap-2 transition-all shadow-sm"
            title="Export official text certificate"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export Certificate</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        {/* Row 1: Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by user, module, action type, client name, or change description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Date Range Picker with Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Date Picker + Presets */}
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Date Filter:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-500 font-mono"
            />
            <span className="text-slate-500 font-semibold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-500 font-mono"
            />

            {/* Presets */}
            <div className="flex items-center gap-1 ml-2 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('7d')}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('30d')}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all"
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('thisMonth')}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all"
              >
                Month
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => setDatePreset('all')}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition-all"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Module, Role & Severity Pill Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Severity Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Severity:
              </span>
              {severities.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                    severityFilter === s
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Module Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Module:
              </span>
              {modules.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModule(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                    selectedModule === m
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Role:
              </span>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                    roleFilter === r
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] rounded-lg flex items-center gap-1 border border-slate-700 font-bold transition-all shadow-sm"
                title="Reset all search filters"
              >
                <X className="w-3 h-3 text-rose-400" />
                <span>Reset Filters</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={isMasked}
                  onChange={(e) => setIsMasked(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-teal-500 bg-slate-900 focus:ring-teal-500/50 focus:ring-offset-slate-950"
                />
                Mask Sensitive Data
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Audit List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-950/50">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor Name & Role</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-sans">
                    No audit records match the selected date range or query filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: AuditLog) => {
                  const severity = getAuditSeverity(log);
                  const displayedActor = isMasked ? maskSensitiveData(log.actorName) : log.actorName;
                  const displayedDetails = isMasked ? maskSensitiveData(log.details) : log.details;
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderSeverityBadge(severity)}
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-300 whitespace-nowrap">{log.action}</td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span className="text-white font-semibold">{displayedActor}</span>{' '}
                        <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-md truncate font-sans text-xs" title={displayedDetails}>
                        {displayedDetails}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Board Compliance Report Modal */}
      <ComplianceReportModal
        isOpen={isComplianceReportOpen}
        onClose={() => setIsComplianceReportOpen(false)}
      />
    </div>
  );
};

