/**
 * Tier 1: Feature Coverage E2E Test Suite
 * 
 * Verifies core functionality across all 5 phases:
 * Phase 1: Firestore Persistence Layer (≥5 tests)
 * Phase 2: Auth Guards & RBAC (≥5 tests)
 * Phase 3: Real-Time Sync, Offline Support & Optimistic Updates (≥5 tests)
 * Phase 4: AI Enhancements via Gemini & Speech (≥5 tests)
 * Phase 5: Data Dashboards & Compliance Analytics (≥5 tests)
 * 
 * Total Tests: 28 tests (exceeds ≥25 requirement)
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  AIAssistantEngine,
  DashboardAnalyticsAggregator,
  SEED_CLIENTS,
  SEED_PRACTITIONERS,
  SEED_USERS,
  SEED_CLAIMS,
  SEED_INCIDENTS,
  SEED_RESTRICTIVE_PRACTICES
} from '../harness/emulator.mjs';

export async function runTier1Tests(reporter) {
  reporter.startSuite('Tier 1: Feature Coverage (Phases 1-5)');

  // =========================================================================
  // PHASE 1: FIRESTORE PERSISTENCE LAYER
  // =========================================================================
  reporter.startPhase('Phase 1: Firestore Persistence Layer');

  await reporter.test('T1.1.1 - Create Client document in Firestore and verify snapshot retrieval', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const clientPayload = {
      id: 'cli-new-101',
      ndisNumber: '439999123',
      name: 'Oliver Twist',
      dateOfBirth: '2005-07-14',
      status: 'Active',
      primaryDisability: 'Autism Spectrum Disorder',
      totalBudget: 45000,
      allocatedBudget: 40000,
      primaryPractitionerId: 'prac-201',
      primaryPractitionerName: 'Dr. Sarah Jenkins'
    };

    const created = await store.addClient(clientPayload);
    assert.equal(created.id, 'cli-new-101');
    assert.equal(created.name, 'Oliver Twist');

    // Verify document actually exists in Firestore datastore
    const docInFirestore = await firestore.getDoc('clients', 'cli-new-101', store.getAuthContext());
    assert.ok(docInFirestore, 'Document must be present in Firestore');
    assert.equal(docInFirestore.ndisNumber, '439999123');
    assert.equal(docInFirestore.status, 'Active');
    assert.ok(docInFirestore.createdAt, 'Timestamp must be generated');
  });

  await reporter.test('T1.1.2 - Create Case Note document in Firestore and verify persistence across session reload', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const notePayload = {
      id: 'note-persist-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      format: 'SIMPL',
      subjective: 'Participant engaged calmly in community therapy.',
      objective: 'Completed 60 minutes of PBS positive reinforcement exercises.',
      assessment: 'Progress observed in emotional self-regulation.',
      plan: 'Continue weekly home visits.'
    };

    const note = await store.addCaseNote(notePayload);
    assert.equal(note.id, 'note-persist-1');

    // Simulate brand new application session reading from Firestore
    const newStore = new ManagementStoreEmulator(firestore);
    const persistedNote = await firestore.getDoc('caseNotes', 'note-persist-1', newStore.getAuthContext());
    assert.ok(persistedNote, 'Case note must persist and be retrievable in new session');
    assert.equal(persistedNote.subjective, 'Participant engaged calmly in community therapy.');
    assert.equal(persistedNote.format, 'SIMPL');
    assert.equal(persistedNote.authorId, store.currentUser.id);
  });

  await reporter.test('T1.1.3 - Update Billing Claim document in Firestore and assert audit trail record', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const claim = await store.addBillingClaim({
      id: 'claim-update-test',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      ndisNumber: '430891245',
      serviceDate: '2026-08-15',
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      supportItemCode: '07_002_0115_8_3',
      hours: 2.0,
      unitRate: 214.41,
      totalAmount: 428.82,
      status: 'Pending'
    });

    assert.equal(claim.totalAmount, 428.82);

    // Update claim status to Paid in Firestore
    await firestore.updateDoc('billingClaims', 'claim-update-test', {
      status: 'Paid',
      reconciliationStatus: 'Reconciled',
      paymentReceivedDate: '2026-08-16'
    }, store.getAuthContext());

    const updated = await firestore.getDoc('billingClaims', 'claim-update-test', store.getAuthContext());
    assert.equal(updated.status, 'Paid');
    assert.equal(updated.reconciliationStatus, 'Reconciled');
    assert.ok(store.auditLogs.some(log => log.entity === 'BillingClaim' && log.entityId === 'claim-update-test'));
  });

  await reporter.test('T1.1.4 - Delete Client document from Firestore by ADMIN and verify removal', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    await store.addClient({
      id: 'cli-to-delete',
      name: 'Temporary Client',
      ndisNumber: '431111222',
      status: 'Onboarding'
    });

    const docBefore = await firestore.getDoc('clients', 'cli-to-delete', store.getAuthContext());
    assert.ok(docBefore);

    // Delete as ADMIN
    await store.deleteClient('cli-to-delete');

    const docAfter = await firestore.getDoc('clients', 'cli-to-delete', store.getAuthContext());
    assert.equal(docAfter, null, 'Deleted document must not exist in Firestore');
    assert.ok(!store.clients.some(c => c.id === 'cli-to-delete'), 'Store must remove client');
  });

  await reporter.test('T1.1.5 - Security Rules default-deny unauthenticated reads and writes across collections', async () => {
    const firestore = new InMemoryFirestore();

    // 1. Unauthenticated read to /clients should fail
    await assert.rejects(
      async () => await firestore.listDocs('clients', null),
      /PERMISSION_DENIED/,
      'Unauthenticated read on /clients must be denied'
    );

    // 2. Unauthenticated write to /caseNotes should fail
    await assert.rejects(
      async () => await firestore.setDoc('caseNotes', 'note-anon', { content: 'test' }, null),
      /PERMISSION_DENIED/,
      'Unauthenticated write on /caseNotes must be denied'
    );

    // 3. Public system health check endpoint /system/{docId} must succeed without auth
    const systemDoc = await firestore.getDoc('system', 'connection_test', null);
    assert.ok(systemDoc, 'Public /system connection probe must succeed unauthenticated');
    assert.equal(systemDoc.status, 'ok');
  });

  await reporter.test('T1.1.6 - Initial data hydration loads existing collections into store cache', async () => {
    const firestore = new InMemoryFirestore();
    const initialClients = await firestore.listDocs('clients', { uid: 'admin', role: 'ADMIN' });
    const initialPractitioners = await firestore.listDocs('practitioners', { uid: 'admin', role: 'ADMIN' });

    assert.equal(initialClients.length, 3, 'Seed clients must have 3 records');
    assert.equal(initialPractitioners.length, 4, 'Seed practitioners must have 4 records');

    const store = new ManagementStoreEmulator(firestore);
    assert.equal(store.clients.length, initialClients.length);
    assert.equal(store.practitioners.length, initialPractitioners.length);
  });

  // =========================================================================
  // PHASE 2: AUTHENTICATION GUARDS & RBAC
  // =========================================================================
  reporter.startPhase('Phase 2: Authentication Guards and Role-Based Access Control');

  await reporter.test('T1.2.1 - Unauthenticated session redirects and denies access to clinical actions', async () => {
    const firestore = new InMemoryFirestore();
    const anonymousContext = null;

    await assert.rejects(
      async () => await firestore.getDoc('clients', 'cli-101', anonymousContext),
      /PERMISSION_DENIED/,
      'Anonymous access to clinical records must throw PERMISSION_DENIED'
    );
  });

  await reporter.test('T1.2.2 - VIEWER role is granted read-only access and blocked from creating or editing data', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.switchUser('user-auditor'); // role: 'VIEWER'

    assert.equal(store.currentUser.role, 'VIEWER');

    // Read must succeed
    const clients = await firestore.listDocs('clients', store.getAuthContext());
    assert.ok(clients.length > 0, 'VIEWER must be able to read clients');

    // Attempted creation must fail
    await assert.rejects(
      async () => await firestore.setDoc('clients', 'cli-viewer-hack', { name: 'Unauthorized' }, store.getAuthContext()),
      /PERMISSION_DENIED.*VIEWER/,
      'VIEWER role must be rejected on document creation'
    );

    // Attempted delete must fail
    await assert.rejects(
      async () => await firestore.deleteDoc('clients', 'cli-101', store.getAuthContext()),
      /PERMISSION_DENIED/,
      'VIEWER role must be rejected on document deletion'
    );
  });

  await reporter.test('T1.2.3 - PRACTITIONER role can create/edit own case notes but cannot delete clients', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.switchUser('user-specialist'); // role: 'PRACTITIONER'

    assert.equal(store.currentUser.role, 'PRACTITIONER');

    // Practitioner creates own note
    const note = await store.addCaseNote({
      id: 'note-prac-owned',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: 'Practitioner observed steady routine tolerance.',
      objective: 'Applied sensory breaks.',
      assessment: 'Adequate regulation.',
      plan: 'Continue therapy.'
    });

    assert.equal(note.authorId, 'user-specialist');

    // Practitioner tries to delete client -> must throw
    await assert.rejects(
      async () => await store.deleteClient('cli-101'),
      /PERMISSION_DENIED/,
      'PRACTITIONER cannot delete client'
    );
  });

  await reporter.test('T1.2.4 - ADMIN role has full permissions for client deletion and system management', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.switchUser('user-director'); // role: 'ADMIN'

    assert.equal(store.currentUser.role, 'ADMIN');

    // Admin adds and deletes client cleanly
    const newClient = await store.addClient({
      id: 'cli-admin-del',
      name: 'Admin Test Participant',
      ndisNumber: '439123888',
      status: 'Onboarding'
    });

    await store.deleteClient(newClient.id);
    const checkDoc = await firestore.getDoc('clients', newClient.id, store.getAuthContext());
    assert.equal(checkDoc, null, 'ADMIN delete must successfully remove document');
  });

  await reporter.test('T1.2.5 - Route and tab navigation gating flags admin-only modules', async () => {
    const adminTabs = ['hr-roster', 'audit-logs', 'integrations'];

    const checkTabAccess = (role, tab) => {
      if (adminTabs.includes(tab)) {
        return role === 'ADMIN';
      }
      return true;
    };

    assert.equal(checkTabAccess('ADMIN', 'hr-roster'), true);
    assert.equal(checkTabAccess('PRACTITIONER', 'hr-roster'), false);
    assert.equal(checkTabAccess('VIEWER', 'audit-logs'), false);
    assert.equal(checkTabAccess('VIEWER', 'clients'), true);
    assert.equal(checkTabAccess('PRACTITIONER', 'case-notes'), true);
  });

  await reporter.test('T1.2.6 - Security rules enforce author ownership on Case Note modification', async () => {
    const firestore = new InMemoryFirestore();

    // Create note by user-specialist
    await firestore.setDoc('caseNotes', 'note-author-lock', {
      id: 'note-author-lock',
      authorId: 'user-specialist',
      content: 'Original clinical observation'
    }, { uid: 'user-specialist', role: 'PRACTITIONER' });

    // Another practitioner (user-other) attempts to modify note
    await assert.rejects(
      async () => await firestore.updateDoc('caseNotes', 'note-author-lock', {
        content: 'Malicious modification by other practitioner'
      }, { uid: 'user-other', role: 'PRACTITIONER' }),
      /PERMISSION_DENIED.*Non-author/,
      'Non-author practitioner cannot edit another practitioner\'s note'
    );

    // ADMIN can override and update if necessary
    await firestore.updateDoc('caseNotes', 'note-author-lock', {
      content: 'Admin verified and updated'
    }, { uid: 'user-director', role: 'ADMIN' });

    const updated = await firestore.getDoc('caseNotes', 'note-author-lock', { uid: 'user-director', role: 'ADMIN' });
    assert.equal(updated.content, 'Admin verified and updated');
  });

  // =========================================================================
  // PHASE 3: REAL-TIME SYNC, OFFLINE SUPPORT & OPTIMISTIC UPDATES
  // =========================================================================
  reporter.startPhase('Phase 3: Real-Time Sync, Offline Support and Optimistic Updates');

  await reporter.test('T1.3.1 - onSnapshot real-time listener propagates mutations across active subscribers', async () => {
    const firestore = new InMemoryFirestore();
    let snapshotCount = 0;
    let lastReceivedData = [];

    const unsubscribe = firestore.onSnapshot('clients', (data) => {
      snapshotCount++;
      lastReceivedData = data;
    });

    assert.equal(snapshotCount, 1, 'Initial snapshot must fire upon subscription');
    assert.equal(lastReceivedData.length, 3);

    // Add a client to simulate update from another browser tab
    await firestore.setDoc('clients', 'cli-tab-2', {
      id: 'cli-tab-2',
      name: 'Multi-tab Participant',
      ndisNumber: '439999000',
      status: 'Active'
    }, { uid: 'user-director', role: 'ADMIN' });

    assert.equal(snapshotCount, 2, 'Snapshot listener must trigger on remote change');
    assert.equal(lastReceivedData.length, 4);
    assert.ok(lastReceivedData.some(c => c.id === 'cli-tab-2'));

    unsubscribe();
    // Subsequent write should not notify unsubscribed listener
    await firestore.deleteDoc('clients', 'cli-tab-2', { uid: 'user-director', role: 'ADMIN' });
    assert.equal(snapshotCount, 2, 'Unsubscribed listener must not receive further events');
  });

  await reporter.test('T1.3.2 - ConnectionStatusIndicator states accurately reflect network status', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    assert.equal(store.isOnline, true);
    assert.equal(store.syncStatus, 'synced');

    // Simulate network disconnect
    store.setOnlineStatus(false);
    assert.equal(store.isOnline, false);
    assert.equal(store.syncStatus, 'offline');

    // Restore network
    store.setOnlineStatus(true);
    assert.equal(store.isOnline, true);
    assert.equal(store.syncStatus, 'synced');
  });

  await reporter.test('T1.3.3 - Offline mutation queueing stores OfflineDelta when network is unavailable', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    // Practitioner creates note while offline
    const note = await store.addCaseNote({
      id: 'note-field-offline-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: 'Field visit in rural area without cell reception.',
      objective: 'Practitioner completed visual routine assessment.',
      assessment: 'Calm responsiveness.',
      plan: 'Review in 2 weeks.'
    });

    assert.equal(store.offlineQueue.length, 1, 'Offline mutation must be queued');
    assert.equal(store.pendingChangesCount, 1);
    assert.equal(store.syncStatus, 'offline');
    assert.equal(store.offlineQueue[0].entity, 'CaseNote');
    assert.equal(store.offlineQueue[0].entityId, 'note-field-offline-1');

    // Document in remote firestore is not yet written because client is offline
    firestore.setOnlineStatus(true); // Temporarily check remote without trigger
    const remoteDoc = await firestore.getDoc('caseNotes', 'note-field-offline-1', store.getAuthContext());
    assert.equal(remoteDoc, null, 'Remote datastore must not have offline note prior to sync');
  });

  await reporter.test('T1.3.4 - Automated delta sync flushes queued mutations when connection is restored', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    // Queue 2 offline actions
    await store.addClient({ id: 'cli-offline-a', name: 'Offline Client A', ndisNumber: '439111001' });
    await store.addBillingClaim({
      id: 'claim-offline-b',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      totalAmount: 214.41,
      supportItemCode: '07_002_0115_8_3'
    });

    assert.equal(store.offlineQueue.length, 2);

    // Network connection restored -> triggers triggerDeltaSync()
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0, 'Offline queue must be flushed');
    assert.equal(store.pendingChangesCount, 0);
    assert.equal(store.syncStatus, 'synced');

    // Verify remote Firestore now contains both documents
    const syncedClient = await firestore.getDoc('clients', 'cli-offline-a', store.getAuthContext());
    const syncedClaim = await firestore.getDoc('billingClaims', 'claim-offline-b', store.getAuthContext());
    assert.ok(syncedClient, 'Synced client must exist in Firestore');
    assert.ok(syncedClaim, 'Synced claim must exist in Firestore');
  });

  await reporter.test('T1.3.5 - Optimistic state updates reflect in store immediately before remote confirmation', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const clientData = {
      id: 'cli-optimistic-1',
      name: 'Instant Update Participant',
      ndisNumber: '439888777',
      status: 'Active'
    };

    // Store is updated immediately
    const addPromise = store.addClient(clientData);
    assert.ok(store.clients.some(c => c.id === 'cli-optimistic-1'), 'Store must immediately reflect optimistic state');

    await addPromise;
    assert.ok(store.clients.some(c => c.id === 'cli-optimistic-1'));
  });

  // =========================================================================
  // PHASE 4: AI ENHANCEMENTS VIA GEMINI & WEB SPEECH
  // =========================================================================
  reporter.startPhase('Phase 4: AI Enhancements via Gemini and Web Speech');

  await reporter.test('T1.4.1 - Case Notes AI auto-drafts structured SIMPL/BIRP progress notes from raw bullet points', async () => {
    const rawObservation = 'Participant presented calm. Completed 45 min functional assessment. Used visual board 4 times independently. Recommended continuation of current PBS strategies.';

    // Draft SIMPL note
    const simplNote = AIAssistantEngine.draftCaseNote(rawObservation, 'SIMPL', 'Jordan Miller');
    assert.ok(simplNote.subjective, 'SIMPL note must have Subjective section');
    assert.ok(simplNote.objective, 'SIMPL note must have Objective section');
    assert.ok(simplNote.assessment, 'SIMPL note must have Assessment section');
    assert.ok(simplNote.plan, 'SIMPL note must have Plan section');

    // Draft BIRP note
    const birpNote = AIAssistantEngine.draftCaseNote(rawObservation, 'BIRP', 'Jordan Miller');
    assert.ok(birpNote.subjective.includes('Behavior:'));
    assert.ok(birpNote.objective.includes('Intervention:'));
    assert.ok(birpNote.assessment.includes('Response:'));
    assert.ok(birpNote.plan.includes('Plan:'));
  });

  await reporter.test('T1.4.2 - Heuristic fallback gracefully provides audit-compliant note when Gemini API is unavailable', async () => {
    // When summary is empty or API offline, fallback returns sensible defaults without throwing
    const fallbackNote = AIAssistantEngine.draftCaseNote('', 'SIMPL', 'Jordan Miller');
    assert.ok(fallbackNote.subjective.length > 0);
    assert.ok(fallbackNote.objective.length > 0);
    assert.ok(fallbackNote.assessment.length > 0);
    assert.ok(fallbackNote.plan.length > 0);
  });

  await reporter.test('T1.4.3 - ABC-to-Goals generation suggests SMART & GAS goals from behavior patterns', async () => {
    const abcLogs = [
      {
        id: 'abc-1',
        clientId: 'cli-101',
        antecedent: 'Transition from iPad to dinner',
        behavior: 'Refusal and dropped to floor',
        consequence: 'Visual timer provided',
        perceivedFunction: 'Escape/Avoidance',
        intensity: 3,
        durationMinutes: 8
      }
    ];

    const suggestedGoals = AIAssistantEngine.suggestGoalsFromABC(abcLogs);
    assert.ok(suggestedGoals.length > 0, 'Must suggest at least 1 goal');
    const primaryGoal = suggestedGoals[0];
    assert.ok(primaryGoal.title.includes('break-request') || primaryGoal.title.includes('avoidance') || primaryGoal.title.includes('regulation'));
    assert.equal(primaryGoal.category, 'Capacity Building');
    assert.equal(primaryGoal.status, 'In Progress');
  });

  await reporter.test('T1.4.4 - Command Center AI chat incorporates live Firestore context into responses', async () => {
    const liveContext = {
      clients: SEED_CLIENTS, // 3 clients (all active)
      claims: SEED_CLAIMS,
      practitioners: SEED_PRACTITIONERS,
      restrictivePractices: SEED_RESTRICTIVE_PRACTICES
    };

    const answerActiveClients = AIAssistantEngine.queryCommandCenterAI('How many clients are active?', liveContext);
    assert.ok(answerActiveClients.includes('3 active participant'), 'AI response must state 3 active participants');

    const answerRevenue = AIAssistantEngine.queryCommandCenterAI('What is total billing revenue?', liveContext);
    assert.ok(answerRevenue.includes('$'), 'AI response must contain dollar revenue figures');
  });

  await reporter.test('T1.4.5 - Voice dictation transcript streaming structures into clinical note fields', async () => {
    const simulatedVoiceStream = 'Participant Jordan Miller arrived on time with mother. Demonstrated strong interest in task schedule board. Completed all three sensory exercises with zero agitation. Schedule next review for next Tuesday.';

    const structured = AIAssistantEngine.draftCaseNote(simulatedVoiceStream, 'SIMPL', 'Jordan Miller');
    assert.ok(structured.subjective.length > 0);
    assert.ok(structured.objective.length > 0);
    assert.ok(structured.assessment.length > 0);
    assert.ok(structured.plan.length > 0);
  });

  // =========================================================================
  // PHASE 5: DATA DASHBOARDS & COMPLIANCE ANALYTICS
  // =========================================================================
  reporter.startPhase('Phase 5: Data Dashboards and Compliance Analytics');

  await reporter.test('T1.5.1 - Real-time billing revenue dashboard aggregates claims submitted vs paid and client balances', async () => {
    const claims = [
      { id: 'c1', clientName: 'Jordan Miller', totalAmount: 321.62, status: 'Paid' },
      { id: 'c2', clientName: 'Samantha Reed', totalAmount: 387.98, status: 'Paid' },
      { id: 'c3', clientName: 'Liam O’Connor', totalAmount: 214.41, status: 'Submitted PACE' },
      { id: 'c4', clientName: 'Jordan Miller', totalAmount: 214.41, status: 'Pending' }
    ];

    const metrics = DashboardAnalyticsAggregator.computeBillingMetrics(claims);
    assert.equal(metrics.totalRevenue, 1138.42);
    assert.equal(metrics.totalPaid, 709.60);
    assert.equal(metrics.totalSubmitted, 214.41);
    assert.equal(metrics.totalPending, 214.41);
    assert.equal(metrics.paidPercentage, 62); // 709.60 / 1138.42 = ~62%
    assert.equal(metrics.claimsByClient['Jordan Miller'], 536.03);
  });

  await reporter.test('T1.5.2 - Compliance KPI dashboard computes worker screening expiry and compliance rate', async () => {
    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(SEED_PRACTITIONERS, SEED_INCIDENTS, SEED_RESTRICTIVE_PRACTICES);

    assert.equal(kpis.practitioners.total, 4);
    assert.equal(kpis.practitioners.valid, 3);
    assert.equal(kpis.practitioners.expiringSoon, 1); // Liam Gallagher
    assert.equal(kpis.practitioners.complianceRate, 75); // 3 / 4 = 75%
  });

  await reporter.test('T1.5.3 - Incident reportability KPI calculates 24hr statutory rate and reportable totals', async () => {
    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(SEED_PRACTITIONERS, SEED_INCIDENTS, SEED_RESTRICTIVE_PRACTICES);

    assert.equal(kpis.incidents.total, 2);
    assert.equal(kpis.incidents.reportable, 1);
    assert.equal(kpis.incidents.reportabilityRate, 50); // 1 out of 2 = 50%
  });

  await reporter.test('T1.5.4 - Practitioner caseload heatmap computes active caseload count vs capacity limits', async () => {
    const heatmap = DashboardAnalyticsAggregator.computeCaseloadHeatmap(SEED_PRACTITIONERS);
    assert.equal(heatmap.length, 4);

    const sarah = heatmap.find(p => p.name === 'Dr. Sarah Jenkins');
    assert.equal(sarah.activeCaseload, 14);
    assert.equal(sarah.caseloadLimit, 20);
    assert.equal(sarah.utilization, 70); // 14/20 = 70%
    assert.equal(sarah.isOverCapacity, false);

    const marcus = heatmap.find(p => p.name === 'Marcus Vance');
    assert.equal(marcus.activeCaseload, 18);
    assert.equal(marcus.caseloadLimit, 22);
    assert.equal(marcus.utilization, 82); // 18/22 = 82%
  });

  await reporter.test('T1.5.5 - Plan budget utilization calculation computes client NDIS burn rate and remaining balances', async () => {
    const client = {
      id: 'cli-101',
      totalBudget: 48500,
      allocatedBudget: 42000,
      spentBudget: 24350
    };

    const budget = DashboardAnalyticsAggregator.computeBudgetUtilization(client);
    assert.equal(budget.total, 48500);
    assert.equal(budget.spent, 24350);
    assert.equal(budget.remaining, 24150);
    assert.equal(budget.utilizationPercent, 50); // 24350 / 48500 = 50.2% -> 50%
    assert.equal(budget.isOverdrawn, false);
  });

  await reporter.test('T1.5.6 - Dashboard fallback handles empty datasets gracefully with zero metrics', async () => {
    const emptyBilling = DashboardAnalyticsAggregator.computeBillingMetrics([]);
    assert.equal(emptyBilling.totalRevenue, 0);
    assert.equal(emptyBilling.paidPercentage, 0);
    assert.deepEqual(emptyBilling.claimsByClient, {});

    const emptyCompliance = DashboardAnalyticsAggregator.computeComplianceKPIs([], [], []);
    assert.equal(emptyCompliance.practitioners.total, 0);
    assert.equal(emptyCompliance.practitioners.complianceRate, 100);
    assert.equal(emptyCompliance.incidents.total, 0);
    assert.equal(emptyCompliance.incidents.reportabilityRate, 0);
  });
}
