'use client';

import React, { useState } from 'react';
import { Incident } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  X,
  AlertTriangle,
  Send,
  Mail,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  FileCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface IncidentEscalationModalProps {
  incident: Incident;
  onClose: () => void;
  onEscalated?: () => void;
}

export const IncidentEscalationModal: React.FC<IncidentEscalationModalProps> = ({
  incident,
  onClose,
  onEscalated
}) => {
  const { currentUser, addAuditLog, addNotification, updateIncidentStatus } = useManagementStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for multi-step escalation
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([
    'ndis-commission-escalations@breakthrough.org.au',
    'clinical-director@breakthrough.org.au',
    'quality-safeguards@breakthrough.org.au'
  ]);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [escalationPriority, setEscalationPriority] = useState<'CRITICAL_24HR' | 'HIGH_SLA' | 'URGENT'>(
    incident.severity === 'Critical / Reportable' ? 'CRITICAL_24HR' : 'HIGH_SLA'
  );
  const [mitigationSummary, setMitigationSummary] = useState<string>(
    incident.immediateActionTaken || 'Participant relocated to safe clinical zone; immediate physical safety protocol active.'
  );
  const [notifiedParties, setNotifiedParties] = useState<{
    ndisCommission: boolean;
    supportCoordinator: boolean;
    guardianOrFamily: boolean;
    policeOrEmergency: boolean;
  }>({
    ndisCommission: incident.isNdisReportable || incident.severity === 'Critical / Reportable',
    supportCoordinator: true,
    guardianOrFamily: true,
    policeOrEmergency: false
  });

  const handleAddRecipient = () => {
    if (customEmail && customEmail.includes('@') && !selectedRecipients.includes(customEmail)) {
      setSelectedRecipients([...selectedRecipients, customEmail]);
      setCustomEmail('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r !== email));
  };

  const handleExecuteEscalation = async () => {
    setIsSending(true);
    setError(null);
    try {
      const payload = {
        incidentId: incident.id,
        clientName: incident.clientName,
        severity: incident.severity,
        incidentDate: incident.incidentDate,
        description: incident.description,
        immediateActionTaken: mitigationSummary,
        reportedBy: currentUser?.name || incident.reportedBy || 'Authorized Practitioner',
        recipients: selectedRecipients,
        escalationStage: escalationPriority,
        notifiedParties,
        statutoryDeadline24h: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await fetch('/api/incidents/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch escalation');
      }

      setDispatchResult(data);
      setCurrentStep(3); // Completed step

      // Update incident status if open
      if (incident.status === 'Open') {
        updateIncidentStatus(incident.id, 'Investigating' as any);
      }

      addAuditLog(
        'INCIDENT_ESCALATED_EMAIL_DISPATCH',
        'INCIDENTS',
        incident.id,
        `Dispatched multi-step Cloud Function email escalation for ${incident.severity} incident involving ${incident.clientName}. Recipients: ${selectedRecipients.join(', ')}`
      );

      addNotification({
        title: `🚨 Escalation Triggered: ${incident.clientName}`,
        message: `High-severity reportable incident escalated via Cloud Functions to ${selectedRecipients.length} authorities.`,
        type: 'incident',
        severity: 'high',
        linkTab: 'incidents'
      });

      if (onEscalated) {
        onEscalated();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error executing escalation workflow');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Step Reportable Incident Escalation
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {incident.severity}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trigger statutory notifications and automated Firebase Cloud Function email dispatches
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

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          {[
            { num: 1, label: '1. Incident Classification & Parties' },
            { num: 2, label: '2. Email Recipients & Safeguards' },
            { num: 3, label: '3. Cloud Dispatch & Verification' }
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : isCurrent
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={`text-xs hidden sm:inline font-medium ${
                    isCurrent ? 'text-white font-bold' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Classification & Parties */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold">Participant: {incident.clientName}</span>
                  <span className="font-mono text-slate-400">ID: {incident.id}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  <strong>Description:</strong> {incident.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Statutory Escalation Priority</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'CRITICAL_24HR',
                      label: '24-hr NDIS Reportable',
                      desc: 'Mandatory 24h notification to NDIS Quality & Safeguards Commission'
                    },
                    {
                      id: 'HIGH_SLA',
                      label: 'High Severity Clinical SLA',
                      desc: 'Clinical Director & Safeguards Officer instant notification'
                    },
                    {
                      id: 'URGENT',
                      label: 'Internal Safeguard Escalation',
                      desc: 'Participant care team & Support Coordinator review'
                    }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEscalationPriority(p.id as any)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        escalationPriority === p.id
                          ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-slate-200">{p.label}</span>
                      <span className="text-[10px] text-slate-400 block pt-1">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Immediate Safety Mitigation Updates</label>
                <textarea
                  value={mitigationSummary}
                  onChange={(e) => setMitigationSummary(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-xs"
                  placeholder="Summarize immediate mitigation and care steps taken..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Statutory Parties Notified Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={notifiedParties.ndisCommission}
                      onChange={(e) => setNotifiedParties({ ...notifiedParties, ndisCommission: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-300 font-medium">NDIS Commission Portal</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={notifiedParties.supportCoordinator}
                      onChange={(e) => setNotifiedParties({ ...notifiedParties, supportCoordinator: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-300 font-medium">Support Coordinator</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={notifiedParties.guardianOrFamily}
                      onChange={(e) => setNotifiedParties({ ...notifiedParties, guardianOrFamily: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-300 font-medium">Nominated Guardian / Family</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={notifiedParties.policeOrEmergency}
                      onChange={(e) => setNotifiedParties({ ...notifiedParties, policeOrEmergency: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-slate-300 font-medium">Emergency Services / Police</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Email Recipients & Safeguards */}
          {currentStep === 2 && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-400" />
                  Firebase Cloud Function Automated Email Dispatch List
                </span>
                <p className="text-slate-400 text-[11px]">
                  The backend Cloud Function will trigger an encrypted notification email with full statutory incident details and risk mitigations.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedRecipients.map((rec) => (
                    <span
                      key={rec}
                      className="px-2.5 py-1 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 font-mono text-[11px] flex items-center gap-1.5"
                    >
                      <span>{rec}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(rec)}
                        className="text-slate-500 hover:text-rose-400 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Add additional stakeholder email..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Statutory 24-Hour & 5-Day Commission Requirements
                </span>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  NDIS practice registration requires notification of reportable incidents within 24 hours of identification, followed by an in-depth 5-day resolution and root-cause return.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Dispatch & Confirmation */}
          {currentStep === 3 && dispatchResult && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Escalation Notification Dispatched Successfully</h4>
                <p className="text-slate-300 text-xs max-w-md mx-auto">
                  {dispatchResult.message}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Dispatch ID:</span>
                  <span className="text-teal-400">{dispatchResult.dispatchId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Recipient Count:</span>
                  <span>{selectedRecipients.length} authorities</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Escalation Level:</span>
                  <span className="text-rose-400 font-bold">{escalationPriority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory 24h Deadline:</span>
                  <span className="text-amber-400">{new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {currentStep === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Proceed to Notifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleExecuteEscalation}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Send className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Cloud Function...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Execute Escalation & Send Emails</span>
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close & Return to Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
