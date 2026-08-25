'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Wifi,
  WifiOff,
  Smartphone,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { flushOfflineQueue, getOfflineQueue } from '@/lib/keepOfflineStorage';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkQueue = useCallback(async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingSyncCount(queue.length);
    } catch {
      // IndexedDB not ready
    }
  }, []);

  const handleManualSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await flushOfflineQueue();
      await checkQueue();
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkQueue]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    // Check initial online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        handleManualSync();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check if installed in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      // Listen for PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check offline queue count
      checkQueue();
      const interval = setInterval(checkQueue, 10000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearInterval(interval);
      };
    }
  }, [handleManualSync, checkQueue]);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4">
      {/* Offline Alert Badge */}
      {!isOnline && (
        <div className="p-3 bg-amber-950/90 border border-amber-500/50 rounded-xl flex items-center justify-between gap-3 text-white shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-amber-300 block">Field Offline Mode Active</span>
              <span className="text-[11px] text-slate-300">
                Mutations queued locally in IndexedDB.
              </span>
            </div>
          </div>
          {pendingSyncCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              {pendingSyncCount} Queued
            </span>
          )}
        </div>
      )}

      {/* Online Sync Pending Badge */}
      {isOnline && pendingSyncCount > 0 && (
        <div className="p-3 bg-teal-950/90 border border-teal-500/50 rounded-xl flex items-center justify-between gap-3 text-white shadow-xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="font-bold text-teal-300 block">Back Online</span>
              <span className="text-[11px] text-slate-300">
                {pendingSyncCount} offline record(s) ready to sync.
              </span>
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      {isInstallable && !isInstalled && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Install Breakthrough OS</h4>
              <p className="text-[11px] text-slate-400">
                Add to home screen for offline field note capture & fast access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
