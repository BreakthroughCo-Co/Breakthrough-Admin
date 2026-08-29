'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, CaseNote, Incident, ScheduledShift, PlainLanguageSessionNote } from '@/types';
import { ParticipantChatbot } from '@/components/features/ParticipantChatbot';
import { redactCaseNote, batchRedactNotes, getParticipantReadableIncidents } from '@/lib/clinicalRedactor';
import {
  User, Calendar as CalendarIcon, DollarSign, Target, FileText, MessageSquare, ShieldCheck,
  CheckCircle2, AlertTriangle, HeartHandshake, ChevronRight, Lightbulb, CheckSquare, Send, Star, FileDown,
  ChevronLeft, Printer, BookOpen, Search, Download, HelpCircle, TrendingUp, Award, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { ParticipantGoalReportModal } from '@/components/features/ParticipantGoalReportModal';

// Lightweight SVG Radial Progress Visualization for NDIS Goals
const GoalRadialProgress: React.FC<{
  percent: number;
  size?: number;
  strokeWidth?: number;
  status?: string;
}> = ({ percent, size = 52, strokeWidth = 5, status }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  const color = safePercent >= 90
    ? '#10b981' // emerald-500
    : safePercent >= 60
    ? '#14b8a6' // teal-500
    : safePercent >= 35
    ? '#3b82f6' // blue-500
    : '#f59e0b'; // amber-500

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800/80 print:text-slate-200"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-black font-mono leading-none text-white print:text-slate-900">
          {safePercent}%
        </span>
      </div>
    </div>
  );
};

