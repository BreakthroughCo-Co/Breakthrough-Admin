'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Lead, CRMTask, TaskPriority, TaskStatus, NoteCategory } from '@/types';
import {
  UserPlus,
  Plus,
  PhoneCall,
  Mail,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  X,
  CheckSquare,
  Clock,
  AlertTriangle,
  Send,
  StickyNote,
  Filter,
  Search,
  Calendar,
  User,
  ExternalLink,
  Layers,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  Users,
  HeartPulse,
  Tag
} from 'lucide-react';

const CATEGORY_BADGES: Record<
  NoteCategory,
  { label: string; badge: string; text: string; dot: string; icon: any }
> = {
  Clinical: {
    label: 'Clinical',
    badge: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    icon: Stethoscope
  },
  Financial: {
    label: 'Financial',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    icon: DollarSign
  },
  Compliance: {
    label: 'Compliance',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    icon: ShieldCheck
  },
  HR: {
    label: 'HR & Roster',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
    icon: Users
  },
  'BSP & Safety': {
    label: 'BSP & Safety',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    icon: HeartPulse
  },
  Intake: {
    label: 'Intake',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    icon: UserPlus
  },
  General: {
    label: 'General',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    icon: Tag
  }
};

const PRIORITY_BADGES: Record<
  TaskPriority,
  { label: string; badge: string; icon: string }
> = {
  Critical: {
    label: 'Critical Priority',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: '🔴'
  },
  High: {
    label: 'High Priority',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: '🟠'
  },
  Medium: {
    label: 'Medium Priority',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    icon: '🟡'
  },
  Low: {
    label: 'Low Priority',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: '🟢'
  }
};

