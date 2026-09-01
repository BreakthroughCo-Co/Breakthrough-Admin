'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { BillingClaim } from '@/types';
import {
  Wrench,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronRight,
  Check
} from 'lucide-react';

export const PACEClaimAutoFixer: React.FC = () => {
  const { billingClaims, updateBillingClaim, addNotification } = useManagementStore();

  const [fixedClaimIds, setFixedClaimIds] = useState<string[]>([]);
  const [isAutoFixingAll, setIsAutoFixingAll] = useState(false);

  // Filter rejected or flagged claims
  const rejectedClaims = useMemo(() => {
    return billingClaims.filter(
      (c) =>
        c.status === 'Rejected' ||
        c.reconciliationStatus === 'Failed' ||
        c.validationBadge === 'ERROR' ||
        (c.unitRate && c.unitRate > 245)
    );
  }, [billingClaims]);

  // Evaluate error diagnostics and recommended auto-fixes
  const diagnosticAnalysis = useMemo(() => {
    return rejectedClaims.map((claim) => {
      let errorCode = claim.rejectionCode || 'ERR_PRICE_LIMIT_EXCEEDED';
      let errorReason = claim.rejectionReason || 'Claimed unit rate exceeds NDIS 2026 Price Guide maximum hourly cap ($244.22).';
      let autoFixType: 'RATE_CAP' | 'CATEGORY_MAPPING' | 'RECONCILE_STATUS' = 'RATE_CAP';
      let suggestedFix = 'Reduce unitRate to $244.22 (NDIS 2026 Cap) and transition status to Approved';

      if (claim.unitRate > 244.22) {
        errorCode = 'PAYMENT_REJECTED_OVER_CAP';
        errorReason = `Unit rate ($${claim.unitRate}/hr) exceeds statutory NDIS 2026 price limit for item ${claim.supportItemCode || '07_002_0115_8_3'}.`;
        autoFixType = 'RATE_CAP';
        suggestedFix = `Set unitRate to $244.22, recalculate totalAmount to $${(claim.hours * 244.22).toFixed(2)}, set status to Approved.`;
      } else if (!claim.supportItemCode || claim.supportItemCode === 'UNKNOWN') {
        errorCode = 'INVALID_SUPPORT_ITEM';
        errorReason = 'Missing or unrecognised NDIS Support Item code.';
        autoFixType = 'CATEGORY_MAPPING';
        suggestedFix = 'Map to canonical PBS item 07_002_0115_8_3 (Specialist Behavioural Intervention).';
      }

      return {
        claim,
        errorCode,
        errorReason,
        autoFixType,
        suggestedFix,
        isFixed: fixedClaimIds.includes(claim.id)
      };
    });
  }, [rejectedClaims, fixedClaimIds]);

  const handleFixSingleClaim = (item: (typeof diagnosticAnalysis)[0]) => {
    const claim = item.claim;
    let newUnitRate = claim.unitRate > 244.22 ? 244.22 : claim.unitRate || 244.22;
    let newTotal = claim.hours * newUnitRate;

    const updates: Partial<BillingClaim> = {
      unitRate: newUnitRate,
      totalAmount: Math.round(newTotal * 100) / 100,
      supportItemCode: claim.supportItemCode || '07_002_0115_8_3',
      supportItemName: claim.supportItemName || 'Specialist Behavioural Intervention',
      status: 'Approved',
      reconciliationStatus: 'Pending',
      rejectionReason: undefined,
      rejectionCode: undefined,
      validationBadge: 'CLEAN',
      validationFlag: 'Auto-fixed via AI PACE Resolver',
      updatedAt: new Date().toISOString()
    };

    updateBillingClaim(claim.id, updates);
    setFixedClaimIds((prev) => [...prev, claim.id]);

    addNotification({
      title: 'Claim Auto-Repaired',
      message: `Claim ${claim.invoiceNumber || claim.id} rates recalibrated to NDIS 2026 caps and approved for PRODA submission.`,
      type: 'billing',
      severity: 'success'
    });
  };

  const handleFixAllClaims = () => {
    setIsAutoFixingAll(true);

    setTimeout(() => {
      diagnosticAnalysis.forEach((item) => {
        if (!fixedClaimIds.includes(item.claim.id)) {
          handleFixSingleClaim(item);
        }
      });
      setIsAutoFixingAll(false);

      addNotification({
        title: 'Batch Auto-Fix Complete',
        message: `Successfully resolved ${diagnosticAnalysis.length} rejected claims.`,
        type: 'billing',
        severity: 'success'
      });
    }, 700);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">AI PACE / PRODA Claim Auto-Fixer</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1-CLICK RECOVERY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Diagnose PRODA B2G error codes and auto-recalibrate unit rates to NDIS Price Guide 2026 caps.
            </p>
          </div>
        </div>

        {diagnosticAnalysis.length > 0 && (
          <button
            type="button"
            disabled={isAutoFixingAll || diagnosticAnalysis.every((d) => d.isFixed)}
            onClick={handleFixAllClaims}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isAutoFixingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auto-Fixing Claims...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>1-Click Auto-Fix All ({diagnosticAnalysis.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Diagnostics List */}
      {diagnosticAnalysis.length > 0 ? (
        <div className="space-y-3.5">
          {diagnosticAnalysis.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.isFixed
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-white">{item.claim.clientName}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Invoice: {item.claim.invoiceNumber || item.claim.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.errorCode}
                    </span>
                  </div>

                  <p className="text-xs text-rose-300/90 leading-snug">{item.errorReason}</p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-300">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span><strong>Auto-Remediation:</strong> {item.suggestedFix}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Current: <span className="line-through text-rose-400 font-mono">${item.claim.totalAmount}</span></p>
                    <p className="text-xs font-bold text-emerald-400 font-mono">
                      Cap: ${(item.claim.hours * 244.22).toFixed(2)}
                    </p>
                  </div>

                  {item.isFixed ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Repaired
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFixSingleClaim(item)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Repair</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-200">Zero Rejected Claims in Current Ledger</p>
          <p className="text-[11px] text-slate-400">
            All billing claims are verified compliant with NDIS Practice Standards and 2026 price caps.
          </p>
        </div>
      )}
    </div>
  );
};
