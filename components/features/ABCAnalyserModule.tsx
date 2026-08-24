'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { ABCLog, Client } from '@/types';
import {
  BarChart3,
  Plus,
  Sparkles,
  CheckCircle2,
  PieChart,
  Activity,
  Clock,
  X
} from 'lucide-react';

export const ABCAnalyserModule: React.FC = () => {
  const { abcLogs, clients, currentUser, addABCLog } = useManagementStore();
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isAdding, setIsAdding] = useState(false);

  const [antecedent, setAntecedent] = useState('');
  const [behavior, setBehavior] = useState('');
  const [consequence, setConsequence] = useState('');
  const [functionType, setFunctionType] = useState<ABCLog['perceivedFunction']>('Escape/Avoidance');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleAddABC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj) return;

    addABCLog({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      timestamp: new Date().toISOString(),
      timeOfDay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      antecedent: antecedent || 'Sudden transition in environment.',
      behavior: behavior || 'Vocal distress and pushback.',
      consequence: consequence || 'Offered 2-minute quiet break.',
      intensity: 3,
      durationMinutes: 5,
      location: 'Day Activity Center',
      perceivedFunction: functionType,
      recordedBy: currentUser.name,
    });

    setIsAdding(false);
    setAntecedent('');
    setBehavior('');
    setConsequence('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ABC Behaviour Functional Analyser</h2>
            <p className="text-xs text-slate-400">
              Antecedent-Behavior-Consequence logging and hypothesis formulation for BSP formulation.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log ABC Observation</span>
        </button>
      </div>

      {/* Observation Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {abcLogs.map((log: ABCLog) => (
          <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{log.clientName}</span>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                Function: {log.perceivedFunction}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">A - Antecedent</span>
                <p className="text-slate-300 mt-1">{log.antecedent}</p>
              </div>

              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">B - Behavior</span>
                <p className="text-slate-200 mt-1 font-semibold">{log.behavior}</p>
              </div>

              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">C - Consequence</span>
                <p className="text-slate-300 mt-1">{log.consequence}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Recorded by: {log.recordedBy}</span>
              <span className="font-mono text-slate-500">{log.timeOfDay}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                Log ABC Observation
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddABC} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Participant</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                >
                  {clients.map((c: Client) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ndisNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Perceived Function</label>
                <select
                  value={functionType}
                  onChange={(e) => setFunctionType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-teal-400 font-bold"
                >
                  <option value="Escape/Avoidance">Escape / Avoidance</option>
                  <option value="Attention/Social">Attention / Social Seeking</option>
                  <option value="Tangible/Access">Tangible / Access to Activity</option>
                  <option value="Sensory/Automatic">Sensory / Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">A - Antecedent (What happened right before?)</label>
                <textarea
                  rows={2}
                  required
                  value={antecedent}
                  onChange={(e) => setAntecedent(e.target.value)}
                  placeholder="e.g. Sudden transition from free time to table activity..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">B - Behavior (Exact observable behavior)</label>
                <textarea
                  rows={2}
                  required
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  placeholder="e.g. Vocal frustration, pushing desk chair..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">C - Consequence (What happened right after?)</label>
                <textarea
                  rows={2}
                  required
                  value={consequence}
                  onChange={(e) => setConsequence(e.target.value)}
                  placeholder="e.g. Support worker offered 2-minute visual break..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Log Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
