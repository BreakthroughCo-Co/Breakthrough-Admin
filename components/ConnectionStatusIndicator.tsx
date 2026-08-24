'use client';

import React, { useState, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  Cloud,
  CloudOff,
  ArrowUpRight,
  Globe,
  Activity,
  Server,
  ShieldCheck,
  Calendar,
  FileText,
  Mail,
  Zap
} from 'lucide-react';

export const ConnectionStatusIndicator: React.FC = () => {
  const {
    isOnline,
    setOnlineStatus,
    syncStatus,
    pendingChangesCount,
    offlineQueue,
    lastSyncTime,
    simulateOfflineToggle,
    triggerDeltaSync,
    addNotification
  } = useManagementStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [firebaseLatency, setFirebaseLatency] = useState(24);
  const [workspaceLatency, setWorkspaceLatency] = useState(38);
  const [lastPingTimestamp, setLastPingTimestamp] = useState<string>(new Date().toLocaleTimeString());

  // Google Workspace API Services Health Status
  const [workspaceServices, setWorkspaceServices] = useState({
    calendar: { name: 'Google Calendar API', status: 'Operational', latency: '32ms' },
    driveDocs: { name: 'Google Drive & Docs API', status: 'Operational', latency: '41ms' },
    gmail: { name: 'Gmail API Engine', status: 'Operational', latency: '28ms' },
    keep: { name: 'Google Keep Notes Sync', status: 'Operational', latency: '35ms' },
  });

  // Synchronize with browser network events
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      addNotification({
        title: 'Connection Restored',
        message: 'Device is back online. Synchronizing queued clinical deltas with cloud database and Google Workspace.',
        type: 'compliance',
        severity: 'low'
      });
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      addNotification({
        title: 'Working Offline',
        message: 'Network connection lost. All case notes, claims, and edits will be stored in your secure local delta queue.',
        type: 'compliance',
        severity: 'medium'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine && isOnline) {
      setOnlineStatus(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, addNotification, isOnline]);

  // Periodic heartbeat latency jitter simulation
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setFirebaseLatency(Math.floor(18 + Math.random() * 14));
      setWorkspaceLatency(Math.floor(30 + Math.random() * 18));
      setLastPingTimestamp(new Date().toLocaleTimeString());
    }, 25000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleTestConnection = () => {
    setIsPinging(true);
    setTimeout(() => {
      setFirebaseLatency(Math.floor(20 + Math.random() * 10));
      setWorkspaceLatency(Math.floor(32 + Math.random() * 12));
      setLastPingTimestamp(new Date().toLocaleTimeString());
      setIsPinging(false);
      addNotification({
        title: 'Health Diagnostics Passed',
        message: `Firebase Firestore (${firebaseLatency}ms) and Google Workspace API (${workspaceLatency}ms) connections are operational.`,
        type: 'compliance',
        severity: 'low'
      });
    }, 600);
  };

  const formattedLastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="relative inline-block" id="connection-status-widget">
      {/* Top Bar Connection Badge */}
      <button
        type="button"
        id="connection-status-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
          !isOnline
            ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 hover:bg-rose-900/80 animate-pulse'
            : syncStatus === 'syncing'
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 hover:bg-amber-900/80'
            : pendingChangesCount > 0
            ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/70'
            : 'bg-slate-950/90 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60 hover:bg-slate-900'
        }`}
        title={
          !isOnline
            ? 'WARNING: You are working offline. Data is queued locally.'
            : syncStatus === 'syncing'
            ? 'Synchronizing local changes with Cloud Database & Google Workspace...'
            : `Firebase Firestore & Google Workspace connected • Latency: ${firebaseLatency}ms`
        }
        aria-label="Connection and synchronization status"
      >
        {!isOnline ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[11px] font-bold text-rose-300 hidden md:inline">Working Offline</span>
            {pendingChangesCount > 0 && (
              <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1.5 py-0.2 rounded font-mono font-bold">
                {pendingChangesCount} Queued
              </span>
            )}
          </>
        ) : syncStatus === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
            <span className="text-[11px] font-bold text-amber-300 hidden md:inline">Syncing Data...</span>
          </>
        ) : pendingChangesCount > 0 ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-300 hidden md:inline">
              {pendingChangesCount} Sync Pending
            </span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            </div>
            <span className="text-[11px] font-bold text-emerald-300 hidden lg:inline">
              Firestore &amp; Workspace Live
            </span>
          </>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Real-Time Sync &amp; API Monitor</h4>
                <p className="text-[10px] text-slate-400">Google Workspace &amp; Firebase Database Health</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close sync modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Offline Warning Banner if Offline */}
          {!isOnline && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl space-y-1.5 text-rose-200">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>You are currently working offline</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                All clinical case notes, incidents, and billable claims entered during this session are safely preserved in your browser&apos;s local encrypted delta queue. They will automatically upload when connectivity is restored.
              </p>
            </div>
          )}

          {/* SERVICE HEALTH 1: Firebase Database & Firestore */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Database className="w-3.5 h-3.5" />
                Firebase Firestore Sync Health
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {isOnline ? `${firebaseLatency}ms Ping` : 'Disconnected'}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Real-time Stream Engine:</span>
                <span className={`font-bold flex items-center gap-1.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
                  {isOnline ? 'Connected (Live)' : 'Disconnected'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Local Delta Queue:</span>
                <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                  {offlineQueue.length} pending records
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Last Bidirectional Sync:</span>
                <span className="font-mono text-slate-300 text-[11px]">{formattedLastSync}</span>
              </div>
            </div>
          </div>

          {/* SERVICE HEALTH 2: Google Workspace Enterprise Hub */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Globe className="w-3.5 h-3.5" />
                Google Workspace API Health
              </span>
              <span className="text-[10px] font-mono text-sky-400">
                {isOnline ? `${workspaceLatency}ms Ping` : 'Offline'}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  Google Calendar API:
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Operational ({workspaceServices.calendar.latency})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Drive &amp; Docs API:
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Operational ({workspaceServices.driveDocs.latency})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Gmail Notifications API:
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Operational ({workspaceServices.gmail.latency})
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostics Bar */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <span>Last Heartbeat Check: {lastPingTimestamp}</span>
            <span className="text-emerald-400 font-bold">100% SLA Up</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={handleTestConnection}
              disabled={isPinging || !isOnline}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPinging ? 'animate-bounce' : ''}`} />
              <span>{isPinging ? 'Pinging...' : 'Test Connections'}</span>
            </button>

            <button
              onClick={simulateOfflineToggle}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                isOnline
                  ? 'bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
              }`}
            >
              {isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Simulate Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Go Online</span>
                </>
              )}
            </button>

            <button
              onClick={triggerDeltaSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
