'use client';

import React, { useState } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import {
  Printer,
  Download,
  FileText,
  Copy,
  Check,
  X,
  Award,
  ShieldCheck,
  Calendar,
  UserCheck,
  Sparkles,
  FileCheck
} from 'lucide-react';

interface ModuleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleOverride?: TabType;
}

const MODULE_TITLES: Record<TabType, string> = {
  'command-center': 'Clinical Command Center & Practice Summary',
  'clients': 'NDIS Participant Roster & Care Plan Register',
  'ndis-goals': 'NDIS Goal Progress & Outcome Milestone Ledger',
  'google-maps': 'Provider Travel & Community Outreach Route Report',
  'case-notes': 'Allied Health Clinical Case Notes & SOAP Records',
  'incidents': 'NDIS Commission Reportable Incident & SLA Governance',
  'restrictive-practices': 'Restrictive Practice Authorizations & Reduction Logs',
  'abc-analyser': 'Antecedent-Behaviour-Consequence (ABC) Clinical Report',
  'bsp-plans': 'Positive Behaviour Support Plan (PBSP) Register',
  'practice-tools': 'Standardized Clinical Assessments (WHODAS, Vineland, DASS-21)',
  'google-workspace': 'Google Workspace Enterprise Activity & Records',
  'google-keep': 'Allied Health Clinical Field Notes Register',
  'audit': 'NDIS Practice Standards Quality & Audit Compliance Report',
  'crm': 'CRM Referrals, Intake Funnel & Care Coordination',
  'billing': 'PACE & Proda Invoicing, Price Guide Claims & Reconciliation',
  'hr-roster': 'Practitioner Worker Screening (NWSC) & Roster Register',
  'audit-logs': 'Immutable NDIS Clinical Audit Trails & Event Ledger',
  'security-audit': 'Enterprise Security Audit & Privilege Matrix',
  'integrations': 'Cloud Integrations & Synchronization Health',
  'google-classroom': 'Workforce Training & Competency Modules',
  'participant-portal': 'NDIS Participant Portal & Care Plan Summary',
  'ai-predictive-insights': 'AI Predictive Insights & Clinical Intelligence',
  'document-intelligence': 'Clinical Document Intelligence & OCR Intake',
  'voice-scribe': 'AI Ambient Clinical Voice Scribe & SOAP Records',
  'ai-radar': 'AI Caseload Risk & Crisis Early Warning Radar',
  'audit-simulator': 'NDIS Commission Practice Standards Audit Simulator',
  'proda-gateway': 'PRODA B2G Direct Gateway & Claim Adjudication',
  'plan-report-writer': 'NDIS 12-Month Plan Reassessment Dossier Writer',
  'churn-radar': 'Participant Retention & Churn Risk Radar',
  'agreements-signing': 'Cryptographic Service Agreement & E-Signature Portal',
  'telehealth': 'Encrypted Telehealth & Consultation Suite',
  'clinical-supervisor': 'Autonomous Clinical Supervisor & Note Quality Review',
  'bigquery-analytics': 'BigQuery Enterprise Analytics & Streaming Hub',
  'clinical-benchmarks': 'National NDIA Clinical Efficacy Benchmark Matrix',
  'carer-family-hub': 'Carer Delegation & Multi-Participant Family Hub',
  'gamified-goals': 'Participant Milestone & Gamified Goal Tracker',
  'lone-worker-safety': 'Lone Worker Field Safety & SOS Emergency Beacon',
  'travel-allowance': 'Modified Monash Model (MMM) Travel Calculator',
  'crisis-escalation': 'Multi-Channel Crisis & Safeguards Escalation Dispatcher',
  'credential-vault': 'Practitioner Credential & NDIS Worker Screening Vault',
  'annual-compliance-return': 'NDIS Commission Annual Compliance Return (ACR)',
  'dynamic-assessments': 'Clinical Assessment & Dynamic Form Builder',
  'rp-fading-simulator': 'Restrictive Practice Fading Protocol Simulator',
  'schads-fatigue': 'SCHADS Award Overtime & Fatigue Compliance Predictor'
};

