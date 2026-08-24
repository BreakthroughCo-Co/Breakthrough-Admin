'use client';

import React, { useEffect } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import {
  Keyboard,
  X,
  Search,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Globe,
  Mic,
  Printer,
  Moon,
  Clock,
  Sparkles,
  Command,
  Plus,
  Lock,
  Activity,
  UserCheck,
  Compass
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    setActiveTab,
    setCommandPaletteOpen,
    toggleTheme
  } = useManagementStore();

  // Listen for Escape or '?' key to toggle/close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === '?' && !isInputActive) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          const modalTrigger = document.getElementById('keyboard-shortcuts-modal-trigger');
          modalTrigger?.click();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: 'General & Global Actions',
      items: [
        {
          label: 'Open Command Palette & Cross-Module Search',
          keys: ['Ctrl', 'K'],
          macKeys: ['⌘', 'K'],
          icon: <Search className="w-3.5 h-3.5 text-teal-400" />,
          action: () => {
            onClose();
            setCommandPaletteOpen(true);
          }
        },
        {
          label: 'Quick Actions Speed Dial (Create Client / Note / Incident)',
          keys: ['Ctrl', 'N'],
          macKeys: ['⌘', 'N'],
          icon: <Plus className="w-3.5 h-3.5 text-emerald-400" />,
          action: () => {
            onClose();
            const btn = document.getElementById('floating-quick-actions-trigger');
            btn?.click();
          }
        },
        {
          label: 'Toggle Keyboard Shortcuts Reference',
          keys: ['?'],
          macKeys: ['?'],
          icon: <Keyboard className="w-3.5 h-3.5 text-sky-400" />,
          action: () => onClose()
        },
        {
          label: 'Close Active Modal / Popover',
          keys: ['Esc'],
          macKeys: ['Esc'],
          icon: <X className="w-3.5 h-3.5 text-slate-400" />,
          action: () => onClose()
        },
        {
          label: 'Toggle Dark / Light Workspace Theme',
          keys: ['Ctrl', 'Shift', 'D'],
          macKeys: ['⌘', 'Shift', 'D'],
          icon: <Moon className="w-3.5 h-3.5 text-amber-400" />,
          action: () => toggleTheme()
        }
      ]
    },
    {
      category: 'Direct Module Key Combinations',
      items: [
        {
          label: 'Participants & NDIS Caseload',
          keys: ['Ctrl', '1'],
          macKeys: ['⌘', '1'],
          icon: <Users className="w-3.5 h-3.5 text-teal-400" />,
          action: () => {
            onClose();
            setActiveTab('clients');
          }
        },
        {
          label: 'Clinical Case Notes (SIMPL / SOAP / BIRP)',
          keys: ['Ctrl', '2'],
          macKeys: ['⌘', '2'],
          icon: <FileText className="w-3.5 h-3.5 text-sky-400" />,
          action: () => {
            onClose();
            setActiveTab('case-notes');
          }
        },
        {
          label: 'NDIS Billing, PRODA & Claims',
          keys: ['Ctrl', '3'],
          macKeys: ['⌘', '3'],
          icon: <CreditCard className="w-3.5 h-3.5 text-emerald-400" />,
          action: () => {
            onClose();
            setActiveTab('billing');
          }
        },
        {
          label: 'Incidents & NDIS 24h/5-Day SLAs',
          keys: ['Ctrl', '4'],
          macKeys: ['⌘', '4'],
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          action: () => {
            onClose();
            setActiveTab('incidents');
          }
        },
        {
          label: 'Quality Audits & Compliance Dashboard',
          keys: ['Ctrl', '5'],
          macKeys: ['⌘', '5'],
          icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
          action: () => {
            onClose();
            setActiveTab('audit');
          }
        },
        {
          label: 'Restrictive Practices Governance',
          keys: ['Ctrl', '6'],
          macKeys: ['⌘', '6'],
          icon: <Lock className="w-3.5 h-3.5 text-amber-400" />,
          action: () => {
            onClose();
            setActiveTab('restrictive-practices');
          }
        },
        {
          label: 'Behaviour Support Plans (BSP)',
          keys: ['Ctrl', '7'],
          macKeys: ['⌘', '7'],
          icon: <Activity className="w-3.5 h-3.5 text-indigo-400" />,
          action: () => {
            onClose();
            setActiveTab('bsp-plans');
          }
        },
        {
          label: 'Google Workspace Enterprise Hub',
          keys: ['Ctrl', '8'],
          macKeys: ['⌘', '8'],
          icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
          action: () => {
            onClose();
            setActiveTab('google-workspace');
          }
        },
        {
          label: 'Practice Command Center',
          keys: ['Ctrl', '9'],
          macKeys: ['⌘', '9'],
          icon: <Compass className="w-3.5 h-3.5 text-teal-400" />,
          action: () => {
            onClose();
            setActiveTab('command-center');
          }
        },
        {
          label: 'HR & Practitioner Roster',
          keys: ['Ctrl', '0'],
          macKeys: ['⌘', '0'],
          icon: <UserCheck className="w-3.5 h-3.5 text-emerald-400" />,
          action: () => {
            onClose();
            setActiveTab('hr-roster');
          }
        }
      ]
    },
    {
      category: 'Clinical Productivity & Tools',
      items: [
        {
          label: 'Export Current Module Report / PDF Digest',
          keys: ['Ctrl', 'P'],
          macKeys: ['⌘', 'P'],
          icon: <Printer className="w-3.5 h-3.5 text-teal-400" />,
          action: () => {
            onClose();
            const printBtn = document.getElementById('header-export-report-btn');
            printBtn?.click();
          }
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Keyboard Shortcuts Manager
                <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-teal-300 border border-slate-700 rounded">
                  ?
                </kbd>
              </h2>
              <p className="text-xs text-slate-400">Quickly navigate Breakthrough OS using key combinations (Ctrl or ⌘)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            aria-label="Close Shortcuts Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {shortcutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                {group.category}
              </h3>
              <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800/60">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={item.action}
                    className="flex items-center justify-between p-2.5 sm:p-3 text-xs text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 text-[11px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700 rounded shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">?</kbd> anytime to toggle this cheatsheet</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
