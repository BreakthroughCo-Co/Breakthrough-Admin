'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Cloud, Database, X, CheckCircle2 } from 'lucide-react';
import { useManagementStore } from '@/stores/useManagementStore';

export const OfflineToast: React.FC = () => {
  const { isOnline, offlineQueue, syncStatus, triggerDeltaSync } = useManagementStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  // Monitor service worker registration & state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwRegistered(true);
      });

      // Listen for background sync broadcasts from sw.js
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === 'BACKGROUND_SYNC_TRIGGERED') {
          console.log('[SW] Service worker triggered background sync');
          triggerDeltaSync();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }
  }, [triggerDeltaSync]);

  // Reset dismissal state whenever we transition offline
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div
      id="offline-persistent-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full sm:w-auto bg-slate-900/95 border border-amber-500/50 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
          <WifiOff className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 space-y-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-xs tracking-tight">
              You are currently working offline
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              Field Mode
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Network disconnected. All clinical notes, NDIS billing claims, and participant changes are safely cached in your browser&apos;s encrypted local storage and will automatically synchronize when connection is restored.
          </p>

          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-teal-300">
              <Database className="w-3 h-3" />
              {offlineQueue.length} {offlineQueue.length === 1 ? 'item' : 'items'} queued
            </span>
            {swRegistered && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Service Worker Active
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          title="Dismiss notification"
          aria-label="Dismiss offline toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
