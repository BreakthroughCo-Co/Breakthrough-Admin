'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useManagementStore, TabType, OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/stores/useManagementStore';
import { Client, NDISSupportItem } from '@/types';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  FileText,
  X,
  Sparkles,
  ChevronDown,
  Layers
} from 'lucide-react';

const TAB_NAME_MAP: Record<TabType, string> = {
  'command-center': 'Command Center',
  'clients': 'Participants & Care Plans',
  'ndis-goals': 'NDIS Goal Tracker',
  'google-maps': 'Maps & Route Optimizer',
  'case-notes': 'Clinical Case Notes',
  'incidents': 'Incident Governance',
  'restrictive-practices': 'Restrictive Practices',
  'abc-analyser': 'ABC Behaviour Analyser',
  'bsp-plans': 'BSP Plan Authoring',
  'practice-tools': 'Clinical Assessment Tools',
  'google-workspace': 'Google Workspace Hub',
  'google-keep': 'Google Keep Notes',
  'audit': 'Compliance Dashboard',
  'crm': 'CRM & Intake Pipeline',
  'billing': 'PACE & Proda Billing',
  'hr-roster': 'HR & Staff Roster',
  'audit-logs': 'Immutable Audit Logs',
  'security-audit': 'Security Audit & RBAC',
  'integrations': 'Cloud Integrations',
  'google-classroom': 'Workforce Training & Classroom',
  'participant-portal': 'Participant & Carer Portal',
  'ai-predictive-insights': 'AI Predictive Insights',
  'document-intelligence': 'Document Intelligence & OCR',
  'voice-scribe': 'Clinical Voice Scribe',
  'ai-radar': 'Caseload Risk Radar',
  'audit-simulator': 'NDIS Audit Simulator',
  'proda-gateway': 'PRODA Direct Gateway',
  'plan-report-writer': 'Plan Report Writer',
  'churn-radar': 'Retention & Churn Radar',
  'agreements-signing': 'E-Signature Portal',
  'telehealth': 'Telehealth Consult Suite'
};

const STORAGE_KEY = 'breakthrough_session_timer_state_v1';

