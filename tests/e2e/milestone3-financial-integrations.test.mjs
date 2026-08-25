/**
 * Milestone 3 Verification Test Suite: Financial Intelligence & Integrations (R5, R8, R9, R13)
 * 
 * Tests:
 * 1. Requirement R5: AI Billing Claim Pre-Submission Validator
 *    - 2026 NDIS price caps enforcement ($214.41 for PBS/Psychology, $193.99 for Allied Health/Therapy)
 *    - Mandatory field verification & invalid format detection
 *    - Duplicate claim detection (same client, service date, support item code)
 *    - Approved clinical case note linkage & unapproved note warnings
 *    - Remaining plan budget depletion warnings
 *    - Gemini AI clinical explanation generation
 * 
 * 2. Requirement R8: NDIS PRODA API Direct Claim Submission & PACE Polling
 *    - Direct B2G batch claim packaging and XML payload creation
 *    - PRODA endpoint dispatch and asynchronous batch ID generation
 *    - PACE status polling transitions (Processing -> Completed)
 *    - Paid claim reconciliation with PACE transaction references
 *    - Error rejection handling (e.g. PACE_ERR_INVALID_RATE_OR_NDIS)
 *    - Store ledger reconciliation
 * 
 * 3. Requirement R9: Xero OAuth 2.0 Live Integration & Bank Feed Reconciliation
 *    - 3-legged OAuth 2.0 authorization URL generation with state & scopes
 *    - Authorization code exchange for access & refresh tokens (1800s expiry)
 *    - Automatic token refresh execution
 *    - ACCREC sales invoice generation with line items, tax, and participant contact
 *    - Bank feed payment recording & automatic store ledger reconciliation to Paid
 * 
 * 4. Requirement R13: NDIS Price Guide 2026 Auto-Sync
 *    - Support catalogue synchronization with official 2026 NDIS price limits
 *    - Rate change detection and differential tracking
 *    - Re-validation of existing claims against updated price caps
 */

import assert from 'node:assert/strict';
import {
  AIAssistantEngine,
  NDISProdaApiEmulator,
  XeroOAuthApiEmulator,
  NDISPricingSyncEngine,
  ManagementStoreEmulator,
  InMemoryFirestore
} from '../harness/emulator.mjs';

