import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { LoneWorkerSafetyEngine, SafetySession } from '../../lib/loneWorkerSafetyEngine';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Clock,
  AlertOctagon,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Flame,
  ShieldCheck
} from 'lucide-react';

export const LoneWorkerSafetyHub: React.FC = () => {
  const { practitioners, clients, addNotification } = useManagementStore();
  const [activeSession, setActiveSession] = useState<SafetySession | null>(null);

  const activePrac = practitioners[0] || { id: 'prac-1', name: 'Field Practitioner' };
  const activeClient = clients[0] || { id: 'cli-1', name: 'NDIS Participant', riskLevel: 'High' };

  const handleStartSession = () => {
    const session = LoneWorkerSafetyEngine.startSafetySession(
      activePrac as any,
      activeClient,
      activeClient.address?.street || '124 St Kilda Rd, Melbourne VIC',
      30
    );
    setActiveSession(session);
    addNotification({
      title: 'Lone Worker Field Session Started',
      message: `Safety timers active for visit to ${activeClient.name} (30 min check-in interval).`,
      type: 'clinical',
      severity: 'info',
    });
  };

  const handleCheckIn = () => {
    if (!activeSession) return;
    setActiveSession({
      ...activeSession,
      lastCheckInAt: new Date().toISOString(),
      status: 'ACTIVE_SAFE',
    });
    addNotification({
      title: 'Safety Check-In Confirmed',
      message: 'Practitioner confirmed safe on site.',
      type: 'clinical',
      severity: 'success',
    });
  };

  const handleTriggerSOS = () => {
    if (!activeSession) return;
    const sosSession = LoneWorkerSafetyEngine.triggerEmergencySOS(activeSession);
    setActiveSession(sosSession);
    addNotification({
      title: 'EMERGENCY SOS BEACON BROADCASTED',
      message: `CRITICAL ALERT: Emergency beacon triggered at ${sosSession.visitLocation}. Incident response dispatched.`,
      type: 'incident',
      severity: 'high',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Lone Worker Field Safety & GPS Emergency Beacon
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                Live Telemetry
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Real-time community visit tracking with automated check-in timers and instant SOS emergency dispatch
            </p>
          </div>
        </div>

        {!activeSession ? (
          <button
            onClick={handleStartSession}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Start Community Visit Safety Session
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckIn}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Check-In (I Am Safe)
            </button>
            <button
              onClick={handleTriggerSOS}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-900/40 animate-bounce transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              EMERGENCY SOS PANIC
            </button>
          </div>
        )}
      </div>

      {activeSession && (
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-red-400 font-bold block">{activeSession.sessionId}</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Visit with {activeSession.clientName}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {activeSession.visitLocation}
              </p>
            </div>

            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              activeSession.status === 'EMERGENCY_SOS_TRIGGERED'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {activeSession.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Check-In Interval</span>
              <strong className="text-white text-sm">{activeSession.checkInIntervalMinutes} minutes</strong>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Last Safe Check-In</span>
              <strong className="text-emerald-400 text-sm">{new Date(activeSession.lastCheckInAt).toLocaleTimeString()}</strong>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Participant Risk Note</span>
              <strong className="text-amber-300 text-xs">{activeSession.riskSummary}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
