'use client';

import React, { useState, useRef } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client } from '@/types';
import {
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  X,
  FileText,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HardDrive,
  Cloud,
  Check
} from 'lucide-react';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntakeWizard: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenIntakeWizard
}) => {
  const {
    clients,
    caseNotes,
    incidents,
    billingClaims,
    clearAllMockData,
    loadDemoData,
    importClientsFromCSV,
    exportFullDatabaseJSON,
    exportClientsCSV,
    generateParticipantTemplateCSV,
    isUsingMockData,
    addNotification
  } = useManagementStore();

  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleWipeDatabase = () => {
    clearAllMockData();
    setConfirmClear(false);
    addNotification({
      title: 'Database Reset to Clean State',
      message: 'All demo mock data removed. You can now build your genuine NDIS participant database.',
      type: 'general',
      severity: 'medium'
    });
    onClose();
  };

  const handleRestoreDemo = () => {
    loadDemoData();
    addNotification({
      title: 'Demo Data Restored',
      message: 'Sample NDIS participants, case notes, and billing records loaded for review.',
      type: 'general',
      severity: 'low'
    });
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateParticipantTemplateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ndis_participant_import_template_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = exportClientsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ndis_participants_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonStr = exportFullDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ndis_business_database_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus('Reading uploaded file...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.clients) || Array.isArray(parsed)) {
            const clientList = Array.isArray(parsed.clients) ? parsed.clients : parsed;
            clientList.forEach((c: Client) => {
              useManagementStore.getState().addClient(c);
            });
            setImportStatus(`Successfully imported ${clientList.length} participants from JSON.`);
          } else {
            throw new Error('Unrecognized JSON database structure');
          }
        } else {
          // CSV Import
          const count = importClientsFromCSV(text);
          setImportStatus(`Successfully parsed and imported ${count} NDIS participants from CSV.`);
        }
      } catch (err: any) {
        setImportStatus(`Import Error: ${err.message || 'Failed to parse file'}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>NDIS Participant Database & Migration Center</span>
                {isUsingMockData ? (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-medium">
                    Demo Mode Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-medium">
                    Production Database
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Manage your real NDIS business records, clear demo data, import spreadsheets, or backup data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Overview Stats */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[11px]">Total Participants</span>
            <strong className="text-xl font-mono text-white">{clients.length}</strong>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[11px]">Clinical Case Notes</span>
            <strong className="text-xl font-mono text-teal-400">{caseNotes.length}</strong>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[11px]">Incidents & Audits</span>
            <strong className="text-xl font-mono text-amber-400">{incidents.length}</strong>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-500 block text-[11px]">Billing Claims</span>
            <strong className="text-xl font-mono text-emerald-400">{billingClaims.length}</strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[70vh] text-xs">
          {/* Action 1: Onboard Real Participant */}
          <div className="bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Interactive Participant Intake Wizard</h3>
              </div>
              <p className="text-slate-300 text-xs">
                Guided questionnaire asking the essential questions to fill in: demographics, NDIS plan dates, funding budgets, support coordinators, clinical triggers, and goals.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenIntakeWizard();
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all shrink-0 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Intake Wizard</span>
            </button>
          </div>

          {/* Action 2: Wipe Demo Data & Start Fresh */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Start Fresh / Remove All Mock Demo Data</h3>
              </div>
            </div>
            <p className="text-slate-400 text-xs">
              Permanently clears the sample mock participants (Jordan Miller, Samantha Reed, etc.) and gives you a completely clean, empty database ready for your actual NDIS participants and clinical records.
            </p>

            {confirmClear ? (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Are you sure you want to wipe all demo records?</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  This will clear all current participants, case notes, and billing records to start a blank database. You can re-populate sample data later if needed.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleWipeDatabase}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-sm"
                  >
                    Yes, Wipe All Demo Data
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setConfirmClear(true)}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Demo Mock Data</span>
                </button>
                {clients.length === 0 && (
                  <button
                    onClick={handleRestoreDemo}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
                  >
                    Load Sample Demo Data
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action 3: Import Participants via CSV / JSON */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Import Existing Participant Database (CSV / JSON)</h3>
            </div>
            <p className="text-slate-400 text-xs">
              Upload your participant roster spreadsheet. Supports standard NDIS column headers (Name, NDIS Number, DOB, Disability, Budget, Contact).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-2 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-teal-400" />
                <span>Upload CSV or JSON File</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 inline-flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {importStatus && (
              <div className="mt-2 p-2.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

          {/* Action 4: Full Database Backup & Export */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Export & Backup Database</h3>
            </div>
            <p className="text-slate-400 text-xs">
              Download your complete operational records anytime for audit readiness or off-site backups.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Participants (CSV)</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 inline-flex items-center gap-2 transition-all"
              >
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>Export Full Backup (JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Firebase Firestore & Local Cache Connected</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
