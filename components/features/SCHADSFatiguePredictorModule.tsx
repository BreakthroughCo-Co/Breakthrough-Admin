import React from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { SCHADSFatiguePredictor, FatigueRiskAudit } from '../../lib/schadsFatiguePredictor';
import {
  Activity,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  Calendar,
  AlertOctagon
} from 'lucide-react';

export const SCHADSFatiguePredictorModule: React.FC = () => {
  const { practitioners, scheduledShifts } = useManagementStore();

  const audits: FatigueRiskAudit[] = practitioners.map((p) =>
    SCHADSFatiguePredictor.auditPractitionerFatigue(p, scheduledShifts)
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl text-fuchsia-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              SCHADS Award Overtime & Fatigue Compliance Predictor
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-medium">
                Modern Award Compliant
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              10-hour rest break breach detection, 38-hour weekly fatigue forecasting, and overtime risk analysis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audits.map((item) => (
          <div
            key={item.practitionerId}
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              item.fatigueRiskLevel === 'CRITICAL_FATIGUE_BREACH'
                ? 'bg-rose-950/20 border-rose-500/40'
                : item.fatigueRiskLevel === 'MODERATE_WARNING'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-sm">{item.practitionerName}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.fatigueRiskLevel === 'SAFE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : item.fatigueRiskLevel === 'MODERATE_WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {item.fatigueRiskLevel}
                </span>
              </div>

              <div className="space-y-1.5 my-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Weekly Scheduled:</span>
                  <span className="text-white font-bold">{item.weeklyTotalHours} hrs / 38h</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>10h Rest Gap:</span>
                  <span className={item.hasInsufficientRestBreak ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {item.hasInsufficientRestBreak ? 'BREACH DETECTED' : 'Compliant'}
                  </span>
                </div>
              </div>

              {item.recommendations.length > 0 && (
                <div className="mt-2 p-2 bg-slate-900/90 rounded-lg text-[11px] text-slate-300">
                  {item.recommendations[0]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
