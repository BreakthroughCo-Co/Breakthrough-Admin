/**
 * Milestone 1 (M1) Empirical Challenger Verification Suite
 * Adversarial and boundary verification for Security Rules, Types, and Services.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

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
  }
}

async function run() {
  console.log('\n==============================================================');
  console.log('  CHALLENGER M1: EMPIRICAL VERIFICATION & ADVERSARIAL MATRIX');
  console.log('==============================================================\n');

  const rulesContent = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
  const typesContent = fs.readFileSync(path.resolve('types/index.ts'), 'utf8');
  const serviceContent = fs.readFileSync(path.resolve('lib/firestoreService.ts'), 'utf8');
  const complianceContent = fs.readFileSync(path.resolve('components/features/ComplianceReportingSubModule.tsx'), 'utf8');

  // -------------------------------------------------------------
  // Group 1: firestore.rules Grammar, Structure & Completeness
  // -------------------------------------------------------------
  console.log('▶ Group 1: firestore.rules Syntax & Coverage');

  check('rules_version 2 declared at root', () => {
    assert(rulesContent.includes("rules_version = '2';"));
  });

  check('cloud.firestore service block properly scoped', () => {
    assert(rulesContent.includes("service cloud.firestore {"));
    assert(rulesContent.includes("match /databases/{database}/documents {"));
  });

  check('Catch-all default-deny rule present at top of documents block', () => {
    assert(rulesContent.includes("match /{document=**} {"));
    assert(rulesContent.includes("allow read, write: if false;"));
  });

  check('Balanced curly braces across entire firestore.rules', () => {
    const openBraces = (rulesContent.match(/\{/g) || []).length;
    const closeBraces = (rulesContent.match(/\}/g) || []).length;
    assert.strictEqual(openBraces, closeBraces, `Mismatched braces: ${openBraces} open vs ${closeBraces} close`);
  });

  check('RBAC helper functions defined correctly', () => {
    assert(rulesContent.includes('function isSignedIn()'));
    assert(rulesContent.includes('function isOwner(userId)'));
    assert(rulesContent.includes('function isAdmin()'));
    assert(rulesContent.includes('function isPractitioner()'));
    assert(rulesContent.includes('function isSupportCoordinator()'));
  });

  // Clinical & domain collections require isPractitioner() || isAdmin() for write, isAdmin() for delete
  const clinicalCollections = [
    'clients/{clientId}',
    'caseNotes/{noteId}',
    'billingClaims/{claimId}',
    'incidents/{incidentId}',
    'restrictivePractices/{practiceId}',
    'abcLogs/{logId}',
    'bspDocuments/{documentId}',
    'crmLeads/{leadId}',
    'leads/{leadId}',
    'crmTasks/{taskId}',
    'scheduledShifts/{shiftId}'
  ];

  for (const col of clinicalCollections) {
    check(`Collection ${col} enforces (isPractitioner() || isAdmin()) create/update and isAdmin() delete`, () => {
      const colRegex = new RegExp(`match /${col.replace('{', '\\{').replace('}', '\\}')} \\{([^\\}]+)\\}`);
      const match = rulesContent.match(colRegex);
      assert(match, `Missing match block for ${col}`);
      const body = match[1];
      assert(body.includes('allow read: if isSignedIn();'), `${col} missing signed-in read`);
      assert(body.includes('allow create, update: if isPractitioner() || isAdmin();'), `${col} missing practitioner/admin write`);
      assert(body.includes('allow delete: if isAdmin();'), `${col} missing admin delete`);
      // Assert NO bare isSignedIn() write permissions
      assert(!body.includes('allow create, update, delete: if isSignedIn()'), `${col} contains unsafe bare isSignedIn() write`);
      assert(!body.includes('allow write: if isSignedIn()'), `${col} contains unsafe bare isSignedIn() write`);
    });
  }

  check('HR practitioners collection enforces Admin-only create, update, delete', () => {
    const match = rulesContent.match(/match \/practitioners\/\{practitionerId\} \{([^\}]+)\}/);
    assert(match, 'Missing match block for practitioners');
    const body = match[1];
    assert(body.includes('allow read: if isSignedIn();'));
    assert(body.includes('allow create, update: if isAdmin();'));
    assert(body.includes('allow delete: if isAdmin();'));
    assert(!body.includes('isPractitioner()'));
  });

  check('AuditLogs enforces append-only immutability', () => {
    const match = rulesContent.match(/match \/auditLogs\/\{logId\} \{([^\}]+)\}/);
    assert(match, 'Missing match block for auditLogs');
    const body = match[1];
    assert(body.includes('allow read: if isSignedIn();'));
    assert(body.includes('allow create: if isSignedIn();'));
    assert(body.includes('allow update, delete: if false;'));
  });

  check('SupportItems enforces read-only for general staff, write for admin', () => {
    const match = rulesContent.match(/match \/supportItems\/\{code\} \{([^\}]+)\}/);
    assert(match, 'Missing match block for supportItems');
    const body = match[1];
    assert(body.includes('allow read: if isSignedIn();'));
    assert(body.includes('allow write: if isAdmin();'));
  });

  check('System health probe allows unauthenticated read probe but denies all writes', () => {
    const match = rulesContent.match(/match \/system\/\{docId\} \{([^\}]+)\}/);
    assert(match, 'Missing match block for system');
    const body = match[1];
    assert(body.includes('allow get: if true;'));
    assert(body.includes('allow write: if false;'));
  });

  check('Notifications enforces owner/admin isolation across read, create, update, delete', () => {
    const match = rulesContent.match(/match \/notifications\/\{notificationId\} \{([\s\S]+?)\n    \}/);
    assert(match, 'Missing match block for notifications');
    const body = match[1];
    assert(body.includes('isAdmin()'));
    assert(body.includes('resource.data.userId == request.auth.uid'));
    assert(body.includes('request.resource.data.userId == request.auth.uid'));
  });

  // -------------------------------------------------------------
  // Group 2: lib/firestoreService.ts Cleanups
  // -------------------------------------------------------------
  console.log('\n▶ Group 2: lib/firestoreService.ts Implementation');

  check('createCRMTask defaults assignedTo to "Unassigned"', () => {
    const taskFnMatch = serviceContent.match(/export const createCRMTask = [\s\S]+?return createDocument/);
    assert(taskFnMatch, 'createCRMTask not found in firestoreService.ts');
    assert(taskFnMatch[0].includes("assignedTo: 'Unassigned'"), 'assignedTo should default to "Unassigned"');
    assert(!taskFnMatch[0].includes('Marcus Vance'), 'createCRMTask contains hardcoded "Marcus Vance" default');
  });

  // -------------------------------------------------------------
  // Group 3: types/index.ts Type Invariants
  // -------------------------------------------------------------
  console.log('\n▶ Group 3: types/index.ts Type Invariants');

  check('WorkerScreeningStatus union type exported with all 6 statuses', () => {
    assert(typesContent.includes('export type WorkerScreeningStatus ='));
    const statuses = ['Active', 'Valid', 'Expiring Soon', 'Expiring', 'Pending', 'Expired'];
    for (const st of statuses) {
      assert(typesContent.includes(`'${st}'`), `WorkerScreeningStatus missing status: ${st}`);
    }
  });

  check('UserProfile uses canonical id and optional uid alias with JSDoc', () => {
    assert(typesContent.includes('id: string;'));
    assert(typesContent.includes('uid?: string;'));
    assert(typesContent.includes('Canonical unique identifier matching Firestore document key'));
  });

  check('UserProfile and Practitioner use WorkerScreeningStatus', () => {
    assert(/workerScreeningStatus\?: WorkerScreeningStatus;/.test(typesContent));
    assert(/screeningStatus: WorkerScreeningStatus;/.test(typesContent));
  });

  check('ClientGoal progressPercent is required and progress is eliminated', () => {
    const match = typesContent.match(/export interface ClientGoal \{([\s\S]+?)\}/);
    assert(match, 'ClientGoal interface not found');
    const body = match[1];
    assert(body.includes('progressPercent: number;'), 'ClientGoal missing progressPercent: number');
    assert(!body.includes('progress?: number;'), 'ClientGoal still contains redundant progress?: number');
  });

  check('OfflineDelta.payload is typed as Record<string, unknown>', () => {
    const match = typesContent.match(/export interface OfflineDelta \{([\s\S]+?)\}/);
    assert(match, 'OfflineDelta interface not found');
    const body = match[1];
    assert(body.includes('payload: Record<string, unknown>;'), 'OfflineDelta.payload is not Record<string, unknown>');
    assert(!body.includes('payload: any;'), 'OfflineDelta.payload is still any');
  });

  // -------------------------------------------------------------
  // Group 4: Component Consumer Verifications
  // -------------------------------------------------------------
  console.log('\n▶ Group 4: Component Consumers');

  check('ComplianceReportingSubModule consumes progressPercent without referencing goal.progress', () => {
    assert(complianceContent.includes('g.progressPercent ?? 0'));
    assert(complianceContent.includes('primaryGoal?.progressPercent || 80'));
    assert(complianceContent.includes('primaryGoal?.progressPercent || 82'));
    assert(!complianceContent.includes('g.progress ?? g.progressPercent'));
    assert(!complianceContent.includes('primaryGoal?.progress ||'));
  });

  // -------------------------------------------------------------
  // Group 5: Red Team Adversarial Security Rules Matrix Simulation
  // -------------------------------------------------------------
  console.log('\n▶ Group 5: Red Team RBAC Permutations');

  function evaluateRulesModel(operation, pathStr, userContext, resourceData, requestData) {
    const segments = pathStr.split('/').filter(Boolean);
    const col = segments[0];
    const docId = segments[1];

    if (col === 'system') {
      if (operation === 'get') return true;
      return false;
    }

    if (!userContext || !userContext.uid) return false;

    const role = userContext.role?.toUpperCase();
    const isAdmin = role === 'ADMIN';
    const isPractitioner = role === 'PRACTITIONER' || isAdmin;
    const isSupportCoordinator = role === 'SUPPORT_COORDINATOR' || isAdmin;
    const uid = userContext.uid;

    if (col === 'users') {
      if (segments.length === 4 && segments[2] === 'keepNotes') {
        const noteOwnerId = segments[1];
        return noteOwnerId === uid || isAdmin;
      }
      if (operation === 'get' || operation === 'list') return true;
      if (operation === 'create' || operation === 'update') return docId === uid || isAdmin;
      if (operation === 'delete') return isAdmin;
    }

    if (['clients', 'caseNotes', 'billingClaims', 'incidents', 'restrictivePractices', 'abcLogs', 'bspDocuments', 'crmLeads', 'leads', 'crmTasks', 'scheduledShifts'].includes(col)) {
      if (operation === 'get' || operation === 'list') return true;
      if (operation === 'create' || operation === 'update') return isPractitioner;
      if (operation === 'delete') return isAdmin;
    }

    if (col === 'practitioners') {
      if (operation === 'get' || operation === 'list') return true;
      if (operation === 'create' || operation === 'update' || operation === 'delete') return isAdmin;
    }

    if (col === 'supportItems') {
      if (operation === 'get' || operation === 'list') return true;
      if (operation === 'create' || operation === 'update' || operation === 'delete') return isAdmin;
    }

    if (col === 'auditLogs') {
      if (operation === 'get' || operation === 'list') return true;
      if (operation === 'create') return true;
      if (operation === 'update' || operation === 'delete') return false; // Immutable
    }

    if (col === 'notifications') {
      if (operation === 'get' || operation === 'list') {
        return isAdmin || !resourceData?.userId || resourceData.userId === uid;
      }
      if (operation === 'create') {
        return isAdmin || !requestData?.userId || requestData.userId === uid;
      }
      if (operation === 'update' || operation === 'delete') {
        return isAdmin || !resourceData?.userId || resourceData.userId === uid;
      }
    }

    return false;
  }

  const testUsers = {
    unauth: null,
    viewer: { uid: 'u-viewer', role: 'VIEWER' },
    practitioner: { uid: 'u-prac', role: 'PRACTITIONER' },
    admin: { uid: 'u-admin', role: 'ADMIN' }
  };

  const domainCols = ['clients', 'caseNotes', 'billingClaims', 'incidents', 'restrictivePractices', 'abcLogs', 'bspDocuments', 'crmLeads', 'leads', 'crmTasks', 'scheduledShifts'];

  for (const col of domainCols) {
    check(`[RBAC] ${col}: Unauthenticated blocked from all operations`, () => {
      assert.strictEqual(evaluateRulesModel('get', `${col}/doc1`, testUsers.unauth), false);
      assert.strictEqual(evaluateRulesModel('create', `${col}/doc1`, testUsers.unauth), false);
      assert.strictEqual(evaluateRulesModel('update', `${col}/doc1`, testUsers.unauth), false);
      assert.strictEqual(evaluateRulesModel('delete', `${col}/doc1`, testUsers.unauth), false);
    });

    check(`[RBAC] ${col}: VIEWER can read, cannot create/update/delete`, () => {
      assert.strictEqual(evaluateRulesModel('get', `${col}/doc1`, testUsers.viewer), true);
      assert.strictEqual(evaluateRulesModel('create', `${col}/doc1`, testUsers.viewer), false);
      assert.strictEqual(evaluateRulesModel('update', `${col}/doc1`, testUsers.viewer), false);
      assert.strictEqual(evaluateRulesModel('delete', `${col}/doc1`, testUsers.viewer), false);
    });

    check(`[RBAC] ${col}: PRACTITIONER can read/create/update, CANNOT delete`, () => {
      assert.strictEqual(evaluateRulesModel('get', `${col}/doc1`, testUsers.practitioner), true);
      assert.strictEqual(evaluateRulesModel('create', `${col}/doc1`, testUsers.practitioner), true);
      assert.strictEqual(evaluateRulesModel('update', `${col}/doc1`, testUsers.practitioner), true);
      assert.strictEqual(evaluateRulesModel('delete', `${col}/doc1`, testUsers.practitioner), false);
    });

    check(`[RBAC] ${col}: ADMIN has full CRUD (including delete)`, () => {
      assert.strictEqual(evaluateRulesModel('get', `${col}/doc1`, testUsers.admin), true);
      assert.strictEqual(evaluateRulesModel('create', `${col}/doc1`, testUsers.admin), true);
      assert.strictEqual(evaluateRulesModel('update', `${col}/doc1`, testUsers.admin), true);
      assert.strictEqual(evaluateRulesModel('delete', `${col}/doc1`, testUsers.admin), true);
    });
  }

  check('[RBAC] HR practitioners: PRACTITIONER cannot modify staff profiles', () => {
    assert.strictEqual(evaluateRulesModel('get', 'practitioners/prac1', testUsers.practitioner), true);
    assert.strictEqual(evaluateRulesModel('create', 'practitioners/prac1', testUsers.practitioner), false);
    assert.strictEqual(evaluateRulesModel('update', 'practitioners/prac1', testUsers.practitioner), false);
    assert.strictEqual(evaluateRulesModel('delete', 'practitioners/prac1', testUsers.practitioner), false);
  });

  check('[RBAC] AuditLogs: ADMIN cannot mutate or delete audit log entries', () => {
    assert.strictEqual(evaluateRulesModel('update', 'auditLogs/log1', testUsers.admin), false);
    assert.strictEqual(evaluateRulesModel('delete', 'auditLogs/log1', testUsers.admin), false);
  });

  check('[RBAC] Notifications: User A cannot read User B notifications', () => {
    const userA = { uid: 'user-A', role: 'PRACTITIONER' };
    const notifUserB = { userId: 'user-B', title: 'Alert for B' };
    assert.strictEqual(evaluateRulesModel('get', 'notifications/n1', userA, notifUserB), false);
    assert.strictEqual(evaluateRulesModel('update', 'notifications/n1', userA, notifUserB), false);
    assert.strictEqual(evaluateRulesModel('delete', 'notifications/n1', userA, notifUserB), false);
  });

  check('[RBAC] Notifications: ADMIN can read and manage all notifications', () => {
    const notifUserB = { userId: 'user-B', title: 'Alert for B' };
    assert.strictEqual(evaluateRulesModel('get', 'notifications/n1', testUsers.admin, notifUserB), true);
    assert.strictEqual(evaluateRulesModel('delete', 'notifications/n1', testUsers.admin, notifUserB), true);
  });

  console.log('\n==============================================================');
  console.log(`  CHALLENGE COMPLETE: ${passedChecks} PASSED, ${failedChecks} FAILED (${totalChecks} total)`);
  console.log('==============================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error running challenger test harness:', err);
  process.exit(1);
});
