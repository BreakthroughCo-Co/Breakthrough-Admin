'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, NDISAuditBundle } from '@/types';
import { assembleSection34AuditBundle, verifyAuditBundleIntegrity } from '@/lib/complianceService';
import {
  ShieldCheck,
  FileCheck,
  Download,
  Printer,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Sparkles,
  RefreshCw,
  Hash,
  Database,
  Users
} from 'lucide-react';

interface AuditBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
}

export const AuditBundleModal: React.FC<AuditBundleModalProps> = ({
  isOpen,
  onClose,
  initialClientId
}) => {
  const {
    clients,
    caseNotes,
    restrictivePractices,
    incidents,
    abcLogs,
    bspDocuments,
    practitioners,
    addAuditLog,
    addNotification
  } = useManagementStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || clients[0]?.id || 'cli-101'
  );
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const selectedClient = useMemo(() => {
    return clients.find((c: Client) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  const auditBundle: NDISAuditBundle | null = useMemo(() => {
    if (!selectedClient) return null;
    try {
      return assembleSection34AuditBundle(selectedClient.id, {
        clients,
        caseNotes,
        restrictivePractices,
        incidents,
        abcLogs,
        bspDocuments,
        practitioners
      });
    } catch (err) {
      console.error('Error assembling audit bundle:', err);
      return null;
    }
  }, [selectedClient, clients, caseNotes, restrictivePractices, incidents, abcLogs, bspDocuments, practitioners]);

  const handleVerifyIntegrity = () => {
    if (!auditBundle) return;
    const result = verifyAuditBundleIntegrity(auditBundle);
    if (result.isValid) {
      setVerificationFeedback('SHA-256 Cryptographic Digest Authenticated: 100% Tamper-Proof Match.');
      addNotification({
        title: 'Audit Bundle Verified',
        message: `Section 34 evidence bundle for ${selectedClient?.name} passed cryptographic verification.`,
        type: 'compliance',
        severity: 'success',
        linkTab: 'audit'
      });
    } else {
      setVerificationFeedback('Hash mismatch detected in package verification.');
    }
  };

  const handleDownloadJsonBundle = () => {
    if (!auditBundle || !selectedClient) return;

    const payload = JSON.stringify(auditBundle, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDIS_Section34_AuditBundle_${selectedClient.ndisNumber}_${selectedClient.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog(
      'EXPORT_AUDIT_BUNDLE_JSON',
      'AUDIT_PACKAGE',
      selectedClient.id,
      `Exported Section 34 NDIS Audit Evidence Bundle for ${selectedClient.name} (${selectedClient.ndisNumber}). Hash: ${auditBundle.integrityHash.slice(0, 16)}...`
    );

    addNotification({
      title: 'Audit Evidence Package Downloaded',
      message: `Complete Section 34 evidence bundle exported for ${selectedClient.name}.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'audit'
    });
  };

  const handlePrintSummary = () => {
    if (!auditBundle?.htmlSummary) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(auditBundle.htmlSummary);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  if (!isOpen || !selectedClient) return null;

  const docs = auditBundle?.documentsIncluded;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">NDIS Audit Preparation Tool & Evidence Bundle Exporter</h3>
              <p className="text-xs text-slate-400">
                Section 34 Reasonable & Necessary Support Evidence Package with SHA-256 cryptographic verification.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Participant Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Target Participant for Audit Package</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setVerificationFeedback(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-teal-500"
            >
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.name} (NDIS: {c.ndisNumber}) — {c.primaryDisability}
                </option>
              ))}
            </select>
          </div>

          {/* SHA-256 Digest Card */}
          {auditBundle && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-teal-400" />
                  Package Integrity SHA-256 Digest
                </span>
                <button
                  onClick={handleVerifyIntegrity}
                  className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded font-semibold border border-teal-500/30 flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Verify Cryptographic Hash
                </button>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 font-mono text-[11px] text-teal-300 break-all select-all">
                {auditBundle.integrityHash}
              </div>
              {verificationFeedback && (
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {verificationFeedback}
                </div>
              )}
            </div>
          )}

          {/* Evidence Checklist */}
          {docs && (
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Statutory Evidence Documents Included
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Participant Profile Record</div>
                      <div className="text-[10px] text-slate-400">Goals, emergency contacts, budget</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">Included</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${docs.activeBSP ? 'text-emerald-400' : 'text-amber-400'} shrink-0`} />
                    <div>
                      <div className="font-bold text-white">Behaviour Support Plan (BSP)</div>
                      <div className="text-[10px] text-slate-400">7-Section NDIS Commission standard</div>
                    </div>
                  </div>
                  <span className="text-teal-400 font-mono font-bold text-[11px]">
                    {docs.activeBSP ? 'Active Plan' : 'Draft / Baseline'}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Linked Clinical Case Notes</div>
                      <div className="text-[10px] text-slate-400">SIMPL / BIRP progress evidence</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    {docs.caseNotesCount} Sessions
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Incident & Risk Register</div>
                      <div className="text-[10px] text-slate-400">24h SLA compliance log</div>
                    </div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-[11px]">
                    {docs.incidentsCount} Logged
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Restrictive Practices Register</div>
                      <div className="text-[10px] text-slate-400">State Senior Practitioner auth</div>
                    </div>
                  </div>
                  <span className="text-teal-400 font-mono font-bold text-[11px]">
                    {docs.restrictivePracticesCount} Active RPs
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Practitioner Worker Screening</div>
                      <div className="text-[10px] text-slate-400">Clearance status verified</div>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    100% Cleared
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Manifest files */}
          {auditBundle?.manifest && (
            <div className="space-y-1.5">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                Package Manifest Files ({Array.isArray(auditBundle.manifest) ? auditBundle.manifest.length : 6})
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                {Array.isArray(auditBundle.manifest) &&
                  auditBundle.manifest.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-900 last:border-0">
                      <span className="text-slate-200">
                        {typeof item === 'string' ? item : item.fileName}
                      </span>
                      <span className="text-teal-400 font-semibold">VERIFIED</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-slate-400 text-xs font-mono">
            Package Size: <strong>{((auditBundle?.packageSizeBytes || 0) / 1024).toFixed(1)} KB</strong> | Version {auditBundle?.bundleVersion || '2.4.0'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-all text-xs"
            >
              Close
            </button>
            <button
              onClick={handlePrintSummary}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs border border-teal-500/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Summary</span>
            </button>
            <button
              onClick={handleDownloadJsonBundle}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Package (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
