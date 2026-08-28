'use client';

import React, { useState, useMemo } from 'react';
import { CaseNote, Client } from '@/types';
import {
  X,
  FileCheck,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  FileText,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

interface ClinicalNotesPDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNotes: CaseNote[];
  clients: Client[];
  initialClientId?: string;
}

export const ClinicalNotesPDFExportModal: React.FC<ClinicalNotesPDFExportModalProps> = ({
  isOpen,
  onClose,
  caseNotes,
  clients,
  initialClientId
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || clients[0]?.id || 'cli-101'
  );
  const [reportTitle, setReportTitle] = useState<string>('NDIS Plan Review & Clinical Progress Report');
  const [includeProviderSignature, setIncludeProviderSignature] = useState<boolean>(true);
  const [includeNDISPracticeHeader, setIncludeNDISPracticeHeader] = useState<boolean>(true);
  const [includeGoalOutcomes, setIncludeGoalOutcomes] = useState<boolean>(true);
  const [clinicalRecommendations, setClinicalRecommendations] = useState<string>(
    'Recommend continuation of NDIS Core and Capacity Building Improved Daily Living supports at 2 hours per fortnight for ongoing skill acquisition, emotional regulation routines, and functional independence.'
  );

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Notes filtered for the selected participant
  const clientNotes = useMemo(() => {
    return caseNotes.filter((n) => n.clientId === selectedClientId);
  }, [caseNotes, selectedClientId]);

  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>(() => {
    return clientNotes.map((n) => n.id);
  });

  // Keep selected notes synchronized when participant changes
  React.useEffect(() => {
    setSelectedNoteIds(clientNotes.map((n) => n.id));
  }, [selectedClientId, clientNotes]);

  const toggleSelectAll = () => {
    if (selectedNoteIds.length === clientNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(clientNotes.map((n) => n.id));
    }
  };

  const toggleNoteSelection = (id: string) => {
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(selectedNoteIds.filter((item) => item !== id));
    } else {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const selectedNotesToExport = useMemo(() => {
    return clientNotes.filter((n) => selectedNoteIds.includes(n.id));
  }, [clientNotes, selectedNoteIds]);

  if (!isOpen) return null;

  const handlePrintOrSavePDF = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${reportTitle} - ${selectedClient?.name}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 16mm 18mm 16mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 11pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-table td {
            vertical-align: top;
          }
          .org-title {
            font-size: 16pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .org-sub {
            font-size: 9pt;
            color: #475569;
            margin-top: 2px;
          }
          .report-badge {
            text-align: right;
          }
          .badge {
            display: inline-block;
            background: #f0fdfa;
            border: 1px solid #99f6e4;
            color: #0f766e;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9pt;
            font-weight: bold;
          }
          .participant-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .grid-2 {
            display: table;
            width: 100%;
          }
          .grid-cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            font-size: 9.5pt;
          }
          .grid-cell p {
            margin: 3px 0;
          }
          .section-heading {
            font-size: 12pt;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 22px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .note-item {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
            margin-bottom: 14px;
            page-break-inside: avoid;
            background: #ffffff;
          }
          .note-header {
            display: table;
            width: 100%;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .note-date {
            display: table-cell;
            font-weight: 700;
            color: #0f766e;
            font-size: 10pt;
          }
          .note-practitioner {
            display: table-cell;
            text-align: right;
            font-size: 9pt;
            color: #64748b;
          }
          .soap-row {
            margin-bottom: 6px;
            font-size: 9.5pt;
          }
          .soap-label {
            font-weight: 700;
            color: #334155;
            display: inline-block;
            width: 110px;
          }
          .soap-text {
            color: #1e293b;
          }
          .goals-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 16px;
            font-size: 9pt;
          }
          .rec-box {
            background: #faf5ff;
            border: 1px solid #e9d5ff;
            border-radius: 6px;
            padding: 12px 14px;
            margin-top: 18px;
            font-size: 9.5pt;
            color: #3b0764;
          }
          .signatures {
            margin-top: 32px;
            display: table;
            width: 100%;
            page-break-inside: avoid;
          }
          .sig-box {
            display: table-cell;
            width: 48%;
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            font-size: 9pt;
            color: #475569;
          }
          .sig-space {
            display: table-cell;
            width: 4%;
          }
          .footer-note {
            margin-top: 24px;
            font-size: 8pt;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        ${
          includeNDISPracticeHeader
            ? `
          <table class="header-table">
            <tr>
              <td>
                <h1 class="org-title">Breakthrough Allied Health & NDIS Operations</h1>
                <div class="org-sub">
                  NDIS Practice Registration Group: 0128 / 0115 / 0107 &bull; Provider ID: 405001234<br/>
                  Quality & Safeguards Commission Practice Standards Compliant
                </div>
              </td>
              <td class="report-badge">
                <div class="badge">OFFICIAL CLINICAL RECORD</div>
                <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">
                  Generated: ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </td>
            </tr>
          </table>
        `
            : ''
        }

        <div class="participant-card">
          <div class="grid-2">
            <div class="grid-cell">
              <p><strong>Participant Name:</strong> ${selectedClient?.name || 'N/A'}</p>
              <p><strong>NDIS Number:</strong> ${selectedClient?.ndisNumber || '430000000'}</p>
              <p><strong>Plan Category:</strong> ${selectedClient?.planType || 'Plan Managed'}</p>
            </div>
            <div class="grid-cell">
              <p><strong>Plan Dates:</strong> ${selectedClient?.planStartDate || '2026-01-01'} to ${selectedClient?.planEndDate || '2026-12-31'}</p>
              <p><strong>Primary Disability:</strong> ${selectedClient?.primaryDisability || (selectedClient as any)?.diagnosis || 'Autism Spectrum Disorder / Psychosocial Support'}</p>
              <p><strong>Report Reference:</strong> NDIS-PR-${Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>

        ${
          includeGoalOutcomes && selectedClient?.goals && selectedClient.goals.length > 0
            ? `
          <div class="section-heading">Funded Goal Progress & GAS Ratings</div>
          <div class="goals-box">
            ${selectedClient.goals
              .map(
                (g) => `
              <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0;">
                <strong>${g.title}</strong> (${g.category}) &mdash; 
                <span style="color: #0f766e; font-weight: bold;">${g.progressPercent}% Achieved</span> 
                [Status: ${g.status} | Target: ${g.targetDate}]
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="section-heading">Clinical Progress Notes & Session Evidentiary Trail (${selectedNotesToExport.length} Notes)</div>

        ${
          selectedNotesToExport.length === 0
            ? '<p style="font-size: 10pt; color: #64748b; font-style: italic;">No clinical case notes selected for this report.</p>'
            : selectedNotesToExport
                .map(
                  (note) => `
            <div class="note-item">
              <div class="note-header">
                <span class="note-date">Session Date: ${note.date} (${note.format || 'SIMPL'})</span>
                <span class="note-practitioner">Practitioner: ${note.practitionerName || 'Allied Health Practitioner'}</span>
              </div>
              <div class="soap-row">
                <span class="soap-label">Situation/Subjective:</span>
                <span class="soap-text">${note.subjective || 'N/A'}</span>
              </div>
              <div class="soap-row">
                <span class="soap-label">Intervention/Objective:</span>
                <span class="soap-text">${note.objective || 'N/A'}</span>
              </div>
              <div class="soap-row">
                <span class="soap-label">Measurement/Assessment:</span>
                <span class="soap-text">${note.assessment || 'N/A'}</span>
              </div>
              <div class="soap-row">
                <span class="soap-label">Plan & Next Steps:</span>
                <span class="soap-text">${note.plan || 'N/A'}</span>
              </div>
            </div>
          `
                )
                .join('')
        }

        <div class="section-heading">Clinical Recommendations for NDIS Review</div>
        <div class="rec-box">
          <strong>Summary & Recommendations:</strong><br/>
          ${clinicalRecommendations}
        </div>

        ${
          includeProviderSignature
            ? `
          <div class="signatures">
            <div class="sig-box">
              <strong>Reporting Allied Health Clinician:</strong><br/><br/>
              Signature: ___________________________<br/>
              Name: ${(selectedNotesToExport[0]?.practitionerName) || 'Allied Health Practitioner'}<br/>
              Date: ${new Date().toLocaleDateString('en-AU')}
            </div>
            <div class="sig-space"></div>
            <div class="sig-box">
              <strong>Clinical Director / Practice Supervisor:</strong><br/><br/>
              Signature: ___________________________<br/>
              Name: Dr. Eleanor Vance (Clinical Supervisor)<br/>
              Date: ${new Date().toLocaleDateString('en-AU')}
            </div>
          </div>
        `
            : ''
        }

        <div class="footer-note">
          CONFIDENTIAL NDIS PROGRESS REPORT &bull; Breakthrough Allied Health Practice Management &bull; Generated for NDIA Review & Plan Transition
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Export Formatted NDIS Clinical Case Notes Report
              </h3>
              <p className="text-xs text-slate-400">
                Compile selected case notes into an audit-compliant PDF document for NDIA Plan Reviews
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Participant Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Select Participant</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id} - NDIS: {c.ndisNumber || '430...'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Report Document Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="e.g. NDIS Plan Review & Clinical Progress Report"
              />
            </div>
          </div>

          {/* Report Customization Options */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-slate-200 block">Compliance & Header Inclusions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeNDISPracticeHeader}
                  onChange={(e) => setIncludeNDISPracticeHeader(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500"
                />
                <span>Practice Registration Header</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeGoalOutcomes}
                  onChange={(e) => setIncludeGoalOutcomes(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500"
                />
                <span>Funded Goal Progress & GAS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeProviderSignature}
                  onChange={(e) => setIncludeProviderSignature(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500"
                />
                <span>Sign-off & Supervisor Signatures</span>
              </label>
            </div>
          </div>

          {/* Case Notes Multi-Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-2">
                <span>Select Clinical Notes to Include in PDF</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  {selectedNoteIds.length} of {clientNotes.length} selected
                </span>
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-bold underline"
              >
                {selectedNoteIds.length === clientNotes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950">
              {clientNotes.length === 0 ? (
                <div className="p-4 text-center text-slate-500 italic">
                  No case notes logged for this participant yet.
                </div>
              ) : (
                clientNotes.map((note) => {
                  const isChecked = selectedNoteIds.includes(note.id);
                  return (
                    <div
                      key={note.id}
                      onClick={() => toggleNoteSelection(note.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-teal-950/30 border-teal-500/40 text-slate-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-teal-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-[11px]">
                            Session: {note.date} ({note.format || 'SIMPL'})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {note.practitionerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                          {note.subjective}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">
              Clinical Recommendation for NDIS Planner Review
            </label>
            <textarea
              rows={3}
              value={clinicalRecommendations}
              onChange={(e) => setClinicalRecommendations(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-teal-500 font-sans"
              placeholder="Enter clinical rationale, recommended funding hours, and therapy milestones..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedNotesToExport.length === 0}
            onClick={handlePrintOrSavePDF}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Print NDIS Report PDF ({selectedNotesToExport.length} Notes)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
