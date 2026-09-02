'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { onAuthUserChanged } from '@/lib/firebase';
import { useSystemThemeSync } from '@/hooks/useSystemThemeSync';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SignInScreen } from '@/components/SignInScreen';
import { AccessGuard } from '@/components/AccessGuard';
import { Loader2, Zap, Activity } from 'lucide-react';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OfflineToast } from '@/components/OfflineToast';
import { BiometricSecurityOverlay } from '@/components/BiometricSecurityOverlay';

// Phase 7.2: Lazy-loaded feature modules for high-performance route code-splitting
const CommandCenter = lazy(() => import('@/components/features/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ClientsModule = lazy(() => import('@/components/features/ClientsModule').then(m => ({ default: m.ClientsModule })));
const NDISGoalTracker = lazy(() => import('@/components/features/NDISGoalTracker').then(m => ({ default: m.NDISGoalTracker })));
const GoogleMapsView = lazy(() => import('@/components/features/GoogleMapsView').then(m => ({ default: m.GoogleMapsView })));
const CaseNotesModule = lazy(() => import('@/components/features/CaseNotesModule').then(m => ({ default: m.CaseNotesModule })));
const IncidentsModule = lazy(() => import('@/components/features/IncidentsModule').then(m => ({ default: m.IncidentsModule })));
const RestrictivePracticesModule = lazy(() => import('@/components/features/RestrictivePracticesModule').then(m => ({ default: m.RestrictivePracticesModule })));
const ABCAnalyserModule = lazy(() => import('@/components/features/ABCAnalyserModule').then(m => ({ default: m.ABCAnalyserModule })));
const BSPModule = lazy(() => import('@/components/features/BSPModule').then(m => ({ default: m.BSPModule })));
const PracticeToolsModule = lazy(() => import('@/components/features/PracticeToolsModule').then(m => ({ default: m.PracticeToolsModule })));
const GoogleWorkspaceHub = lazy(() => import('@/components/features/GoogleWorkspaceHub').then(m => ({ default: m.GoogleWorkspaceHub })));
const GoogleKeepModule = lazy(() => import('@/components/features/GoogleKeepModule').then(m => ({ default: m.GoogleKeepModule })));
const GoogleClassroomModule = lazy(() => import('@/components/features/GoogleClassroomModule').then(m => ({ default: m.GoogleClassroomModule })));
const ComplianceDashboard = lazy(() => import('@/components/features/ComplianceDashboard').then(m => ({ default: m.ComplianceDashboard })));
const CRMModule = lazy(() => import('@/components/features/CRMModule').then(m => ({ default: m.CRMModule })));
const BillingModule = lazy(() => import('@/components/features/BillingModule').then(m => ({ default: m.BillingModule })));
const HRModule = lazy(() => import('@/components/features/HRModule').then(m => ({ default: m.HRModule })));
const AuditLogsModule = lazy(() => import('@/components/features/AuditLogsModule').then(m => ({ default: m.AuditLogsModule })));
const SecurityAuditModule = lazy(() => import('@/components/features/SecurityAuditModule').then(m => ({ default: m.SecurityAuditModule })));
const IntegrationsModule = lazy(() => import('@/components/features/IntegrationsModule').then(m => ({ default: m.IntegrationsModule })));
const ParticipantPortalView = lazy(() => import('@/components/features/ParticipantPortalView').then(m => ({ default: m.ParticipantPortalView })));
const AIPredictiveInsights = lazy(() => import('@/components/features/AIPredictiveInsights').then(m => ({ default: m.AIPredictiveInsights })));
const ClinicalVoiceScribe = lazy(() => import('@/components/features/ClinicalVoiceScribe').then(m => ({ default: m.ClinicalVoiceScribe })));
const DocumentIntelligenceModule = lazy(() => import('@/components/features/DocumentIntelligenceModule').then(m => ({ default: m.DocumentIntelligenceModule })));
const AICaseloadRiskRadar = lazy(() => import('@/components/features/AICaseloadRiskRadar').then(m => ({ default: m.AICaseloadRiskRadar })));
const AuditSimulatorModule = lazy(() => import('@/components/features/AuditSimulatorModule').then(m => ({ default: m.AuditSimulatorModule })));
const DirectPRODAClaimConnector = lazy(() => import('@/components/features/DirectPRODAClaimConnector').then(m => ({ default: m.DirectPRODAClaimConnector })));
const PlanReassessmentReportWriter = lazy(() => import('@/components/features/PlanReassessmentReportWriter').then(m => ({ default: m.PlanReassessmentReportWriter })));
const ParticipantChurnRadar = lazy(() => import('@/components/features/ParticipantChurnRadar').then(m => ({ default: m.ParticipantChurnRadar })));
const ServiceAgreementSigningPortal = lazy(() => import('@/components/features/ServiceAgreementSigningPortal').then(m => ({ default: m.ServiceAgreementSigningPortal })));
const TelehealthRoom = lazy(() => import('@/components/features/TelehealthRoom').then(m => ({ default: m.TelehealthRoom })));
const ClinicalSupervisorDashboard = lazy(() => import('@/components/features/ClinicalSupervisorDashboard').then(m => ({ default: m.ClinicalSupervisorDashboard })));
const BigQueryAnalyticsHub = lazy(() => import('@/components/features/BigQueryAnalyticsHub').then(m => ({ default: m.BigQueryAnalyticsHub })));
const ClinicalBenchmarkingMatrix = lazy(() => import('@/components/features/ClinicalBenchmarkingMatrix').then(m => ({ default: m.ClinicalBenchmarkingMatrix })));
const CarerFamilyHub = lazy(() => import('@/components/features/CarerFamilyHub').then(m => ({ default: m.CarerFamilyHub })));
const GamifiedGoalTracker = lazy(() => import('@/components/features/GamifiedGoalTracker').then(m => ({ default: m.GamifiedGoalTracker })));

const ModuleLoadingFallback = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[360px] py-16 space-y-4 rounded-2xl bg-slate-900/30 border border-slate-800/50">
    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center animate-pulse">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-semibold text-slate-200">Loading {title}...</p>
      <p className="text-xs text-slate-500">Preparing clinical workspace data</p>
    </div>
  </div>
);

const AppAuthLoadingScreen = ({ onSkip, onQuickLogin }: { onSkip: () => void; onQuickLogin: (role: 'ADMIN' | 'PRACTITIONER') => void }) => {
  const [showFallbacks, setShowFallbacks] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallbacks(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-slate-200">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-5 bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-xl shadow-teal-900/30 text-white animate-pulse">
          <Activity className="w-8 h-8" />
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-teal-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authenticating Breakthrough OS session...</span>
          </div>
          <p className="text-xs text-slate-400">Verifying role credentials and clinical permissions</p>
        </div>

        {showFallbacks && (
          <div className="w-full pt-4 border-t border-slate-800/80 space-y-3 animate-fadeIn">
            <p className="text-[11px] text-slate-400">
              Authentication is taking a few moments. You can bypass directly or sign in manually:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In Screen</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onQuickLogin('ADMIN')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold rounded-xl border border-slate-700 transition-all text-center cursor-pointer"
                >
                  Director Access
                </button>
                <button
                  type="button"
                  onClick={() => onQuickLogin('PRACTITIONER')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold rounded-xl border border-slate-700 transition-all text-center cursor-pointer"
                >
                  Practitioner Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Page() {
  const {
    activeTab,
    setActiveTab,
    theme,
    currentUser,
    users,
    setUserProfile,
    isAuthenticated,
    authLoading,
    handleAuthUser,
    syncWithFirestore,
    startRealtimeListeners,
    stopRealtimeListeners
  } = useManagementStore();
  const [mounted, setMounted] = useState(false);

  // Automatically listen for system-level light/dark mode changes and sync with store
  useSystemThemeSync();

  // Global Keyboard Shortcut Manager (Ctrl+K, Ctrl+1..0, Ctrl+N, etc.)
  const { activeToast } = useGlobalShortcuts();

  useEffect(() => {
    setMounted(true);

    // Fast-path safety timeout: Release loading screen in 400ms if session exists or fast fallback
    const safetyTimeout = setTimeout(() => {
      if (useManagementStore.getState().authLoading) {
        useManagementStore.setState({ authLoading: false });
      }
    }, 400);

    // Subscribe to Firebase Auth changes to automatically restore session without dropping
    const unsubscribe = onAuthUserChanged(async (firebaseUser) => {
      clearTimeout(safetyTimeout);
      if (firebaseUser) {
        try {
          await handleAuthUser(firebaseUser);
          useManagementStore.setState({ authLoading: false, isAuthenticated: true });
          // Background data hydration non-blockingly
          syncWithFirestore()
            .catch((err) =>
              console.warn('Firestore initial sync notice (continuing with cached store data):', err?.message || err)
            )
            .finally(() => {
              startRealtimeListeners();
            });
        } catch (err) {
          console.warn('Auth restoration notice:', err);
          useManagementStore.setState({ authLoading: false });
        }
      } else {
        // User signed out — tear down real-time listeners
        stopRealtimeListeners();
        useManagementStore.setState({ authLoading: false });
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
      // Clean up Firestore listeners on component unmount
      stopRealtimeListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkipToSignIn = () => {
    useManagementStore.setState({ authLoading: false });
  };

  const handleQuickRoleLogin = (role: 'ADMIN' | 'PRACTITIONER') => {
    const targetUser = users.find((u) => u.role === role) || users[0];
    setUserProfile(targetUser);
  };

  // Auth Gate: While checking session on startup
  if (!mounted || authLoading) {
    return <AppAuthLoadingScreen onSkip={handleSkipToSignIn} onQuickLogin={handleQuickRoleLogin} />;
  }

  // Auth Gate: Unauthenticated users are strictly shown the SignInScreen
  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'command-center':
        return <CommandCenter />;
      case 'clients':
        return <ClientsModule />;
      case 'ndis-goals':
        return <NDISGoalTracker />;
      case 'google-maps':
        return <GoogleMapsView />;
      case 'case-notes':
        return <CaseNotesModule />;
      case 'incidents':
        return <IncidentsModule />;
      case 'restrictive-practices':
        return <RestrictivePracticesModule />;
      case 'abc-analyser':
        return <ABCAnalyserModule />;
      case 'bsp-plans':
        return <BSPModule />;
      case 'practice-tools':
        return <PracticeToolsModule />;
      case 'google-workspace':
        return <GoogleWorkspaceHub />;
      case 'google-keep':
        return <GoogleKeepModule />;
      case 'google-classroom':
        return <GoogleClassroomModule />;
      case 'audit':
        return <ComplianceDashboard />;
      case 'crm':
        return <CRMModule />;
      case 'billing':
        return <BillingModule />;
      case 'hr-roster':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="Practitioners & HR Roster">
            <HRModule />
          </AccessGuard>
        );
      case 'audit-logs':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="Audit Trail Ledger">
            <AuditLogsModule />
          </AccessGuard>
        );
      case 'security-audit':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="Security & Access Audit">
            <SecurityAuditModule />
          </AccessGuard>
        );
      case 'integrations':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="API Integrations & Hub">
            <IntegrationsModule />
          </AccessGuard>
        );
      case 'participant-portal':
        return <ParticipantPortalView />;
      case 'voice-scribe':
        return <ClinicalVoiceScribe />;
      case 'document-intelligence':
        return <DocumentIntelligenceModule />;
      case 'ai-radar':
        return <AICaseloadRiskRadar />;
      case 'audit-simulator':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="NDIS Audit Simulator">
            <AuditSimulatorModule />
          </AccessGuard>
        );
      case 'ai-predictive-insights':
        return <AIPredictiveInsights />;
      case 'proda-gateway':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="PRODA Direct Gateway">
            <DirectPRODAClaimConnector />
          </AccessGuard>
        );
      case 'plan-report-writer':
        return <PlanReassessmentReportWriter />;
      case 'churn-radar':
        return <ParticipantChurnRadar />;
      case 'agreements-signing':
        return <ServiceAgreementSigningPortal />;
      case 'telehealth':
        return <TelehealthRoom />;
      case 'clinical-supervisor':
        return <ClinicalSupervisorDashboard />;
      case 'bigquery-analytics':
        return (
          <AccessGuard requiredRoles={['ADMIN']} moduleName="BigQuery Data Warehouse">
            <BigQueryAnalyticsHub />
          </AccessGuard>
        );
      case 'clinical-benchmarks':
        return <ClinicalBenchmarkingMatrix />;
      case 'carer-family-hub':
        return <CarerFamilyHub />;
      case 'gamified-goals':
        return <GamifiedGoalTracker />;
      default:
        if (currentUser?.role === 'PARTICIPANT') {
          return <ParticipantPortalView />;
        }
        return <GoogleWorkspaceHub />;
    }
  };

  return (
    <div
      id="breakthrough-app-root"
      className={`min-h-screen flex flex-col font-sans ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar activeTab={activeTab} setActiveTab={(tab: TabType) => setActiveTab(tab)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-8 bg-slate-950/40 w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            <ErrorBoundary fallbackName="Clinical Module">
              <Suspense fallback={<ModuleLoadingFallback title={activeTab} />}>
                {renderActiveModule()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Shortcut Navigation Toast Notification */}
      {activeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl border border-teal-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <div className="w-5 h-5 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Zap className="w-3 h-3" />
          </div>
          <span className="text-xs font-extrabold text-white">{activeToast.moduleName}</span>
          <kbd className="text-[10px] font-mono font-bold bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded border border-slate-700">
            {activeToast.keyCombo}
          </kbd>
        </div>
      )}

      {/* Persistent Non-Intrusive Offline Notification Toast */}
      <OfflineToast />

      <BiometricSecurityOverlay />
      <PWAInstallPrompt />
      <CommandPalette />
    </div>
  );
}
