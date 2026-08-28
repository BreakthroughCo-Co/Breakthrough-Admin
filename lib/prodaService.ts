/**
 * Mock NDIS PRODA B2G Direct Batch Claim Submission & PACE Status Polling Service
 * 
 * Provides simulated programmatic submission of approved claims to NDIS PRODA PACE API,
 * real-time polling of batch processing statuses, and automated ledger reconciliation.
 * 
 * Production Note: To enable live PRODA B2G B2B API integrations:
 * 1. Provision PRODA Device B2G credentials via PRODA Portal.
 * 2. Set NDIS_PRODA_CLIENT_ID, NDIS_PRODA_KEYSTORE_PATH, NDIS_PRODA_ORG_ID, and NDIS_PRODA_DEVICE_NAME in environment.
 * 3. Mount PKI .p12 certificates into the container secure keystore.
 */

import { BillingClaim, ProdaBatchSubmission, ProdaProcessedClaim } from '@/types';

// Default pre-configured dummy PRODA credentials for sandbox testing
export const DUMMY_PRODA_CONFIG = {
  clientId: process.env.NDIS_PRODA_CLIENT_ID || 'DUMMY_PRODA_CLIENT_405001234',
  keystorePath: process.env.NDIS_PRODA_KEYSTORE_PATH || '/etc/proda/dummy_keystore.p12',
  deviceName: process.env.NDIS_PRODA_DEVICE_NAME || 'PRODA_DEV_DEVICE_01',
  orgId: process.env.NDIS_PRODA_ORG_ID || 'PR-9988120',
  providerRegNumber: '405001234',
  environment: 'PRODA_SANDBOX_MOCK'
};

// In-memory persistent batch store (for development & runtime session across API routes)
const batchStore = new Map<string, ProdaBatchSubmission>();
let batchCounter = 1000;

