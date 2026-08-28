'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, CaseNote, Incident, ScheduledShift, PlainLanguageSessionNote } from '@/types';
import { ParticipantChatbot } from '@/components/features/ParticipantChatbot';
import { redactCaseNote, batchRedactNotes, getParticipantReadableIncidents } from '@/lib/clinicalRedactor';
import {
  User, Calendar as CalendarIcon, DollarSign, Target, FileText, MessageSquare, ShieldCheck,
  Clock, CheckCircle2, TrendingUp, AlertTriangle, HeartHandshake, Sparkles, Lock, Eye,
  Info, ShieldAlert, ChevronRight, Lightbulb, CheckSquare, Send, Star, FileDown,
  ChevronLeft
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const ParticipantPortalView: React.FC = () => {
  const { clients, caseNotes, incidents, scheduledShifts, currentUser, addNotification, addCRMTask } = useManagementStore();

  const isParticipantUser = currentUser?.role === 'PARTICIPANT';
  const participantTargetId = currentUser?.participantId || currentUser?.linkedClientId || (isParticipantUser ? currentUser?.id : null);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    participantTargetId || clients[0]?.id || 'cli-101'
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'appointments' | 'goals' | 'incidents' | 'chat'>('overview');

  const client = useMemo(() => {
    if (isParticipantUser && participantTargetId) {
      return clients.find((c: Client) => c.id === participantTargetId) || clients[0];
    }
    return clients.find((c: Client) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId, isParticipantUser, participantTargetId]);

  const clientNotes = useMemo(() => {
    const raw = caseNotes.filter((n: CaseNote) => n.clientId === client?.id);
    return batchRedactNotes(raw);
  }, [caseNotes, client]);

  const clientAppointments: ScheduledShift[] = useMemo(() => {
    const shiftsFromStore = (scheduledShifts || []).filter((s: ScheduledShift) => s.clientId === client?.id);
    if (shiftsFromStore.length > 0) return shiftsFromStore;
    return [
      {
        id: 'appt-1',
        clientId: client?.id || 'cli-101',
        clientName: client?.name || 'Participant',
        practitionerId: client?.primaryPractitionerId || 'prac-101',
        date: '2026-08-28',
        startTime: '10:00',
        endTime: '11:30',
        supportType: 'Allied Health Positive Behaviour Support Session'
      },
      {
        id: 'appt-2',
        clientId: client?.id || 'cli-101',
        clientName: client?.name || 'Participant',
        practitionerId: client?.primaryPractitionerId || 'prac-101',
        date: '2026-09-04',
        startTime: '14:00',
        endTime: '15:30',
        supportType: 'Capacity Building & Community Engagement Review'
      }
    ];
  }, [scheduledShifts, client]);

  const clientIncidents = useMemo(() => {
    return getParticipantReadableIncidents(incidents, client?.id || 'cli-101');
  }, [incidents, client]);

  const totalBudget = client?.totalBudget || 48500;
  const spentBudget = client?.spentBudget || 24350;
  const remainingBudget = Math.max(0, totalBudget - spentBudget);
  const utilizationPercent = totalBudget > 0 ? Math.min(100, Math.round((spentBudget / totalBudget) * 100)) : 0;

  const [feedbacks, setFeedbacks] = useState<Record<string, { rating: number, comment: string, submitted: boolean }>>({});

  const handleRatingSubmit = (noteId: string) => {
    setFeedbacks((prev) => ({
      ...prev,
      [noteId]: { ...prev[noteId], submitted: true }
    }));
    addNotification({
      title: 'Feedback Submitted',
      message: 'Thank you for your feedback.',
      type: 'system',
      severity: 'info',
      linkTab: 'overview'
    });
  };

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Aug 2026
  
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const getDayAppointments = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return clientAppointments.filter(a => a.date === dateStr);
  };

  const [docRequest, setDocRequest] = useState({ type: 'Service Agreement', notes: '', submitted: false });

  const handleDocumentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setDocRequest(prev => ({ ...prev, submitted: true }));
    addNotification({
      title: 'Document Request Received',
      message: `Your request for ${docRequest.type} has been sent to administration.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'clients'
    });
    addCRMTask({
      title: `Document Request: ${docRequest.type}`,
      description: `Client ${client?.name} requested a copy of ${docRequest.type}. Notes: ${docRequest.notes}`,
      priority: 'Medium',
      status: 'Pending',
      category: 'Compliance',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'admin',
      clientId: client?.id,
      clientName: client?.name
    });
    setTimeout(() => {
      setDocRequest({ type: 'Service Agreement', notes: '', submitted: false });
    }, 3000);
  };

  const pieData = [
    { name: 'Core Supports', value: 15000, color: '#f43f5e' },
    { name: 'Capacity Building', value: 25000, color: '#3b82f6' },
    { name: 'Capital Supports', value: 8500, color: '#10b981' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-2xl border border-teal-500/30 shadow-inner">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white">{client?.name || 'Participant Portal'}</h2>
                <span className="text-xs bg-teal-500/10 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/20 font-mono font-bold">
                  NDIS #{client?.ndisNumber || '430891245'}
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  {isParticipantUser ? 'Authenticated Participant' : 'Practice Preview Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your secure participant & carer portal for session schedules, goal progress, and NDIS plan utilization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isParticipantUser && clients.length > 1 && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              >
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    Viewing: {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Budget Utilization Card with D3/Recharts Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              NDIS Plan Budget Utilization
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Plan Dates: {client?.planStartDate || '2026-01-01'} to {client?.planEndDate || '2026-12-31'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Plan Budget</span>
              <div className="text-xl font-black text-white font-mono">
                ${totalBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500">Allocated NDIS Funding</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Funds Utilized</span>
              <div className="text-xl font-black text-amber-400 font-mono">
                ${spentBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-amber-400/80 font-bold">{utilizationPercent}% Used to date</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining Balance</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ${remainingBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-bold">Available for upcoming sessions</span>
            </div>
          </div>
          <div className="h-32 lg:h-full min-h-[120px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar View for Upcoming Appointments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                My Schedule
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-slate-800 rounded text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white min-w-[100px] text-center">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-slate-800 rounded text-slate-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const appts = getDayAppointments(day);
                const hasAppt = appts.length > 0;
                return (
                  <div 
                    key={idx} 
                    className={`h-10 sm:h-12 border ${day ? 'border-slate-800 bg-slate-950/50' : 'border-transparent'} rounded flex flex-col items-center pt-1 relative`}
                  >
                    {day && <span className={`text-[10px] ${hasAppt ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>{day}</span>}
                    {hasAppt && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {appts.map((a, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500" title={`${a.startTime} - ${a.supportType}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming List</span>
            {clientAppointments.length === 0 && (
               <div className="text-xs text-slate-500 italic">No upcoming appointments.</div>
            )}
            {clientAppointments.slice(0, 3).map((appt) => (
              <div
                key={appt.id}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 flex justify-between items-center"
              >
                <div>
                  <div className="text-[11px] font-bold text-teal-300">{appt.supportType}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <User className="w-3 h-3" /> {appt.practitionerName || client?.primaryPractitionerName || 'Marcus Vance'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                    {appt.date}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{appt.startTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Goals & Outcomes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Plan Goals & Velocity
              </h3>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              {client?.goals?.length || 2} Milestones
            </span>
          </div>

          <div className="space-y-3">
            {(client?.goals && client.goals.length > 0 ? client.goals : [
              { id: 'g1', title: 'Community Autonomy & Public Transport Navigation', progressPercent: 85 },
              { id: 'g2', title: 'Emotional Self-Regulation & Calming Strategies', progressPercent: 78 }
            ]).map((goal: any, idx: number) => {
              const progress = goal.progressPercent || goal.progress || 80;
              return (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{goal.title}</span>
                    <span className="text-emerald-400 font-mono font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full rounded-full bg-emerald-500 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Document Request Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Request Document Copies
            </h3>
          </div>
        </div>
        
        {docRequest.submitted ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="text-sm text-emerald-200">Your request has been successfully submitted to administration.</div>
          </div>
        ) : (
          <form onSubmit={handleDocumentRequest} className="space-y-4 max-w-lg">
            <p className="text-xs text-slate-400">Select a document you would like a copy of for your records. The administration team will securely send this to you.</p>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Type</label>
              <select 
                value={docRequest.type}
                onChange={e => setDocRequest(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Service Agreement">Service Agreement</option>
                <option value="Recent Case Notes">Recent Case Notes</option>
                <option value="Behaviour Support Plan">Behaviour Support Plan</option>
                <option value="NDIS Progress Report">NDIS Progress Report</option>
                <option value="Financial Statement">Financial Statement</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Additional Notes (Optional)</label>
              <textarea 
                value={docRequest.notes}
                onChange={e => setDocRequest(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Please send the notes from my last two sessions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
              ></textarea>
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </form>
        )}
      </div>

      {/* Redacted Plain-Language Case Notes (R14) with Feedback */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Session Progress Updates & Feedback
            </h3>
          </div>
          <span className="text-xs bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Participant Redaction Filter Active</span>
          </span>
        </div>

        <div className="space-y-4">
          {clientNotes.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">
              No session notes recorded for this period yet.
            </p>
          ) : (
            clientNotes.slice(0, 4).map((note: PlainLanguageSessionNote) => (
              <div
                key={note.id}
                className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-2">
                  <span className="font-bold text-teal-300">{note.serviceType || 'Therapeutic Support'}</span>
                  <span className="text-slate-500 font-mono">{note.sessionDate || note.date}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {note.summary || note.sessionSummary}
                  </p>
                  {note.plainLanguageProgress && (
                    <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      <strong>Progress Notes:</strong> {note.plainLanguageProgress}
                    </p>
                  )}
                </div>

                {/* Positive Highlights & Skills Practiced */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {note.positiveHighlights && note.positiveHighlights.length > 0 && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Session Highlights</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                        {note.positiveHighlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {note.homePracticeSuggestions && note.homePracticeSuggestions.length > 0 && (
                    <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Home Practice Tips</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                        {note.homePracticeSuggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Session Feedback Input */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mt-3">
                  <div className="text-[11px] font-bold text-slate-300 mb-2">How was your session with {note.practitionerName || client?.primaryPractitionerName || 'your worker'}?</div>
                  {feedbacks[note.id]?.submitted ? (
                     <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Feedback submitted. Thank you!
                     </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setFeedbacks(prev => ({ ...prev, [note.id]: { ...prev[note.id], rating: star } }))}
                            className={`p-1 rounded ${feedbacks[note.id]?.rating >= star ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400/50'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Add a comment (optional)..." 
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-teal-500"
                          value={feedbacks[note.id]?.comment || ''}
                          onChange={(e) => setFeedbacks(prev => ({ ...prev, [note.id]: { ...prev[note.id], comment: e.target.value } }))}
                        />
                        <button 
                          disabled={!feedbacks[note.id]?.rating}
                          onClick={() => handleRatingSubmit(note.id)}
                          className="px-3 py-1.5 bg-teal-600 disabled:opacity-50 hover:bg-teal-500 text-white rounded text-[11px] font-bold transition-all"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-900">
                  <span>Practitioner: {note.practitionerName || client?.primaryPractitionerName || 'Marcus Vance'}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" /> Verified by Practice Management
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submitted Incidents (Participant & Carer View) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Submitted Incidents & Support Follow-ups
            </h3>
          </div>
          <span className="text-xs bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800">
            {clientIncidents.length} Records Logged
          </span>
        </div>

        <div className="space-y-3">
          {clientIncidents.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">
              No incidents recorded for this participant.
            </p>
          ) : (
            clientIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">{inc.type}</span>
                  <span className="text-slate-500 font-mono">{inc.date}</span>
                </div>
                <p className="text-slate-300">{inc.description}</p>
                <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 space-y-1">
                  <span className="font-bold text-teal-300">Action Taken & Support:</span>
                  <p>{inc.actionTaken}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Chatbot Modal */}
      <ParticipantChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        client={client}
        appointments={clientAppointments}
        isModal={true}
      />
    </div>
  );
};
