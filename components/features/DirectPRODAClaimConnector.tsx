import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { BillingClaim } from '../../types';
import { PRODAB2GConnector, B2GSubmissionResponse } from '../../lib/prodaB2GConnector';
import {
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Lock
} from 'lucide-react';

export const DirectPRODAClaimConnector: React.FC = () => {
  const { billingClaims, updateBillingClaim, addNotification } = useManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<B2GSubmissionResponse[]>([]);

  const pendingClaims = billingClaims.filter((c) => c.status === 'Pending' || c.status === 'Draft');

  const handleBulkSubmit = async () => {
    if (pendingClaims.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = await PRODAB2GConnector.submitBulkClaims(pendingClaims);
      setSubmissionResults(response.results);

      for (const res of response.results) {
        if (res.status === 'PROCESSED_ACCEPTED') {
          updateBillingClaim(res.claimId, {
            status: 'Approved',
            reconciliationStatus: 'Reconciled',
            invoiceNumber: res.prodaClaimReference,
          });
        } else {
          updateBillingClaim(res.claimId, {
            status: 'Rejected',
            flaggedReason: res.errorMessage || 'PRODA B2G Rejection',
          });
        }
      }

      addNotification({
        title: 'PRODA B2G Direct Batch Completed',
        message: `Successfully processed ${response.results.length - response.rejectedCount} claims ($${response.totalPaid.toFixed(2)}).`,
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: 'PRODA B2G Gateway Error',
        message: err.message || 'Failed to connect to PRODA Gateway.',
        type: 'warning',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              PRODA B2G Direct API Gateway
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                PKI-Encrypted
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Direct machine-to-machine claim transmission & instant payment adjudication
            </p>
          </div>
        </div>

        <button
          onClick={handleBulkSubmit}
          disabled={isSubmitting || pendingClaims.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all text-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Submitting to PRODA...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit {pendingClaims.length} Direct Claims
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Gateway Endpoint</span>
          <p className="text-sm font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            https://b2g.servicesaustralia.gov.au/ndis/v2
          </p>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Digital Certificate</span>
          <p className="text-sm font-semibold text-white mt-1">
            Breakthrough-Admin-PRODA.p12 (Active)
          </p>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Queued for Direct Dispatch</span>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">
            {pendingClaims.length} Claims ($
            {pendingClaims.reduce((acc, c) => acc + (c.totalAmount || 0), 0).toFixed(2)})
          </p>
        </div>
      </div>

      {submissionResults.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Latest PRODA B2G Adjudication Ledger
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {submissionResults.map((res, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {res.status === 'PROCESSED_ACCEPTED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono text-slate-300 font-medium">{res.prodaClaimReference}</span>
                    <p className="text-slate-400 text-[11px]">{res.errorMessage || 'Adjudicated & Cleared for Remittance'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${res.status === 'PROCESSED_ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${res.paidAmount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-500">{new Date(res.processedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
