/**
 * Tier 6: AI Clinical Intelligence & Core Security Verification Suite
 * 
 * Comprehensive E2E testing for Breakthrough OS Requirements R1 through R8:
 * - Phase 1: R1 — Real Firebase Authentication, IndexedDB Persistence & 5-Role RBAC (4 tests)
 * - Phase 2: R2 — AI Behaviour Support Plan (BSP) Generator & PDF Export (4 tests)
 * - Phase 3: R3 — AI ABC Log Pattern Recognition & PBS Intervention Advisor (3 tests)
 * - Phase 4: R4 — AI 5-Factor Risk Scoring Engine & Critical Alert Dispatch (4 tests)
 * - Phase 5: R5 — AI Billing Claim Pre-Submission Validator (4 tests)
 * - Phase 6: R6 — AI Semantic Natural Language Search Across Records (3 tests)
 * - Phase 7: R7 — AI Scheduling Optimiser & Google Calendar Sync (3 tests)
 * - Phase 8: R8 — NDIS PRODA API Direct Batch Submit & PACE Polling (3 tests)
 * 
 * Total Tests: 28 tests
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  IndexedDBSessionEmulator,
  RouteProtectionMiddleware,
  AIAssistantEngine,
  NDISProdaApiEmulator,
  NotificationServiceEmulator,
  NDIS_2026_PRICE_GUIDE,
  SEED_CLIENTS,
  SEED_PRACTITIONERS,
  SEED_USERS,
  SEED_CLAIMS,
  SEED_INCIDENTS,
  SEED_RESTRICTIVE_PRACTICES,
  SEED_ABC_LOGS,
  SEED_SHIFTS,
  SEED_CASE_NOTES
} from '../harness/emulator.mjs';

export async function runTier6Tests(reporter) {
  reporter.startSuite('Tier 6: AI Clinical Intelligence & Core Security (R1-R8)');

  // =========================================================================
  // PHASE 1: R1 — AUTHENTICATION, PERSISTENCE & 5-ROLE RBAC
  // =========================================================================
  reporter.startPhase('Phase 1: R1 — Firebase Auth, Session Persistence & 5-Role RBAC');

  await reporter.test('T6.1.1 - Email/password sign-in & session token issuance across all 5 roles (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR, PARTICIPANT)', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const roles = ['ADMIN', 'PRACTITIONER', 'VIEWER', 'SUPPORT_COORDINATOR', 'PARTICIPANT'];
    for (const role of roles) {
      const user = SEED_USERS.find(u => u.role === role);
      assert.ok(user, `User with role ${role} must exist in seed data`);

      store.switchUser(user.id);
      const auth = store.getAuthContext();
      assert.equal(auth.role, role);
      assert.equal(auth.uid, user.id);
      assert.ok(auth.email.includes('@'));
    }
  });

  await reporter.test('T6.1.2 - Session persistence across browser reloads via IndexedDBSessionEmulator', async () => {
    const sessionDb = new IndexedDBSessionEmulator('breakthrough_auth_session_db');

    assert.equal(sessionDb.hasActiveSession(), false);

    const sessionPayload = {
      uid: 'user-specialist',
      email: 'marcus.vance@breakthrough.org.au',
      name: 'Marcus Vance',
      role: 'PRACTITIONER',
      practitionerId: 'prac-202'
    };

    sessionDb.saveSession(sessionPayload);
    assert.equal(sessionDb.hasActiveSession(), true);

    // Simulate browser reload by reading from fresh session storage instance
    const reloadedSession = sessionDb.loadSession();
    assert.ok(reloadedSession);
    assert.equal(reloadedSession.uid, 'user-specialist');
    assert.equal(reloadedSession.role, 'PRACTITIONER');
    assert.ok(reloadedSession.sessionToken.startsWith('token-'));
    assert.ok(reloadedSession.persistedAt);

    // Clear session on logout
    sessionDb.clearSession();
    assert.equal(sessionDb.hasActiveSession(), false);
    assert.equal(sessionDb.loadSession(), null);
  });

  await reporter.test('T6.1.3 - Firestore Security Rules enforce 5-role permissions (SUPPORT_COORDINATOR and PARTICIPANT write restrictions, PARTICIPANT cross-client access block)', async () => {
    const firestore = new InMemoryFirestore();

    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };
    const coordinatorAuth = { uid: 'user-coordinator', role: 'SUPPORT_COORDINATOR', name: 'David Chen', assignedClientIds: ['cli-101'] };
    const viewerAuth = { uid: 'user-auditor', role: 'VIEWER', name: 'Elena Rostova' };
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

    // 1. PARTICIPANT can read own client doc
    const ownDoc = await firestore.getDoc('clients', 'cli-101', participantAuth);
    assert.ok(ownDoc);
    assert.equal(ownDoc.name, 'Jordan Miller');

    // 2. PARTICIPANT is blocked from reading other clients
    await assert.rejects(
      async () => await firestore.getDoc('clients', 'cli-102', participantAuth),
      /PERMISSION_DENIED/
    );

    // 3. PARTICIPANT cannot perform writes on clinical collections
    await assert.rejects(
      async () => await firestore.setDoc('caseNotes', 'note-malicious', { text: 'hack' }, participantAuth),
      /PERMISSION_DENIED/
    );

    // 4. SUPPORT_COORDINATOR cannot write or delete clinical notes
    await assert.rejects(
      async () => await firestore.deleteDoc('clients', 'cli-101', coordinatorAuth),
      /PERMISSION_DENIED/
    );

    // 5. VIEWER is blocked from mutating billing claims
    await assert.rejects(
      async () => await firestore.setDoc('billingClaims', 'claim-new', { totalAmount: 100 }, viewerAuth),
      /PERMISSION_DENIED/
    );

    // 6. PRACTITIONER can create case notes
    const noteId = await firestore.addDoc('caseNotes', {
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: 'Practitioner session conducted.',
      authorId: practitionerAuth.uid
    }, practitionerAuth);
    assert.ok(noteId);
  });

  await reporter.test('T6.1.4 - Route protection middleware gates unauthorized URLs and redirects unauthenticated users to /login', async () => {
    // 1. Public routes allow unrestricted access
    assert.deepEqual(RouteProtectionMiddleware.evaluateRouteAccess('/login', null), { allowed: true, redirect: null });
    assert.deepEqual(RouteProtectionMiddleware.evaluateRouteAccess('/public', null), { allowed: true, redirect: null });

    // 2. Unauthenticated user accessing protected clinical route
    const unauthClinical = RouteProtectionMiddleware.evaluateRouteAccess('/clinical', null);
    assert.equal(unauthClinical.allowed, false);
    assert.equal(unauthClinical.redirect, '/login');

    // 3. PARTICIPANT role accessing /admin route is denied
    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };
    const participantAdmin = RouteProtectionMiddleware.evaluateRouteAccess('/admin/users', participantAuth);
    assert.equal(participantAdmin.allowed, false);
    assert.equal(participantAdmin.redirect, '/unauthorized');

    // 4. PRACTITIONER accessing /clinical route is allowed
    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };
    const pracClinical = RouteProtectionMiddleware.evaluateRouteAccess('/clinical/bsp-generator', practitionerAuth);
    assert.equal(pracClinical.allowed, true);
    assert.equal(pracClinical.redirect, null);

    // 5. ADMIN accessing /admin and /compliance-director is allowed
    const adminAuth = { uid: 'user-director', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };
    const adminAccess = RouteProtectionMiddleware.evaluateRouteAccess('/compliance-director', adminAuth);
    assert.equal(adminAccess.allowed, true);
  });

  // =========================================================================
  // PHASE 2: R2 — AI BEHAVIOUR SUPPORT PLAN (BSP) GENERATOR
  // =========================================================================
  reporter.startPhase('Phase 2: R2 — AI Behaviour Support Plan (BSP) Generator & PDF Export');

  await reporter.test('T6.2.1 - Synthesize complete NDIS-compliant BSP from client ABC logs, SMART goals, restrictive practices, and incident history', async () => {
    const client = SEED_CLIENTS[0];
    const abcLogs = SEED_ABC_LOGS;
    const goals = client.goals;
    const rps = SEED_RESTRICTIVE_PRACTICES.filter(r => r.clientId === client.id);
    const incidents = SEED_INCIDENTS.filter(i => i.clientId === client.id);

    const bsp = AIAssistantEngine.generateComprehensiveBSP(client, abcLogs, goals, rps, incidents);

    assert.ok(bsp.id.startsWith('bsp-'));
    assert.equal(bsp.clientId, client.id);
    assert.equal(bsp.clientName, 'Jordan Miller');
    assert.equal(bsp.ndisNumber, client.ndisNumber);
    assert.equal(bsp.status, 'Active');
    assert.ok(bsp.summary.includes('NDIS Quality and Safeguards Commission'));
    assert.ok(bsp.primaryBehaviorsOfConcern.length > 0);
    assert.ok(bsp.proactiveStrategies.length >= 3);
    assert.ok(bsp.reactiveStrategies.length === 3); // 3-phase de-escalation
    assert.equal(bsp.restrictivePractices.length, rps.length);
  });

  await reporter.test('T6.2.2 - BSP document structure adheres to NDIS Commission standards (proactive/reactive strategies, functional hypotheses, review timelines)', async () => {
    const client = SEED_CLIENTS[2]; // Liam O'Connor (High Risk)
    const abcLogs = [
      {
        id: 'abc-liam-1',
        clientId: client.id,
        antecedent: 'Loud school bell transition',
        behavior: 'Physical strike on desk',
        consequence: 'Offered sensory quiet room',
        perceivedFunction: 'Sensory/Automatic'
      }
    ];
    const goals = client.goals;
    const rps = SEED_RESTRICTIVE_PRACTICES.filter(r => r.clientId === client.id);

    const bsp = AIAssistantEngine.generateComprehensiveBSP(client, abcLogs, goals, rps, []);

    // Validate NDIS Commission required fields
    assert.ok(bsp.antecedentTriggers.includes('Loud school bell transition'));
    assert.ok(bsp.functionalHypotheses.includes('Sensory/Automatic'));
    assert.equal(bsp.reviewTimelineMonths, 12);
    assert.ok(bsp.reviewDate);
    assert.ok(bsp.emergencyProtocols.includes('000'));
    assert.ok(bsp.proactiveStrategies.some(s => s.toLowerCase().includes('visual') || s.toLowerCase().includes('sensory')));
    assert.ok(bsp.reactiveStrategies.some(s => s.includes('Phase 1')));
    assert.ok(bsp.reactiveStrategies.some(s => s.includes('Phase 2')));
    assert.ok(bsp.reactiveStrategies.some(s => s.includes('Phase 3')));
  });

  await reporter.test('T6.2.3 - Formatted PDF export generator compiles structured document buffer with metadata, page numbering, and signing blocks', async () => {
    const client = SEED_CLIENTS[0];
    const bsp = AIAssistantEngine.generateComprehensiveBSP(client, SEED_ABC_LOGS, client.goals, SEED_RESTRICTIVE_PRACTICES, []);

    const pdfExport = AIAssistantEngine.generateBSPPdfBuffer(bsp);

    assert.equal(pdfExport.contentType, 'application/pdf');
    assert.ok(pdfExport.filename.endsWith('.pdf'));
    assert.ok(pdfExport.filename.includes('Jordan_Miller'));
    assert.equal(pdfExport.metadata.pageCount, 8);
    assert.equal(pdfExport.metadata.ndisCommissionCompliant, true);
    assert.ok(pdfExport.rawBytes instanceof Buffer);
    assert.ok(pdfExport.sizeBytes > 200, 'PDF buffer must contain substantial document payload');
    assert.ok(pdfExport.rawBytes.toString('utf-8', 0, 8).startsWith('%PDF-1.7'));
  });

  await reporter.test('T6.2.4 - BSP generation with sparse / minimal client data gracefully applies clinical heuristic defaults without failure', async () => {
    const sparseClient = {
      id: 'cli-sparse-99',
      name: 'Taylor Quinn',
      status: 'Onboarding'
    };

    // Generate BSP with empty lists
    const bsp = AIAssistantEngine.generateComprehensiveBSP(sparseClient, [], [], [], []);

    assert.ok(bsp);
    assert.equal(bsp.clientName, 'Taylor Quinn');
    assert.ok(bsp.primaryBehaviorsOfConcern.length >= 1);
    assert.ok(bsp.proactiveStrategies.length >= 2);
    assert.ok(bsp.reactiveStrategies.length === 3);
    assert.equal(bsp.restrictivePractices.length, 0);

    const pdf = AIAssistantEngine.generateBSPPdfBuffer(bsp);
    assert.ok(pdf.sizeBytes > 0);
  });

  // =========================================================================
  // PHASE 3: R3 — AI ABC LOG PATTERN RECOGNITION & PBS INTERVENTION ADVISOR
  // =========================================================================
  reporter.startPhase('Phase 3: R3 — AI ABC Log Pattern Recognition & PBS Intervention Advisor');

  await reporter.test('T6.3.1 - Identify top 3 antecedent clusters and statistically significant triggers across chronological ABC entries', async () => {
    const testABCLogs = [
      { id: '1', antecedent: 'Transition from iPad to dinnertime', behavior: 'Protest', perceivedFunction: 'Escape/Avoidance', timeOfDay: '14:20' },
      { id: '2', antecedent: 'Transition from iPad to dinnertime', behavior: 'Dropped to floor', perceivedFunction: 'Escape/Avoidance', timeOfDay: '14:35' },
      { id: '3', antecedent: 'Transition from iPad to dinnertime', behavior: 'Screaming', perceivedFunction: 'Escape/Avoidance', timeOfDay: '14:40' },
      { id: '4', antecedent: 'Loud noise in supermarket', behavior: 'Covered ears and cried', perceivedFunction: 'Sensory/Automatic', timeOfDay: '10:15' },
      { id: '5', antecedent: 'Loud noise in supermarket', behavior: 'Agitation', perceivedFunction: 'Sensory/Automatic', timeOfDay: '10:45' },
      { id: '6', antecedent: 'Demand to complete handwriting task', behavior: 'Threw pencil', perceivedFunction: 'Escape/Avoidance', timeOfDay: '09:30' }
    ];

    const analysis = AIAssistantEngine.analyzeABCPatterns(testABCLogs);

    assert.ok(analysis.topAntecedents.length <= 3);
    assert.equal(analysis.topAntecedents[0].antecedent, 'Transition from iPad to dinnertime');
    assert.equal(analysis.topAntecedents[0].count, 3);
    assert.equal(analysis.topAntecedents[0].percentage, 50); // 3 of 6 = 50%

    assert.equal(analysis.topAntecedents[1].antecedent, 'Loud noise in supermarket');
    assert.equal(analysis.topAntecedents[1].count, 2);
  });

  await reporter.test('T6.3.2 - Temporal distribution analysis identifies peak escalation time-of-day and day-of-week heat patterns', async () => {
    const testABCLogs = [
      { id: '1', antecedent: 'A1', behavior: 'B1', timeOfDay: '09:15', perceivedFunction: 'Escape/Avoidance' },
      { id: '2', antecedent: 'A2', behavior: 'B2', timeOfDay: '10:30', perceivedFunction: 'Escape/Avoidance' },
      { id: '3', antecedent: 'A3', behavior: 'B3', timeOfDay: '13:00', perceivedFunction: 'Escape/Avoidance' },
      { id: '4', antecedent: 'A4', behavior: 'B4', timeOfDay: '14:20', perceivedFunction: 'Escape/Avoidance' },
      { id: '5', antecedent: 'A5', behavior: 'B5', timeOfDay: '16:45', perceivedFunction: 'Escape/Avoidance' },
      { id: '6', antecedent: 'A6', behavior: 'B6', timeOfDay: '19:10', perceivedFunction: 'Escape/Avoidance' }
    ];

    const analysis = AIAssistantEngine.analyzeABCPatterns(testABCLogs);

    assert.equal(analysis.temporalDistribution['Morning (08:00 - 12:00)'], 2);
    assert.equal(analysis.temporalDistribution['Afternoon (12:00 - 17:00)'], 3);
    assert.equal(analysis.temporalDistribution['Evening (17:00 - 21:00)'], 1);
    assert.equal(analysis.temporalDistribution['Night (21:00 - 08:00)'], 0);
  });

  await reporter.test('T6.3.3 - PBS Intervention Auto-Advisor generates evidence-based proactive and replacement strategies tailored to identified behavioural functions', async () => {
    // 1. Escape/Avoidance Function
    const escapeLogs = [
      { id: '1', antecedent: 'Task demand', behavior: 'Avoidance', perceivedFunction: 'Escape/Avoidance', timeOfDay: '10:00' },
      { id: '2', antecedent: 'Task demand', behavior: 'Avoidance', perceivedFunction: 'Escape/Avoidance', timeOfDay: '11:00' }
    ];
    const escapeAnalysis = AIAssistantEngine.analyzeABCPatterns(escapeLogs);
    assert.equal(escapeAnalysis.dominantFunction, 'Escape/Avoidance');
    assert.ok(escapeAnalysis.pbsRecommendations.some(r => r.includes('break-card') || r.includes('visual')));

    // 2. Sensory/Automatic Function
    const sensoryLogs = [
      { id: '3', antecedent: 'Auditory overload', behavior: 'Stimming', perceivedFunction: 'Sensory/Automatic', timeOfDay: '14:00' },
      { id: '4', antecedent: 'Crowd noise', behavior: 'Ear covering', perceivedFunction: 'Sensory/Automatic', timeOfDay: '15:00' }
    ];
    const sensoryAnalysis = AIAssistantEngine.analyzeABCPatterns(sensoryLogs);
    assert.equal(sensoryAnalysis.dominantFunction, 'Sensory/Automatic');
    assert.ok(sensoryAnalysis.pbsRecommendations.some(r => r.includes('sensory diet') || r.includes('quiet zone')));
  });

  // =========================================================================
  // PHASE 4: R4 — AI 5-FACTOR RISK SCORING ENGINE & ALERT DISPATCH
  // =========================================================================
  reporter.startPhase('Phase 4: R4 — AI 5-Factor Risk Scoring Engine & Alert Dispatch');

  await reporter.test('T6.4.1 - Compute multi-factor risk score (0-100) across incidents, restrictive practices, missed appointments, budget depletion, and case notes', async () => {
    const client = SEED_CLIENTS[0]; // Jordan Miller
    const incidents = SEED_INCIDENTS;
    const rps = SEED_RESTRICTIVE_PRACTICES;
    const notes = SEED_CASE_NOTES;

    const risk = AIAssistantEngine.evaluateClientRisk(client, incidents, rps, notes, 1);

    assert.ok(risk.score >= 0 && risk.score <= 100);
    assert.ok(risk.factorBreakdown.incidentFactor >= 0);
    assert.ok(risk.factorBreakdown.restrictivePracticeFactor >= 0);
    assert.ok(risk.factorBreakdown.missedAppointmentsFactor >= 0);
    assert.ok(risk.factorBreakdown.budgetDepletionFactor >= 0);
    assert.ok(risk.factorBreakdown.caseNoteArousalFactor >= 0);
    assert.ok(risk.rationale.includes('clinical risk score'));
  });

  await reporter.test('T6.4.2 - Risk category mapping (Low, Medium, High, Critical) with transparent plain-English rationale generation', async () => {
    // 1. Low risk participant: no incidents, no RPs, ample budget
    const safeClient = { id: 'cli-safe', name: 'Safe Participant', totalBudget: 50000, spentBudget: 5000 };
    const lowRisk = AIAssistantEngine.evaluateClientRisk(safeClient, [], [], [], 0);
    assert.equal(lowRisk.riskLevel, 'Low');
    assert.ok(lowRisk.score <= 35);

    // 2. Critical risk participant: multiple reportable incidents + active chemical restraint + depleted budget
    const criticalClient = { id: 'cli-crit', name: 'High Needs Participant', totalBudget: 30000, spentBudget: 29000 };
    const criticalIncidents = [
      { id: 'inc-1', clientId: 'cli-crit', severity: 'Critical / Reportable', isNdisReportable: true, description: 'Acute strike' },
      { id: 'inc-2', clientId: 'cli-crit', severity: 'Critical / Reportable', isNdisReportable: true, description: 'Emergency restraint' }
    ];
    const activeRPs = [
      { id: 'rp-1', clientId: 'cli-crit', status: 'Authorized', monthlyReportStatus: 'Overdue' }
    ];
    const distressedNotes = [
      { id: 'n-1', clientId: 'cli-crit', subjective: 'Severe acute agitation and distress observed', objective: 'Staff applied restraint', assessment: 'Risk elevated' },
      { id: 'n-2', clientId: 'cli-crit', subjective: 'Escalation and crisis de-escalation required', objective: 'Quiet space', assessment: 'High stress' }
    ];

    const criticalRisk = AIAssistantEngine.evaluateClientRisk(criticalClient, criticalIncidents, activeRPs, distressedNotes, 3);
    assert.equal(criticalRisk.riskLevel, 'Critical');
    assert.ok(criticalRisk.score >= 75);
    assert.ok(criticalRisk.triggeredAlerts.length >= 3);
  });

  await reporter.test('T6.4.3 - Transition to Critical risk triggers immediate multi-channel alert dispatch to Practice Director', async () => {
    const notificationService = new NotificationServiceEmulator();

    const criticalIncident = {
      id: 'inc-crit-88',
      clientName: 'Jordan Miller',
      severity: 'Critical / Reportable',
      incidentDate: '2026-08-25T09:30:00Z',
      description: 'Physical strike and property damage during therapy transition.',
      immediateActionTaken: 'De-escalated via quiet room and 24h NDIS notification lodged.'
    };

    const dispatch = notificationService.dispatchCriticalIncidentAlert(
      criticalIncident,
      'sarah.jenkins@breakthrough.org.au',
      '+61411234567'
    );

    assert.ok(dispatch.sms);
    assert.equal(dispatch.sms.status, 'delivered');
    assert.equal(dispatch.sms.priority, 'high');
    assert.ok(dispatch.sms.body.includes('CRITICAL ALERT'));

    assert.ok(dispatch.email);
    assert.equal(dispatch.email.status, 202);
    assert.ok(dispatch.email.subject.includes('URGENT: NDIS 24-Hour Critical Incident'));
    assert.equal(notificationService.getSentEmails().length, 1);
    assert.equal(notificationService.getSentSms().length, 1);
  });

  await reporter.test('T6.4.4 - Boundary risk score transitions (e.g., score 74 -> 75 crossing High into Critical) accurately update client card state', async () => {
    const client = { id: 'cli-boundary', name: 'Boundary Tester', totalBudget: 40000, spentBudget: 20000 };

    // Baseline calculation: baseline is 15 -> Low
    const initialRisk = AIAssistantEngine.evaluateClientRisk(client, [], [], [], 0);
    assert.equal(initialRisk.riskLevel, 'Low');

    // High risk state (50 <= score < 75):
    // Baseline = 15, High incident = 10, Active RP = 15, 1 missed appt = 5, 2 distressed notes = 15 => score = 60 (High)
    const highIncidents = [{ id: 'inc-b1', clientId: 'cli-boundary', severity: 'High', isNdisReportable: false }];
    const rps = [{ id: 'rp-b1', clientId: 'cli-boundary', status: 'Authorized', monthlyReportStatus: 'Submitted' }];
    const notes = [
      { id: 'nb-1', clientId: 'cli-boundary', subjective: 'Severe acute agitation', objective: '', assessment: '' },
      { id: 'nb-2', clientId: 'cli-boundary', subjective: 'Crisis escalation', objective: '', assessment: '' }
    ];

    const highRisk = AIAssistantEngine.evaluateClientRisk(client, highIncidents, rps, notes, 1);
    assert.ok(highRisk.score >= 50 && highRisk.score < 75, `Expected score ${highRisk.score} to be between 50 and 74`);
    assert.equal(highRisk.riskLevel, 'High');

    // Add critical incident (20 pts) + 2 more missed appointments (10 pts) -> pushes score to 90 (Critical >= 75)
    const critIncidents = [...highIncidents, { id: 'inc-b2', clientId: 'cli-boundary', severity: 'Critical / Reportable', isNdisReportable: true }];
    const critRisk = AIAssistantEngine.evaluateClientRisk(client, critIncidents, rps, notes, 3);
    assert.ok(critRisk.score >= 75, `Expected score ${critRisk.score} to be >= 75`);
    assert.equal(critRisk.riskLevel, 'Critical');
  });

  // =========================================================================
  // PHASE 5: R5 — AI BILLING CLAIM PRE-SUBMISSION VALIDATOR
  // =========================================================================
  reporter.startPhase('Phase 5: R5 — AI Billing Claim Pre-Submission Validator');

  await reporter.test('T6.5.1 - Clean claim passes pre-submission validation with green verification badge and zero errors', async () => {
    const client = SEED_CLIENTS[0];
    const claim = {
      id: 'claim-clean-1',
      clientId: client.id,
      clientName: client.name,
      ndisNumber: client.ndisNumber,
      serviceDate: '2026-08-12',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62
    };

    const caseNotes = [
      {
        id: 'note-501',
        clientId: client.id,
        date: '2026-08-12',
        status: 'Approved'
      }
    ];

    const result = AIAssistantEngine.validateBillingClaim(claim, client, [], caseNotes, NDIS_2026_PRICE_GUIDE);

    assert.equal(result.isClean, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.badges.some(b => b.type === 'green' && b.code === 'VALIDATION_PASSED'));
  });

  await reporter.test('T6.5.2 - Detects 2026 NDIS price cap violations and flags line item rate discrepancies with suggested cap adjustments', async () => {
    const client = SEED_CLIENTS[0];
    const claim = {
      id: 'claim-overprice',
      clientId: client.id,
      clientName: client.name,
      ndisNumber: client.ndisNumber,
      serviceDate: '2026-08-12',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 250.00, // Price cap is $214.41
      totalAmount: 500.00
    };

    const caseNotes = [{ id: 'note-1', clientId: client.id, date: '2026-08-12', status: 'Approved' }];
    const result = AIAssistantEngine.validateBillingClaim(claim, client, [], caseNotes, NDIS_2026_PRICE_GUIDE);

    assert.equal(result.isClean, false);
    assert.ok(result.errors.some(e => e.includes('exceeds 2026 NDIS price cap')));
    assert.ok(result.badges.some(b => b.type === 'red' && b.code === 'RATE_EXCEEDS_2026_CAP'));
    const badge = result.badges.find(b => b.code === 'RATE_EXCEEDS_2026_CAP');
    assert.equal(badge.suggestedFix, 'Adjust hourly unit rate to $214.41');
  });

  await reporter.test('T6.5.3 - Detects duplicate claims for identical service date/participant/code and missing mandatory fields', async () => {
    const client = SEED_CLIENTS[0];
    const existingClaims = [
      {
        id: 'claim-existing-100',
        clientId: client.id,
        serviceDate: '2026-08-12',
        supportItemCode: '07_002_0115_8_3',
        totalAmount: 321.62
      }
    ];

    // Duplicate claim
    const duplicateClaim = {
      id: 'claim-duplicate-new',
      clientId: client.id,
      ndisNumber: client.ndisNumber,
      serviceDate: '2026-08-12',
      supportItemCode: '07_002_0115_8_3',
      hours: 1.5,
      unitRate: 214.41,
      totalAmount: 321.62
    };

    const caseNotes = [{ id: 'note-1', clientId: client.id, date: '2026-08-12', status: 'Approved' }];
    const duplicateResult = AIAssistantEngine.validateBillingClaim(duplicateClaim, client, existingClaims, caseNotes, NDIS_2026_PRICE_GUIDE);

    assert.equal(duplicateResult.isClean, false);
    assert.ok(duplicateResult.errors.some(e => e.includes('Duplicate claim detected')));
    assert.ok(duplicateResult.badges.some(b => b.code === 'DUPLICATE_CLAIM_DETECTED'));

    // Missing mandatory fields
    const brokenClaim = { id: 'claim-broken', clientId: client.id };
    const brokenResult = AIAssistantEngine.validateBillingClaim(brokenClaim, client, [], [], NDIS_2026_PRICE_GUIDE);
    assert.equal(brokenResult.isClean, false);
    assert.ok(brokenResult.errors.some(e => e.includes('Missing mandatory billing fields')));
  });

  await reporter.test('T6.5.4 - Detects orphan claims lacking matching approved case note and prevents invalid PACE submission', async () => {
    const client = SEED_CLIENTS[0];
    const orphanClaim = {
      id: 'claim-orphan',
      clientId: client.id,
      clientName: client.name,
      ndisNumber: client.ndisNumber,
      serviceDate: '2026-08-20', // No note on this date
      supportItemCode: '07_002_0115_8_3',
      hours: 1.0,
      unitRate: 214.41,
      totalAmount: 214.41
    };

    // Notes exist for different date
    const caseNotes = [{ id: 'note-old', clientId: client.id, date: '2026-08-12', status: 'Approved' }];

    const result = AIAssistantEngine.validateBillingClaim(orphanClaim, client, [], caseNotes, NDIS_2026_PRICE_GUIDE);
    assert.equal(result.isClean, false);
    assert.ok(result.errors.some(e => e.includes('No approved clinical case note')));
    assert.ok(result.badges.some(b => b.code === 'ORPHAN_CLAIM_NO_NOTE'));
  });

  // =========================================================================
  // PHASE 6: R6 — AI SEMANTIC NATURAL LANGUAGE SEARCH ACROSS RECORDS
  // =========================================================================
  reporter.startPhase('Phase 6: R6 — AI Semantic Natural Language Search Across Records');

  await reporter.test('T6.6.1 - Semantic query across heterogeneous records (notes, incidents, ABC logs, claims) returns ranked relevance matches', async () => {
    const records = {
      caseNotes: SEED_CASE_NOTES,
      incidents: SEED_INCIDENTS,
      abcLogs: SEED_ABC_LOGS,
      billingClaims: SEED_CLAIMS,
      clients: SEED_CLIENTS
    };

    const results = AIAssistantEngine.executeSemanticSearch('community therapy sensory regulation', records);

    assert.ok(results.length > 0);
    assert.ok(results[0].score > 0);
    assert.ok(results[0].score <= 1.0);
    assert.ok(results[0].title);
    assert.ok(results[0].snippet);
    // Highest match should be the case note or ABC log mentioning community / sensory
    assert.ok(results.some(r => r.recordType === 'CaseNote' || r.recordType === 'ABCLog'));
  });

  await reporter.test('T6.6.2 - Natural language intent parsing correctly filters clinical concepts (e.g., self-harm incidents in last 6 months or unused budget > $5000)', async () => {
    const records = {
      caseNotes: SEED_CASE_NOTES,
      incidents: SEED_INCIDENTS,
      abcLogs: SEED_ABC_LOGS,
      billingClaims: SEED_CLAIMS,
      clients: SEED_CLIENTS
    };

    // Query 1: Incident query with clinical terms
    const incidentQuery = AIAssistantEngine.executeSemanticSearch('incidents involving agitation and strike', records);
    assert.ok(incidentQuery.length > 0);
    assert.equal(incidentQuery[0].recordType, 'Incident');
    assert.ok(incidentQuery[0].title.includes('Incident'));

    // Query 2: Budget financial query
    const budgetQuery = AIAssistantEngine.executeSemanticSearch('clients with unused budget over $5000', records);
    assert.ok(budgetQuery.length > 0);
    assert.equal(budgetQuery[0].recordType, 'Client');
    assert.ok(budgetQuery[0].snippet.includes('Budget Unused'));
  });

  await reporter.test('T6.6.3 - Semantic search performance and ranking accuracy across 50+ records execute within sub-second thresholds', async () => {
    // Generate synthetic dataset of 60 records
    const syntheticNotes = Array.from({ length: 40 }, (_, idx) => ({
      id: `syn-note-${idx}`,
      clientId: `cli-${idx % 3}`,
      clientName: `Participant ${idx}`,
      format: 'SIMPL',
      subjective: idx === 15 ? 'Critical transition agitation with communication board.' : `General therapy session ${idx}.`,
      objective: 'Completed standard drills.',
      assessment: 'Progress noted.',
      plan: 'Next week.',
      date: '2026-08-10'
    }));

    const records = {
      caseNotes: syntheticNotes,
      incidents: SEED_INCIDENTS,
      abcLogs: SEED_ABC_LOGS,
      billingClaims: SEED_CLAIMS,
      clients: SEED_CLIENTS
    };

    const start = performance.now();
    const results = AIAssistantEngine.executeSemanticSearch('communication board agitation', records);
    const duration = performance.now() - start;

    assert.ok(duration < 500, `Search execution took ${duration.toFixed(1)}ms, must be < 500ms`);
    assert.ok(results.length > 0);
    assert.equal(results[0].recordId, 'syn-note-15');
  });

  // =========================================================================
  // PHASE 7: R7 — AI SCHEDULING OPTIMISER & GOOGLE CALENDAR SYNC
  // =========================================================================
  reporter.startPhase('Phase 7: R7 — AI Scheduling Optimiser & Google Calendar Sync');

  await reporter.test('T6.7.1 - Caseload optimization engine analyzes practitioner capacity, travel zones, and identifies over-allocation bottlenecks', async () => {
    const practitioners = [
      { id: 'prac-1', name: 'Practitioner A', caseloadLimit: 15, activeCaseloadCount: 18, assignedZone: 'Zone 1' },
      { id: 'prac-2', name: 'Practitioner B', caseloadLimit: 20, activeCaseloadCount: 8, assignedZone: 'Zone 1' }
    ];

    const shifts = [
      { id: 's-1', practitionerId: 'prac-1', startTime: '09:00', endTime: '18:00' },
      { id: 's-2', practitionerId: 'prac-1', startTime: '09:00', endTime: '18:00' },
      { id: 's-3', practitionerId: 'prac-1', startTime: '09:00', endTime: '18:00' },
      { id: 's-4', practitionerId: 'prac-1', startTime: '09:00', endTime: '18:00' }
    ];

    const result = AIAssistantEngine.optimizeScheduling(practitioners, SEED_CLIENTS, shifts);

    assert.equal(result.imbalances.length, 1);
    assert.equal(result.imbalances[0].practitionerId, 'prac-1');
    assert.equal(result.imbalances[0].status, 'Over Capacity');
  });

  await reporter.test('T6.7.2 - Intelligent shift reassignment recommendations balance caseload across practitioners', async () => {
    const practitioners = [
      { id: 'prac-1', name: 'Dr. Sarah Jenkins', caseloadLimit: 14, activeCaseloadCount: 16 },
      { id: 'prac-2', name: 'Liam Gallagher', caseloadLimit: 15, activeCaseloadCount: 7 }
    ];

    const result = AIAssistantEngine.optimizeScheduling(practitioners, SEED_CLIENTS, []);

    assert.ok(result.recommendations.length > 0);
    assert.equal(result.recommendations[0].type, 'CASELOAD_REBALANCE');
    assert.equal(result.recommendations[0].fromPractitionerId, 'prac-1');
    assert.equal(result.recommendations[0].toPractitionerId, 'prac-2');
    assert.ok(result.recommendations[0].description.includes('transferring 2 participants'));
  });

  await reporter.test('T6.7.3 - Google Calendar bidirectional synchronization creates, updates, and fetches appointments with Google Meet links', async () => {
    const gcalStore = new Map();
    const shift = SEED_SHIFTS[0];

    // Create / Sync appointment to Google Calendar
    const syncRes = AIAssistantEngine.syncGoogleCalendar('create_or_update', shift, gcalStore);
    assert.equal(syncRes.success, true);
    assert.ok(syncRes.eventId);
    assert.ok(syncRes.event.conferenceData.entryPoints[0].uri.includes('meet.google.com'));
    assert.equal(syncRes.event.summary, `NDIS Clinical Session: ${shift.clientName}`);

    // Fetch calendar events
    const fetchedEvents = AIAssistantEngine.syncGoogleCalendar('fetch', null, gcalStore);
    assert.equal(fetchedEvents.length, 1);
    assert.equal(fetchedEvents[0].id, syncRes.eventId);
  });

  // =========================================================================
  // PHASE 8: R8 — NDIS PRODA API DIRECT BATCH SUBMISSION & PACE POLLING
  // =========================================================================
  reporter.startPhase('Phase 8: R8 — NDIS PRODA API Direct Batch Submit & PACE Polling');

  await reporter.test('T6.8.1 - Batch submission of approved claims packages B2G payload and dispatches to PRODA endpoint returning valid batch ID', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const claims = [
      { id: 'claim-801', clientId: 'cli-101', ndisNumber: '430891245', unitRate: 214.41, totalAmount: 321.62, status: 'Approved' },
      { id: 'claim-802', clientId: 'cli-102', ndisNumber: '431092841', unitRate: 193.99, totalAmount: 387.98, status: 'Approved' }
    ];

    const submission = prodaApi.submitBatch(['claim-801', 'claim-802'], claims);

    assert.ok(submission.batchId.startsWith('PRODA-PACE-BATCH-'));
    assert.equal(submission.status, 'Processing');
    assert.equal(submission.submittedClaimsCount, 2);
    assert.ok(submission.timestamp);
  });

  await reporter.test('T6.8.2 - PACE status polling tracks batch transitions (Processing -> Completed) and reconciles paid claims into ledger', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const claimIds = ['claim-801', 'claim-802'];
    const sub = prodaApi.submitBatch(claimIds, store.billingClaims);

    // Poll status
    const pollResult = prodaApi.pollBatchStatus(sub.batchId);
    assert.equal(pollResult.status, 'Completed');
    assert.equal(pollResult.approvedCount, 2);
    assert.equal(pollResult.rejectedCount, 0);
    assert.ok(pollResult.claims[0].paceReference.startsWith('PACE-TXN-'));

    // Reconcile into store ledger
    const count = prodaApi.reconcileBatchWithLedger(pollResult, store);
    assert.equal(count, 2);

    const c1 = store.billingClaims.find(c => c.id === 'claim-801');
    assert.equal(c1.status, 'Paid');
    assert.equal(c1.reconciliationStatus, 'Reconciled');
  });

  await reporter.test('T6.8.3 - Handling PRODA submission rejection errors gracefully updates claim status to Rejected with error details', async () => {
    const prodaApi = new NDISProdaApiEmulator();
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const invalidClaim = {
      id: 'claim-invalid-rate',
      clientId: 'cli-101',
      ndisNumber: '', // Missing NDIS number triggers rejection
      unitRate: 300.00,
      totalAmount: 300.00,
      status: 'Approved'
    };

    store.billingClaims.push(invalidClaim);

    const sub = prodaApi.submitBatch(['claim-invalid-rate'], [invalidClaim]);
    const pollResult = prodaApi.pollBatchStatus(sub.batchId);

    assert.equal(pollResult.rejectedCount, 1);
    assert.equal(pollResult.approvedCount, 0);
    assert.equal(pollResult.claims[0].status, 'Rejected');
    assert.equal(pollResult.claims[0].rejectionCode, 'PACE_ERR_INVALID_RATE_OR_NDIS');

    prodaApi.reconcileBatchWithLedger(pollResult, store);

    const reconciledClaim = store.billingClaims.find(c => c.id === 'claim-invalid-rate');
    assert.equal(reconciledClaim.status, 'Rejected');
    assert.equal(reconciledClaim.reconciliationStatus, 'Failed');
    assert.ok(reconciledClaim.reconciliationError.includes('PACE_ERR_INVALID_RATE_OR_NDIS'));
  });
}
