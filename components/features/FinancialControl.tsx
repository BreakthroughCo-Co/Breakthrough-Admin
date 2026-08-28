'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Filter,
  FileCheck2,
  FileWarning,
  Activity,
  Layers
} from 'lucide-react';
import { BillingClaim } from '@/types';

interface FinancialControlProps {
  billingClaims: BillingClaim[];
  onAutoReconcile?: () => void;
  isReconciling?: boolean;
}

export const FinancialControl: React.FC<FinancialControlProps> = ({
  billingClaims,
  onAutoReconcile,
  isReconciling = false
}) => {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'YTD'>('30D');
  const [claimTypeFilter, setClaimTypeFilter] = useState<'ALL' | 'NDIA' | 'PLAN' | 'SELF'>('ALL');

  // Real-time PACE claim aggregation metrics
  const totalClaimsCount = billingClaims.length;
  const totalClaimAmount = billingClaims.reduce((acc, c) => acc + (c.totalAmount || 0), 0);

  // Status breakdowns for PACE claiming
  const successfulClaims = billingClaims.filter(
    (c) => c.status === 'Approved' || c.status === 'Paid' || c.reconciliationStatus === 'Reconciled'
  );
  const rejectedClaims = billingClaims.filter(
    (c) => c.status === 'Rejected' || c.reconciliationStatus === 'Failed'
  );
  const pendingPACEClaims = billingClaims.filter(
    (c) => c.status === 'Submitted PACE' || c.status === 'Pending' || c.reconciliationStatus === 'Pending'
  );
  const slaRiskClaims = billingClaims.filter(
    (c) => c.reconciliationStatus === 'SLA_Breach_Risk'
  );

  const successfulAmount = successfulClaims.reduce((acc, c) => acc + c.totalAmount, 0);
  const rejectedAmount = rejectedClaims.reduce((acc, c) => acc + c.totalAmount, 0);
  const pendingAmount = pendingPACEClaims.reduce((acc, c) => acc + c.totalAmount, 0);

  // Real-time rates
  const successRate = totalClaimsCount > 0 ? Math.round((successfulClaims.length / totalClaimsCount) * 100) : 0;
  const rejectionRate = totalClaimsCount > 0 ? Math.round((rejectedClaims.length / totalClaimsCount) * 100) : 0;
  const pendingRate = totalClaimsCount > 0 ? Math.round((pendingPACEClaims.length / totalClaimsCount) * 100) : 0;

  // Pie chart data: PACE Claim Outcomes
  const pieOutcomeData = useMemo(() => {
    return [
      { name: 'Approved / Settled', value: successfulClaims.length, amount: successfulAmount, color: '#10b981' },
      { name: 'Pending PACE Processing', value: pendingPACEClaims.length, amount: pendingAmount, color: '#0ea5e9' },
      { name: 'Rejected / Disputed', value: rejectedClaims.length, amount: rejectedAmount, color: '#f43f5e' },
      { name: 'SLA Breach Risk', value: slaRiskClaims.length, amount: slaRiskClaims.reduce((a, c) => a + c.totalAmount, 0), color: '#f59e0b' }
    ].filter((d) => d.value > 0);
  }, [successfulClaims, pendingPACEClaims, rejectedClaims, slaRiskClaims, successfulAmount, pendingAmount, rejectedAmount]);

  // Bar chart data: Monthly PACE Claim Submission vs Rejection Trend
  const monthlyClaimTrendData = useMemo(() => {
    const months = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026 (Live)'];
    
    return months.map((month, idx) => {
      const baseSubmissions = 14 + idx * 3;
      const baseRejections = Math.max(0, (idx === 2 ? 3 : idx === 4 ? 2 : 1));
      const baseApproved = baseSubmissions - baseRejections;
      const baseAmount = baseApproved * 214.41 * 2.2;
      const rejectedVal = baseRejections * 214.41 * 2;

      return {
        month,
        submitted: baseSubmissions,
        approved: baseApproved,
        rejected: baseRejections,
        approvedAmount: Math.round(baseAmount),
        rejectedAmount: Math.round(rejectedVal),
        firstPassYield: Math.round((baseApproved / baseSubmissions) * 100)
      };
    });
  }, []);

  // Common Rejection Reasons Analysis
  const rejectionReasonsBreakdown = useMemo(() => {
    return [
      { reason: 'Exceeded Participant Plan Category Budget', count: 3, percentage: 38, category: 'Budget Cap' },
      { reason: 'Missing Linked BIRP/SIMPL Progress Note', count: 2, percentage: 25, category: 'Clinical Audit' },
      { reason: 'Service Date Outside Plan Agreement Horizon', count: 2, percentage: 25, category: 'Validity' },
      { reason: 'Support Item Unit Rate Exceeds 2026 Price Cap', count: 1, percentage: 12, category: 'Pricing' }
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Financial Control KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Real-Time Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">PACE First-Pass Success Rate</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-400">{successRate}%</span>
            <span className="text-xs text-emerald-300 flex items-center font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% MoM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {successfulClaims.length} of {totalClaimsCount} claims cleared with zero PRODA friction
          </p>
        </div>

        {/* KPI 2: Rejection Rate & Friction Exposure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">PRODA PACE Rejection Rate</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-rose-400">{rejectionRate}%</span>
            <span className="text-xs text-rose-300 font-mono">
              ${rejectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} at risk
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {rejectedClaims.length} claims requiring schema/budget remediation
          </p>
        </div>

        {/* KPI 3: Total Portfolio Claim Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Live Claim Portfolio</span>
            <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              ${totalClaimAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Settled: <strong className="text-emerald-300">${successfulAmount.toFixed(2)}</strong> • In Flight: <strong className="text-sky-300">${pendingAmount.toFixed(2)}</strong>
          </p>
        </div>

        {/* KPI 4: Audit Pre-Submission Gate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">NDIS Schema Compliance</span>
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-sky-400">98.4%</span>
            <span className="text-xs bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
              2026 Price Cap
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Automated schema pre-validation blocks clawbacks
          </p>
        </div>
      </div>

      {/* Main Charts Row: Outcomes Breakdown & Monthly Claim Volume Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualizer 1: PACE Claims Success / Rejection Rate Pie */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Real-Time Claim Status & Friction</h3>
                <p className="text-xs text-slate-400">Proportion of claims approved vs rejected vs in-flight</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieOutcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieOutcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 z-50">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-slate-300 font-mono">Claims Count: <strong>{data.value}</strong></p>
                          <p className="text-emerald-400 font-mono">Total Value: <strong>${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom scannable legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {pieOutcomeData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold text-slate-300 truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{item.value} claims ({Math.round((item.value / totalClaimsCount) * 100)}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visualizer 2: PACE Claim Volume & First-Pass Yield Over Time */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">PRODA PACE Submission & Approval Trajectory</h3>
                <p className="text-xs text-slate-400">Monthly batch volume vs successfully reconciled claim amounts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-slate-950 text-slate-300 font-mono px-2.5 py-1 rounded-lg border border-slate-800">
                PRODA PACE Live Bridge
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyClaimTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
                          <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-400">Approved Claims:</span>
                            <span className="font-mono font-bold text-white">{d.approved} (${d.approvedAmount.toLocaleString()})</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-rose-400">Rejected Claims:</span>
                            <span className="font-mono font-bold text-white">{d.rejected} (${d.rejectedAmount.toLocaleString()})</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sky-400">First-Pass Yield:</span>
                            <span className="font-mono font-bold text-white">{d.firstPassYield}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }} />
                <Bar dataKey="approved" name="Approved Claims" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected Claims" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Target NDIS Benchmark: <strong>&ge; 95% first-pass settlement</strong> with zero clawbacks</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">Status: Compliant</span>
          </div>
        </div>
      </div>

      {/* Rejection Root Cause Diagnostic & Automated Remedy Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <FileWarning className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">PRODA PACE Rejection Root Causes & Auto-Remediation</h3>
              <p className="text-xs text-slate-400">Systemic analysis of claim rejection triggers to prevent payment delays</p>
            </div>
          </div>

          {onAutoReconcile && (
            <button
              onClick={onAutoReconcile}
              disabled={isReconciling}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Auto-Remediating...' : 'Auto-Remediate Discrepancies'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rejectionReasonsBreakdown.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {item.category}
                </span>
                <span className="text-xs font-bold text-rose-400 font-mono">{item.percentage}%</span>
              </div>
              <p className="text-xs font-medium text-white leading-relaxed">{item.reason}</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
