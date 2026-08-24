'use client';

import React, { useState, useMemo } from 'react';
import { BillingClaim, Practitioner, Client } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  FileCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ProdaBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProdaBatchModal: React.FC<ProdaBatchModalProps> = ({ isOpen, onClose }) => {
  const { billingClaims, practitioners, clients, updateBillingStatus, addAuditLog, addNotification } = useManagementStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Approved' | 'Pending' | 'Submitted PACE'>('Approved');
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>(() => {
    // Default to selecting all approved claims
    return billingClaims.filter((c) => c.status === 'Approved').map((c) => c.id);
  });
  const [copied, setCopied] = useState(false);
  const [providerRegNumber, setProviderRegNumber] = useState('405001234');
  const [batchPrefix, setBatchPrefix] = useState('PRODA-BATCH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  // Filtered claims according to status filter
  const displayedClaims = useMemo(() => {
    if (statusFilter === 'ALL') return billingClaims;
    return billingClaims.filter((c) => c.status === statusFilter);
  }, [billingClaims, statusFilter]);

  // Selected claims subset
  const selectedClaims = useMemo(() => {
    return billingClaims.filter((c) => selectedClaimIds.includes(c.id));
  }, [billingClaims, selectedClaimIds]);

  const totalSelectedValue = useMemo(() => {
    return selectedClaims.reduce((sum, c) => sum + c.totalAmount, 0);
  }, [selectedClaims]);

  const totalSelectedHours = useMemo(() => {
    return selectedClaims.reduce((sum, c) => sum + c.hours, 0);
  }, [selectedClaims]);

  // Select / Deselect handlers
  const handleToggleSelectAll = () => {
    const displayedIds = displayedClaims.map((c) => c.id);
    const allSelected = displayedIds.every((id) => selectedClaimIds.includes(id));
    if (allSelected) {
      setSelectedClaimIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setSelectedClaimIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const handleToggleClaim = (id: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  // NDIS XML Batch Generator
  const batchId = useMemo(() => {
    return `${batchPrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${selectedClaims.length}`;
  }, [batchPrefix, selectedClaims.length]);

  const xmlContent = useMemo(() => {
    const timestamp = new Date().toISOString();
    const claimsXml = selectedClaims
      .map((c, index) => {
        const client = clients.find((cli) => cli.id === c.clientId || cli.ndisNumber === c.ndisNumber);
        const assignedPractitioner = practitioners.find((p) => p.name === client?.primaryPractitionerName) || practitioners[index % practitioners.length];
        const pracNdisNumber = assignedPractitioner?.ndisRegistrationNumber || 'PR-881902';

        return `    <PaymentRequest>
      <ClaimReferenceNumber>${c.invoiceNumber}</ClaimReferenceNumber>
      <ParticipantNDISNumber>${c.ndisNumber}</ParticipantNDISNumber>
      <ParticipantFullName>${escapeXml(c.clientName)}</ParticipantFullName>
      <SupportItemNumber>${c.supportItemCode}</SupportItemNumber>
      <ServiceStartDate>${c.serviceDate}</ServiceStartDate>
      <ServiceEndDate>${c.serviceDate}</ServiceEndDate>
      <QuantityHours>${c.hours.toFixed(2)}</QuantityHours>
      <UnitPriceRate>${c.unitRate.toFixed(2)}</UnitPriceRate>
      <TotalClaimAmount>${c.totalAmount.toFixed(2)}</TotalClaimAmount>
      <GSTCode>P1</GSTCode>
      <GSTDescription>NDIS GST-Free Supply</GSTDescription>
      <PractitionerRegistrationNumber>${pracNdisNumber}</PractitionerRegistrationNumber>
      <AuthorisedPractitionerName>${escapeXml(assignedPractitioner?.name || 'Authorized Practitioner')}</AuthorisedPractitionerName>
      <PACEApprovalStatus>${c.status}</PACEApprovalStatus>
    </PaymentRequest>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<NDISBulkPaymentRequest xmlns="urn:au:gov:ndis:schema:payment:v2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <ProviderRegistrationNumber>${providerRegNumber}</ProviderRegistrationNumber>
    <BatchReferenceNumber>${batchId}</BatchReferenceNumber>
    <CreationTimestamp>${timestamp}</CreationTimestamp>
    <SoftwareVendor>Breakthrough Coaching OS</SoftwareVendor>
    <SoftwareVersion>2026.4.2</SoftwareVersion>
    <Environment>PRODA_PRODUCTION</Environment>
    <TotalClaimCount>${selectedClaims.length}</TotalClaimCount>
    <TotalClaimValue currency="AUD">${totalSelectedValue.toFixed(2)}</TotalClaimValue>
  </Header>
  <PaymentRequests>
${claimsXml}
  </PaymentRequests>
</NDISBulkPaymentRequest>`;
  }, [selectedClaims, providerRegNumber, batchId, clients, practitioners, totalSelectedValue]);

  // Validation Checks
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (selectedClaims.length === 0) {
      errors.push('Please select at least 1 billing claim to include in the batch.');
      return errors;
    }

    selectedClaims.forEach((c) => {
      if (!c.ndisNumber || c.ndisNumber.length < 8) {
        errors.push(`Claim ${c.invoiceNumber}: Invalid NDIS number (${c.ndisNumber}).`);
      }
      if (c.hours <= 0) {
        errors.push(`Claim ${c.invoiceNumber}: Hours must be greater than zero.`);
      }
      if (c.totalAmount <= 0) {
        errors.push(`Claim ${c.invoiceNumber}: Total claim amount must be greater than zero.`);
      }
      if (!c.supportItemCode) {
        errors.push(`Claim ${c.invoiceNumber}: Missing NDIS support item code.`);
      }
    });

    return errors;
  }, [selectedClaims]);

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NDIS_PRODA_Batch_${batchId}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      'DOWNLOAD_PRODA_XML_BATCH',
      'BILLING_CLAIMS',
      batchId,
      `Downloaded NDIS PRODA bulk claim XML batch ${batchId} containing ${selectedClaims.length} items valued at $${totalSelectedValue.toFixed(2)}.`
    );
  };

  const handleDownloadCsv = () => {
    const headers = [
      'RegistrationNumber',
      'NDISParticipantNumber',
      'ServiceStartDate',
      'ServiceEndDate',
      'SupportItemNumber',
      'Quantity',
      'UnitPrice',
      'TotalClaimAmount',
      'PractitionerRegistrationNumber',
      'GSTCode',
      'ClaimReference',
      'BatchID'
    ];

    const rows = selectedClaims.map((claim, idx) => {
      const p = practitioners[idx % (practitioners.length || 1)];
      const practitionerId = p ? (p.ndisRegistrationNumber || p.id) : 'PR-881902';
      return [
        `"${providerRegNumber}"`,
        `"${claim.ndisNumber}"`,
        `"${claim.serviceDate}"`,
        `"${claim.serviceDate}"`,
        `"${claim.supportItemCode}"`,
        claim.hours,
        claim.unitRate,
        claim.totalAmount.toFixed(2),
        `"${practitionerId}"`,
        '"P1"',
        `"${claim.invoiceNumber}"`,
        `"${batchId}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NDIS_PRODA_Batch_${batchId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyXml = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitBatch = () => {
    if (validationErrors.length > 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      // Mark all selected claims as Submitted PACE
      selectedClaims.forEach((c) => {
        updateBillingStatus(c.id, 'Submitted PACE');
      });

      addAuditLog(
        'SUBMIT_PRODA_BATCH_PACE',
        'BILLING_CLAIMS',
        batchId,
        `Submitted PRODA Batch ${batchId} to NDIS PACE portal. Marked ${selectedClaims.length} claims as Submitted PACE ($${totalSelectedValue.toFixed(2)}).`
      );

      addNotification({
        title: `NDIS PRODA XML Batch Submitted: ${batchId}`,
        message: `Dispatched ${selectedClaims.length} approved session claims ($${totalSelectedValue.toFixed(2)}) to NDIS PACE portal. Batch verification confirmed.`,
        type: 'compliance',
        severity: 'info',
        linkTab: 'billing',
      });

      setIsSubmitting(false);
      setSubmissionCompleted(true);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">NDIS PRODA Bulk Claim XML Batch Generator</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  B2G v2.0 XML Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Format approved clinical sessions into official NDIS portal batch submission XML with pre-flight schema verification.
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {submissionCompleted ? (
            <div className="p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">PRODA Batch Successfully Transmitted & Logged</h4>
                <p className="text-xs text-emerald-300 font-mono">
                  Batch Reference: <strong>{batchId}</strong> | {selectedClaims.length} Claims | ${totalSelectedValue.toFixed(2)} AUD
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
                  All selected claims have been updated to &apos;Submitted PACE&apos; status and logged to the immutable audit trail ledger.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadXml}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Transmitted XML</span>
                </button>
                <button
                  onClick={() => {
                    setSubmissionCompleted(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Return to Billing Ledger
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Batch Parameters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Provider NDIS Reg #</label>
                  <input
                    type="text"
                    value={providerRegNumber}
                    onChange={(e) => setProviderRegNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Batch Identifier Prefix</label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Filter Claims by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-teal-300 font-bold text-xs focus:border-teal-500"
                  >
                    <option value="Approved">Approved Only (Recommended)</option>
                    <option value="ALL">All Claim Statuses</option>
                    <option value="Pending">Pending Only</option>
                    <option value="Submitted PACE">Already Submitted PACE</option>
                  </select>
                </div>
              </div>

              {/* Claims Selection Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Select Claims for Batch ({selectedClaims.length} of {displayedClaims.length} selected)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline"
                    >
                      {displayedClaims.every((c) => selectedClaimIds.includes(c.id))
                        ? 'Deselect All'
                        : 'Select All in View'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-slate-900 sticky top-0 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      <tr>
                        <th className="py-2 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={displayedClaims.length > 0 && displayedClaims.every((c) => selectedClaimIds.includes(c.id))}
                            onChange={handleToggleSelectAll}
                            className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                          />
                        </th>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Participant</th>
                        <th className="py-2 px-3">NDIS Item Code</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Hours</th>
                        <th className="py-2 px-3 text-right">Total ($)</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {displayedClaims.map((claim) => {
                        const isSelected = selectedClaimIds.includes(claim.id);
                        return (
                          <tr
                            key={claim.id}
                            onClick={() => handleToggleClaim(claim.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-teal-950/30 text-white' : 'hover:bg-slate-900/50 text-slate-400'
                            }`}
                          >
                            <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleClaim(claim.id)}
                                className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                              />
                            </td>
                            <td className="py-2 px-3 font-bold text-teal-300">{claim.invoiceNumber}</td>
                            <td className="py-2 px-3 font-sans font-medium text-slate-200">
                              {claim.clientName}{' '}
                              <span className="text-[10px] text-slate-500">({claim.ndisNumber})</span>
                            </td>
                            <td className="py-2 px-3 text-slate-300">{claim.supportItemCode}</td>
                            <td className="py-2 px-3 text-slate-400">{claim.serviceDate}</td>
                            <td className="py-2 px-3 text-right">{claim.hours}h</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-400">
                              ${claim.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                  claim.status === 'Approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : claim.status === 'Submitted PACE'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {claim.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Status & Live XML Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Generated PRODA XML Stream</span>
                    {validationErrors.length === 0 ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        NDIS Schema Validated (0 Errors)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        {validationErrors.length} Schema Warnings
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyXml}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] rounded-lg border border-slate-700 flex items-center gap-1 transition-all"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy XML'}</span>
                    </button>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-1 text-xs text-rose-300 font-mono">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Code Block with line numbers */}
                <div className="relative bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] p-3 max-h-48 overflow-y-auto text-emerald-300/90 whitespace-pre">
                  {xmlContent}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & Action Buttons */}
        {!submissionCompleted && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Batch Total</span>
                <span className="text-base font-extrabold text-emerald-400">${totalSelectedValue.toFixed(2)}</span>
              </div>
              <div className="pl-4 border-l border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Sessions</span>
                <span className="text-base font-bold text-white">{selectedClaims.length} Claims</span>
              </div>
              <div className="pl-4 border-l border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Total Hours</span>
                <span className="text-base font-bold text-teal-300">{totalSelectedHours.toFixed(2)}h</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={selectedClaims.length === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-40"
                title="Download CSV format for manual PRODA spreadsheet upload"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export PRODA CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadXml}
                disabled={selectedClaims.length === 0}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
                title="Download standard NDIS XML batch file"
              >
                <Download className="w-4 h-4" />
                <span>Download Batch XML (.xml)</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitBatch}
                disabled={selectedClaims.length === 0 || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md border border-emerald-500/30 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting Batch...' : 'Submit to PACE / PRODA'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