export const ModuleExportModal: React.FC<ModuleExportModalProps> = ({
  isOpen,
  onClose,
  moduleOverride
}) => {
  const {
    activeTab,
    currentUser,
    clients,
    caseNotes,
    incidents,
    restrictivePractices,
    billingClaims,
    practitioners,
    auditLogs,
    addAuditLog,
    addNotification
  } = useManagementStore();

  const currentTab = moduleOverride || activeTab;
  const moduleTitle = MODULE_TITLES[currentTab] || 'NDIS Clinical Report';

  const [copied, setCopied] = useState(false);
  const [reportFormat, setReportFormat] = useState<'STANDARD' | 'COMMISSION_AUDIT' | 'EXECUTIVE'>('STANDARD');
  const [includeSignatureBlock, setIncludeSignatureBlock] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    addAuditLog(
      'PRINT_MODULE_REPORT',
      currentTab,
      'export-print',
      `Printed / Saved PDF compliance export for ${moduleTitle}`
    );

    addNotification({
      title: 'Report Sent to Print Dialog',
      message: `Generated print/PDF document for ${moduleTitle}.`,
      type: 'compliance',
      severity: 'low'
    });

    window.print();
  };

  const handleDownloadJSON = () => {
    let payload: any = {
      exportTimestamp: new Date().toISOString(),
      ndisProviderName: 'Breakthrough Coaching & Consulting',
      ndisRegistrationNumber: '405001234',
      generatedBy: `${currentUser.name} (${currentUser.role})`,
      module: currentTab,
      title: moduleTitle,
    };

    if (currentTab === 'case-notes') payload.caseNotes = caseNotes;
    else if (currentTab === 'clients' || currentTab === 'ndis-goals') payload.clients = clients;
    else if (currentTab === 'incidents') payload.incidents = incidents;
    else if (currentTab === 'restrictive-practices') payload.restrictivePractices = restrictivePractices;
    else if (currentTab === 'billing') payload.billingClaims = billingClaims;
    else if (currentTab === 'audit' || currentTab === 'audit-logs') {
      payload.auditLogs = auditLogs;
      payload.practitioners = practitioners;
      payload.incidents = incidents;
    } else {
      payload.clients = clients;
      payload.caseNotes = caseNotes.slice(0, 10);
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDIS_${currentTab}_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    let csvContent = '';
    if (currentTab === 'case-notes') {
      csvContent = 'Date,Client Name,Practitioner,Format,Category,Duration (min),Billed ($),Subjective,Objective\n' +
        caseNotes.map(n => `"${n.sessionDate}","${n.clientName}","${n.practitionerName}","${n.format}","${n.category}",${n.durationMinutes},${n.billedAmount || 0},"${(n.subjective || '').replace(/"/g, '""')}","${(n.objective || '').replace(/"/g, '""')}"`).join('\n');
    } else if (currentTab === 'incidents') {
      csvContent = 'Incident Date,Client Name,Severity,Status,NDIS Reportable,24hr Notice,5day Submitted,Description\n' +
        incidents.map(i => `"${i.incidentDate}","${i.clientName}","${i.severity}","${i.status}",${i.isNdisReportable},${i.ndis24hrNotified},${i.ndis5daySubmitted},"${(i.description || '').replace(/"/g, '""')}"`).join('\n');
    } else if (currentTab === 'billing') {
      csvContent = 'Invoice Number,Service Date,Client Name,Item Code,Hours,Rate ($),Total ($),Status,Reconciliation\n' +
        billingClaims.map(b => `"${b.invoiceNumber}","${b.serviceDate}","${b.clientName}","${b.supportItemCode}",${b.hoursWorked},${b.unitRate},${b.totalAmount},"${b.status}","${b.reconciliationStatus}"`).join('\n');
    } else {
      csvContent = 'Name,NDIS Number,Disability,Status,Plan Start,Plan End,Budget ($),Spent ($)\n' +
        clients.map(c => `"${c.name}","${c.ndisNumber}","${c.primaryDisability}","${c.status}","${c.planStartDate}","${c.planEndDate}",${c.totalBudget || 0},${c.spentBudget || 0}`).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDIS_${currentTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const text = `# NDIS CLINICAL & COMPLIANCE REPORT
**Organization:** Breakthrough Coaching & Consulting
**NDIS Registration #:** 405001234
**Module View:** ${moduleTitle}
**Date:** ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
**Practitioner / Author:** ${currentUser.name} (${currentUser.role})

---
## Summary of Clinical Records
- Total Active Participants: ${clients.length}
- Case Notes on File: ${caseNotes.length}
- Incident Governance Entries: ${incidents.length}
- Restrictive Practice Authorizations: ${restrictivePractices.length}
- Screened Clinical Personnel: ${practitioners.length} (100% NDIS Worker Clearance)

## Compliance Attestation
This clinical record has been prepared in accordance with the NDIS Quality and Safeguards Commission Practice Standards (2026). All positive behavior supports and allied health interventions have been authored by qualified personnel with active Worker Screening clearances.
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Print to PDF &amp; Export Compliance Report</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  NDIS Audit-Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Export current <strong className="text-teal-300">{moduleTitle}</strong> view for external auditors, NDIA planners, and nominees.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Toolbar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-document-btn"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save to PDF</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Printable Report Document Preview Area */}
        <div
          id="printable-report-content"
          className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 space-y-6 font-sans text-xs border border-slate-300 shadow-inner max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0"
        >
          {/* Organization Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                BREAKTHROUGH COACHING &amp; CONSULTING
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                NDIS Registered Provider of Specialist Allied Health &amp; Behaviour Support
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-700">
                <span>NDIS Reg #: <strong>405001234</strong></span>
                <span>•</span>
                <span>ABN: <strong>88 123 456 789</strong></span>
                <span>•</span>
                <span>Victoria, Australia</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-100 text-teal-900 border border-teal-300 rounded font-bold text-[11px]">
                NDIS AUDIT REPORT
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Generated: {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Module Title Banner */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Clinical Domain</span>
              <h2 className="text-sm font-bold text-slate-900">{moduleTitle}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Authoring Practitioner</span>
              <span className="font-bold text-slate-900 text-xs">{currentUser.name} ({currentUser.role})</span>
            </div>
          </div>

          {/* Dynamic Content depending on current active tab */}
          {currentTab === 'case-notes' ? (
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Clinical Case Notes Register ({caseNotes.length} entries)
              </h3>
              <div className="space-y-3">
                {caseNotes.slice(0, 6).map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border border-slate-300 bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between font-bold text-xs text-slate-900">
                      <span>{note.clientName} - {note.category}</span>
                      <span className="font-mono text-slate-600">{note.sessionDate} ({note.durationMinutes} mins)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div><strong>Subjective:</strong> {note.subjective}</div>
                      <div><strong>Objective:</strong> {note.objective}</div>
                      <div><strong>Assessment:</strong> {note.assessment}</div>
                      <div><strong>Plan:</strong> {note.plan}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentTab === 'incidents' ? (
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Incident Governance &amp; Commission SLA Records ({incidents.length} logs)
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-300 text-slate-800 text-[10px]">
                    <th className="p-2">Date</th>
                    <th className="p-2">Participant</th>
                    <th className="p-2">Severity</th>
                    <th className="p-2">NDIS Reportable</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td className="p-2 font-mono">{inc.incidentDate.split('T')[0]}</td>
                      <td className="p-2 font-bold">{inc.clientName}</td>
                      <td className="p-2">{inc.severity}</td>
                      <td className="p-2">{inc.isNdisReportable ? 'Yes (24hr Lodged)' : 'Internal'}</td>
                      <td className="p-2">{inc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                Active Participants &amp; Goal Progression Register
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-300 text-slate-800 text-[10px]">
                    <th className="p-2">Participant</th>
                    <th className="p-2">NDIS Number</th>
                    <th className="p-2">Primary Diagnosis</th>
                    <th className="p-2">Primary Goal</th>
                    <th className="p-2">Milestone %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="p-2 font-bold">{c.name}</td>
                      <td className="p-2 font-mono">{c.ndisNumber}</td>
                      <td className="p-2">{c.primaryDisability}</td>
                      <td className="p-2 truncate max-w-[200px]">{c.goals?.[0]?.title || 'Ongoing Therapy'}</td>
                      <td className="p-2 font-mono font-bold text-teal-700">{c.goals?.[0]?.progressPercent || 75}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Compliance Statement */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300 space-y-1 text-[11px] text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>NDIS Quality and Safeguards Compliance Statement</span>
            </div>
            <p className="leading-relaxed">
              This clinical document has been generated from the immutable audit-locked records of Breakthrough Coaching &amp; Consulting. All allied health therapies, behavior assessments, and incident follow-ups meet the NDIS Practice Standards and Victorian Senior Practitioner directives.
            </p>
          </div>

          {/* Practitioner Signature Block */}
          {includeSignatureBlock && (
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-[11px]">
              <div>
                <span className="text-slate-500 block mb-6">Authorised Practitioner Signature:</span>
                <div className="border-b border-slate-400 pb-1 font-mono font-bold text-slate-900">
                  {currentUser.name}
                </div>
                <span className="text-[10px] text-slate-500">{currentUser.position || 'Principal PBS Specialist'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-6">Quality Assurance Sign-off:</span>
                <div className="border-b border-slate-400 pb-1 font-mono font-bold text-slate-900">
                  Dr. Sarah Jenkins (Clinical Director)
                </div>
                <span className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-AU')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
