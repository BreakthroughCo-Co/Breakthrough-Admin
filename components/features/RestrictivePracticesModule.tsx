'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { RestrictivePractice, Client } from '@/types';
import {
  Lock,
  Plus,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Calendar,
  X,
  Send
} from 'lucide-react';

export const RestrictivePracticesModule: React.FC = () => {
  const { restrictivePractices, clients, addRestrictivePractice } = useManagementStore();
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [isAdding, setIsAdding] = useState(false);

  const [type, setType] = useState<RestrictivePractice['practiceType']>('Environmental');
  const [description, setDescription] = useState('');
  const [authBody, setAuthBody] = useState('VIC Senior Practitioner');
  const [refNum, setRefNum] = useState('');

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  const handleAddPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj) return;

    addRestrictivePractice({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      practiceType: type,
      description: description || 'Authorised environmental barrier.',
      status: 'Authorized',
      authorizationBody: authBody,
      authorizationReference: refNum || `RPR-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      reductionPlanSummary: 'Fading plan monitored by lead practitioner.',
      monthlyReportStatus: 'Submitted',
    });

    setIsAdding(false);
    setDescription('');
    setRefNum('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Restrictive Practices Register</h2>
            <p className="text-xs text-slate-400">
              State Senior Practitioner authorization tracking, reduction plans, and monthly portal reporting.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Restrictive Practice</span>
        </button>
      </div>

      {/* Practice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restrictivePractices.map((practice: RestrictivePractice) => (
          <div key={practice.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono px-2 py-0.5 rounded font-bold border border-amber-500/20 uppercase tracking-wider">
                  {practice.practiceType} Restrictive Practice
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{practice.clientName}</h3>
              </div>

              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {practice.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              {practice.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Auth Body</span>
                <span className="text-slate-200 font-semibold">{practice.authorizationBody}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Reference #</span>
                <span className="text-teal-400 font-bold">{practice.authorizationReference}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">
                Expiry: <span className="text-white font-mono">{practice.expiryDate}</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Monthly Log: {practice.monthlyReportStatus}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Register Restrictive Practice
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPractice} className="space-y-3 text-xs">
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
                <label className="block text-slate-400 mb-1">Practice Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-bold"
                >
                  <option value="Environmental">Environmental Restrictive Practice</option>
                  <option value="Chemical">Chemical Restrictive Practice</option>
                  <option value="Mechanical">Mechanical Restrictive Practice</option>
                  <option value="Physical">Physical Restrictive Practice</option>
                  <option value="Seclusion">Seclusion Restrictive Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorization Reference Number</label>
                <input
                  type="text"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                  placeholder="e.g. RPR-2026-VIC-9912"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Practice Description & Purpose</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exact physical barrier, chemical agent, or environmental lock..."
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Register Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
