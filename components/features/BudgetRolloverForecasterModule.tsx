import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { BudgetRolloverForecaster, BudgetForecast } from '../../lib/budgetRolloverForecaster';
import {
  LineChart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

export const BudgetRolloverForecasterModule: React.FC = () => {
  const { clients, billingClaims } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };
  const participantClaims = billingClaims.filter((c) => c.clientId === selectedClient.id);

  const forecast: BudgetForecast = BudgetRolloverForecaster.forecastBudgetTrajectory(
    selectedClient as any,
    participantClaims
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Multi-Year Plan Budget Burn & Rollover Forecaster
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Predictive Pacing
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              NDIS plan funding trajectories, clawback risk analysis, and under/over-utilization alerts
            </p>
          </div>
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Allocated Plan Budget</span>
          <span className="text-2xl font-bold text-white">${forecast.totalAllocatedBudget.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Total funding cap</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Spent to Date</span>
          <span className="text-2xl font-bold text-slate-200">${forecast.spentBudget.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 block mt-1">{forecast.utilizationPercentage}% utilized</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Remaining Balance</span>
          <span className="text-2xl font-bold text-emerald-400">${forecast.remainingBudget.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Available for allocation</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Burn Velocity Status</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-1">
            {forecast.burnRateStatus}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Service Delivery Pacing Insights</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {forecast.recommendations[0]}
        </p>
      </div>
    </div>
  );
};
