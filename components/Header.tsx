'use client';

import React, { useState } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { UserRole, UserProfile, AppNotification } from '@/types';
import {
  ShieldCheck,
  UserCheck,
  Activity,
  Search,
  Bell,
  Sun,
  Moon,
  Check,
  X,
  AlertTriangle,
  FileCheck,
  Clock,
  Sparkles,
  Database,
  Globe,
  LogIn,
  RefreshCw,
  Layers,
  Menu,
  Printer,
  Mic,
  Keyboard,
  LogOut
} from 'lucide-react';
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';
import { SessionTimer } from '@/components/SessionTimer';
import { ModuleExportModal } from '@/components/ModuleExportModal';
import { VoiceDictationBar } from '@/components/VoiceDictationBar';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

export const Header: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    setUserRole,
    signOutUser,
    setCommandPaletteOpen,
    notifications,
    markNotificationsRead,
    dismissNotification,
    setActiveTab,
    theme,
    toggleTheme,
    toggleMobileSidebar
  } = useManagementStore();

  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFloatingVoice, setShowFloatingVoice] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const unreadCount = notifications.filter((n: AppNotification) => !n.read).length;

  const handleNotificationClick = (linkTab?: string) => {
    if (linkTab) {
      setActiveTab(linkTab as TabType);
    }
    setShowNotifPopover(false);
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-40 flex items-center justify-between shadow-md">
        {/* Brand & Organization */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Navigation Drawer Hamburger Toggle */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4 text-teal-400" />
          </button>

          <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-md text-white font-black flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Breakthrough OS
              </h1>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-semibold">
                NDIS Clinical Allied Health
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Live bidirectional sync active with Firebase Firestore database">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Firestore Synced</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">
              Behaviour Support • Restrictive Practice Governance • PACE Compliant
            </p>
          </div>
        </div>

        {/* Center Search & Persistent Billable Session Timer */}
        <div className="hidden md:flex items-center gap-2.5 flex-1 max-w-lg mx-3">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex-1 flex items-center justify-between bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="truncate max-w-[140px] lg:max-w-none">Search participants, claims, notes...</span>
            </div>
            <kbd className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Session Timer Component */}
          <SessionTimer />
        </div>

        {/* User & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="sm:hidden p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
            title="Search"
          >
            <Search className="w-4 h-4 text-teal-400" />
          </button>

          {/* Voice Dictation Trigger */}
          <button
            onClick={() => setShowFloatingVoice(!showFloatingVoice)}
            className={`p-2 rounded-lg border text-xs font-bold transition-all ${
              showFloatingVoice
                ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                : 'bg-slate-950 border-slate-800 hover:border-teal-500/30 text-teal-400'
            }`}
            title="Toggle Voice-to-Text Speech Dictation"
            aria-label="Voice-to-text dictation"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Print / Export Report Trigger */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/30 rounded-lg text-xs font-bold text-slate-200 transition-all"
            title="Print to PDF or Export NDIS Compliance Report for the current module"
            id="header-export-report-btn"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden xl:inline">Export Report</span>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            id="keyboard-shortcuts-modal-trigger"
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-teal-500/30 rounded-lg text-slate-300 hover:text-white transition-all group"
            title="Keyboard Shortcuts (Press '?')"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4 text-teal-400 group-hover:scale-105 transition-transform" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Robust Top Right Connection & Sync Status Indicator */}
          <ConnectionStatusIndicator />

          {/* Real-time Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all relative"
              title="Real-time Compliance & Incident Notifications"
            >
              <Bell className="w-4 h-4 text-teal-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-white text-sm">Real-Time Alerts</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markNotificationsRead}
                      className="text-[10px] text-teal-400 hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">No notifications.</p>
                  ) : (
                    notifications.map((n: AppNotification) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.linkTab)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                          n.read ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-slate-800/90 border-teal-500/40 text-slate-200'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(n.id);
                          }}
                          className="absolute top-2 right-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${n.severity === 'high' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                          <span className="font-bold text-white text-xs">{n.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Quick Toggle */}
          <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 text-[10px] uppercase font-bold tracking-wider">
              Role:
            </span>
            {(['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR', 'VIEWER'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setUserRole(r)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  currentUser.role === r
                    ? r === 'ADMIN'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : r === 'PRACTITIONER'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : r === 'SUPPORT_COORDINATOR'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-700 text-slate-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'SUPPORT_COORDINATOR' ? 'COORD' : r}
              </button>
            ))}
          </div>

          {/* Google Workspace & Maps Quick Launcher */}
          <button
            onClick={() => setActiveTab('google-workspace')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all"
            title="Open Google Workspace Enterprise Hub (Drive, Sheets, Docs, Slides, Calendar, Gmail, Meet, Tasks, Maps)"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Google Hub</span>
          </button>

          {/* User Account Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800">
            <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <select
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {users.map((u: UserProfile) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => signOutUser()}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500/40 rounded-lg text-slate-400 hover:text-rose-400 transition-all"
            title="Sign Out of Breakthrough OS"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Voice Dictation Widget */}
      {showFloatingVoice && (
        <VoiceDictationBar floating={true} />
      )}

      {/* Print to PDF & Export Report Modal */}
      <ModuleExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
};
