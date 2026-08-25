'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { MonthlyIncidentTrendReport } from './MonthlyIncidentTrendReport';
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  FileCheck,
  Download,
  Printer,
  Mail,
  BrainCircuit,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Lock,
  ArrowRight,
  Check
} from 'lucide-react';
import { Incident, Client } from '@/types';
import { IncidentPDFReportModal } from './IncidentPDFReportModal';
import { advanceIncidentWorkflow } from '@/lib/complianceService';

const WORKFLOW_STEPS = ['Open', 'Investigating', 'Clinical Review', 'Director Sign-off', 'Closed'];

export const IncidentsModule: React.FC = () => {
  const { incidents, clients, currentUser, addIncident, updateIncidentStatus, setActiveTab, addAuditLog, addNotification } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIncidentForPDF, setSelectedIncidentForPDF] = useState<Incident | null>(null);
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [aiAssessments, setAiAssessments] = useState<Record<string, string>>({});
  const [isAssessing, setIsAssessing] = useState<Record<string, boolean>>({});
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [escalationToast, setEscalationToast] = useState<{
    show: boolean;
    clientName: string;
    severity: string;
  } | null>(null);

  const getStepIndex = (status: string) => {
    if (status === 'Investigating' || status === 'Under Investigation') return 1;
    if (status === 'Clinical Review') return 2;
    if (status === 'Director Sign-off') return 3;
    if (status === 'Closed' || status === 'Resolved') return 4;
    return 0;
  };

  const handleAdvanceWorkflow = (incident: Incident) => {
    setWorkflowError(null);
    const currentIdx = getStepIndex(incident.status);
    if (currentIdx >= 4) return;

    const nextStatus = WORKFLOW_STEPS[currentIdx + 1];

    try {
      const result = advanceIncidentWorkflow(
        incident.id,
        incident.status,
        nextStatus,
        {
          uid: currentUser?.id || 'prac-1',
          name: currentUser?.name || 'Practitioner',
          role: currentUser?.role || 'PRACTITIONER'
        },
        incident
      );

      updateIncidentStatus(incident.id, result.newStatus as any);

      addAuditLog(
        'INCIDENT_WORKFLOW_ADVANCED',
        'INCIDENTS',
        incident.id,
        `Advanced incident ${incident.id} from "${incident.status}" to "${result.newStatus}" by ${currentUser.name} (${currentUser.role}).`
      );

      addNotification({
        title: `Incident Workflow: ${incident.clientName}`,
        message: `Status transitioned to "${result.newStatus}".`,
        type: 'incident',
        severity: result.newStatus === 'Closed' ? 'success' : 'info',
        linkTab: 'incidents'
      });
    } catch (err: any) {
      setWorkflowError(err.message);
      if (err.message.includes('ADMIN')) {
        addNotification({
          title: 'Sign-off Restricted',
          message: 'Final incident closure sign-off requires Clinical Director (ADMIN) authorisation under NDIS rules.',
          type: 'incident',
          severity: 'high',
          linkTab: 'incidents'
        });
      }
    }
  };

  const handleGenerateAssessment = async (incident: Incident) => {
    setIsAssessing(prev => ({ ...prev, [incident.id]: true }));
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this incident report for NDIS regulatory compliance risks and suggest immediate mitigation steps.\nParticipant: ${incident.clientName}\nSeverity: ${incident.severity}\nDescription: ${incident.description}\nAction Taken: ${incident.immediateActionTaken}\n\nProvide a concise 2-paragraph response outlining the regulatory risk (e.g. NDIS Commission reportable timeframe) and next steps.`,
          model: 'gemini-3.5-flash'
        }),
      });
      const data = await response.json();
      setAiAssessments(prev => ({ ...prev, [incident.id]: data.text }));
    } catch (err) {
      console.error(err);
      setAiAssessments(prev => ({ ...prev, [incident.id]: "Failed to generate AI Risk Assessment." }));
    } finally {
      setIsAssessing(prev => ({ ...prev, [incident.id]: false }));
    }
  };
  const [severity, setSeverity] = useState<Incident['severity']>('High');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Day Program Facility');
  const [actionTaken, setActionTaken] = useState('');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj || !description) return;

    const isHighOrCritical =
      severity === 'High' ||
      severity === 'Critical / Reportable' ||
      severity.includes('High') ||
      severity.includes('Critical');

    addIncident({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      incidentDate: new Date().toISOString(),
      severity,
      description,
      immediateActionTaken: actionTaken || 'Immediate safety plan activated & manager debriefed.',
      reportedBy: currentUser?.name || 'Practitioner Context',
      status: 'Open',
      isNdisReportable: severity === 'Critical / Reportable',
      ndis24hrNotified: severity === 'Critical / Reportable',
      ndis5daySubmitted: false,
      practitionerId: currentUser?.practitionerId || 'p1',
      practitionerName: currentUser?.name || 'System User',
    });

    if (isHighOrCritical) {
      setEscalationToast({
        show: true,
        clientName: selectedClientObj.name,
        severity,
      });
      setTimeout(() => {
        setEscalationToast(null);
      }, 7000);
    }

    setIsAdding(false);
    setDescription('');
    setActionTaken('');
  };

  // Export Incidents to CSV
  const exportIncidentsCSV = () => {
    const headers = [
      'Incident ID',
      'Incident Date',
      'Participant Name',
      'Severity',
      'Location',
      'Description',
      'Action Taken',
      'NDIS Commission Notified',
      'Status'
    ];

    const rows = incidents.map((inc: Incident) => [
      `"${inc.id}"`,
      `"${inc.incidentDate}"`,
      `"${inc.clientName}"`,
      `"${inc.severity}"`,
      `""`,
      `"${inc.description.replace(/"/g, '""')}"`,
      `"${inc.immediateActionTaken.replace(/"/g, '""')}"`,
      inc.isNdisReportable ? 'Yes' : 'No',
      `"${inc.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: (string | boolean | number)[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NDIS-Incident-Register-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Incidents PDF Report
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Official Incident & Compliance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
            .header-info { margin-bottom: 20px; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .critical { color: #e11d48; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Breakthrough Coaching OS - NDIS Official Incident Register</h1>
          <div class="header-info">
            <p><strong>NDIS Practice Registration:</strong> 405001234 | <strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Compliance Standard:</strong> NDIS Incident Management and Reportable Incidents Rules 2018</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Participant</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Description</th>
                <th>Action Taken</th>
                <th>Commission Notified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${incidents
                .map(
                  (i: Incident) => `
                <tr>
                  <td>${new Date(i.incidentDate).toLocaleDateString()}</td>
                  <td>${i.clientName}</td>
                  <td class="${i.severity === 'Critical / Reportable' ? 'critical' : ''}">${i.severity}</td>
                  <td>N/A</td>
                  <td>${i.description}</td>
                  <td>${i.immediateActionTaken}</td>
                  <td>${i.isNdisReportable ? 'YES (24-hr Logged)' : 'NO'}</td>
                  <td>${i.status}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Generated via Breakthrough OS Quality & Safeguards Governance Engine. Confidential NDIS Record.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Incident & Quality Governance Register</h2>
            <p className="text-xs text-slate-400">
              Compliant with NDIS Incident Management and Reportable Incidents Rules 2018. Multi-Step Sign-Off Enforced.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={exportIncidentsCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Export Incidents CSV"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Print PDF Incident Register"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Print PDF</span>
          </button>

          {!isViewer && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Workflow Error Banner */}
      {workflowError && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center justify-between gap-2">
          <span>{workflowError}</span>
          <button onClick={() => setWorkflowError(null)} className="p-1 text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Automated Escalation Toast */}
      {escalationToast && escalationToast.show && (
        <div className="p-4 bg-rose-950/90 border border-rose-500/50 rounded-xl flex items-start justify-between gap-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Automated Escalation Workflow Dispatched
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                  {escalationToast.severity}
                </span>
              </div>
              <p className="text-xs text-slate-200">
                High-priority incident notification for <span className="font-bold text-white">{escalationToast.clientName}</span> has been dispatched to the <strong>Command Center</strong> notification hub and clinical escalation queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('command-center')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>View Command Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEscalationToast(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Monthly Incident Trend Report & High-Frequency Analytics (recharts) */}
      <MonthlyIncidentTrendReport />

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.map((incident: Incident) => {
          const isHighOrCritical =
            incident.severity === 'Critical / Reportable' ||
            incident.severity === 'High' ||
            incident.severity.includes('High') ||
            incident.severity.includes('Critical');

          const stepIdx = getStepIndex(incident.status);
          const isClosed = stepIdx === 4;

          return (
            <div
              key={incident.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-white">{incident.clientName}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      incident.severity === 'Critical / Reportable'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : incident.severity === 'High'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {incident.severity}
                  </span>

                  {incident.isNdisReportable && (
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-bold border border-teal-500/20">
                      24-hr NDIS Commission Logged
                    </span>
                  )}

                  {isHighOrCritical && (
                    <button
                      onClick={() => setActiveTab('command-center')}
                      className="text-[10px] bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 px-2 py-0.5 rounded font-bold border border-rose-500/30 flex items-center gap-1 transition-all"
                      title="View triggered notification in Command Center"
                    >
                      <Bell className="w-3 h-3 text-rose-400" />
                      <span>Command Center Escalated</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(incident.incidentDate).toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    isClosed
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                  }`}>
                    {incident.status}
                  </span>
                </div>
              </div>

              {/* 4-Step Incident Investigation Sign-off Stepper (R12) */}
              <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    4-Step Investigation Sign-off Lifecycle
                  </span>
                  <span className="text-slate-500 font-mono">
                    Stage {stepIdx + 1} of 5 &bull; {incident.status}
                  </span>
                </div>

                {/* Stepper bar */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isPassed = idx < stepIdx;
                    const isCurrent = idx === stepIdx;
                    return (
                      <div key={step} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isPassed
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-teal-400 animate-pulse'
                              : 'bg-slate-800'
                          }`}
                        />
                        <span
                          className={`text-[9px] block font-mono truncate ${
                            isCurrent
                              ? 'text-teal-300 font-bold'
                              : isPassed
                              ? 'text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Workflow Transition Action Button */}
                {!isClosed && !isViewer && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-[10px] text-slate-400">
                      {incident.status === 'Director Sign-off'
                        ? 'Requires Clinical Director (ADMIN) final sign-off to close'
                        : `Advance to next stage: ${WORKFLOW_STEPS[stepIdx + 1]}`}
                    </span>
                    <button
                      onClick={() => handleAdvanceWorkflow(incident)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
                        incident.status === 'Director Sign-off'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-teal-600 hover:bg-teal-500 text-white'
                      }`}
                    >
                      {incident.status === 'Director Sign-off' ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Director Sign-off & Close</span>
                        </>
                      ) : (
                        <>
                          <span>Advance to {WORKFLOW_STEPS[stepIdx + 1]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Description & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Incident Description</span>
                  <p className="text-slate-200 leading-relaxed">{incident.description}</p>
                  <span className="text-[10px] text-slate-500 block pt-1">Location: N/A</span>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Immediate Action Taken</span>
                  <p className="text-slate-300 leading-relaxed">{incident.immediateActionTaken}</p>
                  <span className="text-[10px] text-slate-500 block pt-1">Reported by: {incident.reportedBy}</span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-3 flex-wrap">
                 <button
                    id={`print-pdf-${incident.id}`}
                    onClick={() => setSelectedIncidentForPDF(incident)}
                    className="px-3 py-1.5 bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm"
                    title="Generate and download formatted NDIS Compliance PDF Report"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Download NDIS PDF</span>
                  </button>
                 <button
                    onClick={() => setActiveTab('google-workspace')}
                    className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-rose-500/30 transition-all shadow-sm"
                    title="Notify NDIS Commission and Management via Gmail API"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Dispatch via Gmail</span>
                  </button>
                 <button
                    onClick={() => handleGenerateAssessment(incident)}
                    disabled={isAssessing[incident.id]}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-bold text-xs rounded-lg flex items-center gap-2 border border-indigo-500/20 transition-all shadow-sm disabled:opacity-50"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    {isAssessing[incident.id] ? 'Assessing Risk...' : 'AI Risk Assessment'}
                  </button>
              </div>
              {aiAssessments[incident.id] && (
                 <div className="p-3 mt-2 bg-indigo-950/30 rounded-xl border border-indigo-500/30 space-y-2 text-xs">
                   <div className="flex items-center gap-2 text-indigo-400 font-bold">
                     <BrainCircuit className="w-4 h-4" />
                     AI Compliance Risk Assessment
                   </div>
                   <div className="text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
                     {aiAssessments[incident.id]}
                   </div>
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Log Incident Report
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-rose-400 font-bold"
                  >
                    <option value="Critical / Reportable">Critical / Reportable (24h)</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low / Minor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Automated Workflow Notice when High or Critical */}
              {(severity === 'High' || severity === 'Critical / Reportable') && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-1 text-slate-200">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                    <Bell className="w-3.5 h-3.5 animate-pulse" />
                    <span>Automated Command Center Workflow Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Submitting with <strong>{severity}</strong> severity will automatically trigger an urgent dispatch notification in the Command Center alert stream and log a statutory compliance escalation.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise objective details of the incident..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Immediate Action & Safety Plan Executed</label>
                <textarea
                  rows={2}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="De-escalation executed, medical assessment completed..."
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>File Incident Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* NDIS Compliance PDF Report Modal */}
      <IncidentPDFReportModal
        isOpen={!!selectedIncidentForPDF}
        onClose={() => setSelectedIncidentForPDF(null)}
        incident={selectedIncidentForPDF}
        client={clients.find((c: Client) => c.id === selectedIncidentForPDF?.clientId)}
      />
    </div>
  );
};
