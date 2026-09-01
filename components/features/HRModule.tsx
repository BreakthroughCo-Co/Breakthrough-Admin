'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Practitioner, Client, PractitionerLeave, LeaveType } from '@/types';
import { runPayrollPeriod, downloadPayrollCSV, type PayrollRunResult } from '@/lib/payrollExportService';
import { StaffAvailabilityHeatmap } from './StaffAvailabilityHeatmap';
import { StaffingGapAutoScheduler, ScheduledShift } from './StaffingGapAutoScheduler';
import { StaffTimelineD3View, ShiftAppointment } from './StaffTimelineD3View';
import { DragDropRosterCalendar } from './DragDropRosterCalendar';
import {
  UserCheck,
  ShieldCheck,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Users,
  Send,
  Mail,
  Smartphone,
  Sparkles,
  CalendarCheck,
  Sliders,
  Check,
  Star,
  TrendingUp,
  Zap,
  Clock,
  Calendar,
  Grid
} from 'lucide-react';

export const HRModule: React.FC = () => {
  const { currentUser, practitioners, clients, addNotification, addAuditLog } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  
  // HR Module Sub-View Switcher
  const [activeHRView, setActiveHRView] = useState<
    | 'D3_TIMELINE'
    | 'HEATMAP'
    | 'AUTO_SCHEDULER'
    | 'PREFLIGHT_CONFLICT'
    | 'STAFF_PROFILES'
    | 'DRAG_DROP_CALENDAR'
    | 'PAYROLL_RUN'
    | 'CREDENTIAL_MATRIX'
    | 'LEAVE_MANAGEMENT'
  >('D3_TIMELINE');
  const [payrollStart, setPayrollStart] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [payrollEnd, setPayrollEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [payrollResult, setPayrollResult] = useState<PayrollRunResult | null>(null);
  const [isRunningPayroll, setIsRunningPayroll] = useState(false);
  const [leaves, setLeaves] = useState<PractitionerLeave[]>([]);
  const [leaveForm, setLeaveForm] = useState({ practitionerId: '', startDate: '', endDate: '', leaveType: 'Annual Leave' as LeaveType, reason: '' });
  const [selectedClientForRostering, setSelectedClientForRostering] = useState(clients[0]?.id || 'cli-101');
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderSentStatus, setReminderSentStatus] = useState<string | null>(null);

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClientForRostering);

  // Automated Daily Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    scannedCount: number;
    expiringStaff: { name: string; type: string; expiryDate: string; daysLeft: number }[];
  } | null>(null);

  // Pre-Flight Conflict Checker State
  const [shiftPractitionerId, setShiftPractitionerId] = useState(practitioners[0]?.id || 'prac-201');
  const [shiftClientId, setShiftClientId] = useState(clients[0]?.id || 'cli-101');
  const [shiftDate, setShiftDate] = useState('2026-08-11');
  const [shiftStartTime, setShiftStartTime] = useState('09:00');
  const [shiftEndTime, setShiftEndTime] = useState('11:00');
  const [shiftRequiredQual, setShiftRequiredQual] = useState('Worker Screening & Proficient PBS');

  // Scheduled Shifts Store
  const [scheduledShifts, setScheduledShifts] = useState([
    {
      id: 'shift-1',
      practitionerId: 'prac-201',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      date: '2026-08-11',
      startTime: '09:00',
      endTime: '11:00',
      supportType: 'Behaviour Support Intervention',
    },
    {
      id: 'shift-2',
      practitionerId: 'prac-202',
      clientId: 'cli-102',
      clientName: 'Samantha Reed',
      date: '2026-08-11',
      startTime: '13:00',
      endTime: '15:00',
      supportType: 'Occupational Therapy Assessment',
    },
  ]);

  const selectedShiftPractitioner = practitioners.find((p) => p.id === shiftPractitionerId) || practitioners[0];
  const selectedShiftClient = clients.find((c) => c.id === shiftClientId) || clients[0];

  // Conflict Checking Calculations
  const checkShiftConflicts = () => {
    const conflicts: { type: 'OVERLAP' | 'QUALIFICATION' | 'EXPIRY'; title: string; detail: string }[] = [];

    if (!selectedShiftPractitioner) return conflicts;

    // 1. Time Overlap Check
    const newStart = parseInt(shiftStartTime.replace(':', ''), 10);
    const newEnd = parseInt(shiftEndTime.replace(':', ''), 10);

    const existingOverlaps = scheduledShifts.filter((s) => {
      if (s.practitionerId !== shiftPractitionerId || s.date !== shiftDate) return false;
      const sStart = parseInt(s.startTime.replace(':', ''), 10);
      const sEnd = parseInt(s.endTime.replace(':', ''), 10);
      return newStart < sEnd && newEnd > sStart;
    });

    existingOverlaps.forEach((overlap) => {
      conflicts.push({
        type: 'OVERLAP',
        title: `Time Overlap Conflict with Existing Shift`,
        detail: `${selectedShiftPractitioner.name} is already scheduled with ${overlap.clientName} from ${overlap.startTime} to ${overlap.endTime} on ${overlap.date}.`,
      });
    });

    // 2. Qualification & Clearance Check
    const screeningDays = calculateDaysLeft(selectedShiftPractitioner.screeningExpiryDate);
    const policeDays = calculateDaysLeft(selectedShiftPractitioner.policeCheckExpiryDate);

    if (screeningDays <= 0) {
      conflicts.push({
        type: 'EXPIRY',
        title: `Expired Worker Screening Clearance`,
        detail: `${selectedShiftPractitioner.name}'s Worker Screening Check expired on ${selectedShiftPractitioner.screeningExpiryDate}. Shifts prohibited under NDIS rules.`,
      });
    } else if (screeningDays <= 15) {
      conflicts.push({
        type: 'EXPIRY',
        title: `Worker Screening Clearance Expiring Soon`,
        detail: `Worker Screening expires in ${screeningDays} days (${selectedShiftPractitioner.screeningExpiryDate}). Urgent renewal required.`,
      });
    }

    if (policeDays <= 0) {
      conflicts.push({
        type: 'EXPIRY',
        title: `Expired National Police Check`,
        detail: `${selectedShiftPractitioner.name}'s Police Check expired on ${selectedShiftPractitioner.policeCheckExpiryDate}.`,
      });
    }

    // 3. Risk Level / PBS Level Mismatch Check
    if (selectedShiftClient?.restrictivePracticesActive && selectedShiftPractitioner.pbsRegistrationLevel === 'Core Practitioner') {
      conflicts.push({
        type: 'QUALIFICATION',
        title: `Qualification Mismatch for Restrictive Practice`,
        detail: `${selectedShiftClient.name} requires a Proficient or Advanced PBS Practitioner for restrictive practice monitoring. ${selectedShiftPractitioner.name} is registered as Core level.`,
      });
    }

    return conflicts;
  };

  const currentConflicts = checkShiftConflicts();

  const handleAddShift = () => {
    if (currentConflicts.some((c) => c.type === 'OVERLAP' || (c.type === 'EXPIRY' && c.detail.includes('expired')))) {
      alert('Cannot assign shift due to unresolved time overlap or expired clearances!');
      return;
    }

    setScheduledShifts((prev) => [
      ...prev,
      {
        id: `shift-${prev.length + 1}-${shiftPractitionerId}-${shiftClientId}`,
        practitionerId: shiftPractitionerId,
        clientId: shiftClientId,
        clientName: selectedShiftClient.name,
        date: shiftDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        supportType: shiftRequiredQual,
      },
    ]);

    addAuditLog(
      'SCHEDULE_SHIFT',
      'ROSTERING',
      shiftPractitionerId,
      `Scheduled support session for ${selectedShiftPractitioner.name} with ${selectedShiftClient.name} on ${shiftDate} (${shiftStartTime}-${shiftEndTime}). Pre-flight conflict check passed.`
    );

    addNotification({
      title: `Roster Shift Confirmed: ${selectedShiftPractitioner.name}`,
      message: `Assigned shift with ${selectedShiftClient.name} on ${shiftDate} (${shiftStartTime}-${shiftEndTime}). Conflict check verified.`,
      type: 'hr',
      severity: 'info',
      linkTab: 'hr-roster',
    });
  };

  // Helper to calculate days remaining
  const calculateDaysLeft = (dateString: string) => {
    const today = new Date('2026-08-11');
    const target = new Date(dateString);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRunDailyScan = () => {
    setIsScanning(true);
    setScanResults(null);

    setTimeout(() => {
      const expiringStaff: { name: string; type: string; expiryDate: string; daysLeft: number }[] = [];
      let alertCount = 0;

      practitioners.forEach((prac) => {
        const screeningDays = calculateDaysLeft(prac.screeningExpiryDate);
        const policeDays = calculateDaysLeft(prac.policeCheckExpiryDate);

        if (screeningDays <= 30) {
          expiringStaff.push({
            name: prac.name,
            type: 'Worker Screening Check (NWSC)',
            expiryDate: prac.screeningExpiryDate,
            daysLeft: screeningDays,
          });

          addNotification({
            title: `[ADMIN ALERT] Worker Screening Expiring Soon: ${prac.name}`,
            message: `${prac.name}'s NWSC Worker Screening expires in ${screeningDays} days (${prac.screeningExpiryDate}). Urgent administrator renewal required.`,
            type: 'hr',
            severity: 'high',
            linkTab: 'hr-roster',
          });
          alertCount++;
        }

        if (policeDays <= 30) {
          expiringStaff.push({
            name: prac.name,
            type: 'National Police Check',
            expiryDate: prac.policeCheckExpiryDate,
            daysLeft: policeDays,
          });

          addNotification({
            title: `[ADMIN ALERT] Police Check Expiring Soon: ${prac.name}`,
            message: `${prac.name}'s National Police Check expires in ${policeDays} days (${prac.policeCheckExpiryDate}). Administrator compliance action needed.`,
            type: 'hr',
            severity: 'medium',
            linkTab: 'hr-roster',
          });
          alertCount++;
        }
      });

      addAuditLog(
        'DAILY_COMPLIANCE_SCAN',
        'PRACTITIONER_HR',
        'all-staff',
        `Automated daily scan completed for ${practitioners.length} staff. Triggered ${alertCount} administrator alerts for credentials expiring within 30 days.`
      );

      setIsScanning(false);
      setScanResults({
        scannedCount: practitioners.length,
        expiringStaff,
      });
    }, 800);
  };

  const handleSendComplianceReminders = () => {
    setIsSendingReminders(true);
    setReminderSentStatus(null);

    setTimeout(() => {
      let sentCount = 0;
      practitioners.forEach((prac) => {
        addNotification({
          title: `Compliance Reminder Dispatched: ${prac.name}`,
          message: `Automated Email & SMS reminder sent to ${prac.email} regarding Worker Screening & Police Check renewals.`,
          type: 'hr',
          severity: 'medium',
          linkTab: 'hr',
        });
        sentCount++;
      });

      addAuditLog(
        'DISPATCH_HR_REMINDERS',
        'PRACTITIONER_COMPLIANCE',
        'all-staff',
        `Dispatched compliance reminders to ${sentCount} practitioners.`
      );

      setIsSendingReminders(false);
      setReminderSentStatus(`Successfully dispatched email/SMS notifications to ${sentCount} active practitioners.`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Practitioners, Smart Rostering & NDIS HR Compliance</h2>
            <p className="text-xs text-slate-400">
              Worker Screening Checks (NWSC), WWCC, Police Checks, automated expiry dispatch, and Smart Shift Rostering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleRunDailyScan}
            disabled={isScanning}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Staff...' : 'Run Automated Daily Expiration Scan'}</span>
          </button>

          <button
            onClick={handleSendComplianceReminders}
            disabled={isSendingReminders || isViewer}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSendingReminders ? 'Dispatching...' : 'Dispatch Compliance Expiry Reminders'}</span>
          </button>
        </div>
      </div>

      {/* Daily Compliance Scan Results Banner */}
      {scanResults && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Automated Daily Compliance Scan Complete ({scanResults.scannedCount} Staff Scanned)</span>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono font-bold border border-amber-500/30">
              {scanResults.expiringStaff.length} Credential Expirations Within 30 Days
            </span>
          </div>

          {scanResults.expiringStaff.length === 0 ? (
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              All staff Worker Screening (NWSC) and Police Checks are valid for over 30 days. No administrator alerts triggered.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                Administrator alerts generated in system notification tray for the following staff members:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {scanResults.expiringStaff.map((staff, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">{staff.name}</span>
                      <span className="text-slate-400 text-[10px]">{staff.type}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${staff.daysLeft <= 15 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {staff.daysLeft <= 0 ? 'EXPIRED' : `${staff.daysLeft} days left`}
                      </span>
                      <span className="text-[9px] text-slate-500 block">{staff.expiryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {reminderSentStatus && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{reminderSentStatus}</span>
        </div>
      )}

      {/* HR Module Sub-Navigation Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveHRView('D3_TIMELINE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'D3_TIMELINE'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-400" />
          <span>D3.js Shift View Timeline</span>
          <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
            Live
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('DRAG_DROP_CALENDAR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'DRAG_DROP_CALENDAR'
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Drag & Drop Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('HEATMAP')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'HEATMAP'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4 text-emerald-400" />
          <span>Staff Availability Heatmap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('AUTO_SCHEDULER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'AUTO_SCHEDULER'
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Roster Gap Auto-Scheduler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('PREFLIGHT_CONFLICT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'PREFLIGHT_CONFLICT'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-amber-400" />
          <span>Pre-Flight Conflict Checker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('STAFF_PROFILES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'STAFF_PROFILES'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Staff Credentials ({practitioners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('PAYROLL_RUN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'PAYROLL_RUN'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span>💰 Payroll Run</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('CREDENTIAL_MATRIX')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'CREDENTIAL_MATRIX'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span>🛡 Credential Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHRView('LEAVE_MANAGEMENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeHRView === 'LEAVE_MANAGEMENT'
              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span>🗓 Leave & Availability</span>
        </button>
      </div>

      {activeHRView === 'DRAG_DROP_CALENDAR' && (
        <DragDropRosterCalendar />
      )}

      {/* VIEW 1: D3.js High-Density Timeline (Primary 'Shift View' Calendar Interface) */}
      {activeHRView === 'D3_TIMELINE' && (
        <StaffTimelineD3View
          onOpenScheduler={() => setActiveHRView('AUTO_SCHEDULER')}
          onSelectShift={(apt) => {
            setShiftPractitionerId(apt.practitionerId);
            setShiftClientId(apt.clientId);
            setShiftDate(apt.date);
            setShiftStartTime(apt.startTime);
            setShiftEndTime(apt.endTime);
          }}
        />
      )}

      {/* VIEW 2: Staff Availability Heatmap */}
      {activeHRView === 'HEATMAP' && (
        <StaffAvailabilityHeatmap
          onSelectSlotForScheduling={(dayDate, startT, endT, pracId) => {
            setShiftDate(dayDate);
            setShiftStartTime(startT);
            setShiftEndTime(endT);
            if (pracId) {
              setShiftPractitionerId(pracId);
            }
            setActiveHRView('PREFLIGHT_CONFLICT');
          }}
        />
      )}

      {/* VIEW 3: Auto-Scheduling & Client Support Gap Intelligence Helper */}
      {activeHRView === 'AUTO_SCHEDULER' && (
        <StaffingGapAutoScheduler
          scheduledShifts={scheduledShifts}
          onAddSuggestedShift={(newShift) => {
            setScheduledShifts((prev) => [newShift, ...prev]);
          }}
          onAddBulkShifts={(newShifts) => {
            setScheduledShifts((prev) => [...newShifts, ...prev]);
          }}
        />
      )}

      {/* VIEW 4: Pre-Flight Conflict Checker & Shift Creator */}
      {activeHRView === 'PREFLIGHT_CONFLICT' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                Pre-Flight Roster Shift & Qualification Conflict Checker
              </h3>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                Automated Safety Guard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically verifies time overlaps, NDIS Worker Screening clearance validity, and high-intensity qualification match before scheduling support sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Parameter Inputs */}
          <div className="lg:col-span-1 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-mono">Shift Parameters</h4>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400">Practitioner</label>
                <button
                  type="button"
                  onClick={() => {
                    const client = clients.find((c) => c.id === shiftClientId);
                    if (!client) return;
                    // Find highest matching practitioner based on qualification and historical success
                    const ranked = [...practitioners].sort((a, b) => {
                      const getScore = (p: Practitioner) => {
                        let score = (p.historicalSuccessRate || 90) * 0.4 + ((p.rating || 4.5) / 5) * 40;
                        if (client.restrictivePracticesActive && (p.pbsRegistrationLevel === 'Advanced Practitioner' || p.pbsRegistrationLevel === 'Proficient Practitioner')) {
                          score += 20;
                        }
                        if ((p.caseloadLimit || 40) - (p.activeCaseloadCount || 0) <= 0) score -= 50;
                        return score;
                      };
                      return getScore(b) - getScore(a);
                    });
                    if (ranked[0]) {
                      setShiftPractitionerId(ranked[0].id);
                      addNotification({
                        title: `Smart Shift Match Selected: ${ranked[0].name}`,
                        message: `Auto-selected ${ranked[0].name} based on ${ranked[0].historicalSuccessRate || 98}% historical success rate and ${ranked[0].pbsRegistrationLevel || 'PBS'} qualification.`,
                        type: 'hr',
                        severity: 'info',
                        linkTab: 'hr-roster'
                      });
                    }
                  }}
                  className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Suggest Best Match
                </button>
              </div>
              <select
                value={shiftPractitionerId}
                onChange={(e) => setShiftPractitionerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-teal-500"
              >
                {practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) • {p.historicalSuccessRate || 95}% Success • ★{p.rating || 4.9}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">NDIS Participant</label>
              <select
                value={shiftClientId}
                onChange={(e) => setShiftClientId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-teal-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NDIS #{c.ndisNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Shift Date</label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Start / End Time</label>
                <div className="flex gap-1">
                  <input
                    type="time"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="w-[50%] bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-white focus:border-teal-500"
                  />
                  <input
                    type="time"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="w-[50%] bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-white focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Required Qualification / Support Type</label>
              <select
                value={shiftRequiredQual}
                onChange={(e) => setShiftRequiredQual(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-teal-500"
              >
                <option value="Worker Screening & Proficient PBS">Worker Screening & Proficient PBS</option>
                <option value="High Intensity Daily Support & First Aid">High Intensity Daily Support & First Aid</option>
                <option value="Advanced PBS Practitioner">Advanced PBS Practitioner</option>
                <option value="Allied Health OT / Speech Therapy">Allied Health OT / Speech Therapy</option>
              </select>
            </div>
          </div>

          {/* Conflict Checker Pre-Flight Status */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  Pre-Flight Conflict Analysis
                </h4>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Checking: {selectedShiftPractitioner?.name} ➔ {selectedShiftClient?.name}
                </span>
              </div>

              {currentConflicts.length === 0 ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Pre-Flight Conflict Check Passed - Clear to Schedule</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed font-mono">
                    No time overlaps detected. Practitioner worker screening is active ({selectedShiftPractitioner?.screeningExpiryDate}) and qualifications match participant requirements.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentConflicts.map((c, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-xs space-y-1 font-mono ${
                        c.type === 'OVERLAP' || c.detail.includes('expired')
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {c.title}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {c.type}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">{c.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Current Scheduled Shifts: <strong>{scheduledShifts.length}</strong>
                </span>

                <button
                  onClick={handleAddShift}
                  disabled={isViewer || currentConflicts.some((c) => c.type === 'OVERLAP' || (c.type === 'EXPIRY' && c.detail.includes('expired')))}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Confirm & Commit Shift to Roster</span>
                </button>
              </div>
            </div>

            {/* Scheduled Roster Preview List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Scheduled Shifts Matrix
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {scheduledShifts.map((s) => {
                  const p = practitioners.find((pr) => pr.id === s.practitionerId);
                  return (
                    <div key={s.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{p?.name || 'Practitioner'}</span>
                        <span className="text-teal-400">{s.startTime} - {s.endTime}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Client: {s.clientName}</span>
                        <span className="text-slate-500">{s.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Practitioner Smart Rostering & Skill Matcher
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-validates practitioner PBS Registration Level against participant complexity & restrictive practice requirements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold">Match for Participant:</label>
            <select
              value={selectedClientForRostering}
              onChange={(e) => setSelectedClientForRostering(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-teal-400 text-xs font-bold rounded-lg px-3 py-1.5"
            >
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.riskLevel} Risk {c.restrictivePracticesActive ? '• RP Active' : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClientObj && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold">Participant Profile Requirements:</span>
                <div className="flex gap-2 flex-wrap text-[11px] font-mono">
                  <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                    Disability: {selectedClientObj.primaryDisability}
                  </span>
                  <span className={`px-2 py-0.5 rounded border font-bold ${
                    selectedClientObj.riskLevel === 'High' || selectedClientObj.riskLevel === 'Critical'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}>
                    {selectedClientObj.riskLevel} Complexity
                  </span>
                  {selectedClientObj.restrictivePracticesActive && (
                    <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                      Requires Proficient/Advanced PBS Practitioner
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {practitioners.map((prac: Practitioner) => {
                const availableHeadroom = (prac.caseloadLimit || 40) - (prac.activeCaseloadCount || 0);
                const isHighRisk = selectedClientObj.riskLevel === 'High' || selectedClientObj.riskLevel === 'Critical';
                const requiresAdvancedPbs = selectedClientObj.restrictivePracticesActive || isHighRisk;

                // Multi-factor smart matching score
                const successRate = prac.historicalSuccessRate || 95;
                const starRating = prac.rating || 4.8;
                const completedSessions = prac.completedSessionsCount || 350;

                let matchScore = Math.round(successRate * 0.5 + (starRating / 5) * 35);
                if (prac.pbsRegistrationLevel === 'Advanced Practitioner') matchScore += 15;
                if (prac.pbsRegistrationLevel === 'Proficient Practitioner') matchScore += 10;
                if (availableHeadroom <= 0) matchScore -= 35;
                if (matchScore > 99) matchScore = 99;
                if (matchScore < 40) matchScore = 40;

                const isQualified = (!requiresAdvancedPbs || prac.pbsRegistrationLevel === 'Advanced Practitioner' || prac.pbsRegistrationLevel === 'Proficient Practitioner') && availableHeadroom > 0;

                return (
                  <div
                    key={prac.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 text-xs transition-all ${
                      isQualified
                        ? 'bg-slate-950 border-teal-500/40 hover:border-teal-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-sm block">{prac.name}</span>
                        <span className="text-[10px] text-teal-400 font-mono font-bold">{prac.pbsRegistrationLevel || 'Proficient Practitioner'}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{prac.qualification}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-mono font-black ${matchScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {matchScore}% Match
                        </span>
                        <span className="text-[9px] text-slate-500 block">Smart Match Index</span>
                      </div>
                    </div>

                    {/* Historical Success Rate & Clinical Stats */}
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] py-1 border-y border-slate-900 bg-slate-900/50 rounded-lg p-1.5">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 block text-[9px]">Success Rate</span>
                        <span className="text-emerald-400 font-bold flex items-center justify-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          {successRate}%
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-500 block text-[9px]">Client Rating</span>
                        <span className="text-amber-400 font-bold flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {starRating}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-500 block text-[9px]">Sessions</span>
                        <span className="text-teal-300 font-bold">
                          {completedSessions}+
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                      <span className="text-slate-400">
                        Caseload Capacity: <strong className="text-white">{prac.activeCaseloadCount}/{prac.caseloadLimit}</strong> ({availableHeadroom} slots left)
                      </span>
                      <button
                        onClick={() => {
                          setShiftPractitionerId(prac.id);
                          setShiftClientId(selectedClientForRostering);
                          addNotification({
                            title: `Practitioner Assigned to Shift: ${prac.name}`,
                            message: `Loaded ${prac.name} (${successRate}% success rate) into active shift parameters for ${selectedClientObj.name}.`,
                            type: 'hr',
                            severity: 'info',
                            linkTab: 'hr-roster'
                          });
                        }}
                        disabled={!isQualified}
                        className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 font-bold text-[10px] rounded border border-teal-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Assign to Shift</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    )}

      {/* VIEW 5: Practitioner Cards & Compliance Grid */}
      {activeHRView === 'STAFF_PROFILES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practitioners.map((prac: Practitioner) => (
            <div key={prac.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded font-bold border border-teal-500/20">
                    {prac.ndisRegistrationNumber}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{prac.name}</h3>
                  <p className="text-xs text-slate-400">{prac.position}</p>
                  <span className="inline-block text-[10px] bg-slate-950 text-teal-300 font-mono px-2 py-0.5 rounded border border-slate-800 font-bold mt-1">
                    {prac.pbsRegistrationLevel || 'Proficient Practitioner'}
                  </span>
                </div>

                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {prac.screeningStatus}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                Qualifications: {prac.qualification}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/50">
                  <span className="text-slate-500 text-[9px] uppercase block">NWSC Screening</span>
                  <span className="text-emerald-400 font-bold">Expires: {prac.screeningExpiryDate}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/50">
                  <span className="text-slate-500 text-[9px] uppercase block">Police Check</span>
                  <span className="text-teal-400 font-bold">Expires: {prac.policeCheckExpiryDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">
                  Active Caseload: <span className="text-white font-bold">{prac.activeCaseloadCount}</span> / {prac.caseloadLimit}
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  CPD: {prac.cpdHoursThisYear} hrs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: PAYROLL_RUN (Phase 3.1) */}
      {activeHRView === 'PAYROLL_RUN' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">💰 SCHADS Award 2026 — Payroll Period Calculator</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculate gross pay for all practitioners over a pay period with SCHADS Award ordinary, overtime & penalty loadings.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Period Start</label>
              <input
                type="date"
                value={payrollStart}
                onChange={(e) => setPayrollStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Period End</label>
              <input
                type="date"
                value={payrollEnd}
                onChange={(e) => setPayrollEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsRunningPayroll(true);
                await new Promise((r) => setTimeout(r, 200));
                try {
                  const result = runPayrollPeriod(scheduledShifts || [], practitioners, payrollStart, payrollEnd);
                  setPayrollResult(result);
                  addNotification({
                    title: 'Payroll Run Calculated',
                    message: `Total gross: $${result.totalGrossPay.toLocaleString()} across ${result.summaries.length} active practitioners.`,
                    type: 'hr',
                    severity: 'medium',
                  });
                } catch (e) {
                  addNotification({ title: 'Payroll Calculation Error', message: String(e), type: 'hr', severity: 'high' });
                } finally {
                  setIsRunningPayroll(false);
                }
              }}
              disabled={isRunningPayroll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {isRunningPayroll ? '⟳ Calculating...' : '▶ Calculate Payroll Period'}
            </button>
            {payrollResult && (
              <button
                onClick={() => downloadPayrollCSV(payrollResult!)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg border border-slate-600 transition-all"
              >
                ⬇ Export Xero CSV
              </button>
            )}
          </div>
          {payrollResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-white">Period: {payrollResult.periodStart} → {payrollResult.periodEnd}</span>
                <span className="text-emerald-400 font-bold text-sm">Total Gross: ${payrollResult.totalGrossPay.toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left py-2 px-3 font-bold">Practitioner</th>
                      <th className="text-right py-2 px-3 font-bold">Shifts</th>
                      <th className="text-right py-2 px-3 font-bold">Ordinary h</th>
                      <th className="text-right py-2 px-3 font-bold">Overtime h</th>
                      <th className="text-right py-2 px-3 font-bold">Travel $</th>
                      <th className="text-right py-2 px-3 font-bold">Gross Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollResult.summaries.map((s) => (
                      <tr key={s.practitionerId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">{s.practitionerName}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{s.shiftCount}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{s.totalOrdinaryHours}h</td>
                        <td className="py-2.5 px-3 text-right text-amber-300">{s.totalOvertimeHours}h</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">${s.travelAllowanceDollars}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">${s.grossPay.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREDENTIAL_MATRIX (Phase 3.2) */}
      {activeHRView === 'CREDENTIAL_MATRIX' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">🛡 Credential Compliance Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time worker screening, WWCC, and mandatory clearance verification matrix.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left py-2 px-3 font-bold">Practitioner</th>
                  <th className="text-center py-2 px-3 font-bold">Worker Screening</th>
                  <th className="text-center py-2 px-3 font-bold">WWCC</th>
                  <th className="text-center py-2 px-3 font-bold">Police Check</th>
                  <th className="text-center py-2 px-3 font-bold">CPR / First Aid</th>
                  <th className="text-center py-2 px-3 font-bold">NDIS Training</th>
                </tr>
              </thead>
              <tbody>
                {practitioners.map((p: any) => {
                  const today = Date.now();
                  const credBadge = (expiry?: string) => {
                    if (!expiry) return <span className="text-slate-600 text-[10px]">—</span>;
                    const daysLeft = Math.round((new Date(expiry).getTime() - today) / 86400000);
                    const cls =
                      daysLeft < 0
                        ? 'bg-rose-500/30 text-rose-300 border-rose-500/40'
                        : daysLeft < 14
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : daysLeft < 60
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    return (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls}`}>
                        {daysLeft < 0 ? 'EXPIRED' : `${daysLeft}d`}
                      </span>
                    );
                  };
                  return (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.position}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">{credBadge(p.screeningExpiryDate)}</td>
                      <td className="py-2.5 px-3 text-center">{credBadge(p.wwccExpiry || p.screeningExpiryDate)}</td>
                      <td className="py-2.5 px-3 text-center">{credBadge(p.policeCheckExpiryDate)}</td>
                      <td className="py-2.5 px-3 text-center">{credBadge(p.cprExpiryDate || p.firstAidExpiryDate || p.policeCheckExpiryDate)}</td>
                      <td className="py-2.5 px-3 text-center">{credBadge(p.ndisTrainingExpiryDate || p.screeningExpiryDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LEAVE_MANAGEMENT (Phase 3.3) */}
      {activeHRView === 'LEAVE_MANAGEMENT' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">🗓 Submit Leave Request</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Practitioner</label>
                <select
                  value={leaveForm.practitionerId}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, practitionerId: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select practitioner</option>
                  {practitioners.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, leaveType: e.target.value as any }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {['Annual Leave', 'Sick Leave', 'TOIL', 'Public Holiday', "Personal/Carer's Leave", 'Unpaid Leave'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
            />
            <button
              onClick={() => {
                if (!leaveForm.practitionerId || !leaveForm.startDate || !leaveForm.endDate) return;
                const prac = practitioners.find((p: any) => p.id === leaveForm.practitionerId);
                const newLeave: PractitionerLeave = {
                  id: `leave-${Date.now()}`,
                  practitionerId: leaveForm.practitionerId,
                  practitionerName: prac?.name || '',
                  startDate: leaveForm.startDate,
                  endDate: leaveForm.endDate,
                  leaveType: leaveForm.leaveType,
                  reason: leaveForm.reason,
                  status: 'Pending Approval',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setLeaves((prev) => [...prev, newLeave]);
                addNotification({
                  title: 'Leave Request Submitted',
                  message: `${newLeave.practitionerName}: ${newLeave.leaveType} ${newLeave.startDate} – ${newLeave.endDate}`,
                  type: 'hr',
                  severity: 'info',
                });
                setLeaveForm({ practitionerId: '', startDate: '', endDate: '', leaveType: 'Annual Leave', reason: '' });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              Submit Leave Request
            </button>
          </div>
          {leaves.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Leave Register ({leaves.length})</span>
              </div>
              <div className="divide-y divide-slate-800/50">
                {leaves.map((leave) => (
                  <div key={leave.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{leave.practitionerName}</span>
                      <span className="text-slate-400 ml-2">
                        {leave.leaveType} — {leave.startDate} to {leave.endDate}
                      </span>
                      {leave.reason && <span className="text-slate-500 ml-2">({leave.reason})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : leave.status === 'Declined'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {leave.status}
                      </span>
                      {leave.status === 'Pending Approval' && !isViewer && (
                        <>
                          <button
                            onClick={() =>
                              setLeaves((prev) =>
                                prev.map((l) =>
                                  l.id === leave.id
                                    ? {
                                        ...l,
                                        status: 'Approved',
                                        approvedBy: currentUser?.name || 'Admin',
                                        approvedAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                      }
                                    : l
                                )
                              )
                            }
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              setLeaves((prev) =>
                                prev.map((l) =>
                                  l.id === leave.id ? { ...l, status: 'Declined', updatedAt: new Date().toISOString() } : l
                                )
                              )
                            }
                            className="px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-[10px] font-bold"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
