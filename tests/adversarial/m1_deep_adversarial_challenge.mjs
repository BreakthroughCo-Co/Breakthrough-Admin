/**
 * Milestone 1 Deep Adversarial Challenge Harness
 * 
 * Empirically challenges and stress-tests:
 * 1. Malformed/invalid email formats, password boundaries, rapid re-auth & concurrency.
 * 2. Storage upload size violations (>25MB boundary), dangerous file extensions, double extensions & MIME spoofing.
 * 3. VIEWER and Cross-Role privilege escalation attempts against Firestore, Storage Rules, and storageService.
 * 4. Authenticated URL expiration, token integrity, and unauthorized cross-practitioner document access.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  InMemoryFirestore,
  FirebaseAuthEmulator,
  InMemoryStorageEmulator,
  FirebaseStorageEmulator,
  IndexedDBSessionEmulator,
  RouteProtectionMiddleware,
  validateStorageFile,
  MAX_STORAGE_FILE_SIZE_BYTES,
  ALLOWED_STORAGE_MIME_TYPES,
  SEED_USERS,
  SEED_CLIENTS
} from '../harness/emulator.mjs';

// Load storageService logic directly from source
import {
  validateFile,
  canUserUpload,
  canUserAccessClientDocuments,
  canUserAccessEntityDocuments,
  canUserDeleteDocument,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_EXTENSIONS
} from '../../lib/storageService.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function recordFinding(severity, category, title, description, attackVector) {
  findings.push({ severity, category, title, description, attackVector });
}

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Details: ${err.message}`);
  }
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(' 🔥 CHALLENGER 1: MILESTONE 1 (R1 & R11) ADVERSARIAL STRESS HARNESS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // =========================================================================
  // SECTION 1: AUTHENTICATION, EMAIL VALIDATION, PASSWORD BOUNDARIES & RE-AUTH
  // =========================================================================
  console.log('▶ SECTION 1: Authentication, Email Boundaries, Passwords & Rapid Re-Auth');

  const firestore = new InMemoryFirestore();
  const auth = new FirebaseAuthEmulator(firestore);

  // 1.1 Malformed Email Attack Matrix
  const malformedEmails = [
    '',
    'notanemail',
    'missingatsign.com',
    '@nodomain.com',
    'nousername@'
  ];

  for (const badEmail of malformedEmails) {
    await runTest(`Auth rejects invalid email: "${badEmail}"`, async () => {
      await assert.rejects(
        async () => {
          await auth.signInWithEmailAndPassword(badEmail, 'valid_password_123');
        },
        (err) => {
          assert.ok(err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found');
          return true;
        }
      );
    });
  }

  // 1.2 Password Boundary Matrix
  const invalidPasswords = [
    '',
    '1',
    '12',
    '123',
    '1234',
    '12345' // Exactly 5 chars - 1 below 6-char minimum
  ];

  for (const pw of invalidPasswords) {
    await runTest(`SignIn rejects sub-boundary password (length ${pw.length})`, async () => {
      await assert.rejects(
        async () => {
          await auth.signInWithEmailAndPassword('sarah.jenkins@breakthrough.org.au', pw);
        },
        (err) => {
          assert.equal(err.code, 'auth/wrong-password');
          return true;
        }
      );
    });

    await runTest(`Registration rejects sub-boundary password (length ${pw.length})`, async () => {
      await assert.rejects(
        async () => {
          await auth.createUserWithEmailAndPassword(`test_${Date.now()}@breakthrough.org.au`, pw, 'Test User');
        },
        (err) => {
          assert.equal(err.code, 'auth/weak-password');
          return true;
        }
      );
    });
  }

  // Exact 6-char boundary test (Minimum required)
  await runTest('Exact 6-character boundary password is accepted upon registration', async () => {
    const testEmail = `prac_boundary_${Date.now()}@breakthrough.org.au`;
    const res = await auth.createUserWithEmailAndPassword(testEmail, '123456', 'Boundary User', 'PRACTITIONER');
    assert.ok(res.user.uid);
    assert.equal(res.profile.role, 'PRACTITIONER');
  });

  // High boundary password (1024 chars)
  await runTest('High boundary password (1024 characters) handled without truncation or error', async () => {
    const testEmail = `prac_long_${Date.now()}@breakthrough.org.au`;
    const longPw = 'SecurePass_!@#' + 'A'.repeat(1000);
    const res = await auth.createUserWithEmailAndPassword(testEmail, longPw, 'Long Password User', 'PRACTITIONER');
    assert.ok(res.user.uid);

    const signin = await auth.signInWithEmailAndPassword(testEmail, longPw);
    assert.equal(signin.user.uid, res.user.uid);
  });

  // Unicode & Emoji passwords
  await runTest('Unicode / Emoji password (NDIS_Pass_🔒✨🇦🇺) functions reliably', async () => {
    const testEmail = `prac_unicode_${Date.now()}@breakthrough.org.au`;
    const unicodePw = 'NDIS_Pass_🔒✨🇦🇺';
    const res = await auth.createUserWithEmailAndPassword(testEmail, unicodePw, 'Unicode User', 'PRACTITIONER');
    assert.ok(res.user.uid);

    const signin = await auth.signInWithEmailAndPassword(testEmail, unicodePw);
    assert.equal(signin.user.uid, res.user.uid);
  });

  // 1.3 Rapid Re-Auth & Session Cycling Stress (100 sequential operations)
  await runTest('Rapid re-authentication cycling (100 rapid logins) maintains state integrity', async () => {
    const idb = new IndexedDBSessionEmulator();
    const usersToCycle = [
      { email: 'sarah.jenkins@breakthrough.org.au', role: 'ADMIN', uid: 'user-director' },
      { email: 'marcus.vance@breakthrough.org.au', role: 'PRACTITIONER', uid: 'user-specialist' },
      { email: 'elena.rostova@breakthrough.org.au', role: 'VIEWER', uid: 'user-auditor' }
    ];

    for (let i = 0; i < 100; i++) {
      const targetUser = usersToCycle[i % usersToCycle.length];
      const signin = await auth.signInWithEmailAndPassword(targetUser.email, 'valid_password_123');
      assert.equal(signin.user.uid, targetUser.uid);

      idb.saveSession({
        uid: signin.user.uid,
        email: signin.user.email,
        role: targetUser.role
      });

      const active = idb.loadSession();
      assert.equal(active.uid, targetUser.uid);
      assert.equal(active.role, targetUser.role);
    }
  });

  // =========================================================================
  // SECTION 2: STORAGE SIZE BOUNDARIES, EXTENSIONS & MIME SPOOFING
  // =========================================================================
  console.log('\n▶ SECTION 2: Storage Size Violations, Dangerous Extensions & MIME Spoofing');

  const storageEmulator = new InMemoryStorageEmulator(firestore);
  const practitionerAuth = { uid: 'user-specialist', role: 'PRACTITIONER', name: 'Marcus Vance' };

  // 2.1 File Size Boundary Matrix
  const MAX_BYTES = 25 * 1024 * 1024; // 26,214,400 bytes

  await runTest('Storage accepts exact 25MB boundary file (26,214,400 bytes)', async () => {
    const result = validateStorageFile({ name: 'boundary_test.pdf', size: MAX_BYTES, type: 'application/pdf' });
    assert.equal(result.valid, true);

    const serviceResult = validateFile({ name: 'boundary_test.pdf', size: MAX_BYTES, type: 'application/pdf' });
    assert.equal(serviceResult.valid, true);
  });

  await runTest('Storage rejects 25MB + 1 byte (26,214,401 bytes) in validator', async () => {
    const result = validateStorageFile({ name: 'over_limit.pdf', size: MAX_BYTES + 1, type: 'application/pdf' });
    assert.equal(result.valid, false);
    assert.match(result.error, /exceeds maximum allowed size/);

    const serviceResult = validateFile({ name: 'over_limit.pdf', size: MAX_BYTES + 1, type: 'application/pdf' });
    assert.equal(serviceResult.valid, false);
    assert.match(serviceResult.error, /exceeds maximum allowed limit/);
  });

  await runTest('Storage rejects 0-byte (empty) and negative size files', async () => {
    const zeroResult = validateStorageFile({ name: 'empty.pdf', size: 0, type: 'application/pdf' });
    assert.equal(zeroResult.valid, false);

    const zeroService = validateFile({ name: 'empty.pdf', size: 0, type: 'application/pdf' });
    assert.equal(zeroService.valid, false);

    const negResult = validateStorageFile({ name: 'negative.pdf', size: -500, type: 'application/pdf' });
    assert.equal(negResult.valid, false);

    const negService = validateFile({ name: 'negative.pdf', size: -500, type: 'application/pdf' });
    assert.equal(negService.valid, false);
  });

  // 2.2 Dangerous File Extensions
  const dangerousExtensions = [
    'malware.exe',
    'exploit.sh',
    'script.bat',
    'payload.cmd',
    'macro.vbs',
    'webshell.php',
    'server.js',
    'worker.py',
    'xss.html',
    'svg_xss.svg',
    'archive.zip',
    'bundle.tar.gz'
  ];

  for (const dangerousFile of dangerousExtensions) {
    await runTest(`Storage rejects dangerous extension: "${dangerousFile}" with generic binary mime`, async () => {
      const valRes = validateStorageFile({ name: dangerousFile, size: 2048, type: 'application/octet-stream' });
      assert.equal(valRes.valid, false);

      const servRes = validateFile({ name: dangerousFile, size: 2048, type: 'application/octet-stream' });
      assert.equal(servRes.valid, false);

      await assert.rejects(
        async () => {
          await storageEmulator.uploadFile(
            `clients/cli-101/documents/doc-bad/${dangerousFile}`,
            Buffer.from('malicious payload'),
            { fileName: dangerousFile, mimeType: 'application/octet-stream' },
            practitionerAuth
          );
        },
        /UNSUPPORTED_MEDIA_TYPE/
      );
    });
  }

  // 2.3 MIME Spoofing & Double Extension Attack Scenarios
  console.log('\n  [ATTACK SCENARIO: MIME Spoofing & Extension Mismatch]');

  await runTest('MIME spoofing audit: executable named "malware.exe" claiming MIME "application/pdf"', async () => {
    const servRes = validateFile({ name: 'malware.exe', size: 2048, type: 'application/pdf' });
    if (servRes.valid) {
      recordFinding(
        'HIGH',
        'Storage Validation',
        'MIME Spoofing Bypass in storageService.ts validateFile()',
        'validateFile() in lib/storageService.ts uses OR logic (!hasValidExt && !hasValidMime), allowing a dangerous file (.exe) with a spoofed MIME header (application/pdf) to pass client-side validation.',
        'File: malware.exe, MIME: application/pdf -> validateFile returned valid: true'
      );
    }
  });

  await runTest('MIME spoofing audit: dangerous MIME "application/x-sh" disguised with extension "report.pdf"', async () => {
    const servRes = validateFile({ name: 'report.pdf', size: 2048, type: 'application/x-sh' });
    if (servRes.valid) {
      recordFinding(
        'HIGH',
        'Storage Validation',
        'Extension-only Bypass in storageService.ts validateFile()',
        'validateFile() in lib/storageService.ts allows dangerous MIME types (e.g. application/x-sh, text/html) if the file extension is .pdf.',
        'File: report.pdf, MIME: application/x-sh -> validateFile returned valid: true'
      );
    }
  });

  await runTest('Double extension bypass audit: "bsp_report.pdf.exe" with MIME "application/pdf"', async () => {
    const servRes = validateFile({ name: 'bsp_report.pdf.exe', size: 2048, type: 'application/pdf' });
    if (servRes.valid) {
      recordFinding(
        'MEDIUM',
        'Storage Validation',
        'Double Extension Attack Surface',
        'Files with double extensions ending in executable suffixes (.pdf.exe) can bypass validation if MIME type is spoofed to application/pdf.',
        'File: bsp_report.pdf.exe, MIME: application/pdf'
      );
    }
  });

  // =========================================================================
  // SECTION 3: VIEWER & CROSS-ROLE PRIVILEGE ESCALATION ATTACKS
  // =========================================================================
  console.log('\n▶ SECTION 3: VIEWER & Cross-Role Privilege Escalation Attacks');

  const viewerAuth = { uid: 'user-auditor', role: 'VIEWER', name: 'Elena Rostova' };
  const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };
  const adminAuth = { uid: 'user-director', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };
  const unassignedPracAuth = { uid: 'user-unassigned', role: 'PRACTITIONER', name: 'Liam Gallagher', practitionerId: 'prac-204' };

  // 3.1 VIEWER write attempts across all Firestore collections
  const collections = [
    'clients',
    'caseNotes',
    'billingClaims',
    'incidents',
    'restrictivePractices',
    'abcLogs',
    'bspDocuments',
    'crmLeads',
    'leads',
    'crmTasks',
    'practitioners',
    'scheduledShifts',
    'documents'
  ];

  for (const col of collections) {
    await runTest(`VIEWER privilege escalation: BLOCKED from creating docs in "/${col}"`, async () => {
      await assert.rejects(
        async () => {
          await firestore.setDoc(col, `doc_viewer_attack_${Date.now()}`, { data: 'exploit' }, viewerAuth);
        },
        /PERMISSION_DENIED/
      );
    });

    await runTest(`VIEWER privilege escalation: BLOCKED from deleting docs in "/${col}"`, async () => {
      await assert.rejects(
        async () => {
          await firestore.deleteDoc(col, 'existing_doc', viewerAuth);
        },
        /PERMISSION_DENIED/
      );
    });
  }

  // 3.2 Audit Log Immutability & Injection Attack
  await runTest('Audit log immutability: ADMIN cannot overwrite existing audit entry', async () => {
    await firestore.setDoc('auditLogs', 'audit-immutable-1', { action: 'INITIAL_LOGIN', timestamp: '2026-08-25T00:00:00Z' }, adminAuth);
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'audit-immutable-1', { action: 'TAMPERED_ACTION' }, adminAuth);
      },
      /PERMISSION_DENIED/
    );
  });

  await runTest('Audit log immutability: ADMIN cannot delete audit log entry', async () => {
    await assert.rejects(
      async () => {
        await firestore.deleteDoc('auditLogs', 'audit-immutable-1', adminAuth);
      },
      /PERMISSION_DENIED/
    );
  });

  // 3.3 VIEWER Storage Upload & Delete Blockage
  await runTest('VIEWER is blocked from uploading files in InMemoryStorageEmulator', async () => {
    await assert.rejects(
      async () => {
        await storageEmulator.uploadFile(
          'clients/cli-101/documents/doc-v1/audit_notes.pdf',
          Buffer.from('%PDF-1.4 test'),
          { fileName: 'audit_notes.pdf', mimeType: 'application/pdf' },
          viewerAuth
        );
      },
      /PERMISSION_DENIED/
    );
  });

  await runTest('VIEWER is blocked from uploading files in FirebaseStorageEmulator', async () => {
    const fbStorage = new FirebaseStorageEmulator();
    assert.throws(
      () => {
        fbStorage.uploadFile(
          'clients/cli-101/audit_notes.pdf',
          '%PDF-1.4 test',
          { contentType: 'application/pdf' },
          viewerAuth
        );
      },
      /PERMISSION_DENIED/
    );
  });

  await runTest('VIEWER is blocked from downloading files in FirebaseStorageEmulator', async () => {
    const fbStorage = new FirebaseStorageEmulator();
    fbStorage.uploadFile('clients/cli-101/bsp.pdf', '%PDF-1.4 bsp', { contentType: 'application/pdf' }, adminAuth);

    assert.throws(
      () => {
        fbStorage.getDownloadUrl('clients/cli-101/bsp.pdf', viewerAuth);
      },
      /PERMISSION_DENIED/
    );
  });

  // 3.4 Email Spoofing Attack against storage.rules
  console.log('\n  [ATTACK SCENARIO: Email Substring Match in storage.rules]');
  const storageRulesContent = fs.readFileSync(path.resolve('storage.rules'), 'utf8');

  await runTest('storage.rules inspection for insecure email substring regex matches', async () => {
    const hasInsecureAdminMatch = storageRulesContent.includes("request.auth.token.email.matches('.*admin.*')");
    const hasInsecureDirectorMatch = storageRulesContent.includes("request.auth.token.email.matches('.*director.*')");

    if (hasInsecureAdminMatch || hasInsecureDirectorMatch) {
      recordFinding(
        'HIGH',
        'Storage Security Rules',
        'Insecure Email Regex Substring Matching in storage.rules isAdmin()',
        "storage.rules defines isAdmin() by checking if request.auth.token.email matches '.*admin.*' or '.*director.*'. Any external or unprivileged user who registers an email containing 'admin' or 'director' (e.g. 'bad_admin_test@gmail.com' or 'fake.director@yahoo.com') is granted full ADMIN read, write, and delete permissions on all storage buckets.",
        "storage.rules lines 21-24: request.auth.token.email.matches('.*admin.*') || request.auth.token.email.matches('.*director.*')"
      );
    }
  });

  // 3.5 storageService.ts RBAC Function Verification
  await runTest('canUserUpload() returns false for VIEWER and PARTICIPANT', async () => {
    assert.equal(canUserUpload(viewerAuth), false);
    assert.equal(canUserUpload(participantAuth), false);
    assert.equal(canUserUpload(null), false);
    assert.equal(canUserUpload(practitionerAuth), true);
    assert.equal(canUserUpload(adminAuth), true);
  });

  await runTest('canUserAccessClientDocuments() enforces assigned practitioner and ADMIN access only', async () => {
    const client = SEED_CLIENTS[0]; // Assigned to Marcus Vance (prac-202)
    const assignedPrac = {
      id: 'user-specialist',
      uid: 'user-specialist',
      name: 'Marcus Vance',
      role: 'PRACTITIONER',
      practitionerId: 'prac-202'
    };

    const unassignedPrac = {
      id: 'user-unassigned',
      uid: 'user-unassigned',
      name: 'Liam Gallagher',
      role: 'PRACTITIONER',
      practitionerId: 'prac-204'
    };

    const viewerUser = {
      id: 'user-auditor',
      name: 'Elena Rostova',
      role: 'VIEWER'
    };

    // Admin has access
    assert.equal(canUserAccessClientDocuments(client, adminAuth), true);
    // Assigned practitioner has access
    assert.equal(canUserAccessClientDocuments(client, assignedPrac), true);
    // Unassigned practitioner has NO access
    assert.equal(canUserAccessClientDocuments(client, unassignedPrac), false);
    // Viewer has NO access
    assert.equal(canUserAccessClientDocuments(client, viewerUser), false);
    // Null user has NO access
    assert.equal(canUserAccessClientDocuments(client, null), false);
  });

  await runTest('canUserDeleteDocument() allows ADMIN or uploader only, blocks VIEWER and non-uploaders', async () => {
    const docOwnedByMarcus = {
      id: 'doc-101',
      name: 'consent.pdf',
      uploadedBy: 'user-specialist'
    };

    // Uploader (Marcus) can delete
    assert.equal(canUserDeleteDocument(docOwnedByMarcus, practitionerAuth), true);
    // Admin can delete
    assert.equal(canUserDeleteDocument(docOwnedByMarcus, adminAuth), true);
    // Other practitioner cannot delete
    assert.equal(canUserDeleteDocument(docOwnedByMarcus, unassignedPracAuth), false);
    // Viewer cannot delete
    assert.equal(canUserDeleteDocument(docOwnedByMarcus, viewerAuth), false);
    // Null user cannot delete
    assert.equal(canUserDeleteDocument(docOwnedByMarcus, null), false);
  });

  // 3.6 Multi-Entity Document RBAC Access Verification
  await runTest('canUserAccessEntityDocuments() enforces strict role boundaries across all entity types', async () => {
    const client101 = SEED_CLIENTS[0];
    const assignedPrac = { id: 'user-specialist', practitionerId: 'prac-202', role: 'PRACTITIONER', name: 'Marcus Vance' };
    const unassignedPrac = { id: 'user-unassigned', practitionerId: 'prac-204', role: 'PRACTITIONER', name: 'Liam Gallagher' };
    const supportCoord = { id: 'user-coordinator', role: 'SUPPORT_COORDINATOR', assignedClientIds: ['cli-101'] };
    const unassignedCoord = { id: 'user-other-coord', role: 'SUPPORT_COORDINATOR', assignedClientIds: ['cli-999'] };

    // 1. ADMIN has access across all entities
    for (const entityType of ['Client', 'Incident', 'BillingClaim', 'BSPDocument', 'General']) {
      assert.equal(canUserAccessEntityDocuments(entityType, 'cli-101', adminAuth, client101), true);
    }

    // 2. VIEWER is blocked from ALL entity documents
    for (const entityType of ['Client', 'Incident', 'BillingClaim', 'BSPDocument', 'General']) {
      assert.equal(canUserAccessEntityDocuments(entityType, 'cli-101', viewerAuth, client101), false);
    }

    // 3. PARTICIPANT can only access their own Client documents
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-101', participantAuth, client101), true);
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-102', participantAuth, SEED_CLIENTS[1]), false);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', participantAuth), false);
    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', participantAuth), false);

    // 4. SUPPORT_COORDINATOR can access Billing Claims and assigned Clients
    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', supportCoord), true);
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-101', supportCoord, client101), true);
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-102', unassignedCoord, SEED_CLIENTS[1]), false);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', supportCoord), false);

    // 5. PRACTITIONER access
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-101', assignedPrac, client101), true);
    assert.equal(canUserAccessEntityDocuments('Client', 'cli-101', unassignedPrac, client101), false);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', assignedPrac), true);
    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', assignedPrac), true);
    assert.equal(canUserAccessEntityDocuments('BSPDocument', 'bsp-101', assignedPrac), true);
  });

  // 3.7 Self-Role Elevation Prevention in Firestore
  await runTest('Firestore rules & emulator block non-admin from modifying "role" field on /users/{userId}', async () => {
    // Non-admin practitioner attempts to elevate to ADMIN
    await assert.rejects(
      async () => {
        await firestore.updateDoc('users', 'user-specialist', { role: 'ADMIN' }, practitionerAuth);
      },
      /PERMISSION_DENIED/
    );

    // VIEWER attempts to elevate to ADMIN
    await assert.rejects(
      async () => {
        await firestore.updateDoc('users', 'user-auditor', { role: 'ADMIN' }, viewerAuth);
      },
      /PERMISSION_DENIED/
    );

    // ADMIN can update user role
    await assert.doesNotReject(async () => {
      await firestore.updateDoc('users', 'user-specialist', { role: 'PRACTITIONER', activeCaseload: 19 }, adminAuth);
    });

    // Verify firestore.rules file contains role protection
    const firestoreRulesContent = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
    assert.ok(
      firestoreRulesContent.includes("request.resource.data.role == resource.data.role") ||
      firestoreRulesContent.includes("!('role' in request.resource.data)"),
      'firestore.rules must enforce role protection on /users/{userId} update'
    );
  });

  // =========================================================================
  // SECTION 4: AUTHENTICATED URL EXPIRATION & CROSS-PRACTITIONER ACCESS
  // =========================================================================
  console.log('\n▶ SECTION 4: Authenticated URL Integrity, Token Verification & Access Control');

  const fbStorage = new FirebaseStorageEmulator();
  fbStorage.uploadFile(
    'clients/cli-101/clinical_assessment.pdf',
    '%PDF-1.4 Clinical Assessment',
    { contentType: 'application/pdf', category: 'assessment' },
    practitionerAuth
  );

  await runTest('Download URL contains valid token and encoded path', async () => {
    const url = fbStorage.getDownloadUrl('clients/cli-101/clinical_assessment.pdf', practitionerAuth);
    assert.ok(url.startsWith('https://firebasestorage.googleapis.com'));
    assert.ok(url.includes('alt=media'));
    assert.ok(url.includes('token='));
    assert.ok(url.includes(encodeURIComponent('clients/cli-101/clinical_assessment.pdf')));
  });

  await runTest('Cross-practitioner / unassigned access attempt is blocked', async () => {
    assert.throws(
      () => {
        fbStorage.getDownloadUrl('clients/cli-101/clinical_assessment.pdf', {
          uid: 'cli-999',
          role: 'PARTICIPANT',
          name: 'Other Participant'
        });
      },
      /PERMISSION_DENIED/
    );
  });

  // =========================================================================
  // SUMMARY & FINDINGS REPORT
  // =========================================================================
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(`  📊 CHALLENGER SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (${totalTests} total)`);
  console.log(`  🔍 SECURITY FINDINGS DISCOVERED: ${findings.length}`);
  console.log('══════════════════════════════════════════════════════════════════════\n');

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    console.log(`[Finding ${i + 1}] [${f.severity}] ${f.category}: ${f.title}`);
    console.log(`  Description : ${f.description}`);
    console.log(`  Attack Vector: ${f.attackVector}\n`);
  }

  return { totalTests, passedTests, failedTests, findings };
}

main().catch((err) => {
  console.error('Fatal error executing challenger script:', err);
  process.exit(1);
});
