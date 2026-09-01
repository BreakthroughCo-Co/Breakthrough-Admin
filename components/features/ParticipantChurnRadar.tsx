import React from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { ChurnPredictor, ChurnRiskAnalysis } from '../../lib/churnPredictor';
import {
  UserX,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ParticipantChurnRadar: React.FC = () => {
  const { clients, caseNotes } = useManagementStore();

  const analyses: ChurnRiskAnalysis[] = clients.map((c) =>
    ChurnPredictor.evaluateParticipant(c, caseNotes)
  );

  const atRiskClients = analyses.filter((a) => a.riskLevel === 'Critical' || a.riskLevel === 'High');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Predictive Participant Retention & Churn Radar
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                ML Heuristic
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Detects appointment drop-off velocity, goal stagnation, and disengagement risk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="text-slate-300 font-medium">
            <strong className="text-white">{atRiskClients.length}</strong> At-Risk Participants
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyses.slice(0, 6).map((item) => {
          const isCritical = item.riskLevel === 'Critical';
          const isHigh = item.riskLevel === 'High';
          const isMedium = item.riskLevel === 'Medium';

          const badgeColor = isCritical
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : isHigh
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : isMedium
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

          return (
            <div
              key={item.clientId}
              className={`p-4 rounded-xl border ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/40'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-sm">{item.clientName}</h3>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {item.riskLevel} ({item.churnRiskScore}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-[11px]">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Days Inactive</span>
                    <strong className="text-slate-200">{item.factors.daysSinceLastSession} days</strong>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Cancel Rate</span>
                    <strong className="text-slate-200">{item.factors.cancellationRatePercent}%</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1">
                  {item.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
