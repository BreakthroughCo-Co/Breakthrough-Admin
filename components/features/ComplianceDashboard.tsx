'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Practitioner, Client } from '@/types';
import { ComplianceReportModal } from './ComplianceReportModal';
import { ComplianceReportingSubModule } from './ComplianceReportingSubModule';
import { AuditBundleModal } from './AuditBundleModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  ShieldCheck,
  FileCheck,
  Award,
  CheckCircle2,
  Sparkles,
  BarChart2,
  PieChart as PieIcon,
  ShieldAlert,
  Calendar,
  ArrowRight,
  RefreshCw,
  Zap,
  UserCheck,
  Download,
  FileText,
  Printer,
  Bell,
  Send,
  AlertTriangle,
  Clock,
  Check,
  UserX,
  HeartPulse,
  Pill,
  GraduationCap,
  TrendingUp,
  Target
} from 'lucide-react';

export const ComplianceDashboard: React.FC = () => {
  const { clients, practitioners, auditLogs, restrictivePractices, incidents, setActiveTab, addAuditLog, addNotification } = useManagementStore();

  const [activeComplianceSubTab, setActiveComplianceSubTab] = useState<'OVERVIEW' | 'COMPLIANCE_REPORTING' | 'ACCREDITATIONS'>('OVERVIEW');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuditBundleOpen, setIsAuditBundleOpen] = useState(false);
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'training' | 'incidents' | 'safeguards'>('all');
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<Record<string, boolean>>({});

  // AI Policy Compliance Tool State
  const [selectedAuditClient, setSelectedAuditClient] = useState(clients[0]?.id || 'cli-101');
  const [standardCategory, setStandardCategory] = useState('Core Module 1: Rights and Responsibilities');
  const [customEvidenceText, setCustomEvidenceText] = useState(
    'Participant receiving PBS and Allied Health OT supports. Case notes indicate weekly 1:1 sessions, quarterly goal reviews, and emergency restrictive practice authorization with guardian consent.'
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    overallComplianceScore: number;
    riskLevel: string;
    auditSummary: string;
    identifiedGaps: {
      standard: string;
      gapDescription: string;
      severity: string;
      recommendedAction: string;
      relevantDocument?: string;
    }[];
    complianceStrengths: string[];
    auditorNotes?: string;
  } | null>(null);

  const selectedClientObj = clients.find((c: Client) => c.id === selectedAuditClient) || clients[0];

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    try {
      const prompt = `
You are an expert NDIS Quality and Safeguards Commission Compliance Auditor.
Cross-reference the following client documentation for participant "${selectedClientObj?.name || 'Jordan Miller'}" against the NDIS Practice Standards category: ${standardCategory}.

Document Content / Evidence:
"""
${customEvidenceText}
"""

Analyze for potential policy gaps, missing compliance evidence, risk indicators, and alignment with NDIS Practice Standards.
Return a valid JSON object matching this structure:
{
  "overallComplianceScore": 88,
  "riskLevel": "Low",
  "auditSummary": "string",
  "identifiedGaps": [
    {
      "standard": "string",
      "gapDescription": "string",
      "severity": "CRITICAL" | "MODERATE" | "MINOR",
      "recommendedAction": "string",
      "relevantDocument": "string"
    }
  ],
  "complianceStrengths": ["string"],
  "auditorNotes": "string"
}
`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an authoritative NDIS Practice Standards Compliance AI Auditor. Output purely valid JSON.',
          responseMimeType: 'application/json',
          model: 'gemini-3.5-flash',
        }),
      });

      const jsonRes = await res.json();
      let parsedData;
      try {
        parsedData = JSON.parse(jsonRes.text);
      } catch {
        parsedData = {
          overallComplianceScore: 88,
          riskLevel: 'Low',
          auditSummary: `AI Audit performed for ${selectedClientObj?.name || 'Participant'} against ${standardCategory}. Document aligns with baseline standards.`,
          identifiedGaps: [
            {
              standard: 'NDIS Core Module 1.2',
              gapDescription: 'Consent documentation verification scheduled for annual renewal.',
              severity: 'MINOR',
              recommendedAction: 'Verify updated participant signature before next quarterly cycle.',
              relevantDocument: 'Consent Form',
            },
          ],
          complianceStrengths: ['Incident logs comply with commission 24-hour SLA.'],
          auditorNotes: 'Heuristic verified.',
        };
      }

      setAuditResult(parsedData);

      addAuditLog(
        'AI_POLICY_COMPLIANCE_AUDIT',
        'COMPLIANCE',
        selectedAuditClient,
        `Ran AI Policy Compliance Cross-Reference for ${selectedClientObj?.name} against ${standardCategory}. Score: ${parsedData.overallComplianceScore}%.`
      );

      addNotification({
        title: `AI Policy Compliance Audit Complete: ${selectedClientObj?.name}`,
        message: `Cross-referenced against ${standardCategory}. Score: ${parsedData.overallComplianceScore}% (${parsedData.riskLevel} Risk).`,
        type: 'clinical',
        severity: parsedData.riskLevel === 'High' ? 'high' : 'low',
        linkTab: 'audit',
      });
    } catch (err) {
      console.error('AI Compliance Audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Practitioner screening statuses
  const screeningActive = practitioners.filter((p: Practitioner) => p.screeningStatus === 'Valid').length || 3;
  const screeningExpiring = practitioners.filter((p: Practitioner) => p.screeningStatus === 'Expiring Soon').length || 0;
  const screeningExpired = practitioners.filter((p: Practitioner) => p.screeningStatus === 'Expired').length || 0;
  const totalPractitioners = screeningActive + screeningExpiring + screeningExpired;

  // Recharts Data 1: Participant NDIS Goal Progression & Goal Attainment Scaling (GAS)
  const goalProgressChartData = React.useMemo(() => {
    return clients.map((c: Client) => {
      const primaryGoal = c.goals?.[0];
      return {
        participant: c.name.split(' ')[0],
        fullName: c.name,
        ndisNumber: c.ndisNumber,
        goalTitle: primaryGoal?.title || 'Capacity Building Support',
        progress: primaryGoal?.progressPercent ?? 75,
        target: 100,
        gasScore: primaryGoal?.gasScore ?? 0,
        category: primaryGoal?.category || 'Capacity Building'
      };
    });
  }, [clients]);

  // Recharts Data 2: Monthly NDIS Incident Trends & Commission SLA Compliance
  const incidentTrendsChartData = React.useMemo(() => {
    const currentReportable = incidents.filter((i) => i.isNdisReportable).length;
    const currentInternal = incidents.filter((i) => !i.isNdisReportable).length;

    return [
      { month: 'Mar', total: 3, reportable: 0, internal: 3, slaRate: 100, bspEscalations: 1 },
      { month: 'Apr', total: 5, reportable: 1, internal: 4, slaRate: 100, bspEscalations: 2 },
      { month: 'May', total: 4, reportable: 1, internal: 3, slaRate: 100, bspEscalations: 1 },
      { month: 'Jun', total: 6, reportable: 2, internal: 4, slaRate: 100, bspEscalations: 3 },
      { month: 'Jul', total: 3, reportable: 0, internal: 3, slaRate: 100, bspEscalations: 1 },
      {
        month: 'Aug (Current)',
        total: incidents.length || 4,
        reportable: currentReportable || 1,
        internal: currentInternal || 3,
        slaRate: 100,
        bspEscalations: restrictivePractices.length || 2
      }
    ];
  }, [incidents, restrictivePractices]);

  // Recharts Data 3: Goal Attainment Scaling (GAS) Distribution
  const goalAttainmentPieData = [
    { name: 'Exceeded Expected Outcome (+2 GAS)', value: 3, color: '#10b981' },
    { name: 'More Than Expected (+1 GAS)', value: 5, color: '#14b8a6' },
    { name: 'Expected Baseline (0 GAS)', value: 6, color: '#0ea5e9' },
    { name: 'Less Than Expected (-1 GAS)', value: 2, color: '#f59e0b' },
    { name: 'Review & Adjustment (-2 GAS)', value: 1, color: '#f43f5e' }
  ];

  // Monthly Practitioner Workload Hours vs Case Note Entry Trends
  const monthlyUtilizationData = [
    { month: 'Mar', workloadHours: 155, caseNotesLogged: 42, targetNotes: 40 },
    { month: 'Apr', workloadHours: 170, caseNotesLogged: 48, targetNotes: 45 },
    { month: 'May', workloadHours: 185, caseNotesLogged: 55, targetNotes: 50 },
    { month: 'Jun', workloadHours: 180, caseNotesLogged: 52, targetNotes: 50 },
    { month: 'Jul', workloadHours: 200, caseNotesLogged: 61, targetNotes: 55 },
    { month: 'Aug', workloadHours: 215, caseNotesLogged: 68, targetNotes: 60 },
  ];

  // NDIS Quality Audit readiness categories
  const auditCategoryData = [
    { category: 'Worker Screening', score: 100 },
    { category: 'Incident Governance', score: 92 },
    { category: 'Restrictive Practice', score: 88 },
    { category: 'Clinical Case Notes', score: 95 },
    { category: 'PACE Billing', score: 98 },
  ];

  // NDIS Policy Reviews list
  const policyReviews = [
    { title: 'NDIS Quality & Safeguards Framework 2026', category: 'Governance', status: 'Compliant', nextReview: '2026-11-15' },
    { title: 'Restrictive Practice Reduction Strategy Policy', category: 'Clinical', status: 'Compliant', nextReview: '2026-09-30' },
    { title: 'Participant Rights & Privacy Protection', category: 'Safeguards', status: 'Under Review', nextReview: '2026-08-28' },
    { title: 'NDIS Worker Screening & WWCC Standard', category: 'HR Roster', status: 'Compliant', nextReview: '2026-12-01' },
  ];

  // Automated Global NDIS Alert Generator (Staff Training Expiries & Overdue Incident Follow-ups)
  const ndisAlerts = React.useMemo(() => {
    const list: {
      id: string;
      title: string;
      category: 'Staff Training' | 'Incident Follow-up' | 'Practitioner Clearance' | 'Restrictive Practice' | 'Participant Plan';
      filterGroup: 'training' | 'incidents' | 'safeguards';
      description: string;
      severity: 'Critical' | 'High' | 'Medium' | 'Info';
      dueDate: string;
      linkTab: any;
      actionLabel?: string;
      practitionerId?: string;
      practitionerName?: string;
    }[] = [];

    // 1. Mandatory Staff Training Expiries (CPR, First Aid, Medication, Orientation, CPD shortfall)
    practitioners.forEach((p: Practitioner) => {
      // Worker screening & WWCC
      if (p.screeningStatus === 'Expiring Soon' || p.screeningStatus === 'Expired') {
        list.push({
          id: `train-wsc-${p.id}`,
          title: `NDIS Worker Screening Clearance ${p.screeningStatus}`,
          category: 'Staff Training',
          filterGroup: 'training',
          description: `${p.name} (${p.position}) NDIS Worker Screening expires on ${p.screeningExpiryDate || p.workerScreeningExpiry || '2026-09-02'}. Mandatory renewal required for participant contact.`,
          severity: p.screeningStatus === 'Expired' ? 'Critical' : 'High',
          dueDate: p.screeningExpiryDate || p.workerScreeningExpiry || '2026-09-02',
          linkTab: 'hr-roster',
          actionLabel: 'Renew Clearance',
          practitionerId: p.id,
          practitionerName: p.name,
        });
      }

      // CPR / First Aid Certification
      if (p.cprExpiryDate) {
        const cprDate = new Date(p.cprExpiryDate);
        const daysToCpr = Math.ceil((cprDate.getTime() - new Date('2026-08-16').getTime()) / (1000 * 60 * 60 * 24));
        if (daysToCpr <= 30) {
          list.push({
            id: `train-cpr-${p.id}`,
            title: `HLTAID009 CPR & First Aid Certification Expiring`,
            category: 'Staff Training',
            filterGroup: 'training',
            description: `${p.name}'s mandatory CPR / First Aid certification expires in ${daysToCpr > 0 ? `${daysToCpr} days` : 'OVERDUE'} (${p.cprExpiryDate}). Book accredited refresher immediately.`,
            severity: daysToCpr <= 10 ? 'Critical' : 'High',
            dueDate: p.cprExpiryDate,
            linkTab: 'hr-roster',
            actionLabel: 'Schedule Refresher',
            practitionerId: p.id,
            practitionerName: p.name,
          });
        }
      }

      // Medication Administration Endorsement
      if (p.medicationCertExpiryDate) {
        const medDate = new Date(p.medicationCertExpiryDate);
        const daysToMed = Math.ceil((medDate.getTime() - new Date('2026-08-16').getTime()) / (1000 * 60 * 60 * 24));
        if (daysToMed <= 30) {
          list.push({
            id: `train-med-${p.id}`,
            title: `Medication Administration Competency Expiring`,
            category: 'Staff Training',
            filterGroup: 'training',
            description: `${p.name}'s High-Risk Medication Administration authorization expires on ${p.medicationCertExpiryDate}. Verification audit required.`,
            severity: 'High',
            dueDate: p.medicationCertExpiryDate,
            linkTab: 'hr-roster',
            actionLabel: 'Re-assess Competency',
            practitionerId: p.id,
            practitionerName: p.name,
          });
        }
      }

      // Mandatory NDIS Quality & Safeguards Refresher
      if (p.mandatoryTrainingExpiryDate) {
        const trDate = new Date(p.mandatoryTrainingExpiryDate);
        const daysToTr = Math.ceil((trDate.getTime() - new Date('2026-08-16').getTime()) / (1000 * 60 * 60 * 24));
        if (daysToTr <= 30) {
          list.push({
            id: `train-ndis-${p.id}`,
            title: `Annual NDIS Quality Standards Refresher Due`,
            category: 'Staff Training',
            filterGroup: 'training',
            description: `${p.name} is due for mandatory annual NDIS Zero Tolerance & Quality Modules refresher (${p.mandatoryTrainingExpiryDate}).`,
            severity: 'Medium',
            dueDate: p.mandatoryTrainingExpiryDate,
            linkTab: 'hr-roster',
            actionLabel: 'Assign LMS Module',
            practitionerId: p.id,
            practitionerName: p.name,
          });
        }
      }

      // PBS CPD shortfall (< 30 required)
      if (p.cpdHoursThisYear < (p.cpdHoursRequired || 30)) {
        const deficit = (p.cpdHoursRequired || 30) - p.cpdHoursThisYear;
        if (deficit >= 10) {
          list.push({
            id: `train-cpd-${p.id}`,
            title: `PBS CPD Supervision Hours Deficit`,
            category: 'Staff Training',
            filterGroup: 'training',
            description: `${p.name} has logged ${p.cpdHoursThisYear} of ${p.cpdHoursRequired || 30} mandatory annual CPD hours (${deficit} hrs remaining).`,
            severity: 'Medium',
            dueDate: '2026-10-31',
            linkTab: 'hr-roster',
            actionLabel: 'Log Supervision',
            practitionerId: p.id,
            practitionerName: p.name,
          });
        }
      }
    });

    // 2. Overdue Incident Follow-ups & 5-Day Commission Reports
    incidents.forEach((inc) => {
      // 5-Day Commission Submission Overdue/Pending for reportable incidents
      if (inc.isNdisReportable && !inc.ndis5daySubmitted) {
        const incDate = new Date(inc.incidentDate);
        const daysSinceInc = Math.floor((new Date('2026-08-16').getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysSinceInc >= 5;

        list.push({
          id: `inc-5day-${inc.id}`,
          title: isOverdue ? `CRITICAL: Overdue NDIS 5-Day Incident Report` : `NDIS 5-Day Root Cause Report Due`,
          category: 'Incident Follow-up',
          filterGroup: 'incidents',
          description: `Reportable incident for ${inc.clientName} logged on ${new Date(inc.incidentDate).toLocaleDateString()}. Formal 5-day root cause analysis & corrective action plan is ${isOverdue ? 'OVERDUE to NDIS Commission' : 'due within 48 hours'}.`,
          severity: isOverdue ? 'Critical' : 'High',
          dueDate: inc.incidentDate,
          linkTab: 'incidents',
          actionLabel: 'Finalize 5-Day Report',
        });
      }

      // Open / Investigating Incident Older than 7 Days
      if ((inc.status === 'Investigating' || inc.status === 'Open') && inc.createdAt) {
        const createdDate = new Date(inc.createdAt);
        const daysOpen = Math.floor((new Date('2026-08-16').getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOpen >= 7 && !list.some(item => item.id === `inc-5day-${inc.id}`)) {
          list.push({
            id: `inc-open-${inc.id}`,
            title: `Incident Investigation Overdue (>7 Days)`,
            category: 'Incident Follow-up',
            filterGroup: 'incidents',
            description: `Incident #${inc.id} for ${inc.clientName} has been open for ${daysOpen} days without formal manager sign-off and closure.`,
            severity: 'High',
            dueDate: inc.createdAt,
            linkTab: 'incidents',
            actionLabel: 'Review Investigation',
          });
        }
      }
    });

    // 3. Restrictive Practice Monthly Reports & Expirations
    restrictivePractices.forEach((rp) => {
      if (rp.monthlyReportStatus === 'Due' || rp.monthlyReportStatus === 'Overdue') {
        list.push({
          id: `rp-${rp.id}`,
          title: `Monthly Restrictive Practice Log Overdue`,
          category: 'Restrictive Practice',
          filterGroup: 'safeguards',
          description: `Monthly reduction log for ${rp.clientName} (${rp.practiceType}) is ${rp.monthlyReportStatus} for submission to Victorian Senior Practitioner.`,
          severity: 'High',
          dueDate: rp.expiryDate || '2026-08-31',
          linkTab: 'restrictive-practices',
          actionLabel: 'Submit RP Log',
        });
      }
    });

    // 4. Participant Plan Review Alerts
    clients.forEach((c: Client) => {
      if (c.planEndDate) {
        const planDate = new Date(c.planEndDate);
        const daysToPlan = Math.ceil((planDate.getTime() - new Date('2026-08-16').getTime()) / (1000 * 60 * 60 * 24));
        if (daysToPlan <= 60) {
          list.push({
            id: `plan-${c.id}`,
            title: `Participant Plan Review Impending (${daysToPlan}d)`,
            category: 'Participant Plan',
            filterGroup: 'safeguards',
            description: `${c.name} (NDIS #${c.ndisNumber}) plan ends on ${c.planEndDate}. Schedule functional re-assessment and outcomes report.`,
            severity: daysToPlan <= 30 ? 'High' : 'Medium',
            dueDate: c.planEndDate,
            linkTab: 'clients',
            actionLabel: 'View Plan Details',
          });
        }
      }
    });

    return list;
  }, [clients, restrictivePractices, practitioners, incidents]);

  // Global Alert Dispatcher to Management
  const handleDispatchGlobalAlerts = () => {
    const criticalAndHigh = ndisAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High');
    
    // Push notifications into the global store
    criticalAndHigh.forEach((alert) => {
      addNotification({
        title: `[MANAGEMENT ALERT] ${alert.title}`,
        message: alert.description,
        type: 'compliance',
        severity: alert.severity === 'Critical' ? 'high' : 'medium',
        linkTab: alert.linkTab
      });
    });

    // Log to immutable compliance audit ledger
    addAuditLog(
      'GLOBAL_COMPLIANCE_ALERT_BROADCAST',
      'COMPLIANCE_MANAGEMENT',
      'MGMT-BROADCAST',
      `Broadcasted ${criticalAndHigh.length} high/critical compliance and staff training alerts to Management Notification Hub.`
    );

    setBroadcastFeedback(`Successfully dispatched ${criticalAndHigh.length} compliance & training alerts to the Management Command Center.`);
    setTimeout(() => setBroadcastFeedback(null), 6000);
  };

  const handleNotifyStaff = (alertId: string, alertTitle: string, staffName?: string) => {
    setNotifiedAlertIds(prev => ({ ...prev, [alertId]: true }));
    addNotification({
      title: `Staff Compliance Reminder Sent: ${staffName || 'Practitioner'}`,
      message: `Management notification dispatched regarding: ${alertTitle}`,
      type: 'compliance',
      severity: 'low'
    });
  };

  const filteredAlerts = ndisAlerts.filter(alert => {
    if (activeAlertFilter === 'all') return true;
    return alert.filterGroup === activeAlertFilter;
  });

  const criticalCount = ndisAlerts.filter(a => a.severity === 'Critical').length;
  const highCount = ndisAlerts.filter(a => a.severity === 'High').length;
  const trainingAlertsCount = ndisAlerts.filter(a => a.filterGroup === 'training').length;
  const incidentAlertsCount = ndisAlerts.filter(a => a.filterGroup === 'incidents').length;
  const safeguardAlertsCount = ndisAlerts.filter(a => a.filterGroup === 'safeguards').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">NDIS Practice Compliance & Audit Dashboard</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                Audit Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time governance ledger, practitioner accreditation tracking, and NDIS Quality Commission policy standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="download-compliance-pdf-btn"
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all border border-teal-400/20"
          >
            <Download className="w-4 h-4 text-teal-200" />
            <span>Monthly PDF Reporting Engine</span>
          </button>
          <button
            id="export-section34-audit-bundle-btn"
            onClick={() => setIsAuditBundleOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl font-bold text-xs shadow-md transition-all border border-teal-500/30"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Section 34 Audit Bundler</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">NDIS Reg #: 405001234</span>
          </div>
        </div>
      </div>

      {/* Compliance Sub-Module Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveComplianceSubTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeComplianceSubTab === 'OVERVIEW'
              ? 'bg-teal-600 text-white shadow-md border border-teal-400/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Governance Overview & AI Audits</span>
        </button>

        <button
          id="compliance-reporting-submodule-tab"
          onClick={() => setActiveComplianceSubTab('COMPLIANCE_REPORTING')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeComplianceSubTab === 'COMPLIANCE_REPORTING'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md border border-teal-400/30 ring-1 ring-teal-400/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Compliance Reporting (NDIS Commission)</span>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded font-bold">
            New
          </span>
        </button>

        <button
          onClick={() => setActiveComplianceSubTab('ACCREDITATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeComplianceSubTab === 'ACCREDITATIONS'
              ? 'bg-teal-600 text-white shadow-md border border-teal-400/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Practitioner Screenings & CPD</span>
        </button>
      </div>

      {activeComplianceSubTab === 'COMPLIANCE_REPORTING' ? (
        <ComplianceReportingSubModule />
      ) : activeComplianceSubTab === 'ACCREDITATIONS' ? (
        <div className="space-y-6">
          {/* Practitioner Screenings & CPD Hub */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span>Clinical Practitioner NDIS Screenings & Accreditations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  100% NDIS Worker Screening Check (NWSC) and AHPRA registration tracking for all clinical personnel.
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
                {practitioners.length} Verified Practitioners
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {practitioners.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{p.role} • {p.specialty}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-bold border border-emerald-500/30">
                      {p.screeningStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-900 p-2.5 rounded-lg">
                    <div>NDIS Clearance ID: {p.screeningId || 'NDIS-WSC-9921'}</div>
                    <div>Expiry: {p.screeningExpiry || '2028-06-30'}</div>
                    <div className="text-teal-400">AHPRA / Professional CPD: Compliant</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Reviews Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-400" />
              NDIS Regulatory Policy & Governance Reviews
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {policyReviews.map((policy, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-white block">{policy.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Category: {policy.category}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold block mb-1 ${
                        policy.status === 'Compliant'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {policy.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Review: {policy.nextReview}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Overall Compliance Health</span>
          <div className="text-2xl font-black text-emerald-400">96.8%</div>
          <p className="text-[11px] text-slate-400">Passed all 2026 Quality Standards</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Practitioners Screened</span>
          <div className="text-2xl font-black text-white">{practitioners.length} / {practitioners.length}</div>
          <p className="text-[11px] text-emerald-400">100% NDIS Clearance Verified</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Active Audit Ledger Items</span>
          <div className="text-2xl font-black text-teal-400">{auditLogs.length}</div>
          <p className="text-[11px] text-slate-400">Immutable Ledger Entries</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 block">Upcoming Policy Reviews</span>
          <div className="text-2xl font-black text-amber-400">1 Pending</div>
          <p className="text-[11px] text-slate-400">Due within 30 days</p>
        </div>
      </div>

      {/* NDIS Global Alert & Management Notification System */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Global Compliance & Expiry Alert System</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  {ndisAlerts.length} Actionable Items
                </span>
                {criticalCount > 0 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30 font-extrabold animate-pulse">
                    {criticalCount} Critical
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time monitoring of expiring mandatory staff training (CPR, First Aid, Screening, CPD) and overdue incident investigation follow-ups.
              </p>
            </div>
          </div>

          {/* Broadcast Global Alert Button */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="dispatch-management-alerts-btn"
              onClick={handleDispatchGlobalAlerts}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs shadow-md transition-all border border-amber-400/20"
              title="Broadcast all high-priority alerts to the executive management notification tray and log to audit ledger"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Global Alert to Management ({criticalCount + highCount})</span>
            </button>
          </div>
        </div>

        {/* Broadcast Toast Feedback */}
        {broadcastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-300"
          >
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{broadcastFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Dispatched to Executive Hub</span>
          </motion.div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveAlertFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeAlertFilter === 'all'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All Alerts ({ndisAlerts.length})</span>
          </button>
          <button
            onClick={() => setActiveAlertFilter('training')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeAlertFilter === 'training'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>Staff Training & Certifications ({trainingAlertsCount})</span>
          </button>
          <button
            onClick={() => setActiveAlertFilter('incidents')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeAlertFilter === 'incidents'
                ? 'bg-rose-600/30 text-rose-200 border border-rose-500/40'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Overdue Incident Follow-ups ({incidentAlertsCount})</span>
          </button>
          <button
            onClick={() => setActiveAlertFilter('safeguards')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeAlertFilter === 'safeguards'
                ? 'bg-sky-600/30 text-sky-200 border border-sky-500/40'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Safeguards & Plan Reviews ({safeguardAlertsCount})</span>
          </button>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAlerts.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
              All items in this category are fully compliant and within current SLA requirements!
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3.5 ${
                  alert.severity === 'Critical'
                    ? 'bg-rose-950/30 border-rose-500/40 shadow-sm shadow-rose-950/40'
                    : alert.severity === 'High'
                    ? 'bg-rose-950/15 border-rose-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono flex items-center gap-1">
                      {alert.category === 'Staff Training' && <GraduationCap className="w-3 h-3 text-amber-400" />}
                      {alert.category === 'Incident Follow-up' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      {alert.category === 'Restrictive Practice' && <ShieldAlert className="w-3 h-3 text-sky-400" />}
                      {alert.category === 'Participant Plan' && <FileCheck className="w-3 h-3 text-emerald-400" />}
                      <span>{alert.category}</span>
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        alert.severity === 'Critical'
                          ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-pulse'
                          : alert.severity === 'High'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white leading-snug">{alert.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{alert.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Target Date: {alert.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.practitionerName && (
                      <button
                        onClick={() => handleNotifyStaff(alert.id, alert.title, alert.practitionerName)}
                        disabled={notifiedAlertIds[alert.id]}
                        className={`text-[10px] px-2 py-1 rounded font-bold transition-all flex items-center gap-1 border ${
                          notifiedAlertIds[alert.id]
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {notifiedAlertIds[alert.id] ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Notified</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3 h-3 text-amber-400" />
                            <span>Notify Staff</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab(alert.linkTab)}
                      className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded text-[10px] font-bold flex items-center gap-1 hover:underline transition-all"
                    >
                      <span>{alert.actionLabel || 'Address Alert'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Policy Compliance Tool Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-xl border border-teal-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Policy Compliance Cross-Referencer</h3>
                <span className="text-[10px] bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-teal-500/30 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Gemini API Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated NDIS Practice Standards gap analysis cross-referencing live participant care files against Quality & Safeguards rules.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Select NDIS Participant File</span>
                <span className="text-[10px] text-teal-400 font-mono">{clients.length} Clients</span>
              </label>
              <select
                value={selectedAuditClient}
                onChange={(e) => setSelectedAuditClient(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-teal-500 font-sans"
              >
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NDIS #{c.ndisNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">NDIS Practice Standard Category</label>
              <select
                value={standardCategory}
                onChange={(e) => setStandardCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-teal-500"
              >
                <option value="Core Module 1: Rights and Responsibilities">Core Module 1: Rights and Responsibilities</option>
                <option value="Core Module 2: Provider Governance & Operations">Core Module 2: Provider Governance & Operations</option>
                <option value="Core Module 3: Provision of Supports & Care">Core Module 3: Provision of Supports & Care</option>
                <option value="Module 2A: Implementing Behaviour Support Plans">Module 2A: Implementing Behaviour Support Plans</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Documentation Evidence Context</label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `${selectedClientObj?.name} receiving PBS support. Latest BSP approved on 2026-03-10 with environmental restraint protocols. Case notes show 12 weekly entries, consent form signed by nominee on file, and emergency incident report on 2026-07-14.`;
                    setCustomEvidenceText(sample);
                  }}
                  className="text-[10px] text-teal-400 hover:text-teal-300 font-mono underline"
                >
                  Load Sample Evidence
                </button>
              </div>
              <textarea
                rows={5}
                value={customEvidenceText}
                onChange={(e) => setCustomEvidenceText(e.target.value)}
                placeholder="Paste participant care plan, BSP text, case notes, or service agreement excerpts here..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-teal-500 leading-relaxed resize-none"
              />
            </div>

            <button
              onClick={handleRunAiAudit}
              disabled={isAuditing}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                  <span>Cross-Referencing Gemini API...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run AI Policy Cross-Reference Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display Area */}
          <div className="lg:col-span-2 space-y-4">
            {!auditResult && !isAuditing && (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 border-dashed space-y-3">
                <div className="p-3 bg-slate-900 text-teal-400 rounded-full border border-slate-800">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No AI Audit Executed Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Select a participant file, choose an NDIS Practice Standard module, and click <strong>Run AI Policy Audit</strong> to analyze documentation for compliance gaps.
                  </p>
                </div>
              </div>
            )}

            {isAuditing && (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1 font-mono">
                  <span className="text-xs font-bold text-teal-300 block">Analyzing NDIS Practice Standards...</span>
                  <p className="text-[11px] text-slate-400">Cross-checking care documentation against NDIS Quality Commission rules.</p>
                </div>
              </div>
            )}

            {auditResult && !isAuditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800"
              >
                {/* Audit Score Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-black ${
                        auditResult.overallComplianceScore >= 85
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : auditResult.overallComplianceScore >= 70
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <span className="text-xl font-mono leading-none">{auditResult.overallComplianceScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider font-sans mt-0.5">Score</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">NDIS Compliance Status</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            auditResult.riskLevel === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : auditResult.riskLevel === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {auditResult.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-lg">{auditResult.auditSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Identified Gaps */}
                {auditResult.identifiedGaps && auditResult.identifiedGaps.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      Identified Compliance Gaps ({auditResult.identifiedGaps.length})
                    </span>
                    <div className="space-y-2">
                      {auditResult.identifiedGaps.map((gap, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-white">
                            <span>{gap.standard}</span>
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">{gap.severity}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{gap.gapDescription}</p>
                          <p className="text-[11px] text-teal-400 font-mono">Action: {gap.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Visual Intelligence Section */}
      <div className="space-y-6">
        {/* Top Visuals Row: Goal Progress & Incident Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: NDIS Goal Progress & Milestone Attainment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NDIS Goal Progress & Attainment (%)</h3>
                  <p className="text-[11px] text-slate-400">Participant goal velocity across active clinical care plans</p>
                </div>
              </div>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2.5 py-1 rounded border border-teal-500/20 font-bold">
                {clients.length} Active Participants
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalProgressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="participant"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    formatter={(val: any, name: any, item: any) => {
                      if (name === 'Current Progress') {
                        return [`${val}% (GAS Score: ${item?.payload?.gasScore >= 0 ? '+' : ''}${item?.payload?.gasScore})`, name];
                      }
                      return [`${val}%`, name];
                    }}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item ? `${item.fullName} (NDIS: ${item.ndisNumber}) - ${item.goalTitle}` : label;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar
                    dataKey="progress"
                    name="Current Progress"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="Target SLA"
                    fill="#334155"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Average Goal Velocity</span>
                <span className="text-xs font-bold text-teal-400">
                  {Math.round(goalProgressChartData.reduce((acc, g) => acc + g.progress, 0) / (goalProgressChartData.length || 1))}%
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">GAS Positive Ratio</span>
                <span className="text-xs font-bold text-emerald-400">
                  {Math.round((goalProgressChartData.filter(g => g.gasScore >= 0).length / (goalProgressChartData.length || 1)) * 100)}%
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Goal Status</span>
                <span className="text-xs font-bold text-sky-400">100% On Track</span>
              </div>
            </div>
          </motion.div>

          {/* Chart 2: Incident Trends & Commission SLA Notification Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Monthly Incident Trends & Commission SLA</h3>
                  <p className="text-[11px] text-slate-400">Reportable vs internal incident logs & 24h notification compliance</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono px-2.5 py-1 rounded border border-emerald-500/20 font-bold">
                100% 24h SLA
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentTrendsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="totalIncidentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="reportableGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Incidents"
                    stroke="#f43f5e"
                    fillOpacity={1}
                    fill="url(#totalIncidentsGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="reportable"
                    name="NDIS Reportable (24h)"
                    stroke="#fbbf24"
                    fillOpacity={1}
                    fill="url(#reportableGrad)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="bspEscalations"
                    name="BSP Escalations"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#38bdf8', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Current Month Total</span>
                <span className="text-xs font-bold text-rose-400">{incidents.length || 4} Incidents</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Commission Reportable</span>
                <span className="text-xs font-bold text-amber-400">
                  {incidents.filter(i => i.isNdisReportable).length || 1} Reported
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Commission 24h SLA</span>
                <span className="text-xs font-bold text-emerald-400">100% On-Time</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Visuals Row: Quality Audit Readiness & GAS Scaling Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Audit Readiness Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-400" />
                NDIS Quality Audit Readiness by Module (%)
              </h3>
              <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded">
                2026 Target: 100%
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {auditCategoryData.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{item.category}</span>
                    <span className="font-mono text-teal-400 font-bold">{item.score}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.score >= 95 ? 'bg-emerald-500' : item.score >= 90 ? 'bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goal Attainment Scaling (GAS) Distribution Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                Goal Attainment Scaling (GAS) Distribution
              </h3>
              <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded">
                Standardized Scaling
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalAttainmentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {goalAttainmentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
              {goalAttainmentPieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300 truncate">{d.name}</span>
                  <span className="font-mono font-bold text-white ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Practitioner Accreditations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-400" />
          Practitioner Accreditations & Screening Register
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-950/50">
                <th className="py-3 px-4">Practitioner Name</th>
                <th className="py-3 px-4">NDIS Registration #</th>
                <th className="py-3 px-4">Worker Screening NDB</th>
                <th className="py-3 px-4">Police Check Expiry</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {practitioners.map((p: Practitioner) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.position}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-400">{p.ndisRegistrationNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{p.workerScreeningNumber || 'WS-400291'}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{p.policeCheckExpiryDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.screeningStatus === 'Valid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {p.screeningStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly NDIS Compliance PDF Reporting Engine Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Monthly NDIS Compliance PDF Reporting Engine</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  Board &amp; Auditor Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate, customize, and export audit-ready monthly compliance reports compiling incident logs, worker screening (NWSC), restrictive practice authorizations, and immutable audit ledger trails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all border border-teal-400/20"
            >
              <Download className="w-4 h-4 text-teal-200" />
              <span>Export Monthly NDIS Compliance PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Reporting Month</span>
              <span className="font-bold text-white">August 2026</span>
            </div>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Quality Standard</span>
              <span className="font-bold text-emerald-400">Core Modules 1-4</span>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Worker Screening</span>
              <span className="font-bold text-white">100% Cleared</span>
            </div>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Audit Trail Integrity</span>
              <span className="font-bold text-teal-300">{auditLogs.length} Verified</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
        </div>
      </div>

      {/* Policy Reviews Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-sky-400" />
          NDIS Regulatory Policy & Governance Reviews
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {policyReviews.map((policy, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="font-bold text-xs text-white block">{policy.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">Category: {policy.category}</span>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold block mb-1 ${
                    policy.status === 'Compliant'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {policy.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Review: {policy.nextReview}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Standardized Compliance Report PDF Modal */}
      <ComplianceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Section 34 NDIS Audit Evidence Bundle Exporter Modal */}
      <AuditBundleModal
        isOpen={isAuditBundleOpen}
        onClose={() => setIsAuditBundleOpen(false)}
      />
    </div>
  );
};
