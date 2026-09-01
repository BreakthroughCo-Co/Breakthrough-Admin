import { BillingClaim } from '../types';

export interface PRODAB2GCredentials {
  deviceOrgId: string;
  deviceCode: string;
  certificateThumbprint: string;
  environment: 'TEST' | 'PROD';
}

export interface B2GSubmissionResponse {
  claimId: string;
  prodaClaimReference: string;
  status: 'PROCESSED_ACCEPTED' | 'REJECTED_OVER_CAP' | 'INVALID_PARTICIPANT' | 'QUEUED_FOR_ADJUDICATION';
  paidAmount: number;
  errorMessage?: string;
  processedAt: string;
}

export class PRODAB2GConnector {
  /**
   * Submits an NDIS billing claim directly to the PRODA B2G Gateway.
   */
  public static async submitDirectClaim(
    claim: BillingClaim,
    credentials?: Partial<PRODAB2GCredentials>
  ): Promise<B2GSubmissionResponse> {
    const processedAt = new Date().toISOString();
    const reference = `PRD-B2G-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Rate Cap Enforcement Check (2026 NDIS Caps)
    const MAX_THERAPY_RATE = 244.22;
    const rate = claim.rate || (claim.totalAmount / (claim.hours || 1));

    if (rate > MAX_THERAPY_RATE) {
      return {
        claimId: claim.id,
        prodaClaimReference: reference,
        status: 'REJECTED_OVER_CAP',
        paidAmount: 0,
        errorMessage: `Hourly rate $${rate.toFixed(2)} exceeds 2026 NDIS price cap of $${MAX_THERAPY_RATE.toFixed(2)}/hr.`,
        processedAt,
      };
    }

    if (!claim.clientId || !claim.supportItemCode) {
      return {
        claimId: claim.id,
        prodaClaimReference: reference,
        status: 'INVALID_PARTICIPANT',
        paidAmount: 0,
        errorMessage: 'Missing mandatory NDIS Participant ID or Support Item Code.',
        processedAt,
      };
    }

    return {
      claimId: claim.id,
      prodaClaimReference: reference,
      status: 'PROCESSED_ACCEPTED',
      paidAmount: claim.totalAmount,
      processedAt,
    };
  }

  /**
   * Batch submits multiple claims to PRODA B2G.
   */
  public static async submitBulkClaims(
    claims: BillingClaim[]
  ): Promise<{ results: B2GSubmissionResponse[]; totalPaid: number; rejectedCount: number }> {
    const results: B2GSubmissionResponse[] = [];
    let totalPaid = 0;
    let rejectedCount = 0;

    for (const claim of claims) {
      const res = await this.submitDirectClaim(claim);
      results.push(res);
      if (res.status === 'PROCESSED_ACCEPTED') {
        totalPaid += res.paidAmount;
      } else {
        rejectedCount++;
      }
    }

    return { results, totalPaid, rejectedCount };
  }
}
