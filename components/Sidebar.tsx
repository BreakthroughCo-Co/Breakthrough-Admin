'use client';
import React from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Lock,
  UserPlus,
  BarChart3,
  FileSpreadsheet,
  Receipt,
  UserCheck,
  ShieldCheck,
  Award,
  Sparkles,
  BrainCircuit,
  ChevronRight,
  Cpu,
  Globe,
  MapPin,
  StickyNote,
  GraduationCap,
  Target,
  HeartHandshake,
  Video,
  FileSignature,
  Send,
  UserX,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: any;
  badge?: string;
  adminOnly?: boolean;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, isMobileSidebarOpen, setMobileSidebarOpen } = useManagementStore();
  const role = currentUser.role;

  const isAllowed = (item: NavItem) => {
    if (item.adminOnly && role !== 'ADMIN') return false;
    return true;
  };

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  };

  const navGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Operations & Control',
      items: [
        { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
        { id: 'telehealth', label: 'Telehealth Consults', icon: Video, badge: 'WEBRTC', highlight: true },
        { id: 'voice-scribe', label: 'Clinical Voice Scribe', icon: Sparkles, badge: 'SPEECH', highlight: true },
        { id: 'participant-portal', label: 'Participant & Carer Portal', icon: HeartHandshake, badge: 'PORTAL' },
        { id: 'clients', label: 'NDIS Participants', icon: Users },
        { id: 'ndis-goals', label: 'NDIS Goal Tracker', icon: Target, badge: 'NEW' },
        { id: 'google-maps', label: 'Google Maps Routing', icon: MapPin, badge: 'MMM' },
        { id: 'case-notes', label: 'Clinical Case Notes', icon: FileText },
        { id: 'incidents', label: 'Incident Governance', icon: AlertTriangle, badge: 'PACE' },
      ],
    },
    {
      title: 'Clinical Practice & BSP',
      items: [
        { id: 'plan-report-writer', label: 'Plan Reassessment Writer', icon: FileText, badge: 'REPORT', highlight: true },
        { id: 'document-intelligence', label: 'Document Intelligence', icon: BrainCircuit, badge: 'OCR', highlight: true },
        { id: 'ai-radar', label: 'Caseload Risk Radar', icon: BrainCircuit, badge: 'RADAR' },
        { id: 'churn-radar', label: 'Retention & Churn Radar', icon: UserX, badge: 'ML' },
        { id: 'restrictive-practices', label: 'Restrictive Practices', icon: Lock, highlight: true },
        { id: 'abc-analyser', label: 'ABC Behaviour Analyser', icon: BarChart3 },
        { id: 'bsp-plans', label: 'BSP Plans & Generator', icon: FileSpreadsheet },
        { id: 'practice-tools', label: 'Practice Tools & Stories', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      title: 'Business & Governance',
      items: [
        { id: 'proda-gateway', label: 'PRODA Direct Gateway', icon: Send, badge: 'B2G', adminOnly: true, highlight: true },
        { id: 'agreements-signing', label: 'E-Signature Portal', icon: FileSignature, badge: 'SHA-256' },
        { id: 'google-workspace', label: 'Google Workspace Hub', icon: Globe, highlight: true, badge: 'OAUTH' },
        { id: 'google-classroom', label: 'Google Classroom', icon: GraduationCap, highlight: true, badge: 'ACADEMY' },
        { id: 'google-keep', label: 'Google Keep Notes', icon: StickyNote, highlight: true, badge: 'KEEP' },
        { id: 'ai-predictive-insights', label: 'AI Predictive Insights', icon: BrainCircuit, badge: 'AI' },
        { id: 'audit-simulator', label: 'NDIS Audit Simulator', icon: Award, badge: 'INSPECTOR', highlight: true },
        { id: 'audit', label: 'Compliance Dashboard', icon: Award, highlight: true },
        { id: 'crm', label: 'Intake & CRM Leads', icon: UserPlus },
        { id: 'billing', label: 'NDIS Billing Claims', icon: Receipt },
        { id: 'hr-roster', label: 'Practitioners & HR', icon: UserCheck, adminOnly: true },
        { id: 'audit-logs', label: 'Audit Trail Ledger', icon: ShieldCheck, adminOnly: true },
        { id: 'security-audit', label: 'Security & Access Audit', icon: Lock, badge: 'RECHARTS', adminOnly: true },
        { id: 'integrations', label: 'API Integrations & Hub', icon: Cpu, badge: 'GATEWAY', adminOnly: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Drawer on Mobile, Fixed column on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-0 text-slate-300 select-none shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between lg:hidden bg-slate-950/70">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">
            NDIS Navigation Menu
          </span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-5 overflow-y-auto flex-1">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = isAllowed(item);

                  return (
                    <button
                      key={item.id}
                      disabled={!allowed}
                      onClick={() => allowed && handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl lg:rounded-lg text-xs font-semibold transition-all min-h-[44px] lg:min-h-0 ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-sm'
                          : allowed
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-700'
                          : 'text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {!allowed ? (
                        <Lock className="w-3 h-3 text-slate-600 shrink-0 ml-1" />
                      ) : item.badge ? (
                        <span className="text-[10px] bg-slate-800 text-teal-400 px-1.5 py-0.5 rounded font-mono border border-slate-700 shrink-0">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Status Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>NDIS Quality Commission</span>
            <span className="text-emerald-400 font-bold font-mono">100% Compliant</span>
          </div>
          <p className="text-[10px] text-slate-500">Registration #: 405001234</p>
        </div>
      </aside>
    </>
  );
};