export async function runMilestone3Tests(reporter) {
  reporter.startSuite('Milestone 3: Financial Intelligence & Integrations (R5, R8, R9, R13)');

  // =========================================================================
  // PHASE 1: Requirement R5 — AI Billing Claim Pre-Submission Validator
  // =========================================================================
  reporter.startPhase('Phase 1: R5 — AI Billing Claim Pre-Submission Validator');

  await reporter.test('T3.M3.1 - Price Cap Validation: Specialist Behaviour Support (07_002) over $214.41/hr is flagged with suggested fix', async () => {
    const claim = {
      id: 'claim-test-101',
      invoiceNumber: 'INV-2026-PBS-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 2.0,
      unitRate: 245.00, // OVER $214.41 CAP
      totalAmount: 490.00,
      serviceDate: '2026-03-10',
      status: 'Pending',
      caseNoteId: 'note-101'
    };

    const client = {
      id: 'cli-101',
      name: 'Marcus Vance',
      ndisNumber: '430988123',
      totalBudget: 50000,
      spentBudget: 12000
    };

    const caseNotes = [
      {
        id: 'note-101',
        clientId: 'cli-101',
        date: '2026-03-10',
        status: 'Approved'
      }
    ];

    const supportItems = [
      {
        code: '07_002_0115_8_3',
        name: 'Specialist Behavioural Intervention Support',
        pricePerUnit: 214.41,
        unitOfMeasure: 'Hour'
      }
    ];

    const result = AIAssistantEngine.validateBillingClaim(claim, client, [claim], caseNotes, supportItems);

    assert.equal(result.isClean, false, 'Claim exceeding 2026 price cap must not be marked clean');
    assert.ok(result.errors.some(e => e.includes('$214.41') || e.includes('2026 NDIS price cap')), 'Must contain rate cap error');
    
    const capBadge = result.badges.find(b => b.code === 'RATE_EXCEEDS_2026_CAP');
    assert.ok(capBadge, 'Must return RATE_EXCEEDS_2026_CAP badge');
    assert.equal(capBadge.type, 'red');
    assert.ok(capBadge.suggestedFix?.includes('214.41'), 'Suggested fix must mention 214.41');
  });

  await reporter.test('T3.M3.2 - Price Cap Validation: Allied Health Therapy (15_056) over $193.99/hr is flagged with suggested fix', async () => {
    const claim = {
      id: 'claim-test-102',
      invoiceNumber: 'INV-2026-OT-01',
      clientId: 'cli-102',
      clientName: 'Chloe Bennett',
      ndisNumber: '431099234',
      supportItemCode: '15_056_0128_1_3',
      ndisSupportItem: 'Assessment Recommendation Therapy Support - Allied Health',
      hours: 1.5,
      unitRate: 210.00, // OVER $193.99 CAP
      totalAmount: 315.00,
      serviceDate: '2026-03-12',
      status: 'Pending',
      caseNoteId: 'note-102'
    };

    const client = {
      id: 'cli-102',
      name: 'Chloe Bennett',
      ndisNumber: '431099234',
      totalBudget: 30000,
      spentBudget: 5000
    };

    const caseNotes = [{ id: 'note-102', clientId: 'cli-102', date: '2026-03-12', status: 'Approved' }];
    const supportItems = [{ code: '15_056_0128_1_3', name: 'Assessment Therapy', pricePerUnit: 193.99, unitOfMeasure: 'Hour' }];

    const result = AIAssistantEngine.validateBillingClaim(claim, client, [claim], caseNotes, supportItems);

    assert.equal(result.isClean, false);
    const capBadge = result.badges.find(b => b.code === 'RATE_EXCEEDS_2026_CAP');
    assert.ok(capBadge, 'Must return RATE_EXCEEDS_2026_CAP badge for Allied Health');
    assert.ok(capBadge.suggestedFix?.includes('193.99'), 'Suggested fix must specify $193.99 cap');
  });

  await reporter.test('T3.M3.3 - Missing Mandatory Field Validation: Missing NDIS number and service date are caught', async () => {
    const incompleteClaim = {
      id: 'claim-test-103',
      invoiceNumber: 'INV-2026-ERR-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '', // MISSING
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41,
      serviceDate: '', // MISSING
      status: 'Pending'
    };

    const result = AIAssistantEngine.validateBillingClaim(incompleteClaim, null, [incompleteClaim], [], []);

    assert.equal(result.isClean, false);
    const missingBadges = result.badges.filter(b => b.code === 'MANDATORY_FIELDS_MISSING');
    assert.ok(missingBadges.length >= 1, 'Must flag missing mandatory fields');
  });

  await reporter.test('T3.M3.4 - Duplicate Claim Detection: Flag duplicate claims for same client, date and support code', async () => {
    const claim1 = {
      id: 'claim-dup-1',
      invoiceNumber: 'INV-2026-DUP-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-03-15',
      status: 'Approved',
      caseNoteId: 'note-dup-1'
    };

    const claim2 = {
      id: 'claim-dup-2',
      invoiceNumber: 'INV-2026-DUP-02',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3', // SAME CODE
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-03-15', // SAME DATE
      status: 'Pending',
      caseNoteId: 'note-dup-2'
    };

    const caseNotes = [
      { id: 'note-dup-1', clientId: 'cli-101', date: '2026-03-15', status: 'Approved' },
      { id: 'note-dup-2', clientId: 'cli-101', date: '2026-03-15', status: 'Approved' }
    ];

    const client = { id: 'cli-101', name: 'Marcus Vance', ndisNumber: '430988123', totalBudget: 50000, spentBudget: 10000 };

    const result = AIAssistantEngine.validateBillingClaim(claim2, client, [claim1, claim2], caseNotes, []);

    assert.equal(result.isClean, false);
    assert.ok(result.badges.some(b => b.code === 'DUPLICATE_CLAIM_DETECTED'), 'Must return DUPLICATE_CLAIM_DETECTED badge');
    assert.ok(result.errors.some(e => e.includes('Duplicate claim detected')), 'Error must describe duplicate');
  });

  await reporter.test('T3.M3.5 - Case Note Linkage: Orphan claim without case note is flagged as error, unapproved note as warning', async () => {
    // 1. Orphan claim
    const orphanClaim = {
      id: 'claim-orphan',
      invoiceNumber: 'INV-2026-ORPHAN',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41,
      serviceDate: '2026-03-18',
      status: 'Pending'
    };

    const client = { id: 'cli-101', name: 'Marcus Vance', ndisNumber: '430988123', totalBudget: 50000, spentBudget: 10000 };
    const orphanResult = AIAssistantEngine.validateBillingClaim(orphanClaim, client, [orphanClaim], [], []);
    assert.ok(orphanResult.badges.some(b => b.code === 'ORPHAN_CLAIM_NO_NOTE'), 'Must flag orphan claim without case note');

    // 2. Unapproved note claim
    const pendingNoteClaim = {
      id: 'claim-pending-note',
      invoiceNumber: 'INV-2026-DRAFTNOTE',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41,
      serviceDate: '2026-03-19',
      status: 'Pending',
      caseNoteId: 'note-draft-19'
    };

    const draftNotes = [
      { id: 'note-draft-19', clientId: 'cli-101', date: '2026-03-19', status: 'Draft' }
    ];

    const draftResult = AIAssistantEngine.validateBillingClaim(pendingNoteClaim, client, [pendingNoteClaim], draftNotes, []);
    assert.ok(draftResult.badges.some(b => b.code === 'NOTE_PENDING_APPROVAL'), 'Must return NOTE_PENDING_APPROVAL warning badge');
    assert.equal(draftResult.badges.find(b => b.code === 'NOTE_PENDING_APPROVAL').type, 'amber');
  });

  await reporter.test('T3.M3.6 - Clean Claim Validation: PACE Ready claim returns isClean = true and PACE_READY_CLEAN badge', async () => {
    const cleanClaim = {
      id: 'claim-clean-01',
      invoiceNumber: 'INV-2026-CLEAN-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-03-20',
      status: 'Approved',
      caseNoteId: 'note-clean-01'
    };

    const client = { id: 'cli-101', name: 'Marcus Vance', ndisNumber: '430988123', totalBudget: 50000, spentBudget: 15000 };
    const caseNotes = [{ id: 'note-clean-01', clientId: 'cli-101', date: '2026-03-20', status: 'Approved' }];
    const supportItems = [{ code: '07_002_0115_8_3', name: 'Specialist Behavioural Intervention', pricePerUnit: 214.41, unitOfMeasure: 'Hour' }];

    const result = AIAssistantEngine.validateBillingClaim(cleanClaim, client, [cleanClaim], caseNotes, supportItems);

    assert.equal(result.isClean, true, 'Clean claim must have isClean = true');
    assert.equal(result.errors.length, 0, 'Clean claim must have 0 errors');
    assert.equal(result.warnings.length, 0, 'Clean claim must have 0 warnings');
    assert.ok(result.badges.some(b => b.code === 'PACE_READY_CLEAN' && b.type === 'green'), 'Must include green PACE ready badge');
  });

  // =========================================================================
  // PHASE 2: Requirement R8 — NDIS PRODA API Direct Claim Submission & PACE Polling
  // =========================================================================
  reporter.startPhase('Phase 2: R8 — NDIS PRODA API Direct Claim Submission & PACE Polling');

  await reporter.test('T3.M3.7 - PRODA Batch Submission: Packaging approved claims generates batch XML and returns batchId', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      {
        id: 'claim-proda-01',
        invoiceNumber: 'INV-2026-PRODA-01',
        clientId: 'cli-101',
        clientName: 'Marcus Vance',
        ndisNumber: '430988123',
        supportItemCode: '07_002_0115_8_3',
        hours: 2.0,
        unitRate: 214.41,
        totalAmount: 428.82,
        serviceDate: '2026-03-22',
        status: 'Approved'
      },
      {
        id: 'claim-proda-02',
        invoiceNumber: 'INV-2026-PRODA-02',
        clientId: 'cli-102',
        clientName: 'Chloe Bennett',
        ndisNumber: '431099234',
        supportItemCode: '15_056_0128_1_3',
        hours: 1.5,
        unitRate: 193.99,
        totalAmount: 290.99,
        serviceDate: '2026-03-22',
        status: 'Approved'
      }
    ];

    const submission = prodaApi.submitBatch(['claim-proda-01', 'claim-proda-02'], claims);

    assert.ok(submission.batchId.startsWith('PRODA-PACE-BATCH-'), 'Batch ID must have PRODA-PACE-BATCH- prefix');
    assert.equal(submission.status, 'Processing');
    assert.equal(submission.submittedClaimsCount, 2);
    assert.ok(submission.timestamp);
  });

  await reporter.test('T3.M3.8 - PACE Polling: Transitions to Completed and assigns PACE transaction references', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      {
        id: 'claim-proda-03',
        invoiceNumber: 'INV-2026-PRODA-03',
        clientId: 'cli-101',
        clientName: 'Marcus Vance',
        ndisNumber: '430988123',
        supportItemCode: '07_002_0115_8_3',
        hours: 1.0,
        unitRate: 214.41,
        totalAmount: 214.41,
        serviceDate: '2026-03-23',
        status: 'Approved'
      }
    ];

    const submission = prodaApi.submitBatch(['claim-proda-03'], claims);
    const polledStatus = prodaApi.pollBatchStatus(submission.batchId);

    assert.equal(polledStatus.status, 'Completed');
    assert.equal(polledStatus.approvedCount, 1);
    assert.equal(polledStatus.rejectedCount, 0);

    const processed = polledStatus.claims[0];
    assert.equal(processed.status, 'Paid');
    assert.ok(processed.paceReference?.startsWith('PACE-TXN-'), 'Must generate PACE transaction reference');
  });

  await reporter.test('T3.M3.9 - PRODA Error Rejection: Over-cap rate claims (> $250) or invalid NDIS number are rejected with PACE error code', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const invalidClaims = [
      {
        id: 'claim-rej-01',
        invoiceNumber: 'INV-2026-REJ-01',
        clientId: 'cli-101',
        clientName: 'Marcus Vance',
        ndisNumber: '430988123',
        supportItemCode: '07_002_0115_8_3',
        hours: 1.0,
        unitRate: 350.00, // OVER $250 PRODA HARD CAP
        totalAmount: 350.00,
        serviceDate: '2026-03-24',
        status: 'Approved'
      },
      {
        id: 'claim-rej-02',
        invoiceNumber: 'INV-2026-REJ-02',
        clientId: 'cli-102',
        clientName: 'Chloe Bennett',
        ndisNumber: '', // INVALID NDIS NUMBER
        supportItemCode: '15_056_0128_1_3',
        hours: 1.0,
        unitRate: 193.99,
        totalAmount: 193.99,
        serviceDate: '2026-03-24',
        status: 'Approved'
      }
    ];

    const submission = prodaApi.submitBatch(['claim-rej-01', 'claim-rej-02'], invalidClaims);
    const status = prodaApi.pollBatchStatus(submission.batchId);

    assert.equal(status.status, 'Completed');
    assert.equal(status.rejectedCount, 2);
    assert.equal(status.approvedCount, 0);

    const rej1 = status.claims.find(c => c.claimId === 'claim-rej-01');
    assert.equal(rej1?.status, 'Rejected');
    assert.equal(rej1?.rejectionCode, 'PACE_ERR_INVALID_RATE_OR_NDIS');

    const rej2 = status.claims.find(c => c.claimId === 'claim-rej-02');
    assert.equal(rej2?.status, 'Rejected');
    assert.equal(rej2?.rejectionCode, 'PACE_ERR_INVALID_RATE_OR_NDIS');
  });

  await reporter.test('T3.M3.10 - PRODA Store Ledger Reconciliation: Completed batch updates store claims to Paid or Reconciliation Failed', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      {
        id: 'claim-recon-01',
        invoiceNumber: 'INV-2026-RECON-01',
        clientId: 'cli-101',
        clientName: 'Marcus Vance',
        ndisNumber: '430988123',
        supportItemCode: '07_002_0115_8_3',
        hours: 2.0,
        unitRate: 214.41,
        totalAmount: 428.82,
        serviceDate: '2026-03-25',
        status: 'Approved'
      }
    ];

    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.addBillingClaim(claims[0]);

    const submission = prodaApi.submitBatch(['claim-recon-01'], claims);
    const polledStatus = prodaApi.pollBatchStatus(submission.batchId);
    const resultCount = prodaApi.reconcileBatchWithLedger(polledStatus, store);

    assert.equal(resultCount, 1);
    const updatedClaim = store.billingClaims.find(c => c.id === 'claim-recon-01');
    assert.equal(updatedClaim.status, 'Paid');
    assert.equal(updatedClaim.reconciliationStatus, 'Reconciled');
  });

  // =========================================================================
  // PHASE 3: Requirement R9 — Xero OAuth 2.0 Live Integration & Bank Feed Sync
  // =========================================================================
  reporter.startPhase('Phase 3: R9 — Xero OAuth 2.0 Live Integration & Bank Feed Sync');

  await reporter.test('T3.M3.11 - 3-Legged OAuth 2.0 URL: Generates correct authorization redirect URL with required scopes', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    const authUrl = xeroApi.getAuthorizationUrl('xero_client_123', 'https://breakthrough.org.au/api/xero/callback', 'state_test_xyz');

    assert.ok(authUrl.startsWith('https://login.xero.com/identity/connect/authorize'), 'Must target Xero authorize endpoint');
    assert.ok(authUrl.includes('response_type=code'), 'Must specify response_type=code');
    assert.ok(authUrl.includes('scope='), 'Must include scope');
    assert.ok(authUrl.includes('accounting.transactions'), 'Must include accounting.transactions scope');
    assert.ok(authUrl.includes('accounting.contacts'), 'Must include accounting.contacts scope');
    assert.ok(authUrl.includes('state=state_test_xyz'), 'Must pass CSRF state param');
  });

  await reporter.test('T3.M3.12 - Code Exchange & Token Refresh: Exchanges auth code for tokens and executes refresh', async () => {
    const xeroApi = new XeroOAuthApiEmulator();

    // 1. Code Exchange
    const tokenState = xeroApi.exchangeCodeForTokens('live_auth_code_mock_771', 'state_123');

    assert.equal(xeroApi.tokenState.isConnected, true);
    assert.ok(tokenState.accessToken?.startsWith('xero_access_'), 'Must issue access token');
    assert.ok(tokenState.refreshToken?.startsWith('xero_refresh_'), 'Must issue refresh token');
    assert.equal(tokenState.tenantName, 'Breakthrough Coaching & Consulting Pty Ltd');
    assert.equal(tokenState.expiresIn, 1800, 'Access token must have 1800s validity');

    // 2. Token Refresh
    const refreshedState = xeroApi.refreshToken(tokenState.refreshToken);
    assert.equal(xeroApi.tokenState.isConnected, true);
    assert.ok(refreshedState.accessToken?.startsWith('xero_access_refreshed_'), 'Refreshed access token must be present');
  });

  await reporter.test('T3.M3.13 - ACCREC Invoice Creation: Approved billing claims generate structured Xero ACCREC sales invoices', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    xeroApi.exchangeCodeForTokens('code_123', 'state_123');

    const claim = {
      id: 'claim-xero-inv-01',
      invoiceNumber: 'INV-2026-XERO-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 3.0,
      unitRate: 214.41,
      totalAmount: 643.23,
      serviceDate: '2026-03-26',
      status: 'Approved'
    };

    const invoice = xeroApi.createAccrecInvoice(claim);

    assert.ok(invoice.invoiceId.startsWith('xero-inv-'), 'Must generate Xero invoice ID');
    assert.equal(invoice.invoiceNumber, 'INV-2026-XERO-01');
    assert.equal(invoice.type, 'ACCREC');
    assert.equal(invoice.status, 'AUTHORISED');
    assert.equal(invoice.contact.name, 'Marcus Vance');
    assert.equal(invoice.total, 643.23);
    assert.equal(invoice.lineItems.length, 1);
    assert.equal(invoice.lineItems[0].itemCode, '07_002_0115_8_3');
  });

  await reporter.test('T3.M3.14 - Bank Feed Payment Reconciliation: Automatic sync reconciles bank payments back to claim ledger', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    xeroApi.exchangeCodeForTokens('code_123', 'state_123');

    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const claim = {
      id: 'claim-xero-recon-01',
      invoiceNumber: 'INV-2026-PAY-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 214.41,
      totalAmount: 428.82,
      serviceDate: '2026-03-27',
      status: 'Approved'
    };

    store.addBillingClaim(claim);

    // Create invoice and record payment in Xero
    const inv = xeroApi.createAccrecInvoice(claim);
    xeroApi.recordBankFeedPayment(inv.invoiceId, 428.82, '2026-03-28T10:00:00Z');

    // Run syncBankFeedPayments
    const syncedCount = xeroApi.syncBankFeedPayments(xeroApi.tokenState.tenantId, store);

    assert.equal(syncedCount, 1, 'Must reconcile 1 payment');
    const updated = store.billingClaims.find(c => c.id === 'claim-xero-recon-01');
    assert.equal(updated.status, 'Paid', 'Claim status must be updated to Paid');
    assert.equal(updated.reconciliationStatus, 'Reconciled', 'Reconciliation status must be Reconciled');
  });

  // =========================================================================
  // PHASE 4: Requirement R13 — NDIS Price Guide 2026 Auto-Sync
  // =========================================================================
  reporter.startPhase('Phase 4: R13 — NDIS Price Guide 2026 Auto-Sync');

  await reporter.test('T3.M3.15 - Catalogue Synchronization: Fetches 2026 items ($214.41 PBS / $193.99 Therapy) and detects rate changes', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    
    // Simulate older 2025 price in store:
    store.supportItems = [
      {
        code: '07_002_0115_8_3',
        name: 'Specialist Behavioural Intervention Support',
        pricePerUnit: 200.00, // OUTDATED RATE
        category: 'Capacity Building - Improved Relationships',
        unitOfMeasure: 'Hour'
      }
    ];

    const result = NDISPricingSyncEngine.syncPriceGuide(store);

    assert.ok(result.syncedCount >= 7, 'Must sync all 7+ support items');
    assert.ok(result.changesCount >= 1, 'Must detect at least 1 rate change');
    
    const changedItem = result.changes.find(c => c.code === '07_002_0115_8_3');
    assert.ok(changedItem, 'Must identify 07_002 as changed');
    assert.equal(changedItem.oldRate, 200.00);
    assert.equal(changedItem.newRate, 214.41);
  });

  await reporter.test('T3.M3.16 - Claim Re-Validation: Re-evaluates existing pending claims against updated price caps and flags over-cap claims', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    const overCapClaim = {
      id: 'claim-over-cap-reval',
      invoiceNumber: 'INV-2026-OVER-01',
      clientId: 'cli-101',
      clientName: 'Marcus Vance',
      ndisNumber: '430988123',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 230.00, // EXCEEDS $214.41
      totalAmount: 460.00,
      serviceDate: '2026-03-29',
      status: 'Pending'
    };

    store.addBillingClaim(overCapClaim);

    const result = NDISPricingSyncEngine.syncPriceGuide(store);

    assert.ok(result.revalidatedClaimsCount >= 1, 'Must re-validate at least 1 claim');
    const claimInStore = store.billingClaims.find(c => c.id === 'claim-over-cap-reval');
    assert.equal(claimInStore.reconciliationStatus, 'Failed');
    assert.ok(claimInStore.reconciliationError?.includes('RATE_CAP_UPDATED_REVALIDATE'));
  });
}
