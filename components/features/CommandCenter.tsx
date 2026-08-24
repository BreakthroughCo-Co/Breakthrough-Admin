'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { Client, RestrictivePractice, Incident, BillingClaim, AuditLog, Practitioner } from '@/types';
import { DueForReviewSummaryWidget } from '@/components/features/DueForReviewSummaryWidget';
import { QuickActionsFloatingMenu } from '@/components/features/QuickActionsFloatingMenu';
import {
  Users,
  ShieldAlert,
  Lock,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Activity,
  ArrowUpRight,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Bell,
  Calendar,
  ArrowRight,
  X,
  FileText,
  Download,
  Printer,
  Search,
  ShieldCheck,
  Clock,
  Filter,
  CheckSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Award,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Eye,
  Flame,
  Radio
} from 'lucide-react';

export const CommandCenter: React.FC = () => {
  const {
    clients,
    restrictivePractices,
    incidents,
    billingClaims,
    auditLogs,
    notifications,
    practitioners,
    setActiveTab,
    dismissNotification,
    addAuditLog
  } = useManagementStore();

  const [alertFilter, setAlertFilter] = useState<'ALL' | 'AUDIT' | 'CLIENT_REVIEW' | 'HR_TASK' | 'CRITICAL'>('ALL');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Floating Incident Summary Widget State
  const [isIncidentWidgetOpen, setIsIncidentWidgetOpen] = useState(true);
  const [isIncidentWidgetMinimized, setIsIncidentWidgetMinimized] = useState(false);
  const [selectedWidgetSeverityFilter, setSelectedWidgetSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Real-time Pending Incidents Summary & Severity Distribution Calculation
  const incidentSummary = useMemo(() => {
    // Filter active/pending incidents (non-closed and non-resolved)
    const pending = incidents.filter(
      (i) => i.status !== 'Closed' && (i.status as string) !== 'Resolved'
    );

    const critical = pending.filter(
      (i) => i.severity === 'Critical / Reportable' || i.severity.toLowerCase().includes('critical')
    );
    const high = pending.filter(
      (i) => i.severity === 'High'
    );
    const medium = pending.filter(
      (i) => i.severity === 'Medium'
    );
    const low = pending.filter(
      (i) => i.severity === 'Low'
    );

    const reportableCount = pending.filter((i) => i.isNdisReportable).length;
    const pending24hr = pending.filter((i) => i.isNdisReportable && !i.ndis24hrNotified).length;
    const pending5day = pending.filter((i) => i.isNdisReportable && !i.ndis5daySubmitted).length;

    const total = pending.length;
    const critPct = total > 0 ? Math.round((critical.length / total) * 100) : 0;
    const highPct = total > 0 ? Math.round((high.length / total) * 100) : 0;
    const medPct = total > 0 ? Math.round((medium.length / total) * 100) : 0;
    const lowPct = total > 0 ? Math.max(0, 100 - (critPct + highPct + medPct)) : 0;

    return {
      totalPending: total,
      critical,
      high,
      medium,
      low,
      criticalCount: critical.length,
      highCount: high.length,
      mediumCount: medium.length,
      lowCount: low.length,
      critPct,
      highPct,
      medPct,
      lowPct,
      reportableCount,
      pending24hr,
      pending5day,
      pendingList: pending,
    };
  }, [incidents]);

  // Dynamic store-driven alert generator for Overdue Compliance Audits, Upcoming Client Reviews, and Pending HR Tasks
  const compiledAlerts = useMemo(() => {
    const list: {
      id: string;
      title: string;
      category: 'Overdue Compliance Audit' | 'Upcoming Client Review' | 'Pending HR Task';
      categoryKey: 'AUDIT' | 'CLIENT_REVIEW' | 'HR_TASK';
      description: string;
      dueDate: string;
      daysRemaining?: number;
      isOverdue: boolean;
      severity: 'Critical' | 'High' | 'Medium';
      linkTab: TabType;
      source: string;
      actionLabel: string;
      entityName?: string;
    }[] = [];

    // 1. OVERDUE & SCHEDULED COMPLIANCE AUDITS
    // 1.1 Restrictive Practice Reduction & Authorization Logs
    restrictivePractices.forEach((rp) => {
      const isOverdue = rp.monthlyReportStatus === 'Overdue';
      const isDue = rp.monthlyReportStatus === 'Due';
      if (isOverdue || isDue || rp.status === 'Active') {
        list.push({
          id: `rp-audit-${rp.id}`,
          title: `Restrictive Practice Reduction & Authorisation Audit`,
          category: 'Overdue Compliance Audit',
          categoryKey: 'AUDIT',
          description: `Statutory monthly reduction log for participant ${rp.clientName} (${rp.practiceType} - ${rp.subtype || 'Environmental/Mechanical'}). ${
            isOverdue ? 'CRITICAL: Submission to VIC Senior Practitioner Portal is overdue!' : 'Submission to NDIS Quality & Safeguards Commission due.'
          }`,
          dueDate: rp.expiryDate || '2026-08-31',
          isOverdue: isOverdue,
          severity: isOverdue ? 'Critical' : 'High',
          linkTab: 'restrictive-practices',
          source: 'Restrictive Practices Registry',
          actionLabel: 'Audit Practice',
          entityName: rp.clientName
        });
      }
    });

    // 1.2 NDIS Reportable Incidents 5-Day Root Cause Analysis Audit
    incidents.forEach((inc) => {
      if (inc.isNdisReportable && !inc.ndis5daySubmitted) {
        list.push({
          id: `inc-audit-5day-${inc.id}`,
          title: `NDIS Commission 5-Day Incident Investigation Audit`,
          category: 'Overdue Compliance Audit',
          categoryKey: 'AUDIT',
          description: `Reportable Incident (${inc.type}) for ${inc.clientName} occurred on ${inc.incidentDate}. Mandatory 5-Day Root Cause Analysis & Prevention Plan submission pending.`,
          dueDate: inc.incidentDate,
          isOverdue: true,
          severity: 'Critical',
          linkTab: 'incidents',
          source: 'Incident Governance Store',
          actionLabel: 'Complete 5-Day RCA',
          entityName: inc.clientName
        });
      }
    });

    // 1.3 Mandatory NDIS Mid-Cycle Quality Standards Internal Audit
    list.push({
      id: 'compliance-internal-audit-2026',
      title: 'NDIS Core Module 3: Provision of Supports Internal Quality Audit',
      category: 'Overdue Compliance Audit',
      categoryKey: 'AUDIT',
      description: 'Scheduled six-monthly internal compliance audit covering client risk assessments, positive behavior support clinical files, and emergency plans.',
      dueDate: '2026-08-28',
      isOverdue: false,
      severity: 'High',
      linkTab: 'audit',
      source: 'Quality Assurance Matrix',
      actionLabel: 'Open Audit Matrix'
    });

    // 1.4 Unreconciled Billing Claims Overdue for PRODA SLA
    const unreconciledOldClaims = (billingClaims || []).filter(
      (b) => b.status === 'Pending' && b.serviceDate && new Date(b.serviceDate) < new Date('2026-08-15')
    );
    if (unreconciledOldClaims.length > 0) {
      list.push({
        id: 'billing-sla-audit-alert',
        title: `NDIS PRODA Claim SLA Reconciliation Audit (${unreconciledOldClaims.length} Pending)`,
        category: 'Overdue Compliance Audit',
        categoryKey: 'AUDIT',
        description: `${unreconciledOldClaims.length} billing claims exceeding statutory 7-day PRODA lodgement window. Total pending value: $${unreconciledOldClaims
          .reduce((sum, c) => sum + c.totalAmount, 0)
          .toFixed(2)}.`,
        dueDate: '2026-08-20',
        isOverdue: true,
        severity: 'Critical',
        linkTab: 'billing',
        source: 'Billing Claims Ledger',
        actionLabel: 'Reconcile Claims'
      });
    }

    // 2. UPCOMING CLIENT REVIEWS
    // 2.1 NDIS Plan Reviews and Expiries
    clients.forEach((c) => {
      if (c.planEndDate) {
        list.push({
          id: `client-plan-review-${c.id}`,
          title: `NDIS Annual Plan Review & Clinical Progress Report`,
          category: 'Upcoming Client Review',
          categoryKey: 'CLIENT_REVIEW',
          description: `${c.name} (NDIS #${c.ndisNumber}) plan reaches scheduled term on ${c.planEndDate}. Allied health progress summary and outcome recommendations required for NDIA planner review.`,
          dueDate: c.planEndDate,
          isOverdue: new Date(c.planEndDate) < new Date('2026-08-20'),
          severity: 'High',
          linkTab: 'clients',
          source: 'NDIS Participant Registry',
          actionLabel: 'Review Participant',
          entityName: c.name
        });
      }

      // Check if client has goals needing re-assessment
      const inProgressGoals = (c.goals || []).filter((g) => g.status === 'In Progress');
      if (inProgressGoals.length > 0) {
        list.push({
          id: `client-gas-goal-${c.id}`,
          title: `GAS Outcome & Goal Reassessment Check-in`,
          category: 'Upcoming Client Review',
          categoryKey: 'CLIENT_REVIEW',
          description: `Goal Attainment Scaling (GAS) review due for ${c.name}: "${inProgressGoals[0]?.title}". Progress currently recorded at ${inProgressGoals[0]?.progressPercent || 0}%.`,
          dueDate: inProgressGoals[0]?.targetDate || '2026-12-31',
          isOverdue: false,
          severity: 'Medium',
          linkTab: 'case-notes',
          source: 'Clinical Outcomes Engine',
          actionLabel: 'Update Case Notes',
          entityName: c.name
        });
      }
    });

    // 2.2 12-Month Behaviour Support Plan (BSP) Scheduled Review
    list.push({
      id: 'bsp-scheduled-review-101',
      title: 'Comprehensive Behaviour Support Plan (BSP) Annual Review',
      category: 'Upcoming Client Review',
      categoryKey: 'CLIENT_REVIEW',
      description: 'Jordan Miller Comprehensive BSP v2.0 is due for 12-month statutory review, functional reassessment, and panel sign-off.',
      dueDate: '2026-09-15',
      isOverdue: false,
      severity: 'High',
      linkTab: 'bsp-plans',
      source: 'Clinical BSP Generator',
      actionLabel: 'Edit BSP Document',
      entityName: 'Jordan Miller'
    });

    // 3. PENDING HR TASKS
    practitioners.forEach((p) => {
      // 3.1 NDIS Worker Screening Check (NDISWC)
      if (p.screeningStatus === 'Expiring Soon' || p.screeningStatus === 'Expired' || p.workerScreeningStatus === 'Expiring') {
        const expiry = p.screeningExpiryDate || p.workerScreeningExpiry || '2026-09-30';
        const isExp = p.screeningStatus === 'Expired';
        list.push({
          id: `hr-ndiswc-${p.id}`,
          title: `NDIS Worker Screening Clearance Renewal (${isExp ? 'Expired' : 'Expiring Soon'})`,
          category: 'Pending HR Task',
          categoryKey: 'HR_TASK',
          description: `NDIS Worker Screening Check (NDISWC) for ${p.name} (${p.position}) requires renewal clearance prior to continued unsupervised clinical delivery. Expiry: ${expiry}.`,
          dueDate: expiry,
          isOverdue: isExp,
          severity: isExp ? 'Critical' : 'High',
          linkTab: 'hr-roster',
          source: 'HR Practitioner Roster',
          actionLabel: 'Update HR Record',
          entityName: p.name
        });
      }

      // 3.2 Police Check Renewal
      if (p.policeCheckExpiryDate || p.policeCheckExpiry) {
        const policeExp = p.policeCheckExpiryDate || p.policeCheckExpiry || '2026-10-20';
        list.push({
          id: `hr-police-check-${p.id}`,
          title: `National Police Clearance Annual Renewal`,
          category: 'Pending HR Task',
          categoryKey: 'HR_TASK',
          description: `Annual National Police Clearance check pending for practitioner ${p.name}. Due on ${policeExp}.`,
          dueDate: policeExp,
          isOverdue: false,
          severity: 'Medium',
          linkTab: 'hr-roster',
          source: 'HR Practitioner Roster',
          actionLabel: 'Verify Clearance',
          entityName: p.name
        });
      }

      // 3.3 Clinical Supervision / Induction Check
      const caseload = p.activeCaseload ?? p.activeCaseloadCount ?? 0;
      if (p.role === 'PRACTITIONER' || caseload > 10) {
        list.push({
          id: `hr-supervision-${p.id}`,
          title: `Mandatory Monthly Clinical Supervision & Case Review`,
          category: 'Pending HR Task',
          categoryKey: 'HR_TASK',
          description: `Principal Specialist monthly supervision session agenda & caseload audit required for ${p.name} (Active Caseload: ${caseload} clients).`,
          dueDate: '2026-08-30',
          isOverdue: false,
          severity: 'Medium',
          linkTab: 'hr-roster',
          source: 'HR Practitioner Roster',
          actionLabel: 'Schedule Session',
          entityName: p.name
        });
      }
    });

    // 4. App Notifications from Store
    notifications.forEach((n) => {
      const catKey: 'AUDIT' | 'CLIENT_REVIEW' | 'HR_TASK' =
        n.type === 'hr' ? 'HR_TASK' : n.type === 'clinical' ? 'CLIENT_REVIEW' : 'AUDIT';
      const catLabel =
        catKey === 'HR_TASK'
          ? 'Pending HR Task'
          : catKey === 'CLIENT_REVIEW'
          ? 'Upcoming Client Review'
          : 'Overdue Compliance Audit';

      list.push({
        id: n.id,
        title: n.title,
        category: catLabel,
        categoryKey: catKey,
        description: n.message,
        dueDate: 'Upcoming Milestone',
        isOverdue: n.severity === 'high',
        severity: n.severity === 'high' ? 'High' : 'Medium',
        linkTab: (n.linkTab as TabType) || 'command-center',
        source: 'System Dispatcher',
        actionLabel: 'View Module'
      });
    });

    return list;
  }, [notifications, practitioners, clients, restrictivePractices, incidents, billingClaims]);

  // Filter and search
  const visibleAlerts = useMemo(() => {
    return compiledAlerts.filter((item) => {
      if (dismissedIds.includes(item.id)) return false;

      // Category filter
      if (alertFilter === 'AUDIT' && item.categoryKey !== 'AUDIT') return false;
      if (alertFilter === 'CLIENT_REVIEW' && item.categoryKey !== 'CLIENT_REVIEW') return false;
      if (alertFilter === 'HR_TASK' && item.categoryKey !== 'HR_TASK') return false;
      if (alertFilter === 'CRITICAL' && item.severity !== 'Critical' && item.severity !== 'High' && !item.isOverdue) return false;

      // Search keyword
      if (alertSearchTerm.trim()) {
        const q = alertSearchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchEntity = item.entityName?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchCat && !matchEntity) return false;
      }

      return true;
    });
  }, [compiledAlerts, alertFilter, alertSearchTerm, dismissedIds]);

  // Counts for each category
  const auditAlertCount = compiledAlerts.filter((a) => a.categoryKey === 'AUDIT' && !dismissedIds.includes(a.id)).length;
  const reviewAlertCount = compiledAlerts.filter((a) => a.categoryKey === 'CLIENT_REVIEW' && !dismissedIds.includes(a.id)).length;
  const hrAlertCount = compiledAlerts.filter((a) => a.categoryKey === 'HR_TASK' && !dismissedIds.includes(a.id)).length;
  const criticalCountTotal = compiledAlerts.filter(
    (a) => (a.severity === 'Critical' || a.isOverdue) && !dismissedIds.includes(a.id)
  ).length;

  const handleDismiss = (id: string, title: string) => {
    setDismissedIds((prev) => [...prev, id]);
    dismissNotification(id);
    addAuditLog('DISMISS_ALERT', 'COMMAND_CENTER_NOTIFICATION_CENTER', id, `Acknowledged notification alert: "${title}"`);
  };

  const handleDismissAllFiltered = () => {
    const idsToDismiss = visibleAlerts.map((a) => a.id);
    setDismissedIds((prev) => [...prev, ...idsToDismiss]);
    addAuditLog(
      'DISMISS_BULK_ALERTS',
      'COMMAND_CENTER_NOTIFICATION_CENTER',
      `bulk-${Date.now()}`,
      `Acknowledged ${idsToDismiss.length} alerts under current filter (${alertFilter})`
    );
  };

  // Export Alerts to CSV
  const handleExportAlertsCSV = () => {
    const headers = ['Alert ID', 'Category', 'Severity', 'Status', 'Title', 'Description', 'Due Date', 'Related Entity', 'Action Link Module', 'Source'];
    const rows = visibleAlerts.map((a) => [
      `"${a.id}"`,
      `"${a.category}"`,
      `"${a.severity}"`,
      `"${a.isOverdue ? 'OVERDUE' : 'UPCOMING'}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      `"${a.dueDate}"`,
      `"${(a.entityName || 'N/A').replace(/"/g, '""')}"`,
      `"${a.linkTab}"`,
      `"${a.source}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NDIS_Notification_Center_Alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      'EXPORT_ALERTS_CSV',
      'COMMAND_CENTER_NOTIFICATION_CENTER',
      'alerts-csv',
      `Exported ${visibleAlerts.length} compliance, client review, and HR alerts to CSV.`
    );
  };

  // Export Alerts Digest to Printable PDF View
  const handleExportAlertsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Practice Command Center - Executive Notification Digest</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .badge { display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
            .badge-audit { background-color: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
            .badge-review { background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
            .badge-hr { background-color: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; }
            .stat-lbl { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .alert-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            .alert-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
            .alert-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 22px; color: #0f172a;">Executive Alert Digest & Governance Briefing</h1>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Breakthrough Allied Health OS • NDIS Quality & Safeguards Commission Compliance</p>
            </div>
            <div style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>Filter: ${alertFilter}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val" style="color: #e11d48;">${auditAlertCount}</div>
              <div class="stat-lbl">Overdue Compliance Audits</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #d97706;">${reviewAlertCount}</div>
              <div class="stat-lbl">Upcoming Client Reviews</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #0284c7;">${hrAlertCount}</div>
              <div class="stat-lbl">Pending HR Tasks</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #0d9488;">${visibleAlerts.length}</div>
              <div class="stat-lbl">Total Active Alerts</div>
            </div>
          </div>

          <table class="alert-table">
            <thead>
              <tr>
                <th style="width: 18%;">Category & Urgency</th>
                <th style="width: 25%;">Item & Scope</th>
                <th style="width: 35%;">Regulatory Summary & Action</th>
                <th style="width: 12%;">Due Date</th>
                <th style="width: 10%;">Module</th>
              </tr>
            </thead>
            <tbody>
              ${visibleAlerts
                .map((a) => `
                <tr>
                  <td>
                    <div class="badge ${
                      a.categoryKey === 'AUDIT' ? 'badge-audit' : a.categoryKey === 'CLIENT_REVIEW' ? 'badge-review' : 'badge-hr'
                    }">${a.category}</div>
                    <div style="margin-top: 4px; font-weight: 700; font-size: 11px; color: ${
                      a.severity === 'Critical' ? '#e11d48' : a.severity === 'High' ? '#d97706' : '#059669'
                    };">
                      ${a.isOverdue ? '⚠️ OVERDUE' : a.severity.toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <strong>${a.title}</strong>
                    ${a.entityName ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Subject: ${a.entityName}</div>` : ''}
                  </td>
                  <td>
                    ${a.description}
                  </td>
                  <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
                    ${a.dueDate}
                  </td>
                  <td>
                    <span style="font-family: 'JetBrains Mono', monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${a.linkTab}</span>
                  </td>
                </tr>
              `)
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>Provider Reg: 405001234 • Certified NDIS Registered Provider (Victoria & NSW)</div>
            <div>Sign-off: Dr. Sarah Jenkins (Clinical Director)</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    addAuditLog(
      'PRINT_ALERTS_PDF',
      'COMMAND_CENTER_NOTIFICATION_CENTER',
      'alerts-pdf',
      `Generated printable executive PDF digest containing ${visibleAlerts.length} governance alerts.`
    );
  };

  const activeRestrictive = restrictivePractices.filter(
    (r: RestrictivePractice) => r.status === 'Active' || r.status === 'Authorized'
  ).length;
  const criticalIncidents = incidents.filter(
    (i: Incident) => i.severity === 'Critical / Reportable' || i.severity === 'High'
  ).length;
  const pendingBilling = (billingClaims || [])
    .filter((b: BillingClaim) => b.status === 'Pending' || b.status === 'Approved')
    .reduce((acc: number, b: BillingClaim) => acc + b.totalAmount, 0);

  // Financial Summary Widget Data: Monthly Billable Hours vs Revenue
  const monthlyFinancialData = [
    { month: 'Mar', hours: 140, revenue: 30000 },
    { month: 'Apr', hours: 165, revenue: 35200 },
    { month: 'May', hours: 180, revenue: 38500 },
    { month: 'Jun', hours: 195, revenue: 41800 },
    { month: 'Jul', hours: 210, revenue: 45000 },
    { month: 'Aug', hours: 230, revenue: 49200 },
  ];

  const maxRevenue = Math.max(...monthlyFinancialData.map((d) => d.revenue));

  // Incident Severity Breakdown
  const criticalCount = incidents.filter((i) => i.severity === 'Critical / Reportable').length || 1;
  const highCount = incidents.filter((i) => i.severity === 'High').length || 1;
  const mediumCount = incidents.filter((i) => i.severity === 'Medium' || i.severity === 'Low').length || 2;
  const totalIncidents = criticalCount + highCount + mediumCount;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
            NDIS Practice Command Center
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            Breakthrough Coaching & Governance OS
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time Allied Health Governance, Restrictive Practice Tracking, Clinical Outcome Analytics, and PACE Compliance Monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('bsp-plans')}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Activity className="w-4 h-4" />
            <span>New BSP Generator</span>
          </button>
        </div>
      </div>

      {/* High-Level Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active NDIS Participants</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{clients.length}</div>
          <p className="text-[11px] text-emerald-400 font-medium">100% Active Capacity Plans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Restrictive Practices Active</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{activeRestrictive}</div>
          <p className="text-[11px] text-slate-400 font-medium">Under Senior Practitioner Regs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Critical Incidents (30d)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{criticalIncidents}</div>
          <p className="text-[11px] text-rose-400/80 font-medium">5-Day RCA Reports Pending</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Unreconciled Claims Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ${pendingBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Ready for PACE / PRODA</p>
        </div>
      </div>

      {/* SUMMARY WIDGET: HIGHLIGHTS 'DUE FOR REVIEW' COMPLIANCE TASKS & UPCOMING NDIS AUDIT DEADLINES */}
      <DueForReviewSummaryWidget />

      {/* DEDICATED NOTIFICATION CENTER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-lg relative overflow-hidden">
        {/* Glowing subtle top indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500" />

        {/* Notification Center Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  Command Center Notification Center
                </h3>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 font-mono px-2.5 py-0.5 rounded-full border border-rose-500/30 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  {visibleAlerts.length} Action Items Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized automated alerts for <strong>overdue compliance audits</strong>, <strong>upcoming client reviews</strong>, and <strong>pending HR tasks</strong> across your allied health practice.
              </p>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={handleExportAlertsCSV}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Download full alerts list in CSV format"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportAlertsPDF}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Open printable executive compliance summary"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / PDF Digest</span>
            </button>
            {visibleAlerts.length > 0 && (
              <button
                onClick={handleDismissAllFiltered}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1"
                title="Acknowledge all alerts currently displayed"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledge All</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Triage Badges Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Overdue Compliance Audits */}
          <button
            onClick={() => setAlertFilter(alertFilter === 'AUDIT' ? 'ALL' : 'AUDIT')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              alertFilter === 'AUDIT'
                ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                : 'bg-slate-950/70 border-slate-800 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Overdue Compliance Audits
              </span>
              <span className="text-xs font-mono font-black bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                {auditAlertCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Restrictive Practice reduction logs, 5-Day incident RCA submissions, internal quality audits.
            </p>
          </button>

          {/* Card 2: Upcoming Client Reviews */}
          <button
            onClick={() => setAlertFilter(alertFilter === 'CLIENT_REVIEW' ? 'ALL' : 'CLIENT_REVIEW')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              alertFilter === 'CLIENT_REVIEW'
                ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Upcoming Client Reviews
              </span>
              <span className="text-xs font-mono font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                {reviewAlertCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Annual NDIS plan expiration deadlines, BSP revisions, Goal Attainment Scaling assessments.
            </p>
          </button>

          {/* Card 3: Pending HR Tasks */}
          <button
            onClick={() => setAlertFilter(alertFilter === 'HR_TASK' ? 'ALL' : 'HR_TASK')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              alertFilter === 'HR_TASK'
                ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                : 'bg-slate-950/70 border-slate-800 hover:border-sky-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Pending HR Tasks
              </span>
              <span className="text-xs font-mono font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                {hrAlertCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Worker screening (NDISWC) renewals, Police check expirations, monthly clinical supervision.
            </p>
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setAlertFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                alertFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              All ({compiledAlerts.length - dismissedIds.length})
            </button>
            <button
              onClick={() => setAlertFilter('AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                alertFilter === 'AUDIT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              Overdue Compliance ({auditAlertCount})
            </button>
            <button
              onClick={() => setAlertFilter('CLIENT_REVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                alertFilter === 'CLIENT_REVIEW'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Client Reviews ({reviewAlertCount})
            </button>
            <button
              onClick={() => setAlertFilter('HR_TASK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                alertFilter === 'HR_TASK'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              HR Tasks ({hrAlertCount})
            </button>
            <button
              onClick={() => setAlertFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                alertFilter === 'CRITICAL'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Critical Only ({criticalCountTotal})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={alertSearchTerm}
              onChange={(e) => setAlertSearchTerm(e.target.value)}
              placeholder="Search alerts, staff, participants..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            {alertSearchTerm && (
              <button
                onClick={() => setAlertSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleAlerts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-200 text-sm">All Alert Obligations Clear</p>
              <p className="text-slate-400 max-w-md mx-auto">
                No active notifications found for the selected filter ({alertFilter}). All compliance audits, client reviews, and HR clearance requirements are up to date.
              </p>
            </div>
          ) : (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all shadow-sm group hover:border-slate-700 ${
                  alert.isOverdue
                    ? 'bg-gradient-to-b from-rose-950/30 to-slate-950 border-rose-500/40 hover:border-rose-500'
                    : alert.categoryKey === 'AUDIT'
                    ? 'bg-slate-950 border-rose-500/30 hover:border-rose-500/60'
                    : alert.categoryKey === 'CLIENT_REVIEW'
                    ? 'bg-slate-950 border-amber-500/30 hover:border-amber-500/60'
                    : 'bg-slate-950 border-sky-500/30 hover:border-sky-500/60'
                }`}
              >
                <div className="space-y-2">
                  {/* Category Pill + Urgency Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                        alert.categoryKey === 'AUDIT'
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : alert.categoryKey === 'CLIENT_REVIEW'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}
                    >
                      {alert.categoryKey === 'AUDIT' && <ShieldAlert className="w-2.5 h-2.5" />}
                      {alert.categoryKey === 'CLIENT_REVIEW' && <Calendar className="w-2.5 h-2.5" />}
                      {alert.categoryKey === 'HR_TASK' && <UserCheck className="w-2.5 h-2.5" />}
                      {alert.category}
                    </span>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        alert.isOverdue
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50 animate-pulse'
                          : alert.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : alert.severity === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {alert.isOverdue ? '⚠️ OVERDUE' : alert.severity}
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white leading-snug group-hover:text-teal-300 transition-colors">
                      {alert.title}
                    </h4>
                    {alert.entityName && (
                      <span className="text-[10px] text-teal-400 font-semibold mt-0.5 inline-block">
                        Participant / Staff: {alert.entityName}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                {/* Card Footer with Due Date and Action buttons */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Clock className={`w-3 h-3 ${alert.isOverdue ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span className={alert.isOverdue ? 'text-rose-300 font-bold' : ''}>
                      {alert.dueDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDismiss(alert.id, alert.title)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Acknowledge / Dismiss Alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab(alert.linkTab)}
                      className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 hover:border-teal-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Summary & Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Billable Hours vs Actual Revenue Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Financial Summary: Monthly Billable Hours vs Actual Revenue
              </h3>
              <p className="text-xs text-slate-400">
                Track practitioner billable output against total claim dollar value.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              Billing Ledger <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Responsive SVG Bar Chart */}
          <div className="h-56 w-full pt-4 flex flex-col justify-between">
            <div className="flex items-end justify-between gap-3 h-40 px-2">
              {monthlyFinancialData.map((d, i) => {
                const heightPercent = (d.revenue / maxRevenue) * 100;
                const hoursPercent = (d.hours / 250) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Hours Bar */}
                      <div
                        className="w-3.5 bg-teal-500/80 hover:bg-teal-400 rounded-t transition-all relative"
                        style={{ height: `${hoursPercent}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded border border-slate-800 font-mono hidden group-hover:block whitespace-nowrap z-10">
                          {d.hours} hrs
                        </div>
                      </div>
                      {/* Revenue Bar */}
                      <div
                        className="w-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all relative"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] px-1.5 py-0.5 rounded border border-slate-800 font-mono hidden group-hover:block whitespace-nowrap z-10">
                          ${(d.revenue / 1000).toFixed(1)}k
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">{d.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-800 text-[11px] font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-teal-500"></span>
                <span className="text-slate-300">Billable Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-300">Actual Revenue ($)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Incident Severity Breakdown Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-400" />
              Incident Severity Distribution
            </h3>
            <button
              onClick={() => setActiveTab('incidents')}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Incidents
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="4"
                    strokeDasharray={`${(criticalCount / totalIncidents) * 88} 100`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray={`${(highCount / totalIncidents) * 88} 100`}
                    strokeDashoffset={`-${(criticalCount / totalIncidents) * 88}`}
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray={`${(mediumCount / totalIncidents) * 88} 100`}
                    strokeDashoffset={`-${((criticalCount + highCount) / totalIncidents) * 88}`}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black text-white block">{totalIncidents}</span>
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Total Logs</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-300">Critical / Reportable</span>
                </div>
                <span className="font-mono font-bold text-rose-400">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-300">High Severity</span>
                </div>
                <span className="font-mono font-bold text-amber-400">{highCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Medium / Low</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{mediumCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Split: Participants Caseload & Compliance Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Participant Caseload Summary */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              Participant Caseload & Budget Utilization
            </h3>
            <button
              onClick={() => setActiveTab('clients')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {clients.map((client: Client) => {
              const utilPercent = client.totalBudget > 0 ? Math.round((client.spentBudget / client.totalBudget) * 100) : 0;
              return (
                <div
                  key={client.id}
                  className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{client.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                        NDIS #{client.ndisNumber}
                      </span>
                      {client.restrictivePracticesActive && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20">
                          Restrictive Practice
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{client.primaryDisability}</p>
                  </div>

                  <div className="w-full sm:w-48 space-y-1 shrink-0">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Budget Spent</span>
                      <span className="text-white font-mono font-bold">${client.spentBudget.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilPercent > 80 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(utilPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Snapshot Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Compliance Snapshot
            </h3>
            <button
              onClick={() => setActiveTab('audit-logs')}
              className="text-xs text-teal-400 hover:underline font-semibold"
            >
              Audit Trail
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Alert 1 */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold block">BSP Monthly Restrictive Practice Log</span>
                <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">5 Days Left</span>
              </div>
              <p className="text-[11px] text-amber-300/80">
                Monthly report for Jordan Miller due to NDIS Quality & Safeguards Commission.
              </p>
            </div>

            {/* Alert 2 */}
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold block">Pending 5-Day Commission Submission</span>
                <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.5 rounded font-mono font-bold">Action Needed</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                24-hr notification submitted for critical incident. Complete root cause analysis before day 5.
              </p>
            </div>

            {/* Recent Audit Ledger Snapshot */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recent Audit Trail Events
              </span>
              <div className="space-y-1">
                {auditLogs.slice(0, 3).map((log: AuditLog) => (
                  <div key={log.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                    <div className="flex justify-between font-bold text-white">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.actorName}</span>
                    </div>
                    <p className="text-slate-400 truncate text-[10px]">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING SUMMARY WIDGET: Real-time Incident & Severity Distribution Tracker */}
      {isIncidentWidgetOpen && (
        <div id="floating-incident-summary-widget" className="fixed bottom-5 right-5 z-40 max-w-[92vw] sm:max-w-md w-full">
          {isIncidentWidgetMinimized ? (
            /* Minimized Capsule Bar */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-auto w-fit flex items-center gap-3 bg-slate-900/95 hover:bg-slate-900 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-full px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer group"
              onClick={() => setIsIncidentWidgetMinimized(false)}
            >
              <div className="relative flex items-center justify-center">
                <span className={`w-2.5 h-2.5 rounded-full ${incidentSummary.criticalCount > 0 ? 'bg-rose-500 animate-ping' : incidentSummary.highCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-teal-400'}`} />
                <span className={`absolute w-2 h-2 rounded-full ${incidentSummary.criticalCount > 0 ? 'bg-rose-500' : incidentSummary.highCount > 0 ? 'bg-amber-500' : 'bg-teal-400'}`} />
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>{incidentSummary.totalPending} Pending Incidents</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {incidentSummary.criticalCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full font-bold">
                    {incidentSummary.criticalCount} Crit
                  </span>
                )}
                {incidentSummary.highCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                    {incidentSummary.highCount} High
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsIncidentWidgetMinimized(false);
                }}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Expand Widget"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            /* Full Expanded Floating Widget Card */
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/95 border border-slate-700 shadow-2xl rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[82vh]"
            >
              {/* Header */}
              <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white tracking-tight">Incidents & Hazards Desk</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {incidentSummary.totalPending} Active
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Real-time severity distribution & NDIS Commission SLA</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => setIsIncidentWidgetMinimized(true)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsIncidentWidgetOpen(false)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 space-y-3 overflow-y-auto">
                {/* Visual Stacked Severity Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                      Severity Distribution
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {incidentSummary.totalPending} Total Open
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
                    {incidentSummary.criticalCount > 0 && (
                      <div
                        style={{ width: `${incidentSummary.critPct}%` }}
                        className="h-full bg-rose-500 rounded-sm transition-all"
                        title={`Critical: ${incidentSummary.criticalCount} (${incidentSummary.critPct}%)`}
                      />
                    )}
                    {incidentSummary.highCount > 0 && (
                      <div
                        style={{ width: `${incidentSummary.highPct}%` }}
                        className="h-full bg-amber-500 rounded-sm transition-all"
                        title={`High: ${incidentSummary.highCount} (${incidentSummary.highPct}%)`}
                      />
                    )}
                    {incidentSummary.mediumCount > 0 && (
                      <div
                        style={{ width: `${incidentSummary.medPct}%` }}
                        className="h-full bg-yellow-500 rounded-sm transition-all"
                        title={`Medium: ${incidentSummary.mediumCount} (${incidentSummary.medPct}%)`}
                      />
                    )}
                    {incidentSummary.lowCount > 0 && (
                      <div
                        style={{ width: `${incidentSummary.lowPct}%` }}
                        className="h-full bg-emerald-500 rounded-sm transition-all"
                        title={`Low: ${incidentSummary.lowCount} (${incidentSummary.lowPct}%)`}
                      />
                    )}
                  </div>

                  {/* Distribution Legend & Severity Filter Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedWidgetSeverityFilter(selectedWidgetSeverityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                      className={`p-1.5 rounded-lg border text-left transition-all ${
                        selectedWidgetSeverityFilter === 'CRITICAL'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/15'
                      }`}
                    >
                      <span className="text-[9px] font-bold block opacity-80 uppercase">Critical</span>
                      <span className="text-xs font-black">{incidentSummary.criticalCount}</span>
                    </button>

                    <button
                      onClick={() => setSelectedWidgetSeverityFilter(selectedWidgetSeverityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
                      className={`p-1.5 rounded-lg border text-left transition-all ${
                        selectedWidgetSeverityFilter === 'HIGH'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15'
                      }`}
                    >
                      <span className="text-[9px] font-bold block opacity-80 uppercase">High</span>
                      <span className="text-xs font-black">{incidentSummary.highCount}</span>
                    </button>

                    <button
                      onClick={() => setSelectedWidgetSeverityFilter(selectedWidgetSeverityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
                      className={`p-1.5 rounded-lg border text-left transition-all ${
                        selectedWidgetSeverityFilter === 'MEDIUM'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200 ring-1 ring-yellow-500'
                          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/15'
                      }`}
                    >
                      <span className="text-[9px] font-bold block opacity-80 uppercase">Medium</span>
                      <span className="text-xs font-black">{incidentSummary.mediumCount}</span>
                    </button>

                    <button
                      onClick={() => setSelectedWidgetSeverityFilter(selectedWidgetSeverityFilter === 'LOW' ? 'ALL' : 'LOW')}
                      className={`p-1.5 rounded-lg border text-left transition-all ${
                        selectedWidgetSeverityFilter === 'LOW'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15'
                      }`}
                    >
                      <span className="text-[9px] font-bold block opacity-80 uppercase">Low</span>
                      <span className="text-xs font-black">{incidentSummary.lowCount}</span>
                    </button>
                  </div>
                </div>

                {/* Mandatory NDIS Commission SLA Alerts */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      NDIS Commission Compliance
                    </span>
                    <span className="text-[10px] text-teal-400 font-mono">
                      {incidentSummary.reportableCount} Reportable
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block">24h Notification</span>
                      <span className={`font-bold ${incidentSummary.pending24hr > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {incidentSummary.pending24hr > 0 ? `${incidentSummary.pending24hr} Action Due` : '100% Lodged'}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block">5-Day RCA Plan</span>
                      <span className={`font-bold ${incidentSummary.pending5day > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {incidentSummary.pending5day > 0 ? `${incidentSummary.pending5day} In Progress` : 'All Submitted'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Incident Preview Items List */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>
                      {selectedWidgetSeverityFilter === 'ALL'
                        ? 'Pending Incident Stream'
                        : `${selectedWidgetSeverityFilter} Incidents`}
                    </span>
                    {selectedWidgetSeverityFilter !== 'ALL' && (
                      <button
                        onClick={() => setSelectedWidgetSeverityFilter('ALL')}
                        className="text-teal-400 hover:underline capitalize font-normal"
                      >
                        Show all
                      </button>
                    )}
                  </div>

                  {incidentSummary.pendingList
                    .filter((inc) => {
                      if (selectedWidgetSeverityFilter === 'CRITICAL') {
                        return inc.severity === 'Critical / Reportable' || inc.severity.toLowerCase().includes('critical');
                      }
                      if (selectedWidgetSeverityFilter === 'HIGH') return inc.severity === 'High';
                      if (selectedWidgetSeverityFilter === 'MEDIUM') return inc.severity === 'Medium';
                      if (selectedWidgetSeverityFilter === 'LOW') return inc.severity === 'Low';
                      return true;
                    })
                    .slice(0, 3)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[11px] transition-colors flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{inc.clientName}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                inc.severity.includes('Critical')
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : inc.severity === 'High'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : inc.severity === 'Medium'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{inc.description}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('incidents')}
                          className="shrink-0 p-1 bg-slate-800 hover:bg-teal-500 text-slate-300 hover:text-slate-950 rounded text-[10px] font-semibold transition-colors"
                          title="View in Incidents Module"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIsIncidentWidgetMinimized(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Hide details
                </button>

                <button
                  onClick={() => setActiveTab('incidents')}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span>Open Incident Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* FLOATING QUICK ACTIONS BUTTON (CREATE CLIENT, CASE NOTE, INCIDENT) */}
      <QuickActionsFloatingMenu />
    </div>
  );
};
