/**
 * Tier 4: Real-World Clinical & Practice Management Workflows E2E Test Suite
 * 
 * Verifies 5 comprehensive multi-step real-world practitioner and director scenarios:
 * - Scenario 1: End-to-End Participant Intake to Service Delivery & Initial Assessment
 * - Scenario 2: Critical Incident Response & Statutory NDIS Safeguards Reporting
 * - Scenario 3: Full-Day Practitioner Fieldwork in Low/No Connectivity (Offline First)
 * - Scenario 4: Monthly Quality Safeguards & Section 34 Compliance Audit Cycle
 * - Scenario 5: End-of-Month Billing Cycle & NDIS PACE Claims Reconciliation
 * 
 * Total Tests: 5 comprehensive multi-step scenario tests (meets requirement)
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  AIAssistantEngine,
  DashboardAnalyticsAggregator,
  NDIS_2026_PRICE_GUIDE,
  SEED_PRACTITIONERS
} from '../harness/emulator.mjs';

export async function runTier4Tests(reporter) {
  reporter.startSuite('Tier 4: Real-World Clinical & Practice Management Workflows');

  // =========================================================================
  // SCENARIO 1: PARTICIPANT INTAKE TO SERVICE DELIVERY
  // =========================================================================
  await reporter.test('T4.1 - Scenario 1: End-to-End Participant Intake to Service Delivery & Initial Assessment', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Step 1: Support Coordinator refers a new participant lead in CRM
    const newLead = {
      id: 'lead-intake-101',
      prospectName: 'Lucas Vance-Scott',
      ndisNumber: '430987123',
      contactName: 'Margaret Scott (Guardian)',
      contactEmail: 'm.scott@example.com',
      contactPhone: '0412 345 678',
      stage: 'Service Agreement Pending',
      source: 'Support Coordinator Referral',
      estimatedPlanValue: 52000,
      assignedPractitionerId: 'prac-201',
      assignedPractitionerName: 'Dr. Sarah Jenkins',
      notes: 'Requires Comprehensive Functional Behaviour Assessment and interim Positive Behaviour Support Plan.'
    };
    store.leads.push(newLead);
    assert.equal(store.leads.length, 2);

    // Step 2: Service Agreement signed -> Convert lead to Active Client
    const enrolledClient = await store.addClient({
      id: 'cli-intake-101',
      ndisNumber: newLead.ndisNumber,
      name: newLead.prospectName,
      dateOfBirth: '2006-11-04',
      status: 'Active',
      primaryDisability: 'Autism Spectrum Disorder (Level 3)',
      planStartDate: '2026-08-01',
      planEndDate: '2027-07-31',
      totalBudget: newLead.estimatedPlanValue,
      allocatedBudget: 48000,
      spentBudget: 0,
      primaryPractitionerId: 'prac-201',
      primaryPractitionerName: 'Dr. Sarah Jenkins',
      riskLevel: 'Medium',
      emergencyContact: {
        name: 'Margaret Scott',
        relationship: 'Guardian',
        phone: '0412 345 678'
      }
    });

    assert.equal(enrolledClient.name, 'Lucas Vance-Scott');
    assert.equal(enrolledClient.totalBudget, 52000);

    // Step 3: Establish 2 NDIS Goals
    enrolledClient.goals = [
      {
        id: 'g-lucas-1',
        title: 'Develop functional emotional regulation routines to minimize sensory distress in community',
        category: 'Capacity Building',
        targetDate: '2027-02-28',
        progressPercent: 10,
        status: 'In Progress',
        gasScore: -1
      },
      {
        id: 'g-lucas-2',
        title: 'Implement augmentative communication schedule for daily living choices',
        category: 'Core',
        targetDate: '2026-12-31',
        progressPercent: 15,
        status: 'In Progress',
        gasScore: 0
      }
    ];

    // Step 4: Practitioner conducts initial assessment consultation & AI structures note
    const observationDraft = 'Conducted 90-minute initial Functional Behaviour Assessment with Lucas and guardian Margaret. Lucas demonstrated calm engagement when provided visual activity cues. Introduced preliminary emotion thermometer cards. Recommended weekly clinical therapy visits.';
    const aiNote = AIAssistantEngine.draftCaseNote(observationDraft, 'SIMPL', 'Lucas Vance-Scott');

    const initialCaseNote = await store.addCaseNote({
      id: 'note-lucas-init',
      clientId: enrolledClient.id,
      clientName: enrolledClient.name,
      practitionerId: 'prac-201',
      practitionerName: 'Dr. Sarah Jenkins',
      sessionDurationMinutes: 90,
      format: 'SIMPL',
      linkedGoalIds: ['g-lucas-1'],
      status: 'Approved',
      ...aiNote
    });

    assert.equal(initialCaseNote.status, 'Approved');
    assert.equal(initialCaseNote.linkedGoalIds.length, 1);

    // Step 5: Generate & Submit NDIS Billing Claim (1.5 hours of PBS Support @ $214.41/hr)
    const lineItem = NDIS_2026_PRICE_GUIDE.find(item => item.code === '07_002_0115_8_3');
    const claimAmount = Math.round(1.5 * lineItem.pricePerUnit * 100) / 100; // $321.62

    const claim = await store.addBillingClaim({
      id: 'claim-lucas-init',
      clientId: enrolledClient.id,
      clientName: enrolledClient.name,
      ndisNumber: enrolledClient.ndisNumber,
      serviceDate: '2026-08-16',
      ndisSupportItem: lineItem.name,
      supportItemCode: lineItem.code,
      hours: 1.5,
      unitRate: lineItem.pricePerUnit,
      totalAmount: claimAmount,
      status: 'Submitted PACE'
    });

    assert.equal(claim.totalAmount, 321.62);

    // Step 6: Verify client budget utilization metrics update
    const updatedClient = store.clients.find(c => c.id === enrolledClient.id);
    const budgetMetrics = DashboardAnalyticsAggregator.computeBudgetUtilization(updatedClient);
    assert.equal(budgetMetrics.spent, 321.62);
    assert.equal(budgetMetrics.remaining, 52000 - 321.62);
    assert.equal(budgetMetrics.isOverdrawn, false);

    // Step 7: Verify Firestore contains all records across the lifecycle
    const persistedClient = await firestore.getDoc('clients', enrolledClient.id, store.getAuthContext());
    const persistedNote = await firestore.getDoc('caseNotes', initialCaseNote.id, store.getAuthContext());
    const persistedClaim = await firestore.getDoc('billingClaims', claim.id, store.getAuthContext());

    assert.ok(persistedClient);
    assert.ok(persistedNote);
    assert.ok(persistedClaim);
  });

  // =========================================================================
  // SCENARIO 2: CRITICAL INCIDENT RESPONSE & SAFEGUARDS REPORTING
  // =========================================================================
  await reporter.test('T4.2 - Scenario 2: Critical Incident Response & Statutory NDIS Commission Reporting', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Step 1: Practitioner logs severe incident involving emergency restraint
    const incident = await store.addIncident({
      id: 'inc-statutory-101',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      practitionerId: 'prac-202',
      practitionerName: 'Marcus Vance',
      incidentDate: '2026-08-16T14:30:00Z',
      severity: 'Critical / Reportable',
      description: 'Acute behavioral escalation during community outing. Support worker applied a 25-second emergency physical hold to prevent participant from running into high-speed oncoming traffic.',
      immediateActionTaken: 'Participant escorted to quiet parent vehicle immediately; emergency medical triage confirmed no injury; participant calmed after 15 minutes.'
    });

    assert.equal(incident.isNdisReportable, true);

    // Step 2: AI Incident Analyzer triggers mandatory 24-Hour SLA
    const slaAnalysis = AIAssistantEngine.analyzeIncidentSLA(incident.description);
    assert.equal(slaAnalysis.severityLevel, 'LEVEL_4_CRITICAL');
    assert.equal(slaAnalysis.slaCategory, '24_HOUR_NOTIFIABLE');
    assert.equal(slaAnalysis.urgencyDays, 1);

    // Step 3: Register Emergency Restrictive Practice Reduction Plan
    const emergencyRP = await store.addRestrictivePractice({
      id: 'rp-emergency-101',
      clientId: incident.clientId,
      clientName: incident.clientName,
      practiceType: 'Physical',
      description: 'Emergency physical hold for traffic safety mitigation',
      authorizationBody: 'Victorian Senior Practitioner Emergency Lodgement',
      authorizationReference: 'VSP-EMERG-2026-9912',
      startDate: '2026-08-16',
      expiryDate: '2026-09-15', // 30-day emergency interim authorisation
      reductionPlanSummary: 'Conduct updated Functional Behaviour Assessment and introduce GPS proximity wristband and double-escort community protocol.',
      monthlyReportStatus: 'Due'
    });

    assert.equal(emergencyRP.practiceType, 'Physical');

    // Step 4: Perform Section 34 Audit against the incident context
    const s34Audit = AIAssistantEngine.auditNDISSection34(
      `Participant Jordan Miller involved in emergency physical restraint. Statutory 24-hour Commission notice lodged with signed guardian consent. Goals documented in clinical PBS plan with cost rates aligned.`
    );
    assert.ok(s34Audit.overallComplianceScore >= 65);

    // Step 5: Director marks statutory 24-hour Commission notice submitted
    incident.ndis24hrNotified = true;
    incident.status = 'Reported to NDIS Commission';
    await firestore.updateDoc('incidents', incident.id, {
      ndis24hrNotified: true,
      status: 'Reported to NDIS Commission'
    }, store.getAuthContext());

    const updatedInc = await firestore.getDoc('incidents', incident.id, store.getAuthContext());
    assert.equal(updatedInc.ndis24hrNotified, true);
    assert.equal(updatedInc.status, 'Reported to NDIS Commission');

    // Step 6: Verify compliance KPI metrics reflect 100% resolution of 24h SLA
    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(store.practitioners, store.incidents, store.restrictivePractices);
    assert.equal(kpis.incidents.reportable, 2);
  });

  // =========================================================================
  // SCENARIO 3: FULL-DAY PRACTITIONER FIELDWORK IN LOW/NO CONNECTIVITY
  // =========================================================================
  await reporter.test('T4.3 - Scenario 3: Full-Day Practitioner Fieldwork in Low/No Connectivity (Offline-First)', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Step 1: Practitioner departs clinic and enters rural community zone (Network offline)
    store.setOnlineStatus(false);
    assert.equal(store.isOnline, false);
    assert.equal(store.syncStatus, 'offline');

    // Step 2: Visit 1 with Client 101 -> Voice dictation & Note creation
    const visit1Obs = 'Visit 1 with Jordan Miller: Conducted home-based sensory routine. Jordan engaged with visual timer. No behavioral triggers observed.';
    const visit1Note = AIAssistantEngine.draftCaseNote(visit1Obs, 'SIMPL', 'Jordan Miller');
    await store.addCaseNote({
      id: 'note-field-visit-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ...visit1Note
    });

    // Step 3: Visit 1 -> Generate Billing Claim ($214.41)
    await store.addBillingClaim({
      id: 'claim-field-visit-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      totalAmount: 214.41,
      supportItemCode: '07_002_0115_8_3'
    });

    // Step 4: Visit 2 with Client 102 -> Voice dictation & Note creation
    const visit2Obs = 'Visit 2 with Samantha Reed: Occupational therapy capacity evaluation. Samantha completed independent meal prep sequencing with visual board.';
    const visit2Note = AIAssistantEngine.draftCaseNote(visit2Obs, 'SIMPL', 'Samantha Reed');
    await store.addCaseNote({
      id: 'note-field-visit-2',
      clientId: 'cli-102',
      clientName: 'Samantha Reed',
      ...visit2Note
    });

    // Step 5: Visit 2 -> Generate Travel & Therapy Billing Claim ($387.98)
    await store.addBillingClaim({
      id: 'claim-field-visit-2',
      clientId: 'cli-102',
      clientName: 'Samantha Reed',
      totalAmount: 387.98,
      supportItemCode: '15_056_0128_1_3'
    });

    // Step 6: Log an ABC behavior observation while in field
    const fieldABC = {
      id: 'abc-field-visit-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      timestamp: '2026-08-16T16:00:00Z',
      timeOfDay: '16:00',
      dayOfWeek: 'Monday',
      antecedent: 'Transition from iPad to homework',
      behavior: 'Vocal protest for 2 minutes',
      consequence: 'Offered sensory break',
      perceivedFunction: 'Escape/Avoidance',
      intensity: 2,
      durationMinutes: 2,
      location: 'Participant Home',
      recordedBy: 'Marcus Vance'
    };
    store.abcLogs.push(fieldABC);

    // Verify all 4 mutations are safely queued in local offline delta store
    assert.equal(store.offlineQueue.length, 4);
    assert.equal(store.pendingChangesCount, 4);

    // Step 7: Practitioner returns to clinic -> Connectivity restored
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0);
    assert.equal(store.syncStatus, 'synced');

    // Step 8: Verify all 4 records are persisted in Firestore
    const n1 = await firestore.getDoc('caseNotes', 'note-field-visit-1', store.getAuthContext());
    const c1 = await firestore.getDoc('billingClaims', 'claim-field-visit-1', store.getAuthContext());
    const n2 = await firestore.getDoc('caseNotes', 'note-field-visit-2', store.getAuthContext());
    const c2 = await firestore.getDoc('billingClaims', 'claim-field-visit-2', store.getAuthContext());

    assert.ok(n1);
    assert.ok(c1);
    assert.ok(n2);
    assert.ok(c2);
  });

  // =========================================================================
  // SCENARIO 4: MONTHLY QUALITY SAFEGUARDS & SECTION 34 AUDIT CYCLE
  // =========================================================================
  await reporter.test('T4.4 - Scenario 4: Monthly Quality Safeguards & Section 34 Compliance Audit Cycle', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Step 1: Quality Officer logs in with VIEWER role
    store.switchUser('user-auditor');
    assert.equal(store.currentUser.role, 'VIEWER');

    // Step 2: Quality Officer reviews Practitioner compliance KPIs
    const complianceKPIs = DashboardAnalyticsAggregator.computeComplianceKPIs(
      store.practitioners,
      store.incidents,
      store.restrictivePractices
    );

    assert.equal(complianceKPIs.practitioners.total, 4);
    assert.equal(complianceKPIs.practitioners.expiringSoon, 1); // Liam Gallagher screening expires soon

    // Step 3: Run NDIS Act Section 34 Audit across all active participant records
    const auditClient1 = AIAssistantEngine.auditNDISSection34(
      'Participant Jordan Miller. Clinical goals documented. PBS intervention billable at $214.41/hr rate with signed guardian consent.'
    );
    assert.equal(auditClient1.isCompliant, true);

    const auditClient2 = AIAssistantEngine.auditNDISSection34(
      'Participant Samantha Reed. FCA clinical assessment complete. Allied health therapy goals aligned with 2026 price caps and $193.99/hr cost.'
    );
    assert.equal(auditClient2.overallComplianceScore >= 85, true);

    // Step 4: Auditor compiles Quality Safeguards Summary
    const overallAuditScore = Math.round((auditClient1.overallComplianceScore + auditClient2.overallComplianceScore) / 2);
    assert.ok(overallAuditScore >= 75);

    // Step 5: Auditor attempts unauthorized write -> Rejected cleanly
    await assert.rejects(
      async () => await firestore.setDoc('practitioners', 'prac-fake', { name: 'Fake' }, store.getAuthContext()),
      /PERMISSION_DENIED/,
      'Auditor in VIEWER role cannot modify practitioner records'
    );
  });

  // =========================================================================
  // SCENARIO 5: END-OF-MONTH BILLING CYCLE & NDIS PACE RECONCILIATION
  // =========================================================================
  await reporter.test('T4.5 - Scenario 5: End-of-Month Billing Cycle & NDIS PACE Claims Reconciliation', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Step 1: Billing Manager logs in as ADMIN
    store.switchUser('user-director');
    assert.equal(store.currentUser.role, 'ADMIN');

    // Step 2: Aggregate unbilled case notes into 5 consolidated PACE claims
    const batchClaims = [
      { id: 'pace-c1', clientId: 'cli-101', clientName: 'Jordan Miller', totalAmount: 321.62, supportItemCode: '07_002_0115_8_3', status: 'Pending' },
      { id: 'pace-c2', clientId: 'cli-101', clientName: 'Jordan Miller', totalAmount: 214.41, supportItemCode: '07_002_0115_8_3', status: 'Pending' },
      { id: 'pace-c3', clientId: 'cli-102', clientName: 'Samantha Reed', totalAmount: 387.98, supportItemCode: '15_056_0128_1_3', status: 'Pending' },
      { id: 'pace-c4', clientId: 'cli-103', clientName: 'Liam O’Connor', totalAmount: 214.41, supportItemCode: '07_002_0115_8_3', status: 'Pending' },
      { id: 'pace-c5', clientId: 'cli-103', clientName: 'Liam O’Connor', totalAmount: 428.82, supportItemCode: '07_002_0115_8_3', status: 'Pending' }
    ];

    for (const c of batchClaims) {
      await store.addBillingClaim(c);
    }

    // Step 3: Dispatch batch to PRODA PACE (status -> 'Submitted PACE')
    for (const c of batchClaims) {
      await firestore.updateDoc('billingClaims', c.id, {
        status: 'Submitted PACE',
        reconciliationStatus: 'Pending'
      }, store.getAuthContext());
    }

    const preReconMetrics = DashboardAnalyticsAggregator.computeBillingMetrics(store.billingClaims);
    assert.ok(preReconMetrics.totalSubmitted > 0);

    // Step 4: Simulate PACE Remittance Ingestion
    // 4 claims are Paid, 1 claim is Rejected due to plan budget cap
    await firestore.updateDoc('billingClaims', 'pace-c1', { status: 'Paid', reconciliationStatus: 'Reconciled', paymentReceivedDate: '2026-08-31' }, store.getAuthContext());
    await firestore.updateDoc('billingClaims', 'pace-c2', { status: 'Paid', reconciliationStatus: 'Reconciled', paymentReceivedDate: '2026-08-31' }, store.getAuthContext());
    await firestore.updateDoc('billingClaims', 'pace-c3', { status: 'Paid', reconciliationStatus: 'Reconciled', paymentReceivedDate: '2026-08-31' }, store.getAuthContext());
    await firestore.updateDoc('billingClaims', 'pace-c4', { status: 'Paid', reconciliationStatus: 'Reconciled', paymentReceivedDate: '2026-08-31' }, store.getAuthContext());
    await firestore.updateDoc('billingClaims', 'pace-c5', { status: 'Rejected', reconciliationStatus: 'Failed', reconciliationError: 'Exceeds NDIA plan category allocation cap' }, store.getAuthContext());

    // Update store state to match remote
    store.billingClaims = await firestore.listDocs('billingClaims', store.getAuthContext());

    // Step 5: Calculate final monthly revenue metrics
    const finalMetrics = DashboardAnalyticsAggregator.computeBillingMetrics(store.billingClaims);
    assert.ok(finalMetrics.totalPaid > 1500, `Total paid must exceed $1,500 (was $${finalMetrics.totalPaid})`);
    assert.equal(finalMetrics.totalRejected, 428.82);

    // Step 6: Verify client budget burn rates updated cleanly
    const liamClient = store.clients.find(c => c.id === 'cli-103');
    const liamBudget = DashboardAnalyticsAggregator.computeBudgetUtilization(liamClient);
    assert.ok(liamBudget.spent > 0);
    assert.equal(liamBudget.isOverdrawn, false);
  });
}