export const SessionTimer: React.FC = () => {
  const {
    activeTab,
    clients,
    currentUser,
    addBillingClaim,
    addCaseNote,
    addAuditLog,
    addNotification
  } = useManagementStore();

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Billable logging form state
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || 'cli-101');
  const [selectedSupportCode, setSelectedSupportCode] = useState('07_002_0115_8_3');
  const [activityDescription, setActivityDescription] = useState('');
  const [createCaseNote, setCreateCaseNote] = useState(true);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);

  // Restore state from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.seconds) setSeconds(parsed.seconds);
        if (typeof parsed.isRunning === 'boolean') setIsRunning(parsed.isRunning);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ seconds, isRunning }));
    } catch {
      // ignore
    }
  }, [seconds, isRunning]);

  // Interval timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSeconds(0);
  };

  const currentModuleLabel = TAB_NAME_MAP[activeTab] || 'Clinical Support';
  const selectedClient = clients.find((c: Client) => c.id === selectedClientId) || clients[0];
  const selectedSupportItem = OFFICIAL_2026_NDIS_PRICE_GUIDE.find(
    (item: NDISSupportItem) => item.code === selectedSupportCode
  ) || OFFICIAL_2026_NDIS_PRICE_GUIDE[0];

  const durationHours = Math.max(0.25, Math.round((seconds / 3600) * 100) / 100);
  const calculatedTotal = Math.round(durationHours * selectedSupportItem.pricePerUnit * 100) / 100;

  const handleOpenLogModal = () => {
    setIsRunning(false);
    setActivityDescription(
      `Delivered direct clinical support and documentation within ${currentModuleLabel} module.`
    );
    setShowLogModal(true);
  };

  const handleSaveBillableLog = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    const invoiceNumber = `INV-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Add Billing Claim
    addBillingClaim({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      ndisNumber: selectedClient.ndisNumber || '430000000',
      ndisSupportItem: `${selectedSupportItem.code} - ${selectedSupportItem.name}`,
      hours: durationHours,
      practitionerId: currentUser.practitionerId || 'prac-201',
      practitionerName: currentUser.name || 'Dr. Sarah Jenkins',
      serviceDate: timestamp.split('T')[0],
      supportItemCode: selectedSupportItem.code,
      supportItemName: selectedSupportItem.name,
      hoursWorked: durationHours,
      unitRate: selectedSupportItem.pricePerUnit,
      totalAmount: calculatedTotal,
      status: 'Pending',
      ndisCategory: selectedSupportItem.category,
      reconciliationStatus: 'Reconciled'
    });

    // 2. Optionally create linked case note
    if (createCaseNote) {
      addCaseNote({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        practitionerId: currentUser.practitionerId || 'prac-201',
        practitionerName: currentUser.name || 'Dr. Sarah Jenkins',
        date: timestamp.split('T')[0],
        sessionDate: timestamp.split('T')[0],
        sessionDurationMinutes: Math.round(durationHours * 60),
        durationMinutes: Math.round(durationHours * 60),
        format: 'SIMPL',
        category: 'Allied Health Therapy',
        subjective: `Participant active session in ${currentModuleLabel}. Engagement focused on prescribed goals and interventions.`,
        objective: activityDescription,
        assessment: 'Practitioner monitored progress, clinical compliance, and milestone attainment velocity.',
        plan: 'Continue ongoing weekly sessions aligned with NDIS Behaviour Support Plan.',
        linkedSupportItemCode: selectedSupportItem.code,
        billedAmount: calculatedTotal,
        billableHours: durationHours,
        invoiceNumber,
        ndisClaimGenerated: true,
        riskLevel: 'Low',
        linkedGoalIds: selectedClient.goals?.[0] ? [selectedClient.goals[0].id] : [],
        status: 'Submitted',
        flaggedForReview: false
      });
    }

    addAuditLog(
      'LOG_BILLABLE_SESSION_TIMER',
      'SessionTimer',
      selectedClient.id,
      `Logged ${durationHours}h billable time ($${calculatedTotal.toFixed(2)}) for ${selectedClient.name} in ${currentModuleLabel}`
    );

    addNotification({
      title: `Billable Session Logged ($${calculatedTotal.toFixed(2)})`,
      message: `Generated invoice ${invoiceNumber} for ${selectedClient.name} (${durationHours} hrs @ $${selectedSupportItem.pricePerUnit}/hr).`,
      type: 'billing',
      severity: 'low',
      linkTab: 'billing'
    });

    setLogSuccessMessage(`Successfully logged ${durationHours} hrs ($${calculatedTotal.toFixed(2)}) to NDIS Billing & Case Notes!`);
    setSeconds(0);
    setIsRunning(true);

    setTimeout(() => {
      setLogSuccessMessage(null);
      setShowLogModal(false);
    }, 1500);
  };

  return (
    <>
      <div
        id="persistent-session-timer"
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs shadow-inner"
        title={`Active module: ${currentModuleLabel} | Click to log billable hours`}
      >
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden xl:inline text-[10px] text-slate-400 font-mono truncate max-w-[90px]">
            {currentModuleLabel}:
          </span>
          <span className="font-mono font-bold text-teal-300 tracking-wider text-xs">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Play/Pause Toggle */}
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title={isRunning ? 'Pause session timer' : 'Resume session timer'}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
          title="Reset timer to 00:00:00"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Log Billable Action */}
        <button
          type="button"
          id="log-billable-hours-btn"
          onClick={handleOpenLogModal}
          className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold transition-all shadow-sm"
          title="Convert active session time into an NDIS Billable Claim & Case Note"
        >
          <DollarSign className="w-3 h-3 text-teal-400" />
          <span>Log Hours</span>
        </button>
      </div>

      {/* Billable Time Logging Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Log NDIS Billable Session Time</h3>
                  <p className="text-xs text-slate-400">
                    Convert tracked duration ({formatTime(seconds)}) into an invoice claim
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setIsRunning(true);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {logSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-emerald-300">{logSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveBillableLog} className="space-y-3.5 text-xs">
                {/* Summary Banner */}
                <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Session Time</span>
                    <span className="font-mono font-bold text-teal-300 text-sm">{formatTime(seconds)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Billable Units</span>
                    <span className="font-mono font-bold text-white text-sm">{durationHours} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Claim</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${calculatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Client Selector */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Select NDIS Participant</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-teal-500 font-sans"
                  >
                    {clients.map((c: Client) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (NDIS #{c.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* NDIS Support Item Code */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">2026 NDIS Price Guide Line Item</label>
                  <select
                    value={selectedSupportCode}
                    onChange={(e) => setSelectedSupportCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-teal-500 font-sans"
                  >
                    {OFFICIAL_2026_NDIS_PRICE_GUIDE.map((item: NDISSupportItem) => (
                      <option key={item.code} value={item.code}>
                        {item.code} - {item.name} (${item.pricePerUnit.toFixed(2)}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Activity / Clinical Service Description</label>
                  <textarea
                    rows={2}
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    required
                    placeholder="Enter activity description for NDIS verification..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Checkbox: Also generate case note */}
                <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createCaseNote}
                    onChange={(e) => setCreateCaseNote(e.target.checked)}
                    className="rounded border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span className="text-slate-300 font-medium">
                    Automatically create matching clinical SOAP Case Note entry
                  </span>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogModal(false);
                      setIsRunning(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Billable Claim (${calculatedTotal.toFixed(2)})</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
