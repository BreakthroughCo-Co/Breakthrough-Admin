'use client';

import React, { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebase';
import { useManagementStore } from '@/stores/useManagementStore';
import { UserProfile, UserRole } from '@/types';
import {
  Activity,
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react';

export const SignInScreen: React.FC = () => {
  const { users, setUserProfile, handleAuthUser } = useManagementStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user } = await signInWithGoogle();
      await handleAuthUser(user);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setErrorMessage(error?.message || 'Authentication failed. Please verify popup permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (user: UserProfile) => {
    setUserProfile(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-900/30 text-white font-black flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">Breakthrough OS</h1>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                NDIS Production
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Behaviour Support • Restrictive Practices • Clinical Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-emerald-400 font-semibold shadow-inner">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>NDIS Commission PACE Compliant</span>
        </div>
      </header>

      {/* Center Sign In Container */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left Side: Clinical Mission & Safeguards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Allied Health Practice Management OS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Enterprise Practice Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-sky-400">PBS Specialists</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Role-governed clinical practice platform purpose-built for Behaviour Support Practitioners, Clinical Directors, and Quality Safeguards Auditors under Australian NDIS standards.
            </p>
          </div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>Caseload & Profile Governance</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Complete participant NDIS goals, FBA profiles, and primary practitioner caseload balancing.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Audit-Compliant Case Notes</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Structured SIMPL & BIRP frameworks with Web Speech voice dictation and goal linkage.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Restrictive Practices Register</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Section 34 statutory compliance, state authorisations, and mandatory Commission reporting.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
                <span>NDIS PACE & PRODA Claims</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                2026 Price Guide integration, bulk batch exports, and 7-day payment SLA monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-In Box */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Clinical Portal Sign In</h3>
              <p className="text-xs text-slate-400">
                Authenticate using your organization Google Workspace or practitioner credentials
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <div className="space-y-3">
              <button
                type="button"
                id="sign-in-google-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign in with Google Workspace</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
                <Globe className="w-3 h-3 text-teal-400" />
                <span>Includes Drive, Sheets, Docs, Calendar, and Meet integration</span>
              </div>
            </div>

            {/* Quick Demo Role Selector */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Quick Role Sandbox Access
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(u)}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] group-hover:text-teal-300 truncate">
                        {u.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'PRACTITIONER'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : u.role === 'SUPPORT_COORDINATOR'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{u.position || u.role}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Assurance Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1">
              <p>🔒 256-bit Encrypted Session • HIPAA & NDIS Privacy Act 1988</p>
              <p>Role-governed data isolation enforced at datastore layer.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-500 py-2 border-t border-slate-900">
        <p>© 2026 Breakthrough Consulting Pty Ltd. Built for Australian NDIS Behaviour Support Practice Standards.</p>
      </footer>
    </div>
  );
};
