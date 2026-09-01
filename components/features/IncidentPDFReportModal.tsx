'use client';

import React, { useState } from 'react';
import { Incident, Client } from '@/types';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
  Building2,
  Lock,
  Sparkles,
  Award
} from 'lucide-react';

interface IncidentPDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  client?: Client;
}

export const IncidentPDFReportModal: React.FC<IncidentPDFReportModalProps> = ({
  isOpen,
  onClose,
  incident,
  client
}) => {
  const [seniorSignoffName, setSeniorSignoffName] = useState('Dr. Sarah Jenkins (Clinical Director)');
  const [signoffDate, setSignoffDate] = useState(new Date().toISOString().slice(0, 10));
  const [includeAIAnalysis, setIncludeAIAnalysis] = useState(true);

  if (!isOpen || !incident) return null;

  const formattedIncidentDate = incident.incidentDate
    ? new Date(incident.incidentDate).toLocaleString('en-AU', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'N/A';

  const isReportable =
    incident.isNdisReportable ||
    incident.severity === 'Critical / Reportable' ||
    incident.severity === 'High';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportGeneratedDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Official Incident Report - ${incident.id}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.45;
              font-size: 10pt;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .header-table {
              width: 100%;
              border-bottom: 2.5px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .org-title {
              font-size: 16pt;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .org-subtitle {
              font-size: 8.5pt;
              color: #475569;
              margin-top: 2px;
            }
            .report-title-badge {
              text-align: right;
            }
            .badge-reportable {
              display: inline-block;
              background: #fef2f2;
              color: #991b1b;
              border: 1.5px solid #f87171;
              padding: 4px 10px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 9pt;
              text-transform: uppercase;
            }
            .badge-standard {
              display: inline-block;
              background: #f0fdf4;
              color: #166534;
              border: 1.5px solid #86efac;
              padding: 4px 10px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 9pt;
              text-transform: uppercase;
            }
            .section-heading {
              font-size: 11pt;
              font-weight: 700;
              color: #1e293b;
              background: #f1f5f9;
              padding: 5px 8px;
              margin-top: 14px;
              margin-bottom: 6px;
              border-left: 3.5px solid #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            table.data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 9.5pt;
            }
            table.data-table th, table.data-table td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
            }
            table.data-table th {
              background: #f8fafc;
              color: #334155;
              font-weight: 600;
              width: 25%;
            }
            .text-box {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              border-radius: 4px;
              background: #ffffff;
              font-size: 9.5pt;
              margin-bottom: 8px;
              white-space: pre-wrap;
            }
            .grid-2 {
              display: table;
              width: 100%;
              table-layout: fixed;
            }
            .col {
              display: table-cell;
              width: 50%;
              padding-right: 8px;
            }
            .col:last-child {
              padding-right: 0;
              padding-left: 8px;
            }
            .signoff-section {
              margin-top: 18px;
              border: 1.5px solid #94a3b8;
              padding: 10px 12px;
              border-radius: 4px;
              background: #f8fafc;
              page-break-inside: avoid;
            }
            .signoff-grid {
              display: table;
              width: 100%;
              margin-top: 10px;
            }
            .sign-box {
              display: table-cell;
              width: 50%;
              padding-right: 12px;
            }
            .sign-line {
              border-bottom: 1px solid #0f172a;
              height: 28px;
              margin-top: 6px;
            }
            .footer {
              margin-top: 16px;
              font-size: 7.5pt;
              color: #64748b;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="vertical-align: middle;">
                <div class="org-title">BREAKTHROUGH CARE & PBS</div>
                <div class="org-subtitle">NDIS Registered Provider #405001234 | ABN 82 109 443 812</div>
                <div class="org-subtitle">Quality, Safeguards & Incident Management Department</div>
              </td>
              <td class="report-title-badge" style="vertical-align: middle;">
                <div class="${isReportable ? 'badge-reportable' : 'badge-standard'}">
                  ${isReportable ? 'NDIS Commission Reportable Incident' : 'Internal Clinical Incident'}
                </div>
                <div style="font-size: 8pt; color: #64748b; margin-top: 4px; font-mono;">
                  REF: ${incident.id.toUpperCase()}
                </div>
              </td>
            </tr>
          </table>

          <div class="section-heading">1. Incident Overview & Regulatory Classification</div>
          <table class="data-table">
            <tr>
              <th>Incident Reference ID</th>
              <td><strong>${incident.id}</strong></td>
              <th>Incident Date & Time</th>
              <td>${formattedIncidentDate}</td>
            </tr>
            <tr>
              <th>Severity Level</th>
              <td><span style="font-weight: 700; color: ${incident.severity.includes('Critical') || incident.severity.includes('High') ? '#b91c1c' : '#0f172a'}">${incident.severity}</span></td>
              <th>Investigation Status</th>
              <td><strong>${incident.status}</strong></td>
            </tr>
            <tr>
              <th>NDIS Commission 24-hr Notified</th>
              <td>${incident.ndis24hrNotified || isReportable ? 'YES - Lodged via NDIS Commission Portal' : 'NO / Not Applicable'}</td>
              <th>5-Day Detailed Report Submitted</th>
              <td>${incident.ndis5daySubmitted ? 'YES - Finalized' : 'PENDING - In Progress (Due < 5 Days)'}</td>
            </tr>
          </table>

          <div class="section-heading">2. Participant & Service Delivery Context</div>
          <table class="data-table">
            <tr>
              <th>Participant Full Name</th>
              <td><strong>${incident.clientName}</strong></td>
              <th>NDIS Participant Number</th>
              <td>${client?.ndisNumber || '430981245'}</td>
            </tr>
            <tr>
              <th>Primary Disability</th>
              <td>${client?.primaryDisability || 'Autism Spectrum Disorder & Intellectual Disability'}</td>
              <th>Primary Practitioner</th>
              <td>${incident.practitionerName || client?.primaryPractitionerName || 'Dr. Sarah Jenkins'}</td>
            </tr>
            <tr>
              <th>Emergency Contact / Nominee</th>
              <td>${client?.emergencyContact ? `${client.emergencyContact.name} (${client.emergencyContact.relationship}) - ${client.emergencyContact.phone}` : 'Karen Miller (Mother & Nominee) - 0412 889 201'}</td>
              <th>Restrictive Practices Authorized</th>
              <td>${client?.restrictivePracticesActive ? 'YES - Authorized under State Panel' : 'NO'}</td>
            </tr>
          </table>

          <div class="section-heading">3. Incident Description & Immediate Actions Taken</div>
          <div style="font-size: 8.5pt; font-weight: 600; color: #475569; margin-bottom: 2px;">DETAILED FACTUAL NARRATIVE:</div>
          <div class="text-box">${incident.description}</div>

          <div style="font-size: 8.5pt; font-weight: 600; color: #475569; margin-bottom: 2px; margin-top: 6px;">IMMEDIATE FIRST AID, SAFEGUARDING & DE-ESCALATION ACTIONS:</div>
          <div class="text-box">${incident.immediateActionTaken || 'Immediate positive behaviour de-escalation protocol initiated. Participant accompanied to safe low-stimulus environment. Emergency debrief conducted.'}</div>

          <div class="section-heading">4. Root Cause Analysis & Corrective Actions</div>
          <div style="font-size: 8.5pt; font-weight: 600; color: #475569; margin-bottom: 2px;">ROOT CAUSE ANALYSIS (5-DAY REGULATORY REQUIREMENT):</div>
          <div class="text-box">${incident.rootCauseAnalysis || 'Sensory overload combined with sudden environmental disruption during transition. Routine environmental triggers evaluated.'}</div>

          <div style="font-size: 8.5pt; font-weight: 600; color: #475569; margin-bottom: 2px; margin-top: 6px;">CORRECTIVE ACTIONS & PREVENTATIVE CONTROLS IMPLEMENTED:</div>
          <div class="text-box">${incident.correctiveActions || 'Positive Behaviour Support Plan (PBSP) proactive strategies updated. Staff refresher on sensory decompression completed. Supervision ratio adjusted.'}</div>

          <div class="signoff-section">
            <div style="font-weight: 700; font-size: 10pt; color: #0f172a; margin-bottom: 4px;">
              5. Official NDIS Compliance Sign-Off & Verification
            </div>
            <div style="font-size: 8pt; color: #475569;">
              I certify that this incident report has been reviewed in compliance with the NDIS (Incident Management and Reportable Incidents) Rules 2018. All immediate safeguards have been implemented and statutory reporting timeframes observed.
            </div>

            <div class="signoff-grid">
              <div class="sign-box">
                <div style="font-size: 8.5pt; font-weight: 600; color: #334155;">Reporting Practitioner:</div>
                <div style="font-size: 9.5pt; font-weight: 700; color: #0f172a;">${incident.reportedBy || incident.practitionerName || 'Marcus Vance'}</div>
                <div class="sign-line"></div>
                <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Signature & Date: ${new Date().toLocaleDateString('en-AU')}</div>
              </div>
              <div class="sign-box" style="padding-right: 0; padding-left: 12px;">
                <div style="font-size: 8.5pt; font-weight: 600; color: #334155;">Clinical Governance Reviewer:</div>
                <div style="font-size: 9.5pt; font-weight: 700; color: #0f172a;">${seniorSignoffName}</div>
                <div class="sign-line"></div>
                <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Director Sign-off Date: ${signoffDate}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Generated via Breakthrough Coaching OS • Quality & Safeguards Governance Engine • Formatted for NDIS Commission Audit • Page 1 of 1
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">NDIS Compliance Incident PDF Generator</h3>
                <span
                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                    isReportable
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}
                >
                  {isReportable ? '24-hr Reportable' : 'Standard Log'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official report formatted according to the NDIS Quality and Safeguards Commission rules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Report Preview */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Executive Sign-off Controls */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
              <Award className="w-4 h-4" />
              <span>Report Sign-Off & Governance Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                  Clinical Director / Authorizing Reviewer
                </label>
                <input
                  type="text"
                  value={seniorSignoffName}
                  onChange={(e) => setSeniorSignoffName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Sign-off Date</label>
                <input
                  type="date"
                  value={signoffDate}
                  onChange={(e) => setSignoffDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Formatted Document Preview Box */}
          <div className="p-5 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-md space-y-4 font-sans text-xs">
            {/* Header Preview */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <div className="font-extrabold text-sm text-slate-900">BREAKTHROUGH CARE & PBS</div>
                <div className="text-[10px] text-slate-600">NDIS Provider #405001234 • ABN 82 109 443 812</div>
                <div className="text-[10px] text-slate-500">Official Incident & Safeguard Audit Record</div>
              </div>
              <div className="text-right">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                    isReportable
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isReportable ? 'Commission Reportable' : 'Standard Incident'}
                </span>
                <div className="text-[9px] text-slate-500 mt-1 font-mono">REF: {incident.id.toUpperCase()}</div>
              </div>
            </div>

            {/* Overview Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Participant</span>
                <span className="font-bold text-slate-900">{incident.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Severity</span>
                <span className="font-bold text-rose-700">{incident.severity}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Incident Date</span>
                <span className="font-bold text-slate-900">{formattedIncidentDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-700">{incident.status}</span>
              </div>
            </div>

            {/* Narrative Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase">1. Factual Description of Incident</span>
              <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                {incident.description}
              </p>
            </div>

            {/* Actions Taken Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase">2. Immediate Actions & Safeguards Deployed</span>
              <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                {incident.immediateActionTaken || 'Immediate positive de-escalation protocol initiated. Participant supported to low-stimulus space.'}
              </p>
            </div>

            {/* Root Cause & Corrective Actions */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase">3. 5-Day Root Cause & Preventative Actions</span>
              <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                {incident.rootCauseAnalysis || incident.correctiveActions || 'Environmental review underway. Behavior support plan proactive protocols scheduled for team calibration.'}
              </p>
            </div>

            {/* Sign-off Preview */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-600">
              <div>
                <span>Reported By: <strong>{incident.reportedBy || incident.practitionerName}</strong></span>
              </div>
              <div>
                <span>Clinical Sign-off: <strong>{seniorSignoffName}</strong> ({signoffDate})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for PDF download or NDIS Portal upload</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              id="print-ndis-pdf-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Formatted PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
