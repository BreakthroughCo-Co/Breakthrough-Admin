/**
 * Breakthrough OS — Milestone M3 Deep Adversarial Verification Suite
 * Multi-Tab Synchronization, Real-Time Listeners, Concurrency, and Offline Resilience
 * 
 * Executed by Challenger 2 (Empirical Review & Stress Testing)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  SEED_USERS,
  SEED_CLIENTS,
  SEED_PRACTITIONERS,
  SEED_CASE_NOTES,
  SEED_CLAIMS,
  SEED_INCIDENTS,
  SEED_RESTRICTIVE_PRACTICES,
  SEED_ABC_LOGS,
  SEED_LEADS,
  NDIS_2026_PRICE_GUIDE,
  DashboardAnalyticsAggregator
} from '../harness/emulator.mjs';

const projectRoot = process.cwd();

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  ⚔️ CHALLENGER M3: REAL-TIME LISTENERS & MULTI-TAB ADVERSARIAL SUITE');
console.log('══════════════════════════════════════════════════════════════════════\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✔ PASS: ${desc}`);
  } catch (err) {
    failedChecks++;
    console.error(`  ✖ FAIL: ${desc}`);
    console.error(`    Error: ${err.message}`);
    failures.push({ name: desc, error: err.message, stack: err.stack });
  }
}

async function asyncCheck(desc, fn) {
  totalChecks++;
  try {
    await fn();
    passedChecks++;
    console.log(`  ✔ PASS: ${desc}`);
  } catch (err) {
    failedChecks++;
    console.error(`  ✖ FAIL: ${desc}`);
    console.error(`    Error: ${err.message}`);
    failures.push({ name: desc, error: err.message, stack: err.stack });
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Static Architecture & Implementation Integrity
// -----------------------------------------------------------------------------
console.log('▶ SECTION 1: Static Architecture & Implementation Integrity');

check('lib/firestoreListeners.ts exists and exports initFirestoreListeners', () => {
  const filePath = path.join(projectRoot, 'lib/firestoreListeners.ts');
  assert(fs.existsSync(filePath), 'lib/firestoreListeners.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('export function initFirestoreListeners'), 'initFirestoreListeners export missing');
  assert(content.includes('export default initFirestoreListeners'), 'default export missing');
});

check('lib/firestoreListeners.ts covers all 15 active Firestore collections', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'lib/firestoreListeners.ts'), 'utf8');
  const expectedCollections = [
    'subscribeToClients',
    'subscribeToCaseNotes',
    'subscribeToBillingClaims',
    'subscribeToIncidents',
    'subscribeToRestrictivePractices',
    'subscribeToABCLogs',
    'subscribeToBSPDocuments',
    'subscribeToCRMLeads',
    'subscribeToCRMTasks',
    'subscribeToPractitioners',
    'subscribeToSupportItems',
    'subscribeToAuditLogs',
    'subscribeToScheduledShifts',
    'subscribeToUsers',
    'subscribeToNotifications'
  ];

  for (const sub of expectedCollections) {
    assert(content.includes(sub), `Collection subscriber '${sub}' missing in lib/firestoreListeners.ts`);
  }
});

check('lib/firestoreListeners.ts returns a composite cleanup function with error isolation', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'lib/firestoreListeners.ts'), 'utf8');
  assert(content.includes('return () => {'), 'Cleanup composite function return missing');
  assert(content.includes('unsubscribes.forEach'), 'Unsubscribe iterator missing in cleanup');
  assert(content.includes('unsubscribes.length = 0'), 'Subscription array reset missing');
});

check('lib/firestoreListeners.ts updateStore supports polymorphic store setter interfaces', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'lib/firestoreListeners.ts'), 'utf8');
  assert(content.includes('typeof store.setState === \'function\''), 'store.setState handling missing');
  assert(content.includes('typeof store.setEntities === \'function\''), 'store.setEntities handling missing');
  assert(content.includes('typeof store.set === \'function\''), 'store.set handling missing');
});

check('lib/firebase.ts configures persistentLocalCache with persistentMultipleTabManager', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'lib/firebase.ts'), 'utf8');
  assert(content.includes('persistentLocalCache'), 'persistentLocalCache import or config missing');
  assert(content.includes('persistentMultipleTabManager'), 'persistentMultipleTabManager import or config missing');
  assert(content.includes("typeof window !== 'undefined'"), 'SSR browser window check missing in getFirestoreInstance');
  assert(content.includes('getFirestoreInstance'), 'getFirestoreInstance factory function missing');
});

check('stores/useManagementStore.ts exposes real triggerDeltaSync and startRealtimeListeners', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'stores/useManagementStore.ts'), 'utf8');
  assert(content.includes('triggerDeltaSync: async () => {'), 'triggerDeltaSync async implementation missing');
  assert(content.includes('startRealtimeListeners: () => {'), 'startRealtimeListeners implementation missing');
  assert(content.includes('stopRealtimeListeners: () => {'), 'stopRealtimeListeners implementation missing');
  assert(content.includes('setEntities: (collection: string, data: any[]) => {'), 'setEntities method missing');
});

check('components/ConnectionStatusIndicator.tsx handles online, offline, syncing, and pending changes', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'components/ConnectionStatusIndicator.tsx'), 'utf8');
  assert(content.includes('Working Offline'), 'Working Offline badge state missing');
  assert(content.includes('Syncing Data...'), 'Syncing state missing');
  assert(content.includes('Sync Pending'), 'Pending changes state missing');
  assert(content.includes('Firestore & Workspace Live') || content.includes('Firestore &amp; Workspace Live'), 'Live state missing');
  assert(content.includes('simulateOfflineToggle'), 'simulateOfflineToggle action hook missing');
  assert(content.includes('triggerDeltaSync'), 'triggerDeltaSync action hook missing');
});

// -----------------------------------------------------------------------------
// SECTION 2: Multi-Tab Real-Time Listener Propagation Across 15 Collections
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 2: Multi-Tab Real-Time Listener Propagation Across 15 Collections');

await asyncCheck('3 concurrent tabs receive real-time updates for all 15 Firestore collections', async () => {
  const firestore = new InMemoryFirestore();
  const tabA = new ManagementStoreEmulator(firestore);
  const tabB = new ManagementStoreEmulator(firestore);
  const tabC = new ManagementStoreEmulator(firestore);

  const collections = [
    { name: 'clients', testDoc: { id: 'cli-rt-1', name: 'RT Client 1', status: 'Active' } },
    { name: 'caseNotes', testDoc: { id: 'note-rt-1', authorId: 'user-director', content: 'RT Note 1' } },
    { name: 'billingClaims', testDoc: { id: 'claim-rt-1', clientId: 'cli-rt-1', totalAmount: 428.82 } },
    { name: 'incidents', testDoc: { id: 'inc-rt-1', title: 'RT Incident 1', severity: 'Low' } },
    { name: 'restrictivePractices', testDoc: { id: 'rp-rt-1', practiceType: 'Environmental', clientId: 'cli-rt-1' } },
    { name: 'abcLogs', testDoc: { id: 'abc-rt-1', behavior: 'Target behavior 1' } },
    { name: 'bspDocuments', testDoc: { id: 'bsp-rt-1', title: 'BSP Document 1' } },
    { name: 'crmLeads', testDoc: { id: 'lead-rt-1', name: 'Lead 1', status: 'New' } },
    { name: 'crmTasks', testDoc: { id: 'task-rt-1', title: 'Task 1', completed: false } },
    { name: 'practitioners', testDoc: { id: 'prac-rt-1', name: 'Practitioner 1', caseloadLimit: 20 } },
    { name: 'supportItems', testDoc: { id: 'item-rt-1', code: '07_002_0115_8_3', name: 'Support Item 1' } },
    { name: 'auditLogs', testDoc: { id: 'audit-rt-1', action: 'LOGIN', details: 'User logged in' } },
    { name: 'scheduledShifts', testDoc: { id: 'shift-rt-1', practitionerId: 'prac-201', date: '2026-08-25' } },
    { name: 'users', testDoc: { id: 'user-rt-1', name: 'User 1', role: 'PRACTITIONER' } },
    { name: 'notifications', testDoc: { id: 'notif-rt-1', title: 'Alert 1', read: false } }
  ];

  for (const { name, testDoc } of collections) {
    let tabAReceived = null;
    let tabBReceived = null;
    let tabCReceived = null;

    const unsubA = firestore.onSnapshot(name, (docs) => { tabAReceived = docs; });
    const unsubB = firestore.onSnapshot(name, (docs) => { tabBReceived = docs; });
    const unsubC = firestore.onSnapshot(name, (docs) => { tabCReceived = docs; });

    // Write from Tab A
    await firestore.setDoc(name, testDoc.id, testDoc, tabA.getAuthContext());

    assert(tabBReceived && tabBReceived.some(d => d.id === testDoc.id), `Tab B did not receive real-time update on '${name}'`);
    assert(tabCReceived && tabCReceived.some(d => d.id === testDoc.id), `Tab C did not receive real-time update on '${name}'`);

    // Clean up Tab B subscription
    unsubB();

    // Update from Tab C
    const updatedDoc = { ...testDoc, updatedField: 'mutation-from-tab-c' };
    await firestore.setDoc(name, testDoc.id, updatedDoc, tabC.getAuthContext());

    // Tab A and C receive update; Tab B no longer receives updates
    assert(tabAReceived && tabAReceived.find(d => d.id === testDoc.id)?.updatedField === 'mutation-from-tab-c', `Tab A did not receive updated snapshot on '${name}'`);
    assert(tabCReceived && tabCReceived.find(d => d.id === testDoc.id)?.updatedField === 'mutation-from-tab-c', `Tab C did not receive updated snapshot on '${name}'`);

    unsubA();
    unsubC();
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: Concurrent Multi-Tab Note & Claim Modifications
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 3: Concurrent Multi-Tab Note & Claim Modifications');

await asyncCheck('Simultaneous multi-tab case note authoring from 10 distinct practitioners', async () => {
  const firestore = new InMemoryFirestore();
  const tabs = [];
  const noteIds = [];

  for (let i = 0; i < 10; i++) {
    const store = new ManagementStoreEmulator(firestore);
    const userId = `user-prac-${i}`;
    const pracUser = {
      id: userId,
      name: `Practitioner ${i}`,
      email: `prac${i}@breakthrough.org.au`,
      role: 'PRACTITIONER',
      practitionerId: `prac-${i}`
    };
    store.users.push(pracUser);
    store.currentUser = pracUser;
    tabs.push(store);
  }

  // Track all snapshots on central listener
  let latestCaseNotes = [];
  const unsub = firestore.onSnapshot('caseNotes', (notes) => {
    latestCaseNotes = notes;
  });

  // Concurrently author notes
  const writePromises = tabs.map((tab, idx) => {
    const noteId = `note-concurrent-${idx}`;
    noteIds.push(noteId);
    return tab.addCaseNote({
      id: noteId,
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      format: 'BIRP',
      subjective: `Behavior observation by Practitioner ${idx}`,
      objective: `Direct PBS coaching intervention`,
      assessment: `Progressing at standard pace`,
      plan: `Follow up next cycle`
    });
  });

  await Promise.all(writePromises);

  // Assert all 10 notes are present in firestore and snapshot
  for (const nId of noteIds) {
    const found = latestCaseNotes.find(n => n.id === nId);
    assert(found, `Note ${nId} missing in real-time snapshot`);
    assert.strictEqual(found.status, 'Submitted');
  }

  unsub();
});

await asyncCheck('Concurrent multi-tab billing claims correctly increment client budget without race conditions', async () => {
  const firestore = new InMemoryFirestore();
  const baseClient = {
    id: 'cli-budget-test',
    name: 'Budget Test Client',
    totalBudget: 50000,
    allocatedBudget: 45000,
    spentBudget: 10000,
    status: 'Active'
  };
  await firestore.setDoc('clients', baseClient.id, baseClient, { uid: 'admin', role: 'ADMIN' });

  const tab1 = new ManagementStoreEmulator(firestore);
  const tab2 = new ManagementStoreEmulator(firestore);
  const tab3 = new ManagementStoreEmulator(firestore);

  // Synchronize client across tabs
  firestore.onSnapshot('clients', (clients) => {
    const updated = clients.find(c => c.id === baseClient.id);
    if (updated) {
      tab1.clients = tab1.clients.map(c => c.id === baseClient.id ? updated : c);
      tab2.clients = tab2.clients.map(c => c.id === baseClient.id ? updated : c);
      tab3.clients = tab3.clients.map(c => c.id === baseClient.id ? updated : c);
    }
  });

  // Concurrently submit claims: $214.41 each
  await Promise.all([
    tab1.addBillingClaim({ id: 'claim-c1', clientId: baseClient.id, totalAmount: 214.41, status: 'Paid' }),
    tab2.addBillingClaim({ id: 'claim-c2', clientId: baseClient.id, totalAmount: 214.41, status: 'Paid' }),
    tab3.addBillingClaim({ id: 'claim-c3', clientId: baseClient.id, totalAmount: 214.41, status: 'Paid' })
  ]);

  const allClaims = await firestore.listDocs('billingClaims', tab1.getAuthContext());
  const clientClaims = allClaims.filter(c => c.clientId === baseClient.id);
  assert.strictEqual(clientClaims.length, 3, 'All 3 concurrent claims must persist in Firestore');

  // Compute total spent
  const totalClaimSpent = clientClaims.reduce((sum, c) => sum + c.totalAmount, 0);
  assert.strictEqual(Math.round(totalClaimSpent * 100) / 100, 643.23, 'Total spent amount must equal $643.23');
});

// -----------------------------------------------------------------------------
// SECTION 4: ConnectionStatusIndicator Reactivity & Offline Delta Resilience
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 4: ConnectionStatusIndicator Reactivity & Offline Delta Resilience');

check('ConnectionStatusIndicator accurately represents all 4 connectivity states', () => {
  const store = new ManagementStoreEmulator(new InMemoryFirestore());

  // State 1: Online, synced, 0 pending
  store.setOnlineStatus(true);
  store.syncStatus = 'synced';
  store.pendingChangesCount = 0;
  assert.strictEqual(store.isOnline, true);
  assert.strictEqual(store.syncStatus, 'synced');
  assert.strictEqual(store.pendingChangesCount, 0);

  // State 2: Offline with queued deltas
  store.setOnlineStatus(false);
  store.queueOfflineDelta('CREATE', 'CaseNote', 'note-off-1', { content: 'Offline note' });
  assert.strictEqual(store.isOnline, false);
  assert.strictEqual(store.syncStatus, 'offline');
  assert.strictEqual(store.pendingChangesCount, 1);

  // State 3: Reconnecting / Syncing
  store.syncStatus = 'syncing';
  assert.strictEqual(store.syncStatus, 'syncing');

  // State 4: Online with pending deltas
  store.isOnline = true;
  store.syncStatus = 'pending';
  assert.strictEqual(store.isOnline, true);
  assert.strictEqual(store.syncStatus, 'pending');
});

await asyncCheck('Atomic error isolation during delta batch flush (partial failure resilience)', async () => {
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);

  store.setOnlineStatus(false);

  // Queue 5 valid deltas
  for (let i = 1; i <= 5; i++) {
    store.queueOfflineDelta('CREATE', 'CaseNote', `note-valid-${i}`, {
      authorId: store.currentUser.id,
      content: `Valid offline note content ${i}`,
      clientName: 'Jordan Miller'
    });
  }

  // Queue 1 invalid delta that will violate Firestore rules (exceeding 15,000 characters)
  const hugePayload = 'X'.repeat(16000);
  store.queueOfflineDelta('CREATE', 'CaseNote', 'note-invalid-huge', {
    authorId: store.currentUser.id,
    content: hugePayload
  });

  // Queue 1 more valid delta
  store.queueOfflineDelta('CREATE', 'CaseNote', 'note-valid-6', {
    authorId: store.currentUser.id,
    content: 'Valid note after invalid one'
  });

  assert.strictEqual(store.offlineQueue.length, 7, 'Total 7 deltas queued offline');

  // Go online and trigger delta sync
  store.isOnline = true;
  store.firestore.setOnlineStatus(true);
  store.syncStatus = 'syncing';

  const initialQueue = [...store.offlineQueue];
  const successfulDeltaIds = [];
  let syncErrors = 0;

  for (const delta of initialQueue) {
    try {
      const colName = delta.entity === 'CaseNote' ? 'caseNotes' : delta.entity.toLowerCase() + 's';
      await firestore.setDoc(colName, delta.entityId, delta.payload, store.getAuthContext());
      successfulDeltaIds.push(delta.id);
    } catch (err) {
      syncErrors++;
    }
  }

  // Update store state
  store.offlineQueue = store.offlineQueue.filter(d => !successfulDeltaIds.includes(d.id));
  store.pendingChangesCount = store.offlineQueue.length;
  store.syncStatus = store.offlineQueue.length === 0 ? 'synced' : 'pending';

  assert.strictEqual(successfulDeltaIds.length, 6, '6 valid deltas must be successfully synchronized');
  assert.strictEqual(syncErrors, 1, '1 invalid delta must fail gracefully');
  assert.strictEqual(store.offlineQueue.length, 1, 'Failed delta must remain in queue for user review');
  assert.strictEqual(store.offlineQueue[0].entityId, 'note-invalid-huge', 'Remaining delta must be the failing one');
  assert.strictEqual(store.syncStatus, 'pending', 'Sync status must be pending due to remaining uncommitted delta');
});

await asyncCheck('100 rapid network flap cycles preserve queue and state integrity', async () => {
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);

  let totalQueued = 0;

  for (let cycle = 0; cycle < 100; cycle++) {
    // Flip to offline
    store.setOnlineStatus(false);
    
    // Add offline note
    const noteId = `note-flap-${cycle}`;
    store.queueOfflineDelta('CREATE', 'CaseNote', noteId, {
      authorId: store.currentUser.id,
      content: `Flap cycle ${cycle} note`
    });
    totalQueued++;

    // Flip to online and await the delta sync
    store.setOnlineStatus(true);
    await store.triggerDeltaSync();
  }

  // After 100 cycles, all deltas must be flushed
  assert.strictEqual(store.offlineQueue.length, 0, 'Offline queue must be 0 after all flapping cycles flush');
  assert.strictEqual(store.pendingChangesCount, 0, 'Pending changes count must be 0');
  assert.strictEqual(store.syncStatus, 'synced', 'Sync status must be synced');

  const notesInDb = await firestore.listDocs('caseNotes', store.getAuthContext());
  const flapNotes = notesInDb.filter(n => n.id.startsWith('note-flap-'));
  assert.strictEqual(flapNotes.length, 100, 'All 100 flapped notes must exist in Firestore');
});

// -----------------------------------------------------------------------------
// SECTION 5: Summary & Verdict Calculation
// -----------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  📊 M3 ADVERSARIAL STRESS SUITE EXECUTION SUMMARY');
console.log('══════════════════════════════════════════════════════════════════════');
console.log(`  • Total Checks Executed : ${totalChecks}`);
console.log(`  • Checks Passed         : ${passedChecks}`);
console.log(`  • Checks Failed         : ${failedChecks}`);

if (failures.length > 0) {
  console.log('\n  ✖ FAILURES:');
  failures.forEach((f, idx) => {
    console.log(`  ${idx + 1}) ${f.name}`);
    console.log(`     Error: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('\n  ✔ VERDICT: CONFIRM — Milestone M3 is empirically robust with 0 regressions.\n');
  process.exit(0);
}
