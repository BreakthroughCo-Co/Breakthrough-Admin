'use client';

import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetUserPassword
} from '@/lib/firebase';
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
  Globe,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  KeyRound,
  Check
} from 'lucide-react';

export const SignInScreen: React.FC = () => {
  const { users, setUserProfile, handleAuthUser } = useManagementStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'google' | 'sandbox'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('PRACTITIONER');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No practitioner account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your credentials.';
      case 'auth/invalid-credential':
        return 'Invalid email or password credentials.';
      case 'auth/email-already-in-use':
        return 'An account with this email address is already registered.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In window was closed before completing authentication.';
      case 'auth/network-request-failed':
        return 'Network connectivity error. Please check your connection and try again.';
      default:
        return err?.message || 'Authentication error. Please check your credentials.';
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cred = await signInWithEmail(email.trim(), password);
      await handleAuthUser(cred.user);
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      setErrorMessage(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { user, profile } = await signUpWithEmail(
        regEmail.trim(),
        regPassword,
        regName.trim(),
        regRole
      );
      await handleAuthUser(user);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { user } = await signInWithGoogle();
      await handleAuthUser(user);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setErrorMessage(mapAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Please enter your email to reset password.');
      return;
    }

    setIsResetLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await resetUserPassword(resetEmail.trim());
      setSuccessMessage(`Password reset link successfully sent to ${resetEmail.trim()}. Please check your inbox.`);
      setIsForgotPasswordOpen(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(mapAuthError(err));
    } finally {
      setIsResetLoading(false);
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

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Clinical Portal Sign In</h3>
              <p className="text-xs text-slate-400">
                Secure NDIS practitioner & clinical director authentication
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                  setIsForgotPasswordOpen(false);
                }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setIsForgotPasswordOpen(false);
                }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sandbox');
                  setErrorMessage(null);
                  setIsForgotPasswordOpen(false);
                }}
                className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'sandbox'
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Demo</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* TAB 1: Sign In Flow */}
            {activeTab === 'signin' && (
              <div className="space-y-4">
                {!isForgotPasswordOpen ? (
                  <form onSubmit={handleEmailSignIn} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-400" />
                        <span>Practitioner Email</span>
                      </label>
                      <input
                        type="email"
                        id="signin-email-input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah.jenkins@breakthrough.org.au"
                        className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                          <span>Password</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="signin-password-input"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 pr-10 bg-slate-950/90 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="signin-submit-btn"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Sign In to Breakthrough OS</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Forgot Password Form */
                  <form onSubmit={handlePasswordReset} className="space-y-3 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-400" />
                        <span>Registered Account Email</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="practitioner@breakthrough.org.au"
                        className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(false)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResetLoading}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
                      >
                        {isResetLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest absolute">
                    or continue with
                  </span>
                </div>

                {/* Google Workspace Button */}
                <button
                  type="button"
                  id="sign-in-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-lg transition-all disabled:opacity-60 group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Google Workspace</span>
                </button>
              </div>
            )}

            {/* TAB 2: Register Flow */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Marcus Vance, PBS Specialist"
                    className="w-full px-3.5 py-2 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="practitioner@breakthrough.org.au"
                    className="w-full px-3.5 py-2 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Clinical Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="PRACTITIONER">PRACTITIONER — Behaviour Support Specialist</option>
                    <option value="ADMIN">ADMIN — Clinical Director & Principal Specialist</option>
                    <option value="SUPPORT_COORDINATOR">SUPPORT_COORDINATOR — Plan Management & NDIS Liaison</option>
                    <option value="VIEWER">VIEWER — Compliance Auditor / Read-Only</option>
                    <option value="PARTICIPANT">PARTICIPANT — NDIS Participant / Nominee</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Confirm</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full px-3 py-2 bg-slate-950/90 border border-slate-800 focus:border-teal-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Practitioner Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: Sandbox Demo Flow */}
            {activeTab === 'sandbox' && (
              <div className="space-y-2.5 animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Select Pre-Configured Test Persona
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
                              : u.role === 'PARTICIPANT'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
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
            )}

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
