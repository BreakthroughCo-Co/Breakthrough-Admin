import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { PeerSupervisionNetwork, SupervisionLog } from '../../lib/peerSupervisionNetwork';
import {
  Users2,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const PeerSupervisionNetworkModule: React.FC = () => {
  const { practitioners, addNotification } = useManagementStore();
  const [logs, setLogs] = useState<SupervisionLog[]>([]);

  const handleCreateSession = () => {
    const supPrac = practitioners[0] || { id: 'prac-1', name: 'Senior PBS Supervisor' };
    const subPrac = practitioners[1] || { id: 'prac-2', name: 'Clinical Practitioner' };

    const newLog = PeerSupervisionNetwork.createSupervisionSession(
      subPrac as any,
      supPrac as any,
      'PBS_FORMULATION',
      1.5
    );

    setLogs([newLog, ...logs]);
    addNotification({
      title: 'Peer Supervision Logged',
      message: `Recorded 1.5 hours of clinical supervision with ${supPrac.name}.`,
      type: 'clinical',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Practitioner Peer Supervision & Reflective Practice Network
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                AHPRA / NDIS Audited
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              1:1 clinical supervision logging, competency tracking, and supervisor reflective sign-offs
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateSession}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-sky-900/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Log 1:1 Supervision Session
        </button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No supervision logs recorded today. Click above to log a clinical supervision session.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.logId} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-sky-400 font-bold">{log.logId}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {log.superviseeName} &larr; Supervised by {log.supervisorName}
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Supervisor Signed ({log.durationHours}h)
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <strong className="text-slate-400 block mb-1">Reflective Notes:</strong>
                {log.reflectiveNotes}
              </div>

              <div className="text-xs text-slate-400">
                <strong className="text-slate-300 block mb-1">Action Items:</strong>
                <ul className="list-disc list-inside space-y-1">
                  {log.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
