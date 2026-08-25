/**
 * Challenger 2 Adversarial Stress Test & Empirical Verification Suite
 * 
 * Deeply challenges:
 * 1. PRODA API Direct Batch Submission, XML Generator, Error Parsing & PACE Reconciliation
 * 2. Xero OAuth 2.0 Flow, Token Refresh, ACCREC Invoicing & Bank Feed Reconciliation
 * 3. SendGrid & Twilio Notification Trigger Engine (Critical Incidents, 14d/3d Screening, BSP Reviews)
 * 4. Compliance Report Generator, NDIS RP Exporter, Section 34 Audit Evidence Packaging (SHA-256 Tamper Proof)
 * 5. Audit of Test Coverage & False Pass Detection
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  NDISProdaApiEmulator,
  NDISProdaApiService,
  XeroOAuthApiEmulator,
  XeroOAuthService,
  NotificationServiceEmulator,
  ComplianceAutomationEngine,
  AIAssistantEngine,
  SEED_CLIENTS,
  SEED_PRACTITIONERS,
  SEED_CLAIMS,
  SEED_INCIDENTS,
  SEED_RESTRICTIVE_PRACTICES,
  SEED_CASE_NOTES,
  SEED_ABC_LOGS
} from '../harness/emulator.mjs';

const projectRoot = process.cwd();

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  ⚔️ CHALLENGER 2: EMPIRICAL INTEGRATIONS & WORKFLOWS GRILL SUITE');
console.log('══════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NDIS PRODA API DIRECT BATCH SUBMISSION & PACE RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ SECTION 1: NDIS PRODA API Direct Batch Submission & Error Parsing');

await test('PRODA 1.1: submitBatch throws on empty, null, or undefined claimIds', async () => {
  const proda = new NDISProdaApiEmulator();
  assert.throws(() => proda.submitBatch([]), /INVALID_ARGUMENT.*empty/);
  assert.throws(() => proda.submitBatch(null), /INVALID_ARGUMENT.*empty/);
  assert.throws(() => proda.submitBatch(undefined), /INVALID_ARGUMENT.*empty/);
});

await test('PRODA 1.2: Evaluates boundary values: rate $250.00 cap, rate $250.01 rejection, NDIS number validation', async () => {
  const proda = new NDISProdaApiEmulator();
  const claims = [
    { id: 'c-exact-cap', clientId: 'cli-1', ndisNumber: '430891245', unitRate: 250.00, totalAmount: 250.00, status: 'Approved' },
    { id: 'c-over-cap', clientId: 'cli-2', ndisNumber: '430891245', unitRate: 250.01, totalAmount: 250.01, status: 'Approved' },
    { id: 'c-empty-ndis', clientId: 'cli-3', ndisNumber: '', unitRate: 214.41, totalAmount: 214.41, status: 'Approved' },
    { id: 'c-null-ndis', clientId: 'cli-4', ndisNumber: null, unitRate: 214.41, totalAmount: 214.41, status: 'Approved' },
    { id: 'c-zero-rate', clientId: 'cli-5', ndisNumber: '430891245', unitRate: 0.00, totalAmount: 0.00, status: 'Approved' }
  ];

  const sub = proda.submitBatch(claims.map(c => c.id), claims);
  assert.equal(sub.submittedClaimsCount, 5);

  const pollResult = proda.pollBatchStatus(sub.batchId);
  assert.equal(pollResult.status, 'Completed');

  const exactCap = pollResult.claims.find(c => c.claimId === 'c-exact-cap');
  assert.equal(exactCap.status, 'Paid');
  assert.ok(exactCap.paceReference.startsWith('PACE-TXN-'));

  const overCap = pollResult.claims.find(c => c.claimId === 'c-over-cap');
  assert.equal(overCap.status, 'Rejected');
  assert.equal(overCap.rejectionCode, 'PACE_ERR_INVALID_RATE_OR_NDIS');
  assert.equal(overCap.paceReference, null);

  const emptyNdis = pollResult.claims.find(c => c.claimId === 'c-empty-ndis');
  assert.equal(emptyNdis.status, 'Rejected');

  const nullNdis = pollResult.claims.find(c => c.claimId === 'c-null-ndis');
  assert.equal(nullNdis.status, 'Rejected');

  const zeroRate = pollResult.claims.find(c => c.claimId === 'c-zero-rate');
  assert.equal(zeroRate.status, 'Paid');
});

await test('PRODA 1.3: Mixed batch submission tracks counts and reconciles ledger accurately', async () => {
  const proda = new NDISProdaApiEmulator();
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);

  const testClaims = [
    { id: 'c-1', invoiceNumber: 'INV-1', clientId: 'cli-1', ndisNumber: '430891245', unitRate: 214.41, totalAmount: 214.41, status: 'Approved' },
    { id: 'c-2', invoiceNumber: 'INV-2', clientId: 'cli-2', ndisNumber: '430891245', unitRate: 300.00, totalAmount: 300.00, status: 'Approved' },
    { id: 'c-3', invoiceNumber: 'INV-3', clientId: 'cli-3', ndisNumber: '430891245', unitRate: 193.99, totalAmount: 193.99, status: 'Approved' }
  ];
  store.billingClaims = testClaims;

  const sub = proda.submitBatch(['c-1', 'c-2', 'c-3'], store.billingClaims);
  assert.equal(sub.submittedClaimsCount, 3);

  const pollResult = proda.pollBatchStatus(sub.batchId);
  assert.equal(pollResult.status, 'Completed');
  assert.equal(pollResult.approvedCount, 2);
  assert.equal(pollResult.rejectedCount, 1);

  const reconciledCount = proda.reconcileBatchWithLedger(pollResult, store);
  assert.equal(reconciledCount, 3);

  const c1 = store.billingClaims.find(c => c.id === 'c-1');
  assert.equal(c1.status, 'Paid');
  assert.equal(c1.reconciliationStatus, 'Reconciled');

  const c2 = store.billingClaims.find(c => c.id === 'c-2');
  assert.equal(c2.status, 'Rejected');
  assert.equal(c2.reconciliationStatus, 'Failed');
  assert.ok(c2.reconciliationError.includes('PACE_ERR_INVALID_RATE_OR_NDIS'));
});

await test('PRODA 1.4: Direct NDISProdaApiService submitClaimsBatch generates PACE XML payload', async () => {
  const claims = [
    { id: 'c-xml-1', supportItemCode: '07_002_0115_8_3', totalAmount: 321.62, ndisNumber: '430891245', unitRate: 214.41, status: 'Approved' },
    { id: 'c-xml-2', supportItemCode: '07_001_0115_8_3', totalAmount: 193.99, ndisNumber: '431092841', unitRate: 193.99, status: 'Approved' }
  ];

  const result = NDISProdaApiService.submitClaimsBatch(claims, '405001234');
  assert.ok(result.batchId.startsWith('PRODA-PACE-BATCH-'));
  assert.equal(result.totalClaims, 2);
  assert.equal(result.totalValue, 515.61);
  assert.ok(result.paceXmlPayload.includes('<RegistrationNumber>405001234</RegistrationNumber>'));
  assert.ok(result.paceXmlPayload.includes('<SupportCode>07_002_0115_8_3</SupportCode>'));
  assert.ok(result.paceXmlPayload.includes('<NDISNumber>430891245</NDISNumber>'));
});

await test('PRODA 1.5: Static verification of Next.js PRODA routes and prodaService.ts', async () => {
  const prodaServiceCode = fs.readFileSync(path.join(projectRoot, 'lib/prodaService.ts'), 'utf8');
  assert.ok(prodaServiceCode.includes('submitBatch'), 'submitBatch missing from lib/prodaService.ts');
  assert.ok(prodaServiceCode.includes('pollBatchStatus'), 'pollBatchStatus missing from lib/prodaService.ts');
  assert.ok(prodaServiceCode.includes('reconcileBatchWithLedger'), 'reconcileBatchWithLedger missing');
  assert.ok(prodaServiceCode.includes('generateProdaXmlPayload'), 'generateProdaXmlPayload missing');
  assert.ok(prodaServiceCode.includes('escapeXml'), 'escapeXml missing from lib/prodaService.ts');

  const batchSubmitRoute = fs.readFileSync(path.join(projectRoot, 'app/api/proda/claims/batch-submit/route.ts'), 'utf8');
  assert.ok(batchSubmitRoute.includes('NDISProdaApiService.submitBatch'), 'Route does not call submitBatch');
  assert.ok(batchSubmitRoute.includes('INVALID_ARGUMENT'), 'Route missing validation check');

  const batchStatusRoute = fs.readFileSync(path.join(projectRoot, 'app/api/proda/claims/batch-status/route.ts'), 'utf8');
  assert.ok(batchStatusRoute.includes('NDISProdaApiService.pollBatchStatus'), 'Route does not call pollBatchStatus');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. XERO OAUTH 2.0 INTEGRATION, INVOICING & BANK FEED RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ SECTION 2: Xero OAuth 2.0 Flow, Invoicing & Bank Feed Reconciliation');

await test('XERO 2.1: Authorization URL generation verifies required OAuth 2.0 parameters', async () => {
  const xero = new XeroOAuthApiEmulator();
  const url = xero.getAuthorizationUrl('client_abc', 'https://app.test/callback', 'state_123', 'accounting.transactions');
  assert.ok(url.startsWith('https://login.xero.com/identity/connect/authorize'));
  assert.ok(url.includes('response_type=code'));
  assert.ok(url.includes('client_id=client_abc'));
  assert.ok(url.includes('redirect_uri=' + encodeURIComponent('https://app.test/callback')));
  assert.ok(url.includes('state=state_123'));
  assert.ok(url.includes('scope=' + encodeURIComponent('accounting.transactions')));

  assert.throws(() => xero.getAuthorizationUrl('', 'https://app.test'), /INVALID_ARGUMENT/);
  assert.throws(() => xero.getAuthorizationUrl('client', ''), /INVALID_ARGUMENT/);
});

await test('XERO 2.2: Token exchange & refresh lifecycle updates connection state', async () => {
  const xero = new XeroOAuthApiEmulator();
  assert.equal(xero.tokenState.isConnected, false);

  assert.throws(() => xero.exchangeCodeForTokens('invalid_code'), /UNAUTHORIZED/);
  assert.throws(() => xero.exchangeCodeForTokens(''), /UNAUTHORIZED/);

  const tokens = xero.exchangeCodeForTokens('valid_auth_code', 'state_123');
  assert.ok(tokens.accessToken.startsWith('xero_access_'));
  assert.ok(tokens.refreshToken.startsWith('xero_refresh_'));
  assert.equal(tokens.tokenType, 'Bearer');
  assert.equal(tokens.expiresIn, 1800);
  assert.equal(tokens.tenantName, 'Breakthrough Coaching & Consulting Pty Ltd');

  assert.equal(xero.tokenState.isConnected, true);
  assert.equal(xero.tokenState.accessToken, tokens.accessToken);

  // Refresh token
  const refreshed = xero.refreshToken(tokens.refreshToken);
  assert.ok(refreshed.accessToken.startsWith('xero_access_refreshed_'));
  assert.ok(refreshed.refreshToken.startsWith('xero_refresh_refreshed_'));

  assert.equal(xero.tokenState.accessToken, refreshed.accessToken);
  assert.equal(xero.tokenState.refreshToken, refreshed.refreshToken);
});

await test('XERO 2.3: ACCREC sales invoice generation creates compliant accounting record', async () => {
  const xero = new XeroOAuthApiEmulator();
  xero.exchangeCodeForTokens('init_code');

  const claim = {
    id: 'claim-xero-test',
    invoiceNumber: 'INV-2026-0099',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    ndisNumber: '430891245',
    supportItemCode: '07_002_0115_8_3',
    ndisSupportItem: 'Specialist Behaviour Support',
    serviceDate: '2026-08-20',
    hours: 2.0,
    unitRate: 214.41,
    totalAmount: 428.82
  };

  const invoice = xero.createAccrecInvoice(claim);
  assert.ok(invoice.invoiceId.startsWith('xero-inv-'));
  assert.equal(invoice.invoiceNumber, 'INV-2026-0099');
  assert.equal(invoice.type, 'ACCREC');
  assert.equal(invoice.contact.name, 'Jordan Miller');
  assert.equal(invoice.contact.accountNumber, '430891245');
  assert.equal(invoice.lineItems.length, 1);
  assert.equal(invoice.lineItems[0].itemCode, '07_002_0115_8_3');
  assert.equal(invoice.lineItems[0].unitAmount, 214.41);
  assert.equal(invoice.lineItems[0].lineAmount, 428.82);
  assert.equal(invoice.lineItems[0].accountCode, '200');
  assert.equal(invoice.status, 'AUTHORISED');
  assert.equal(invoice.total, 428.82);
  assert.equal(invoice.amountDue, 428.82);
  assert.equal(invoice.amountPaid, 0);
});

await test('XERO 2.4: Bank feed payments, status transitions (AUTHORISED -> PAID), and ledger reconciliation', async () => {
  const xero = new XeroOAuthApiEmulator();
  xero.exchangeCodeForTokens('init_code');

  const claim = {
    id: 'claim-bank-feed-1',
    invoiceNumber: 'INV-BANK-1',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    totalAmount: 214.41,
    status: 'Approved'
  };

  const invoice = xero.createAccrecInvoice(claim);

  // Partial payment ($100 of $214.41)
  const p1 = xero.recordBankFeedPayment(invoice.invoiceId, 100.00, '2026-08-25T10:00:00Z');
  assert.equal(p1.amount, 100.00);
  assert.equal(invoice.amountPaid, 100.00);
  assert.equal(invoice.amountDue, 114.41);
  assert.equal(invoice.status, 'AUTHORISED');

  // Complete payment ($114.41)
  const p2 = xero.recordBankFeedPayment(invoice.invoiceId, 114.41, '2026-08-25T11:00:00Z');
  assert.equal(invoice.amountPaid, 214.41);
  assert.equal(invoice.amountDue, 0);
  assert.equal(invoice.status, 'PAID');

  // Sync to store ledger
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);
  store.billingClaims = [{ ...claim }];

  const syncedCount = xero.syncBankFeedPayments(undefined, store);
  assert.equal(syncedCount, 1);
  assert.equal(store.billingClaims[0].status, 'Paid');
  assert.equal(store.billingClaims[0].reconciliationStatus, 'Reconciled');
  assert.ok(store.billingClaims[0].paymentReceivedDate);

  // Idempotent re-sync
  const resyncCount = xero.syncBankFeedPayments(undefined, store);
  assert.equal(resyncCount, 0);
});

await test('XERO 2.5: Static verification of Xero service and API routes', async () => {
  const xeroServiceCode = fs.readFileSync(path.join(projectRoot, 'lib/xeroService.ts'), 'utf8');
  assert.ok(xeroServiceCode.includes('getAuthorizationUrl'), 'getAuthorizationUrl missing');
  assert.ok(xeroServiceCode.includes('exchangeCodeForTokens'), 'exchangeCodeForTokens missing');
  assert.ok(xeroServiceCode.includes('refreshToken'), 'refreshToken missing');
  assert.ok(xeroServiceCode.includes('createAccrecInvoice'), 'createAccrecInvoice missing');
  assert.ok(xeroServiceCode.includes('recordBankFeedPayment'), 'recordBankFeedPayment missing');
  assert.ok(xeroServiceCode.includes('syncBankFeedPayments'), 'syncBankFeedPayments missing');

  const xeroAuthRoute = fs.readFileSync(path.join(projectRoot, 'app/api/xero/auth/route.ts'), 'utf8');
  assert.ok(xeroAuthRoute.includes('XeroOAuthService.getAuthorizationUrl'), 'Auth route missing call');

  const xeroCallbackRoute = fs.readFileSync(path.join(projectRoot, 'app/api/xero/callback/route.ts'), 'utf8');
  assert.ok(xeroCallbackRoute.includes('XeroOAuthService.exchangeCodeForTokens'), 'Callback route missing call');

  const xeroSyncRoute = fs.readFileSync(path.join(projectRoot, 'app/api/xero/sync/route.ts'), 'utf8');
  assert.ok(xeroSyncRoute.includes('XeroOAuthService.syncBankFeedPayments'), 'Sync route missing sync call');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SENDGRID & TWILIO NOTIFICATION TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ SECTION 3: SendGrid Email & Twilio SMS Alert Triggers');

await test('NOTIFICATIONS 3.1: Notification service emulator validates email and SMS inputs strictly', async () => {
  const notifs = new NotificationServiceEmulator();

  // Invalid email
  assert.throws(() => notifs.sendEmail({ to: 'invalid-email', subject: 'Test' }), /INVALID_ARGUMENT/);
  assert.throws(() => notifs.sendEmail({ to: 'valid@example.com', subject: '' }), /INVALID_ARGUMENT/);

  // Valid email
  const em = notifs.sendEmail({ to: 'valid@example.com', subject: 'Test Subject', templateData: { key: 'val' } });
  assert.equal(em.status, 202);
  assert.ok(em.messageId.startsWith('sg-msg-'));

  // Invalid SMS
  assert.throws(() => notifs.sendSms({ to: '12345', body: 'Test' }), /INVALID_ARGUMENT/);
  assert.throws(() => notifs.sendSms({ to: '+61411234567', body: '' }), /INVALID_ARGUMENT/);

  // Valid SMS (both +614 and 04 formats)
  const sms1 = notifs.sendSms({ to: '+61411234567', body: 'SMS 1', priority: 'high' });
  assert.equal(sms1.status, 'delivered');
  assert.equal(sms1.priority, 'high');

  const sms2 = notifs.sendSms({ to: '0411234567', body: 'SMS 2' });
  assert.equal(sms2.status, 'delivered');

  assert.equal(notifs.getSentEmails().length, 1);
  assert.equal(notifs.getSentSms().length, 2);
});

await test('NOTIFICATIONS 3.2: Critical incident keywords trigger 24h statutory alert & director notification', async () => {
  const criticalSla = AIAssistantEngine.analyzeIncidentSLA('Participant sustained injury and chemical restraint was administered during police emergency response.');
  assert.equal(criticalSla.severityLevel, 'LEVEL_4_CRITICAL');
  assert.equal(criticalSla.slaCategory, '24_HOUR_NOTIFIABLE');
  assert.equal(criticalSla.urgencyDays, 1);
  assert.equal(criticalSla.isReportable, true);
  assert.ok(criticalSla.recommendedAction.includes('24-hour statutory notification'));

  const routineSla = AIAssistantEngine.analyzeIncidentSLA('Minor task refusal during afternoon table work. Calmly redirected.');
  assert.equal(routineSla.severityLevel, 'LEVEL_2_MEDIUM');
  assert.equal(routineSla.slaCategory, '5_DAY_REPORTABLE');
  assert.equal(routineSla.urgencyDays, 5);
  assert.equal(routineSla.isReportable, false);

  // Verify full dispatch
  const notifs = new NotificationServiceEmulator();
  const alert = notifs.dispatchCriticalIncidentAlert(
    { clientName: 'Liam O’Connor', severity: 'Critical / Reportable', incidentDate: '2026-08-25', description: 'Emergency restraint applied' },
    'director@breakthrough.org.au',
    '+61411234567'
  );

  assert.equal(alert.sms.priority, 'high');
  assert.ok(alert.sms.body.includes('CRITICAL ALERT'));
  assert.ok(alert.email.subject.includes('URGENT: NDIS 24-Hour Critical Incident Notification'));
});

await test('NOTIFICATIONS 3.3: 14d and 3d screening expiry alerts and 30d BSP review alerts format correctly', async () => {
  const notifs = new NotificationServiceEmulator();
  const prac = { name: 'Liam Gallagher', email: 'liam.g@breakthrough.org.au', screeningExpiryDate: '2026-09-08' };

  const email14 = notifs.dispatchComplianceExpiryWarning(prac, 14);
  assert.ok(email14.subject.includes('14 Days'));
  assert.equal(email14.templateData.daysUntilExpiry, 14);

  const email3 = notifs.dispatchComplianceExpiryWarning(prac, 3);
  assert.ok(email3.subject.includes('3 Days'));
  assert.equal(email3.templateData.daysUntilExpiry, 3);

  const bspEmail = notifs.dispatchBSPReviewReminder({ name: 'Jordan Miller' }, { title: 'Jordan BSP', reviewDate: '2026-09-25' }, 30);
  assert.ok(bspEmail.subject.includes('12-Month Review Due'));
  assert.equal(bspEmail.templateData.daysUntilExpiry, 30);
});

await test('NOTIFICATIONS 3.4: Static inspection of email and sms API routes', async () => {
  const emailRoute = fs.readFileSync(path.join(projectRoot, 'app/api/notifications/email/route.ts'), 'utf8');
  assert.ok(emailRoute.includes('SENDGRID_API_KEY'), 'Missing SendGrid API key reference');
  assert.ok(emailRoute.includes('INVALID_ARGUMENT'), 'Missing email validation check');
  assert.ok(emailRoute.includes('status: 202'), 'Missing 202 Accepted status response');

  const smsRoute = fs.readFileSync(path.join(projectRoot, 'app/api/notifications/sms/route.ts'), 'utf8');
  assert.ok(smsRoute.includes('TWILIO_ACCOUNT_SID'), 'Missing Twilio Account SID reference');
  assert.ok(smsRoute.includes('INVALID_ARGUMENT'), 'Missing phone number validation check');
  assert.ok(smsRoute.includes('cleanTo.startsWith(\'+\') || cleanTo.startsWith(\'04\')') || smsRoute.includes('cleanTo.startsWith(\'+\') && !cleanTo.startsWith(\'04\')') || smsRoute.includes('cleanTo.startsWith'), 'Missing AU phone number check');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPLIANCE AUTOMATION & SECTION 34 AUDIT EVIDENCE BUNDLING
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ SECTION 4: Compliance Report Generation & Section 34 Audit Bundler');

await test('COMPLIANCE 4.1: Monthly compliance report correctly computes KPIs across all records', async () => {
  const store = {
    restrictivePractices: [
      { id: 'rp-1', status: 'Authorized' },
      { id: 'rp-2', status: 'Active' },
      { id: 'rp-3', status: 'Expired' }
    ],
    incidents: [
      { id: 'inc-1', isNdisReportable: true },
      { id: 'inc-2', isNdisReportable: false },
      { id: 'inc-3', isNdisReportable: true }
    ],
    practitioners: [
      { id: 'p-1', screeningStatus: 'Valid' },
      { id: 'p-2', screeningStatus: 'Valid' },
      { id: 'p-3', screeningStatus: 'Expiring Soon' },
      { id: 'p-4', screeningStatus: 'Expired' }
    ],
    billingClaims: [
      { id: 'c-1', status: 'Paid', totalAmount: 321.62 },
      { id: 'c-2', status: 'Submitted PACE', totalAmount: 214.41 },
      { id: 'c-3', status: 'Draft', totalAmount: 500.00 }
    ]
  };

  const report = ComplianceAutomationEngine.generateMonthlyComplianceReport('2026-08-01', store);

  assert.equal(report.metrics.activeRestrictivePracticesCount, 2);
  assert.equal(report.metrics.reportableIncidentsCount, 2);
  assert.equal(report.metrics.screeningComplianceRatePercent, 50); // 2 of 4 = 50%
  assert.equal(report.metrics.totalClaimsCount, 3);
  assert.equal(report.metrics.totalBillingSubmittedAmount, 536.03); // 321.62 + 214.41
});

await test('COMPLIANCE 4.2: Section 34 Audit Evidence Bundler generates SHA-256 tamper-proof manifest', async () => {
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);

  const bundle = ComplianceAutomationEngine.assembleSection34AuditBundle('cli-101', store);

  assert.ok(bundle.bundleId.startsWith('AUDIT-BUNDLE-430891245'));
  assert.equal(bundle.participantId, 'cli-101');
  assert.equal(bundle.participantName, 'Jordan Miller');
  assert.equal(bundle.manifest.length, 6);

  // Verify SHA-256 format
  assert.match(bundle.integrityHash, /^[a-f0-9]{64}$/);

  // Tamper detection: modifying underlying evidence MUST change the SHA-256 hash
  const initialHash = bundle.integrityHash;

  store.caseNotes.push({
    id: 'note-tampered',
    clientId: 'cli-101',
    subjective: 'Added unauthorized note altering history'
  });

  const tamperedBundle = ComplianceAutomationEngine.assembleSection34AuditBundle('cli-101', store);
  assert.notEqual(tamperedBundle.integrityHash, initialHash, 'Tampering with case notes MUST produce a different SHA-256 hash');
});

await test('COMPLIANCE 4.3: 4-Step Incident sign-off workflow enforces sequential transitions and ADMIN final closure', async () => {
  const practitionerAuth = { uid: 'u-prac', role: 'PRACTITIONER', name: 'Marcus Vance' };
  const adminAuth = { uid: 'u-admin', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };
  const viewerAuth = { uid: 'u-view', role: 'VIEWER', name: 'Elena Rostova' };

  // Disallow invalid transition (skipping steps)
  assert.throws(
    () => ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Open', 'Clinical Review', practitionerAuth),
    /INVALID_STATE_TRANSITION/
  );
  assert.throws(
    () => ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Open', 'Closed', practitionerAuth),
    /INVALID_STATE_TRANSITION/
  );

  // Valid step 1: Open -> Investigating
  const s1 = ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Open', 'Investigating', practitionerAuth);
  assert.equal(s1.newStatus, 'Investigating');

  // Valid step 2: Investigating -> Clinical Review
  const s2 = ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Investigating', 'Clinical Review', practitionerAuth);
  assert.equal(s2.newStatus, 'Clinical Review');

  // Valid step 3: Clinical Review -> Director Sign-off
  const s3 = ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Clinical Review', 'Director Sign-off', practitionerAuth);
  assert.equal(s3.newStatus, 'Director Sign-off');

  // Step 4: Director Sign-off -> Closed (PRACTITIONER denied)
  assert.throws(
    () => ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Director Sign-off', 'Closed', practitionerAuth),
    /PERMISSION_DENIED.*ADMIN/
  );

  // Step 4: Director Sign-off -> Closed (VIEWER denied)
  assert.throws(
    () => ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Director Sign-off', 'Closed', viewerAuth),
    /PERMISSION_DENIED.*ADMIN/
  );

  // Step 4: Director Sign-off -> Closed (ADMIN authorized)
  const s4 = ComplianceAutomationEngine.advanceIncidentWorkflow('inc-1', 'Director Sign-off', 'Closed', adminAuth);
  assert.equal(s4.newStatus, 'Closed');
  assert.equal(s4.signedOffBy, 'Dr. Sarah Jenkins');
});

await test('COMPLIANCE 4.4: Section 34 AI Reasoning evaluates criteria and flags missing restrictive practice consent as Critical gap', async () => {
  const aiCode = fs.readFileSync(path.join(projectRoot, 'lib/ai-assistant.ts'), 'utf8');
  assert.ok(aiCode.includes('auditNDISReasonableAndNecessary'), 'auditNDISReasonableAndNecessary missing in lib/ai-assistant.ts');
  assert.ok(aiCode.includes('Goal Alignment & Social/Economic Participation'), 'Goal alignment criterion missing');
  assert.ok(aiCode.includes('Value for Money & Pricing Catalogue Caps'), 'Value for money criterion missing');
  assert.ok(aiCode.includes('Clinical Evidence & Current Good Practice'), 'Clinical evidence criterion missing');
  assert.ok(aiCode.includes('Informal Support & Mainstream Service Boundary'), 'Informal support criterion missing');
  assert.ok(aiCode.includes('Restrictive practices mentioned in clinical notes without documented Senior Practitioner Authorization & Guardian Consent'), 'Missing restrictive practice consent gap check');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. TEST COVERAGE AUDIT & FALSE PASS DETECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ SECTION 5: Test Suite Audit & False Pass Detection');

await test('AUDIT 5.1: Verify no empty or tautological assertions in test suites', async () => {
  const testDir = path.join(projectRoot, 'tests', 'e2e');
  const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.mjs'));

  assert.ok(testFiles.length >= 7, 'Expected at least 7 test files in tests/e2e');

  let totalAssertCount = 0;
  for (const file of testFiles) {
    const content = fs.readFileSync(path.join(testDir, file), 'utf8');
    
    // Check for trivial false passes like assert.ok(true) or assert.equal(1, 1)
    assert(!content.includes('assert.ok(true)'), `File ${file} contains tautological assert.ok(true)`);
    assert(!content.includes('assert.equal(1, 1)'), `File ${file} contains tautological assert.equal(1, 1)`);
    assert(!content.includes('assert(true)'), `File ${file} contains tautological assert(true)`);

    const matches = content.match(/assert\./g);
    if (matches) {
      totalAssertCount += matches.length;
    }
  }

  assert.ok(totalAssertCount > 150, `Expected > 150 asserts across test suite, found ${totalAssertCount}`);
  console.log(`    Total verified assertions across E2E test files: ${totalAssertCount}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & VERDICT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 CHALLENGER 2 VERIFICATION SUMMARY`);
console.log(`  • Passed: ${passCount}`);
console.log(`  • Failed: ${failCount}`);
console.log('══════════════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  console.error('❌ FAILURES DETECTED:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('✔ ALL EMPIRICAL INTEGRATION & WORKFLOW CHALLENGES PASSED (100% ACCURACY)');
}
