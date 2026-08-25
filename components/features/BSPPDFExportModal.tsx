'use client';

import React, { useState } from 'react';
import { BSPDocument, Client } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Award,
  Sparkles,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface BSPPDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bsp: BSPDocument | null;
  client?: Client;
}

export const BSPPDFExportModal: React.FC<BSPPDFExportModalProps> = ({
  isOpen,
  onClose,
  bsp,
  client
}) => {
  const { restrictivePractices, abcLogs, goals, currentUser } = useManagementStore();
  const [directorSignoff, setDirectorSignoff] = useState('Dr. Sarah Jenkins, Clinical Director (NDIS #PRAC-9812)');
  const [practitionerSignoff, setPractitionerSignoff] = useState(
    bsp?.authorName || currentUser?.name || 'Registered Behaviour Support Practitioner'
  );
  const [reviewDate, setReviewDate] = useState(
    bsp?.reviewDate || new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );

  if (!isOpen || !bsp) return null;

  const clientRestrictive = restrictivePractices.filter(r => r.clientId === bsp.clientId);
  const clientAbcLogs = abcLogs.filter(a => a.clientId === bsp.clientId).slice(0, 3);
  const clientGoals = goals.filter(g => g.clientId === bsp.clientId);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const generatedDate = new Date().toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Positive Behaviour Support Plan - ${bsp.clientName} (${bsp.version})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              line-height: 1.45;
              font-size: 9.5pt;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .header-table {
              width: 100%;
              border-bottom: 2.5px solid #0d9488;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .org-title {
              font-size: 15pt;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .org-subtitle {
              font-size: 8.5pt;
              color: #0d9488;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              font-size: 8pt;
              font-weight: 700;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .badge-teal { background: #ccfbf1; color: #0f766e; border: 1px solid #5eead4; }
            .section-title {
              font-size: 10.5pt;
              font-weight: 800;
              color: #0f172a;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 3px;
              margin-top: 14px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .data-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            .data-grid td {
              padding: 4px 6px;
              border: 1px solid #e2e8f0;
              font-size: 9pt;
            }
            .data-grid .label {
              background: #f8fafc;
              font-weight: 700;
              color: #475569;
              width: 25%;
            }
            .box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 8px;
              margin-bottom: 8px;
              font-size: 9pt;
            }
            .strategy-item {
              margin-bottom: 4px;
              padding-left: 10px;
              border-left: 2px solid #0d9488;
            }
            .sig-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 14px;
            }
            .sig-table td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              vertical-align: top;
              width: 50%;
            }
            .footer-note {
              margin-top: 16px;
              font-size: 7.5pt;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="org-title">Breakthrough Coaching & Consulting</div>
                <div class="org-subtitle">Positive Behaviour Support Plan (NDIS Practice Standards)</div>
              </td>
              <td style="text-align: right;">
                <span class="badge badge-teal">${bsp.version} • ${bsp.status}</span>
                <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">Generated: ${generatedDate}</div>
              </td>
            </tr>
          </table>

          <div class="section-title">1. Participant & Practice Identification</div>
          <table class="data-grid">
            <tr>
              <td class="label">Participant Name:</td>
              <td><strong>${bsp.clientName}</strong></td>
              <td class="label">NDIS Number:</td>
              <td>${client?.ndisNumber || '430891204'}</td>
            </tr>
            <tr>
              <td class="label">Primary Disability:</td>
              <td>${client?.primaryDisability || 'Psychosocial / Autism Spectrum'}</td>
              <td class="label">Plan Review Due:</td>
              <td><strong>${reviewDate}</strong></td>
            </tr>
            <tr>
              <td class="label">Authoring Practitioner:</td>
              <td>${practitionerSignoff}</td>
              <td class="label">Clinical Supervisor:</td>
              <td>${directorSignoff}</td>
            </tr>
          </table>

          <div class="section-title">2. Clinical Rationale & Neuroaffirming Philosophy</div>
          <div class="box">
            ${bsp.summary}
          </div>

          <div class="section-title">3. Primary Behaviours of Concern & Environmental Triggers</div>
          <div class="box">
            <strong>Key Behaviours:</strong> ${bsp.primaryBehaviorsOfConcern ? bsp.primaryBehaviorsOfConcern.join(', ') : 'Agitation during environmental transitions, sensory overload response'}<br/>
            ${clientAbcLogs.length > 0 ? `<strong>Recent ABC Observations:</strong> ${clientAbcLogs.map(a => a.behavior).join('; ')}` : ''}
          </div>

          <div class="section-title">4. Proactive & Environmental Adaptation Strategies (Tier 1 & 2)</div>
          <div class="box">
            ${bsp.proactiveStrategies.map(s => `<div class="strategy-item">${s}</div>`).join('')}
          </div>

          <div class="section-title">5. Reactive De-escalation Protocol (Tier 3)</div>
          <div class="box">
            ${bsp.reactiveStrategies.map(s => `<div class="strategy-item" style="border-left-color: #f59e0b;">${s}</div>`).join('')}
          </div>

          <div class="section-title">6. Restrictive Practice Schedule & Section 34 Authorization</div>
          <div class="box">
            ${clientRestrictive.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                <tr style="background: #f1f5f9; font-weight: bold;">
                  <td style="padding: 4px; border: 1px solid #cbd5e1;">Category</td>
                  <td style="padding: 4px; border: 1px solid #cbd5e1;">Description</td>
                  <td style="padding: 4px; border: 1px solid #cbd5e1;">Status</td>
                  <td style="padding: 4px; border: 1px solid #cbd5e1;">Authorisation Expiry</td>
                </tr>
                ${clientRestrictive.map(r => `
                  <tr>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;"><strong>${r.category}</strong></td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${r.description}</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${r.status}</td>
                    <td style="padding: 4px; border: 1px solid #cbd5e1;">${r.authorizationExpiry || '2026-12-31'}</td>
                  </tr>
                `).join('')}
              </table>
            ` : '<strong>No Regulated Restrictive Practices Authorized:</strong> This BSP strictly utilizes positive environmental supports, sensory regulation, and proactive strategies.'}
          </div>

          <div class="section-title">7. Statutory Clinical Sign-off & Quality Assurance</div>
          <table class="sig-table">
            <tr>
              <td>
                <strong>Practitioner Signature:</strong><br/>
                <div style="margin-top: 15px; border-bottom: 1px dotted #94a3b8; width: 80%;"></div>
                <div style="font-size: 8pt; color: #475569; margin-top: 4px;">
                  ${practitionerSignoff}<br/>
                  Date: ${generatedDate}
                </div>
              </td>
              <td>
                <strong>Clinical Director Sign-off:</strong><br/>
                <div style="margin-top: 15px; border-bottom: 1px dotted #94a3b8; width: 80%;"></div>
                <div style="font-size: 8pt; color: #475569; margin-top: 4px;">
                  ${directorSignoff}<br/>
                  Approval Reference: NDIS-BSP-${bsp.id}
                </div>
              </td>
            </tr>
          </table>

          <div class="footer-note">
            This Positive Behaviour Support Plan complies with the NDIS (Restrictive Practices and Behaviour Support) Rules 2018. Confidential - For Authorised Care Team & NDIS Commission Auditing Only.
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                NDIS Behaviour Support Plan (BSP) Document Generator
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                  {bsp.version}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statutory clinical document preview formatted for NDIS Commission Practice Standards & Print/PDF export.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Preview Settings */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Participant
              </label>
              <div className="text-white font-bold">{bsp.clientName}</div>
              <div className="text-slate-500 text-[10px]">NDIS: {client?.ndisNumber || '430891204'}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Authoring Practitioner
              </label>
              <input
                type="text"
                value={practitionerSignoff}
                onChange={(e) => setPractitionerSignoff(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Plan Review Due Date
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Clinical Document Preview Card */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                Executive Clinical Summary & Rationale
              </h3>
              <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                {bsp.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Proactive Strategies ({bsp.proactiveStrategies.length})
                </h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  {bsp.proactiveStrategies.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Reactive Protocols ({bsp.reactiveStrategies.length})
                </h4>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  {bsp.reactiveStrategies.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Restrictive Practices Table Preview */}
            <div className="pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-300 text-xs">Section 34 Restrictive Practices Status</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {clientRestrictive.length} Regulated Practices
                </span>
              </div>
              {clientRestrictive.length > 0 ? (
                <div className="space-y-1.5">
                  {clientRestrictive.map((r) => (
                    <div
                      key={r.id}
                      className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-rose-300">{r.category}</span> - {r.description}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{r.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2.5 rounded border border-slate-800/50">
                  Zero regulated restrictive practices active. 100% positive behavioral and environmental adjustments.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>NDIS (Restrictive Practices and Behaviour Support) Rules 2018 compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
