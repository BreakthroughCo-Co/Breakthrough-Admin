'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { Client, CaseNote, Incident, NoteCategory } from '@/types';
import {
  Plus,
  UserPlus,
  FileText,
  AlertTriangle,
  X,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Clock,
  DollarSign,
  UserCheck,
  ChevronRight,
  Send,
  Lock
} from 'lucide-react';

interface QuickActionsFloatingMenuProps {
  onModuleJump?: (tab: TabType) => void;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({ onModuleJump }) => {
  const {
    clients,
    practitioners,
    currentUser,
    addClient,
    addCaseNote,
    addIncident,
    addNotification,
    setActiveTab,
    setSelectedClientId
  } = useManagementStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'CLIENT' | 'CASE_NOTE' | 'INCIDENT' | null>(null);

  // Form State: New Client
  const [clientForm, setClientForm] = useState({
    name: '',
    ndisNumber: '',
    dateOfBirth: '1998-05-14',
    primaryDisability: 'Autism Spectrum Disorder Level 2',
    planManagementType: 'Plan-Managed' as 'NDIA-Managed' | 'Plan-Managed' | 'Self-Managed',
    totalBudget: 45000,
    phone: '0412 345 678',
    riskLevel: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    primaryPractitionerId: practitioners[0]?.id || 'prac-201'
  });

  // Form State: New Case Note
  const [noteForm, setNoteForm] = useState({
    clientId: clients[0]?.id || '',
    format: 'SIMPL' as 'SIMPL' | 'SOAP' | 'BIRP',
    category: 'Specialist Behaviour Intervention Support',
    billableHours: 1.5,
    billableRate: 214.41,
    travelClaimed: false,
    travelKm: 0,
    situation: '',
    intervention: '',
    progress: '',
    plan: '',
    fullText: ''
  });

  // Form State: New Incident
  const [incidentForm, setIncidentForm] = useState({
    clientId: clients[0]?.id || '',
    type: 'Behaviours of Concern (Aggression / Property Damage)',
    severity: 'High' as 'Low' | 'Medium' | 'High' | 'Critical / Reportable',
    isNdisReportable: false,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '14:30',
    location: 'Participant Residence (Supported Independent Living)',
    description: '',
    immediateActionsTaken: '',
    injuriesReported: 'None reported; de-escalation completed safely.'
  });

  const handleOpenModal = (type: 'CLIENT' | 'CASE_NOTE' | 'INCIDENT') => {
    setIsOpen(false);
    setActiveModal(type);
    if (type === 'CASE_NOTE' && clients.length > 0 && !noteForm.clientId) {
      setNoteForm((prev) => ({ ...prev, clientId: clients[0].id }));
    }
    if (type === 'INCIDENT' && clients.length > 0 && !incidentForm.clientId) {
      setIncidentForm((prev) => ({ ...prev, clientId: clients[0].id }));
    }
  };

  // Submit New Client
  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;

    const assignedPrac = practitioners.find((p) => p.id === clientForm.primaryPractitionerId) || practitioners[0];
    const newClient: Client = {
      id: `cli-${Date.now().toString().slice(-5)}`,
      name: clientForm.name.trim(),
      ndisNumber: clientForm.ndisNumber.trim() || `43${Math.floor(1000000 + Math.random() * 9000000)}`,
      dateOfBirth: clientForm.dateOfBirth,
      primaryDisability: clientForm.primaryDisability,
      status: 'Active',
      totalBudget: Number(clientForm.totalBudget) || 45000,
      allocatedBudget: Math.round((Number(clientForm.totalBudget) || 45000) * 0.8),
      spentBudget: 0,
      planStartDate: new Date().toISOString().split('T')[0],
      planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      planManagementType: clientForm.planManagementType,
      riskLevel: clientForm.riskLevel,
      primaryPractitionerId: assignedPrac?.id || 'prac-201',
      primaryPractitionerName: assignedPrac?.name || 'Dr. Sarah Jenkins',
      emergencyContact: {
        name: 'Nominee Contact',
        relationship: 'Primary Carer',
        phone: clientForm.phone || '0400 000 000'
      },
      goals: [
        {
          id: `g-${Date.now()}`,
          title: 'Develop emotion regulation & independent community access routines',
          category: 'Capacity Building - Improved Daily Living',
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progressPercent: 15,
          status: 'In Progress',
          gasScore: 0
        }
      ],
      restrictivePracticesActive: false,
      isCustomUserParticipant: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addClient(newClient);
    addNotification({
      title: 'Participant Enrolled',
      message: `${newClient.name} (NDIS #${newClient.ndisNumber}) was successfully created and assigned to ${assignedPrac?.name}.`,
      type: 'clinical',
      severity: 'low',
      linkTab: 'clients'
    });

    setActiveModal(null);
    setClientForm({
      name: '',
      ndisNumber: '',
      dateOfBirth: '1998-05-14',
      primaryDisability: 'Autism Spectrum Disorder Level 2',
      planManagementType: 'Plan-Managed',
      totalBudget: 45000,
      phone: '0412 345 678',
      riskLevel: 'Medium',
      primaryPractitionerId: practitioners[0]?.id || 'prac-201'
    });
  };

  // Submit New Case Note
  const handleSubmitCaseNote = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = clients.find((c) => c.id === noteForm.clientId) || clients[0];
    if (!targetClient) return;

    let narrative = noteForm.fullText;
    if (!narrative && noteForm.situation) {
      narrative = `[SITUATION]\n${noteForm.situation}\n\n[INTERVENTION]\n${noteForm.intervention}\n\n[PROGRESS / OUTCOME]\n${noteForm.progress}\n\n[PLAN]\n${noteForm.plan}`;
    }

    const sit = noteForm.situation || 'Routine Allied Health Consultation & Behaviour Support';
    const inter = noteForm.intervention || 'Clinical functional strategy implementation and practitioner coaching.';
    const prog = noteForm.progress || 'Participant demonstrated positive engagement with low agitation.';
    const pln = noteForm.plan || 'Continue scheduled weekly therapy and maintain data collection.';

    const newNote: CaseNote = {
      id: `note-${Date.now().toString().slice(-5)}`,
      clientId: targetClient.id,
      clientName: targetClient.name,
      practitionerId: currentUser.practitionerId || 'prac-201',
      practitionerName: currentUser.name || 'Practitioner',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:30',
      sessionDurationMinutes: Math.round(noteForm.billableHours * 60),
      durationMinutes: Math.round(noteForm.billableHours * 60),
      serviceType: noteForm.category,
      supportItemCode: '07_002_0115_8_3',
      format: noteForm.format,
      text: narrative || `Allied health intervention conducted for ${targetClient.name}. Progress noted against primary capacity goals.`,
      situation: sit,
      intervention: inter,
      progress: prog,
      subjective: sit,
      objective: inter,
      assessment: prog,
      plan: pln,
      linkedGoalIds: targetClient.goals?.[0] ? [targetClient.goals[0].id] : [],
      billable: true,
      billedAmount: Number((noteForm.billableHours * noteForm.billableRate).toFixed(2)),
      isVerified: true,
      verifiedBy: currentUser.name || 'Clinical Supervisor',
      status: 'Submitted',
      flaggedForReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addCaseNote(newNote);
    addNotification({
      title: 'Case Note Created',
      message: `Logged ${newNote.format} clinical case note for ${targetClient.name} (${noteForm.billableHours} hrs billable).`,
      type: 'clinical',
      severity: 'low',
      linkTab: 'case-notes'
    });

    setActiveModal(null);
    setNoteForm({
      clientId: clients[0]?.id || '',
      format: 'SIMPL',
      category: 'Specialist Behaviour Intervention Support',
      billableHours: 1.5,
      billableRate: 214.41,
      travelClaimed: false,
      travelKm: 0,
      situation: '',
      intervention: '',
      progress: '',
      plan: '',
      fullText: ''
    });
  };

  // Submit New Incident
  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = clients.find((c) => c.id === incidentForm.clientId) || clients[0];
    if (!targetClient) return;

    const isReportable =
      incidentForm.isNdisReportable ||
      incidentForm.severity === 'Critical / Reportable' ||
      incidentForm.type.includes('Restrictive');

    const newIncident: Incident = {
      id: `inc-${Date.now().toString().slice(-5)}`,
      clientId: targetClient.id,
      clientName: targetClient.name,
      incidentDate: incidentForm.incidentDate,
      incidentTime: incidentForm.incidentTime,
      reportedDate: new Date().toISOString().split('T')[0],
      reportedBy: currentUser.name || 'Marcus Vance',
      reportedByRole: currentUser.role || 'Practitioner',
      type: incidentForm.type,
      severity: incidentForm.severity,
      status: 'Under Investigation',
      description: incidentForm.description || `Clinical incident documented for ${targetClient.name} during support delivery.`,
      immediateActionTaken: incidentForm.immediateActionsTaken || 'Participant supported to safe quiet space. First aid assessed.',
      injuries: incidentForm.injuriesReported,
      isNdisReportable: isReportable,
      ndis24hrNotified: false,
      ndis5daySubmitted: false,
      investigationNotes: 'Initial triage logged via Command Center Quick Action.',
      createdAt: new Date().toISOString()
    };

    addIncident(newIncident);
    setActiveModal(null);
    setIncidentForm({
      clientId: clients[0]?.id || '',
      type: 'Behaviours of Concern (Aggression / Property Damage)',
      severity: 'High',
      isNdisReportable: false,
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: '14:30',
      location: 'Participant Residence (Supported Independent Living)',
      description: '',
      immediateActionsTaken: '',
      injuriesReported: 'None reported; de-escalation completed safely.'
    });
  };

