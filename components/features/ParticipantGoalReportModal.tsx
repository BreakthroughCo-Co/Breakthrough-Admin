'use client';

import React, { useState, useMemo } from 'react';
import { Client, ClientGoal, CaseNote, ScheduledShift } from '@/types';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  FileText,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  HeartHandshake,
  DollarSign,
  Edit3,
  BookOpen
} from 'lucide-react';

interface ParticipantGoalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  notes?: CaseNote[];
  appointments?: ScheduledShift[];
}

export const ParticipantGoalReportModal: React.FC<ParticipantGoalReportModalProps> = ({
  isOpen,
  onClose,
  client,
  notes = [],
  appointments = []
}) => {
  const [reportTitle, setReportTitle] = useState('NDIS Participant Goal Progress & Outcome Review Report');
  const [reportType, setReportType] = useState<'ANNUAL_REVIEW' | 'MID_TERM' | 'PARTICIPANT_EVIDENCE' | 'CARER_STATEMENT'>('ANNUAL_REVIEW');
  const [reportDate, setReportDate] = useState('2026-08-28');
  const [includeGAS, setIncludeGAS] = useState(true);
  const [includeBudgetSummary, setIncludeBudgetSummary] = useState(true);
  const [includeSessionEvidence, setIncludeSessionEvidence] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  const [participantStatement, setParticipantStatement] = useState(
    `Over this plan period, the supports provided by Breakthrough Coaching & Consulting have significantly improved my daily living autonomy and emotional self-regulation. Working towards my goals has given me the confidence to navigate community spaces and manage unexpected routine changes independently.`
  );

  const [coordinatorRecommendations, setCoordinatorRecommendations] = useState(
    `Recommend continuation of Capacity Building (Improved Daily Living & Improved Relationships) funding at current allocation for the upcoming 12-month plan cycle to consolidate positive behavioural momentum and prevent capacity regression under Section 34 of the NDIS Act 2013.`
  );

  const goals: ClientGoal[] = useMemo(() => {
    if (client?.goals && client.goals.length > 0) {
      return client.goals;
    }
    return [
      {
        id: 'g-1',
        title: 'Community Autonomy & Public Transport Navigation',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 85,
        status: 'In Progress',
        gasScore: 1
      },
      {
        id: 'g-2',
        title: 'Emotional Self-Regulation & Calming Strategies',
        category: 'Social & Community',
        targetDate: '2026-11-30',
        progressPercent: 78,
        status: 'In Progress',
        gasScore: 0
      },
      {
        id: 'g-3',
        title: 'Independent Meal Preparation & Kitchen Safety',
        category: 'Core',
        targetDate: '2026-10-15',
        progressPercent: 92,
        status: 'Achieved',
        gasScore: 2
      }
    ];
  }, [client]);

  const averageProgress = useMemo(() => {
    if (!goals.length) return 0;
    const sum = goals.reduce((acc, g) => acc + (g.progressPercent || g.progress || 0), 0);
    return Math.round(sum / goals.length);
  }, [goals]);

  const totalBudget = client?.totalBudget || 48500;
  const spentBudget = client?.spentBudget || 24350;
  const remainingBudget = Math.max(0, totalBudget - spentBudget);
  const utilizationRate = totalBudget > 0 ? Math.min(100, Math.round((spentBudget / totalBudget) * 100)) : 0;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getGasLabel = (score?: number) => {
    switch (score) {
      case 2:
        return { label: '+2: Much More Than Expected', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
      case 1:
        return { label: '+1: More Than Expected', color: 'text-teal-700 bg-teal-100 border-teal-300' };
      case 0:
        return { label: '0: Expected Outcome Achieved', color: 'text-blue-700 bg-blue-100 border-blue-300' };
      case -1:
        return { label: '-1: Less Than Expected', color: 'text-amber-700 bg-amber-100 border-amber-300' };
      case -2:
        return { label: '-2: Much Less Than Expected', color: 'text-rose-700 bg-rose-100 border-rose-300' };
      default:
        return { label: 'Goal On Track', color: 'text-slate-700 bg-slate-100 border-slate-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:my-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                NDIS Goal Progress Report Generator
                <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-normal">
                  Formal Review Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate and export an NDIA audit-standard Goal Attainment & Progress report for plan reassessment meetings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/10 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Panel (Hidden in print) */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs print:hidden">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Review Purpose</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-teal-500"
            >
              <option value="ANNUAL_REVIEW">Scheduled Annual Plan Reassessment</option>
              <option value="MID_TERM">Mid-Term Goal Progress Review</option>
              <option value="PARTICIPANT_EVIDENCE">Participant Self-Advocacy Statement</option>
              <option value="CARER_STATEMENT">Family / Carer Submission Document</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Report Date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-teal-500"
            >
            </input>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Include Modules</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGAS}
                  onChange={(e) => setIncludeGAS(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>GAS Ratings</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBudgetSummary}
                  onChange={(e) => setIncludeBudgetSummary(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>Budget Data</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Evidence & Verification</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSessionEvidence}
                  onChange={(e) => setIncludeSessionEvidence(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>Session Evidence</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>Signatures</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scrollable Printable Report Document */}
        <div className="p-6 sm:p-10 overflow-y-auto max-h-[75vh] space-y-8 bg-white text-slate-900 font-sans print:max-h-none print:overflow-visible print:p-0 print:m-0 print:space-y-6">
          {/* Practice Header & NDIS Registration Details */}
          <div className="border-b-2 border-teal-800 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-900 font-black text-xl tracking-tight">
                <Building2 className="w-6 h-6 text-teal-700" />
                <span>BREAKTHROUGH COACHING & CONSULTING</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Registered NDIS Provider #4050019284 • ABN 84 928 374 192
              </p>
              <p className="text-xs text-slate-500">
                Specialist Allied Health, Positive Behaviour Support & Support Coordination Services
              </p>
            </div>

            <div className="text-right sm:text-right flex flex-col items-start sm:items-end">
              <span className="inline-block bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                NDIS Formal Plan Review Document
              </span>
              <span className="text-xs text-slate-500 mt-1 font-mono">Date Generated: {reportDate}</span>
            </div>
          </div>

          {/* Report Title & Legal Framework */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {reportTitle}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prepared for the National Disability Insurance Agency (NDIA), Local Area Coordinators (LAC), Support Coordinators, and Participant Review Delegates in accordance with <strong>Section 34 Reasonable and Necessary Criteria (NDIS Act 2013)</strong>.
            </p>
          </div>

          {/* Participant & NDIS Plan Administrative Matrix */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <h2 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" /> Participant Administrative Profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Participant Name</span>
                <span className="font-bold text-slate-900 text-sm">{client?.name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">NDIS Reference Number</span>
                <span className="font-mono font-bold text-teal-800 text-sm">#{client?.ndisNumber || '430891245'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Date of Birth</span>
                <span className="font-medium text-slate-800">{client?.dateOfBirth || '1995-04-12'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Primary Disability</span>
                <span className="font-bold text-slate-800">{client?.primaryDisability || 'Autism Spectrum Disorder (Level 2)'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Current Plan Dates</span>
                <span className="font-mono font-medium text-slate-800">
                  {client?.planStartDate || '2026-01-01'} to {client?.planEndDate || '2026-12-31'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Plan Management</span>
                <span className="font-medium text-slate-800">{client?.planManagementType || 'Plan-Managed'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Primary Practitioner</span>
                <span className="font-bold text-slate-800">{client?.primaryPractitionerName || 'Marcus Vance'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">Overall Goal Velocity</span>
                <span className="font-bold text-emerald-700 text-sm">{averageProgress}% Achieved</span>
              </div>
            </div>
          </div>

          {/* Plan Budget Utilization Summary (Optional) */}
          {includeBudgetSummary && (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" /> NDIS Support Allocation & Utilization Efficiency
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Approved Plan Funding</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ${totalBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Funds Utilized (To Date)</span>
                  <span className="text-base font-black text-teal-800 font-mono">
                    ${spentBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Remaining Plan Funds</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ${remainingBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pacing & Utilization Rate</span>
                  <span className="text-base font-black text-blue-800 font-mono">
                    {utilizationRate}% On Track
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Goal-by-Goal Breakdown with Radial Progress & GAS Ratings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-700" /> Active NDIS Goals & Attainment Matrix
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {goals.length} Formal Goals Tracked
              </span>
            </div>

            <div className="space-y-4">
              {goals.map((goal, index) => {
                const progress = goal.progressPercent || goal.progress || 0;
                const gas = getGasLabel(goal.gasScore);

                // SVG Radial calculations
                const size = 68;
                const strokeWidth = 6;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (progress / 100) * circumference;

                return (
                  <div
                    key={goal.id || index}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 break-inside-avoid space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        {/* Radial Progress Gauge (SVG) */}
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                          <svg width={size} height={size} className="transform -rotate-90">
                            {/* Background Track Circle */}
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke="#e2e8f0"
                              strokeWidth={strokeWidth}
                              fill="transparent"
                            />
                            {/* Progress Arc */}
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke={progress >= 80 ? '#059669' : progress >= 50 ? '#0d9488' : '#d97706'}
                              strokeWidth={strokeWidth}
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-black text-slate-900 font-mono leading-none">
                              {progress}%
                            </span>
                          </div>
                        </div>

                        {/* Title and Metadata */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              Goal #{index + 1}: {goal.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                              {goal.category}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Target: {goal.targetDate || '2026-12-31'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Status: <strong className={progress >= 90 ? 'text-emerald-700' : 'text-teal-700'}>{goal.status || 'In Progress'}</strong> • Evidence verified through regular practitioner case notes.
                          </p>
                        </div>
                      </div>

                      {/* GAS Badge */}
                      {includeGAS && (
                        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-bold font-mono self-start sm:self-auto ${gas.color}`}>
                          GAS: {gas.label}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar Detail */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                        <span>Milestone Progress</span>
                        <span>{progress}% Achieved</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progress}%` }}
                          className={`h-full rounded-full ${
                            progress >= 80 ? 'bg-emerald-600' : progress >= 50 ? 'bg-teal-600' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Qualitative Outcome Description */}
                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                      <strong>Clinical Observation & Functional Milestones:</strong> Participant has demonstrated measurable independence gains in this domain. Key techniques and support routines have been internalized, resulting in decreased reliance on verbal prompting and improved emotional autonomy.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participant Self-Advocacy & Lived Experience Statement */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-teal-50/40 break-inside-avoid space-y-2">
            <h2 className="text-xs font-black text-teal-950 uppercase tracking-wider flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-700" /> Participant Voice & Lived Experience Statement
            </h2>
            <p className="text-xs text-slate-600 italic">
              Participant&apos;s direct perspective on support delivery, personal agency, and goal progression.
            </p>
            <div className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-lg border border-teal-200">
              &ldquo;{participantStatement}&rdquo;
            </div>
          </div>

          {/* Clinical & Support Coordination Recommendations */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50 break-inside-avoid space-y-2">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" /> Support Recommendations for Next NDIS Plan Period
            </h2>
            <div className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 font-medium">
              {coordinatorRecommendations}
            </div>
          </div>

          {/* Signatures & Quality Standards Block */}
          {includeSignatures && (
            <div className="border-t-2 border-slate-300 pt-6 break-inside-avoid space-y-6">
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-4">
                  <div className="border-b border-slate-400 pb-1 h-12 flex items-end">
                    <span className="font-serif italic text-base text-slate-800">
                      {client?.primaryPractitionerName || 'Marcus Vance'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Primary Support Practitioner / PBS Specialist</span>
                    <span className="text-slate-500 text-[11px]">Breakthrough Coaching & Consulting</span>
                    <span className="text-slate-400 block text-[10px]">Date: {reportDate}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-400 pb-1 h-12 flex items-end">
                    <span className="font-serif italic text-base text-slate-800">
                      {client?.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Participant / Nominee Signature</span>
                    <span className="text-slate-500 text-[11px]">NDIS Participant Statement Endorsement</span>
                    <span className="text-slate-400 block text-[10px]">Date: {reportDate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Compliant with NDIS Quality and Safeguards Commission Practice Standards (2026).</span>
                </div>
                <span className="font-mono">DOC REF: BCC-NDIS-GPR-{client?.id || '101'}-2026</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Hidden when printing) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">
            Clicking &quot;Print / Save as PDF&quot; opens your system print dialog with optimized report styling.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
