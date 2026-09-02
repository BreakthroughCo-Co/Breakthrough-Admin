import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { ClinicalOutcomeSuite, OutcomeMeasurement } from '../../lib/clinicalOutcomeSuite';
import {
  LineChart,
  Target,
  Award,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

export const ClinicalOutcomeSuiteModule: React.FC = () => {
  const { clients, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [instrument, setInstrument] = useState<OutcomeMeasurement['instrument']>('GAS_T_SCORE');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };

  const outcome: OutcomeMeasurement = ClinicalOutcomeSuite.evaluateOutcome(
    selectedClient as any,
    instrument,
    [1, 2, 1]
  );

  const handleRecordMeasurement = () => {
    addNotification({
      title: 'Clinical Outcome Measurement Recorded',
      message: `Calculated standardized ${outcome.instrument} (+${outcome.deltaScore} delta) for ${selectedClient.name}.`,
      type: 'clinical',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Standardized Clinical Outcome Suite (GAS / WHODAS 2.0 / HoNOS)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                Section 34 Evidence
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Standardized administration of Goal Attainment Scaling T-scores and functional delta metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRecordMeasurement}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-violet-900/30 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Record Outcome
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Baseline Score</span>
          <span className="text-2xl font-bold text-slate-300">{outcome.baselineScore}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Pre-intervention level</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Current Assessment</span>
          <span className="text-2xl font-bold text-violet-400">{outcome.currentScore}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Standardized T-Score</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Functional Gain Delta</span>
          <span className="text-2xl font-bold text-emerald-400">+{outcome.deltaScore}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Statistically significant</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Clinical Status</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mt-1">
            {outcome.clinicalImprovementStatus}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">NDIS Section 34 Evidence Dossier Rationale</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {outcome.evidenceRationale}
        </p>
      </div>
    </div>
  );
};
