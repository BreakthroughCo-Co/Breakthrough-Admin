import { BillingClaim } from '../types';

export interface IndexationImpactReport {
  indexationPercentage: number;
  effectiveDate: string;
  totalClaimsAudited: number;
  totalRevenueLiftAmount: number;
  updatedRateSchedule: Array<{
    supportCode: string;
    description: string;
    previousRate: number;
    indexedNewRate: number;
  }>;
}

export class PriceIndexationEngine {
  /**
   * Applies NDIA Annual Price Guide percentage indexation across support items.
   */
  public static calculateIndexationImpact(
    claims: BillingClaim[],
    indexationPercentage: number = 3.75,
    effectiveDate: string = '2026-07-01'
  ): IndexationImpactReport {
    const rateSchedule = [
      {
        supportCode: '07_002_0115_8_3',
        description: 'Specialist Positive Behaviour Support',
        previousRate: 214.41,
        indexedNewRate: Math.round(214.41 * (1 + indexationPercentage / 100) * 100) / 100,
      },
      {
        supportCode: '15_056_0128_1_3',
        description: 'Assessment Recommendation Therapy (OT/Speech)',
        previousRate: 193.99,
        indexedNewRate: Math.round(193.99 * (1 + indexationPercentage / 100) * 100) / 100,
      },
      {
        supportCode: '07_799_0115_8_3',
        description: 'Provider Travel - Capacity Building',
        previousRate: 214.41,
        indexedNewRate: Math.round(214.41 * (1 + indexationPercentage / 100) * 100) / 100,
      },
    ];

    let totalLift = 0;
    for (const claim of claims) {
      const claimAmount = claim.totalAmount || (claim.hours || 1) * (claim.unitRate || 214.41);
      totalLift += claimAmount * (indexationPercentage / 100);
    }

    return {
      indexationPercentage,
      effectiveDate,
      totalClaimsAudited: claims.length,
      totalRevenueLiftAmount: Math.round(totalLift * 100) / 100,
      updatedRateSchedule: rateSchedule,
    };
  }
}
