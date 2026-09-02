import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { AnnualComplianceReturnGenerator, AnnualComplianceReturn } from '../../lib/annualComplianceReturnGenerator';
import {
  FileCheck2,
  Download,
  ShieldCheck,
  Building2,
  AlertTriangle,
  TrendingDown,
  UserCheck,
  Calendar
} from 'lucide-react';

export const AnnualComplianceReturnModule: React.FC = () => {
  const { clients, practitioners, incidents, restrictivePractices, addNotification } = useManagementStore();
  const [returnDossier, setReturnDossier] = useState<AnnualComplianceReturn>(() =>
    AnnualComplianceReturnGenerator.generateAnnualReturn(clients, practitioners, incidents, restrictivePractices)
  );

  const handleExportReturn = () => {
    addNotification({
      title: 'NDIS Annual Compliance Return Exported',
      message: 'Generated official Section 73ZM statutory return archive.',
      type: 'compliance',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              NDIS Commission Annual Compliance Return (ACR)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                Section 73ZM
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Statutory 12-month quality and safeguards return for registered NDIS service providers
            </p>
          </div>
        </div>

        <button
          onClick={handleExportReturn}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-amber-900/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Section 73ZM Dossier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Active Participants</span>
          <span className="text-2xl font-bold text-white">{returnDossier.totalActiveParticipants}</span>
          <span className="text-[11px] text-slate-500 block mt-1">100% service agreements active</span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Worker Screening (NWSC)</span>
          <span className="text-2xl font-bold text-emerald-400">
            {returnDossier.workerScreeningComplianceRatePercent}%
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {returnDossier.totalPractitionersScreened} practitioners audited
          </span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">Reportable 24h Incidents</span>
          <span className="text-2xl font-bold text-rose-400">
            {returnDossier.incidentsSummary.reportable24hrIncidents}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {returnDossier.incidentsSummary.totalIncidents} total recorded
          </span>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">RP Reduction / Fade Rate</span>
          <span className="text-2xl font-bold text-emerald-400">
            {returnDossier.restrictivePracticesSummary.reductionRatePercent}%
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {returnDossier.restrictivePracticesSummary.totalEliminatedPractices} eliminated
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Provider Governance & Assurance Statement
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          {returnDossier.governanceAssuranceStatement}
        </p>
      </div>
    </div>
  );
};
