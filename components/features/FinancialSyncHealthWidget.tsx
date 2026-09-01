'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useManagementStore } from '@/stores/useManagementStore';

interface XeroHealthData {
  status: 'HEALTHY' | 'UNHEALTHY' | 'READY_TO_CONNECT' | 'ERROR';
  isConnected: boolean;
  hasCredentials: boolean;
  tenantName: string;
  latencyMs: number;
  lastSyncAt: string;
  invoiceCount: number;
  syncedPaymentsCount: number;
  timestamp: string;
}

export const FinancialSyncHealthWidget: React.FC = () => {
  const { setActiveTab, billingClaims } = useManagementStore();
  const [healthData, setHealthData] = useState<XeroHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkXeroHealth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/xero/health');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      console.warn('Xero Health Ping Failed:', err);
      setErrorMsg(err.message || 'Connection ping failed');
      setHealthData({
        status: 'UNHEALTHY',
        isConnected: false,
        hasCredentials: false,
        tenantName: 'Breakthrough Consulting',
        latencyMs: 0,
        lastSyncAt: new Date().toISOString(),
        invoiceCount: 0,
        syncedPaymentsCount: 0,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkXeroHealth();
    // Auto-ping every 60 seconds
    const interval = setInterval(checkXeroHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalSyncedAmount = billingClaims
    .filter((c) => c.status === 'Paid' || c.reconciliationStatus === 'Reconciled')
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const isHealthy = healthData?.status === 'HEALTHY' || healthData?.isConnected;

  return (
    <div
      id="financial-sync-health-widget"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                Financial Sync Health (Xero Gateway)
              </h3>
              {/* Dynamic Status Indicator Badge */}
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                  }`}
                />
                {isHealthy ? 'Live & Operational' : 'Offline / Awaiting OAuth'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated validation of ACCREC sales invoice dispatch &amp; bank feed payment reconciliation.
            </p>
          </div>
        </div>

        {/* Refresh / Ping Button */}
        <button
          type="button"
          onClick={checkXeroHealth}
          disabled={isLoading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
          title="Send real-time heartbeat ping to Xero endpoint"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Pinging...' : 'Ping Xero API'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            API Gateway Status
          </span>
          <div className="flex items-center gap-1.5">
            {isHealthy ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={`text-xs font-extrabold ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isHealthy ? '200 OK (Syncing)' : 'OAuth Required'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {healthData?.latencyMs ? `${healthData.latencyMs}ms response` : 'No ping response'}
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Tenant Account
          </span>
          <span className="text-xs font-extrabold text-white truncate block">
            {healthData?.tenantName || 'Breakthrough Consulting'}
          </span>
          <span className="text-[10px] text-teal-400 font-mono">
            Direct ACCREC Feed
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Reconciled Invoices
          </span>
          <div className="text-xs font-extrabold text-white font-mono flex items-center gap-1">
            <span>{billingClaims.filter((c) => c.status === 'Paid').length} Claims Paid</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">
            ${totalSyncedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Last Successful Sync
          </span>
          <span className="text-xs font-mono text-slate-300 block">
            {healthData?.lastSyncAt
              ? new Date(healthData.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Continuous'}
          </span>
          <span className="text-[10px] text-slate-500">Auto-sync active</span>
        </div>
      </div>

      {/* Footer / Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span>Bank feed transactions automatically match NDIS claims by line item code and NDIS participant number.</span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline transition-colors shrink-0"
        >
          <span>Manage Accounting Gateways</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