export const ParticipantPortalView: React.FC = () => {
  const { clients, caseNotes, incidents, scheduledShifts, currentUser, addNotification, addCRMTask } = useManagementStore();

  const isParticipantUser = currentUser?.role === 'PARTICIPANT';
  const participantTargetId = currentUser?.participantId || currentUser?.linkedClientId || (isParticipantUser ? currentUser?.id : null);

  const [selectedClientId, setSelectedClientId] = useState<string>(
    participantTargetId || clients[0]?.id || 'cli-101'
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGoalReportModalOpen, setIsGoalReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'coordinator-chat'>('overview');

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

  // Dummy rating trend data
  const ratingTrendData = [
    { month: 'Mar', rating: 4.2 },
    { month: 'Apr', rating: 4.5 },
    { month: 'May', rating: 4.3 },
    { month: 'Jun', rating: 4.8 },
    { month: 'Jul', rating: 4.7 },
    { month: 'Aug', rating: 4.9 },
  ];

  const exportPdf = () => {
    window.print();
  };

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string}[]>([
    { sender: 'coordinator', text: `Hi ${client?.name || 'there'}, I'm your support coordinator. How can I help you today?` }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: 'me', text: chatMessage }]);
    setChatMessage('');
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'coordinator', text: 'Thanks for your message. I will check on that and get back to you shortly.' }]);
    }, 1500);
  };

  // FAQ Search
  const [faqSearch, setFaqSearch] = useState('');
  const faqs = [
    { q: 'How do I review my NDIS Plan?', a: 'Your plan review dates are listed in the summary card. We will contact you 3 months prior to start preparations.' },
    { q: 'What happens if I need to cancel a session?', a: 'Please provide at least 24 hours notice to avoid cancellation fees. You can message your coordinator here.' },
    { q: 'How does invoicing work?', a: 'Invoices are automatically sent to your plan manager or processed via the NDIA portal.' }
  ];
  const filteredFaqs = faqs.filter(faq => faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || faq.a.toLowerCase().includes(faqSearch.toLowerCase()));

  // Simulated push notification for appointment updates
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        title: 'Session Confirmed',
        message: 'Your support worker has confirmed your upcoming session on 2026-08-28.',
        type: 'system',
        severity: 'success',
        linkTab: 'overview'
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [addNotification]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:text-black">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden print:bg-white print:border-slate-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 rounded-2xl border border-teal-500/30 shadow-inner print:bg-transparent print:border-none print:text-teal-700">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white print:text-slate-900">{client?.name || 'Participant Portal'}</h2>
                <span className="text-xs bg-teal-500/10 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-500/20 font-mono font-bold print:border-slate-300 print:text-slate-700">
                  NDIS #{client?.ndisNumber || '430891245'}
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold print:hidden">
                  {isParticipantUser ? 'Authenticated Participant' : 'Practice Preview Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Your secure participant & carer portal for session schedules, goal progress, and NDIS plan utilization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
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
              onClick={() => setIsGoalReportModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>NDIS Goal Progress (PDF)</span>
            </button>

            <button
              onClick={exportPdf}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export Portal Summary</span>
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 print:hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-bold ${activeTab === 'overview' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Portal Overview
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 text-sm font-bold ${activeTab === 'resources' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Resource Library & FAQs
        </button>
        <button
          onClick={() => setActiveTab('coordinator-chat')}
          className={`px-4 py-2 text-sm font-bold ${activeTab === 'coordinator-chat' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Coordinator Chat
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md print:bg-white print:border-slate-300 print:text-black">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 print:text-slate-900">
              <BookOpen className="w-4 h-4 text-teal-400" /> Key NDIS Plan Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:bg-transparent print:border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Plan Start</span>
                <span className="font-mono font-bold text-slate-200 print:text-slate-800">{client?.planStartDate || '2026-01-01'}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:bg-transparent print:border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Plan End</span>
                <span className="font-mono font-bold text-slate-200 print:text-slate-800">{client?.planEndDate || '2026-12-31'}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:bg-transparent print:border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Plan Status</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700">Active</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:bg-transparent print:border-slate-200">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Support Coordinator</span>
                <span className="font-bold text-slate-200 print:text-slate-800">{client?.primaryPractitionerName || 'Marcus Vance'}</span>
              </div>
            </div>
          </div>

          {/* Plan Budget Utilization Card with D3/Recharts Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                  NDIS Plan Budget Utilization
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1 print:bg-transparent print:border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Plan Budget</span>
                  <div className="text-xl font-black text-white font-mono print:text-slate-900">
                    ${totalBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1 print:bg-transparent print:border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Funds Utilized</span>
                  <div className="text-xl font-black text-amber-400 font-mono print:text-amber-700">
                    ${spentBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1 print:bg-transparent print:border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining Balance</span>
                  <div className="text-xl font-black text-emerald-400 font-mono print:text-emerald-700">
                    ${remainingBudget.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="h-32 lg:h-full min-h-[120px] flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full h-full"
                >
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
                </motion.div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar View for Upcoming Appointments */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                    My Schedule
                  </h3>
                </div>
                <div className="flex items-center gap-2 print:hidden">
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
                        className={`h-10 sm:h-12 border ${day ? 'border-slate-800 bg-slate-950/50 print:border-slate-200' : 'border-transparent'} rounded flex flex-col items-center pt-1 relative`}
                      >
                        {day && <span className={`text-[10px] ${hasAppt ? 'text-teal-400 font-bold print:text-teal-700' : 'text-slate-400 print:text-slate-500'}`}>{day}</span>}
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
              
              <div className="space-y-2 pt-2 border-t border-slate-800 print:border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming List</span>
                {clientAppointments.length === 0 && (
                   <div className="text-xs text-slate-500 italic">No upcoming appointments.</div>
                )}
                {clientAppointments.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 flex justify-between items-center print:bg-transparent print:border-slate-200"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-teal-300 print:text-teal-700">{appt.supportType}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 print:text-slate-600">
                        <User className="w-3 h-3" /> {appt.practitionerName || client?.primaryPractitionerName || 'Marcus Vance'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded print:text-slate-800 print:bg-slate-100">
                        {appt.date}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{appt.startTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Goals & Outcomes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md print:bg-white print:border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                      Active Plan Goals & Velocity
                    </h3>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Real-time radial progress metrics aligned with NDIS Plan Outcomes & Review criteria
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg font-mono font-bold border border-emerald-500/20 print:text-emerald-700 print:border-emerald-200">
                    {client?.goals?.length || 3} Active Goals
                  </span>
                  <button
                    onClick={() => setIsGoalReportModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer print:hidden shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Goal Review PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(client?.goals && client.goals.length > 0 ? client.goals : [
                  { id: 'g1', title: 'Community Autonomy & Public Transport Navigation', category: 'Capacity Building', targetDate: '2026-12-31', progressPercent: 85, status: 'In Progress', gasScore: 1 },
                  { id: 'g2', title: 'Emotional Self-Regulation & Calming Strategies', category: 'Social & Community', targetDate: '2026-11-30', progressPercent: 78, status: 'In Progress', gasScore: 0 },
                  { id: 'g3', title: 'Independent Meal Preparation & Kitchen Safety', category: 'Core', targetDate: '2026-10-15', progressPercent: 92, status: 'Achieved', gasScore: 2 }
                ]).map((goal: any, idx: number) => {
                  const progress = goal.progressPercent || goal.progress || 80;
                  const isAchieved = progress >= 90 || goal.status === 'Achieved';

                  return (
                    <div
                      key={goal.id || idx}
                      className="p-4 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:bg-transparent print:border-slate-200"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Radial Progress Visual */}
                        <GoalRadialProgress
                          percent={progress}
                          size={54}
                          strokeWidth={5}
                          status={goal.status}
                        />

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm print:text-slate-900">
                              {goal.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                              {goal.category || 'Capacity Building'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAchieved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                            }`}>
                              {isAchieved ? 'Achieved' : 'In Progress'}
                            </span>
                            {goal.gasScore !== undefined && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                                GAS: {goal.gasScore > 0 ? `+${goal.gasScore}` : goal.gasScore}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 print:text-slate-600">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3 text-slate-500" />
                              Target: {goal.targetDate || '2026-12-31'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-mono font-bold print:text-emerald-700">
                              {progress}% Complete
                            </span>
                          </div>

                          {/* Linear Milestone Pacing Sub-bar */}
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden print:bg-slate-200">
                            <div
                              style={{ width: `${progress}%` }}
                              className={`h-full rounded-full transition-all ${
                                progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-teal-500' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsGoalReportModalOpen(true)}
                        className="self-end sm:self-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer print:hidden flex-shrink-0"
                      >
                        <FileDown className="w-3.5 h-3.5 text-teal-400" />
                        <span>Review PDF</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Trend Chart: Average Session Rating */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md print:hidden">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" /> Support Consistency (6 Month Average Rating)
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 5]} stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px', color: '#fff' }} 
                  />
                  <Line type="monotone" dataKey="rating" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Redacted Plain-Language Case Notes (R14) with Feedback */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-slate-900">
                  Recent Session Progress Updates & Feedback
                </h3>
              </div>
              <span className="text-xs bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 print:bg-transparent print:border-slate-200 print:text-slate-600">
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
                    className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs print:bg-transparent print:border-slate-200"
                  >
                    <div className="flex items-center justify-between text-[11px] border-b border-slate-900 pb-2 print:border-slate-200">
                      <span className="font-bold text-teal-300 print:text-teal-700">{note.serviceType || 'Therapeutic Support'}</span>
                      <span className="text-slate-500 font-mono">{note.sessionDate || note.date}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-slate-200 leading-relaxed font-medium print:text-slate-800">
                        {note.summary || note.sessionSummary}
                      </p>
                      {note.plainLanguageProgress && (
                        <p className="text-slate-300 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 print:bg-slate-100 print:border-slate-200 print:text-slate-700">
                          <strong>Progress Notes:</strong> {note.plainLanguageProgress}
                        </p>
                      )}
                    </div>

                    {/* Positive Highlights & Skills Practiced */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {note.positiveHighlights && note.positiveHighlights.length > 0 && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg space-y-1 print:bg-emerald-50 print:border-emerald-200">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] print:text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Session Highlights</span>
                          </div>
                          <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 print:text-slate-700">
                            {note.positiveHighlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.homePracticeSuggestions && note.homePracticeSuggestions.length > 0 && (
                        <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-lg space-y-1 print:bg-teal-50 print:border-teal-200">
                          <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px] print:text-teal-700">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Home Practice Tips</span>
                          </div>
                          <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 print:text-slate-700">
                            {note.homePracticeSuggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Session Feedback Input */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mt-3 print:hidden">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" /> Resource Library
            </h3>
            <p className="text-xs text-slate-400 mb-4">Download helpful guides and documents provided by your support team.</p>
            <div className="space-y-3">
              {[
                { name: 'Understanding your NDIS Plan', size: '1.2 MB', type: 'PDF' },
                { name: 'Preparing for Plan Review', size: '850 KB', type: 'PDF' },
                { name: 'Incident Reporting Guide for Families', size: '2.1 MB', type: 'PDF' }
              ].map((res, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileDown className="w-8 h-8 text-indigo-400 p-1.5 bg-indigo-500/10 rounded-lg" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{res.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{res.type} • {res.size}</div>
                    </div>
                  </div>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Frequently Asked Questions
            </h3>
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search FAQs..." 
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No FAQs match your search.</p>
              ) : (
                filteredFaqs.map((faq, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-slate-200">{faq.q}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">{faq.a}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileDown className="w-4 h-4 text-indigo-400" /> Request Document Copies
            </h3>
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
        </div>
      )}

      {activeTab === 'coordinator-chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{client?.primaryPractitionerName || 'Marcus Vance'}</h3>
              <p className="text-[10px] text-teal-400 font-bold">Support Coordinator • Online</p>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.sender === 'me' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message to your coordinator..." 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!chatMessage.trim()}
                className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 flex items-center justify-center text-white transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbot Modal */}
      <ParticipantChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        client={client}
        appointments={clientAppointments}
        isModal={true}
      />

      {/* Formal NDIS Goal Progress & Review PDF Export Modal */}
      <ParticipantGoalReportModal
        isOpen={isGoalReportModalOpen}
        onClose={() => setIsGoalReportModalOpen(false)}
        client={client}
        notes={caseNotes}
        appointments={clientAppointments}
      />
    </div>
  );
};
