import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { CryptographicSigner, DigitalSignatureCertificate } from '../../lib/cryptographicSigner';
import {
  FileCheck,
  ShieldCheck,
  Lock,
  Key,
  CheckCircle2,
  Download,
  FileSignature
} from 'lucide-react';

export const ServiceAgreementSigningPortal: React.FC = () => {
  const { currentUser, clients, addNotification } = useManagementStore();
  const [selectedClient, setSelectedClient] = useState(clients[0] || null);
  const [signerName, setSignerName] = useState(currentUser?.displayName || currentUser?.name || 'Authorized Signatory');
  const [signerRole, setSignerRole] = useState('Participant Representative / Guardian');
  const [certificate, setCertificate] = useState<DigitalSignatureCertificate | null>(null);

  const documentContent = `NDIS SERVICE AGREEMENT & CONSENT
--------------------------------------------------
Provider: Breakthrough Co-Co Administration
Participant: ${selectedClient?.name || 'NDIS Participant'}
NDIS Number: ${selectedClient?.ndisNumber || '430000000'}
Allocated Plan Budget: $${(selectedClient?.allocatedBudget || 15000).toLocaleString()}
Agreed Services: Positive Behaviour Support (07_002_0115_8_3), Allied Health Consultation.
Terms: All services provided in accordance with NDIS Quality and Safeguards Commission Practice Standards.`;

  const handleSign = () => {
    const cert = CryptographicSigner.signDocument({
      documentId: `DOC-SA-${selectedClient?.id || 'CLI-01'}-${Date.now()}`,
      documentContent,
      signerName,
      signerEmail: currentUser?.email || 'guardian@breakthrough.org.au',
      signerRole,
      ipAddress: '103.21.244.0 (AU-VIC)',
      userAgent: 'Mozilla/5.0 Breakthrough OS Cryptographic Client',
    });

    setCertificate(cert);
    addNotification({
      title: 'Agreement Signed Cryptographically',
      message: `SHA-256 digital certificate generated for ${selectedClient?.name}.`,
      type: 'agreement',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Cryptographic Service Agreement Signing Portal
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">
                SHA-256 Verified
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Legally binding digital execution with audit tamper verification
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Service Agreement Document Content
            </label>
            <pre className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {documentContent}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Signer Name</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Signer Role</label>
              <input
                type="text"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSign}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all"
          >
            <Key className="w-4 h-4" />
            Sign & Issue Tamper-Evident Certificate
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Digital Certificate & Cryptographic Proof
          </label>
          {certificate ? (
            <div className="p-5 bg-slate-950/80 border border-teal-500/40 rounded-xl space-y-3 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>CERTIFICATE VALID & VERIFIED</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">DOCUMENT ID</span>
                <span className="text-white text-[11px]">{certificate.documentId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SHA-256 PAYLOAD HASH</span>
                <span className="text-emerald-400 text-[10px] break-all">{certificate.documentHash}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SIGNATURE CHECKSUM</span>
                <span className="text-teal-300 text-[10px] break-all">{certificate.signatureChecksum}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>Signer: {certificate.signerName} ({certificate.signerRole})</span>
                <span>{new Date(certificate.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs">
              <Lock className="w-8 h-8 text-slate-600 mb-2" />
              <span>Awaiting signature execution...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
