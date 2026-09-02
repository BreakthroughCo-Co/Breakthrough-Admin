import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { RestrictivePracticeFadingEngine, FadingProtocolSimulation } from '../../lib/restrictivePracticeFadingEngine';
import {
  TrendingDown,
  Lock,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';

export const RestrictivePracticeFadingSimulator: React.FC = () => {
  const { restrictivePractices } = useManagementStore();
  const [selectedPracticeId, setSelectedPracticeId] = useState(restrictivePractices[0]?.id || '');

  const selectedPractice =
    restrictivePractices.find((rp) => rp.id === selectedPracticeId) ||
    restrictivePractices[0] ||
    ({ id: 'rp-1', type: 'Chemical Restraint (PRN)', status: 'Active' } as any);

  const simulation: FadingProtocolSimulation = RestrictivePracticeFadingEngine.simulateFadingProtocol(selectedPractice);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Restrictive Practice Fading Protocol Simulator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                Elimination Target
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Multi-stage step-down modeling for chemical, mechanical, and environmental restraint elimination
            </p>
          </div>
        </div>

        <select
          value={selectedPracticeId}
          onChange={(e) => setSelectedPracticeId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs"
        >
          {restrictivePractices.map((rp) => (
            <option key={rp.id} value={rp.id}>
              {rp.clientName} - {rp.type || (rp as any).practiceType}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">Total Clinical Timeline to Elimination</span>
          <span className="text-xl font-bold text-cyan-400">{simulation.totalWeeksToElimination} Weeks</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Target Practice Type</span>
          <span className="text-sm font-semibold text-white">{simulation.practiceType}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Stage Fading Phases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {simulation.phases.map((phase) => (
            <div key={phase.phaseNumber} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 font-mono">Phase {phase.phaseNumber} ({phase.durationWeeks} Weeks)</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-medium">
                  {phase.dosageOrRestrictionLevel}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{phase.phaseName}</h4>
              <p className="text-[11px] text-slate-400">
                <strong className="text-slate-300">Replacement:</strong> {phase.targetReplacementSkill}
              </p>
              <p className="text-[11px] text-emerald-400">
                <strong>Gate:</strong> {phase.successCriteria}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
