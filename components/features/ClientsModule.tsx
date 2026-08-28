'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client } from '@/types';
import { GoalTrackingFeature } from './GoalTrackingFeature';
import { GoalTracker } from '@/components/GoalTracker';
import { NDISGoalTracker } from './NDISGoalTracker';
import { ClientPortalModal } from './ClientPortalModal';
import { ParticipantOnboardingWizard } from './ParticipantOnboardingWizard';
import { DatabaseManagerModal } from './DatabaseManagerModal';
import { NDISActivityFeed } from './NDISActivityFeed';
import { ClientDashboardWidget } from './ClientDashboardWidget';
import { computeClientRiskAssessment } from '@/lib/ai-assistant';
import { RiskAssessment } from '@/types';
import {
  Users,
  Search,
  Plus,
  Shield,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  BrainCircuit,
  Share2,
  MapPin,
  Video,
  Phone,
  UserCheck,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  Database,
  Upload,
  Layers,
  Trash2,
  Info
} from 'lucide-react';

export const ClientsModule: React.FC = () => {
  const {
    clients,
    incidents,
    restrictivePractices,
    caseNotes,
    billingClaims,
    crmTasks,
    addClient,
    deleteClient,
    currentUser,
    setActiveTab,
    selectedClientId,
    setSelectedClientId,
    isUsingMockData,
    addNotification
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [isIntakeWizardOpen, setIsIntakeWizardOpen] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [isRiskRationaleOpen, setIsRiskRationaleOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
    if (selectedClientId) {
      const match = clients.find(c => c.id === selectedClientId);
      if (match) return match;
    }
    return clients[0] || null;
  });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  // Compute live risk assessment for all clients
  const clientRiskMap = useMemo(() => {
    const map: Record<string, RiskAssessment> = {};
    clients.forEach((c) => {
      map[c.id] = computeClientRiskAssessment(
        c,
        incidents,
        restrictivePractices,
        caseNotes,
        [],
        billingClaims
      );
    });
    return map;
  }, [clients, incidents, restrictivePractices, caseNotes, billingClaims]);

  // Compute live risk assessment for selected client
  const selectedClientRiskAssessment = useMemo(() => {
    if (!selectedClient) return null;
    return clientRiskMap[selectedClient.id] || computeClientRiskAssessment(
      selectedClient,
      incidents,
      restrictivePractices,
      caseNotes,
      [],
      billingClaims
    );
  }, [selectedClient, clientRiskMap, incidents, restrictivePractices, caseNotes, billingClaims]);

  // Sync when selectedClientId or clients changes
  useEffect(() => {
    if (selectedClientId) {
      const match = clients.find(c => c.id === selectedClientId);
      if (match) {
        setSelectedClient(match);
        return;
      }
    }
    if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    } else if (clients.length === 0) {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients, selectedClient]);

  // Computed Quick Snapshot metrics across active clients
  const snapshotData = useMemo(() => {
    const totalActiveFunding = clients.reduce((sum, c) => sum + (c.totalBudget || 0), 0);
    const totalSpentFunding = clients.reduce((sum, c) => sum + (c.spentBudget || 0), 0);
    const totalAllocatedFunding = clients.reduce((sum, c) => sum + (c.allocatedBudget || 0), 0);
    const overallUtilization = totalActiveFunding > 0 ? (totalSpentFunding / totalActiveFunding) * 100 : 0;
    const remainingActiveFunding = Math.max(0, totalActiveFunding - totalSpentFunding);

    // Find participant with the earliest upcoming review date
    const today = new Date();
    const sortedByReview = [...clients]
      .filter(c => c.planEndDate)
      .sort((a, b) => new Date(a.planEndDate).getTime() - new Date(b.planEndDate).getTime());

    const nextUpcomingClient = sortedByReview[0];
    let daysToNextReview: number | null = null;
    if (nextUpcomingClient?.planEndDate) {
      const diffTime = new Date(nextUpcomingClient.planEndDate).getTime() - today.getTime();
      daysToNextReview = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const highRiskCount = clients.filter(c => c.riskLevel === 'High').length;
    const restrictiveCount = clients.filter(c => c.restrictivePracticesActive).length;

    return {
      totalActiveFunding,
      totalSpentFunding,
      totalAllocatedFunding,
      overallUtilization,
      remainingActiveFunding,
      nextUpcomingClient,
      daysToNextReview,
      highRiskCount,
      restrictiveCount,
      activeClientsCount: clients.length,
    };
  }, [clients]);

  // Selected client's specific review countdown
  const selectedClientReviewDays = useMemo(() => {
    if (!selectedClient?.planEndDate) return null;
    const diff = new Date(selectedClient.planEndDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [selectedClient]);

  const handleGenerateSummary = async () => {
    if (!selectedClient) return;
    setIsGeneratingSummary(true);
    setAiSummary(null);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a concise, NDIS-compliant clinical progress summary for participant ${selectedClient.name} (NDIS: ${selectedClient.ndisNumber}, Disability: ${selectedClient.primaryDisability}). Synthesize hypothetical recent case notes and behavior reports into a 3-paragraph summary covering: 1. Current Status 2. Progress towards goals 3. Recommendations.`,
          model: 'gemini-3.1-pro-preview'
        }),
      });
      const data = await response.json();
      setAiSummary(data.text);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate AI Summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  const [isAddingClient, setIsAddingClient] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    ndisNumber: '',
    dateOfBirth: '',
    primaryDisability: '',
    totalBudget: 35000,
    primaryPractitionerName: 'Marcus Vance',
    primaryPractitionerId: 'prac-2',
    riskLevel: 'Medium' as Client['riskLevel'],
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: '',
  });

  const filteredClients = clients.filter(
    (c: Client) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ndisNumber.includes(searchTerm) ||
      c.primaryDisability.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.ndisNumber) return;

    addClient({
      name: newClient.name,
      ndisNumber: newClient.ndisNumber,
      dateOfBirth: newClient.dateOfBirth || '2000-01-01',
      status: 'Active',
      primaryDisability: newClient.primaryDisability || 'Autism Spectrum Disorder',
      secondaryDisabilities: [],
      goals: [
        {
          id: 'g-new-1',
          title: 'Develop emotion regulation strategies in high-arousal environments',
          category: 'Capacity Building',
          targetDate: '2026-12-31',
          progressPercent: 20,
          status: 'In Progress',
        },
      ],
      planStartDate: new Date().toISOString().slice(0, 10),
      planEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      totalBudget: Number(newClient.totalBudget),
      allocatedBudget: Number(newClient.totalBudget) * 0.8,
      spentBudget: 0,
      primaryPractitionerId: newClient.primaryPractitionerId,
      primaryPractitionerName: newClient.primaryPractitionerName,
      riskLevel: newClient.riskLevel,
      emergencyContact: {
        name: newClient.emergencyName || 'Primary Carer',
        relationship: newClient.emergencyRel || 'Family',
        phone: newClient.emergencyPhone || '0400 000 000',
      },
      restrictivePracticesActive: false,
    });

    setIsAddingClient(false);
    setNewClient({
      name: '',
      ndisNumber: '',
      dateOfBirth: '',
      primaryDisability: '',
      totalBudget: 35000,
      primaryPractitionerName: 'Marcus Vance',
      primaryPractitionerId: 'prac-2',
      riskLevel: 'Medium',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRel: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">NDIS Participants & Profiles</h2>
              {isUsingMockData ? (
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-medium">
                  Sample Mock Data
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-medium">
                  Live Participant Database
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Manage participant records, NDIS plans, goals, and capacity building allocations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsDatabaseManagerOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg flex items-center gap-2 transition-all border border-slate-700 shadow-sm"
              title="Wipe demo data, import CSV/JSON roster, or export database"
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>Database & Mock Data Manager</span>
            </button>
          )}

          {!isViewer && (
            <>
              <button
                onClick={() => setIsIntakeWizardOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Guided Intake Wizard</span>
              </button>

              <button
                onClick={() => setIsAddingClient(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-all border border-slate-700"
                title="Quick add participant"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Snapshot Summary Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Practice & Participant Quick Snapshot
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {snapshotData.activeClientsCount} Active NDIS Participants Managed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Active Funding Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Active Funding</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl font-black text-white">
                ${snapshotData.totalActiveFunding.toLocaleString()} <span className="text-xs text-emerald-400 font-normal">AUD</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Spent: ${snapshotData.totalSpentFunding.toLocaleString()}</span>
                <span className="text-emerald-400 font-semibold">{snapshotData.overallUtilization.toFixed(1)}%</span>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, snapshotData.overallUtilization)}%` }}
              />
            </div>

            {selectedClient && (
              <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="truncate max-w-[120px]">{selectedClient.name}:</span>
                <span className="text-slate-200 font-mono font-bold">
                  ${selectedClient.spentBudget.toLocaleString()} / ${selectedClient.totalBudget.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* 2. Next Scheduled Review Date Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Next Scheduled Review</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-lg font-black text-white font-mono">
                {snapshotData.nextUpcomingClient?.planEndDate || '2026-09-30'}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    (snapshotData.daysToNextReview ?? 99) < 60
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  }`}
                >
                  {snapshotData.daysToNextReview !== null
                    ? `${snapshotData.daysToNextReview} Days Remaining`
                    : 'Upcoming'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  ({snapshotData.nextUpcomingClient?.name.split(' ')[0]})
                </span>
              </div>
            </div>

            {selectedClient && (
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Selected Plan Term:</span>
                <span className="text-amber-300 font-mono font-bold">
                  {selectedClient.planEndDate}
                </span>
              </div>
            )}
          </div>

          {/* 3. Primary Support Contact Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Primary Support Contacts</span>
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Lead Specialist:</span>
                <span className="text-white font-bold text-[11px] truncate max-w-[130px]">
                  {selectedClient?.primaryPractitionerName || 'Dr. Sarah Jenkins'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">Primary Nominee:</span>
                <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[130px]">
                  {selectedClient?.emergencyContact.name || 'Karen Miller'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{selectedClient?.emergencyContact.relationship || 'Mother & Nominee'}:</span>
                <a
                  href={`tel:${selectedClient?.emergencyContact.phone || '0412 345 678'}`}
                  className="text-teal-400 font-mono font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-2.5 h-2.5" />
                  <span>{selectedClient?.emergencyContact.phone || '0412 345 678'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* 4. Active Safeguards & Clinical Caseload Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Caseload & Safeguards</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-base font-black text-white">{snapshotData.activeClientsCount}</div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">Active</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <div className="text-base font-black text-rose-400">{snapshotData.highRiskCount}</div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">High Risk</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Restrictive Authorizations:</span>
              <span className="text-amber-400 font-bold font-mono">
                {snapshotData.restrictiveCount} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participant List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, NDIS #, or disability..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-2">
            {filteredClients.map((client: Client) => {
              const isSelected = selectedClient?.id === client.id;
              const clientRisk = clientRiskMap[client.id] || { riskLevel: client.riskLevel, score: 25 };
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-500 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{client.name}</span>
                    <span className="text-[10px] bg-slate-950 text-teal-400 font-mono px-1.5 py-0.5 rounded border border-slate-800">
                      #{client.ndisNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{client.primaryDisability}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                      clientRisk.riskLevel === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-mono'
                        : clientRisk.riskLevel === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono'
                        : clientRisk.riskLevel === 'Medium'
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/20 font-mono'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-mono'
                    }`}>
                      {clientRisk.riskLevel} ({clientRisk.score})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Participant Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Dashboard Widget */}
              <ClientDashboardWidget client={selectedClient} tasks={crmTasks || []} />

              {/* Persistent Key Vitals Summary Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-teal-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-sm">
                      {selectedClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-white">{selectedClient.name}</h3>
                        <span className="text-[11px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono border border-teal-500/20 font-bold">
                          NDIS #{selectedClient.ndisNumber}
                        </span>
                        <button
                          onClick={() => setIsRiskRationaleOpen(true)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 transition-all hover:scale-105 ${
                            selectedClientRiskAssessment?.riskLevel === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm animate-pulse'
                              : selectedClientRiskAssessment?.riskLevel === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : selectedClientRiskAssessment?.riskLevel === 'Medium'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                          title="Click to view AI 5-Factor Risk Rationale Breakdown"
                        >
                          <Shield className="w-3 h-3" />
                          <span>{selectedClientRiskAssessment?.riskLevel || selectedClient.riskLevel} Risk ({selectedClientRiskAssessment?.score || 25}/100)</span>
                          <Info className="w-3 h-3 opacity-70" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedClient.primaryDisability} • {selectedClient.planManagementType || 'Plan-Managed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('google-maps')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all border border-slate-700"
                      title="Google Maps Location & Route"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span className="hidden sm:inline">Maps</span>
                    </button>
                    <button
                      onClick={() => setIsClientPortalOpen(true)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Portal</span>
                    </button>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-indigo-500/30 transition-all disabled:opacity-50"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>{isGeneratingSummary ? 'Synthesizing...' : 'AI Summary'}</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete participant ${selectedClient.name}?`)) {
                            const idToDelete = selectedClient.id;
                            deleteClient(idToDelete);
                            setSelectedClient(null);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white font-bold text-xs rounded-lg flex items-center gap-1.5 border border-rose-500/30 transition-all"
                        title="Delete Participant (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Critical Risk Emergency Banner if applicable */}
                {selectedClientRiskAssessment?.riskLevel === 'Critical' && (
                  <div className="mt-3 bg-rose-950/60 border border-rose-500/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                      <div>
                        <span className="font-bold text-rose-200 block">CRITICAL SAFETY ALERT TRIGGERED</span>
                        <p className="text-[11px] text-rose-300/90 leading-snug">{selectedClientRiskAssessment.rationale}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addNotification({
                          title: `Director Alert: ${selectedClient.name}`,
                          message: `Mandatory Director notification triggered for Critical Risk participant ${selectedClient.name}.`,
                          type: 'incident',
                          severity: 'high'
                        });
                        alert(`Practice Director and Clinical Lead notified for Critical Risk participant ${selectedClient.name}.`);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md shrink-0 whitespace-nowrap self-start sm:self-auto transition-all"
                    >
                      Notify Practice Director
                    </button>
                  </div>
                )}

                {/* 3 Key Vitals Highlight Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {/* Vital 1: NDIS Plan End Date */}
                  <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        NDIS Plan End Date
                      </span>
                      {selectedClientReviewDays !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          selectedClientReviewDays < 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {selectedClientReviewDays}d left
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-white font-mono">
                      {selectedClient.planEndDate || '2027-02-28'}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Term: {selectedClient.planStartDate} to {selectedClient.planEndDate}
                    </p>
                  </div>

                  {/* Vital 2: Current Funding Balance */}
                  <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Current Funding Balance
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {((selectedClient.spentBudget / (selectedClient.totalBudget || 1)) * 100).toFixed(0)}% Used
                      </span>
                    </div>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      ${Math.max(0, (selectedClient.totalBudget || 0) - (selectedClient.spentBudget || 0)).toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal ml-1">remaining</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Spent: ${selectedClient.spentBudget.toLocaleString()}</span>
                      <span>Total: ${selectedClient.totalBudget.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Vital 3: Primary Support Coordinator / Practitioner */}
                  <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-semibold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                        Primary Support Coordinator
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {selectedClient.supportCoordinator?.name || selectedClient.primaryPractitionerName || 'Dr. Sarah Jenkins'}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 truncate max-w-[100px]">
                        {selectedClient.supportCoordinator?.agency || 'Breakthrough Consulting'}
                      </span>
                      <a
                        href={`tel:${selectedClient.supportCoordinator?.phone || selectedClient.emergencyContact.phone || '0412 345 678'}`}
                        className="text-teal-400 font-mono font-bold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>{selectedClient.supportCoordinator?.phone || selectedClient.emergencyContact.phone || '0412 345 678'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* AI Summary Box if Generated */}
                {aiSummary && (
                  <div className="mt-4 p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold">
                      <BrainCircuit className="w-4 h-4 text-indigo-400" />
                      AI Synthesized Clinical Progress Update
                    </div>
                    <div className="text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap text-[11px]">
                      {aiSummary}
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological NDIS Activity & Delivery Feed */}
              <NDISActivityFeed client={selectedClient} />

              {/* NDIS Goal Tracker with Bar Chart & Clinical Note Linking */}
              <NDISGoalTracker initialClientId={selectedClient.id} />
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-white">Your NDIS Participant Database is Ready</h3>
                <p className="text-xs text-slate-400">
                  Begin adding your genuine participants using the questionnaire wizard, or import your existing participant roster spreadsheet.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {!isViewer && (
                  <button
                    onClick={() => setIsIntakeWizardOpen(true)}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Intake Questionnaire Wizard</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setIsDatabaseManagerOpen(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>Import Roster (CSV)</span>
                  </button>
                )}
                {isViewer && (
                  <p className="text-xs text-slate-500 italic">
                    Read-only view. Adding participants requires practitioner or administrator privileges.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-Step Guided Questionnaire Intake Wizard */}
      <ParticipantOnboardingWizard
        isOpen={isIntakeWizardOpen}
        onClose={() => setIsIntakeWizardOpen(false)}
        onClientCreated={(created) => setSelectedClient(created)}
      />

      {/* Database Management & Mock Data Clear Modal */}
      <DatabaseManagerModal
        isOpen={isDatabaseManagerOpen}
        onClose={() => setIsDatabaseManagerOpen(false)}
        onOpenIntakeWizard={() => setIsIntakeWizardOpen(true)}
      />

      {/* New Participant Modal */}
      {isAddingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New NDIS Participant</h3>
              <button onClick={() => setIsAddingClient(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Participant Full Name</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. Jordan Miller"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NDIS Number</label>
                  <input
                    type="text"
                    required
                    value={newClient.ndisNumber}
                    onChange={(e) => setNewClient({ ...newClient, ndisNumber: e.target.value })}
                    placeholder="430891204"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Total NDIS Budget ($)</label>
                  <input
                    type="number"
                    value={newClient.totalBudget}
                    onChange={(e) => setNewClient({ ...newClient, totalBudget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Primary Disability</label>
                <input
                  type="text"
                  value={newClient.primaryDisability}
                  onChange={(e) => setNewClient({ ...newClient, primaryDisability: e.target.value })}
                  placeholder="Autism Spectrum Disorder (Level 3)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingClient(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure Client Portal & Family Share Modal */}
      <ClientPortalModal
        client={selectedClient}
        isOpen={isClientPortalOpen}
        onClose={() => setIsClientPortalOpen(false)}
      />

      {/* AI Risk Assessment Rationale & Safety Breakdown Modal */}
      {isRiskRationaleOpen && selectedClient && selectedClientRiskAssessment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Risk Assessment & Safety Rationale</h3>
                  <p className="text-xs text-slate-400">Participant: {selectedClient.name} (NDIS #{selectedClient.ndisNumber})</p>
                </div>
              </div>
              <button onClick={() => setIsRiskRationaleOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Computed Risk Score</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedClientRiskAssessment.riskLevel === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : selectedClientRiskAssessment.riskLevel === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : selectedClientRiskAssessment.riskLevel === 'Medium'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {selectedClientRiskAssessment.riskLevel} Level ({selectedClientRiskAssessment.score}/100)
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Clinical Safety Rationale</span>
                <p className="text-slate-200 leading-relaxed text-[11px] bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  {selectedClientRiskAssessment.rationale}
                </p>
              </div>

              {selectedClientRiskAssessment.factorScores && (
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">5-Factor Risk Weighting Breakdown</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                      <span className="text-slate-400">Incident Frequency & Severity:</span>
                      <span className="font-bold text-white font-mono ml-1">{selectedClientRiskAssessment.factorScores.incidentRisk} / 35</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                      <span className="text-slate-400">Restrictive Practices:</span>
                      <span className="font-bold text-white font-mono ml-1">{selectedClientRiskAssessment.factorScores.restrictiveRisk} / 25</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                      <span className="text-slate-400">Budget Depletion Velocity:</span>
                      <span className="font-bold text-white font-mono ml-1">{selectedClientRiskAssessment.factorScores.budgetVelocityRisk} / 15</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/80">
                      <span className="text-slate-400">Engagement & Appointments:</span>
                      <span className="font-bold text-white font-mono ml-1">{selectedClientRiskAssessment.factorScores.engagementRisk} / 15</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800/80 sm:col-span-2">
                      <span className="text-slate-400">Clinical Case Note Severity:</span>
                      <span className="font-bold text-white font-mono ml-1">{selectedClientRiskAssessment.factorScores.clinicalNotesRisk} / 10</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedClientRiskAssessment.triggeredAlerts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Triggered Safety Alerts ({selectedClientRiskAssessment.triggeredAlerts.length})</span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {selectedClientRiskAssessment.triggeredAlerts.map((alertText, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{alertText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Last computed: {new Date(selectedClientRiskAssessment.calculatedAt).toLocaleTimeString()}
              </span>
              <button
                onClick={() => setIsRiskRationaleOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs"
              >
                Close Rationale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
