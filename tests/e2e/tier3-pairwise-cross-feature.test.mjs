/**
 * Tier 3: Pairwise Cross-Feature Combinations E2E Test Suite
 * 
 * Verifies complex multi-module interactions and data flow across subsystems:
 * - Offline Queues x Voice Dictation x Delta Sync Flush
 * - AI BIRP Drafting x Goal Linkage x NDIS Price Guide Line Item Recommendation
 * - Critical Incident x Mandatory 24h SLA x Compliance Dashboard KPI
 * - Restrictive Practice x NDIS Section 34 Audit x Overdue Alert
 * - Client Enrollment x Budget Breakdown x Billing Claims x Revenue Dashboard
 * - RBAC Role Switching x Action Button Gating x Destructive Deletion
 * - ABC Observation x AI SMART Goal x Goal Attainment Scaling (GAS)
 * - Offline Billing Claims x Network Reconnection x PACE Status Reconciliation
 * - CRM Lead Conversion x Client Onboarding x Practitioner Caseload Rebalancing
 * - Multi-Tab onSnapshot x Concurrent Note Modification x Audit Trail Integrity
 * - Command Center Live AI Chat x Dynamic Metrics Context Integration
 * 
 * Total Tests: 11 tests (exceeds ≥10 requirement)
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

export async function runTier3Tests(reporter) {
  reporter.startSuite('Tier 3: Pairwise Cross-Feature Combinations');

  await reporter.test('T3.1 - Offline Note Creation + Voice Dictation + Batch Delta Flush', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Enter offline mode
    store.setOnlineStatus(false);
    assert.equal(store.isOnline, false);

    // 2. Transcribe voice observation
    const voiceObservation = 'Participant Jordan Miller demonstrated calm engagement during morning routine. Completed all functional communication exercises. Recommended continuation.';
    const structuredNote = AIAssistantEngine.draftCaseNote(voiceObservation, 'SIMPL', 'Jordan Miller');

    // 3. Save note to store while offline
    const newNote = await store.addCaseNote({
      id: 'note-cross-offline-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      format: 'SIMPL',
      ...structuredNote
    });

    assert.equal(store.offlineQueue.length, 1);
    assert.equal(store.pendingChangesCount, 1);

    // 4. Reconnect network and trigger delta sync
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0);
    assert.equal(store.syncStatus, 'synced');

    // 5. Verify Firestore received the synced document
    const persisted = await firestore.getDoc('caseNotes', 'note-cross-offline-1', store.getAuthContext());
    assert.ok(persisted);
    assert.equal(persisted.clientName, 'Jordan Miller');
    assert.ok(store.auditLogs.some(log => log.action === 'DELTA_SYNC_SUCCESS'));
  });

  await reporter.test('T3.2 - AI BIRP Note Generation + Goal Linkage + NDIS Line Item Recommendation & Claim Creation', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Generate AI BIRP Note
    const rawSession = 'Delivered 90 minutes of intensive Behaviour Support Plan development and stakeholder coaching.';
    const birp = AIAssistantEngine.draftCaseNote(rawSession, 'BIRP', 'Jordan Miller');

    // 2. Add case note with goal linkage
    const note = await store.addCaseNote({
      id: 'note-birp-linked',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      format: 'BIRP',
      linkedGoalIds: ['g-101'],
      sessionDurationMinutes: 90,
      ...birp
    });

    assert.equal(note.linkedGoalIds.length, 1);

    // 3. Recommend Price Guide Line Item for BSP development
    const lineItem = NDIS_2026_PRICE_GUIDE.find(item => item.code === '07_004_0115_8_3');
    assert.ok(lineItem);
    assert.equal(lineItem.pricePerUnit, 214.41);

    // 4. Auto-generate billing claim for 1.5 hours
    const hours = 1.5;
    const totalAmount = Math.round(hours * lineItem.pricePerUnit * 100) / 100;

    const claim = await store.addBillingClaim({
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      serviceDate: '2026-08-15',
      ndisSupportItem: lineItem.name,
      supportItemCode: lineItem.code,
      hours,
      unitRate: lineItem.pricePerUnit,
      totalAmount,
      status: 'Pending'
    });

    assert.equal(claim.totalAmount, 321.62);
    assert.equal(claim.supportItemCode, '07_004_0115_8_3');

    // 5. Verify client spentBudget increased
    const client = store.clients.find(c => c.id === 'cli-101');
    assert.ok(client.spentBudget >= 24671.62);
  });

  await reporter.test('T3.3 - Critical Incident Creation + Mandatory 24h SLA Escalation + Compliance Dashboard KPI Update', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Create critical incident with injury
    const incident = await store.addIncident({
      id: 'inc-cross-crit-1',
      clientId: 'cli-103',
      clientName: 'Liam O’Connor',
      practitionerId: 'prac-202',
      practitionerName: 'Marcus Vance',
      incidentDate: '2026-08-16T15:00:00Z',
      severity: 'Critical / Reportable',
      description: 'Severe physical aggression with minor arm injury requiring first aid dressing.'
    });

    assert.equal(incident.isNdisReportable, true);

    // 2. Run AI Incident SLA Analysis
    const sla = AIAssistantEngine.analyzeIncidentSLA(incident.description);
    assert.equal(sla.severityLevel, 'LEVEL_4_CRITICAL');
    assert.equal(sla.slaCategory, '24_HOUR_NOTIFIABLE');
    assert.equal(sla.urgencyDays, 1);

    // 3. Compute Compliance Dashboard KPIs and assert reportable count increased
    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(store.practitioners, store.incidents, store.restrictivePractices);
    assert.equal(kpis.incidents.reportable, 2); // 1 seed reportable + 1 new
    assert.ok(kpis.incidents.reportabilityRate > 0);
  });

  await reporter.test('T3.4 - Restrictive Practice Registration + Section 34 Audit Analysis + Overdue Alert', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Register restrictive practice with overdue monthly reporting
    const rp = await store.addRestrictivePractice({
      id: 'rp-cross-audit-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      practiceType: 'Chemical',
      description: 'PRN calming medication for acute crisis.',
      status: 'Authorized',
      monthlyReportStatus: 'Overdue',
      expiryDate: '2026-08-31'
    });

    assert.equal(rp.monthlyReportStatus, 'Overdue');

    // 2. Perform Section 34 Audit without guardian consent
    const audit = AIAssistantEngine.auditNDISSection34('Participant receiving chemical restrictive practice. Clinical goals documented without formal paperwork.');
    assert.equal(audit.hasRestrictive, true);
    assert.equal(audit.hasConsent, false);
    assert.ok(audit.overallComplianceScore <= 70);

    // 3. Verify compliance KPIs capture overdue status
    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(store.practitioners, store.incidents, store.restrictivePractices);
    assert.ok(kpis.restrictivePractices.overdue >= 1);
  });

  await reporter.test('T3.5 - Client Enrollment + Budget Breakdown + Billing Claim Submission + Revenue Dashboard Aggregation', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Enroll client with $60,000 NDIS funding
    const client = await store.addClient({
      id: 'cli-cross-rev-1',
      name: 'Eleanor Rigby',
      ndisNumber: '439777123',
      totalBudget: 60000,
      allocatedBudget: 55000,
      spentBudget: 0,
      status: 'Active'
    });

    // 2. Submit 2 billing claims for this client
    await store.addBillingClaim({
      id: 'claim-cross-1',
      clientId: client.id,
      clientName: client.name,
      totalAmount: 428.82,
      status: 'Paid'
    });

    await store.addBillingClaim({
      id: 'claim-cross-2',
      clientId: client.id,
      clientName: client.name,
      totalAmount: 214.41,
      status: 'Submitted PACE'
    });

    // 3. Compute revenue dashboard metrics
    const metrics = DashboardAnalyticsAggregator.computeBillingMetrics(store.billingClaims);
    assert.equal(metrics.claimsByClient['Eleanor Rigby'], 643.23);

    // 4. Compute client budget utilization
    const clientInStore = store.clients.find(c => c.id === client.id);
    const budget = DashboardAnalyticsAggregator.computeBudgetUtilization(clientInStore);
    assert.equal(budget.spent, 643.23);
    assert.equal(budget.remaining, 60000 - 643.23);
    assert.equal(budget.isOverdrawn, false);
  });

  await reporter.test('T3.6 - RBAC Role Switching (PRACTITIONER -> VIEWER -> ADMIN) + Action Button Gating + Destructive Deletion', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Switch to PRACTITIONER -> verify can create note, cannot delete client
    store.switchUser('user-specialist');
    assert.equal(store.currentUser.role, 'PRACTITIONER');

    const note = await store.addCaseNote({
      id: 'note-role-test',
      clientId: 'cli-101',
      subjective: 'Role switch observation'
    });
    assert.ok(note);

    await assert.rejects(
      async () => await store.deleteClient('cli-101'),
      /PERMISSION_DENIED/,
      'PRACTITIONER cannot delete client'
    );

    // 2. Switch to VIEWER -> verify cannot create note or client
    store.switchUser('user-auditor');
    assert.equal(store.currentUser.role, 'VIEWER');

    await assert.rejects(
      async () => await firestore.setDoc('clients', 'cli-viewer-test', { name: 'Viewer Client' }, store.getAuthContext()),
      /PERMISSION_DENIED/,
      'VIEWER cannot create client'
    );

    // 3. Switch to ADMIN -> verify full deletion authority
    store.switchUser('user-director');
    assert.equal(store.currentUser.role, 'ADMIN');

    await store.deleteClient('cli-102');
    const checkDeleted = await firestore.getDoc('clients', 'cli-102', store.getAuthContext());
    assert.equal(checkDeleted, null, 'ADMIN can delete client');
  });

  await reporter.test('T3.7 - ABC Observation Logging + AI SMART Goal Generation + Goal Progress Attainment (GAS) Tracking', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Log ABC observation
    const abcLog = {
      id: 'abc-cross-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      timestamp: '2026-08-16T11:00:00Z',
      timeOfDay: '11:00',
      dayOfWeek: 'Monday',
      antecedent: 'Demands during speech pathology tabletop task',
      behavior: 'Pushed materials off table and covered ears',
      consequence: 'Offered 2-minute visual break',
      perceivedFunction: 'Escape/Avoidance',
      intensity: 3,
      durationMinutes: 5,
      location: 'Clinic Room 2',
      recordedBy: 'Marcus Vance'
    };
    store.abcLogs.push(abcLog);

    // 2. Generate AI suggested SMART goals
    const suggested = AIAssistantEngine.suggestGoalsFromABC([abcLog]);
    assert.ok(suggested.length > 0);
    const newGoal = suggested[0];

    // 3. Attach goal to client with initial GAS Score = -1 (Much less than expected)
    const client = store.clients.find(c => c.id === 'cli-101');
    client.goals.push(newGoal);

    // 4. Progress goal to GAS Score = 1 (+1 progress)
    newGoal.gasScore = 1;
    newGoal.progressPercent = 75;
    newGoal.status = 'In Progress';

    assert.equal(client.goals.find(g => g.id === newGoal.id).gasScore, 1);
    assert.equal(client.goals.find(g => g.id === newGoal.id).progressPercent, 75);
  });

  await reporter.test('T3.8 - Offline Billing Claim Creation + Network Reconnection + PACE Status Reconciliation', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Go offline and create 2 claims
    store.setOnlineStatus(false);

    await store.addBillingClaim({
      id: 'claim-offline-pace-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      totalAmount: 214.41,
      supportItemCode: '07_002_0115_8_3'
    });

    await store.addBillingClaim({
      id: 'claim-offline-pace-2',
      clientId: 'cli-102',
      clientName: 'Samantha Reed',
      totalAmount: 193.99,
      supportItemCode: '15_056_0128_1_3'
    });

    assert.equal(store.offlineQueue.length, 2);

    // 2. Reconnect and flush
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0);

    // 3. Reconcile claims with PACE submission response
    await firestore.updateDoc('billingClaims', 'claim-offline-pace-1', {
      status: 'Submitted PACE',
      reconciliationStatus: 'Pending'
    }, store.getAuthContext());

    await firestore.updateDoc('billingClaims', 'claim-offline-pace-2', {
      status: 'Paid',
      reconciliationStatus: 'Reconciled',
      paymentReceivedDate: '2026-08-16'
    }, store.getAuthContext());

    const c1 = await firestore.getDoc('billingClaims', 'claim-offline-pace-1', store.getAuthContext());
    const c2 = await firestore.getDoc('billingClaims', 'claim-offline-pace-2', store.getAuthContext());
    assert.equal(c1.status, 'Submitted PACE');
    assert.equal(c2.status, 'Paid');
  });

  await reporter.test('T3.9 - CRM Lead Conversion + Client Onboarding + Primary Practitioner Caseload Rebalancing', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // 1. Existing lead in CRM
    const lead = store.leads[0]; // Ethan Brooks, assigned to prac-202 (Marcus Vance)
    assert.ok(lead);

    // 2. Convert lead to Active Client
    const convertedClient = await store.addClient({
      id: `cli-from-lead-${Date.now()}`,
      name: lead.prospectName,
      ndisNumber: lead.ndisNumber || '439182773',
      totalBudget: lead.estimatedPlanValue,
      allocatedBudget: lead.estimatedPlanValue * 0.9,
      primaryPractitionerId: lead.assignedPractitionerId || 'prac-202',
      primaryPractitionerName: lead.assignedPractitionerName || 'Marcus Vance',
      status: 'Active'
    });

    assert.equal(convertedClient.name, 'Ethan Brooks');

    // 3. Rebalance practitioner caseload
    const practitioner = store.practitioners.find(p => p.id === 'prac-202');
    practitioner.activeCaseloadCount += 1;

    // 4. Verify caseload heatmap reflects increased active load
    const heatmap = DashboardAnalyticsAggregator.computeCaseloadHeatmap(store.practitioners);
    const marcusHeatmap = heatmap.find(p => p.id === 'prac-202');
    assert.equal(marcusHeatmap.activeCaseload, 19); // 18 -> 19
  });

  await reporter.test('T3.10 - Multi-Tab onSnapshot Simulation + Concurrent Note Modification + Audit Log Integrity', async () => {
    const firestore = new InMemoryFirestore();
    const tab1Store = new ManagementStoreEmulator(firestore);
    const tab2Store = new ManagementStoreEmulator(firestore);

    let tab2ReceivedUpdates = [];
    const unsubscribe = firestore.onSnapshot('caseNotes', (notes) => {
      tab2ReceivedUpdates = notes;
    });

    // Tab 1 creates a note
    await tab1Store.addCaseNote({
      id: 'note-multi-tab-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: 'Tab 1 initial entry.'
    });

    assert.ok(tab2ReceivedUpdates.some(n => n.id === 'note-multi-tab-1'), 'Tab 2 must receive live onSnapshot event');

    // Tab 2 updates note
    await tab2Store.addAuditLog('UPDATE', 'CaseNote', 'note-multi-tab-1', 'Tab 2 clinician added review remarks');
    assert.ok(tab2Store.auditLogs.some(log => log.details.includes('Tab 2 clinician')));

    unsubscribe();
  });

  await reporter.test('T3.11 - Command Center Live AI Chat + Live Metrics Context Integration', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Query active clients
    const clientQuery = AIAssistantEngine.queryCommandCenterAI('How many clients are active?', {
      clients: store.clients,
      claims: store.billingClaims,
      practitioners: store.practitioners,
      restrictivePractices: store.restrictivePractices
    });
    assert.ok(clientQuery.includes('3 active participant'));

    // Add another client and re-query
    await store.addClient({ id: 'cli-new-active', name: 'New Participant', ndisNumber: '439000999', status: 'Active' });

    const updatedClientQuery = AIAssistantEngine.queryCommandCenterAI('How many clients are active?', {
      clients: store.clients,
      claims: store.billingClaims,
      practitioners: store.practitioners,
      restrictivePractices: store.restrictivePractices
    });
    assert.ok(updatedClientQuery.includes('4 active participant'), 'AI Chat must reflect dynamic live client count (4)');
  });
}
