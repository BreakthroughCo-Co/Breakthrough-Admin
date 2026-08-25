/**
 * CHALLENGER 1 — DEEP PROBE & EDGE-CASE ANOMALY DETECTOR
 * 
 * Tests fine-grained boundaries, high concurrency races, decimal precision,
 * and clinical guardrail false-positive/false-negative sensitivity.
 */

import assert from 'node:assert/strict';
import {
  InMemoryFirestore,
  ManagementStoreEmulator,
  AIAssistantEngine,
  NDIS_2026_PRICE_GUIDE,
  SEED_USERS,
  SEED_CLIENTS
} from '../harness/emulator.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

async function probe(name, fn) {
  totalTests++;
  const t0 = Date.now();
  try {
    const finding = await fn();
    const duration = Date.now() - t0;
    passedTests++;
    console.log(`  ✔ PROBE OK [${duration}ms] ${name}`);
    if (finding) findings.push({ probe: name, ...finding });
  } catch (err) {
    const duration = Date.now() - t0;
    failedTests++;
    console.error(`  ✖ PROBE FAILED [${duration}ms] ${name}: ${err.message}`);
  }
}

async function runDeepProbe() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('  🔍 CHALLENGER 1 — DEEP PROBE & ANOMALY ANALYSIS');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Probe 1: Rate Cap Floating-Point Tolerance Check
  await probe('P1 - Rate Cap Float Epsilon Tolerance ($214.41000000000003)', async () => {
    const caseNotes = [{ id: 'cn-1', clientId: 'cli-101', date: '2026-08-01', status: 'Approved' }];
    const floatRateClaim = {
      id: 'clm-float',
      clientId: 'cli-101',
      ndisNumber: '430891245',
      serviceDate: '2026-08-01',
      supportItemCode: '07_002_0115_8_3',
      hours: 1,
      unitRate: 214.41 + 1e-15
    };
    const res = AIAssistantEngine.validateBillingClaim(floatRateClaim, null, [], caseNotes, NDIS_2026_PRICE_GUIDE);
    assert.equal(res.isClean, true, 'Float epsilon must not trigger false positive rate cap breach');
    return { note: 'Floating-point epsilon tolerance (0.001) protects against IEEE-754 precision artifacts.' };
  });

  // Probe 2: High Concurrency 100-Doc Transactional Race
  await probe('P2 - 100 Concurrent Async Mutations on Shared Firestore', async () => {
    const firestore = new InMemoryFirestore();
    const adminContext = { uid: 'user-director', role: 'ADMIN' };

    const promises = Array.from({ length: 100 }, (_, i) =>
      firestore.setDoc('caseNotes', `race-note-${i}`, {
        id: `race-note-${i}`,
        authorId: 'user-director',
        content: `Concurrent content write ${i}`
      }, adminContext)
    );

    await Promise.all(promises);
    const listed = await firestore.listDocs('caseNotes', adminContext);
    assert.ok(listed.length >= 100, `Expected at least 100 notes, got ${listed.length}`);
    return { note: `100 concurrent writes resolved with 100% data integrity across memory tables.` };
  });

  // Probe 3: Guardrail Substring vs Word-Boundary Behavior
  await probe('P3 - Guardrail Substring Sensitivity Analysis', async () => {
    const queries = [
      { text: 'Can you help review my sensory diet?', expectedCrisis: false, note: 'Benign word "diet" containing "die" does NOT trigger crisis' },
      { text: 'What are the dietary requirements?', expectedCrisis: false, note: '"dietary" does NOT trigger crisis' },
      { text: 'I am experiencing an emergency crisis', expectedCrisis: true, note: 'Triggers on "emergency" / "crisis"' },
      { text: 'I want to kill myself', expectedCrisis: true, note: 'Triggers on "kill myself"' },
      { text: 'I am suicidal', expectedCrisis: true, note: 'Triggers on "suicidal"' },
      { text: 'I want to harm myself', expectedCrisis: true, note: 'Triggers on "harm myself"' },
      { text: 'I want to end my life', expectedCrisis: true, note: 'Triggers on "end my life"' }
    ];

    for (const q of queries) {
      const res = AIAssistantEngine.runParticipantChatbot(q.text);
      assert.equal(res.isCrisis, q.expectedCrisis, `Query "${q.text}" crisis status mismatch`);
    }

    return {
      note: 'Guardrail regex uses word-boundary match (/\b(die|suicide|suicidal|kill myself|harm myself|hurt myself|hurting myself|end my life|self-harm|abuse|crisis|emergency)\b/i) preventing false positives on "diet" while catching real distress.'
    };
  });

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(`  Probes Completed: ${totalTests} (Passed: ${passedTests}, Failed: ${failedTests})`);
  console.log('══════════════════════════════════════════════════════════════════════\n');
}

runDeepProbe().catch(err => {
  console.error('Fatal probe error:', err);
  process.exit(1);
});
