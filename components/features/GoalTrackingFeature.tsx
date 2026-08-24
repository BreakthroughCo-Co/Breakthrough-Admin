'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal } from '@/types';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  Sliders,
  AlertCircle,
  X,
  Trash2,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';

interface GoalTrackingFeatureProps {
  client: Client;
}

interface MilestoneItem {
  id: string;
  title: string;
  completed: boolean;
}

export const GoalTrackingFeature: React.FC<GoalTrackingFeatureProps> = ({ client }) => {
  const { currentUser, addClientGoal, updateClientGoal, deleteClientGoal, addNotification, addAuditLog } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [activeTab, setActiveTab] = useState<'PARTICIPANT_GOALS' | 'ANALYTICS'>('PARTICIPANT_GOALS');

  // New Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<ClientGoal['category']>('Capacity Building');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-12-31');
  const [newGoalProgress, setNewGoalProgress] = useState(25);
  const [newGoalMilestones, setNewGoalMilestones] = useState<string>('Initial baseline assessed\nSupport worker coaching completed\nIndependent execution in community');

  // Client's goals filtered
  const filteredGoals = useMemo(() => {
    let list = client.goals || [];
    if (filterCategory !== 'ALL') {
      list = list.filter((g) => g.category === filterCategory);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter((g) => g.status === filterStatus);
    }
    return list;
  }, [client.goals, filterCategory, filterStatus]);

  // Overall calculations
  const totalGoals = client.goals?.length || 0;
  const achievedGoals = client.goals?.filter((g) => g.status === 'Achieved' || g.progressPercent >= 100).length || 0;
  const inProgressGoals = totalGoals - achievedGoals;
  const averageProgress = totalGoals
    ? Math.round(client.goals.reduce((sum, g) => sum + g.progressPercent, 0) / totalGoals)
    : 0;

  // Standard NDIS GAS T-Score calculation
  const ratedGoals = client.goals?.filter((g) => g.gasScore !== undefined) || [];
  const n = ratedGoals.length;
  let gasTScore = 50;
  if (n > 0) {
    const sumX = ratedGoals.reduce((acc, g) => acc + (g.gasScore || 0), 0);
    const denominator = Math.sqrt(0.7 * n + 0.3 * Math.pow(n, 2));
    gasTScore = Math.round((50 + (10 * sumX) / denominator) * 10) / 10;
  }

  // Handle Quick Progress Adjustments
  const handleAdjustProgress = (goalId: string, currentVal: number, delta: number) => {
    const newVal = Math.min(100, Math.max(0, currentVal + delta));
    const status: ClientGoal['status'] = newVal >= 100 ? 'Achieved' : 'In Progress';
    updateClientGoal(client.id, goalId, {
      progressPercent: newVal,
      status,
    });
  };

  // Handle Direct Slider Change
  const handleSliderChange = (goalId: string, value: number) => {
    const status: ClientGoal['status'] = value >= 100 ? 'Achieved' : 'In Progress';
    updateClientGoal(client.id, goalId, {
      progressPercent: value,
      status,
    });
  };

  // Handle GAS Score Update
  const handleUpdateGasScore = (goalId: string, score: -2 | -1 | 0 | 1 | 2) => {
    updateClientGoal(client.id, goalId, { gasScore: score });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    addClientGoal(client.id, {
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      targetDate: newGoalTargetDate,
      progressPercent: Number(newGoalProgress),
      status: newGoalProgress >= 100 ? 'Achieved' : 'In Progress',
      gasScore: 0,
    });

    addAuditLog(
      'CREATE_CLIENT_GOAL',
      'NDIS_GOALS',
      client.id,
      `Added new NDIS Goal for ${client.name}: "${newGoalTitle.trim()}" in category ${newGoalCategory}.`
    );

    addNotification({
      title: `Goal Added for ${client.name}`,
      message: `Created NDIS goal "${newGoalTitle.slice(0, 40)}..." with initial progress ${newGoalProgress}%.`,
      type: 'client',
      severity: 'success',
      linkTab: 'clients',
    });

    setIsAddingGoal(false);
    setNewGoalTitle('');
    setNewGoalProgress(25);
  };

  // Helper for progress bar color
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'from-emerald-500 to-teal-400';
    if (percent >= 50) return 'from-teal-500 to-cyan-400';
    if (percent >= 25) return 'from-sky-500 to-blue-400';
    return 'from-amber-500 to-rose-400';
  };

  const getProgressBg = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (percent >= 50) return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    if (percent >= 25) return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              NDIS Participant Goal Tracking & Visual Progress
            </h3>
            <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded font-bold border border-teal-500/20">
              Outcome Indicator Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking individual milestone completion, percentage indicators, and Goal Attainment Scaling (GAS) for{' '}
            <strong className="text-white">{client.name}</strong> (#{client.ndisNumber}).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Capacity Building">Capacity Building</option>
              <option value="Core">Core Supports</option>
              <option value="Social & Community">Social & Community</option>
              <option value="Capital">Capital</option>
            </select>
          </div>

          {!isViewer && (
            <button
              onClick={() => setIsAddingGoal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New NDIS Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Goal Progress Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Overall Percentage Card */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>Overall Plan Progress</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{averageProgress}%</span>
            <span className="text-[10px] text-teal-400 font-mono">Completed</span>
          </div>
          {/* Main Status Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor(averageProgress)} transition-all duration-500`}
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        {/* Goals Count Summary */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>Active Goal Count</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-sky-400">{totalGoals}</span>
            <span className="text-[10px] text-slate-400 font-mono">({achievedGoals} Achieved)</span>
          </div>
          <p className="text-[10px] text-slate-500">{inProgressGoals} in active progress</p>
        </div>

        {/* Standard GAS T-Score */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>GAS Outcome T-Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${gasTScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {gasTScore}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Mean: 50.0</span>
          </div>
          <p className="text-[10px] text-emerald-400/80 font-mono">
            {gasTScore >= 50 ? '✓ Exceeding Expected Pace' : '⚡ Attention Needed'}
          </p>
        </div>

        {/* Plan Expiry / Review Countdown */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>Plan Review Date</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black font-mono text-purple-300 truncate">{client.planEndDate}</div>
          <p className="text-[10px] text-slate-500 font-mono">NDIS Annual Review Due</p>
        </div>
      </div>

      {/* Goal Cards List with Status Bars & Percentage Indicators */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
            No goals matching the selected category or status. Click &quot;New NDIS Goal&quot; to configure one.
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isAchieved = goal.status === 'Achieved' || goal.progressPercent >= 100;
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border transition-all space-y-3.5 ${
                  isAchieved
                    ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-500/60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Goal Title & Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{goal.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getProgressBg(
                          goal.progressPercent
                        )}`}
                      >
                        {goal.category}
                      </span>
                      {isAchieved ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Achieved
                        </span>
                      ) : (
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded border border-sky-500/20">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Percentage Indicator Badge & Target Date */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono block">Target Date</span>
                      <span className="text-xs text-slate-300 font-mono font-bold">{goal.targetDate}</span>
                    </div>

                    <div className="flex items-center justify-center min-w-[54px] p-1.5 bg-slate-900 rounded-lg border border-slate-700/80">
                      <span className="text-base font-black font-mono text-teal-300">{goal.progressPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* PRIMARY STATUS BAR VISUALIZER */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px] font-bold">Goal Progress Status Bar</span>
                    <span className="text-teal-300 font-bold">{goal.progressPercent}% / 100% Target</span>
                  </div>

                  {/* Visual Status Bar with Gradient Fill & Glow */}
                  <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(
                        goal.progressPercent
                      )} transition-all duration-500 rounded-full shadow-sm`}
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                    {/* Milestone tick marks at 25%, 50%, 75% */}
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-30">
                      <span className="w-0.5 h-full bg-slate-400" style={{ marginLeft: '25%' }} />
                      <span className="w-0.5 h-full bg-slate-400" style={{ marginLeft: '25%' }} />
                      <span className="w-0.5 h-full bg-slate-400" style={{ marginLeft: '25%' }} />
                    </div>
                  </div>
                </div>

                {/* Interactive Slider & Quick Progress Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Slider Control */}
                  <div className="space-y-1 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-teal-400" />
                        Adjust Progress Slider
                      </span>
                      <span className="font-mono text-teal-300 font-bold">{goal.progressPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={isViewer}
                      value={goal.progressPercent}
                      onChange={(e) => handleSliderChange(goal.id, Number(e.target.value))}
                      className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-teal-500 ${
                        isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    />
                  </div>

                  {/* Quick-Action Increment Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80 justify-between flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold uppercase pl-1">Quick Step:</span>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <button
                        disabled={isViewer}
                        onClick={() => handleAdjustProgress(goal.id, goal.progressPercent, -10)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -10%
                      </button>
                      <button
                        disabled={isViewer}
                        onClick={() => handleAdjustProgress(goal.id, goal.progressPercent, 10)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +10%
                      </button>
                      <button
                        disabled={isViewer}
                        onClick={() => handleAdjustProgress(goal.id, goal.progressPercent, 25)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +25%
                      </button>
                      <button
                        disabled={isViewer}
                        onClick={() => handleSliderChange(goal.id, 100)}
                        className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded font-bold transition-all border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✓ 100%
                      </button>
                    </div>
                  </div>
                </div>

                {/* GAS Attainment Scale Score Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[11px] text-slate-400 font-semibold">Goal Attainment Score (GAS):</span>
                    <div className="flex items-center gap-1">
                      {([-2, -1, 0, 1, 2] as const).map((score) => {
                        const isSelected = goal.gasScore === score;
                        return (
                          <button
                            key={score}
                            disabled={isViewer}
                            onClick={() => handleUpdateGasScore(goal.id, score)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                              isViewer ? 'opacity-60 cursor-not-allowed' : ''
                            } ${
                              isSelected
                                ? score > 0
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : score === 0
                                  ? 'bg-teal-600 text-white shadow-sm'
                                  : 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                            title={
                              score === -2
                                ? 'Much less than expected outcome'
                                : score === -1
                                ? 'Less than expected outcome'
                                : score === 0
                                ? 'Expected outcome achieved'
                                : score === 1
                                ? 'More than expected outcome'
                                : 'Much more than expected outcome'
                            }
                          >
                            {score > 0 ? `+${score}` : score}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!isViewer && (
                    <button
                      onClick={() => deleteClientGoal(client.id, goal.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add New NDIS Goal */}
      {isAddingGoal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Create New NDIS Goal</h3>
              </div>
              <button onClick={() => setIsAddingGoal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Goal Description / Milestone Statement</label>
                <textarea
                  required
                  rows={2}
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Master independent emotional regulation techniques during sensory transitions in community environments"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">NDIS Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-teal-300 font-semibold focus:outline-none"
                  >
                    <option value="Capacity Building">Capacity Building</option>
                    <option value="Core">Core Supports</option>
                    <option value="Social & Community">Social & Community</option>
                    <option value="Capital">Capital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Review Date</label>
                  <input
                    type="date"
                    required
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold">Initial Baseline Progress</span>
                  <span className="font-mono text-teal-400 font-bold">{newGoalProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newGoalProgress}
                  onChange={(e) => setNewGoalProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor(newGoalProgress)}`}
                    style={{ width: `${newGoalProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Save NDIS Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