export class MockProdaService {
  /**
   * Retrieves active dummy PRODA configuration for current practice environment.
   */
  static getProdaConfig() {
    return { ...DUMMY_PRODA_CONFIG };
  }
  /**
   * Dispatches a batch of claims directly to NDIS PRODA PACE endpoint.
   */
  static submitBatch(
    claimIds: string[],
    claims: BillingClaim[] = [],
    providerRegNumber = '405001234'
  ): {
    batchId: string;
    status: 'Processing';
    submittedClaimsCount: number;
    timestamp: string;
    claims: ProdaProcessedClaim[];
  } {
    if (!claimIds || claimIds.length === 0) {
      throw new Error('INVALID_ARGUMENT: claimIds array cannot be empty');
    }

    batchCounter++;
    const batchId = `PRODA-PACE-BATCH-${batchCounter}-${Date.now().toString().slice(-4)}`;
    const targetClaims = claims.filter((c) => claimIds.includes(c.id));

    // Evaluate each claim against PACE schema & business rules
    const processedClaims: ProdaProcessedClaim[] = targetClaims.map((c) => {
      const isInvalid = !c.ndisNumber || c.ndisNumber.length < 8 || (c.unitRate && c.unitRate > 250);
      const paceRef = isInvalid
        ? null
        : `PACE-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      return {
        claimId: c.id,
        clientId: c.clientId,
        ndisNumber: c.ndisNumber,
        amount: c.totalAmount,
        status: isInvalid ? 'Rejected' : 'Paid',
        paceReference: paceRef,
        rejectionCode: isInvalid ? 'PACE_ERR_INVALID_RATE_OR_NDIS' : null,
        rejectionReason: isInvalid
          ? 'NDIS number invalid (< 8 chars) or rate exceeded maximum allowable cap ($250.00)'
          : null
      };
    });

    const approvedCount = processedClaims.filter((c) => c.status === 'Paid').length;
    const rejectedCount = processedClaims.filter((c) => c.status === 'Rejected').length;
    const timestamp = new Date().toISOString();

    const batch: ProdaBatchSubmission = {
      batchId,
      status: 'Processing',
      submittedAt: timestamp,
      submittedClaimsCount: targetClaims.length,
      approvedCount,
      rejectedCount,
      claims: processedClaims
    };

    batchStore.set(batchId, batch);

    return {
      batchId,
      status: 'Processing',
      submittedClaimsCount: targetClaims.length,
      timestamp,
      claims: processedClaims
    };
  }

  /**
   * Polls the live status of an NDIS PRODA PACE bulk claim batch.
   */
  static pollBatchStatus(batchId: string): ProdaBatchSubmission {
    const batch = batchStore.get(batchId);
    if (!batch) {
      // If batch not found in memory (e.g. submitted via external client or mock ID), generate synthetic completed batch
      const mockBatch: ProdaBatchSubmission = {
        batchId,
        status: 'Completed',
        submittedAt: new Date(Date.now() - 30000).toISOString(),
        completedAt: new Date().toISOString(),
        submittedClaimsCount: 1,
        approvedCount: 1,
        rejectedCount: 0,
        claims: [
          {
            claimId: 'claim-mock-1',
            status: 'Paid',
            paceReference: `PACE-TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            amount: 214.41
          }
        ]
      };
      return mockBatch;
    }

    // Automatically transition to Completed upon status poll
    batch.status = 'Completed';
    batch.completedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(batch));
  }

  /**
   * Reconciles PRODA batch results directly into a billing store / ledger.
   */
  static reconcileBatchWithLedger(
    batchResult: ProdaBatchSubmission,
    store: { billingClaims: BillingClaim[]; updateBillingClaim?: (id: string, updates: Partial<BillingClaim>) => void }
  ): number {
    let reconciledCount = 0;
    if (!batchResult || !batchResult.claims) return 0;

    for (const item of batchResult.claims) {
      const claim = store.billingClaims.find((c) => c.id === item.claimId);
      if (claim) {
        claim.status = item.status;
        claim.reconciliationStatus = item.status === 'Paid' ? 'Reconciled' : 'Failed';
        if (item.rejectionCode) {
          claim.reconciliationError = `${item.rejectionCode}: ${item.rejectionReason}`;
        }
        if (store.updateBillingClaim) {
          store.updateBillingClaim(claim.id, {
            status: item.status,
            reconciliationStatus: item.status === 'Paid' ? 'Reconciled' : 'Failed',
            reconciliationError: item.rejectionCode ? `${item.rejectionCode}: ${item.rejectionReason}` : undefined
          });
        }
        reconciledCount++;
      }
    }

    return reconciledCount;
  }

  /**
   * Generates official NDIS PRODA PACE XML payload for manual/B2G direct export.
   */
  static generateProdaXmlPayload(
    claims: BillingClaim[],
    batchId: string,
    providerRegNumber = '405001234'
  ): string {
    const timestamp = new Date().toISOString();
    const totalAmount = claims.reduce((s, c) => s + (c.totalAmount || 0), 0);

    const claimNodes = claims
      .map((c) => `    <PaymentRequest>
      <ClaimReferenceNumber>${c.invoiceNumber}</ClaimReferenceNumber>
      <ParticipantNDISNumber>${c.ndisNumber}</ParticipantNDISNumber>
      <ParticipantFullName>${escapeXml(c.clientName || 'Participant')}</ParticipantFullName>
      <SupportItemNumber>${c.supportItemCode}</SupportItemNumber>
      <ServiceStartDate>${c.serviceDate}</ServiceStartDate>
      <ServiceEndDate>${c.serviceDate}</ServiceEndDate>
      <QuantityHours>${(c.hours || 1).toFixed(2)}</QuantityHours>
      <UnitPriceRate>${(c.unitRate || 214.41).toFixed(2)}</UnitPriceRate>
      <TotalClaimAmount>${(c.totalAmount || 214.41).toFixed(2)}</TotalClaimAmount>
      <GSTCode>P1</GSTCode>
      <GSTDescription>NDIS GST-Free Supply</GSTDescription>
      <PractitionerRegistrationNumber>${c.practitionerId || 'PR-881902'}</PractitionerRegistrationNumber>
      <AuthorisedPractitionerName>${escapeXml(c.practitionerName || 'Authorized Practitioner')}</AuthorisedPractitionerName>
      <PACEApprovalStatus>${c.status}</PACEApprovalStatus>
    </PaymentRequest>`)
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
    <TotalClaimCount>${claims.length}</TotalClaimCount>
    <TotalClaimValue currency="AUD">${totalAmount.toFixed(2)}</TotalClaimValue>
  </Header>
  <PaymentRequests>
${claimNodes}
  </PaymentRequests>
</NDISBulkPaymentRequest>`;
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export const NDISProdaApiService = MockProdaService;
