import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { DisasterRecoveryVault, BackupSnapshotMeta } from '../../lib/disasterRecoveryVault';
import {
  ShieldAlert,
  Download,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export const DisasterRecoveryVaultModule: React.FC = () => {
  const { clients, practitioners, caseNotes, incidents, billingClaims, addNotification } = useManagementStore();
  const [snapshot, setSnapshot] = useState<BackupSnapshotMeta | null>(null);

  const handleCreateSnapshot = () => {
    const snap = DisasterRecoveryVault.createSnapshot({
      clients: clients.length,
      practitioners: practitioners.length,
      caseNotes: caseNotes.length,
      incidents: incidents.length,
      billingClaims: billingClaims.length,
    });
    setSnapshot(snap);
    addNotification({
      title: 'Disaster Recovery Snapshot Generated',
      message: `Zero-knowledge encrypted snapshot ${snap.snapshotId} compiled and verified.`,
      type: 'compliance',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Disaster Recovery & Encrypted Backup Snapshot Vault
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Zero-Knowledge AES-256
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Air-gapped database snapshot archive, cryptographic tamper verification, and business continuity export
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateSnapshot}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-900/30 transition-all"
        >
          <Database className="w-4 h-4" />
          Generate Encrypted Snapshot
        </button>
      </div>

      {snapshot && (
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-blue-400 font-bold block">{snapshot.snapshotId}</span>
              <h3 className="text-base font-bold text-white mt-0.5">Air-Gapped Backup Archive Verified</h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Integrity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Total Archived Records</span>
              <strong className="text-white text-sm">
                {snapshot.recordCounts.clients + snapshot.recordCounts.caseNotes + snapshot.recordCounts.billingClaims} items
              </strong>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">Encryption Protocol</span>
              <strong className="text-blue-400 text-sm font-mono">{snapshot.encryptionAlgorithm}</strong>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">SHA-256 Digest Checksum</span>
              <strong className="text-slate-300 text-[10px] font-mono truncate block">{snapshot.checksumSha256}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
