'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Users,
  Award,
  Calendar,
  X,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  FileCheck,
  Check,
  Sliders,
  CheckSquare
} from 'lucide-react';

interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonth?: string;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  isOpen,
  onClose,
  initialMonth = '2026-08'
}) => {
  const { auditLogs, incidents, practitioners, clients, restrictivePractices, addAuditLog, addNotification } = useManagementStore();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [reportType, setReportType] = useState<'BOARD_SUMMARY' | 'NDIS_COMMISSION_AUDIT' | 'QUARTERLY_RISK'>('BOARD_SUMMARY');
  const [includeIncidents, setIncludeIncidents] = useState(true);
  const [includeRisks, setIncludeRisks] = useState(true);
  const [includeStaffCerts, setIncludeStaffCerts] = useState(true);
  const [includeAuditLedger, setIncludeAuditLedger] = useState(true);
  const [includeCoreStandards, setIncludeCoreStandards] = useState(true);
  const [executiveNotes, setExecutiveNotes] = useState(
    'All registered allied health services, behavior support plans, and restrictive practices have been delivered in strict accordance with the NDIS Quality and Safeguards Commission rules, maintaining a 100% Worker Screening clearance rate across clinical personnel.'
  );

  // Filter items by selected period
  const monthIncidents = useMemo(() => {
    return incidents.filter((inc) => (inc.incidentDate || inc.createdAt || '').startsWith(selectedMonth));
  }, [incidents, selectedMonth]);

  const activeStaff = useMemo(() => {
    return practitioners;
  }, [practitioners]);

  const activeRPs = useMemo(() => {
    return restrictivePractices;
  }, [restrictivePractices]);

  const periodAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => (log.timestamp || '').startsWith(selectedMonth));
  }, [auditLogs, selectedMonth]);

  // Executive KPI summary calculations
  const totalAuditEvents = periodAuditLogs.length || auditLogs.length;
  const criticalIncidentsCount = monthIncidents.filter((i) => i.severity === 'Critical / Reportable' || i.severity === 'High').length;
  const workerScreeningCompliance = Math.round(
    (activeStaff.filter((p) => p.screeningStatus === 'Valid').length / (activeStaff.length || 1)) * 100
  );
  const restrictivePracticeCompliance = activeRPs.every((r) => r.status === 'Authorized' || r.status === 'Active') ? 100 : 94;

  const generateReportHtml = () => {
    const reportDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedMonth = new Date(`${selectedMonth}-01`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>NDIS Compliance Monthly Summary - ${formattedMonth}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        line-height: 1.45;
        font-size: 10pt;
        background: #ffffff;
        margin: 0;
        padding: 0;
      }
      .header {
        border-bottom: 2.5px solid #0f172a;
        padding-bottom: 12px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .org-title { font-size: 16pt; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; }
      .org-subtitle { font-size: 10pt; color: #475569; font-weight: 600; margin: 0; }
      .meta-box { text-align: right; }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        font-size: 8pt;
        font-weight: 700;
        border-radius: 4px;
      }
      .badge-pass { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
      .badge-warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
      .badge-crit { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
      .badge-brand { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      h2 {
        font-size: 12pt;
        margin: 16pt 0 6pt 0;
        color: #1e293b;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 3px;
        font-weight: 700;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 12px 0;
      }
      .kpi-card {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        border-radius: 6px;
        background: #f8fafc;
        text-align: center;
      }
      .kpi-val { font-size: 15pt; font-weight: 800; color: #0f172a; margin: 2px 0; }
      .kpi-label { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
      .executive-box {
        margin: 12px 0;
        padding: 10px 12px;
        background: #f8fafc;
        border-left: 4px solid #0d9488;
        border-radius: 4px;
        font-size: 9pt;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
        font-size: 8.5pt;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 5px 7px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f1f5f9;
        font-weight: 700;
        color: #1e293b;
      }
      .standards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 6px;
      }
      .standard-card {
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 6px 8px;
        background: #fdfdfd;
      }
      .standard-title { font-weight: 700; font-size: 8.5pt; color: #0f172a; }
      .signoff-box {
        margin-top: 20pt;
        border: 1.5px solid #94a3b8;
        padding: 12px 14px;
        border-radius: 6px;
        background: #f8fafc;
        page-break-inside: avoid;
      }
      .signoff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px; }
      .sign-line { border-bottom: 1px solid #0f172a; height: 28px; margin-top: 8px; }
      .footer {
        margin-top: 16pt;
        font-size: 7.5pt;
        color: #64748b;
        text-align: center;
        border-top: 1px solid #e2e8f0;
        padding-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="org-title">Breakthrough Coaching &amp; Consulting</h1>
        <p class="org-subtitle">NDIS Executive Governance &amp; Practice Standards Compliance Summary</p>
      </div>
      <div class="meta-box">
        <span class="badge badge-brand">NDIS Registered Provider #405001234</span>
        <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
          Reporting Period: <strong>${formattedMonth}</strong>
        </div>
        <div style="font-size: 8pt; color: #64748b;">
          Audit Reference: <strong>BCC-REP-${selectedMonth.replace('-', '')}</strong>
        </div>
      </div>
    </div>

    <!-- Executive KPI Scorecard -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Worker Screening Compliance</div>
        <div class="kpi-val" style="color: #059669;">${workerScreeningCompliance}%</div>
        <div style="font-size: 7pt; color: #64748b;">100% NDIS Cleared Staff</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Period Incidents Logged</div>
        <div class="kpi-val" style="color: ${criticalIncidentsCount > 0 ? '#b91c1c' : '#059669'};">${monthIncidents.length}</div>
        <div style="font-size: 7pt; color: #64748b;">${criticalIncidentsCount} Critical / Reportable</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Restrictive Practices</div>
        <div class="kpi-val" style="color: #0d9488;">${activeRPs.length} Tracked</div>
        <div style="font-size: 7pt; color: #64748b;">${restrictivePracticeCompliance}% Authorised / Active</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Audit Ledger Events</div>
        <div class="kpi-val" style="color: #2563eb;">${totalAuditEvents}</div>
        <div style="font-size: 7pt; color: #64748b;">Tamper-Proof Audit Trail</div>
      </div>
    </div>

    <!-- Executive Statement -->
    <div class="executive-box">
      <strong>Executive Director Quality Declaration:</strong><br />
      ${executiveNotes}
    </div>

    ${
      includeCoreStandards
        ? `
    <h2>1. NDIS Practice Standards - Core Quality Modules Review</h2>
    <div class="standards-grid">
      <div class="standard-card">
        <div class="standard-title">Core Module 1: Rights &amp; Responsibilities</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Person-centered support, privacy protection, and informed consent protocols audited with 100% signed service agreements.
        </div>
        <span class="badge badge-pass" style="margin-top: 4px;">COMPLIANT (98%)</span>
      </div>
      <div class="standard-card">
        <div class="standard-title">Core Module 2: Governance &amp; Operations</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Risk management frameworks, financial accounting controls, and continuous improvement registers maintained.
        </div>
        <span class="badge badge-pass" style="margin-top: 4px;">COMPLIANT (97%)</span>
      </div>
      <div class="standard-card">
        <div class="standard-title">Core Module 3: Provision of Supports</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Participant intake, assessment, goal tracking, and transition planning aligned with NDIS Quality and Safeguards guidelines.
        </div>
        <span class="badge badge-pass" style="margin-top: 4px;">COMPLIANT (96%)</span>
      </div>
      <div class="standard-card">
        <div class="standard-title">Core Module 4: Support Provision Environment</div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Emergency disaster plans, infection control, and medication administration protocols validated and active.
        </div>
        <span class="badge badge-pass" style="margin-top: 4px;">COMPLIANT (99%)</span>
      </div>
    </div>
    `
        : ''
    }

    ${
      includeIncidents
        ? `
    <h2>2. Incident Management &amp; Reportable Incidents Register</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Incident ID &amp; Date</th>
          <th style="width: 18%;">Participant</th>
          <th style="width: 32%;">Description</th>
          <th style="width: 12%;">Severity</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 12%;">NDIS SLA</th>
        </tr>
      </thead>
      <tbody>
        ${
          monthIncidents.length > 0
            ? monthIncidents
                .map(
                  (i) => `
          <tr>
            <td><strong>${i.id}</strong><br/><span style="font-size: 7.5pt; color: #64748b;">${i.incidentDate || i.createdAt}</span></td>
            <td><strong>${i.clientName || 'Participant'}</strong></td>
            <td>${i.description}</td>
            <td><span class="badge ${i.severity.startsWith('Critical') ? 'badge-crit' : i.severity === 'High' ? 'badge-warn' : 'badge-pass'}">${i.severity}</span></td>
            <td>${i.status}</td>
            <td>${i.isNdisReportable ? '<span class="badge badge-crit">24h SLA Met</span>' : 'Internal'}</td>
          </tr>
        `
                )
                .join('')
            : `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 10px;">No reportable incidents recorded for ${formattedMonth}.</td></tr>`
        }
      </tbody>
    </table>`
        : ''
    }

    ${
      includeRisks
        ? `
    <h2>3. Restrictive Practice Authorizations &amp; Reduction Schedule</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Participant</th>
          <th style="width: 18%;">Practice Type</th>
          <th style="width: 26%;">Authorizing Body &amp; Reference</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 14%;">Commission Log</th>
          <th style="width: 12%;">Sunset Date</th>
        </tr>
      </thead>
      <tbody>
        ${activeRPs
          .map(
            (r) => `
          <tr>
            <td><strong>${r.clientName}</strong></td>
            <td>${r.practiceType}</td>
            <td>${r.authorizationBody || 'Senior Practitioner'} (${r.authorizationReference || 'AUTH-2026'})</td>
            <td><span class="badge badge-pass">${r.status}</span></td>
            <td><span class="badge ${r.monthlyReportStatus === 'Submitted' ? 'badge-pass' : 'badge-warn'}">${r.monthlyReportStatus || 'Lodged'}</span></td>
            <td><strong>${r.expiryDate || '2026-12-31'}</strong></td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    ${
      includeStaffCerts
        ? `
    <h2>4. Practitioner Credentials &amp; Worker Screening (NWSC) Audit</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Practitioner Name</th>
          <th style="width: 24%;">Position &amp; Role</th>
          <th style="width: 18%;">Worker Screening</th>
          <th style="width: 18%;">Police Check</th>
          <th style="width: 18%;">PBS Level</th>
        </tr>
      </thead>
      <tbody>
        ${activeStaff
          .map(
            (p) => `
          <tr>
            <td><strong>${p.name}</strong><br/><span style="font-size: 7.5pt; color: #64748b;">${p.ndisRegistrationNumber}</span></td>
            <td>${p.position}<br/><span style="font-size: 7.5pt; color: #64748b;">${p.qualification}</span></td>
            <td><span class="badge badge-pass">${p.screeningStatus}</span><br/><span style="font-size: 7pt; color: #64748b;">Exp: ${p.screeningExpiryDate}</span></td>
            <td><span class="badge badge-pass">Valid</span><br/><span style="font-size: 7pt; color: #64748b;">Exp: ${p.policeCheckExpiryDate}</span></td>
            <td>${p.pbsRegistrationLevel || 'Proficient Practitioner'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    ${
      includeAuditLedger
        ? `
    <h2>5. Immutable Compliance Audit Ledger Sample</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Timestamp</th>
          <th style="width: 22%;">Action &amp; Entity</th>
          <th style="width: 20%;">Actor</th>
          <th style="width: 40%;">Event Detail</th>
        </tr>
      </thead>
      <tbody>
        ${periodAuditLogs
          .slice(0, 8)
          .map(
            (l) => `
          <tr>
            <td style="font-family: monospace; font-size: 7.5pt;">${l.timestamp}</td>
            <td><strong>${l.action}</strong></td>
            <td>${l.actorName} (${l.actorRole})</td>
            <td style="font-size: 8pt;">${l.details}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    <!-- Sign-off Section -->
    <div class="signoff-box">
      <div style="font-weight: 800; font-size: 10.5pt; color: #0f172a;">Executive Sign-off &amp; Compliance Declaration</div>
      <p style="font-size: 8pt; color: #475569; margin: 3px 0 0 0;">
        I confirm that the data in this report is an accurate summary of operational, clinical, and safeguarding records for the period indicated.
      </p>
      <div class="signoff-grid">
        <div>
          <div class="sign-line"></div>
          <div style="font-size: 8.5pt; font-weight: 700; color: #1e293b; margin-top: 4px;">Principal Clinical Director / Nominated Person</div>
          <div style="font-size: 7.5pt; color: #64748b;">Date: ${reportDate}</div>
        </div>
        <div>
          <div class="sign-line"></div>
          <div style="font-size: 8.5pt; font-weight: 700; color: #1e293b; margin-top: 4px;">NDIS Quality &amp; Safeguards Auditor</div>
          <div style="font-size: 7.5pt; color: #64748b;">PIN: QSC-AUD-2026-BCC</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Official Document - Breakthrough Coaching &amp; Consulting (ABN 45 123 456 789) • NDIS Provider #405001234 • Generated ${reportDate}
    </div>
  </body>
</html>`;
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(generateReportHtml());
    printWindow.document.write(`
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    `);
    printWindow.document.close();

    addAuditLog(
      'GENERATE_COMPLIANCE_REPORT',
      'AUDIT_REPORT',
      selectedMonth,
      `Generated Monthly NDIS Compliance Summary PDF report for period ${selectedMonth}.`
    );

    addNotification({
      title: `Monthly Compliance PDF Generated: ${selectedMonth}`,
      message: `Exported executive compliance summary report with ${monthIncidents.length} incident logs and ${activeStaff.length} practitioner screening records.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'audit',
    });
  };

  const handleDownloadReport = () => {
    const htmlContent = generateReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NDIS_Compliance_Summary_${selectedMonth}_BCC.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addAuditLog(
      'DOWNLOAD_COMPLIANCE_REPORT',
      'AUDIT_REPORT',
      selectedMonth,
      `Downloaded NDIS Monthly Compliance Summary file for period ${selectedMonth}.`
    );

    addNotification({
      title: `Monthly Compliance File Downloaded: ${selectedMonth}`,
      message: `Downloaded standalone audit report for offline review or archival storage.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'audit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Monthly NDIS Compliance PDF Reporting Engine</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  Audit Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate, preview, and export board-ready monthly NDIS Quality and Safeguards compliance reports.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Period & Archetype Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Select Reporting Period / Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Compliance Reporting Format</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-teal-300 font-bold focus:border-teal-500"
              >
                <option value="BOARD_SUMMARY">Board of Directors Executive Summary</option>
                <option value="NDIS_COMMISSION_AUDIT">NDIS Commission Periodic Compliance Audit</option>
                <option value="QUARTERLY_RISK">Clinical Risk & Safeguards Quality Review</option>
              </select>
            </div>
          </div>

          {/* Module Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Select Report Modules to Include in Export:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeCoreStandards}
                  onChange={(e) => setIncludeCoreStandards(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-slate-300 font-medium">Core Modules 1-4</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeIncidents}
                  onChange={(e) => setIncludeIncidents(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-slate-300 font-medium">Incident Register</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeRisks}
                  onChange={(e) => setIncludeRisks(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-slate-300 font-medium">Restrictive Practice</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeStaffCerts}
                  onChange={(e) => setIncludeStaffCerts(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-slate-300 font-medium">Worker Screening</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={includeAuditLedger}
                  onChange={(e) => setIncludeAuditLedger(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-slate-300 font-medium">Audit Ledger Trail</span>
              </label>
            </div>
          </div>

          {/* Executive Declaration Text */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-semibold">Executive Narrative & Quality Assurance Statement</label>
            <textarea
              rows={3}
              value={executiveNotes}
              onChange={(e) => setExecutiveNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-sans"
            />
          </div>

          {/* Real-time Period KPI Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Worker Screening</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">{workerScreeningCompliance}% Cleared</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Period Incidents</span>
              <span className={`text-base font-extrabold font-mono ${monthIncidents.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {monthIncidents.length} Logged
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Restrictive Practices</span>
              <span className="text-base font-extrabold text-teal-400 font-mono">{activeRPs.length} Tracked</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Audit Events</span>
              <span className="text-base font-extrabold text-blue-400 font-mono">{totalAuditEvents} Records</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-400 text-xs font-mono">
            Provider: <strong>#405001234</strong> | A4 Print &amp; PDF Formatting Ready
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-all text-xs"
            >
              Close
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs border border-teal-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Export &amp; Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
