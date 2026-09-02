import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { CrisisEscalationEngine, CrisisEscalationEvent } from '../../lib/crisisEscalationEngine';
import {
  AlertTriangle,
  Radio,
  Send,
  BellRing,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Flame
} from 'lucide-react';

export const CrisisEscalationHub: React.FC = () => {
  const { incidents, addNotification } = useManagementStore();
  const [selectedIncidentId, setSelectedIncidentId] = useState(incidents[0]?.id || '');
  const [lastDispatchedEvent, setLastDispatchedEvent] = useState<CrisisEscalationEvent | null>(null);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const handleDispatch = () => {
    if (!selectedIncident) return;
    const event = CrisisEscalationEngine.dispatchEscalation(selectedIncident);
    setLastDispatchedEvent(event);
    addNotification({
      title: 'Crisis Safeguards Escalation Dispatched',
      message: `Tier 1 escalation broadcasted via SMS, Email, and Push notifications.`,
      type: 'incident',
      severity: 'high',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Multi-Channel Crisis & Safeguards Escalation Dispatcher
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                24-Hour Statutory NDIS Countdown
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Immediate Tier 1 escalation for critical reportable incidents, unauthorized restrictive practices, and emergency SMS alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-rose-500"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.clientName} - {i.category} ({i.severity})
              </option>
            ))}
          </select>

          <button
            onClick={handleDispatch}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-900/30 transition-all"
          >
            <Send className="w-4 h-4" />
            Dispatch Crisis Escalation
          </button>
        </div>
      </div>

      {lastDispatchedEvent && (
        <div className="p-5 bg-slate-950/80 border border-rose-500/40 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white text-sm">Escalation Active: {lastDispatchedEvent.escalationLevel}</span>
            </div>
            <span className="text-xs text-rose-400 font-mono">Incident: {lastDispatchedEvent.incidentId}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Dispatched Channels</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lastDispatchedEvent.channelsDispatched.map((ch, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold text-[10px]">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">NDIS 24-Hour Statutory Deadline</span>
              <strong className="text-amber-300 text-xs font-mono">
                {new Date(lastDispatchedEvent.statutoryNDISCommissionDeadline).toLocaleString()}
              </strong>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Notified Stakeholders</span>
              <span className="text-slate-200 text-[11px] block">{lastDispatchedEvent.notifiedStakeholders.join(', ')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
