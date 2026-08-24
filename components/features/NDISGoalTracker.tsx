'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal, CaseNote } from '@/types';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Link2,
  Unlink,
  FileText,
  Filter,
  Sparkles,
  Trash2,
  Eye,
  Sliders,
  Award,
  ChevronRight,
  X,
  Users,
  BarChart2,
  AlertCircle
} from 'lucide-react';

interface NDISGoalTrackerProps {
  initialClientId?: string;
  onNavigateToNote?: (noteId: string) => void;
}

export const NDISGoalTracker: React.FC<NDISGoalTrackerProps> = ({
  initialClientId,
  onNavigateToNote,
}) => {
  const {
    clients,
    caseNotes,
    selectedClientId,
    setSelectedClientId,
    addClientGoal,
    updateClientGoal,
    deleteClientGoal,
    linkCaseNoteToGoal,
    updateCaseNote,
    addNotification,
    addAuditLog,
    setActiveTab
  } = useManagementStore();

  // Active Client Selection
  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return initialClientId || selectedClientId || clients[0]?.id || 'cli-101';
  });

  const client = useMemo(() => {
    return clients.find((c: Client) => c.id === activeClientId) || clients[0];
  }, [clients, activeClientId]);

  // Filters & State
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [activeGoalForLinking, setActiveGoalForLinking] = useState<ClientGoal | null>(null);
  const [previewNote, setPreviewNote] = useState<CaseNote | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // New Goal Form
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: 'Capacity Building' as ClientGoal['category'],
    targetDate: '2026-12-31',
    progressPercent: 25,
    status: 'In Progress' as ClientGoal['status'],
    gasScore: 0 as -2 | -1 | 0 | 1 | 2,
  });

  // Client's clinical case notes
  const clientNotes = useMemo(() => {
    if (!client) return [];
    return caseNotes.filter((n: CaseNote) => n.clientId === client.id);
  }, [caseNotes, client]);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    if (!client?.goals) return [];
    let list = client.goals;
    if (filterCategory !== 'ALL') {
      list = list.filter((g) => g.category === filterCategory);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter((g) => g.status === filterStatus);
    }
    return list;
  }, [client?.goals, filterCategory, filterStatus]);

  // Overall Goal Progress Metrics
  const totalGoals = client?.goals?.length || 0;
  const achievedGoals = client?.goals?.filter((g) => g.status === 'Achieved' || g.progressPercent >= 100).length || 0;
  const averageProgress = totalGoals
    ? Math.round(client.goals.reduce((acc, g) => acc + g.progressPercent, 0) / totalGoals)
    : 0;

  // Standard NDIS Clinical GAS T-Score Calculation
  const ratedGoals = client?.goals?.filter((g) => g.gasScore !== undefined) || [];
  const n = ratedGoals.length;
  let gasTScore = 50;
  if (n > 0) {
    const sumX = ratedGoals.reduce((acc, g) => acc + (g.gasScore || 0), 0);
    const denominator = Math.sqrt(0.7 * n + 0.3 * Math.pow(n, 2));
    gasTScore = Math.round((50 + (10 * sumX) / denominator) * 10) / 10;
  }

  // Chart Data for Bar Chart
  const chartData = useMemo(() => {
    if (!client?.goals) return [];
    return client.goals.map((g, idx) => ({
      id: g.id,
      name: g.title.length > 25 ? `${g.title.slice(0, 25)}...` : g.title,
      fullTitle: g.title,
      progress: g.progressPercent,
      target: 100,
      category: g.category,
      status: g.status,
      linkedNotesCount: g.linkedNoteIds?.length || 0,
      gasScore: g.gasScore ?? 0,
    }));
  }, [client?.goals]);

  // Handle Creating Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !client) return;

    addClientGoal(client.id, {
      title: newGoal.title.trim(),
      category: newGoal.category,
      targetDate: newGoal.targetDate,
      progressPercent: Number(newGoal.progressPercent),
      status: newGoal.status,
      gasScore: newGoal.gasScore,
      gasHistory: [
        {
          date: new Date().toISOString().slice(0, 10),
          score: newGoal.gasScore,
          note: 'Goal created and baseline set',
        },
      ],
      linkedNoteIds: [],
    });

    setIsAddingGoal(false);
    setNewGoal({
      title: '',
      category: 'Capacity Building',
      targetDate: '2026-12-31',
      progressPercent: 25,
      status: 'In Progress',
      gasScore: 0,
    });
  };

  // Handle Linking a Note to Goal
  const handleLinkNote = (goalId: string, noteId: string) => {
    if (!client) return;
    linkCaseNoteToGoal(client.id, goalId, noteId);
    setActiveGoalForLinking(null);

    addNotification({
      title: `Clinical Note Linked to Goal`,
      message: `Linked case note to "${client.goals.find((g) => g.id === goalId)?.title.slice(0, 40)}..."`,
      type: 'clinical',
      severity: 'low',
    });
  };

  // Handle Unlinking a Note from Goal
  const handleUnlinkNote = (goalId: string, noteId: string) => {
    if (!client) return;
    const targetGoal = client.goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const updatedNoteIds = (targetGoal.linkedNoteIds || []).filter((id) => id !== noteId);
    updateClientGoal(client.id, goalId, { linkedNoteIds: updatedNoteIds });

    // Also update CaseNote's linkedGoalIds
    const note = caseNotes.find((n) => n.id === noteId);
    if (note) {
      const updatedGoalIds = (note.linkedGoalIds || []).filter((id) => id !== goalId);
      updateCaseNote(noteId, { linkedGoalIds: updatedGoalIds });
    }

    addAuditLog(
      'UNLINK_NOTE_GOAL',
      'ClientGoal',
      goalId,
      `Unlinked case note ${noteId} from goal ${goalId}`
    );
  };

  // Handle Progress Slider
  const handleProgressChange = (goalId: string, value: number) => {
    if (!client) return;
    const status: ClientGoal['status'] = value >= 100 ? 'Achieved' : 'In Progress';
    updateClientGoal(client.id, goalId, {
      progressPercent: value,
      status,
    });
  };

  // Handle AI Review Summary Generation
  const handleGenerateSummary = async () => {
    if (!client) return;
    setIsGeneratingSummary(true);
    try {
      const prompt = `
You are an expert NDIS Behaviour Support and Allied Health Practitioner.
Generate a concise, professional NDIS Plan Review Goal Progress Summary for participant "${client.name}" (NDIS #${client.ndisNumber}).

Participant Goals:
${JSON.stringify(client.goals, null, 2)}

Linked Clinical Notes:
${JSON.stringify(
  clientNotes.slice(0, 5).map((n) => ({
    date: n.date,
    format: n.format,
    practitioner: n.practitionerName,
    subjective: n.subjective,
    objective: n.objective,
    assessment: n.assessment,
    plan: n.plan,
  })),
  null,
  2
)}

Format with:
1. Executive Goal Progress Summary & Average Achievement (${averageProgress}%)
2. Goal Attainment Scaling (GAS) Clinical Outcomes Analysis (T-Score: ${gasTScore})
3. Key Evidence from Linked Clinical Notes
4. Recommendations for Next NDIS Plan Period
`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an authoritative NDIS Clinical Outcome Specialist. Generate clean, formal markdown without conversational filler.',
          model: 'gemini-3.5-flash',
        }),
      });

      const data = await res.json();
      setAiSummary(data.text || 'Unable to generate goal review summary.');
    } catch (err) {
      console.error('Error generating goal review summary:', err);
      setAiSummary('Failed to contact AI service for review synthesis.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Client Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-xl border border-teal-500/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">NDIS Goal Tracker & Clinical Evidence Hub</h2>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                Live Evidence Linker
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Link clinical case notes directly to funded NDIS goals and track milestone progress with interactive visualizations.
            </p>
          </div>
        </div>

        {/* Client Selector & Quick Action */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Users className="w-4 h-4 text-teal-400" />
            <select
              value={activeClientId}
              onChange={(e) => {
                setActiveClientId(e.target.value);
                setSelectedClientId(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name} (NDIS #{c.ndisNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            id="add-ndis-goal-btn"
            onClick={() => setIsAddingGoal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add NDIS Goal</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">Total Active Goals</span>
          <div className="text-2xl font-black text-white">{totalGoals}</div>
          <p className="text-[11px] text-teal-400 font-mono">{achievedGoals} Achieved / {totalGoals - achievedGoals} In Progress</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">Average Goal Completion</span>
          <div className="text-2xl font-black text-teal-400 font-mono">{averageProgress}%</div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block" title="Standardized Goal Attainment Scaling T-Score (Mean = 50)">
            Clinical GAS T-Score
          </span>
          <div className={`text-2xl font-black font-mono ${gasTScore >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {gasTScore}
          </div>
          <p className="text-[11px] text-slate-400">{gasTScore >= 50 ? 'Exceeding NDIS Baseline' : 'Approaching Baseline'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 block">Linked Clinical Notes</span>
          <div className="text-2xl font-black text-sky-400">
            {client?.goals?.reduce((sum, g) => sum + (g.linkedNoteIds?.length || 0), 0) || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">From {clientNotes.length} available sessions</p>
        </div>
      </div>

      {/* Goal Progress Bar Chart Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">NDIS Goal Progress Breakdown (% Completed)</h3>
              <p className="text-xs text-slate-400">Visual progress distribution across capacity building and core goals</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-950 text-slate-300 font-mono px-2.5 py-1 rounded-lg border border-slate-800">
              Participant: <strong className="text-teal-300">{client?.name}</strong>
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
            <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            No goals configured for this client yet. Click &quot;Add NDIS Goal&quot; to create one.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={150}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 z-50">
                          <p className="font-bold text-white">{data.fullTitle}</p>
                          <p className="text-teal-400 font-mono">Progress: {data.progress}%</p>
                          <p className="text-slate-400">Category: {data.category}</p>
                          <p className="text-slate-400">Status: {data.status}</p>
                          <p className="text-sky-400 font-mono">Linked Clinical Notes: {data.linkedNotesCount}</p>
                          <p className="text-amber-400 font-mono">GAS Score: {data.gasScore > 0 ? `+${data.gasScore}` : data.gasScore}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.progress >= 100
                          ? '#10b981'
                          : entry.progress >= 60
                          ? '#14b8a6'
                          : entry.progress >= 30
                          ? '#38bdf8'
                          : '#f59e0b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filter and Goals List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Goal & Clinical Evidence Register</h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Capacity Building">Capacity Building</option>
              <option value="Core">Core</option>
              <option value="Capital">Capital</option>
              <option value="Social & Community">Social & Community</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Achieved">Achieved</option>
              <option value="Deferred">Deferred</option>
            </select>

            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGeneratingSummary ? 'Synthesizing...' : 'AI Plan Review Summary'}</span>
            </button>
          </div>
        </div>

        {/* AI Goal Summary Output */}
        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Clinical Goal Progress & Evidence Synthesis</span>
              </div>
              <button
                onClick={() => setAiSummary(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {aiSummary}
            </div>
          </motion.div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              No goals match the selected filter criteria.
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const linkedNotes = caseNotes.filter((n) =>
                goal.linkedNoteIds?.includes(n.id)
              );

              return (
                <div
                  key={goal.id}
                  className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
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
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : goal.status === 'Deferred'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                          }`}
                        >
                          {goal.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Target Date: <strong className="text-slate-300">{goal.targetDate}</strong>
                        </span>
                        <span className="font-mono">
                          GAS Rating: <strong className="text-teal-400">{goal.gasScore !== undefined ? (goal.gasScore > 0 ? `+${goal.gasScore}` : goal.gasScore) : '0'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-lg font-black font-mono text-teal-400">
                          {goal.progressPercent}%
                        </span>
                      </div>
                      <button
                        onClick={() => deleteClientGoal(client.id, goal.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-all"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Progress Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Adjust Progress</span>
                      <span>{goal.progressPercent}% Completed</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progressPercent}
                      onChange={(e) => handleProgressChange(goal.id, Number(e.target.value))}
                      className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
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

                  {/* Linked Clinical Notes Section */}
                  <div className="pt-3 border-t border-slate-900 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Linked Clinical Case Notes ({linkedNotes.length})</span>
                      </span>

                      <button
                        id={`link-note-btn-${goal.id}`}
                        onClick={() => setActiveGoalForLinking(goal)}
                        className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded text-[11px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link Clinical Note</span>
                      </button>
                    </div>

                    {/* Linked Notes List */}
                    {linkedNotes.length === 0 ? (
                      <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-900 text-[11px] text-slate-500 italic">
                        No clinical case notes linked yet. Click &quot;Link Clinical Note&quot; to attach session evidence.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {linkedNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between gap-2 hover:border-slate-700 transition-all"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-1.5 py-0.5 rounded font-bold">
                                  {note.format}
                                </span>
                                <span className="text-xs font-bold text-white truncate">
                                  {new Date(note.date).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate">
                                  by {note.practitionerName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 line-clamp-2">
                                {note.subjective || note.objective || note.assessment}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setPreviewNote(note)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                                title="View full note"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUnlinkNote(goal.id, note.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                                title="Unlink from goal"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Link Note Modal */}
      <AnimatePresence>
        {activeGoalForLinking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-teal-400" />
                    Link Clinical Case Note to Goal
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                    Goal: <span className="text-teal-300 font-semibold">{activeGoalForLinking.title}</span>
                  </p>
                </div>
                <button
                  onClick={() => setActiveGoalForLinking(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {clientNotes.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No clinical case notes recorded for this participant yet.
                  </div>
                ) : (
                  clientNotes.map((note) => {
                    const isAlreadyLinked = activeGoalForLinking.linkedNoteIds?.includes(note.id);
                    return (
                      <div
                        key={note.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isAlreadyLinked
                            ? 'bg-teal-950/20 border-teal-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-1.5 py-0.5 rounded font-bold">
                              {note.format}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {new Date(note.date).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              by {note.practitionerName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {note.subjective || note.objective || note.assessment}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyLinked ? (
                            <button
                              onClick={() => handleUnlinkNote(activeGoalForLinking.id, note.id)}
                              className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-rose-400 rounded text-xs font-bold transition-all"
                            >
                              Unlink
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLinkNote(activeGoalForLinking.id, note.id)}
                              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold transition-all shadow-sm"
                            >
                              Link Note
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
                <button
                  onClick={() => setActiveGoalForLinking(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Preview Modal */}
      <AnimatePresence>
        {previewNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Clinical Note Preview ({previewNote.format})
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {new Date(previewNote.date).toLocaleDateString()} • {previewNote.practitionerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs overflow-y-auto max-h-[60vh]">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-teal-400 uppercase font-mono">Subjective / Situation</span>
                  <p className="text-slate-300 leading-relaxed">{previewNote.subjective || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-sky-400 uppercase font-mono">Objective / Intervention</span>
                  <p className="text-slate-300 leading-relaxed">{previewNote.objective || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Assessment / Measurement</span>
                  <p className="text-slate-300 leading-relaxed">{previewNote.assessment || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Plan / Next Steps</span>
                  <p className="text-slate-300 leading-relaxed">{previewNote.plan || 'N/A'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Goal Modal */}
      <AnimatePresence>
        {isAddingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">Create New NDIS Goal</h3>
                </div>
                <button
                  onClick={() => setIsAddingGoal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Goal Description / Title</label>
                  <textarea
                    required
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g. Master independent emotional regulation techniques during sensory transitions in public transit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-teal-500 resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">NDIS Support Category</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="Capacity Building">Capacity Building</option>
                      <option value="Core">Core</option>
                      <option value="Capital">Capital</option>
                      <option value="Social & Community">Social & Community</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Target Review Date</label>
                    <input
                      type="date"
                      required
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Initial Progress ({newGoal.progressPercent}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newGoal.progressPercent}
                      onChange={(e) => setNewGoal({ ...newGoal, progressPercent: Number(e.target.value) })}
                      className="w-full accent-teal-500 bg-slate-800 h-2 rounded cursor-pointer mt-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Baseline GAS Score</label>
                    <select
                      value={newGoal.gasScore}
                      onChange={(e) => setNewGoal({ ...newGoal, gasScore: Number(e.target.value) as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value={-2}>-2: Baseline / Initial</option>
                      <option value={-1}>-1: Less than Expected</option>
                      <option value={0}>0: Expected Target</option>
                      <option value={1}>+1: More than Expected</option>
                      <option value={2}>+2: Much more than Expected</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingGoal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save NDIS Goal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