  if (currentUser?.role === 'VIEWER') {
    return null;
  }

  return (
    <>
      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-end gap-2.5 mb-1"
            >
              {/* Option 1: New Participant */}
              <button
                type="button"
                onClick={() => handleOpenModal('CLIENT')}
                className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 rounded-2xl border border-teal-500/30 shadow-2xl transition-all group hover:border-teal-400 hover:scale-105 active:scale-95"
              >
                <div className="text-right">
                  <span className="block text-xs font-black text-white group-hover:text-teal-300">
                    New NDIS Participant
                  </span>
                  <span className="block text-[10px] text-slate-400">Enroll profile & budget</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                  <UserPlus className="w-4 h-4" />
                </div>
              </button>

              {/* Option 2: New Clinical Case Note */}
              <button
                type="button"
                onClick={() => handleOpenModal('CASE_NOTE')}
                className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 rounded-2xl border border-sky-500/30 shadow-2xl transition-all group hover:border-sky-400 hover:scale-105 active:scale-95"
              >
                <div className="text-right">
                  <span className="block text-xs font-black text-white group-hover:text-sky-300">
                    New Clinical Case Note
                  </span>
                  <span className="block text-[10px] text-slate-400">SIMPL / SOAP / BIRP</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
              </button>

              {/* Option 3: New Incident Report */}
              <button
                type="button"
                onClick={() => handleOpenModal('INCIDENT')}
                className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 rounded-2xl border border-rose-500/30 shadow-2xl transition-all group hover:border-rose-400 hover:scale-105 active:scale-95"
              >
                <div className="text-right">
                  <span className="block text-xs font-black text-white group-hover:text-rose-300">
                    New Incident Report
                  </span>
                  <span className="block text-[10px] text-slate-400">NDIS reportable disclosure</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Floating Action Trigger Button */}
        <button
          id="floating-quick-actions-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-3 rounded-2xl font-black text-xs flex items-center gap-2.5 shadow-2xl border transition-all duration-200 ${
            isOpen
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-900/40 rotate-0'
              : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 border-teal-300/40 shadow-teal-900/40 hover:scale-105 active:scale-95'
          }`}
          title="Quick Actions: Create Participant, Note, or Incident (Ctrl+N)"
          aria-label="Quick Actions Speed Dial"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span className="hidden sm:inline font-bold">Close Actions</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Plus className="w-5 h-5 text-slate-950" />
                <span className="w-2 h-2 rounded-full bg-emerald-300 absolute -top-0.5 -right-0.5 animate-ping" />
              </div>
              <span className="font-extrabold tracking-tight">Quick Actions</span>
              <span className="hidden lg:inline text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold">
                Ctrl+N
              </span>
            </>
          )}
        </button>
      </div>

      {/* MODAL 1: Quick Create Participant */}
      {activeModal === 'CLIENT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Quick Enroll NDIS Participant</h3>
                  <p className="text-xs text-slate-400">Add an active participant into clinical practice caseload</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Participant Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">NDIS Participant Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 430198274"
                    value={clientForm.ndisNumber}
                    onChange={(e) => setClientForm({ ...clientForm, ndisNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={clientForm.dateOfBirth}
                    onChange={(e) => setClientForm({ ...clientForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Primary Disability / Diagnosis</label>
                  <input
                    type="text"
                    value={clientForm.primaryDisability}
                    onChange={(e) => setClientForm({ ...clientForm, primaryDisability: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Plan Management</label>
                  <select
                    value={clientForm.planManagementType}
                    onChange={(e) => setClientForm({ ...clientForm, planManagementType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="Plan-Managed">Plan-Managed</option>
                    <option value="NDIA-Managed">NDIA-Managed (Agency)</option>
                    <option value="Self-Managed">Self-Managed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Total NDIS Budget ($)</label>
                  <input
                    type="number"
                    value={clientForm.totalBudget}
                    onChange={(e) => setClientForm({ ...clientForm, totalBudget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Risk Level</label>
                  <select
                    value={clientForm.riskLevel}
                    onChange={(e) => setClientForm({ ...clientForm, riskLevel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Lead Practitioner</label>
                <select
                  value={clientForm.primaryPractitionerId}
                  onChange={(e) => setClientForm({ ...clientForm, primaryPractitionerId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
                >
                  {practitioners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.position} ({p.pbsRegistrationLevel || 'Allied Health'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-black shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll Participant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Create Case Note */}
      {activeModal === 'CASE_NOTE' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Quick Clinical Case Note</h3>
                  <p className="text-xs text-slate-400">Log structured SIMPL / SOAP clinical intervention note</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCaseNote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Select Participant *</label>
                  <select
                    required
                    value={noteForm.clientId}
                    onChange={(e) => setNoteForm({ ...noteForm, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (NDIS: {c.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Clinical Format</label>
                  <select
                    value={noteForm.format}
                    onChange={(e) => setNoteForm({ ...noteForm, format: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-400 focus:outline-none font-bold text-sky-300"
                  >
                    <option value="SIMPL">SIMPL Protocol</option>
                    <option value="SOAP">SOAP Notes</option>
                    <option value="BIRP">BIRP Format</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Billable Hours (Units)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={noteForm.billableHours}
                    onChange={(e) => setNoteForm({ ...noteForm, billableHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Support Item Category</label>
                  <input
                    type="text"
                    value={noteForm.category}
                    onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SIMPL / Clinical Narrative Sections */}
              <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-sky-400 font-bold mb-1 text-[11px]">
                    Situation / Presentation (Baseline status & environment)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe participant presentation, setting, environmental triggers, or emotional state..."
                    value={noteForm.situation}
                    onChange={(e) => setNoteForm({ ...noteForm, situation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-emerald-400 font-bold mb-1 text-[11px]">
                    Intervention / Clinical Action (Strategies delivered)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific clinical techniques, co-regulation, communication boards, or skill training provided..."
                    value={noteForm.intervention}
                    onChange={(e) => setNoteForm({ ...noteForm, intervention: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-amber-400 font-bold mb-1 text-[11px]">
                      Progress / Outcome (Response & GAS milestones)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Demonstrated 80% independent transition"
                      value={noteForm.progress}
                      onChange={(e) => setNoteForm({ ...noteForm, progress: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-teal-400 font-bold mb-1 text-[11px]">
                      Next Steps / Plan (Follow-up scheduled)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Session next Tuesday; review sensory diet"
                      value={noteForm.plan}
                      onChange={(e) => setNoteForm({ ...noteForm, plan: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono">
                  Calculated Claim: ${(noteForm.billableHours * noteForm.billableRate).toFixed(2)} AUD
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl font-black shadow-lg transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Save Case Note</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Create Incident Report */}
      {activeModal === 'INCIDENT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Log Emergency Incident Report</h3>
                  <p className="text-xs text-slate-400">NDIS Quality & Safeguards Commission Compliance Disclosure</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Participant Involved *</label>
                  <select
                    required
                    value={incidentForm.clientId}
                    onChange={(e) => setIncidentForm({ ...incidentForm, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (NDIS: {c.ndisNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Severity Level *</label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-rose-400 focus:border-rose-400 focus:outline-none"
                  >
                    <option value="Critical / Reportable">Critical / Reportable</option>
                    <option value="High">High Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="Low">Low Severity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Incident Category</label>
                  <select
                    value={incidentForm.type}
                    onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                  >
                    <option value="Behaviours of Concern (Aggression / Property Damage)">Behaviours of Concern (Aggression / Damage)</option>
                    <option value="Unauthorised Restrictive Practice">Unauthorised Restrictive Practice</option>
                    <option value="Physical Injury / Medical Attention Required">Physical Injury / Medical Attention</option>
                    <option value="Medication Administration Error">Medication Administration Error</option>
                    <option value="Absconding / Missing Participant">Absconding / Missing Participant</option>
                    <option value="Near Miss / Environmental Hazard">Near Miss / Environmental Hazard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date & Time of Occurrence</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={incidentForm.incidentDate}
                      onChange={(e) => setIncidentForm({ ...incidentForm, incidentDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={incidentForm.incidentTime}
                      onChange={(e) => setIncidentForm({ ...incidentForm, incidentTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* NDIS Commission Reportable Flag Switch */}
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-300 block">Mandatory NDIS Commission 24h Notification</span>
                  <span className="text-[11px] text-rose-400/80">
                    Triggers statutory 24-hour Commission lodgement SLA and 5-Day Root Cause Analysis tracker.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={incidentForm.isNdisReportable || incidentForm.severity === 'Critical / Reportable'}
                  onChange={(e) => setIncidentForm({ ...incidentForm, isNdisReportable: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Description of Incident *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail sequence of events, antecedent, participant actions, environmental context, and staff response..."
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Immediate Actions Taken to Ensure Safety</label>
                <textarea
                  rows={2}
                  placeholder="Immediate de-escalation, separation of parties, first aid, emergency services contacted, senior practitioner notified..."
                  value={incidentForm.immediateActionsTaken}
                  onChange={(e) => setIncidentForm({ ...incidentForm, immediateActionsTaken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl font-black shadow-lg transition-all flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Submit Incident Disclosure</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
