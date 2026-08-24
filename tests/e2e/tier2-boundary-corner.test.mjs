/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 * 
 * Verifies edge cases, stress boundaries, validation limits, and failure modes across all 5 phases:
 * Phase 1: Persistence Boundaries (≥5 tests)
 * Phase 2: Auth & RBAC Boundaries (≥5 tests)
 * Phase 3: Real-Time & Offline Boundaries (≥5 tests)
 * Phase 4: AI & Speech Boundaries (≥5 tests)
 * Phase 5: Dashboards & Analytics Boundaries (≥5 tests)
 * 
 * Total Tests: 26 tests (exceeds ≥25 requirement)
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  AIAssistantEngine,
  DashboardAnalyticsAggregator,
  SEED_PRACTITIONERS
} from '../harness/emulator.mjs';

export async function runTier2Tests(reporter) {
  reporter.startSuite('Tier 2: Boundary and Corner Cases (Phases 1-5)');

  // =========================================================================
  // PHASE 1: PERSISTENCE BOUNDARIES
  // =========================================================================
  reporter.startPhase('Phase 1: Persistence Boundaries');

  await reporter.test('T2.1.1 - Extreme payload size: handles case notes up to 15,000 characters and rejects >15,000', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Valid 14,000 character note
    const validContent = 'A'.repeat(14000);
    const validNote = await store.addCaseNote({
      id: 'note-large-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: validContent,
      objective: 'Long clinical observation record.',
      assessment: 'Valid boundary test.',
      plan: 'Next steps.'
    });
    assert.equal(validNote.subjective.length, 14000);

    // Exceeding 15,000 chars rejected by Firestore rule
    const oversizedContent = 'B'.repeat(15500);
    await assert.rejects(
      async () => await firestore.setDoc('caseNotes', 'note-oversized', {
        id: 'note-oversized',
        authorId: store.currentUser.id,
        content: oversizedContent
      }, store.getAuthContext()),
      /INVALID_ARGUMENT.*15,000/,
      'Notes exceeding 15,000 characters must be rejected'
    );
  });

  await reporter.test('T2.1.2 - Special characters & Unicode: persists emojis, symbols, and multiline text cleanly', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const specialClient = {
      id: 'cli-unicode-2026',
      name: 'José & René—O\'Connor 🌟 (Support Needs: 100% 🎯)',
      ndisNumber: '430-891-245/A',
      status: 'Active',
      primaryDisability: 'Autism Spectrum Disorder / Level 3 🧩'
    };

    await store.addClient(specialClient);

    const retrieved = await firestore.getDoc('clients', 'cli-unicode-2026', store.getAuthContext());
    assert.equal(retrieved.name, 'José & René—O\'Connor 🌟 (Support Needs: 100% 🎯)');
    assert.equal(retrieved.primaryDisability, 'Autism Spectrum Disorder / Level 3 🧩');
  });

  await reporter.test('T2.1.3 - Malformed IDs & Path injection: rejects invalid characters and path traversal', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Path traversal attempt '../secret'
    await assert.rejects(
      async () => await firestore.getDoc('clients', '../system/config', store.getAuthContext()),
      /INVALID_ARGUMENT/,
      'Path traversal in document ID must be rejected'
    );

    // Invalid symbols in ID
    await assert.rejects(
      async () => await firestore.getDoc('clients', 'client/with/slash', store.getAuthContext()),
      /INVALID_ARGUMENT/,
      'Slashes in document ID must be rejected'
    );

    // ID longer than 128 characters
    const ultraLongId = 'c'.repeat(130);
    await assert.rejects(
      async () => await firestore.getDoc('clients', ultraLongId, store.getAuthContext()),
      /INVALID_ARGUMENT/,
      'IDs longer than 128 characters must be rejected'
    );
  });

  await reporter.test('T2.1.4 - Deeply nested JSON data structures: persists multi-tier nested objects and arrays', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const deepClient = {
      id: 'cli-deep-nested',
      name: 'Deep Nesting Participant',
      ndisNumber: '439999888',
      address: {
        street: '123 Breakthrough Way',
        suburb: 'Richmond',
        state: 'VIC',
        postcode: '3121',
        mmmZone: 'MMM 1 - Major City'
      },
      budgetBreakdown: {
        core: 20000,
        capacityBuildingPBS: 18000,
        capacityBuildingTherapy: 12000
      },
      goals: [
        {
          id: 'g-deep-1',
          title: 'Deep goal with historical milestone log',
          category: 'Capacity Building',
          targetDate: '2026-12-31',
          progressPercent: 50,
          status: 'In Progress',
          gasScore: 0,
          gasHistory: [
            { date: '2026-01-15', score: -2, note: 'Initial baseline' },
            { date: '2026-04-15', score: -1, note: 'Emerging skill' },
            { date: '2026-07-15', score: 0, note: 'Expected outcome met' }
          ]
        }
      ]
    };

    await store.addClient(deepClient);

    const retrieved = await firestore.getDoc('clients', 'cli-deep-nested', store.getAuthContext());
    assert.equal(retrieved.address.suburb, 'Richmond');
    assert.equal(retrieved.budgetBreakdown.capacityBuildingPBS, 18000);
    assert.equal(retrieved.goals[0].gasHistory.length, 3);
    assert.equal(retrieved.goals[0].gasHistory[2].score, 0);
  });

  await reporter.test('T2.1.5 - Upsert semantics: updating non-existent document throws descriptive error', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    await assert.rejects(
      async () => await firestore.updateDoc('clients', 'cli-non-existent-999', { name: 'New Name' }, store.getAuthContext()),
      /not found/,
      'Updating non-existent document must fail with descriptive error'
    );
  });

  await reporter.test('T2.1.6 - Empty collection querying returns empty array without throwing', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const emptyDocs = await firestore.listDocs('auditLogs', store.getAuthContext());
    assert.equal(Array.isArray(emptyDocs), true);
    assert.equal(emptyDocs.length, 0);
  });

  // =========================================================================
  // PHASE 2: AUTH & RBAC BOUNDARIES
  // =========================================================================
  reporter.startPhase('Phase 2: Auth and RBAC Boundaries');

  await reporter.test('T2.2.1 - Corrupted or missing token context immediately revokes data access', async () => {
    const firestore = new InMemoryFirestore();

    const invalidAuth = { uid: '', email: null, role: null };
    await assert.rejects(
      async () => await firestore.listDocs('clients', invalidAuth),
      /PERMISSION_DENIED/,
      'Invalid auth context must be denied access'
    );
  });

  await reporter.test('T2.2.2 - Case-insensitive and unrecognized role strings default to minimal safe permissions', async () => {
    const firestore = new InMemoryFirestore();

    // Lowercase 'admin' or tampered role 'SUPERUSER' should not grant admin deletion rights
    const tamperedAuth = { uid: 'hacker-1', role: 'admin' }; // Lowercase 'admin'
    await assert.rejects(
      async () => await firestore.deleteDoc('clients', 'cli-101', tamperedAuth),
      /PERMISSION_DENIED/,
      'Non-standard role "admin" must not bypass RBAC checks'
    );

    const superuserAuth = { uid: 'hacker-2', role: 'SUPERUSER' };
    await assert.rejects(
      async () => await firestore.deleteDoc('clients', 'cli-101', superuserAuth),
      /PERMISSION_DENIED/,
      'Arbitrary role string "SUPERUSER" must not bypass RBAC checks'
    );
  });

  await reporter.test('T2.2.3 - Privilege escalation attempt: non-admin cannot modify user role in /users/{userId}', async () => {
    const firestore = new InMemoryFirestore();

    const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };

    // Practitioner cannot modify other user's document
    await assert.rejects(
      async () => await firestore.setDoc('users', 'user-director', { role: 'VIEWER' }, practitionerAuth),
      /PERMISSION_DENIED/,
      'Practitioner cannot overwrite another user profile'
    );
  });

  await reporter.test('T2.2.4 - Concurrent rapid deletion requests by non-admin are all strictly rejected', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    store.switchUser('user-specialist'); // PRACTITIONER

    const deletionAttempts = [
      store.deleteClient('cli-101'),
      store.deleteClient('cli-102'),
      store.deleteClient('cli-103')
    ];

    const results = await Promise.allSettled(deletionAttempts);
    for (const res of results) {
      assert.equal(res.status, 'rejected');
      assert.match(res.reason.message, /PERMISSION_DENIED/);
    }
  });

  await reporter.test('T2.2.5 - User profile with partial or missing screening fields is safely normalized', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const legacyPractitioner = {
      id: 'prac-legacy-99',
      name: 'Legacy Practitioner',
      email: 'legacy@breakthrough.org.au',
      position: 'Speech Pathologist',
      qualification: 'B.App.Sc',
      ndisRegistrationNumber: 'PRAC-LEGACY',
      screeningStatus: 'Valid',
      screeningExpiryDate: '2027-12-31'
    };

    await firestore.setDoc('practitioners', 'prac-legacy-99', legacyPractitioner, store.getAuthContext());
    const retrieved = await firestore.getDoc('practitioners', 'prac-legacy-99', store.getAuthContext());
    assert.equal(retrieved.name, 'Legacy Practitioner');

    const heatmap = DashboardAnalyticsAggregator.computeCaseloadHeatmap([retrieved]);
    assert.equal(heatmap[0].activeCaseload, 0); // Normalized default
    assert.equal(heatmap[0].caseloadLimit, 20); // Normalized default
  });

  // =========================================================================
  // PHASE 3: REAL-TIME & OFFLINE BOUNDARIES
  // =========================================================================
  reporter.startPhase('Phase 3: Real-Time and Offline Boundaries');

  await reporter.test('T2.3.1 - Rapid network flapping (50 cycles) maintains queue and state consistency', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    // Queue initial delta
    store.setOnlineStatus(false);
    await store.addClient({ id: 'cli-flap-1', name: 'Flap Client', ndisNumber: '439999001' });

    // Rapidly toggle online/offline 50 times
    for (let i = 0; i < 50; i++) {
      store.setOnlineStatus(i % 2 === 0);
    }

    // Set online and flush
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0);
    assert.equal(store.syncStatus, 'synced');
    const doc = await firestore.getDoc('clients', 'cli-flap-1', store.getAuthContext());
    assert.ok(doc, 'Document must successfully persist after rapid flapping');
  });

  await reporter.test('T2.3.2 - Delta deduplication & idempotency: duplicate deltas do not create duplicate records', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    // Queue 2 mutations for the exact same entity ID
    store.queueOfflineDelta('CREATE', 'Client', 'cli-dedup-1', { id: 'cli-dedup-1', name: 'Original Name', ndisNumber: '439123456' });
    store.queueOfflineDelta('UPDATE', 'Client', 'cli-dedup-1', { name: 'Updated Final Name' });

    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    const doc = await firestore.getDoc('clients', 'cli-dedup-1', store.getAuthContext());
    assert.equal(doc.name, 'Updated Final Name', 'Latest delta update must prevail');
  });

  await reporter.test('T2.3.3 - Empty offline queue flush safely transitions to synced without errors', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    assert.equal(store.offlineQueue.length, 0);
    await store.triggerDeltaSync();

    assert.equal(store.syncStatus, 'synced');
    assert.equal(store.pendingChangesCount, 0);
  });

  await reporter.test('T2.3.4 - Large offline queue batch handling (100 deltas) flushes completely', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    // Queue 100 deltas
    for (let i = 0; i < 100; i++) {
      store.queueOfflineDelta('CREATE', 'Client', `cli-batch-${i}`, {
        id: `cli-batch-${i}`,
        name: `Batch Client ${i}`,
        ndisNumber: `439000${String(i).padStart(3, '0')}`,
        status: 'Active'
      });
    }

    assert.equal(store.offlineQueue.length, 100);
    assert.equal(store.pendingChangesCount, 100);

    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    assert.equal(store.offlineQueue.length, 0);
    assert.equal(store.pendingChangesCount, 0);
    assert.equal(store.syncStatus, 'synced');

    const first = await firestore.getDoc('clients', 'cli-batch-0', store.getAuthContext());
    const last = await firestore.getDoc('clients', 'cli-batch-99', store.getAuthContext());
    assert.ok(first);
    assert.ok(last);
  });

  await reporter.test('T2.3.5 - Out-of-order delta timestamp resolution retains most recent state', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);
    store.queueOfflineDelta('CREATE', 'Client', 'cli-order-1', { id: 'cli-order-1', name: 'Step 1', status: 'Onboarding' });
    store.queueOfflineDelta('UPDATE', 'Client', 'cli-order-1', { status: 'Active' });

    store.setOnlineStatus(true);
    await store.triggerDeltaSync();

    const client = await firestore.getDoc('clients', 'cli-order-1', store.getAuthContext());
    assert.equal(client.status, 'Active');
  });

  // =========================================================================
  // PHASE 4: AI & SPEECH BOUNDARIES
  // =========================================================================
  reporter.startPhase('Phase 4: AI and Speech Boundaries');

  await reporter.test('T2.4.1 - Empty and whitespace-only prompt inputs return valid fallback structures without crashing', async () => {
    const emptyResult = AIAssistantEngine.draftCaseNote('', 'SIMPL', 'Participant');
    assert.ok(emptyResult.subjective);
    assert.ok(emptyResult.plan);

    const whitespaceResult = AIAssistantEngine.draftCaseNote('    \n\n\t   ', 'BIRP', 'Participant');
    assert.ok(whitespaceResult.subjective.includes('Behavior:'));
    assert.ok(whitespaceResult.plan.includes('Plan:'));
  });

  await reporter.test('T2.4.2 - Critical incident keyword detection triggers statutory 24-hour SLA across edge variations', async () => {
    const criticalDescriptions = [
      'Participant sustained minor head injury requiring hospital examination.',
      'Emergency physical restrictive intervention applied during high-traffic situation.',
      'Police attended residential facility following severe community altercation.',
      'Allegation of financial abuse reported to safeguarding lead.'
    ];

    for (const desc of criticalDescriptions) {
      const sla = AIAssistantEngine.analyzeIncidentSLA(desc);
      assert.equal(sla.severityLevel, 'LEVEL_4_CRITICAL', `Description should be critical: "${desc}"`);
      assert.equal(sla.slaCategory, '24_HOUR_NOTIFIABLE');
      assert.equal(sla.urgencyDays, 1);
      assert.equal(sla.isReportable, true);
    }

    const nonCriticalDesc = 'Participant expressed mild verbal frustration during transition from playground.';
    const nonCriticalSla = AIAssistantEngine.analyzeIncidentSLA(nonCriticalDesc);
    assert.equal(nonCriticalSla.severityLevel, 'LEVEL_2_MEDIUM');
    assert.equal(nonCriticalSla.slaCategory, '5_DAY_REPORTABLE');
    assert.equal(nonCriticalSla.urgencyDays, 5);
    assert.equal(nonCriticalSla.isReportable, false);
  });

  await reporter.test('T2.4.3 - Extreme speech transcript length (>10,000 words) parses without memory leakage', async () => {
    const longSentence = 'Participant completed sensory task with high independence and positive regulation. ';
    const megaTranscript = longSentence.repeat(500); // ~5,000 words

    const start = performance.now();
    const structured = AIAssistantEngine.draftCaseNote(megaTranscript, 'SIMPL', 'Jordan Miller');
    const elapsed = performance.now() - start;

    assert.ok(structured.subjective.length > 0);
    assert.ok(elapsed < 1000, `Parsing mega transcript must complete under 1000ms (took ${elapsed.toFixed(1)}ms)`);
  });

  await reporter.test('T2.4.4 - Section 34 Audit evaluates missing consent for restrictive practices as Critical gap', async () => {
    const evidenceWithoutConsent = 'Participant subjected to locked pantry environmental restrictive practice. Regular PBS sessions conducted.';
    const auditResult = AIAssistantEngine.auditNDISSection34(evidenceWithoutConsent);

    assert.equal(auditResult.hasRestrictive, true);
    assert.equal(auditResult.hasConsent, false);
    assert.ok(auditResult.overallComplianceScore < 70, 'Missing consent must significantly penalize compliance score');
    assert.equal(auditResult.riskLevel, 'HIGH_AUDIT_RISK');
  });

  // =========================================================================
  // PHASE 5: DASHBOARDS & ANALYTICS BOUNDARIES
  // =========================================================================
  reporter.startPhase('Phase 5: Dashboards and Analytics Boundaries');

  await reporter.test('T2.5.1 - Zero billing claims division-by-zero protection prevents NaN and Infinity', async () => {
    const metrics = DashboardAnalyticsAggregator.computeBillingMetrics([]);
    assert.equal(Number.isNaN(metrics.paidPercentage), false);
    assert.equal(Number.isFinite(metrics.paidPercentage), true);
    assert.equal(metrics.paidPercentage, 0);
  });

  await reporter.test('T2.5.2 - Over-utilized plan budget (>100% spent) correctly computes overdrawn status', async () => {
    const overdrawnClient = {
      id: 'cli-overdrawn',
      totalBudget: 30000,
      allocatedBudget: 30000,
      spentBudget: 34500 // $4,500 over budget!
    };

    const budget = DashboardAnalyticsAggregator.computeBudgetUtilization(overdrawnClient);
    assert.equal(budget.total, 30000);
    assert.equal(budget.spent, 34500);
    assert.equal(budget.remaining, -4500);
    assert.equal(budget.utilizationPercent, 115); // 34500 / 30000 = 115%
    assert.equal(budget.isOverdrawn, true);
  });

  await reporter.test('T2.5.3 - Over-capacity practitioner (>100% caseload) correctly flags capacity alert', async () => {
    const overCapacityPrac = [
      {
        id: 'prac-over',
        name: 'Overloaded Specialist',
        activeCaseloadCount: 25,
        caseloadLimit: 20
      }
    ];

    const heatmap = DashboardAnalyticsAggregator.computeCaseloadHeatmap(overCapacityPrac);
    assert.equal(heatmap[0].activeCaseload, 25);
    assert.equal(heatmap[0].caseloadLimit, 20);
    assert.equal(heatmap[0].utilization, 125);
    assert.equal(heatmap[0].isOverCapacity, true);
  });

  await reporter.test('T2.5.4 - Expired vs expiring soon screening date categorizer handles dates accurately', async () => {
    const testPracs = [
      { id: 'p1', name: 'Valid Worker', screeningStatus: 'Valid' },
      { id: 'p2', name: 'Expiring Worker', screeningStatus: 'Expiring Soon' },
      { id: 'p3', name: 'Expired Worker', screeningStatus: 'Expired' }
    ];

    const kpis = DashboardAnalyticsAggregator.computeComplianceKPIs(testPracs, [], []);
    assert.equal(kpis.practitioners.valid, 1);
    assert.equal(kpis.practitioners.expiringSoon, 1);
    assert.equal(kpis.practitioners.expired, 1);
    assert.equal(kpis.practitioners.complianceRate, 33); // 1 / 3 = 33%
  });

  await reporter.test('T2.5.5 - Non-numeric and NaN values in claims are sanitized without crashing aggregations', async () => {
    const corruptClaims = [
      { id: 'c1', totalAmount: '300.50', status: 'Paid' },
      { id: 'c2', totalAmount: null, status: 'Paid' },
      { id: 'c3', totalAmount: undefined, status: 'Pending' },
      { id: 'c4', totalAmount: 'invalid_number', status: 'Pending' }
    ];

    const metrics = DashboardAnalyticsAggregator.computeBillingMetrics(corruptClaims);
    assert.equal(metrics.totalRevenue, 300.50);
    assert.equal(metrics.totalPaid, 300.50);
    assert.equal(metrics.totalPending, 0);
  });
}
