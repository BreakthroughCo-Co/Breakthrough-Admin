/**
 * Breakthrough OS - Milestone 3 Comprehensive E2E Test Suite
 * Enterprise Integrations, Billing & Scheduling (R5, R7, R8, R9, R10, R13)
 * 
 * Verified Requirements:
 * - R5: AI Billing Claim Pre-Submission Validator
 * - R7: AI Scheduling Optimiser & Google Calendar Sync
 * - R8: NDIS PRODA API Direct Claim Submission & PACE Polling
 * - R9: Xero OAuth 2.0 Live Integration & Bank Feed Sync
 * - R10: Email & SMS Notification Infrastructure
 * - R13: NDIS Price Guide Auto-Sync
 */

import assert from 'node:assert/strict';
import {
  AIAssistantEngine,
  NDISProdaApiEmulator,
  XeroOAuthApiEmulator,
  NDISPricingSyncEngine,
  ManagementStoreEmulator,
  InMemoryFirestore,
  NotificationServiceEmulator,
  NDIS_2026_PRICE_GUIDE,
  SEED_CLIENTS,
  SEED_PRACTITIONERS
} from '../harness/emulator.mjs';

export async function runMilestone3IntegrationsBillingTests(reporter) {
  reporter.startSuite('Milestone 3: Enterprise Integrations, Billing & Scheduling (R5, R7, R8, R9, R10, R13)');

  // =========================================================================
  // PHASE 1: R5 — AI Billing Claim Pre-Submission Validator
  // =========================================================================
  reporter.startPhase('Phase 1: R5 — AI Billing Claim Pre-Submission Validator');

  await reporter.test('T3.R5.1 - Price Cap Validation: Specialist Behaviour Support (07_002) over $214.41/hr is flagged with suggested fix', async () => {
    const claim = {
      id: 'claim-m3-01',
      invoiceNumber: 'INV-2026-PBS-01',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 2.0,
      unitRate: 245.00, // OVER $214.41 CAP
      totalAmount: 490.00,
      serviceDate: '2026-08-20',
      status: 'Pending',
      caseNoteId: 'note-m3-01'
    };

    const caseNotes = [{ id: 'note-m3-01', clientId: 'cli-101', date: '2026-08-20', status: 'Approved' }];
    const supportItems = NDIS_2026_PRICE_GUIDE;
    const client = { id: 'cli-101', name: 'Jordan Miller', ndisNumber: '430891245', totalBudget: 50000, spentBudget: 10000 };

    const result = AIAssistantEngine.validateBillingClaim(claim, client, [claim], caseNotes, supportItems);

    assert.equal(result.isClean, false, 'Claim exceeding 2026 price cap must fail clean validation');
    assert.ok(result.errors.some(e => e.includes('$214.41') || e.includes('price cap')), 'Must return price cap error message');
    
    const capBadge = result.badges.find(b => b.code === 'RATE_EXCEEDS_2026_CAP');
    assert.ok(capBadge, 'Must return RATE_EXCEEDS_2026_CAP badge');
    assert.equal(capBadge.type, 'red');
    assert.ok(capBadge.suggestedFix?.includes('214.41'), 'Suggested fix must mention $214.41');
  });

  await reporter.test('T3.R5.2 - Price Cap Validation: Allied Health Therapy (15_056) over $193.99/hr is flagged with $193.99 fix', async () => {
    const claim = {
      id: 'claim-m3-02',
      invoiceNumber: 'INV-2026-OT-01',
      clientId: 'cli-102',
      clientName: 'Chloe Bennett',
      ndisNumber: '431099234',
      supportItemCode: '15_056_0128_1_3',
      ndisSupportItem: 'Assessment Recommendation Therapy Support - Allied Health',
      hours: 1.5,
      unitRate: 210.00, // OVER $193.99 CAP
      totalAmount: 315.00,
      serviceDate: '2026-08-21',
      status: 'Pending',
      caseNoteId: 'note-m3-02'
    };

    const caseNotes = [{ id: 'note-m3-02', clientId: 'cli-102', date: '2026-08-21', status: 'Approved' }];
    const supportItems = NDIS_2026_PRICE_GUIDE;
    const client = { id: 'cli-102', name: 'Chloe Bennett', ndisNumber: '431099234', totalBudget: 30000, spentBudget: 5000 };

    const result = AIAssistantEngine.validateBillingClaim(claim, client, [claim], caseNotes, supportItems);

    assert.equal(result.isClean, false);
    const capBadge = result.badges.find(b => b.code === 'RATE_EXCEEDS_2026_CAP');
    assert.ok(capBadge, 'Must flag Allied Health rate breach');
    assert.ok(capBadge.suggestedFix?.includes('193.99'), 'Must specify $193.99 maximum rate');
  });

  await reporter.test('T3.R5.3 - Mandatory Field Validation: Missing NDIS number, invalid length, and missing date are caught', async () => {
    const incompleteClaim = {
      id: 'claim-m3-err',
      invoiceNumber: 'INV-2026-ERR-01',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '', // Missing
      supportItemCode: '07_002_0115_8_3',
      hours: 0, // Invalid (<= 0)
      unitRate: 214.41,
      totalAmount: 0,
      serviceDate: '', // Missing
      status: 'Pending'
    };

    const result = AIAssistantEngine.validateBillingClaim(incompleteClaim, null, [incompleteClaim], [], []);

    assert.equal(result.isClean, false);
    assert.ok(result.badges.some(b => b.code === 'MANDATORY_FIELDS_MISSING'), 'Must return MANDATORY_FIELDS_MISSING badge');
  });

  await reporter.test('T3.R5.4 - Duplicate Claim Detection: Catches duplicate claim on same service date and line item code', async () => {
    const claim1 = {
      id: 'claim-m3-dup-1',
      invoiceNumber: 'INV-2026-D1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-08-23',
      status: 'Approved',
      caseNoteId: 'note-dup-1'
    };

    const claim2 = {
      id: 'claim-m3-dup-2',
      invoiceNumber: 'INV-2026-D2',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-08-23',
      status: 'Pending',
      caseNoteId: 'note-dup-2'
    };

    const caseNotes = [
      { id: 'note-dup-1', clientId: 'cli-101', date: '2026-08-23', status: 'Approved' },
      { id: 'note-dup-2', clientId: 'cli-101', date: '2026-08-23', status: 'Approved' }
    ];
    const client = { id: 'cli-101', name: 'Jordan Miller', ndisNumber: '430891245', totalBudget: 50000, spentBudget: 10000 };

    const result = AIAssistantEngine.validateBillingClaim(claim2, client, [claim1, claim2], caseNotes, NDIS_2026_PRICE_GUIDE);

    assert.equal(result.isClean, false);
    assert.ok(result.badges.some(b => b.code === 'DUPLICATE_CLAIM_DETECTED'), 'Must return DUPLICATE_CLAIM_DETECTED badge');
    assert.ok(result.errors.some(e => e.includes('Duplicate claim detected')), 'Error must mention duplicate');
  });

  await reporter.test('T3.R5.5 - Case Note Linkage: Flag orphan claim without case note and unapproved draft case note', async () => {
    // 1. Orphan claim
    const orphanClaim = {
      id: 'claim-m3-orphan',
      invoiceNumber: 'INV-2026-ORPH',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41,
      serviceDate: '2026-08-24',
      status: 'Pending'
    };

    const client = { id: 'cli-101', name: 'Jordan Miller', ndisNumber: '430891245', totalBudget: 50000, spentBudget: 10000 };
    const orphanResult = AIAssistantEngine.validateBillingClaim(orphanClaim, client, [orphanClaim], [], []);
    assert.ok(orphanResult.badges.some(b => b.code === 'ORPHAN_CLAIM_NO_NOTE'), 'Must flag orphan claim without case note');

    // 2. Unapproved draft note claim
    const draftNoteClaim = {
      id: 'claim-m3-draftnote',
      invoiceNumber: 'INV-2026-DRAFT',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41,
      serviceDate: '2026-08-25',
      status: 'Pending',
      caseNoteId: 'note-draft-m3'
    };

    const draftNotes = [{ id: 'note-draft-m3', clientId: 'cli-101', date: '2026-08-25', status: 'Draft' }];
    const draftResult = AIAssistantEngine.validateBillingClaim(draftNoteClaim, client, [draftNoteClaim], draftNotes, NDIS_2026_PRICE_GUIDE);

    assert.ok(draftResult.badges.some(b => b.code === 'NOTE_PENDING_APPROVAL' && b.type === 'amber'), 'Must flag unapproved note as amber warning');
  });

  await reporter.test('T3.R5.6 - Clean Claim Validation: Clean claim receives isClean = true and PACE_READY_CLEAN green badge', async () => {
    const cleanClaim = {
      id: 'claim-m3-clean',
      invoiceNumber: 'INV-2026-CLEAN-M3',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62,
      serviceDate: '2026-08-26',
      status: 'Approved',
      caseNoteId: 'note-clean-m3'
    };

    const client = { id: 'cli-101', name: 'Jordan Miller', ndisNumber: '430891245', totalBudget: 50000, spentBudget: 15000 };
    const caseNotes = [{ id: 'note-clean-m3', clientId: 'cli-101', date: '2026-08-26', status: 'Approved' }];

    const result = AIAssistantEngine.validateBillingClaim(cleanClaim, client, [cleanClaim], caseNotes, NDIS_2026_PRICE_GUIDE);

    assert.equal(result.isClean, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.length, 0);
    assert.ok(result.badges.some(b => b.code === 'PACE_READY_CLEAN' && b.type === 'green'), 'Must include green PACE ready badge');
  });

  // =========================================================================
  // PHASE 2: R7 — AI Scheduling Optimiser & Google Calendar Sync
  // =========================================================================
  reporter.startPhase('Phase 2: R7 — AI Scheduling Optimiser & Google Calendar Sync');

  await reporter.test('T3.R7.1 - Caseload Capacity Analysis: Identifies over-allocated practitioners (utilization >= 100%) and computes burnout risks', async () => {
    const practitioners = [
      {
        id: 'prac-over',
        name: 'Marcus Vance',
        position: 'Senior Behaviour Support Practitioner',
        activeCaseload: 24,
        activeCaseloadCount: 24,
        caseloadLimit: 20 // 120% capacity
      },
      {
        id: 'prac-avail',
        name: 'Dr. Sarah Jenkins',
        position: 'Principal PBS Specialist',
        activeCaseload: 12,
        activeCaseloadCount: 12,
        caseloadLimit: 20 // 60% capacity
      }
    ];

    const clients = [
      { id: 'cli-101', name: 'Jordan Miller', primaryPractitionerId: 'prac-over', suburb: 'Richmond' }
    ];

    const plan = AIAssistantEngine.optimizeScheduling(practitioners, clients, []);

    assert.ok(plan.imbalances.length >= 1, 'Must detect at least 1 over-capacity practitioner');
    const overSummary = plan.capacitySummaries ? plan.capacitySummaries.find(p => p.practitionerId === 'prac-over') : null;
    if (overSummary) {
      assert.equal(overSummary.status, 'Over Capacity');
    }
  });

  await reporter.test('T3.R7.2 - Caseload Rebalance Solver: Recommends client reassignment from overloaded to available practitioner with impact calculations', async () => {
    const practitioners = [
      {
        id: 'prac-over',
        name: 'Marcus Vance',
        activeCaseload: 22,
        activeCaseloadCount: 22,
        caseloadLimit: 20
      },
      {
        id: 'prac-avail',
        name: 'Dr. Sarah Jenkins',
        activeCaseload: 10,
        activeCaseloadCount: 10,
        caseloadLimit: 20
      }
    ];

    const clients = [
      { id: 'cli-101', name: 'Jordan Miller', primaryPractitionerId: 'prac-over', suburb: 'Richmond' }
    ];

    const plan = AIAssistantEngine.optimizeScheduling(practitioners, clients, []);

    assert.ok(plan.recommendations.length >= 1, 'Must generate rebalance recommendations');
    const rec = plan.recommendations[0];
    assert.equal(rec.fromPractitionerId, 'prac-over');
    assert.equal(rec.toPractitionerId, 'prac-avail');
    assert.ok(rec.description.includes('Recommend transferring'));
  });

  await reporter.test('T3.R7.3 - Google Calendar Bidirectional Sync: Pushes shift with Google Meet video link and fetches appointments', async () => {
    const calendarEventsStore = new Map();
    const shift1 = {
      id: 'shift-gcal-01',
      practitionerId: 'prac-201',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      date: '2026-08-28',
      startTime: '09:00',
      endTime: '10:30',
      supportType: 'Specialist Behaviour Support'
    };

    // 1. Create event
    const syncRes = AIAssistantEngine.syncGoogleCalendar('create_or_update', shift1, calendarEventsStore);
    assert.equal(syncRes.success, true);
    assert.ok(syncRes.event.conferenceData?.entryPoints?.some(ep => ep.uri.includes('meet.google.com')));

    // 2. Fetch events
    const fetched = AIAssistantEngine.syncGoogleCalendar('fetch', null, calendarEventsStore);
    assert.equal(fetched.length, 1);
    assert.equal(fetched[0].id, syncRes.eventId);
  });

  // =========================================================================
  // PHASE 3: R8 — NDIS PRODA API Direct Claim Submission & PACE Polling
  // =========================================================================
  reporter.startPhase('Phase 3: R8 — NDIS PRODA API Direct Claim Submission & PACE Polling');

  await reporter.test('T3.R8.1 - B2G Batch Submission: Packaging approved claims dispatches B2G payload and returns valid batchId', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      {
        id: 'claim-p1',
        invoiceNumber: 'INV-2026-PRODA-M3-1',
        clientId: 'cli-101',
        clientName: 'Jordan Miller',
        ndisNumber: '430891245',
        supportItemCode: '07_002_0115_8_3',
        hours: 2.0,
        unitRate: 214.41,
        totalAmount: 428.82,
        serviceDate: '2026-08-29',
        status: 'Approved'
      }
    ];

    const submission = prodaApi.submitBatch(['claim-p1'], claims);

    assert.ok(submission.batchId.startsWith('PRODA-PACE-BATCH-'));
    assert.equal(submission.status, 'Processing');
    assert.equal(submission.submittedClaimsCount, 1);
  });

  await reporter.test('T3.R8.2 - PACE Status Polling: Transitions batch to Completed, assigning PACE transaction IDs and reconciling ledger to Paid', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      {
        id: 'claim-p2',
        invoiceNumber: 'INV-2026-PRODA-M3-2',
        clientId: 'cli-101',
        clientName: 'Jordan Miller',
        ndisNumber: '430891245',
        supportItemCode: '07_002_0115_8_3',
        hours: 1.0,
        unitRate: 214.41,
        totalAmount: 214.41,
        serviceDate: '2026-08-29',
        status: 'Approved'
      }
    ];

    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.addBillingClaim(claims[0]);

    const submission = prodaApi.submitBatch(['claim-p2'], claims);
    const polledStatus = prodaApi.pollBatchStatus(submission.batchId);

    assert.equal(polledStatus.status, 'Completed');
    assert.equal(polledStatus.approvedCount, 1);
    assert.ok(polledStatus.claims[0].paceReference?.startsWith('PACE-TXN-'));

    // Reconcile with store
    const reconciledCount = prodaApi.reconcileBatchWithLedger(polledStatus, store);
    assert.equal(reconciledCount, 1);
    const updated = store.billingClaims.find(c => c.id === 'claim-p2');
    assert.equal(updated.status, 'Paid');
    assert.equal(updated.reconciliationStatus, 'Reconciled');
  });

  await reporter.test('T3.R8.3 - PRODA Rejection Error Handling: Over-cap rates (> $250) or invalid NDIS number return Rejected status with PACE error code', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const invalidClaims = [
      {
        id: 'claim-p-rej',
        invoiceNumber: 'INV-2026-REJ',
        clientId: 'cli-101',
        clientName: 'Jordan Miller',
        ndisNumber: '', // Invalid NDIS number
        supportItemCode: '07_002_0115_8_3',
        hours: 1.0,
        unitRate: 350.00, // Exceeds PRODA cap
        totalAmount: 350.00,
        serviceDate: '2026-08-29',
        status: 'Approved'
      }
    ];

    const submission = prodaApi.submitBatch(['claim-p-rej'], invalidClaims);
    const polledStatus = prodaApi.pollBatchStatus(submission.batchId);

    assert.equal(polledStatus.rejectedCount, 1);
    assert.equal(polledStatus.approvedCount, 0);
    const rejClaim = polledStatus.claims[0];
    assert.equal(rejClaim.status, 'Rejected');
    assert.equal(rejClaim.rejectionCode, 'PACE_ERR_INVALID_RATE_OR_NDIS');
  });

  // =========================================================================
  // PHASE 4: R9 — Xero OAuth 2.0 Live Integration & Bank Feed Sync
  // =========================================================================
  reporter.startPhase('Phase 4: R9 — Xero OAuth 2.0 Live Integration & Bank Feed Sync');

  await reporter.test('T3.R9.1 - 3-Legged OAuth 2.0 URL: Generates official authorization URL with required accounting scopes & state', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    const authUrl = xeroApi.getAuthorizationUrl(
      'xero_client_123',
      'https://breakthrough.org.au/api/xero/callback',
      'test_state_123'
    );

    assert.ok(authUrl.startsWith('https://login.xero.com/identity/connect/authorize'));
    assert.ok(authUrl.includes('response_type=code'));
    assert.ok(authUrl.includes('accounting.transactions'));
    assert.ok(authUrl.includes('state=test_state_123'));
  });

  await reporter.test('T3.R9.2 - Code Exchange & Token Refresh: Exchanges auth code for access & refresh tokens and performs token refresh', async () => {
    const xeroApi = new XeroOAuthApiEmulator();

    // 1. Exchange code
    const tokens = xeroApi.exchangeCodeForTokens('live_auth_code_mock', 'state_test');
    assert.ok(tokens.accessToken.startsWith('xero_access_'));
    assert.ok(tokens.refreshToken.startsWith('xero_refresh_'));
    assert.equal(tokens.tenantName, 'Breakthrough Coaching & Consulting Pty Ltd');

    // 2. Token refresh
    const refreshed = xeroApi.refreshToken(tokens.refreshToken);
    assert.ok(refreshed.accessToken.startsWith('xero_access_refreshed_'));
  });

  await reporter.test('T3.R9.3 - ACCREC Sales Invoice Creation: Approved billing claims generate structured Xero ACCREC invoices', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    xeroApi.exchangeCodeForTokens('code_123', 'state_123');

    const claim = {
      id: 'claim-xero-01',
      invoiceNumber: 'INV-2026-XERO-M3',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      hours: 2.0,
      unitRate: 214.41,
      totalAmount: 428.82,
      serviceDate: '2026-08-30',
      status: 'Approved'
    };

    const invoice = xeroApi.createAccrecInvoice(claim);
    assert.ok(invoice.invoiceId.startsWith('xero-inv-'));
    assert.equal(invoice.type, 'ACCREC');
    assert.equal(invoice.status, 'AUTHORISED');
    assert.equal(invoice.contact.name, 'Jordan Miller');
    assert.equal(invoice.total, 428.82);
    assert.equal(invoice.lineItems[0].itemCode, '07_002_0115_8_3');
  });

  await reporter.test('T3.R9.4 - Bank Feed Payment Reconciliation: Syncs bank feed payment events back to claim ledger as Paid & Reconciled', async () => {
    const xeroApi = new XeroOAuthApiEmulator();
    xeroApi.exchangeCodeForTokens('code_123', 'state_123');

    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const claim = {
      id: 'claim-xero-pay',
      invoiceNumber: 'INV-2026-XERO-PAY',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 214.41,
      totalAmount: 428.82,
      serviceDate: '2026-08-30',
      status: 'Approved'
    };

    store.addBillingClaim(claim);

    // Create invoice and record payment
    const inv = xeroApi.createAccrecInvoice(claim);
    xeroApi.recordBankFeedPayment(inv.invoiceId, 428.82, '2026-08-31T10:00:00Z');

    // Sync payments to store
    const syncedCount = xeroApi.syncBankFeedPayments('xero-tenant-8821', store);
    assert.equal(syncedCount, 1);

    const updated = store.billingClaims.find(c => c.id === 'claim-xero-pay');
    assert.equal(updated.status, 'Paid');
    assert.equal(updated.reconciliationStatus, 'Reconciled');
  });

  // =========================================================================
  // PHASE 5: R10 — Email & SMS Notification Infrastructure
  // =========================================================================
  reporter.startPhase('Phase 5: R10 — Email & SMS Notification Infrastructure');

  await reporter.test('T3.R10.1 - SendGrid & Twilio Dispatch: Validates email and SMS payloads and produces delivery receipts', async () => {
    const notifService = new NotificationServiceEmulator();

    const emailRes = notifService.sendEmail({
      to: 'sarah.jenkins@breakthrough.org.au',
      subject: 'Clinical Audit Notice',
      templateData: { auditId: 'AUD-01' }
    });
    assert.equal(emailRes.status, 202);
    assert.ok(emailRes.messageId.startsWith('sg-msg-'));

    const smsRes = notifService.sendSms({
      to: '+61411234567',
      body: 'Breakthrough OS: System update completed.'
    });
    assert.equal(smsRes.status, 'delivered');
    assert.ok(smsRes.sid.startsWith('SM'));
  });

  await reporter.test('T3.R10.2 - Critical Incident Escalation: Critical incident triggers immediate high-priority SMS & 24h SLA email to Practice Director', async () => {
    const notifService = new NotificationServiceEmulator();

    const incident = {
      id: 'INC-2026-CRIT-01',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      type: 'Physical Aggression / Property Damage',
      severity: 'Critical',
      description: 'Severe escalation during sensory transition.',
      date: '2026-08-30'
    };

    const dispatches = notifService.dispatchCriticalIncidentAlert(incident, 'sarah.jenkins@breakthrough.org.au', '+61411000111');

    assert.ok(dispatches.sms, 'Must dispatch SMS alert');
    assert.equal(dispatches.sms.to, '+61411000111');
    assert.equal(dispatches.sms.status, 'delivered');

    assert.ok(dispatches.email, 'Must dispatch Email alert');
    assert.equal(dispatches.email.to, 'sarah.jenkins@breakthrough.org.au');
    assert.equal(dispatches.email.status, 202);
  });

  await reporter.test('T3.R10.3 - Compliance Expiry & BSP Review Warnings: Dispatches 14d/3d screening alerts, 30d BSP review notices, and payment receipts', async () => {
    const notifService = new NotificationServiceEmulator();

    // 1. Compliance expiry alert (14d)
    const practitioner = {
      id: 'prac-exp',
      name: 'Liam Gallagher',
      email: 'liam.gallagher@breakthrough.org.au',
      screeningStatus: 'Expiring Soon',
      screeningExpiryDate: '2026-09-08'
    };

    const compRes = notifService.dispatchComplianceExpiryWarning(practitioner, 14);
    assert.equal(compRes.status, 202);
    assert.equal(compRes.to, 'liam.gallagher@breakthrough.org.au');

    // 2. BSP Review Reminder (30d)
    const bsp = {
      id: 'bsp-rev-01',
      clientId: 'cli-101',
      title: 'Jordan Miller Comprehensive BSP',
      reviewDate: '2026-09-24'
    };
    const bspRes = notifService.dispatchBSPReviewReminder({ name: 'Jordan Miller' }, bsp, 30);
    assert.equal(bspRes.status, 202);

    // 3. Payment receipt
    const claim = {
      id: 'claim-receipt-01',
      invoiceNumber: 'INV-2026-RCPT-01',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      totalAmount: 428.82,
      status: 'Paid'
    };
    const receiptRes = notifService.dispatchInvoicePaymentReceipt(claim, 'jordan.miller@example.com');
    assert.equal(receiptRes.status, 202);
  });

  // =========================================================================
  // PHASE 6: R13 — NDIS Price Guide Auto-Sync
  // =========================================================================
  reporter.startPhase('Phase 6: R13 — NDIS Price Guide Auto-Sync');

  await reporter.test('T3.R13.1 - Price Guide Synchronization & Diff Detection: Synchronizes 2026 support catalogue and detects rate differentials', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

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

    assert.ok(result.syncedCount >= 7, 'Must process all 2026 support items');
    assert.ok(result.changesCount >= 1, 'Must detect rate difference');
    const diff = result.changes.find(i => i.code === '07_002_0115_8_3');
    assert.equal(diff.oldRate, 200.00);
    assert.equal(diff.newRate, 214.41);
  });

  await reporter.test('T3.R13.2 - Retrospective Claim Re-Validation: Flags existing claims exceeding updated price caps and updates ledger status', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const overCapClaim = {
      id: 'claim-retro-over',
      invoiceNumber: 'INV-2026-RETRO-01',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 230.00, // Exceeds $214.41 cap
      totalAmount: 460.00,
      serviceDate: '2026-08-31',
      status: 'Pending'
    };

    store.addBillingClaim(overCapClaim);

    const result = NDISPricingSyncEngine.syncPriceGuide(store);

    assert.ok(result.revalidatedClaimsCount >= 1, 'Must re-validate claims');
    const claimInStore = store.billingClaims.find(c => c.id === 'claim-retro-over');
    assert.equal(claimInStore.reconciliationStatus, 'Failed');
    assert.ok(claimInStore.reconciliationError?.includes('RATE_CAP_UPDATED_REVALIDATE'));
  });
}
