'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  AlertTriangle,
  FileCheck,
  UserCheck,
  ArrowRight,
  Printer,
  Sparkles,
  CheckCircle2,
  Lock,
  FileText,
  Activity,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';

export const DueForReviewSummaryWidget: React.FC = () => {
  const {
    clients,
    practitioners,
    restrictivePractices,
    incidents,
    setActiveTab,
    setSelectedClientId,
    addAuditLog
  } = useManagementStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AUDIT' | 'BSP_CLIENT' | 'STAFF'>('ALL');

  // Calculate and compile all Due for Review statutory tasks and NDIS Audit deadlines
  const reviewTasks = useMemo(() => {
    const today = new Date('2026-08-22'); // current app date

    const items: {
      id: string;
      title: string;
      category: 'Statutory Audit Deadline' | 'Client BSP & Plan Review' | 'Staff Credential Renewal';
      categoryKey: 'AUDIT' | 'BSP_CLIENT' | 'STAFF';
      subjectName: string;
      deadlineDate: string;
      daysRemaining: number;
      isOverdue: boolean;
      urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      linkTab: TabType;
      clientId?: string;
      actionLabel: string;
      description: string;
      regulatoryStandard: string;
    }[] = [];

    // 1. Mandatory NDIS Commission Surveillance / Mid-Term Audit
    items.push({
      id: 'statutory-surveillance-audit-2026',
      title: 'NDIS Commission Surveillance Audit (Core Modules 1-4)',
      category: 'Statutory Audit Deadline',
      categoryKey: 'AUDIT',
      subjectName: 'Breakthrough Coaching & Consulting Practice',
      deadlineDate: '2026-09-10',
      daysRemaining: 19,
      isOverdue: false,
      urgency: 'HIGH',
      linkTab: 'audit',
      actionLabel: 'Open Audit Matrix',
      description: 'Surveillance audit covering clinical file sampling, participant consent registers, and incident prevention protocols.',
      regulatoryStandard: 'NDIS Practice Standards Core Module 3 (Clause 18)'
    });

    items.push({
      id: 'bsp-quality-safeguards-sample-audit',
      title: 'Positive Behaviour Support Clinical Governance Internal Audit',
      category: 'Statutory Audit Deadline',
      categoryKey: 'AUDIT',
      subjectName: 'Behaviour Support Division',
      deadlineDate: '2026-08-29',
      daysRemaining: 7,
      isOverdue: false,
      urgency: 'CRITICAL',
      linkTab: 'audit',
      actionLabel: 'View Audit Hub',
      description: 'Clinical peer review and quality check of all interim and comprehensive BSP documents prior to external lodgement.',
      regulatoryStandard: 'NDIS (Restrictive Practices and Behaviour Support) Rules 2018'
    });

    // 2. Client BSP and Annual Plan Expiries
    clients.forEach((c) => {
      // Plan End Date
      if (c.planEndDate) {
        const pEnd = new Date(c.planEndDate);
        const diffDays = Math.ceil((pEnd.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          items.push({
            id: `plan-rev-${c.id}`,
            title: `NDIS Annual Plan Review & Outcome Report`,
            category: 'Client BSP & Plan Review',
            categoryKey: 'BSP_CLIENT',
            subjectName: `${c.name} (NDIS #${c.ndisNumber})`,
            deadlineDate: c.planEndDate,
            daysRemaining: diffDays,
            isOverdue: diffDays < 0,
            urgency: diffDays < 14 ? 'CRITICAL' : diffDays <= 30 ? 'HIGH' : 'MEDIUM',
            linkTab: 'clients',
            clientId: c.id,
            actionLabel: 'Review Plan',
            description: `Allied Health Therapy outcome progress report and recommendations required for NDIA delegate reassessment.`,
            regulatoryStandard: 'NDIA Operational Guideline - Planning'
          });
        }
      }
    });

    // Behaviour Support Plan 12-Month Expiry
    items.push({
      id: 'bsp-expiry-jordan-miller',
      title: 'Comprehensive Behaviour Support Plan (BSP) Annual Expiry',
      category: 'Client BSP & Plan Review',
      categoryKey: 'BSP_CLIENT',
      subjectName: 'Jordan Miller',
      deadlineDate: '2026-09-02',
      daysRemaining: 11,
      isOverdue: false,
      urgency: 'CRITICAL',
      linkTab: 'bsp-plans',
      actionLabel: 'Renew BSP',
      description: 'Statutory 12-month Comprehensive BSP reaches expiry. Requires updated Functional Behaviour Assessment and family sign-off.',
      regulatoryStandard: 'NDIS Quality & Safeguards Commission Rules (Section 21)'
    });

    // 3. Restrictive Practice Authorisations Due for Monthly Reduction Log
    restrictivePractices.forEach((rp) => {
      if (rp.monthlyReportStatus === 'Due' || rp.monthlyReportStatus === 'Overdue' || rp.status === 'Active') {
        const isOverdue = rp.monthlyReportStatus === 'Overdue';
        items.push({
          id: `rp-review-${rp.id}`,
          title: `Restrictive Practice Authorisation & Reduction Log`,
          category: 'Statutory Audit Deadline',
          categoryKey: 'AUDIT',
          subjectName: `${rp.clientName} (${rp.practiceType})`,
          deadlineDate: rp.expiryDate || '2026-08-31',
          daysRemaining: isOverdue ? -2 : 9,
          isOverdue: isOverdue,
          urgency: isOverdue ? 'CRITICAL' : 'HIGH',
          linkTab: 'restrictive-practices',
          actionLabel: 'Authorise RP',
          description: `Mandatory monthly submission of restrictive practice usage log to State Senior Practitioner & Commission portal.`,
          regulatoryStandard: 'NDIS Restrictive Practices Rules 2018'
        });
      }
    });

    // 4. Incident 5-Day Root Cause Analysis (RCA) Reports
    incidents.forEach((inc) => {
      if (inc.isNdisReportable && !inc.ndis5daySubmitted) {
        items.push({
          id: `inc-5day-review-${inc.id}`,
          title: `NDIS Commission 5-Day RCA Investigation Submission`,
          category: 'Statutory Audit Deadline',
          categoryKey: 'AUDIT',
          subjectName: `${inc.clientName} (${inc.type})`,
          deadlineDate: '2026-08-25',
          daysRemaining: 3,
          isOverdue: false,
          urgency: 'CRITICAL',
          linkTab: 'incidents',
          actionLabel: 'Lodge 5-Day RCA',
          description: `Statutory 5-day formal investigation report & corrective action plan following Reportable Incident disclosure.`,
          regulatoryStandard: 'NDIS (Incident Management and Reportable Incidents) Rules 2018'
        });
      }
    });

    // 5. Staff Screening & Credential Renewals
    practitioners.forEach((p) => {
      if (p.screeningStatus === 'Expiring Soon' || p.screeningStatus === 'Expired' || p.workerScreeningStatus === 'Expiring') {
        const expiry = p.screeningExpiryDate || p.workerScreeningExpiry || '2026-09-02';
        const isExp = p.screeningStatus === 'Expired';
        items.push({
          id: `staff-nwsc-review-${p.id}`,
          title: `NDIS Worker Screening Clearance (NWSC) Renewal`,
          category: 'Staff Credential Renewal',
          categoryKey: 'STAFF',
          subjectName: `${p.name} (${p.position})`,
          deadlineDate: expiry,
          daysRemaining: isExp ? -1 : 11,
          isOverdue: isExp,
          urgency: isExp ? 'CRITICAL' : 'HIGH',
          linkTab: 'hr-roster',
          actionLabel: 'Update Clearance',
          description: `Mandatory NDIS Worker Screening Check must be renewed before staff member can deliver unsupervised clinical support.`,
          regulatoryStandard: 'NDIS (Practice Standards - Worker Screening) Rules 2018'
        });
      }

      if (p.policeCheckExpiryDate && p.policeCheckExpiryDate.includes('2026-10')) {
        items.push({
          id: `staff-police-check-${p.id}`,
          title: `National Police Check (NPC) Re-certification`,
          category: 'Staff Credential Renewal',
          categoryKey: 'STAFF',
          subjectName: `${p.name} (${p.position})`,
          deadlineDate: p.policeCheckExpiryDate,
          daysRemaining: 58,
          isOverdue: false,
          urgency: 'MEDIUM',
          linkTab: 'hr-roster',
          actionLabel: 'Check Roster',
          description: `Triennial police check renewal for allied health practitioner clinical governance file.`,
          regulatoryStandard: 'NDIS Provider Governance Guidelines'
        });
      }
    });

    // Sort by urgency and days remaining
    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [clients, practitioners, restrictivePractices, incidents]);

  // Filtered List
  const filteredTasks = useMemo(() => {
    if (activeFilter === 'ALL') return reviewTasks;
    return reviewTasks.filter((t) => t.categoryKey === activeFilter);
  }, [reviewTasks, activeFilter]);

  const criticalCount = reviewTasks.filter((t) => t.urgency === 'CRITICAL' || t.isOverdue).length;
  const highCount = reviewTasks.filter((t) => t.urgency === 'HIGH' && !t.isOverdue).length;
  const mediumCount = reviewTasks.filter((t) => t.urgency === 'MEDIUM').length;

  const handleTaskAction = (task: (typeof reviewTasks)[0]) => {
    if (task.clientId) {
      setSelectedClientId(task.clientId);
    }
    setActiveTab(task.linkTab);
    addAuditLog(
      'NAVIGATE_REVIEW_TASK',
      'DueForReviewRadar',
      task.id,
      `Navigated to ${task.linkTab} to action review task: "${task.title}"`
    );
  };

  const handlePrintAuditDigest = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Audit & Compliance Review Radar - Statutory Digest</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: 700; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }
            .badge-crit { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
            .badge-high { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .badge-med { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 20px; color: #0f172a;">Due for Review & NDIS Audit Statutory Readiness Report</h1>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px;">Breakthrough Coaching & Consulting • Clinical Governance Matrix</p>
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>Audit Readiness: 96% Compliant</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff1f2;">
              <div style="font-size: 18px; font-weight: 800; color: #e11d48;">${criticalCount}</div>
              <div style="font-size: 11px; color: #9f1239; font-weight: 700;">Critical / Due &lt; 7 Days</div>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fffbeb;">
              <div style="font-size: 18px; font-weight: 800; color: #d97706;">${highCount}</div>
              <div style="font-size: 11px; color: #92400e; font-weight: 700;">High Urgency &lt; 30 Days</div>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f0fdf4;">
              <div style="font-size: 18px; font-weight: 800; color: #059669;">${reviewTasks.length}</div>
              <div style="font-size: 11px; color: #065f46; font-weight: 700;">Total Active Obligations</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Urgency</th>
                <th style="width: 25%;">Task & Subject</th>
                <th style="width: 40%;">Statutory Requirement & Scope</th>
                <th style="width: 10%;">Deadline</th>
                <th style="width: 10%;">Standard</th>
              </tr>
            </thead>
            <tbody>
              ${reviewTasks
                .map((t) => `
                <tr>
                  <td>
                    <span class="badge ${t.urgency === 'CRITICAL' ? 'badge-crit' : t.urgency === 'HIGH' ? 'badge-high' : 'badge-med'}">
                      ${t.isOverdue ? '⚠️ OVERDUE' : `${t.daysRemaining}d Left`}
                    </span>
                  </td>
                  <td>
                    <strong>${t.title}</strong>
                    <div style="font-size: 11px; color: #64748b;">${t.subjectName}</div>
                  </td>
                  <td>
                    ${t.description}
                  </td>
                  <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
                    ${t.deadlineDate}
                  </td>
                  <td style="font-size: 10px; color: #475569;">
                    ${t.regulatoryStandard}
                  </td>
                </tr>
              `)
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>NDIS Provider Verification: 405001234 • Victoria & NSW</div>
            <div>Sign-off: Dr. Sarah Jenkins (Clinical Governance Lead)</div>
          </div>

          <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 400); };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl relative overflow-hidden" id="due-for-review-summary-widget">
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-amber-500" />

      {/* Widget Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-sky-500/20 text-teal-400 rounded-2xl border border-teal-500/30 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                NDIS Compliance &amp; Due for Review Radar
              </h3>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-teal-500/20 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                {reviewTasks.length} Statutory Review Tasks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking for upcoming <strong>NDIS audit deadlines</strong>, <strong>expiring BSP documents</strong>, <strong>restrictive practice authorisations</strong>, and <strong>practitioner screenings</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintAuditDigest}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Export full statutory audit checklist in printable PDF format"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Audit Checklist</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Quality Audit Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30 space-y-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical / &lt; 7 Days</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">{criticalCount}</div>
          <p className="text-[10px] text-slate-400">Requires immediate sign-off</p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">High / &lt; 30 Days</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">{highCount}</div>
          <p className="text-[10px] text-slate-400">Scheduled clinical reviews</p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-teal-500/30 space-y-1">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Audit Readiness</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-teal-400 font-mono">96.4%</div>
          <p className="text-[10px] text-emerald-400 font-medium">Surveillance Audit Ready</p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-sky-500/30 space-y-1">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Tasks</span>
            <FileCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{reviewTasks.length}</div>
          <p className="text-[10px] text-slate-400">Under continuous monitoring</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
            activeFilter === 'ALL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Due Tasks ({reviewTasks.length})
        </button>

        <button
          onClick={() => setActiveFilter('AUDIT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeFilter === 'AUDIT'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Statutory Audit Deadlines ({reviewTasks.filter((t) => t.categoryKey === 'AUDIT').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('BSP_CLIENT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeFilter === 'BSP_CLIENT'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Client BSP &amp; Plan Reviews ({reviewTasks.filter((t) => t.categoryKey === 'BSP_CLIENT').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('STAFF')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeFilter === 'STAFF'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Staff Screening &amp; CPD ({reviewTasks.filter((t) => t.categoryKey === 'STAFF').length})</span>
        </button>
      </div>

      {/* Task List / Radar Stream */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">All compliance items up to date</p>
            <p className="text-xs text-slate-500">No overdue or pending reviews found under this category.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                task.isOverdue
                  ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                  : task.urgency === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                  : task.urgency === 'HIGH'
                  ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                      task.isOverdue
                        ? 'bg-rose-500 text-white'
                        : task.urgency === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : task.urgency === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {task.isOverdue ? '⚠️ Overdue' : `${task.daysRemaining} Days Left`}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {task.category}
                  </span>

                  <span className="text-xs font-bold text-white truncate max-w-xs">
                    {task.title}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-snug">
                  {task.description}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 flex-wrap">
                  <span>Subject: <strong className="text-slate-200">{task.subjectName}</strong></span>
                  <span>•</span>
                  <span>Due: <strong className="text-teal-400 font-mono">{task.deadlineDate}</strong></span>
                  <span>•</span>
                  <span className="text-slate-400 italic">{task.regulatoryStandard}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleTaskAction(task)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${
                  task.urgency === 'CRITICAL' || task.isOverdue
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : task.urgency === 'HIGH'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/40'
                }`}
              >
                <span>{task.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