export const CRMModule: React.FC = () => {
  const {
    currentUser,
    leads,
    crmTasks = [],
    clients,
    addLead,
    updateLeadStage,
    deleteLead,
    addCRMTask,
    updateCRMTask,
    deleteCRMTask,
    toggleCRMTaskStatus,
    setActiveTab,
    addClient,
    addNotification,
    addAuditLog
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'pipeline'>('tasks');
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Lead form state
  const [prospectName, setProspectName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [planValue, setPlanValue] = useState(25000);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<NoteCategory>('Clinical');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('High');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [taskAssignedTo, setTaskAssignedTo] = useState('Marcus Vance');
  const [taskClientId, setTaskClientId] = useState('');

  // Filtering for Tasks
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<NoteCategory | 'ALL'>('ALL');
  const [selectedTaskPriority, setSelectedTaskPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [onlyKeepSynced, setOnlyKeepSynced] = useState(false);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName) return;

    addLead({
      prospectName,
      contactName: contactName || prospectName,
      contactEmail: contactEmail || 'intake@breakthrough.org.au',
      contactPhone: '0400 123 456',
      stage: 'New Intake',
      source: 'Support Coordinator Referral',
      estimatedPlanValue: Number(planValue),
      notes: 'New referral submitted via NDIS intake portal.',
    });

    setIsAddingLead(false);
    setProspectName('');
    setContactName('');
    setContactEmail('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const linkedClient = clients.find((c) => c.id === taskClientId);

    addCRMTask({
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: 'Pending',
      dueDate: taskDueDate,
      assignedTo: taskAssignedTo,
      clientId: taskClientId || undefined,
      clientName: linkedClient?.name,
      isSyncedFromKeep: false
    });

    setIsAddingTask(false);
    setTaskTitle('');
    setTaskDescription('');
    setTaskCategory('Clinical');
    setTaskPriority('High');
    setTaskClientId('');
  };

  const STAGES: Lead['stage'][] = [
    'New Intake',
    'Screening & Qualification',
    'Service Agreement Pending',
    'Converted to Client',
  ];

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return crmTasks.filter((task) => {
      const q = taskSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.category.toLowerCase().includes(q) ||
        task.assignedTo.toLowerCase().includes(q) ||
        (task.clientName && task.clientName.toLowerCase().includes(q)) ||
        (task.sourceNoteTitle && task.sourceNoteTitle.toLowerCase().includes(q));

      const matchesCat = selectedTaskCategory === 'ALL' || task.category === selectedTaskCategory;
      const matchesPri = selectedTaskPriority === 'ALL' || task.priority === selectedTaskPriority;
      const matchesStat = selectedTaskStatus === 'ALL' || task.status === selectedTaskStatus;
      const matchesKeep = !onlyKeepSynced || task.isSyncedFromKeep;

      return matchesSearch && matchesCat && matchesPri && matchesStat && matchesKeep;
    });
  }, [crmTasks, taskSearch, selectedTaskCategory, selectedTaskPriority, selectedTaskStatus, onlyKeepSynced]);

  // Metrics
  const activeTasksCount = crmTasks.filter((t) => t.status !== 'Completed').length;
  const criticalTasksCount = crmTasks.filter((t) => t.priority === 'Critical' || t.priority === 'High').length;
  const keepSyncedCount = crmTasks.filter((t) => t.isSyncedFromKeep).length;
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.estimatedPlanValue || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">CRM & NDIS Action Management</h1>
              <span className="bg-teal-500/10 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-500/20">
                Live Task Queue
              </span>
              {keepSyncedCount > 0 && (
                <span className="bg-amber-500/10 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-amber-500/20 flex items-center gap-1">
                  <StickyNote className="w-3 h-3 text-amber-400" />
                  {keepSyncedCount} Synced from Keep
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize prioritized action items from Google Keep, assign clinical follow-ups, and track intake pipeline conversions.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & New Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'tasks'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Action Items ({crmTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'pipeline'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Intake Pipeline ({leads.length})</span>
            </button>
          </div>

          {!isViewer && (
            activeSubTab === 'tasks' ? (
              <button
                onClick={() => setIsAddingTask(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Action Task</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddingLead(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Prospect</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Action Items</span>
            <CheckSquare className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{activeTasksCount}</p>
          <span className="text-[10px] text-teal-400 font-semibold">Ready for practitioner action</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical / High Priority</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 font-mono mt-1">{criticalTasksCount}</p>
          <span className="text-[10px] text-amber-400 font-semibold">Urgent NDIS compliance deadlines</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Synced from Google Keep</span>
            <StickyNote className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{keepSyncedCount}</p>
          <span className="text-[10px] text-slate-400 font-semibold">1-Click Push integration active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Intake Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            ${(totalPipelineValue / 1000).toFixed(0)}k
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold">{leads.length} active prospect referrals</span>
        </div>
      </div>

      {/* Sub-Tab 1: Task & Action Management View */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks, participants, Keep note source..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Priority & Status Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedTaskPriority}
                  onChange={(e) => setSelectedTaskPriority(e.target.value as any)}
                  className="bg-slate-950 text-slate-300 text-xs border border-slate-700/80 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Critical">🔴 Critical Only</option>
                  <option value="High">🟠 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>

                <select
                  value={selectedTaskStatus}
                  onChange={(e) => setSelectedTaskStatus(e.target.value as any)}
                  className="bg-slate-950 text-slate-300 text-xs border border-slate-700/80 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <button
                  onClick={() => setOnlyKeepSynced(!onlyKeepSynced)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                    onlyKeepSynced
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                  <span>From Google Keep</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills Matching Google Keep Module */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/80 pb-1 scrollbar-thin">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Category:</span>
              <button
                onClick={() => setSelectedTaskCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedTaskCategory === 'ALL'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                All ({crmTasks.length})
              </button>

              {(Object.keys(CATEGORY_BADGES) as NoteCategory[]).map((cat) => {
                const cfg = CATEGORY_BADGES[cat];
                const Icon = cfg.icon;
                const isSelected = selectedTaskCategory === cat;
                const count = crmTasks.filter((t) => t.category === cat).length;
                if (count === 0 && !isSelected) return null;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedTaskCategory(isSelected ? 'ALL' : cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                      isSelected
                        ? `${cfg.badge} font-bold`
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cfg.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-semibold text-slate-300">No CRM tasks match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Push action items from the Google Keep Clinical Hub with 1-click, or create a new action task above.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('google-keep')}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Open Google Keep Hub</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredTasks.map((task) => {
                  const categoryCfg = CATEGORY_BADGES[task.category] || CATEGORY_BADGES.General;
                  const CategoryIcon = categoryCfg.icon;
                  const priorityCfg = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.Medium;
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div
                      key={task.id}
                      className={`bg-slate-900 border ${
                        isCompleted ? 'border-slate-800/60 opacity-60' : 'border-slate-800 hover:border-slate-700'
                      } rounded-2xl p-4 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox */}
                        <button
                          type="button"
                          disabled={isViewer}
                          onClick={() => toggleCRMTaskStatus(task.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 mt-0.5 ${
                            isViewer
                              ? 'opacity-60 cursor-not-allowed border-slate-700 bg-slate-950'
                              : isCompleted
                              ? 'bg-teal-500 border-teal-500 text-slate-950 font-bold'
                              : 'border-slate-600 hover:border-teal-400 bg-slate-950'
                          }`}
                          title={isViewer ? 'View-only' : isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="space-y-1.5 flex-1">
                          {/* Badges strip */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Category Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${categoryCfg.badge}`}
                            >
                              <CategoryIcon className="w-2.5 h-2.5" />
                              {categoryCfg.label}
                            </span>

                            {/* Priority Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityCfg.badge}`}
                            >
                              {priorityCfg.icon} {priorityCfg.label}
                            </span>

                            {/* Synced from Keep Badge */}
                            {task.isSyncedFromKeep && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <StickyNote className="w-2.5 h-2.5 text-amber-400" />
                                Synced from Google Keep
                              </span>
                            )}

                            {/* Linked Client */}
                            {task.clientName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                👤 {task.clientName}
                              </span>
                            )}
                          </div>

                          {/* Task Title & Description */}
                          <div>
                            <h4
                              className={`text-sm font-bold text-white leading-snug ${
                                isCompleted ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Source Google Keep Note Info */}
                          {task.sourceNoteTitle && (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 pt-0.5">
                              <StickyNote className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Source Note: {task.sourceNoteTitle}</span>
                              <button
                                onClick={() => setActiveTab('google-keep')}
                                className="underline hover:text-amber-200 ml-1"
                              >
                                View Note &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Meta Strip: Due date, Assignee, Actions */}
                      <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-teal-400" />
                            <span className="font-mono">{task.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-300 font-semibold">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{task.assignedTo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            disabled={isViewer}
                            onChange={(e) => updateCRMTask(task.id, { status: e.target.value as TaskStatus })}
                            className={`text-[11px] font-bold rounded-lg px-2 py-1 border bg-slate-950 ${
                              isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            } ${
                              task.status === 'Completed'
                                ? 'text-emerald-400 border-emerald-500/40'
                                : task.status === 'In Progress'
                                ? 'text-teal-400 border-teal-500/40'
                                : 'text-amber-400 border-amber-500/40'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Deferred">Deferred</option>
                          </select>

                          {!isViewer && (
                            <button
                              onClick={() => deleteCRMTask(task.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Participant Intake Kanban Pipeline */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAGES.map((stage: Lead['stage']) => {
              const stageLeads = leads.filter((l: Lead) => l.stage === stage);
              return (
                <div key={stage} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200">{stage}</span>
                    <span className="text-[10px] bg-slate-950 text-teal-400 px-2 py-0.5 rounded-full font-mono border border-slate-800 font-bold">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stageLeads.map((lead: Lead) => (
                      <div key={lead.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs hover:border-slate-700 transition">
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-bold text-white text-sm">{lead.prospectName}</div>
                          {!isViewer && (
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                              title="Remove prospect"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{lead.notes}</p>
                        
                        {lead.contactName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>Contact: {lead.contactName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pt-1.5 border-t border-slate-900">
                          <span>Est. Plan Value:</span>
                          <span className="font-bold">${lead.estimatedPlanValue?.toLocaleString()}</span>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                          {lead.stage === 'Service Agreement Pending' && !isViewer && (
                            <button
                              onClick={() => {
                                const newClientId = `cli-converted-${Date.now()}`;
                                addClient({
                                  id: newClientId,
                                  ndisNumber: (lead as any).ndisNumber || `TBD-${Date.now().toString().slice(-4)}`,
                                  name: lead.prospectName,
                                  dateOfBirth: '',
                                  status: 'Onboarding',
                                  primaryDisability: (lead as any).primaryDisability || 'NDIS Participant',
                                  goals: [],
                                  planStartDate: new Date().toISOString().slice(0, 10),
                                  planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                                  totalBudget: lead.estimatedPlanValue || 25000,
                                  allocatedBudget: 0,
                                  spentBudget: 0,
                                  primaryPractitionerId: (lead as any).assignedPractitionerId || '',
                                  primaryPractitionerName: (lead as any).assignedPractitionerName || 'Unassigned',
                                  riskLevel: 'Low',
                                  emergencyContact: { name: lead.contactName || '', relationship: 'Nominee/Carer', phone: lead.contactPhone || '' },
                                  restrictivePracticesActive: false,
                                  email: lead.contactEmail || '',
                                  phone: lead.contactPhone || '',
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                } as any);
                                updateLeadStage(lead.id, 'Converted to Client' as any);
                                addNotification({
                                  title: 'Lead Converted to Participant',
                                  message: `${lead.prospectName} has been converted to an active participant (Onboarding status).`,
                                  type: 'client',
                                  severity: 'medium',
                                  linkTab: 'clients',
                                });
                                addAuditLog('CONVERT_LEAD_TO_CLIENT', 'CLIENT', newClientId, `Lead ${lead.prospectName} converted to participant`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm"
                            >
                              <UserPlus className="w-3 h-3" />
                              Convert to Participant
                            </button>
                          )}
                          <select
                            value={lead.stage}
                            disabled={isViewer}
                            onChange={(e) => updateLeadStage(lead.id, e.target.value as any)}
                            className={`ml-auto bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-teal-400 font-bold focus:outline-none ${
                              isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                Move &rarr; {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: New Action Task */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-teal-400" />
                Create New CRM Action Task
              </h3>
              <button onClick={() => setIsAddingTask(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Action Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Deliver 1-hour coaching session with primary support worker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Task Description / Context</label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Provide clinical context, NDIS compliance notes, or next milestones..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category Domain</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as NoteCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Clinical">Clinical</option>
                    <option value="Financial">Financial</option>
                    <option value="Compliance">Compliance</option>
                    <option value="HR">HR & Roster</option>
                    <option value="BSP & Safety">BSP & Safety</option>
                    <option value="Intake">Intake</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Priority Level</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Critical">🔴 Critical (NDIS Deadline)</option>
                    <option value="High">🟠 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Practitioner</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Marcus Vance">Marcus Vance (Senior Specialist)</option>
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Clinical Director)</option>
                    <option value="Elena Rostova">Elena Rostova (Compliance Officer)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Link NDIS Participant (Optional)</label>
                  <select
                    value={taskClientId}
                    onChange={(e) => setTaskClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">No linked participant</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Intake Prospect */}
      {isAddingLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                New Intake Prospect
              </h3>
              <button onClick={() => setIsAddingLead(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Prospect Full Name</label>
                <input
                  type="text"
                  required
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="e.g. Ethan Wright"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Referral / Contact Person</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Support Coordinator Sarah"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@referral.org.au"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Estimated NDIS Budget ($)</label>
                <input
                  type="number"
                  value={planValue}
                  onChange={(e) => setPlanValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingLead(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
