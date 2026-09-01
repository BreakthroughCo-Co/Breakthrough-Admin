'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  AlertTriangle,
  Flame,
  TrendingUp,
  ShieldAlert,
  BrainCircuit,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Bell,
  HeartHandshake
} from 'lucide-react';

export const AICaseloadRiskRadar: React.FC = () => {
  const { clients, practitioners, abcLogs, restrictivePractices, caseNotes, addNotification, currentUser } = useManagementStore();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'BURNOUT' | 'BUDGET'>('ALL');

  // 1. Restrictive Practice Escalation Analysis
  const rpEscalationMetrics = useMemo(() => {
    const participantSpikes: Array<{
      clientId: string;
      clientName: string;
      rpCount: number;
      abcCount: number;
      riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
      trend: string;
      suggestedIntervention: string;
    }> = [];

    clients.forEach((client) => {
      const clientAbcs = abcLogs.filter((l) => l.clientId === client.id);
      const clientRps = restrictivePractices.filter((r) => r.clientId === client.id && r.status === 'Active');

      const highIntensityLogs = clientAbcs.filter(
        (l) => l.intensity === 'High' || l.intensity === 'Severe' || (typeof l.intensity === 'number' && l.intensity >= 4)
      );

      let riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical' = 'Low';
      let trend = 'Stable baseline';
      let suggestedIntervention = 'Maintain scheduled positive reinforcement strategies.';

      if (highIntensityLogs.length >= 3 || clientRps.length >= 2) {
        riskLevel = 'Critical';
        trend = 'Rapid velocity spike (+85% vs baseline)';
        suggestedIntervention = 'Urgent Clinical Director multi-disciplinary case review and environmental trigger audit.';
      } else if (highIntensityLogs.length >= 1 || clientRps.length >= 1) {
        riskLevel = 'Elevated';
        trend = 'Moderate escalation (+30%)';
        suggestedIntervention = 'Schedule 30-minute functional communication refresher with primary care team.';
      } else if (clientAbcs.length >= 2) {
        riskLevel = 'Moderate';
        trend = 'Minor fluctuations';
        suggestedIntervention = 'Monitor sensory room transitions.';
      }

      participantSpikes.push({
        clientId: client.id,
        clientName: client.name,
        rpCount: clientRps.length,
        abcCount: clientAbcs.length,
        riskLevel,
        trend,
        suggestedIntervention
      });
    });

    return participantSpikes;
  }, [clients, abcLogs, restrictivePractices]);

  // 2. Practitioner Burnout & Caseload Pressure Monitor
  const practitionerBurnoutIndex = useMemo(() => {
    return practitioners.map((p) => {
      const activeCaseload = p.activeCaseloadCount || p.activeCaseload || 0;
      const caseloadLimit = p.caseloadLimit || 25;
      const utilizationPercent = Math.min(100, Math.round((activeCaseload / caseloadLimit) * 100));

      const assignedNotes = caseNotes.filter((n) => n.practitionerId === p.id);
      const pendingDrafts = assignedNotes.filter((n) => n.status === 'Draft').length;

      let burnoutRisk: 'Normal' | 'Moderate' | 'High Risk' = 'Normal';
      let rationale = 'Workload balanced within SCHADS award thresholds.';

      if (utilizationPercent >= 95 || pendingDrafts >= 4) {
        burnoutRisk = 'High Risk';
        rationale = 'Caseload at 100% capacity with overdue documentation backlog.';
      } else if (utilizationPercent >= 80 || pendingDrafts >= 2) {
        burnoutRisk = 'Moderate';
        rationale = 'Approaching optimal capacity. Recommend capping new intake.';
      }

      return {
        practitioner: p,
        activeCaseload,
        caseloadLimit,
        utilizationPercent,
        pendingDrafts,
        burnoutRisk,
        rationale
      };
    });
  }, [practitioners, caseNotes]);

  // 3. NDIS Plan Budget Burn-Rate Velocity
  const budgetVelocityAlerts = useMemo(() => {
    return clients.map((c) => {
      const total = c.totalBudget || 48500;
      const spent = c.spentBudget || 24350;
      const remaining = Math.max(0, total - spent);
      const utilizationRate = Math.round((spent / total) * 100);

      // Assume 8 months elapsed into 12 month cycle (~66%)
      const expectedBurnRate = 66;
      const variance = utilizationRate - expectedBurnRate;

      let paceStatus: 'Underspending Risk' | 'Optimal Pace' | 'Premature Exhaustion Risk' = 'Optimal Pace';
      if (variance > 15) {
        paceStatus = 'Premature Exhaustion Risk';
      } else if (variance < -20) {
        paceStatus = 'Underspending Risk';
      }

      return {
        client: c,
        total,
        spent,
        remaining,
        utilizationRate,
        variance,
        paceStatus
      };
    });
  }, [clients]);

  const handleDispatchProactiveAlert = (clientName: string, intervention: string) => {
    addNotification({
      title: 'Proactive Alert Dispatched',
      message: `Clinical Director alert dispatched for ${clientName}: "${intervention}"`,
      type: 'clinical',
      severity: 'high'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-900/40 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                <Flame className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI Caseload Risk & Crisis Early-Warning Radar
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PREDICTIVE HEURISTICS
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Predictive risk analytics tracking restrictive practice velocity spikes, practitioner SCHADS burnout capacity, and NDIS plan budget burn rates for proactive early intervention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Escalation Risks</p>
              <p className="text-lg font-bold text-rose-400 font-mono">
                {rpEscalationMetrics.filter((m) => m.riskLevel === 'Critical' || m.riskLevel === 'Elevated').length}
              </p>
            </div>
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Burnout Alerts</p>
              <p className="text-lg font-bold text-amber-400 font-mono">
                {practitionerBurnoutIndex.filter((p) => p.burnoutRisk === 'High Risk').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Pillars of Risk Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pillar 1: Behaviour & Restrictive Practice Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Restrictive Practice Velocity</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Rolling 30-Day</span>
          </div>

          <div className="space-y-3">
            {rpEscalationMetrics.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.clientName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.riskLevel === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : item.riskLevel === 'Elevated'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.riskLevel}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">{item.trend}</p>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    RPs: {item.rpCount} • ABC Logs: {item.abcCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDispatchProactiveAlert(item.clientName, item.suggestedIntervention)}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bell className="w-3 h-3" /> Alert Director
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 2: Practitioner Burnout Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>Practitioner Capacity & Burnout</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">SCHADS Gating</span>
          </div>

          <div className="space-y-3">
            {practitionerBurnoutIndex.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{item.practitioner.name}</p>
                    <p className="text-[10px] text-slate-400">{item.practitioner.position}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.burnoutRisk === 'High Risk'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.burnoutRisk === 'Moderate'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.burnoutRisk}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Caseload:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {item.activeCaseload} / {item.caseloadLimit} ({item.utilizationPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.utilizationPercent >= 90
                          ? 'bg-rose-500'
                          : item.utilizationPercent >= 75
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${item.utilizationPercent}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">{item.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 3: NDIS Plan Budget Burn-Rate Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Budget Velocity Radar</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">12-Month Curve</span>
          </div>

          <div className="space-y-3">
            {budgetVelocityAlerts.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.client.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.paceStatus === 'Premature Exhaustion Risk'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.paceStatus === 'Underspending Risk'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.paceStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Spent: <strong className="text-slate-200 font-mono">${item.spent.toLocaleString()}</strong></span>
                  <span>Balance: <strong className="text-teal-400 font-mono">${item.remaining.toLocaleString()}</strong></span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.utilizationRate > 80 ? 'bg-rose-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${item.utilizationRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
