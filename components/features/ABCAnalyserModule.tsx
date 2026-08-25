'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { ABCLog, Client, ClientGoal } from '@/types';
import {
  suggestGoalsFromABC,
  SuggestedNDISGoal,
  analyzeABCPatternsAndInterventions
} from '@/lib/ai-assistant';
import {
  BarChart3,
  Plus,
  Sparkles,
  CheckCircle2,
  PieChart,
  Activity,
  Clock,
  X,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  Sun,
  Sunset,
  Moon,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

export const ABCAnalyserModule: React.FC = () => {
  const { abcLogs, clients, currentUser, addABCLog, updateClient, addNotification, setActiveTab } = useManagementStore();
  const isViewer = currentUser?.role === 'VIEWER';
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isAdding, setIsAdding] = useState(false);
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedNDISGoal[]>([]);

  const [antecedent, setAntecedent] = useState('');
  const [behavior, setBehavior] = useState('');
  const [consequence, setConsequence] = useState('');
  const [functionType, setFunctionType] = useState<ABCLog['perceivedFunction']>('Escape/Avoidance');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  // Filter logs for currently selected participant
  const clientLogs = useMemo(() => {
    return abcLogs.filter((l) => !selectedClient || l.clientId === selectedClient);
  }, [abcLogs, selectedClient]);

  // Live statistical pattern analysis & PBS advisor computation
  const patternAnalysis = useMemo(() => {
    return analyzeABCPatternsAndInterventions(clientLogs.length > 0 ? clientLogs : abcLogs);
  }, [clientLogs, abcLogs]);

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
      recordedBy: currentUser?.name || 'Practitioner',
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">ABC Behaviour Analyser & PBS Advisor</h2>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono font-medium">
                Live Pattern Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Antecedent trigger clustering, temporal distribution heatmap, and evidence-based PBS intervention recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Participant:</span>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-transparent text-teal-300 font-bold focus:outline-none cursor-pointer"
            >
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={async () => {
              const goals = await suggestGoalsFromABC(clientLogs.length > 0 ? clientLogs : abcLogs);
              setSuggestedGoals(goals);
              setShowGoalSuggestions(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm shrink-0"
            title="Generate NDIS SMART & GAS Goals from ABC observation patterns"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Suggest Goals</span>
          </button>

          {!isViewer && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Log ABC Observation</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Pattern Recognition & PBS Advisor Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top 3 Antecedent Clusters & Temporal Heatmap */}
        <div className="space-y-4">
          {/* Top 3 Antecedent Clusters Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Top 3 Antecedent Clusters
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {clientLogs.length} Total Observations
              </span>
            </div>

            <div className="space-y-3">
              {patternAnalysis.topAntecedents.map((cluster, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[190px]">
                      {idx + 1}. {cluster.antecedent}
                    </span>
                    <span className="text-[10px] font-mono text-teal-400 font-bold px-1.5 py-0.5 bg-teal-500/10 rounded">
                      {cluster.count}x ({cluster.percentage}%)
                    </span>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, cluster.percentage)}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {cluster.description || 'Observed antecedent trigger'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Temporal & Day Distribution Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Time of Day & Day Distribution
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Morning</span>
                </div>
                <div className="text-lg font-black text-white font-mono">
                  {patternAnalysis.timeOfDayDistribution?.morning || 0}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">events</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Sunset className="w-3.5 h-3.5 text-orange-400" />
                  <span>Afternoon</span>
                </div>
                <div className="text-lg font-black text-teal-400 font-mono">
                  {patternAnalysis.timeOfDayDistribution?.afternoon || 0}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">events</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Evening</span>
                </div>
                <div className="text-lg font-black text-white font-mono">
                  {patternAnalysis.timeOfDayDistribution?.evening || 0}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">events</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Night</span>
                </div>
                <div className="text-lg font-black text-slate-300 font-mono">
                  {patternAnalysis.timeOfDayDistribution?.night || 0}
                  <span className="text-[10px] text-slate-500 font-normal ml-1">events</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Dominant Function & PBS Intervention Advisor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Functional Hypothesis & Dominant Function Banner */}
          <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-5 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Dominant Function of Behaviour & Clinical Hypothesis
                </h3>
              </div>
              <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
                Function: {patternAnalysis.dominantFunction}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800 italic">
              &quot;{patternAnalysis.clinicalHypothesis}&quot;
            </p>
          </div>

          {/* PBS Advisor Strategy Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Evidence-Based PBS Strategy Advisor
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab('bsp');
                    addNotification({
                      title: 'PBS Strategies Staged',
                      message: `Proactive and reactive strategies staged for ${selectedClientObj?.name || 'Participant'} BSP document.`,
                      type: 'clinical',
                      severity: 'low'
                    });
                  }}
                  className="px-2.5 py-1 bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                  title="Stage strategies into BSP generator"
                >
                  <FileSpreadsheet className="w-3 h-3 text-teal-400" />
                  <span>1-Click Add to BSP</span>
                </button>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  PBS Quality Standard Compliant
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Proactive Strategies */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Proactive Environmental Strategies
                </span>
                <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  {patternAnalysis.proactiveStrategies.map((strat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span>{strat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reactive Strategies */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Reactive De-escalation Protocols
                </span>
                <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  {patternAnalysis.reactiveStrategies.map((strat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <span>{strat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Replacement Skills */}
            {patternAnalysis.replacementSkills.length > 0 && (
              <div className="p-3.5 bg-indigo-950/30 rounded-xl border border-indigo-500/30 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Recommended Replacement Skills & Functional Communication
                </span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {patternAnalysis.replacementSkills.map((sk, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{sk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Goal Suggestions Panel */}
      {showGoalSuggestions && suggestedGoals.length > 0 && (
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white">AI-Generated NDIS SMART & GAS Goals from ABC Patterns</h3>
            </div>
            <button
              onClick={() => setShowGoalSuggestions(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-md"
            >
              Dismiss
            </button>
          </div>

          <div className="space-y-3">
            {suggestedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-300">{goal.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-full font-mono">
                      GAS: {goal.gasScore}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Category: {goal.category}</span>
                    <span>Target: {goal.targetDate}</span>
                    <span>Initial Progress: {goal.progressPercent}%</span>
                  </div>
                </div>

                {!isViewer && (
                  <button
                    onClick={() => {
                      if (selectedClientObj) {
                        const newGoal: ClientGoal = {
                          id: goal.id,
                          title: goal.title,
                          category: goal.category,
                          targetDate: goal.targetDate,
                          progressPercent: goal.progressPercent,
                          status: goal.status as any,
                          gasScore: goal.gasScore
                        };
                        const updatedGoals = [...(selectedClientObj.goals || []), newGoal];
                        updateClient(selectedClientObj.id, { goals: updatedGoals });
                        addNotification({
                          title: 'Goal Added to Participant',
                          message: `"${goal.title}" linked to ${selectedClientObj.name}.`,
                          type: 'clinical',
                          severity: 'low'
                        });
                        setSuggestedGoals((prev) => prev.filter((g) => g.id !== goal.id));
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Adopt Goal</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observation Logs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recorded ABC Observation Logs ({clientLogs.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientLogs.map((log: ABCLog) => (
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
                <span className="font-mono text-slate-500">{log.timeOfDay} &bull; {log.dayOfWeek}</span>
              </div>
            </div>
          ))}
        </div>
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
