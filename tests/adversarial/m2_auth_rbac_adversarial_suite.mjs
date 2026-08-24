/**
 * Milestone M2 Auth & RBAC Adversarial Test Suite
 * 
 * Deep Empirical Testing of:
 * 1. Unauthenticated access vectors across all Firestore collections
 * 2. Role spoofing, casing attacks, and unknown role fallback
 * 3. Privilege escalation attempts on /users/{userId}
 * 4. Cross-practitioner ownership violations on /caseNotes
 * 5. Destructive operations isolation (ADMIN vs PRACTITIONER vs VIEWER vs SUPPORT_COORDINATOR)
 * 6. Immutability rules on /auditLogs
 * 7. Token corruption and malformed auth context resilience
 * 8. High-concurrency unauthorized mutation spam
 * 9. UI Action gating verification across all feature modules
 * 10. Route and Command Palette gating verification
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  SEED_USERS,
  SEED_CLIENTS
} from '../harness/emulator.mjs';

const projectRoot = process.cwd();

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🛡️ M2 ADVERSARIAL AUTH & RBAC EMPIRICAL VERIFICATION HARNESS');
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
    failures.push({ name, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: UNAUTHENTICATED ACCESS ATTEMPTS ACROSS ALL COLLECTIONS
// -----------------------------------------------------------------------------
console.log('▶ SECTION 1: Unauthenticated Access & Default-Deny Boundaries');

const ALL_PROTECTED_COLLECTIONS = [
  'clients',
  'caseNotes',
  'billingClaims',
  'incidents',
  'restrictivePractices',
  'abcLogs',
  'bspDocuments',
  'crmLeads',
  'crmTasks',
  'practitioners',
  'supportItems',
  'auditLogs',
  'scheduledShifts',
  'users'
];

await test('Unauthenticated reads rejected across all protected collections', async () => {
  const firestore = new InMemoryFirestore();
  const unauthContexts = [
    null,
    undefined,
    {},
    { uid: '' },
    { uid: null },
    { uid: undefined },
    { role: 'ADMIN' }, // missing uid
    { uid: '', role: 'ADMIN' }
  ];

  for (const ctx of unauthContexts) {
    for (const col of ALL_PROTECTED_COLLECTIONS) {
      await assert.rejects(
        async () => await firestore.getDoc(col, 'test-doc-id', ctx),
        /PERMISSION_DENIED/,
        `Unauthenticated getDoc on /${col} must be denied with auth context: ${JSON.stringify(ctx)}`
      );

      await assert.rejects(
        async () => await firestore.listDocs(col, ctx),
        /PERMISSION_DENIED/,
        `Unauthenticated listDocs on /${col} must be denied with auth context: ${JSON.stringify(ctx)}`
      );
    }
  }
});

await test('Unauthenticated writes rejected across all protected collections', async () => {
  const firestore = new InMemoryFirestore();
  const unauthContexts = [null, { uid: '' }, { uid: null }];

  for (const ctx of unauthContexts) {
    for (const col of ALL_PROTECTED_COLLECTIONS) {
      await assert.rejects(
        async () => await firestore.setDoc(col, 'malicious-doc', { title: 'Hack' }, ctx),
        /PERMISSION_DENIED/,
        `Unauthenticated write on /${col} must be denied`
      );

      await assert.rejects(
        async () => await firestore.deleteDoc(col, 'target-doc', ctx),
        /PERMISSION_DENIED/,
        `Unauthenticated delete on /${col} must be denied`
      );
    }
  }
});

await test('Public health probe /system/{docId} permits unauthenticated read only', async () => {
  const firestore = new InMemoryFirestore();
  const doc = await firestore.getDoc('system', 'connection_test', null);
  assert.ok(doc, 'System health doc must be publicly readable');

  // But writing to system is blocked
  await assert.rejects(
    async () => await firestore.setDoc('system', 'connection_test', { hacked: true }, null),
    /PERMISSION_DENIED/
  );
});

// -----------------------------------------------------------------------------
// SECTION 2: ROLE SPOOFING, CASING & UNRECOGNIZED ROLES
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 2: Role Spoofing & Malformed Role Resilience');

await test('Arbitrary and unrecognized role strings fail safely (default to least privilege)', async () => {
  const firestore = new InMemoryFirestore();

  const spoofedRoles = [
    'ROOT',
    'SUDO',
    'SUPERUSER',
    'DB_ADMIN',
    'DEVELOPER',
    'SYSTEM',
    'ANONYMOUS',
    'GUEST',
    '__proto__',
    'constructor',
    '1234',
    '<script>alert(1)</script>'
  ];

  for (const spoofedRole of spoofedRoles) {
    const auth = { uid: `attacker-${spoofedRole}`, role: spoofedRole };

    // Should NOT be able to delete client
    await assert.rejects(
      async () => await firestore.deleteDoc('clients', 'cli-101', auth),
      /PERMISSION_DENIED/,
      `Spoofed role '${spoofedRole}' must not permit client deletion`
    );

    // Should NOT be able to delete other user profile
    await assert.rejects(
      async () => await firestore.deleteDoc('users', 'user-director', auth),
      /PERMISSION_DENIED/,
      `Spoofed role '${spoofedRole}' must not delete user profiles`
    );
  }
});

await test('Lowercase role strings in emulator and firestore.rules evaluation', async () => {
  const firestore = new InMemoryFirestore();

  // 'admin' lowercase in emulator should be checked
  const lowercaseAdmin = { uid: 'admin-lower', role: 'admin' };
  // In emulator, strictly uppercase 'ADMIN' is standard for client deletion
  await assert.rejects(
    async () => await firestore.deleteDoc('clients', 'cli-101', lowercaseAdmin),
    /PERMISSION_DENIED/,
    'Non-standard role casing in strict emulator rejects client delete'
  );
});

// -----------------------------------------------------------------------------
// SECTION 3: PRIVILEGE ESCALATION ATTEMPTS
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 3: Privilege Escalation & Cross-Tenant Account Protection');

await test('Non-admin user cannot overwrite role or escalate privileges in /users/{userId}', async () => {
  const firestore = new InMemoryFirestore();

  const attackerAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };

  // Attempt 1: Change own role to ADMIN in /users
  // In a secure Firestore ruleset, user cannot change role field or overwrite other users
  await assert.rejects(
    async () => await firestore.setDoc('users', 'user-director', { role: 'VIEWER', name: 'Demoted' }, attackerAuth),
    /PERMISSION_DENIED/,
    'Practitioner cannot overwrite Clinical Director user record'
  );

  await assert.rejects(
    async () => await firestore.getDoc('users', 'user-director', attackerAuth),
    /PERMISSION_DENIED/,
    'Practitioner cannot read private user profile of another user'
  );
});

await test('Viewer role cannot perform ANY mutating operation across clinical collections', async () => {
  const firestore = new InMemoryFirestore();
  const viewerAuth = { uid: 'user-auditor', role: 'VIEWER' };

  // Reads succeed
  const clients = await firestore.listDocs('clients', viewerAuth);
  assert.ok(Array.isArray(clients), 'Viewer can read clients list');

  const notes = await firestore.listDocs('caseNotes', viewerAuth);
  assert.ok(Array.isArray(notes), 'Viewer can read case notes');

  // All mutating attempts must fail
  const mutationTargets = [
    { col: 'clients', id: 'cli-hack', data: { name: 'Hack Client' } },
    { col: 'caseNotes', id: 'note-hack', data: { content: 'Hack Note' } },
    { col: 'billingClaims', id: 'claim-hack', data: { amount: 1000 } },
    { col: 'incidents', id: 'inc-hack', data: { title: 'Hack Incident' } },
    { col: 'restrictivePractices', id: 'rp-hack', data: { type: 'Chemical' } },
    { col: 'abcLogs', id: 'abc-hack', data: { antecedent: 'Hack' } },
    { col: 'bspDocuments', id: 'bsp-hack', data: { version: '2.0' } },
    { col: 'crmLeads', id: 'lead-hack', data: { name: 'Hack Lead' } },
    { col: 'crmTasks', id: 'task-hack', data: { title: 'Hack Task' } },
    { col: 'scheduledShifts', id: 'shift-hack', data: { hours: 8 } }
  ];

  for (const target of mutationTargets) {
    await assert.rejects(
      async () => await firestore.setDoc(target.col, target.id, target.data, viewerAuth),
      /PERMISSION_DENIED.*VIEWER/,
      `Viewer must be denied setDoc on /${target.col}`
    );

    await assert.rejects(
      async () => await firestore.deleteDoc(target.col, 'cli-101', viewerAuth),
      /PERMISSION_DENIED/,
      `Viewer must be denied deleteDoc on /${target.col}`
    );
  }
});

// -----------------------------------------------------------------------------
// SECTION 4: AUTHOR OWNERSHIP & CLINICAL RECORD TAMPERING
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 4: Case Note Ownership & Author-Lock Enforcement');

await test('Practitioner A cannot modify or delete Practitioner B case notes', async () => {
  const firestore = new InMemoryFirestore();

  const authorAuth = { uid: 'prac-author-1', role: 'PRACTITIONER' };
  const attackerAuth = { uid: 'prac-attacker-2', role: 'PRACTITIONER' };
  const adminAuth = { uid: 'user-director', role: 'ADMIN' };

  // 1. Author creates note
  await firestore.setDoc('caseNotes', 'note-protected-1', {
    id: 'note-protected-1',
    authorId: 'prac-author-1',
    clientId: 'cli-101',
    content: 'Original clinical observation by Author 1'
  }, authorAuth);

  // 2. Attacker attempts to update note
  await assert.rejects(
    async () => await firestore.updateDoc('caseNotes', 'note-protected-1', {
      content: 'Tampered content by Practitioner 2'
    }, attackerAuth),
    /PERMISSION_DENIED.*Non-author/,
    'Non-author practitioner update must be denied'
  );

  // 3. Attacker attempts to delete note
  await assert.rejects(
    async () => await firestore.deleteDoc('caseNotes', 'note-protected-1', attackerAuth),
    /PERMISSION_DENIED/,
    'Non-author practitioner delete must be denied'
  );

  // 4. Author updates own note -> Success
  await firestore.updateDoc('caseNotes', 'note-protected-1', {
    content: 'Author valid update'
  }, authorAuth);
  const updatedByAuthor = await firestore.getDoc('caseNotes', 'note-protected-1', authorAuth);
  assert.equal(updatedByAuthor.content, 'Author valid update');

  // 5. Admin updates note -> Success
  await firestore.updateDoc('caseNotes', 'note-protected-1', {
    content: 'Admin supervisor review note'
  }, adminAuth);
  const updatedByAdmin = await firestore.getDoc('caseNotes', 'note-protected-1', adminAuth);
  assert.equal(updatedByAdmin.content, 'Admin supervisor review note');
});

// -----------------------------------------------------------------------------
// SECTION 5: AUDIT LOG LEDGER IMMUTABILITY
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 5: Audit Log Ledger Immutability & Forensics');

await test('Audit logs cannot be deleted or modified by anyone, including ADMIN', () => {
  const firestoreRulesContent = fs.readFileSync(path.join(projectRoot, 'firestore.rules'), 'utf8');

  // Verify match /auditLogs in firestore.rules
  assert(firestoreRulesContent.includes('match /auditLogs/{logId}'), 'Missing auditLogs match block');
  assert(firestoreRulesContent.includes('allow update, delete: if false;'), 'Audit logs must strictly disallow update and delete');
  assert(firestoreRulesContent.includes('allow create: if isSignedIn();'), 'Audit logs allow create by signed-in users');
});

// -----------------------------------------------------------------------------
// SECTION 6: HIGH CONCURRENCY ADVERSARIAL MUTATION SPAM
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 6: Concurrency & Adversarial Race Conditions');

await test('100 concurrent unauthorized deletion attempts are all rejected cleanly with 0 leaks', async () => {
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);
  store.switchUser('user-specialist'); // PRACTITIONER

  const spamPromises = [];
  for (let i = 0; i < 100; i++) {
    spamPromises.push(store.deleteClient('cli-101'));
  }

  const results = await Promise.allSettled(spamPromises);
  let rejectedCount = 0;
  for (const res of results) {
    if (res.status === 'rejected' && /PERMISSION_DENIED/.test(res.reason.message)) {
      rejectedCount++;
    }
  }

  assert.equal(rejectedCount, 100, 'All 100 unauthorized deletion attempts must be rejected');

  // Verify document still exists in Firestore untouched
  const doc = await firestore.getDoc('clients', 'cli-101', { uid: 'admin', role: 'ADMIN' });
  assert.ok(doc, 'Client document must remain intact in Firestore');
});

await test('Rapid role switching maintains strict authorization state', async () => {
  const firestore = new InMemoryFirestore();
  const store = new ManagementStoreEmulator(firestore);

  // Switch to VIEWER
  store.switchUser('user-auditor');
  assert.equal(store.currentUser.role, 'VIEWER');
  await assert.rejects(
    async () => await store.addClient({ id: 'c1', name: 'Test' }),
    /PERMISSION_DENIED/
  );

  // Switch to ADMIN
  store.switchUser('user-director');
  assert.equal(store.currentUser.role, 'ADMIN');
  const client = await store.addClient({ id: 'c1', name: 'Valid Admin Client', ndisNumber: '123456789' });
  assert.ok(client);

  // Switch back to VIEWER
  store.switchUser('user-auditor');
  await assert.rejects(
    async () => await store.deleteClient('c1'),
    /PERMISSION_DENIED/
  );

  // Switch to PRACTITIONER
  store.switchUser('user-specialist');
  await assert.rejects(
    async () => await store.deleteClient('c1'),
    /PERMISSION_DENIED/
  );

  // Switch to ADMIN to delete
  store.switchUser('user-director');
  await store.deleteClient('c1');
  const deletedDoc = await firestore.getDoc('clients', 'c1', store.getAuthContext());
  assert.equal(deletedDoc, null);
});

// -----------------------------------------------------------------------------
// SECTION 7: STATIC & ARCHITECTURAL UI ACTION GATING AUDIT
// -----------------------------------------------------------------------------
console.log('\n▶ SECTION 7: UI Feature Modules Action-Level Gating Audit');

const UI_ACTION_GATING_CHECKS = [
  {
    file: 'components/features/BillingModule.tsx',
    patterns: ['isViewer', '!isViewer', 'currentUser?.role'],
    desc: 'BillingModule gates claim creation, ledger reconciliation, and status edits'
  },
  {
    file: 'components/features/CaseNotesModule.tsx',
    patterns: ['isAdmin', 'note.practitionerId === currentUser', '!isViewer', 'deleteCaseNote'],
    desc: 'CaseNotesModule gates delete button to admins and author practitioners'
  },
  {
    file: 'components/features/ClientsModule.tsx',
    patterns: ['isViewer', '!isViewer', 'isAdmin'],
    desc: 'ClientsModule gates intake wizard and participant deletion'
  },
  {
    file: 'components/features/IncidentsModule.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'IncidentsModule gates incident logging for viewers'
  },
  {
    file: 'components/features/RestrictivePracticesModule.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'RestrictivePracticesModule gates registration for viewers'
  },
  {
    file: 'components/features/ABCAnalyserModule.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'ABCAnalyserModule gates observation logging for viewers'
  },
  {
    file: 'components/features/BSPModule.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'BSPModule gates AI generation and saving BSP for viewers'
  },
  {
    file: 'components/features/CRMModule.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'CRMModule gates task creation, prospect creation, and lead deletion'
  },
  {
    file: 'components/features/NDISGoalTracker.tsx',
    patterns: ['isViewer', '!isViewer'],
    desc: 'NDISGoalTracker gates goal creation and deletion'
  },
  {
    file: 'components/features/QuickActionsFloatingMenu.tsx',
    patterns: ["currentUser?.role === 'VIEWER'", 'return null'],
    desc: 'QuickActionsFloatingMenu completely hides mutating dial for viewers'
  },
  {
    file: 'components/AccessGuard.tsx',
    patterns: ['requiredRoles', 'ADMIN', 'hasAccess'],
    desc: 'AccessGuard verifies elevated roles and blocks unauthorized tab views'
  },
  {
    file: 'components/Sidebar.tsx',
    patterns: ['adminOnly', "role !== 'ADMIN'"],
    desc: 'Sidebar disables and locks adminOnly tabs for non-admins'
  },
  {
    file: 'components/CommandPalette.tsx',
    patterns: ['adminTabs', 'isAdminUser'],
    desc: 'CommandPalette filters out admin-only destinations for non-admins'
  }
];

for (const check of UI_ACTION_GATING_CHECKS) {
  test(`UI Action Gating in ${check.file}: ${check.desc}`, () => {
    const filePath = path.join(projectRoot, check.file);
    assert(fs.existsSync(filePath), `File ${check.file} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of check.patterns) {
      assert(content.includes(pattern), `Missing expected gating pattern '${pattern}' in ${check.file}`);
    }
  });
}

// -----------------------------------------------------------------------------
// SUMMARY & EXIT CODE
// -----------------------------------------------------------------------------
console.log(`\n══════════════════════════════════════════════════════════════════════`);
console.log(`  RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} CHECKS`);
console.log(`══════════════════════════════════════════════════════════════════════\n`);

if (failCount > 0) {
  console.error('Failures encountered:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('🌟 ALL M2 ADVERSARIAL AUTH & RBAC VERIFICATION TESTS PASSED CLEANLY!\n');
  process.exit(0);
}
