'use client';

import React from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { UserRole } from '@/types';
import { ShieldAlert, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AccessGuardProps {
  requiredRoles?: UserRole[];
  moduleName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({
  requiredRoles = ['ADMIN'],
  moduleName = 'This module',
  children,
  fallback
}) => {
  const { currentUser, setActiveTab } = useManagementStore();
  const currentRole = currentUser?.role;

  const hasAccess = currentRole && (requiredRoles.includes(currentRole) || currentRole === 'ADMIN');

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-[480px] flex items-center justify-center p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl text-center">
      <div className="max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-900/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Role Authorization Required</span>
          </div>
          <h2 className="text-xl font-black text-white">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {moduleName} requires elevated privileges ({requiredRoles.join(' or ')}). Your active session role is{' '}
            <span className="font-mono font-bold text-teal-400">{currentRole || 'GUEST'}</span>.
          </p>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Clinical Safeguards Governance</span>
          </div>
          <p>
            Under NDIS Quality & Safeguards Commission rules, administrative HR, system integrations, and immutable audit logs are restricted to authorized Clinical Directors.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('command-center')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 border border-slate-700 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Command Center</span>
          </button>
        </div>
      </div>
    </div>
  );
};
