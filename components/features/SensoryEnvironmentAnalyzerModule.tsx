import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { SensoryEnvironmentAnalyzer, EnvironmentalAuditResult } from '../../lib/sensoryEnvironmentAnalyzer';
import {
  Eye,
  Volume2,
  Maximize,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Home,
  Sliders
} from 'lucide-react';

export const SensoryEnvironmentAnalyzerModule: React.FC = () => {
  const { clients, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [hasFluorescent, setHasFluorescent] = useState(true);
  const [hasHardFloor, setHasHardFloor] = useState(true);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };

  const audit: EnvironmentalAuditResult = SensoryEnvironmentAnalyzer.analyzeEnvironment(
    selectedClient as any,
    'LIVING_ROOM',
    hasHardFloor,
    hasFluorescent
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Sensory Environment & Home Modification Audit
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">
                Capital Supports
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Living environment acoustics, lighting arousal index, and assistive technology recommendations
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

      <div className="flex items-center gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasFluorescent}
            onChange={(e) => setHasFluorescent(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-teal-500"
          />
          Fluorescent / Overhead Glare Present
        </label>
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasHardFloor}
            onChange={(e) => setHasHardFloor(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-teal-500"
          />
          Hard Surfaces / High Acoustic Reverberation
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">
            <Eye className="w-4 h-4 text-teal-400" />
            Lighting Arousal Index
          </div>
          <span className="text-2xl font-bold text-white">{audit.sensoryScores.lightingArousal} / 100</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {audit.sensoryScores.lightingArousal > 60 ? 'Over-stimulating glare' : 'Comfortable ambient'}
          </span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">
            <Volume2 className="w-4 h-4 text-teal-400" />
            Acoustic Clutter Score
          </div>
          <span className="text-2xl font-bold text-white">{audit.sensoryScores.acousticClutter} / 100</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {audit.sensoryScores.acousticClutter > 60 ? 'High reverberation risk' : 'Calm acoustic space'}
          </span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">
            <Maximize className="w-4 h-4 text-teal-400" />
            Spatial Flow Score
          </div>
          <span className="text-2xl font-bold text-white">{audit.sensoryScores.spatialFlowAndClutter} / 100</span>
          <span className="text-[11px] text-slate-500 block mt-1">Moderate navigation ease</span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recommended Environmental Adaptations</h3>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {audit.recommendedModifications.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
