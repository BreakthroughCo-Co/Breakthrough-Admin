import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { CarerDelegationService, CarerParticipantLink } from '../../lib/carerDelegationService';
import {
  HeartHandshake,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  DollarSign,
  Calendar,
  Key
} from 'lucide-react';

export const CarerFamilyHub: React.FC = () => {
  const { clients, currentUser, setSelectedClientId } = useManagementStore();
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);

  const sampleLinks: CarerParticipantLink[] = clients.map((c, i) => ({
    guardianUserId: currentUser?.id || 'guard-1',
    guardianName: currentUser?.displayName || 'Family Guardian',
    guardianEmail: currentUser?.email || 'guardian@breakthrough.org.au',
    relationship: i === 0 ? 'Parent' : 'Legal Guardian',
    clientId: c.id,
    clientName: c.name,
    ndisNumber: c.ndisNumber || '430000000',
    permissions: {
      canViewCaseNotes: true,
      canViewBudgets: true,
      canSignServiceAgreements: true,
      canScheduleAppointments: true,
    },
    linkedSince: '2025-01-15',
    status: 'Active',
  }));

  const activeLink = sampleLinks[selectedLinkIndex] || sampleLinks[0];

  const handleSwitchParticipant = (index: number) => {
    setSelectedLinkIndex(index);
    if (sampleLinks[index]) {
      setSelectedClientId(sampleLinks[index].clientId);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Carer Delegation & Multi-Participant Family Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                Multi-Dependent RBAC
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Manage multiple family member NDIS plans, therapy appointments, and consent authorizations from a single dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dependent Selector */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Linked Family Members ({sampleLinks.length})
          </span>
          <div className="space-y-2">
            {sampleLinks.map((link, idx) => (
              <button
                key={link.clientId}
                onClick={() => handleSwitchParticipant(idx)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  selectedLinkIndex === idx
                    ? 'bg-pink-950/30 border-pink-500/50 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{link.clientName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                    {link.relationship}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">NDIS: {link.ndisNumber}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Dependent Permissions & Overview */}
        {activeLink && (
          <div className="lg:col-span-2 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{activeLink.clientName}</h3>
                <span className="text-xs text-slate-400">Delegated Guardian: {activeLink.guardianName} ({activeLink.relationship})</span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Delegation
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Authorized Guardian Permissions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-200">
                  <FileText className="w-4 h-4 text-pink-400" />
                  <span>View Clinical Case Notes & SOAP</span>
                </div>
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-200">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>View Plan Budgets & Invoices</span>
                </div>
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-200">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Schedule & Modify Appointments</span>
                </div>
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-200">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Execute Digital Service Agreements</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
