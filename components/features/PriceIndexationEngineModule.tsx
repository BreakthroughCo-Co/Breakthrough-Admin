import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { PriceIndexationEngine, IndexationImpactReport } from '../../lib/priceIndexationEngine';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Receipt
} from 'lucide-react';

export const PriceIndexationEngineModule: React.FC = () => {
  const { billingClaims, addNotification } = useManagementStore();
  const [indexationPct, setIndexationPct] = useState(3.75);

  const report: IndexationImpactReport = PriceIndexationEngine.calculateIndexationImpact(
    billingClaims,
    indexationPct
  );

  const handleApplyIndexation = () => {
    addNotification({
      title: 'NDIS Price Guide Indexation Applied',
      message: `Indexed rates by +${indexationPct}% with an estimated +$${report.totalRevenueLiftAmount.toFixed(2)} annual practice revenue lift.`,
      type: 'billing',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              NDIS Annual Price Indexation & Wage Escalation Engine
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Fair Work Model
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Annual rate indexation modeling, claim price cap updates, and revenue lift forecasting
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyIndexation}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Apply +{indexationPct}% Indexation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Indexation Percentage</span>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              step="0.25"
              value={indexationPct}
              onChange={(e) => setIndexationPct(Number(e.target.value))}
              className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white font-bold"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Total Claims Evaluated</span>
          <span className="text-2xl font-bold text-white">{report.totalClaimsAudited}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Active claim ledger</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Estimated Annual Revenue Lift</span>
          <span className="text-2xl font-bold text-emerald-400">+${report.totalRevenueLiftAmount.toFixed(2)}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Projected practice margin</span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Updated 2026 Support Item Rate Matrix</h3>
        <div className="space-y-2">
          {report.updatedRateSchedule.map((rate) => (
            <div key={rate.supportCode} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <div>
                <span className="font-mono text-emerald-400 font-bold mr-2">{rate.supportCode}</span>
                <span className="text-slate-300">{rate.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 line-through">${rate.previousRate.toFixed(2)}/hr</span>
                <span className="text-white font-bold text-sm">${rate.indexedNewRate.toFixed(2)}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
