/**
 * Milestone 5 Verification Test Suite: Participant Portal, PWA & AI Chatbot (R14, R15, R16)
 * 
 * Tests:
 * 1. R14: Participant & Carer Portal & Clinical Redaction Engine
 * 2. R15: Progressive Web App (PWA) Offline Caching & Background Sync
 * 3. R16: AI Participant & Carer Chatbot with Clinical Guardrails & Escalations
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  ParticipantPortalEmulator,
  PWAOfflineServiceEmulator,
  AIAssistantEngine,
  SEED_CLIENTS,
  SEED_SHIFTS,
  SEED_CASE_NOTES,
  SEED_INCIDENTS,
  redactClinicalText,
  redactCaseNote,
  batchRedactNotes,
  getParticipantReadableIncidents,
  CLINICAL_JARGON_DICTIONARY,
  runParticipantChatbotQuery
} from '../harness/emulator.mjs';

export async function runMilestone5Tests(reporter) {
  reporter.startSuite('Milestone 5: Participant Portal, PWA & AI Chatbot (R14, R15, R16)');

  // =========================================================================
  // PHASE 1: R14 — PARTICIPANT & CARER PORTAL & CLINICAL REDACTION ENGINE
  // =========================================================================
  reporter.startPhase('Phase 1: R14 — Participant & Carer Portal & Clinical Redaction Engine');

  await reporter.test('T5.1.1 - Participant role authentication isolates session strictly to participant own profile and records', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };

    const dashboard = ParticipantPortalEmulator.getParticipantDashboard('cli-101', participantAuth, store);
    assert.ok(dashboard);
    assert.equal(dashboard.participantProfile.name, 'Jordan Miller');
    assert.equal(dashboard.participantProfile.ndisNumber, '430891245');
    assert.equal(dashboard.budgetOverview.totalBudget, 48500);
    assert.equal(dashboard.budgetOverview.spentBudget, 24350);
  });

  await reporter.test('T5.1.2 - Attempting to access another participant dashboard is rejected with PERMISSION_DENIED', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };

    assert.throws(
      () => ParticipantPortalEmulator.getParticipantDashboard('cli-102', participantAuth, store),
      /PERMISSION_DENIED/
    );
  });

  await reporter.test('T5.1.3 - Clinical text redactor translates technical PBS jargon into supportive plain English', async () => {
    const technicalText = 'Participant presented with autonomic agitation and secondary escape avoidance. Recommended DRI schedule and FCT replacement skills.';
    const plainText = redactClinicalText(technicalText);

    assert.ok(!plainText.includes('autonomic agitation'));
    assert.ok(!plainText.includes('DRI schedule'));
    assert.ok(!plainText.includes('escape avoidance'));
    assert.ok(plainText.includes('stress responses'));
    assert.ok(plainText.includes('positive behaviour reward plan'));
  });

  await reporter.test('T5.1.4 - Case note redactor creates structured plain-language summary with highlights & suggestions', async () => {
    const complexNote = {
      id: 'note-complex-2026',
      clientId: 'cli-101',
      practitionerName: 'Dr. Sarah Jenkins',
      date: '2026-08-20',
      subjective: 'Participant exhibited Level 3 autonomic agitation with sensory overload during visual task sequencing.',
      objective: 'Delivered 60 mins PBS replacement skill reinforcement and differential DRI schedule.',
      assessment: 'Measurable reduction in latency to compliance observed with positive engagement.',
      plan: 'Continue weekly home practice routines.'
    };

    const redacted = redactCaseNote(complexNote);

    assert.equal(redacted.id, 'note-complex-2026');
    assert.equal(redacted.practitionerName, 'Dr. Sarah Jenkins');
    assert.equal(redacted.verified, true);
    assert.ok(!redacted.summary.includes('autonomic agitation'));
    assert.ok(!redacted.sessionSummary.includes('DRI schedule'));
    assert.ok(redacted.sessionSummary.includes('positive support session'));
    assert.ok(redacted.positiveHighlights.length > 0);
    assert.ok(redacted.skillsPracticed.length > 0);
    assert.ok(redacted.homePracticeSuggestions.length > 0);
  });

  await reporter.test('T5.1.5 - Batch case note translation processes all participant notes consistently', async () => {
    const notes = [
      { id: 'n1', subjective: 'Calm session', objective: 'Visual schedule', date: '2026-08-10' },
      { id: 'n2', subjective: 'Sensory overload', objective: 'Calming break', date: '2026-08-17' }
    ];

    const batch = batchRedactNotes(notes);
    assert.equal(batch.length, 2);
    assert.equal(batch[0].id, 'n1');
    assert.equal(batch[1].id, 'n2');
    assert.ok(batch[1].summary.includes('surroundings'));
  });

  await reporter.test('T5.1.6 - Participant portal calculates accurate budget utilization and remaining balance', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    const participantAuth = { uid: 'cli-101', role: 'PARTICIPANT', name: 'Jordan Miller' };

    const dashboard = ParticipantPortalEmulator.getParticipantDashboard('cli-101', participantAuth, store);
    const { totalBudget, spentBudget, remainingBudget, utilizationPercentage } = dashboard.budgetOverview;

    assert.equal(totalBudget, 48500);
    assert.equal(spentBudget, 24350);
    assert.equal(remainingBudget, 24150);
    assert.equal(utilizationPercentage, 50);
    assert.equal(remainingBudget + spentBudget, totalBudget);
  });

  await reporter.test('T5.1.7 - Incident sanitizer filters non-confidential incidents and redacts internal jargon', async () => {
    const rawIncidents = [
      {
        id: 'inc-101',
        clientId: 'cli-101',
        severity: 'Medium',
        incidentDate: '2026-08-14',
        type: 'Challenging Moment',
        description: 'Participant experienced sensory overload during community outing.',
        immediateActionTaken: 'Staff provided quiet space and proactive strategies.'
      },
      {
        id: 'inc-critical',
        clientId: 'cli-101',
        severity: 'Critical / Reportable',
        incidentDate: '2026-08-15',
        description: 'Internal critical investigation note.'
      },
      {
        id: 'inc-other',
        clientId: 'cli-102',
        severity: 'Medium',
        incidentDate: '2026-08-16',
        description: 'Other client incident.'
      }
    ];

    const sanitized = getParticipantReadableIncidents(rawIncidents, 'cli-101');
    assert.equal(sanitized.length, 1);
    assert.equal(sanitized[0].id, 'inc-101');
    assert.ok(!sanitized.some(i => i.id === 'inc-critical'));
    assert.ok(!sanitized.some(i => i.id === 'inc-other'));
  });

  // =========================================================================
  // PHASE 2: R15 — PROGRESSIVE WEB APP (PWA) OFFLINE FIELD ACCESS & SYNC
  // =========================================================================
  reporter.startPhase('Phase 2: R15 — Progressive Web App (PWA) Offline Caching & Sync');

  await reporter.test('T5.2.1 - Web App Manifest (manifest.json) exists and contains valid PWA configuration', async () => {
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public/');

    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(content.short_name, 'Breakthrough OS');
    assert.equal(content.display, 'standalone');
    assert.equal(content.start_url, '/');
    assert.equal(content.theme_color, '#0d9488');
    assert.ok(content.icons && content.icons.length >= 2);
  });

  await reporter.test('T5.2.2 - Standard PWA icons exist in public/icons/ directory', async () => {
    const icon192 = path.resolve(process.cwd(), 'public/icons/icon-192x192.png');
    const icon512 = path.resolve(process.cwd(), 'public/icons/icon-512x512.png');
    const iconApple = path.resolve(process.cwd(), 'public/icons/apple-touch-icon.png');

    assert.ok(fs.existsSync(icon192), 'icon-192x192.png must exist');
    assert.ok(fs.existsSync(icon512), 'icon-512x512.png must exist');
    assert.ok(fs.existsSync(iconApple), 'apple-touch-icon.png must exist');
    assert.ok(fs.statSync(icon192).size > 0);
    assert.ok(fs.statSync(icon512).size > 0);
  });

  await reporter.test('T5.2.3 - Service Worker script exists and defines multi-tier caching and sync handlers', async () => {
    const swPath = path.resolve(process.cwd(), 'public/sw.js');
    assert.ok(fs.existsSync(swPath), 'sw.js must exist in public/');

    const swContent = fs.readFileSync(swPath, 'utf8');
    assert.ok(swContent.includes('addEventListener(\'install\''));
    assert.ok(swContent.includes('addEventListener(\'fetch\''));
    assert.ok(swContent.includes('addEventListener(\'sync\''));
    assert.ok(swContent.includes('sync-clinical-notes'));
    assert.ok(swContent.includes('BACKGROUND_SYNC_TRIGGERED'));
  });

  await reporter.test('T5.2.4 - Offline creation of Case Notes queues deltas locally with optimistic state', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);
    assert.equal(store.isOnline, false);
    assert.equal(store.syncStatus, 'offline');

    await store.addCaseNote({
      id: 'note-field-draft-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      subjective: 'Drafted in rural clinic offline.',
      objective: 'Completed PBS replacement skill practice.',
      assessment: 'Steady progress.',
      plan: 'Follow-up next week.'
    });

    // Optimistic local state updated
    assert.ok(store.caseNotes.some(n => n.id === 'note-field-draft-1'));
    assert.equal(store.offlineQueue.length, 1);
    assert.equal(store.offlineQueue[0].entityId, 'note-field-draft-1');
  });

  await reporter.test('T5.2.5 - Offline creation of ABC Behaviour Logs queues deltas locally', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    await store.addABCLog({
      id: 'abc-field-draft-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      antecedent: 'Transition from recess to visual schedule',
      behavior: 'Vocal frustration for 2 minutes',
      consequence: 'Offered calming deep breathing break',
      perceivedFunction: 'Escape/Avoidance'
    });

    assert.ok(store.abcLogs.some(a => a.id === 'abc-field-draft-1'));
    assert.equal(store.offlineQueue.length, 1);
    assert.equal(store.offlineQueue[0].entity, 'ABCLog');
  });

  await reporter.test('T5.2.6 - Offline creation of Incident Reports queues deltas locally', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);

    store.setOnlineStatus(false);

    await store.addIncident({
      id: 'inc-field-draft-1',
      clientId: 'cli-101',
      clientName: 'Jordan Miller',
      severity: 'Medium',
      description: 'Minor slip in garden during sensory walk',
      immediateActionTaken: 'First aid applied and participant reassured'
    });

    assert.ok(store.incidents.some(i => i.id === 'inc-field-draft-1'));
    assert.equal(store.offlineQueue.length, 1);
    assert.equal(store.offlineQueue[0].entity, 'Incident');
  });

  await reporter.test('T5.2.7 - Background sync detects network restoration and flushes all queued mutations to Firestore', async () => {
    const firestore = new InMemoryFirestore();
    const store = new ManagementStoreEmulator(firestore);
    const pwaService = new PWAOfflineServiceEmulator();

    // 1. Go offline and create 3 separate entities
    store.setOnlineStatus(false);
    await store.addCaseNote({ id: 'sync-note-1', clientId: 'cli-101', subjective: 'Offline note' });
    await store.addABCLog({ id: 'sync-abc-1', clientId: 'cli-101', antecedent: 'Noise' });
    await store.addIncident({ id: 'sync-inc-1', clientId: 'cli-101', severity: 'Low', description: 'Bump' });

    assert.equal(store.offlineQueue.length, 3);
    assert.equal(store.pendingChangesCount, 3);

    // 2. Network connectivity restored
    store.setOnlineStatus(true);
    assert.equal(store.isOnline, true);

    // 3. Trigger background sync
    const syncRes = await pwaService.triggerBackgroundSync(store);
    assert.equal(syncRes.synced, true);
    assert.equal(syncRes.pendingRemaining, 0);
    assert.equal(store.syncStatus, 'synced');

    // 4. Verify all records persisted in cloud database
    const docNote = await firestore.getDoc('caseNotes', 'sync-note-1', store.getAuthContext());
    const docAbc = await firestore.getDoc('abcLogs', 'sync-abc-1', store.getAuthContext());
    const docInc = await firestore.getDoc('incidents', 'sync-inc-1', store.getAuthContext());

    assert.ok(docNote, 'Note must exist in Firestore');
    assert.ok(docAbc, 'ABC Log must exist in Firestore');
    assert.ok(docInc, 'Incident must exist in Firestore');
  });

  // =========================================================================
  // PHASE 3: R16 — AI PARTICIPANT & CARER CHATBOT WITH CLINICAL GUARDRAILS
  // =========================================================================
  reporter.startPhase('Phase 3: R16 — AI Participant & Carer Chatbot & Guardrails');

  await reporter.test('T5.3.1 - Chatbot accurately computes and returns remaining plan budget details', async () => {
    const client = SEED_CLIENTS[0];
    const context = { client, appointments: [], goals: [] };

    const res = runParticipantChatbotQuery('How much budget is left in my plan?', context);
    assert.equal(res.isCrisis, false);
    assert.equal(res.isEscalated, false);
    assert.equal(res.guardrailTriggered, false);
    assert.ok(res.reply.includes('$48,500.00'));
    assert.ok(res.reply.includes('$24,350.00'));
    assert.ok(res.reply.includes('$24,150.00'));
  });

  await reporter.test('T5.3.2 - Chatbot answers upcoming appointment scheduling queries with exact shift data', async () => {
    const client = SEED_CLIENTS[0];
    const appointments = [
      {
        id: 'shift-1',
        clientId: client.id,
        date: '2026-08-28',
        startTime: '10:00',
        endTime: '11:30',
        supportType: 'Allied Health Behaviour Support',
        practitionerName: 'Marcus Vance'
      }
    ];
    const context = { client, appointments, goals: [] };

    const res = runParticipantChatbotQuery('When is my next session scheduled?', context);
    assert.ok(res.reply.includes('2026-08-28'));
    assert.ok(res.reply.includes('10:00'));
    assert.ok(res.reply.includes('Marcus Vance'));
    assert.ok(res.reply.includes('Allied Health Behaviour Support'));
  });

  await reporter.test('T5.3.3 - Chatbot answers active plan goals and progress milestone queries', async () => {
    const client = SEED_CLIENTS[0];
    const goals = [
      { id: 'g1', title: 'Emotional Self-Regulation', progressPercent: 85 },
      { id: 'g2', title: 'Community Transit Independence', progressPercent: 70 }
    ];
    const context = { client, appointments: [], goals };

    const res = runParticipantChatbotQuery('What are my current active goals?', context);
    assert.ok(res.reply.includes('Emotional Self-Regulation (85% achieved)'));
    assert.ok(res.reply.includes('Community Transit Independence (70% achieved)'));
  });

  await reporter.test('T5.3.4 - Strict medical guardrail blocks diagnostic requests with clear GP consultation warning', async () => {
    const client = SEED_CLIENTS[0];
    const context = { client, appointments: [], goals: [] };

    const diagnosticQueries = [
      'Can you diagnose if my child has autism?',
      'Does this behavior mean they have ADHD diagnosis?',
      'What medical disorder causes this?'
    ];

    for (const q of diagnosticQueries) {
      const res = runParticipantChatbotQuery(q, context);
      assert.equal(res.guardrailTriggered, true);
      assert.equal(res.isCrisis, false);
      assert.ok(res.reply.includes('cannot give medical diagnoses or medication advice'));
      assert.ok(res.reply.includes('General Practitioner'));
    }
  });

  await reporter.test('T5.3.5 - Strict medication guardrail blocks dosage change queries with prescribing doctor warning', async () => {
    const client = SEED_CLIENTS[0];
    const context = { client, appointments: [], goals: [] };

    const medicationQueries = [
      'Should I increase the Clonidine dosage to 2 pills?',
      'What prescription medication helps with anxiety?',
      'Can I change my daughter Ritalin dose?'
    ];

    for (const q of medicationQueries) {
      const res = runParticipantChatbotQuery(q, context);
      assert.equal(res.guardrailTriggered, true);
      assert.equal(res.isCrisis, false);
      assert.ok(res.reply.includes('cannot give medical diagnoses or medication advice'));
    }
  });

  await reporter.test('T5.3.6 - Safety guardrail detects crisis/emergency and immediately provides Lifeline 13 11 14 and 000 details', async () => {
    const client = SEED_CLIENTS[0];
    const context = { client, appointments: [], goals: [] };

    const crisisQueries = [
      'I want to hurt myself and do not know what to do',
      'I feel like suicide today',
      'This is an emergency someone is hurt'
    ];

    for (const q of crisisQueries) {
      const res = runParticipantChatbotQuery(q, context);
      assert.equal(res.isCrisis, true);
      assert.equal(res.isEscalated, true);
      assert.equal(res.guardrailTriggered, true);
      assert.ok(res.reply.includes('000'));
      assert.ok(res.reply.includes('13 11 14'));
      assert.ok(res.reply.includes('practitioner has been automatically alerted'));
    }
  });

  await reporter.test('T5.3.7 - Automatic escalation notifies assigned practitioner for complex clinical support requests', async () => {
    const client = {
      ...SEED_CLIENTS[0],
      primaryPractitionerName: 'Dr. Sarah Jenkins'
    };
    const context = { client, appointments: [], goals: [] };

    const complexQuery = 'Can you modify my BSP plan strategies because of violent aggression?';
    const res = runParticipantChatbotQuery(complexQuery, context);

    assert.equal(res.isEscalated, true);
    assert.equal(res.isCrisis, false);
    assert.equal(res.guardrailTriggered, true);
    assert.equal(res.escalatedTo, 'Dr. Sarah Jenkins');
    assert.ok(res.reply.includes('Dr. Sarah Jenkins'));
    assert.ok(res.reply.includes('contact you directly to discuss your support plan'));
  });

  await reporter.test('T5.3.8 - General conversational queries provide welcoming portal orientation and assistance', async () => {
    const client = SEED_CLIENTS[0];
    const context = { client, appointments: [], goals: [] };

    const res = runParticipantChatbotQuery('Hello, what can you help me with?', context);
    assert.equal(res.isCrisis, false);
    assert.equal(res.isEscalated, false);
    assert.ok(res.reply.includes('Breakthrough OS'));
    assert.ok(res.reply.includes(client.name));
  });
}
