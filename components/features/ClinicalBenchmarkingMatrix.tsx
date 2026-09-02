import React from 'react';
import { NDIABenchmarkService, NDIABenchmarkMetric } from '../../lib/ndiaBenchmarkService';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const ClinicalBenchmarkingMatrix: React.FC = () => {
  const benchmarks: NDIABenchmarkMetric[] = NDIABenchmarkService.getBenchmarkAnalysis({
    restrictivePracticeFadeMonths: 8.5,
    goalAttainmentRatePercent: 84.0,
    paceClaimFirstPassApprovalPercent: 97.5,
    incident24hrReportingCompliancePercent: 100.0,
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              National NDIA Clinical Efficacy Benchmark
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Sector Comparative
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Benchmarking practice clinical outcomes, restrictive practice elimination velocity, and billing fidelity against national data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Top 5% National Quality Decile
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((b, idx) => (
          <div key={idx} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{b.metricName}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {b.performanceTier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Breakthrough OS</span>
                  <strong className="text-lg font-bold text-emerald-400">
                    {b.internalValue} {b.unit}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">National Average</span>
                  <strong className="text-lg font-bold text-slate-400">
                    {b.nationalAverageValue} {b.unit}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{b.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
