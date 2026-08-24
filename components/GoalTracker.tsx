'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal } from '@/types';
import {
  Target,
  Plus,
  Calendar,
  X,
  Trash2,
  TrendingUp,
  LineChart as LineChartIcon
} from 'lucide-react';

interface GoalTrackerProps {
  client: Client;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ client }) => {
  const { currentUser, addClientGoal, updateClientGoal, deleteClientGoal } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const [isAdding, setIsAdding] = useState(false);

  const [newGoal, setNewGoal] = useState(() => ({
    title: '',
    category: 'Capacity Building' as ClientGoal['category'],
    targetDate: '2026-12-31',
    progressPercent: 25,
    status: 'In Progress' as ClientGoal['status'],
  }));

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;

    addClientGoal(client.id, {
      title: newGoal.title,
      category: newGoal.category,
      targetDate: newGoal.targetDate,
      progressPercent: Number(newGoal.progressPercent),
      status: newGoal.status,
    });

    setIsAdding(false);
    setNewGoal({
      title: '',
      category: 'Capacity Building',
      targetDate: '2026-12-31',
      progressPercent: 25,
      status: 'In Progress',
    });
  };

  const handleSliderChange = (goalId: string, value: number) => {
    const status: ClientGoal['status'] = value >= 100 ? 'Achieved' : 'In Progress';
    updateClientGoal(client.id, goalId, {
      progressPercent: value,
      status,
    });
  };

  const overallProgress = client.goals?.length
    ? Math.round(client.goals.reduce((acc, g) => acc + g.progressPercent, 0) / client.goals.length)
    : 0;

  // Standard NDIS Clinical GAS T-Score Calculation
  const ratedGoals = client.goals?.filter((g) => g.gasScore !== undefined) || [];
  const n = ratedGoals.length;
  let gasTScore = 50; // Mean T-Score baseline
  if (n > 0) {
    const sumX = ratedGoals.reduce((acc, g) => acc + (g.gasScore || 0), 0);
    const denominator = Math.sqrt(0.7 * n + 0.3 * Math.pow(n, 2));
    gasTScore = Math.round((50 + (10 * sumX) / denominator) * 10) / 10;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header with overall percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">NDIS Funded Goal Progress Tracker</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor capacity building outcome milestones and real-time NDIS review metrics for <span className="text-white font-semibold">{client.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Avg Goal Progress</span>
            <span className="text-lg font-black font-mono text-teal-400">{overallProgress}%</span>
          </div>
          <div className="text-right pl-3 border-l border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 font-bold block" title="Standardized Goal Attainment T-Score (Mean = 50)">GAS T-Score</span>
            <span className={`text-lg font-black font-mono ${gasTScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{gasTScore}</span>
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Goal Items */}
      <div className="space-y-3">
        {!client.goals || client.goals.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
            No NDIS goals configured for this participant yet. Click &quot;Add Goal&quot; to create one.
          </div>
        ) : (
          client.goals.map((goal) => (
            <div
              key={goal.id}
              className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{goal.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        goal.category === 'Capacity Building'
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          : goal.category === 'Core'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {goal.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        goal.status === 'Achieved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : goal.status === 'Deferred'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-800 text-teal-300'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" /> Target Review Date: {goal.targetDate}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-mono font-black text-teal-400 text-lg">
                    {goal.progressPercent}%
                  </span>
                  {!isViewer && (
                    <button
                      onClick={() => deleteClientGoal(client.id, goal.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-all"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Slider Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Progress Slider</span>
                  <span>{goal.progressPercent}% Completed</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={isViewer}
                  value={goal.progressPercent}
                  onChange={(e) => handleSliderChange(goal.id, Number(e.target.value))}
                  className={`w-full accent-teal-500 bg-slate-800 h-2 rounded-lg ${
                    isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                />
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      goal.progressPercent >= 100
                        ? 'bg-emerald-500'
                        : goal.progressPercent >= 50
                        ? 'bg-teal-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Goal Attainment Scaling (GAS) Section */}
              <div className="pt-2 border-t border-slate-900 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-teal-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Goal Attainment Scaling (GAS Clinical System: -2 to +2)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Current Rating: <strong className="text-white font-bold">{goal.gasScore !== undefined ? `${goal.gasScore > 0 ? `+${goal.gasScore}` : goal.gasScore}` : '-2 (Baseline)'}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
                  {[
                    { score: -2, label: '-2: Baseline', desc: 'Initial baseline (-2)' },
                    { score: -1, label: '-1: Less Progress', desc: 'Below expected target (-1)' },
                    { score: 0, label: '0: Target Met', desc: 'Expected NDIS outcome (0)' },
                    { score: 1, label: '+1: Exceeded', desc: 'Exceeds target (+1)' },
                    { score: 2, label: '+2: Outstanding', desc: 'Much more than expected (+2)' },
                  ].map((gas) => {
                    const active = (goal.gasScore === undefined && gas.score === -2) || goal.gasScore === gas.score;
                    return (
                      <button
                        key={gas.score}
                        type="button"
                        disabled={isViewer}
                        onClick={() => {
                          const newHistory = [
                            ...(goal.gasHistory || []),
                            {
                              date: new Date().toISOString().slice(0, 10),
                              score: gas.score as any,
                              note: `GAS rating updated to ${gas.score > 0 ? `+${gas.score}` : gas.score} (${gas.desc})`,
                            },
                          ];
                          updateClientGoal(client.id, goal.id, {
                            gasScore: gas.score as any,
                            gasHistory: newHistory,
                            progressPercent: Math.min(100, Math.max(0, (gas.score + 2) * 25)),
                            status: gas.score >= 0 ? 'In Progress' : 'In Progress'
                          });
                        }}
                        title={gas.desc}
                        className={`p-2 rounded text-center border transition-all ${
                          isViewer ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          active
                            ? gas.score === 0
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 font-bold shadow-sm'
                              : gas.score > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        <span className="block font-bold">{gas.label}</span>
                        <span className="text-[8px] opacity-75 font-normal block truncate">{gas.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* SVG Visual Timeline for GAS Progress */}
                {(() => {
                  const chartData = [
                    { date: 'Baseline', score: -2 },
                    ...(goal.gasHistory || []).map((h) => ({
                      date: h.date,
                      score: h.score,
                      note: h.note,
                    })),
                  ];

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 font-bold text-teal-400 uppercase">
                          <LineChartIcon className="w-3.5 h-3.5" /> Historical Growth Trajectory (-2 to +2)
                        </span>
                        <span>{chartData.length} Evaluations Recorded</span>
                      </div>

                      {/* SVG Line Chart */}
                      <div className="h-28 w-full bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                        <svg className="w-full h-20 overflow-visible" viewBox="0 0 500 80">
                          {/* Grid horizontal lines */}
                          {[-2, -1, 0, 1, 2].map((val) => {
                            const y = 70 - ((val + 2) / 4) * 60;
                            return (
                              <g key={val}>
                                <line x1="40" y1={y} x2="480" y2={y} stroke={val === 0 ? '#10b981' : '#334155'} strokeDasharray={val === 0 ? '3 3' : '1 2'} strokeWidth="1" opacity={val === 0 ? 0.8 : 0.4} />
                                <text x="10" y={y + 3} fill={val === 0 ? '#10b981' : '#94a3b8'} fontSize="9" fontFamily="monospace">{val > 0 ? `+${val}` : val}</text>
                              </g>
                            );
                          })}

                          {/* Data points and connecting polyline */}
                          {chartData.length > 1 && (
                            <polyline
                              fill="none"
                              stroke="#14b8a6"
                              strokeWidth="3"
                              strokeLinecap="round"
                              points={chartData.map((pt, idx) => {
                                const x = 50 + (idx / (chartData.length - 1)) * 420;
                                const y = 70 - ((pt.score + 2) / 4) * 60;
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          )}

                          {/* Points */}
                          {chartData.map((pt, idx) => {
                            const x = chartData.length === 1 ? 250 : 50 + (idx / (chartData.length - 1)) * 420;
                            const y = 70 - ((pt.score + 2) / 4) * 60;
                            return (
                              <circle key={idx} cx={x} cy={y} r="4" fill="#0d9488" stroke="#5eead4" strokeWidth="1.5">
                                <title>{pt.date}: GAS {pt.score > 0 ? `+${pt.score}` : pt.score}</title>
                              </circle>
                            );
                          })}
                        </svg>

                        <div className="flex justify-between px-6 text-[9px] text-slate-500 font-mono">
                          {chartData.map((pt, i) => (
                            <span key={i} className="truncate max-w-[80px]">{pt.date}</span>
                          ))}
                        </div>
                      </div>

                      {goal.gasHistory && goal.gasHistory.length > 0 && (
                        <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">Clinician GAS Evaluation Log</span>
                          {goal.gasHistory.slice(-3).map((h, i) => (
                            <div key={i} className="flex justify-between items-center text-slate-300 font-mono">
                              <span>{h.date}: <strong className="text-teal-400 font-bold">{h.score > 0 ? `+${h.score}` : h.score}</strong> - {h.note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Goal Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" /> Add NDIS Participant Goal
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Goal Statement / Outcome</label>
                <textarea
                  rows={2}
                  required
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Build positive communication strategies to reduce stress in public settings..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NDIS Budget Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                  >
                    <option value="Capacity Building">Capacity Building</option>
                    <option value="Core">Core Supports</option>
                    <option value="Capital">Capital Supports</option>
                    <option value="Social & Community">Social & Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Progress (%): {newGoal.progressPercent}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newGoal.progressPercent}
                  onChange={(e) => setNewGoal({ ...newGoal, progressPercent: Number(e.target.value) })}
                  className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
