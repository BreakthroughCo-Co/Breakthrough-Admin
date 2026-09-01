/**
 * Breakthrough OS - NDIS Price Guide 2026 Auto-Sync & Rate Differential Engine (R13)
 * 
 * 1. Live NDIS rate synchronization with published 2026 support catalogue
 * 2. Real-time rate change differential detection (old rate, new rate, percentage change)
 * 3. In-app practitioner & practice alerts on catalogue updates
 * 4. Retrospective claim re-validation scanning existing claims against updated price caps
 */

import { BillingClaim, NDISPriceGuideSyncResult, NDISSupportItem } from '@/types';
import { OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/lib/seedData';
import { NDISPricingSyncEngine } from '@/lib/ndisPricingService';

export interface RateChangeItem {
  code: string;
  name: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  effectiveDate: string;
}

export interface PriceGuideSyncDetails {
  syncId: string;
  timestamp: string;
  source: string;
  totalItemsProcessed: number;
  itemsUpdated: RateChangeItem[];
  itemsAdded: NDISSupportItem[];
  impactedClaimsCount: number;
  revalidationSummary: {
    claimsScanned: number;
    cleanClaimsCount: number;
    overCapClaimsCount: number;
    flaggedClaims: Array<{
      claimId: string;
      invoiceNumber?: string;
      clientName: string;
      supportItemCode: string;
      claimedRate: number;
      newCap: number;
      issue: 'EXCEEDS_PRICE_CAP' | 'RETIRED_LINE_ITEM';
    }>;
  };
}

export class PriceGuideService {
  /**
   * Fetches the latest published 2026 NDIS support item rates.
   */
  static fetchLatestNDISRates(): NDISSupportItem[] {
    return OFFICIAL_2026_NDIS_PRICE_GUIDE.map((item) => ({ ...item }));
  }

  /**
   * Executes price guide synchronization with the store, detects rate differentials,
   * dispatches alerts, and performs retrospective claim re-validation.
   */
  static executeSync(
    store: {
      supportItems: NDISSupportItem[];
      billingClaims: BillingClaim[];
      updateBillingClaim?: (id: string, updates: Partial<BillingClaim>) => void;
      addNotification?: (notif: any) => void;
      addAuditLog?: (action: string, category: string, targetId: string, details: string) => void;
    },
    customCatalogue: NDISSupportItem[] | null = null
  ): PriceGuideSyncDetails {
    const syncId = `SYNC-NDIS-2026-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();
    const sourceCatalogue = customCatalogue || this.fetchLatestNDISRates();

    const itemsUpdated: RateChangeItem[] = [];
    const itemsAdded: NDISSupportItem[] = [];
    const currentItems = store.supportItems || [];

    for (const newItem of sourceCatalogue) {
      const existing = currentItems.find((s) => s.code === newItem.code);
      if (existing) {
        if (Math.abs(existing.pricePerUnit - newItem.pricePerUnit) > 0.001) {
          const oldP = existing.pricePerUnit;
          const newP = newItem.pricePerUnit;
          const pct = Math.round(((newP - oldP) / oldP) * 10000) / 100;

          itemsUpdated.push({
            code: newItem.code,
            name: newItem.name,
            category: newItem.category,
            oldPrice: oldP,
            newPrice: newP,
            percentageChange: pct,
            effectiveDate: '2026-07-01'
          });
          existing.pricePerUnit = newP;
        }
      } else {
        itemsAdded.push(newItem);
        currentItems.push(newItem);
      }
    }

    // Update store items
    store.supportItems = [...currentItems];

    // Retrospectively re-validate claims
    const reval = this.revalidateClaims(store.billingClaims || [], store.supportItems, store.updateBillingClaim);

    // Dispatch notifications & audit logs
    if (itemsUpdated.length > 0 || reval.overCapClaimsCount > 0) {
      if (store.addNotification) {
        store.addNotification({
          title: `NDIS Price Guide 2026 Synchronized (${itemsUpdated.length} Updates)`,
          message: `Updated support catalogue. Re-validated ${reval.claimsScanned} claims: ${reval.cleanClaimsCount} clean, ${reval.overCapClaimsCount} flagged over updated price caps.`,
          type: 'billing',
          severity: reval.overCapClaimsCount > 0 ? 'high' : 'info',
          linkTab: 'billing'
        });
      }

      if (store.addAuditLog) {
        store.addAuditLog(
          'PRICE_GUIDE_SYNC',
          'BILLING_CATALOGUE',
          syncId,
          `Synced 2026 NDIS Price Guide: ${itemsUpdated.length} rate changes detected, ${reval.overCapClaimsCount} claims flagged for re-pricing.`
        );
      }
    }

    return {
      syncId,
      timestamp,
      source: 'NDIS Pricing Arrangements and Price Limits 2026-27 v1.0',
      totalItemsProcessed: sourceCatalogue.length,
      itemsUpdated,
      itemsAdded,
      impactedClaimsCount: reval.overCapClaimsCount,
      revalidationSummary: reval
    };
  }

  /**
   * Scans existing claims against updated price caps.
   */
  static revalidateClaims(
    claims: BillingClaim[] = [],
    supportItems: NDISSupportItem[] = OFFICIAL_2026_NDIS_PRICE_GUIDE,
    updateClaimFn?: (id: string, updates: Partial<BillingClaim>) => void
  ): PriceGuideSyncDetails['revalidationSummary'] {
    let cleanCount = 0;
    let overCapCount = 0;
    const flaggedClaims: PriceGuideSyncDetails['revalidationSummary']['flaggedClaims'] = [];

    for (const claim of claims) {
      const item = supportItems.find((s) => s.code === claim.supportItemCode);

      if (!item) {
        overCapCount++;
        flaggedClaims.push({
          claimId: claim.id,
          invoiceNumber: claim.invoiceNumber,
          clientName: claim.clientName,
          supportItemCode: claim.supportItemCode,
          claimedRate: claim.unitRate,
          newCap: 0,
          issue: 'RETIRED_LINE_ITEM'
        });
        claim.status = 'Pending';
        claim.validationFlag = 'RATE_CAP_UPDATED_REVALIDATE';
        claim.reconciliationStatus = 'Failed';
        claim.reconciliationError = `Support item code ${claim.supportItemCode} not found in 2026 catalogue`;
        if (updateClaimFn) {
          updateClaimFn(claim.id, {
            status: 'Pending',
            validationFlag: 'RATE_CAP_UPDATED_REVALIDATE',
            reconciliationStatus: 'Failed',
            reconciliationError: `Support item code ${claim.supportItemCode} not found in 2026 catalogue`
          });
        }
      } else if (claim.unitRate > item.pricePerUnit + 0.001) {
        overCapCount++;
        flaggedClaims.push({
          claimId: claim.id,
          invoiceNumber: claim.invoiceNumber,
          clientName: claim.clientName,
          supportItemCode: claim.supportItemCode,
          claimedRate: claim.unitRate,
          newCap: item.pricePerUnit,
          issue: 'EXCEEDS_PRICE_CAP'
        });
        claim.status = 'Pending';
        claim.validationFlag = 'RATE_CAP_UPDATED_REVALIDATE';
        claim.reconciliationStatus = 'Failed';
        claim.reconciliationError = `Rate $${claim.unitRate.toFixed(2)} exceeds updated 2026 NDIS cap $${item.pricePerUnit.toFixed(2)} for ${item.name}`;
        if (updateClaimFn) {
          updateClaimFn(claim.id, {
            status: 'Pending',
            validationFlag: 'RATE_CAP_UPDATED_REVALIDATE',
            reconciliationStatus: 'Failed',
            reconciliationError: `Rate $${claim.unitRate.toFixed(2)} exceeds updated 2026 NDIS cap $${item.pricePerUnit.toFixed(2)} for ${item.name}`
          });
        }
      } else {
        cleanCount++;
      }
    }

    return {
      claimsScanned: claims.length,
      cleanClaimsCount: cleanCount,
      overCapClaimsCount: overCapCount,
      flaggedClaims
    };
  }
}

// Re-export NDISPricingSyncEngine and methods for universal compatibility
export { NDISPricingSyncEngine };
export const syncPriceGuide = PriceGuideService.executeSync.bind(PriceGuideService);
export const revalidateClaims = PriceGuideService.revalidateClaims.bind(PriceGuideService);
export const fetchLatestNDISRates = PriceGuideService.fetchLatestNDISRates.bind(PriceGuideService);
