import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { FHIRInteroperabilityGateway, FHIRResourceBundle } from '../../lib/fhirInteroperabilityGateway';
import {
  Network,
  Download,
  CheckCircle2,
  FileCode2,
  Share2,
  Globe,
  Database
} from 'lucide-react';

export const FHIRGatewayModule: React.FC = () => {
  const { clients, caseNotes, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant', goals: [] };
  const participantGoals = selectedClient.goals || [];
  const participantNotes = caseNotes.filter((n) => n.clientId === selectedClient.id);

  const fhirBundle: FHIRResourceBundle = FHIRInteroperabilityGateway.exportToFHIRBundle(
    selectedClient as any,
    participantGoals,
    participantNotes
  );

  const handleExportFHIR = () => {
    addNotification({
      title: 'HL7 FHIR R4 Bundle Exported',
      message: `Exported ${fhirBundle.total} FHIR resources for My Health Record / GP EMR integration.`,
      type: 'general',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              HL7 FHIR R4 Australian Healthcare Interoperability Gateway
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                My Health Record
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Standardized FHIR R4 bundle generation for GP Electronic Medical Records and Medicare interoperability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportFHIR}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-cyan-900/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Export FHIR JSON
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Generated HL7 FHIR Bundle Schema</span>
          <span className="text-xs text-cyan-400 font-mono">Resource Count: {fhirBundle.total}</span>
        </div>
        <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60 border border-slate-800">
          {JSON.stringify(fhirBundle, null, 2)}
        </pre>
      </div>
    </div>
  );
};
