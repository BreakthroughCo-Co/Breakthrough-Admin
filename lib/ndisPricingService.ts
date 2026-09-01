/**
 * NDIS Price Guide Auto-Sync & Rate Diff Engine
 * 
 * Fetches latest 2026 support item catalogue, detects rate differentials,
 * updates local pricing tables, and re-validates existing pending/approved claims.
 */

import { BillingClaim, NDISPriceGuideSyncResult, NDISSupportItem } from '@/types';
import { OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/lib/seedData';

export class NDISPricingSyncEngine {
  /**
   * Fetches latest 2026 published NDIS support item rates.
   */
  static fetchLatestPriceGuide(): NDISSupportItem[] {
    return OFFICIAL_2026_NDIS_PRICE_GUIDE.map((item) => ({
      ...item
    }));
  }

  /**
   * Synchronizes pricing catalogue with store, detects rate differentials,
   * and triggers claim re-validation against updated price caps.
   */
  static syncPriceGuide(
    store: {
      supportItems: NDISSupportItem[];
      billingClaims: BillingClaim[];
      updateBillingClaim?: (id: string, updates: Partial<BillingClaim>) => void;
      addNotification?: (notif: any) => void;
    },
    updatedCatalogue: NDISSupportItem[] | null = null
  ): NDISPriceGuideSyncResult {
    const catalogue = updatedCatalogue || this.fetchLatestPriceGuide();
    const changes: Array<{
      code: string;
      name: string;
      oldRate: number;
      newRate: number;
    }> = [];

    const currentItems = store.supportItems || [];

    for (const newItem of catalogue) {
      const existing = currentItems.find((s) => s.code === newItem.code);
      if (existing && Math.abs(existing.pricePerUnit - newItem.pricePerUnit) > 0.001) {
        changes.push({
          code: newItem.code,
          name: newItem.name,
          oldRate: existing.pricePerUnit,
          newRate: newItem.pricePerUnit
        });
        existing.pricePerUnit = newItem.pricePerUnit;
      }
    }

    // Update store items
    store.supportItems = catalogue;

    // Re-validate existing pending and approved claims
    let revalidatedClaimsCount = 0;
    const claims = store.billingClaims || [];

    for (const claim of claims) {
      if (claim.status === 'Pending' || claim.status === 'Approved') {
        const item = catalogue.find((c) => c.code === claim.supportItemCode);
        if (item && claim.unitRate > item.pricePerUnit) {
          claim.status = 'Pending';
          claim.validationFlag = 'RATE_CAP_UPDATED_REVALIDATE';
          claim.reconciliationError = `Rate $${claim.unitRate.toFixed(2)} exceeds updated 2026 NDIS cap $${item.pricePerUnit.toFixed(2)}`;
          if (store.updateBillingClaim) {
            store.updateBillingClaim(claim.id, {
              status: 'Pending',
              validationFlag: 'RATE_CAP_UPDATED_REVALIDATE',
              reconciliationError: `Rate $${claim.unitRate.toFixed(2)} exceeds updated 2026 NDIS cap $${item.pricePerUnit.toFixed(2)}`
            });
          }
        }
        revalidatedClaimsCount++;
      }
    }

    if (changes.length > 0 && store.addNotification) {
      store.addNotification({
        title: `NDIS Price Guide Updated: ${changes.length} Rate Changes`,
        message: `Catalogue synchronized with 2026 NDIS pricing. Re-validated ${revalidatedClaimsCount} claims.`,
        type: 'billing',
        severity: 'info',
        linkTab: 'billing'
      });
    }

    return {
      syncedCount: catalogue.length,
      changesCount: changes.length,
      changes,
      revalidatedClaimsCount,
      timestamp: new Date().toISOString()
    };
  }
}
