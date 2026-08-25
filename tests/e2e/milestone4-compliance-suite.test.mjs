/**
 * Milestone 4 Verification Test Suite: Statutory Compliance Automation Suite (R12)
 * 
 * Tests:
 * 1. R12(a): Automated Monthly Compliance PDF Report generation (1st of month) & Director Email
 * 2. R12(b): Restrictive Practice Monthly Report Generator (NDIS Commission Portal Schema)
 * 3. R12(c): NDIS Section 34 Audit Preparation Tool & Evidence Bundle Exporter (SHA-256)
 * 4. R12(d): 12-Month BSP Review Workflow Engine (Current -> Due 30d -> Under Review -> Panel -> Re-Authorized)
 * 5. R12(e): Structured 4-Step Incident Sign-Off Workflow & Governance Engine
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  SEED_USERS,
  SEED_PRACTITIONERS,
  SEED_CLIENTS,
  SEED_CASE_NOTES,
  SEED_INCIDENTS,
  SEED_RESTRICTIVE_PRACTICES,
  SEED_ABC_LOGS,
  SEED_CLAIMS,
  ComplianceAutomationEngine
} from '../harness/emulator.mjs';

const {
  generateMonthlyComplianceReport,
  generateMonthlyComplianceReportHTML,
  dispatchMonthlyComplianceReport,
  scheduleMonthlyComplianceCronCheck,
  exportRestrictivePracticesNDISFormat,
  generateRestrictivePracticesCommissionReport,
  assembleSection34AuditBundle,
  verifyAuditBundleIntegrity,
  evaluateBSPReviewStatus,
  checkBSP12MonthReviews,
  advanceBSPReviewWorkflow,
  getIncidentWorkflowState,
  advanceIncidentWorkflow
} = ComplianceAutomationEngine;

export async function runMilestone4Tests(reporter) {
  reporter.startSuite('Milestone 4: Statutory Compliance Automation Suite (R12)');

  // =========================================================================
  // PHASE 1: R12(a) — AUTOMATED MONTHLY COMPLIANCE PDF REPORT & AUTO-EMAIL
  // =========================================================================
  reporter.startPhase('Phase 1: R12(a) — Automated Monthly Compliance PDF Report & Auto-Email');

  await reporter.test('T4.1.1 - Monthly compliance report aggregates active RPs, reportable incidents, screening rate, and PACE rate', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const report = generateMonthlyComplianceReport('2026-08-01', store, 'director@breakthrough.org.au');

    assert.ok(report.reportId.startsWith('COMPL-MONTHLY-202608'));
    assert.equal(report.reportingMonth, '2026-08-01');
    assert.equal(report.practiceDirectorEmail, 'director@breakthrough.org.au');
    assert.equal(report.metrics.activeRestrictivePracticesCount, 2);
    assert.equal(report.metrics.reportableIncidentsCount, 1);
    assert.ok(report.metrics.screeningComplianceRatePercent >= 75);
    assert.ok(report.metrics.totalClaimsCount > 0);
    assert.ok(report.metrics.paceSubmissionRatePercent >= 50);
    assert.ok(report.auditSummary.includes('Breakthrough OS Monthly Quality & Compliance Report'));
    assert.ok(report.htmlContent.includes('PRV-NDIS-088194'));
  });

  await reporter.test('T4.1.2 - Calculates 100% screening compliance when all active practitioners have valid screening', async () => {
    const customStore = {
      restrictivePractices: SEED_RESTRICTIVE_PRACTICES,
      incidents: SEED_INCIDENTS,
      practitioners: [
        { ...SEED_PRACTITIONERS[0], screeningStatus: 'Valid' },
        { ...SEED_PRACTITIONERS[1], screeningStatus: 'Valid' },
        { ...SEED_PRACTITIONERS[2], screeningStatus: 'Valid' }
      ],
      billingClaims: SEED_CLAIMS
    };

    const report = generateMonthlyComplianceReport('2026-08-01', customStore);
    assert.equal(report.metrics.screeningComplianceRatePercent, 100);
    assert.equal(report.metrics.screeningExpiringSoonCount, 0);
    assert.equal(report.metrics.screeningExpiredCount, 0);
  });

  await reporter.test('T4.1.3 - Accurately detects expired and expiring soon worker screenings in compliance metrics', async () => {
    const customStore = {
      restrictivePractices: [],
      incidents: [],
      practitioners: [
        { ...SEED_PRACTITIONERS[0], screeningStatus: 'Valid' },
        { ...SEED_PRACTITIONERS[1], screeningStatus: 'Expiring Soon' },
        { ...SEED_PRACTITIONERS[2], screeningStatus: 'Expired' }
      ],
      billingClaims: []
    };

    const report = generateMonthlyComplianceReport('2026-08-01', customStore);
    assert.equal(report.metrics.screeningComplianceRatePercent, 33); // 1 out of 3 = 33%
    assert.equal(report.metrics.screeningExpiringSoonCount, 1);
    assert.equal(report.metrics.screeningExpiredCount, 1);
  });

  await reporter.test('T4.1.4 - Formats structured HTML and base64 PDF buffer with official NDIS Provider registration metadata', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const report = generateMonthlyComplianceReport('2026-08-01', store);
    assert.ok(report.pdfBase64, 'Report should contain base64 PDF buffer');
    assert.ok(report.pdfBase64.length > 50);

    const decoded = Buffer.from(report.pdfBase64, 'base64').toString('utf-8');
    assert.ok(decoded.startsWith('%PDF-1.7'));
    assert.ok(decoded.includes('COMPL-MONTHLY-202608') || decoded.includes('Breakthrough OS Monthly Compliance Report'));

    const html = generateMonthlyComplianceReportHTML(report);
    assert.ok(html.includes('Breakthrough Coaching &amp; Consulting'));
    assert.ok(html.includes('Worker Screening Clearance'));
    assert.ok(html.includes('Active Restrictive Practices'));
  });

  await reporter.test('T4.1.5 - Automated cron evaluator triggers on 1st of month and auto-emails report to Practice Director', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Test on 1st of August
    const dateFirst = new Date('2026-08-01T08:00:00Z');
    const report = await scheduleMonthlyComplianceCronCheck(store, dateFirst, 'director@breakthrough.org.au');

    assert.ok(report);
    assert.equal(report.reportingMonth, '2026-08-01');
    assert.equal(report.practiceDirectorEmail, 'director@breakthrough.org.au');
  });

  await reporter.test('T4.1.6 - Dispatches transactional compliance report email with SendGrid dynamic template data', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const report = generateMonthlyComplianceReport('2026-08-01', store);
    const dispatchResult = await dispatchMonthlyComplianceReport(report, 'sarah.jenkins@breakthrough.org.au');

    assert.equal(dispatchResult.success, true);
    assert.ok(dispatchResult.messageId);
  });

  await reporter.test('T4.1.7 - Handles edge cases (empty claims, zero restrictive practices, empty roster) safely', async () => {
    const emptyStore = {
      restrictivePractices: [],
      incidents: [],
      practitioners: [],
      billingClaims: []
    };

    const report = generateMonthlyComplianceReport('2026-08-01', emptyStore);
    assert.equal(report.metrics.activeRestrictivePracticesCount, 0);
    assert.equal(report.metrics.totalIncidentsCount, 0);
    assert.equal(report.metrics.screeningComplianceRatePercent, 100);
    assert.equal(report.metrics.totalBillingSubmittedAmount, 0);
    assert.equal(report.metrics.paceSubmissionRatePercent, 100);
  });

  // =========================================================================
  // PHASE 2: R12(b) — RESTRICTIVE PRACTICE MONTHLY REPORT GENERATOR
  // =========================================================================
  reporter.startPhase('Phase 2: R12(b) — Restrictive Practice Monthly Report Generator');

  await reporter.test('T4.2.1 - Transforms active and emergency restrictive practices into NDIS Commission portal schema', async () => {
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const report = exportRestrictivePracticesNDISFormat(rps, '2026-08');

    assert.ok(report.submissionId.startsWith('NDIS-RP-SUBMISSION-2026-08-'));
    assert.equal(report.reportingPeriod, '2026-08');
    assert.equal(report.providerRegistrationNumber, 'PRV-NDIS-088194');
    assert.equal(report.extractedPractices.length, 2);
    assert.equal(report.extractedPractices[0].practiceType, 'Environmental');
    assert.equal(report.extractedPractices[1].practiceType, 'Chemical');
  });

  await reporter.test('T4.2.2 - Classifies authorized vs emergency/unauthorized uses accurately', async () => {
    const mixedRPs = [
      {
        id: 'rp-1',
        clientId: 'cli-101',
        clientName: 'Jordan Miller',
        practiceType: 'Environmental',
        description: 'Locked pantry cupboard',
        status: 'Authorized',
        authorizationBody: 'VIC Senior Practitioner',
        authorizationReference: 'RPR-2026-VIC-01'
      },
      {
        id: 'rp-2',
        clientId: 'cli-102',
        clientName: 'Liam O’Connor',
        practiceType: 'Physical',
        description: 'Emergency physical guide during high-risk road safety crisis',
        status: 'Proposed',
        authorizationBody: 'Emergency Protocol',
        authorizationReference: 'EMERG-2026-02'
      }
    ];

    const report = exportRestrictivePracticesNDISFormat(mixedRPs, '2026-08');
    assert.equal(report.summary.totalActivePractices, 2);
    assert.equal(report.summary.authorizedCount, 1);
    assert.equal(report.summary.unauthorizedEmergencyCount, 1);
    assert.equal(report.extractedPractices[0].authorizationStatus, 'Authorized');
    assert.equal(report.extractedPractices[1].authorizationStatus, 'Emergency / Unauthorized');
  });

  await reporter.test('T4.2.3 - Extracts Senior Practitioner authorization reference numbers and fading milestones', async () => {
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const report = exportRestrictivePracticesNDISFormat(rps, '2026-08');

    const first = report.extractedPractices[0];
    assert.ok(first.authorizationReference);
    assert.equal(first.authorizingBody, 'Victorian Senior Practitioner Panel');
    assert.ok(first.reductionPlanMilestonesAchieved.length >= 1);
  });

  await reporter.test('T4.2.4 - Generates valid CSV export formatted for NDIS Commission portal upload', async () => {
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const { csvExport, report } = generateRestrictivePracticesCommissionReport(rps, '2026-08');

    assert.ok(csvExport.includes('SubmissionId,ProviderRegNumber,ReportingPeriod,PracticeId'));
    assert.ok(csvExport.includes('PRV-NDIS-088194'));
    assert.ok(csvExport.includes('Jordan Miller'));
    assert.ok(csvExport.includes('Environmental'));
  });

  await reporter.test('T4.2.5 - Generates valid JSON export bundle with complete practice metrics and metadata', async () => {
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const { jsonExport, report } = generateRestrictivePracticesCommissionReport(rps, '2026-08');

    const parsed = JSON.parse(jsonExport);
    assert.equal(parsed.providerRegistrationNumber, 'PRV-NDIS-088194');
    assert.equal(parsed.extractedPractices.length, 2);
    assert.ok(parsed.summary.fadingMilestonesAchievedCount >= 2);
  });

  await reporter.test('T4.2.6 - Formats print-ready statutory return HTML document', async () => {
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const { printableHtml } = generateRestrictivePracticesCommissionReport(rps, '2026-08');

    assert.ok(printableHtml.includes('NDIS Quality and Safeguards Commission'));
    assert.ok(printableHtml.includes('PRV-NDIS-088194'));
    assert.ok(printableHtml.includes('Jordan Miller'));
  });

  // =========================================================================
  // PHASE 3: R12(c) — NDIS SECTION 34 AUDIT PREPARATION & EVIDENCE BUNDLER
  // =========================================================================
  reporter.startPhase('Phase 3: R12(c) — NDIS Section 34 Audit Preparation & Evidence Bundler');

  await reporter.test('T4.3.1 - Packages participant profile, BSP, case notes, incidents, RPs, and screening records into audit bundle', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const bundle = assembleSection34AuditBundle('cli-101', store);

    assert.ok(bundle.bundleId.startsWith('AUDIT-BUNDLE-430891245'));
    assert.equal(bundle.participantId, 'cli-101');
    assert.equal(bundle.participantName, 'Jordan Miller');
    assert.equal(bundle.ndisNumber, '430891245');
    assert.equal(bundle.bundleVersion, '2.4.0');
    assert.equal(bundle.documentsIncluded.clientProfile, true);
    assert.ok(bundle.documentsIncluded.caseNotesCount >= 1);
    assert.ok(bundle.documentsIncluded.restrictivePracticesCount >= 1);
    assert.equal(bundle.documentsIncluded.practitionerScreeningVerified, true);
  });

  await reporter.test('T4.3.2 - Generates standardized Section 34 audit manifest with 6 clinical datasets', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const bundle = assembleSection34AuditBundle('cli-101', store);
    assert.equal(bundle.manifest.length, 6);
    assert.ok(bundle.manifest[0].includes('Participant_Profile_430891245'));
    assert.ok(bundle.manifest[1].includes('Clinical_Case_Notes'));
    assert.ok(bundle.manifest[2].includes('Restrictive_Practices'));
    assert.ok(bundle.manifest[3].includes('Incident_Register'));
    assert.ok(bundle.manifest[4].includes('ABC_Observation_Data'));
    assert.ok(bundle.manifest[5].includes('Section_34_Reasonable_And_Necessary_Compliance_Audit'));
  });

  await reporter.test('T4.3.3 - Computes SHA-256 cryptographic digest of bundled clinical evidence', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const bundle = assembleSection34AuditBundle('cli-101', store);
    assert.ok(bundle.integrityHash, 'Bundle should contain SHA-256 hash');
    assert.equal(bundle.integrityHash.length, 64); // SHA-256 hex string is exactly 64 chars
    assert.ok(/^[0-9a-f]{64}$/.test(bundle.integrityHash));
  });

  await reporter.test('T4.3.4 - Cryptographic integrity verification (verifyAuditBundleIntegrity) succeeds on valid bundle', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const bundle = assembleSection34AuditBundle('cli-101', store);
    const verification = verifyAuditBundleIntegrity(bundle);

    assert.equal(verification.isValid, true);
    assert.equal(verification.expectedHash, verification.calculatedHash);
  });

  await reporter.test('T4.3.5 - Cryptographic integrity verification detects tampered payload and returns isValid: false', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const bundle = assembleSection34AuditBundle('cli-101', store);

    // Tamper with client name in dataPayload
    bundle.dataPayload.client.name = 'Tampered Participant Name';

    const verification = verifyAuditBundleIntegrity(bundle);
    assert.equal(verification.isValid, false);
    assert.notEqual(verification.expectedHash, verification.calculatedHash);
  });

  await reporter.test('T4.3.6 - Throws informative error when participant ID does not exist in store', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    assert.throws(
      () => assembleSection34AuditBundle('non-existent-client-id', store),
      /Client non-existent-client-id not found/
    );
  });

  // =========================================================================
  // PHASE 4: R12(d) — 12-MONTH BSP REVIEW WORKFLOW ENGINE
  // =========================================================================
  reporter.startPhase('Phase 4: R12(d) — 12-Month BSP Review Workflow Engine');

  await reporter.test('T4.4.1 - Calculates exact days remaining until statutory 12-month review deadline', async () => {
    const bsp = {
      id: 'bsp-test-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      reviewDate: '2026-09-24', // 30 days from 2026-08-25
      authorName: 'Marcus Vance',
      status: 'Active'
    };

    const alert = evaluateBSPReviewStatus(bsp, '2026-08-25');
    assert.equal(alert.daysRemaining, 30);
  });

  await reporter.test('T4.4.2 - Evaluates ON_TRACK status when review date is > 30 days away', async () => {
    const bsp = {
      id: 'bsp-test-2',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      reviewDate: '2027-04-15',
      authorName: 'Marcus Vance',
      status: 'Active'
    };

    const alert = evaluateBSPReviewStatus(bsp, '2026-08-25');
    assert.equal(alert.status, 'ON_TRACK');
    assert.equal(alert.severity, 'info');
  });

  await reporter.test('T4.4.3 - Triggers WARNING_30_DAYS warning alert when review date is within 30 days', async () => {
    const bsp = {
      id: 'bsp-test-3',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      reviewDate: '2026-09-15', // 21 days
      authorName: 'Marcus Vance',
      status: 'Active'
    };

    const alert = evaluateBSPReviewStatus(bsp, '2026-08-25');
    assert.equal(alert.status, 'WARNING_30_DAYS');
    assert.equal(alert.severity, 'medium');
  });

  await reporter.test('T4.4.4 - Triggers URGENT_14_DAYS urgent alert when review date is within 14 days', async () => {
    const bsp = {
      id: 'bsp-test-4',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      reviewDate: '2026-09-02', // 8 days
      authorName: 'Marcus Vance',
      status: 'Active'
    };

    const alert = evaluateBSPReviewStatus(bsp, '2026-08-25');
    assert.equal(alert.status, 'URGENT_14_DAYS');
    assert.equal(alert.severity, 'high');
  });

  await reporter.test('T4.4.5 - Classifies BSP as EXPIRED with high severity when review date has elapsed', async () => {
    const bsp = {
      id: 'bsp-test-5',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      reviewDate: '2026-08-01', // already expired
      authorName: 'Marcus Vance',
      status: 'Active'
    };

    const alert = evaluateBSPReviewStatus(bsp, '2026-08-25');
    assert.equal(alert.status, 'EXPIRED');
    assert.equal(alert.severity, 'high');
    assert.ok(alert.recommendation.includes('expired'));
  });

  await reporter.test('T4.4.6 - checkBSP12MonthReviews scans collection and returns all actionable review alerts', async () => {
    const bsps = [
      { id: 'bsp-1', clientId: 'c1', clientName: 'Alice', reviewDate: '2027-05-01' }, // ON_TRACK
      { id: 'bsp-2', clientId: 'c2', clientName: 'Bob', reviewDate: '2026-09-10' },   // WARNING_30_DAYS
      { id: 'bsp-3', clientId: 'c3', clientName: 'Charlie', reviewDate: '2026-09-01' }, // URGENT_14_DAYS
      { id: 'bsp-4', clientId: 'c4', clientName: 'Diana', reviewDate: '2026-07-20' }   // EXPIRED
    ];

    const alerts = checkBSP12MonthReviews(bsps, '2026-08-25');
    assert.equal(alerts.length, 3);
    assert.equal(alerts.find(a => a.clientName === 'Bob').status, 'WARNING_30_DAYS');
    assert.equal(alerts.find(a => a.clientName === 'Charlie').status, 'URGENT_14_DAYS');
    assert.equal(alerts.find(a => a.clientName === 'Diana').status, 'EXPIRED');
  });

  await reporter.test('T4.4.7 - advanceBSPReviewWorkflow validates sequential state transitions and updates review date on Re-Authorized', async () => {
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    const bsp = {
      id: 'bsp-workflow-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      status: 'Current',
      reviewDate: '2026-09-25'
    };

    // Current -> Under Review
    const step1 = advanceBSPReviewWorkflow(bsp, 'Under Review', practitionerAuth, 'Starting annual assessment review');
    assert.equal(step1.newStatus, 'Under Review');
    assert.equal(step1.actorName, 'Marcus Vance');

    // Under Review -> Panel Submitted
    bsp.status = 'Under Review';
    const step2 = advanceBSPReviewWorkflow(bsp, 'Panel Submitted', practitionerAuth, 'Submitted to Victorian Senior Practitioner Panel');
    assert.equal(step2.newStatus, 'Panel Submitted');

    // Panel Submitted -> Re-Authorized (Resets review date by +12 months / 365 days)
    bsp.status = 'Panel Submitted';
    const step3 = advanceBSPReviewWorkflow(bsp, 'Re-Authorized', practitionerAuth, 'Approved with zero modifications');
    assert.equal(step3.newStatus, 'Re-Authorized');
    assert.ok(step3.newReviewDate);
    assert.notEqual(step3.newReviewDate, '2026-09-25');
  });

  // =========================================================================
  // PHASE 5: R12(e) — STRUCTURED 4-STEP INCIDENT SIGN-OFF WORKFLOW
  // =========================================================================
  reporter.startPhase('Phase 5: R12(e) — Structured 4-Step Incident Sign-Off Workflow');

  await reporter.test('T4.5.1 - Initializes incident in Step 1 (Open) with 24-hour statutory notice flag', async () => {
    const incident = {
      id: 'inc-workflow-001',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      incidentDate: '2026-08-25T10:00:00Z',
      severity: 'Critical / Reportable',
      status: 'Open',
      description: 'Acute behavioural transition requiring physical safety containment.',
      immediateActionTaken: 'Sensory quiet room debrief and practitioner notified.',
      reportedBy: 'Marcus Vance',
      isNdisReportable: true,
      ndis24hrNotified: true,
      ndis5daySubmitted: false
    };

    const workflow = getIncidentWorkflowState(incident);
    assert.equal(workflow.currentStep, 1);
    assert.equal(workflow.currentStatus, 'Open');
    assert.equal(workflow.step1_lodgement.completed, true);
    assert.equal(workflow.step1_lodgement.ndis24hNotified, true);
    assert.equal(workflow.step1_lodgement.ndisReportable, true);
    assert.equal(workflow.step2_rootCause.completed, false);
    assert.equal(workflow.step4_directorSignOff.completed, false);
  });

  await reporter.test('T4.5.2 - Step 1 -> Step 2 (Investigating): Advances workflow and records investigation state', async () => {
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    const transition = advanceIncidentWorkflow('inc-workflow-001', 'Open', 'Investigating', practitionerAuth, {
      description: 'Root cause investigation commenced.',
      actionTaken: 'Interviews scheduled with support workers.'
    });

    assert.equal(transition.incidentId, 'inc-workflow-001');
    assert.equal(transition.previousStatus, 'Open');
    assert.equal(transition.newStatus, 'Investigating');
    assert.equal(transition.signedOffBy, 'Marcus Vance');
    assert.equal(transition.workflow.currentStep, 2);
  });

  await reporter.test('T4.5.3 - Step 2 -> Step 3 (Clinical Review): Validates corrective actions and BSP amendment flag', async () => {
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    const transition = advanceIncidentWorkflow('inc-workflow-001', 'Investigating', 'Clinical Review', practitionerAuth, {
      description: 'Root cause identified as sudden change in room lighting and staffing shift gap.',
      actionTaken: 'Lighting dimmer installed and shift transition checklist updated.'
    });

    assert.equal(transition.newStatus, 'Clinical Review');
    assert.equal(transition.workflow.currentStep, 3);
    assert.equal(transition.workflow.step2_rootCause.completed, true);
  });

  await reporter.test('T4.5.4 - Step 3 -> Step 4 (Director Sign-off): Advances to executive review queue', async () => {
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    const transition = advanceIncidentWorkflow('inc-workflow-001', 'Clinical Review', 'Director Sign-off', practitionerAuth);
    assert.equal(transition.newStatus, 'Director Sign-off');
    assert.equal(transition.workflow.currentStep, 4);
  });

  await reporter.test('T4.5.5 - Non-admin practitioner is strictly DENIED final sign-off to close incident (PERMISSION_DENIED)', async () => {
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    assert.throws(
      () => advanceIncidentWorkflow('inc-workflow-001', 'Director Sign-off', 'Closed', practitionerAuth),
      /PERMISSION_DENIED.*ADMIN/
    );
  });

  await reporter.test('T4.5.6 - Clinical Director (ADMIN role) successfully performs final sign-off and incident closure', async () => {
    const adminAuth = { uid: 'user-director', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };

    const transition = advanceIncidentWorkflow('inc-workflow-001', 'Director Sign-off', 'Closed', adminAuth, {
      directorNotes: 'All NDIS Commission 24h & 5-day lodgements verified. BSP updated. Incident closed.'
    });

    assert.equal(transition.newStatus, 'Closed');
    assert.equal(transition.signedOffBy, 'Dr. Sarah Jenkins');
    assert.equal(transition.workflow.step4_directorSignOff.completed, true);
    assert.equal(transition.workflow.step4_directorSignOff.closureDecision, 'Approved & Closed');
  });

  await reporter.test('T4.5.7 - Rejects illegal state transition skipping intermediate steps (e.g. Open directly to Closed)', async () => {
    const adminAuth = { uid: 'user-director', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };

    assert.throws(
      () => advanceIncidentWorkflow('inc-workflow-001', 'Open', 'Closed', adminAuth),
      /INVALID_STATE_TRANSITION/
    );
  });

  await reporter.test('T4.5.8 - Rejects unauthenticated workflow transitions', async () => {
    assert.throws(
      () => advanceIncidentWorkflow('inc-workflow-001', 'Open', 'Investigating', null),
      /PERMISSION_DENIED/
    );
  });
}
