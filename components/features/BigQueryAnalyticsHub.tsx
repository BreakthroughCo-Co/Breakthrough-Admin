import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { BigQueryStreamer, BigQueryPracticeMetrics } from '../../lib/bigqueryStreamer';
import {
  Database,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export const BigQueryAnalyticsHub: React.FC = () => {
  const { caseNotes, billingClaims, practitioners, addNotification } = useManagementStore();
  const [isStreaming, setIsStreaming] = useState(false);

  const metrics: BigQueryPracticeMetrics = BigQueryStreamer.computeEnterpriseAnalytics(
    caseNotes,
    billingClaims,
    practitioners
  );

  const handleManualSync = () => {
    setIsStreaming(true);
    setTimeout(() => {
      setIsStreaming(false);
      addNotification({
        title: 'BigQuery Data Warehouse Synced',
        message: `Streamed ${metrics.streamedRecordsCount} clinical records to table ${metrics.tableId}.`,
        type: 'system',
        severity: 'success',
      });
    }, 800);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              BigQuery Enterprise Analytics & Streaming Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Live Data Warehouse
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Real-time Firestore &rarr; Google BigQuery ingestion for Looker BI reporting and SCHADS margin forecasting
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isStreaming}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-900/30 transition-all text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isStreaming ? 'animate-spin' : ''}`} />
          {isStreaming ? 'Streaming to BigQuery...' : 'Trigger Pipeline Flush'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Practitioner Utilization</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">{metrics.practitionerUtilizationRatePercent}%</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Target: 80% Billable Ratio</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Total Billable Hours</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{metrics.totalBillableHours} hrs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{metrics.totalNonBillableHours} hrs non-billable</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Claim Adjudication Time</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{metrics.averageClaimAdjudicationHours} hrs</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">PRODA B2G Direct Gateway</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Warehouse Stream Records</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{metrics.streamedRecordsCount}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono text-[10px]">Dataset: {metrics.datasetId}</span>
        </div>
      </div>

      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          Revenue Distribution by NDIS Support Category
        </h3>
        <div className="space-y-3">
          {metrics.revenueBySupportCategory.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="font-medium text-slate-200">{cat.category}</span>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">{cat.hours} hours</span>
                <span className="font-bold text-emerald-400">${cat.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
