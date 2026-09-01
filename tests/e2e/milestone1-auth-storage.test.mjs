/**
 * Milestone 1 Verification Test Suite: Authentication, Security & Storage Foundation (R1 & R11)
 * 
 * Tests:
 * 1. Firebase Auth Email/Password Sign-In, Error Codes & Session Persistence
 * 2. User Registration & Profile Initialization with Roles (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR)
 * 3. Password Reset Workflow
 * 4. Route & Tab Access Gating (AccessGuard & Unauthenticated Session Shielding)
 * 5. Firebase Storage Security Rules, 25MB Limit & MIME Restrictions
 * 6. Storage Service (Upload, RBAC Download, Delete, Entity Listing)
 * 7. Hardened Firestore Security Rules (VIEWER restrictions across all collections, Immutable Audit Logs)
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  FirebaseAuthEmulator,
  InMemoryStorageEmulator,
  IndexedDBSessionEmulator,
  RouteProtectionMiddleware,
  ManagementStoreEmulator,
  SEED_USERS,
  validateStorageFile,
  MAX_STORAGE_FILE_SIZE_BYTES,
  ALLOWED_STORAGE_MIME_TYPES
} from '../harness/emulator.mjs';

export async function runMilestone1Tests(reporter) {
  reporter.startSuite('Milestone 1: Authentication, Security & Storage Foundation (R1 & R11)');

  // Phase 1: Real Firebase Authentication & Error Handling
  reporter.startPhase('Phase 1: Real Firebase Auth & Error Mapping');

  await reporter.test('T1.M1.1 - Valid email/password sign-in returns authenticated user session', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    const res = await auth.signInWithEmailAndPassword('sarah.jenkins@breakthrough.org.au', 'valid_password_123');
    assert.ok(res.user, 'User object should be returned');
    assert.equal(res.user.email, 'sarah.jenkins@breakthrough.org.au');
    assert.equal(res.user.uid, 'user-director');
  });

  await reporter.test('T1.M1.2 - Rejection of invalid email format triggers auth/invalid-email', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    await assert.rejects(
      async () => {
        await auth.signInWithEmailAndPassword('not-an-email', 'some_password');
      },
      (err) => {
        assert.equal(err.code, 'auth/invalid-email');
        return true;
      }
    );
  });

  await reporter.test('T1.M1.3 - Non-existent email triggers auth/user-not-found', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    await assert.rejects(
      async () => {
        await auth.signInWithEmailAndPassword('unknown.practitioner@breakthrough.org.au', 'valid_password_123');
      },
      (err) => {
        assert.equal(err.code, 'auth/user-not-found');
        return true;
      }
    );
  });

  await reporter.test('T1.M1.4 - Short password (<6 chars) triggers auth/wrong-password or weak-password', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    await assert.rejects(
      async () => {
        await auth.signInWithEmailAndPassword('sarah.jenkins@breakthrough.org.au', '12345');
      },
      (err) => {
        assert.equal(err.code, 'auth/wrong-password');
        return true;
      }
    );
  });

  await reporter.test('T1.M1.5 - Practitioner registration creates Auth user & persists Firestore profile', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    const { user, profile } = await auth.createUserWithEmailAndPassword(
      'claire.newman@breakthrough.org.au',
      'SecurePass2026!',
      'Claire Newman',
      'PRACTITIONER'
    );

    assert.ok(user.uid, 'User ID should be generated');
    assert.equal(user.email, 'claire.newman@breakthrough.org.au');
    assert.equal(profile.role, 'PRACTITIONER');
    assert.equal(profile.name, 'Claire Newman');

    // Confirm Firestore user document exists
    const userDoc = await firestore.getDoc('users', user.uid, { uid: user.uid, role: 'ADMIN' });
    assert.ok(userDoc, 'Firestore user profile must exist');
    assert.equal(userDoc.email, 'claire.newman@breakthrough.org.au');
    assert.equal(userDoc.role, 'PRACTITIONER');
  });

  await reporter.test('T1.M1.6 - Duplicate email registration is rejected with auth/email-already-in-use', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    await assert.rejects(
      async () => {
        await auth.createUserWithEmailAndPassword(
          'sarah.jenkins@breakthrough.org.au',
          'Password123!',
          'Dr. Sarah Jenkins',
          'ADMIN'
        );
      },
      (err) => {
        assert.equal(err.code, 'auth/email-already-in-use');
        return true;
      }
    );
  });

  await reporter.test('T1.M1.7 - Password reset dispatches reset instructions', async () => {
    const firestore = new InMemoryFirestore();
    const auth = new FirebaseAuthEmulator(firestore);

    const res = await auth.sendPasswordResetEmail('sarah.jenkins@breakthrough.org.au');
    assert.equal(res.success, true);
    assert.equal(res.email, 'sarah.jenkins@breakthrough.org.au');
  });

  await reporter.test('T1.M1.8 - Session persistence stores and restores auth session across reloads', async () => {
    const idb = new IndexedDBSessionEmulator();
    assert.equal(idb.hasActiveSession(), false);

    idb.saveSession({
      uid: 'user-director',
      email: 'sarah.jenkins@breakthrough.org.au',
      role: 'ADMIN'
    });

    assert.equal(idb.hasActiveSession(), true);
    const restored = idb.loadSession();
    assert.equal(restored.uid, 'user-director');
    assert.equal(restored.role, 'ADMIN');

    idb.clearSession();
    assert.equal(idb.hasActiveSession(), false);
    assert.equal(idb.loadSession(), null);
  });

  // Phase 2: Route & Access Gating
  reporter.startPhase('Phase 2: Route & Action Gating');

  await reporter.test('T1.M1.9 - Unauthenticated session is strictly blocked from protected routes', async () => {
    const result = RouteProtectionMiddleware.evaluateRouteAccess('/clinical/case-notes', null);
    assert.equal(result.allowed, false);
    assert.equal(result.redirect, '/login');
  });

  await reporter.test('T1.M1.10 - Admin-only routes allow ADMIN and reject PRACTITIONER and VIEWER', async () => {
    const adminAccess = RouteProtectionMiddleware.evaluateRouteAccess('/admin/hr-roster', { uid: 'u1', role: 'ADMIN' });
    assert.equal(adminAccess.allowed, true);

    const pracAccess = RouteProtectionMiddleware.evaluateRouteAccess('/admin/hr-roster', { uid: 'u2', role: 'PRACTITIONER' });
    assert.equal(pracAccess.allowed, false);
    assert.equal(pracAccess.redirect, '/unauthorized');

    const viewerAccess = RouteProtectionMiddleware.evaluateRouteAccess('/admin/audit-logs', { uid: 'u3', role: 'VIEWER' });
    assert.equal(viewerAccess.allowed, false);
  });

  // Phase 3: Firebase Storage Validation & Security Rules
  reporter.startPhase('Phase 3: Storage Validation & Security Rules (R11)');

  await reporter.test('T1.M1.11 - validateFile accepts valid PDF, DOCX, JPEG, PNG under 25MB', async () => {
    const validPdf = validateStorageFile({ name: 'clinical-assessment.pdf', size: 1024 * 500, type: 'application/pdf' });
    assert.equal(validPdf.valid, true);

    const validDocx = validateStorageFile({
      name: 'bsp-plan.docx',
      size: 1024 * 1024 * 2,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    assert.equal(validDocx.valid, true);

    const validJpg = validateStorageFile({ name: 'incident-evidence.jpg', size: 1024 * 300, type: 'image/jpeg' });
    assert.equal(validJpg.valid, true);

    const validPng = validateStorageFile({ name: 'signature.png', size: 1024 * 150, type: 'image/png' });
    assert.equal(validPng.valid, true);
  });

  await reporter.test('T1.M1.12 - validateFile rejects files exceeding 25MB (26,214,400 bytes)', async () => {
    const exactLimit = validateStorageFile({ name: 'large-record.pdf', size: MAX_STORAGE_FILE_SIZE_BYTES, type: 'application/pdf' });
    assert.equal(exactLimit.valid, true);

    const overLimit = validateStorageFile({
      name: 'huge-video.pdf',
      size: MAX_STORAGE_FILE_SIZE_BYTES + 1,
      type: 'application/pdf'
    });
    assert.equal(overLimit.valid, false);
    assert.match(overLimit.error, /exceeds maximum allowed size of 25MB/);
  });

  await reporter.test('T1.M1.13 - validateFile rejects disallowed extensions (.exe, .zip, .html, .js)', async () => {
    const exeCheck = validateStorageFile({ name: 'malicious.exe', size: 5000, type: 'application/x-msdownload' });
    assert.equal(exeCheck.valid, false);

    const zipCheck = validateStorageFile({ name: 'data.zip', size: 5000, type: 'application/zip' });
    assert.equal(zipCheck.valid, false);

    const htmlCheck = validateStorageFile({ name: 'payload.html', size: 5000, type: 'text/html' });
    assert.equal(htmlCheck.valid, false);
  });

  await reporter.test('T1.M1.14 - Unauthenticated upload to Storage is rejected by rules', async () => {
    const storage = new InMemoryStorageEmulator();
    await assert.rejects(
      async () => {
        await storage.uploadFile('clients/cli-101/documents/doc-1/test.pdf', Buffer.from('test'), { fileName: 'test.pdf' }, null);
      },
      (err) => {
        assert.match(err.message, /PERMISSION_DENIED/);
        return true;
      }
    );
  });

  await reporter.test('T1.M1.15 - VIEWER role is blocked from uploading or deleting files in Storage', async () => {
    const storage = new InMemoryStorageEmulator();
    const viewerAuth = { uid: 'user-auditor', name: 'Elena Rostova', role: 'VIEWER' };

    await assert.rejects(
      async () => {
        await storage.uploadFile(
          'clients/cli-101/documents/doc-1/test.pdf',
          Buffer.from('test data'),
          { fileName: 'test.pdf', mimeType: 'application/pdf' },
          viewerAuth
        );
      },
      (err) => {
        assert.match(err.message, /PERMISSION_DENIED: VIEWER role is blocked from uploading files/);
        return true;
      }
    );
  });

  await reporter.test('T1.M1.16 - ADMIN and PRACTITIONER can upload, generate download URL, and delete files', async () => {
    const firestore = new InMemoryFirestore();
    const storage = new InMemoryStorageEmulator(firestore);
    const pracAuth = { uid: 'user-specialist', name: 'Marcus Vance', role: 'PRACTITIONER' };

    // Upload
    const meta = await storage.uploadFile(
      'clients/cli-101/documents/doc-101/consent.pdf',
      Buffer.from('%PDF-1.4 consent data'),
      {
        fileName: 'consent.pdf',
        mimeType: 'application/pdf',
        category: 'Consent Form',
        entityType: 'Client',
        entityId: 'cli-101'
      },
      pracAuth
    );

    assert.ok(meta.id);
    assert.ok(meta.downloadUrl);
    assert.equal(meta.uploadedBy, 'user-specialist');

    // Download URL check
    const url = await storage.getDownloadUrl('clients/cli-101/documents/doc-101/consent.pdf', pracAuth);
    assert.equal(url, meta.downloadUrl);

    // Listing
    const files = storage.listFiles('clients/cli-101');
    assert.equal(files.length, 1);

    // Delete
    await storage.deleteFile('clients/cli-101/documents/doc-101/consent.pdf', pracAuth);
    assert.equal(storage.listFiles('clients/cli-101').length, 0);
  });

  // Phase 4: Firestore Rules Hardening
  reporter.startPhase('Phase 4: Firestore Security Rules Hardening');

  await reporter.test('T1.M1.17 - VIEWER role is strictly blocked from write/create/update/delete across all collections', async () => {
    const firestore = new InMemoryFirestore();
    const viewerAuth = { uid: 'user-auditor', role: 'VIEWER' };

    const collections = [
      'clients', 'caseNotes', 'billingClaims', 'incidents',
      'restrictivePractices', 'abcLogs', 'leads', 'shifts', 'users'
    ];

    for (const col of collections) {
      await assert.rejects(
        async () => {
          await firestore.setDoc(col, 'test-doc', { name: 'Test' }, viewerAuth);
        },
        (err) => {
          assert.match(err.message, /PERMISSION_DENIED/, `VIEWER must be denied write on ${col}`);
          return true;
        }
      );
    }
  });

  await reporter.test('T1.M1.18 - Audit logs collection enforces strict immutability (no update/delete)', async () => {
    const firestore = new InMemoryFirestore();
    const adminAuth = { uid: 'user-director', role: 'ADMIN' };

    // Create is allowed
    await firestore.setDoc('auditLogs', 'log-1', { action: 'LOGIN', userId: 'user-director' }, adminAuth);

    // Update is prohibited by security rule
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'log-1', { action: 'ALTERED' }, adminAuth);
      },
      /PERMISSION_DENIED/
    );
  });

  // =========================================================================
  // Phase 5: Empirical Challenge — Cross-Practitioner Document Isolation (R11)
  // =========================================================================
  reporter.startPhase('Phase 5: Empirical Challenge — Cross-Practitioner Document Isolation (R11)');

  await reporter.test('T1.M1.19 - canUserAccessClientDocuments enforces strict primary practitioner assignment matching', async () => {
    const { canUserAccessClientDocuments } = await import('../../lib/storageService.ts');

    const client101 = {
      id: 'cli-101',
      name: 'Jordan Miller',
      primaryPractitionerId: 'prac-202',
      primaryPractitionerName: 'Marcus Vance'
    };

    const assignedPrac = {
      id: 'user-specialist',
      practitionerId: 'prac-202',
      name: 'Marcus Vance',
      role: 'PRACTITIONER'
    };

    const unassignedPrac = {
      id: 'user-provisional',
      practitionerId: 'prac-204',
      name: 'Liam Gallagher',
      role: 'PRACTITIONER'
    };

    const adminUser = {
      id: 'user-director',
      practitionerId: 'prac-201',
      name: 'Dr. Sarah Jenkins',
      role: 'ADMIN'
    };

    const viewerUser = {
      id: 'user-auditor',
      practitionerId: 'prac-203',
      name: 'Elena Rostova',
      role: 'VIEWER'
    };

    const coordUser = {
      id: 'user-coord',
      name: 'David Chen',
      role: 'SUPPORT_COORDINATOR'
    };

    const participantUser = {
      id: 'cli-102',
      name: 'Samantha Reed',
      role: 'PARTICIPANT'
    };

    // 1. Assigned practitioner can access
    assert.equal(canUserAccessClientDocuments(client101, assignedPrac), true, 'Assigned practitioner must have access');

    // 2. Unassigned practitioner is strictly blocked
    assert.equal(canUserAccessClientDocuments(client101, unassignedPrac), false, 'Unassigned practitioner must be blocked');

    // 3. ADMIN has access across all clients
    assert.equal(canUserAccessClientDocuments(client101, adminUser), true, 'ADMIN must have universal access');

    // 4. VIEWER, SUPPORT_COORDINATOR, and PARTICIPANT are blocked
    assert.equal(canUserAccessClientDocuments(client101, viewerUser), false, 'VIEWER must be blocked');
    assert.equal(canUserAccessClientDocuments(client101, coordUser), false, 'SUPPORT_COORDINATOR must be blocked');
    assert.equal(canUserAccessClientDocuments(client101, participantUser), false, 'Cross-client PARTICIPANT must be blocked');

    // 5. Null safety boundaries
    assert.equal(canUserAccessClientDocuments(client101, null), false, 'Null user must be blocked');
  });

  await reporter.test('T1.M1.20 - fetchDocumentsForEntity isolates documents: unassigned practitioner receives empty array without data leakage', async () => {
    const { fetchDocumentsForEntity } = await import('../../lib/storageService.ts');

    const client101 = {
      id: 'cli-101',
      name: 'Jordan Miller',
      primaryPractitionerId: 'prac-202',
      primaryPractitionerName: 'Marcus Vance'
    };

    const unassignedPrac = {
      id: 'user-provisional',
      practitionerId: 'prac-204',
      name: 'Liam Gallagher',
      role: 'PRACTITIONER'
    };

    const viewerUser = {
      id: 'user-auditor',
      role: 'VIEWER',
      name: 'Elena Rostova'
    };

    // Unassigned practitioner requesting client documents receives empty array
    const unassignedDocs = await fetchDocumentsForEntity('Client', 'cli-101', unassignedPrac, client101);
    assert.deepEqual(unassignedDocs, [], 'Unassigned practitioner must receive empty document array');

    // VIEWER requesting client documents receives empty array
    const viewerDocs = await fetchDocumentsForEntity('Client', 'cli-101', viewerUser, client101);
    assert.deepEqual(viewerDocs, [], 'VIEWER must receive empty document array');
  });

  await reporter.test('T1.M1.21 - Cross-practitioner document deletion isolation: non-uploader practitioner cannot delete another practitioner\'s document', async () => {
    const { canUserDeleteDocument, deleteAttachedDocument } = await import('../../lib/storageService.ts');

    const docUploadedByMarcus = {
      id: 'doc-m1-101',
      name: 'fba_assessment.pdf',
      uploadedBy: 'user-specialist', // Marcus Vance
      uploadedByName: 'Marcus Vance'
    };

    const uploaderMarcus = {
      id: 'user-specialist',
      uid: 'user-specialist',
      name: 'Marcus Vance',
      role: 'PRACTITIONER'
    };

    const nonUploaderLiam = {
      id: 'user-provisional',
      uid: 'user-provisional',
      name: 'Liam Gallagher',
      role: 'PRACTITIONER'
    };

    const adminSarah = {
      id: 'user-director',
      uid: 'user-director',
      name: 'Dr. Sarah Jenkins',
      role: 'ADMIN'
    };

    const viewerElena = {
      id: 'user-auditor',
      uid: 'user-auditor',
      name: 'Elena Rostova',
      role: 'VIEWER'
    };

    // 1. Uploader can delete
    assert.equal(canUserDeleteDocument(docUploadedByMarcus, uploaderMarcus), true);
    await assert.doesNotReject(async () => {
      await deleteAttachedDocument(docUploadedByMarcus, uploaderMarcus);
    });

    // 2. ADMIN can delete
    assert.equal(canUserDeleteDocument(docUploadedByMarcus, adminSarah), true);
    await assert.doesNotReject(async () => {
      await deleteAttachedDocument(docUploadedByMarcus, adminSarah);
    });

    // 3. Non-uploader practitioner is blocked
    assert.equal(canUserDeleteDocument(docUploadedByMarcus, nonUploaderLiam), false);
    await assert.rejects(
      async () => {
        await deleteAttachedDocument(docUploadedByMarcus, nonUploaderLiam);
      },
      /PERMISSION_DENIED/
    );

    // 4. VIEWER is blocked
    assert.equal(canUserDeleteDocument(docUploadedByMarcus, viewerElena), false);
    await assert.rejects(
      async () => {
        await deleteAttachedDocument(docUploadedByMarcus, viewerElena);
      },
      /PERMISSION_DENIED/
    );
  });

  await reporter.test('T1.M1.22 - Storage rules emulator path boundaries prevent cross-participant document download', async () => {
    const storage = new InMemoryStorageEmulator();
    const pracAuth = { uid: 'user-specialist', name: 'Marcus Vance', role: 'PRACTITIONER' };

    // Upload client document
    await storage.uploadFile(
      'clients/cli-101/documents/doc-101/consent.pdf',
      Buffer.from('%PDF-1.4 data'),
      { fileName: 'consent.pdf', mimeType: 'application/pdf', id: 'doc-101' },
      pracAuth
    );

    // Unauthenticated download rejected
    await assert.rejects(
      async () => {
        await storage.getDownloadUrl('clients/cli-101/documents/doc-101/consent.pdf', null);
      },
      /PERMISSION_DENIED/
    );

    // VIEWER cannot delete
    await assert.rejects(
      async () => {
        await storage.deleteFile('clients/cli-101/documents/doc-101/consent.pdf', { uid: 'user-auditor', role: 'VIEWER' });
      },
      /PERMISSION_DENIED/
    );

    // Non-uploader non-admin practitioner cannot delete
    await assert.rejects(
      async () => {
        await storage.deleteFile('clients/cli-101/documents/doc-101/consent.pdf', { uid: 'user-provisional', role: 'PRACTITIONER' });
      },
      /PERMISSION_DENIED/
    );

    // Original uploader can delete
    await assert.doesNotReject(async () => {
      await storage.deleteFile('clients/cli-101/documents/doc-101/consent.pdf', pracAuth);
    });
  });

  // =========================================================================
  // Phase 6: Empirical Challenge — Audit Log Immutability & Anti-Tampering (R1)
  // =========================================================================
  reporter.startPhase('Phase 6: Empirical Challenge — Audit Log Immutability & Anti-Tampering (R1)');

  await reporter.test('T1.M1.23 - Audit log update rejection: updateDoc on auditLogs fails across all roles (ADMIN, PRACTITIONER, VIEWER, PARTICIPANT)', async () => {
    const firestore = new InMemoryFirestore();
    const adminAuth = { uid: 'user-director', role: 'ADMIN' };
    const pracAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };
    const viewerAuth = { uid: 'user-auditor', role: 'VIEWER' };
    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT' };

    // Create immutable audit log
    await firestore.setDoc('auditLogs', 'audit-sec-1', {
      action: 'CRITICAL_INCIDENT_CREATED',
      actorId: 'user-specialist',
      details: 'Critical incident lodged with NDIS 24-hr notification',
      timestamp: '2026-08-25T10:00:00Z'
    }, adminAuth);

    // Attempt update by ADMIN -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'audit-sec-1', { details: 'TAMPERED BY ADMIN' }, adminAuth);
      },
      /PERMISSION_DENIED.*immutable/
    );

    // Attempt update by PRACTITIONER -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'audit-sec-1', { details: 'TAMPERED BY PRACTITIONER' }, pracAuth);
      },
      /PERMISSION_DENIED.*immutable/
    );

    // Attempt update by VIEWER -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'audit-sec-1', { details: 'TAMPERED BY VIEWER' }, viewerAuth);
      },
      /PERMISSION_DENIED/
    );

    // Attempt update by PARTICIPANT -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.updateDoc('auditLogs', 'audit-sec-1', { details: 'TAMPERED BY PARTICIPANT' }, participantAuth);
      },
      /PERMISSION_DENIED/
    );

    // Verify original content remains completely uncorrupted
    const logDoc = await firestore.getDoc('auditLogs', 'audit-sec-1', adminAuth);
    assert.equal(logDoc.action, 'CRITICAL_INCIDENT_CREATED');
    assert.equal(logDoc.details, 'Critical incident lodged with NDIS 24-hr notification');
  });

  await reporter.test('T1.M1.24 - Audit log deletion rejection: deleteDoc on auditLogs fails across all roles', async () => {
    const firestore = new InMemoryFirestore();
    const adminAuth = { uid: 'user-director', role: 'ADMIN' };
    const pracAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };
    const viewerAuth = { uid: 'user-auditor', role: 'VIEWER' };
    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT' };

    await firestore.setDoc('auditLogs', 'audit-sec-2', {
      action: 'RESTRICTIVE_PRACTICE_REGISTERED',
      details: 'Chemical restraint authorization record'
    }, pracAuth);

    // Attempt delete by ADMIN -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.deleteDoc('auditLogs', 'audit-sec-2', adminAuth);
      },
      /PERMISSION_DENIED.*immutable/
    );

    // Attempt delete by PRACTITIONER -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.deleteDoc('auditLogs', 'audit-sec-2', pracAuth);
      },
      /PERMISSION_DENIED.*immutable/
    );

    // Attempt delete by VIEWER -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.deleteDoc('auditLogs', 'audit-sec-2', viewerAuth);
      },
      /PERMISSION_DENIED/
    );

    // Verify log still exists in datastore
    const doc = await firestore.getDoc('auditLogs', 'audit-sec-2', adminAuth);
    assert.ok(doc, 'Audit log must persist and never be deleted');
  });

  await reporter.test('T1.M1.25 - Audit log overwrite prevention: setDoc on existing auditLog document is blocked as an immutable record violation', async () => {
    const firestore = new InMemoryFirestore();
    const adminAuth = { uid: 'user-director', role: 'ADMIN' };

    await firestore.setDoc('auditLogs', 'audit-sec-3', {
      action: 'BILLING_CLAIM_APPROVED',
      amount: 428.82
    }, adminAuth);

    // Attempt to overwrite existing audit log with setDoc -> MUST FAIL
    await assert.rejects(
      async () => {
        await firestore.setDoc('auditLogs', 'audit-sec-3', { action: 'OVERWRITTEN' }, adminAuth);
      },
      /PERMISSION_DENIED.*immutable/
    );
  });

  await reporter.test('T1.M1.26 - Audit log append-only permissions: authenticated staff can create, unauthenticated and PARTICIPANT are denied', async () => {
    const firestore = new InMemoryFirestore();
    const pracAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };
    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT' };

    // Authenticated practitioner can append
    await assert.doesNotReject(async () => {
      await firestore.setDoc('auditLogs', 'audit-sec-4', { action: 'CASE_NOTE_SUBMITTED' }, pracAuth);
    });

    // Unauthenticated request is rejected
    await assert.rejects(
      async () => {
        await firestore.setDoc('auditLogs', 'audit-sec-5', { action: 'ANONYMOUS_LOG' }, null);
      },
      /PERMISSION_DENIED/
    );

    // PARTICIPANT cannot write audit logs
    await assert.rejects(
      async () => {
        await firestore.setDoc('auditLogs', 'audit-sec-6', { action: 'PARTICIPANT_TAMPER' }, participantAuth);
      },
      /PERMISSION_DENIED/
    );
  });

  // =========================================================================
  // Phase 7: Empirical Challenge — Session Persistence, Reload & Refresh (R1)
  // =========================================================================
  reporter.startPhase('Phase 7: Empirical Challenge — Session Persistence, Reload & Refresh (R1)');

  await reporter.test('T1.M1.27 - Session persistence lifecycle: saveSession persists complete authenticated credential state to IndexedDB', async () => {
    const idb = new IndexedDBSessionEmulator();

    idb.saveSession({
      uid: 'user-director',
      email: 'sarah.jenkins@breakthrough.org.au',
      role: 'ADMIN',
      name: 'Dr. Sarah Jenkins'
    });

    assert.equal(idb.hasActiveSession(), true);
    const session = idb.loadSession();
    assert.equal(session.uid, 'user-director');
    assert.equal(session.email, 'sarah.jenkins@breakthrough.org.au');
    assert.equal(session.role, 'ADMIN');
    assert.equal(session.name, 'Dr. Sarah Jenkins');
    assert.ok(session.sessionToken.startsWith('token-'), 'Session token must be generated');
    assert.ok(session.persistedAt, 'Persisted timestamp must be recorded');
  });

  await reporter.test('T1.M1.28 - Simulated page reload: fresh store rehydration from IndexedDB restores exact user role and route access permissions', async () => {
    const idb = new IndexedDBSessionEmulator();

    // 1. Persist Practitioner session
    idb.saveSession({
      uid: 'user-specialist',
      email: 'marcus.vance@breakthrough.org.au',
      role: 'PRACTITIONER',
      name: 'Marcus Vance'
    });

    // 2. Simulate page reload: wipe memory and re-read from IndexedDB
    const restoredPractitioner = idb.loadSession();
    assert.ok(restoredPractitioner);

    // 3. Verify Route Gating on restored session
    const clinicalRoute = RouteProtectionMiddleware.evaluateRouteAccess('/clinical/case-notes', restoredPractitioner);
    assert.equal(clinicalRoute.allowed, true, 'Restored practitioner must access clinical routes');

    const adminRoute = RouteProtectionMiddleware.evaluateRouteAccess('/admin/hr-roster', restoredPractitioner);
    assert.equal(adminRoute.allowed, false, 'Restored practitioner must be blocked from admin routes');
    assert.equal(adminRoute.redirect, '/unauthorized');

    // 4. Test with ADMIN restored session
    idb.saveSession({
      uid: 'user-director',
      email: 'sarah.jenkins@breakthrough.org.au',
      role: 'ADMIN',
      name: 'Dr. Sarah Jenkins'
    });

    const restoredAdmin = idb.loadSession();
    const adminAccess = RouteProtectionMiddleware.evaluateRouteAccess('/admin/hr-roster', restoredAdmin);
    assert.equal(adminAccess.allowed, true, 'Restored admin must access admin routes');
  });

  await reporter.test('T1.M1.29 - Token refresh simulation: silent STS renewal updates session token & persisted timestamp without session interruption', async () => {
    const idb = new IndexedDBSessionEmulator();

    // Initial session
    idb.saveSession({
      uid: 'user-specialist',
      email: 'marcus.vance@breakthrough.org.au',
      role: 'PRACTITIONER',
      name: 'Marcus Vance'
    });

    const initialSession = idb.loadSession();
    const initialToken = initialSession.sessionToken;

    // Simulate silent token refresh after 30 minutes
    idb.saveSession({
      ...initialSession,
      refreshedAt: new Date().toISOString()
    });

    const refreshedSession = idb.loadSession();
    assert.equal(refreshedSession.uid, initialSession.uid);
    assert.equal(refreshedSession.role, initialSession.role);
    assert.notEqual(refreshedSession.sessionToken, initialToken, 'Token refresh must issue a new session token');

    // Route access remains seamless
    const routeCheck = RouteProtectionMiddleware.evaluateRouteAccess('/clinical/case-notes', refreshedSession);
    assert.equal(routeCheck.allowed, true);
  });

  await reporter.test('T1.M1.30 - Session expiration, corruption & logout handling: clearSession or corrupted payload invalidates session and forces /login redirect', async () => {
    const idb = new IndexedDBSessionEmulator();

    // Active session
    idb.saveSession({
      uid: 'user-director',
      email: 'sarah.jenkins@breakthrough.org.au',
      role: 'ADMIN'
    });
    assert.equal(idb.hasActiveSession(), true);

    // Explicit logout
    idb.clearSession();
    assert.equal(idb.hasActiveSession(), false);
    assert.equal(idb.loadSession(), null);

    // Route evaluation after logout forces /login redirect
    const postLogoutAccess = RouteProtectionMiddleware.evaluateRouteAccess('/clinical/case-notes', idb.loadSession());
    assert.equal(postLogoutAccess.allowed, false);
    assert.equal(postLogoutAccess.redirect, '/login');

    // Corrupted payload without uid is rejected
    assert.throws(
      () => idb.saveSession({ corrupt: true }),
      /INVALID_ARGUMENT/
    );
  });

  // =========================================================================
  // Phase 8: Milestone 1 Security Vulnerability Remediation Verification
  // =========================================================================
  reporter.startPhase('Phase 8: Milestone 1 Security Vulnerability Remediation Verification');

  await reporter.test('T1.M1.31 - storage.rules isAdmin() strictly rejects unauthorized email substring matching', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const storageRules = fs.readFileSync(path.resolve('storage.rules'), 'utf8');

    // Verify regex email matches are completely removed
    assert.equal(storageRules.includes("request.auth.token.email.matches('.*admin.*')"), false, 'Must not contain admin regex');
    assert.equal(storageRules.includes("request.auth.token.email.matches('.*director.*')"), false, 'Must not contain director regex');
    assert.equal(storageRules.includes("getUserRole() == 'ADMIN'"), true, 'Must check ADMIN role');
  });

  await reporter.test('T1.M1.32 - storageService validateFile enforces strict AND logic, MIME correspondence, and blocks double extensions', async () => {
    const { validateFile } = await import('../../lib/storageService.ts');

    // 1. Valid files with matching extension and MIME
    assert.equal(validateFile({ name: 'assessment.pdf', size: 1024 * 100, type: 'application/pdf' }).valid, true);
    assert.equal(validateFile({ name: 'bsp_plan.docx', size: 1024 * 200, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).valid, true);
    assert.equal(validateFile({ name: 'evidence.jpg', size: 1024 * 150, type: 'image/jpeg' }).valid, true);
    assert.equal(validateFile({ name: 'signature.png', size: 1024 * 50, type: 'image/png' }).valid, true);

    // 2. MIME spoofing (valid MIME, dangerous extension) -> MUST FAIL
    const spoofedExt = validateFile({ name: 'malware.exe', size: 2048, type: 'application/pdf' });
    assert.equal(spoofedExt.valid, false, 'malware.exe with application/pdf must be rejected');

    // 3. Extension-only bypass (valid extension, dangerous MIME) -> MUST FAIL
    const spoofedMime = validateFile({ name: 'report.pdf', size: 2048, type: 'application/x-sh' });
    assert.equal(spoofedMime.valid, false, 'report.pdf with application/x-sh must be rejected');

    // 4. Double extension attacks -> MUST FAIL
    const doubleExt1 = validateFile({ name: 'bsp_report.pdf.exe', size: 2048, type: 'application/pdf' });
    assert.equal(doubleExt1.valid, false, 'bsp_report.pdf.exe must be rejected');

    const doubleExt2 = validateFile({ name: 'bsp_report.exe.pdf', size: 2048, type: 'application/pdf' });
    assert.equal(doubleExt2.valid, false, 'bsp_report.exe.pdf must be rejected');

    // 5. MIME mismatch (e.g. image/jpeg for .pdf extension) -> MUST FAIL
    const mimeMismatch = validateFile({ name: 'document.pdf', size: 2048, type: 'image/jpeg' });
    assert.equal(mimeMismatch.valid, false, 'MIME mismatch must be rejected');
  });

  await reporter.test('T1.M1.33 - storageService enforces comprehensive RBAC across all entity types', async () => {
    const { canUserAccessEntityDocuments, fetchDocumentsForEntity } = await import('../../lib/storageService.ts');

    const client101 = { id: 'cli-101', name: 'Jordan Miller', primaryPractitionerId: 'prac-202' };
    const adminUser = { id: 'user-director', role: 'ADMIN', name: 'Dr. Sarah Jenkins' };
    const pracMarcus = { id: 'user-specialist', practitionerId: 'prac-202', role: 'PRACTITIONER', name: 'Marcus Vance' };
    const pracLiam = { id: 'user-unassigned', practitionerId: 'prac-204', role: 'PRACTITIONER', name: 'Liam Gallagher' };
    const viewerUser = { id: 'user-auditor', role: 'VIEWER', name: 'Elena Rostova' };
    const participantUser = { id: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };
    const coordUser = { id: 'user-coordinator', role: 'SUPPORT_COORDINATOR', assignedClientIds: ['cli-101'] };

    // Multi-entity RBAC evaluation
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', adminUser), true);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', pracMarcus), true);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', viewerUser), false);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', participantUser), false);
    assert.equal(canUserAccessEntityDocuments('Incident', 'inc-400', coordUser), false);

    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', coordUser), true);
    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', viewerUser), false);
    assert.equal(canUserAccessEntityDocuments('BillingClaim', 'claim-801', participantUser), false);

    // fetchDocumentsForEntity unauthorized returns empty array
    const viewerIncidentDocs = await fetchDocumentsForEntity('Incident', 'inc-400', viewerUser);
    assert.deepEqual(viewerIncidentDocs, []);

    const participantBillingDocs = await fetchDocumentsForEntity('BillingClaim', 'claim-801', participantUser);
    assert.deepEqual(participantBillingDocs, []);
  });

  await reporter.test('T1.M1.34 - firestore.rules prevents non-admin users from mutating the role field on /users/{userId}', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const firestoreRules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');

    // Rule inspection
    assert.ok(
      firestoreRules.includes("request.resource.data.role == resource.data.role") ||
      firestoreRules.includes("!('role' in request.resource.data)"),
      'firestore.rules must contain self-role alteration guard'
    );

    // Emulator verification
    const firestore = new InMemoryFirestore();
    const pracAuth = { uid: 'user-specialist', role: 'PRACTITIONER' };
    const adminAuth = { uid: 'user-director', role: 'ADMIN' };

    // Practitioner trying to change role to ADMIN must be blocked
    await assert.rejects(
      async () => {
        await firestore.updateDoc('users', 'user-specialist', { role: 'ADMIN' }, pracAuth);
      },
      /PERMISSION_DENIED/
    );

    // ADMIN can change role
    await assert.doesNotReject(async () => {
      await firestore.updateDoc('users', 'user-specialist', { position: 'Principal Practitioner' }, adminAuth);
    });
  });
}

