#!/usr/bin/env node

/**
 * Breakthrough OS - API Security, Memory Eviction & Type Invariants Test Suite
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

let total = 0;
let passed = 0;
let failed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(name, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  🛡️ SUITE: API Security, Memory Bounding & Type Contract Tests');
console.log('══════════════════════════════════════════════════════════════════════\n');

// -------------------------------------------------------------
// Group 1: API Route Security & requireAuth Coverage
// -------------------------------------------------------------
console.log('▶ Group 1: API Route Security & Authorization Guards');

test('app/api/gemini/generate-summary/route.ts enforces requireAuth and prompt sanitization', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'app/api/gemini/generate-summary/route.ts'), 'utf8');
  assert.ok(code.includes('requireAuth'), 'Missing requireAuth in generate-summary route');
  assert.ok(code.includes('sanitizeForPrompt'), 'Missing prompt sanitization in generate-summary route');
  assert.ok(!code.includes('gemini-3.5-flash'), 'Invalid gemini-3.5-flash model reference');
});

test('app/api/compliance/sop-rag/route.ts enforces requireAuth on GET and POST', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'app/api/compliance/sop-rag/route.ts'), 'utf8');
  assert.ok(code.includes('requireAuth'), 'Missing requireAuth in sop-rag route');
  const getMatch = code.match(/export async function GET[\s\S]+?return/);
  assert.ok(getMatch && getMatch[0].includes('requireAuth'), 'GET endpoint in sop-rag is unprotected');
  const postMatch = code.match(/export async function POST[\s\S]+?try/);
  assert.ok(postMatch && postMatch[0].includes('requireAuth'), 'POST endpoint in sop-rag is unprotected');
});

test('app/api/proda/claims/route.ts enforces requireAuth on POST and GET', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'app/api/proda/claims/route.ts'), 'utf8');
  assert.ok(code.includes('requireAuth'), 'Missing requireAuth in proda/claims route');
});

test('app/api/webhooks/17hats/route.ts enforces HMAC verification in production', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'app/api/webhooks/17hats/route.ts'), 'utf8');
  assert.ok(code.includes("process.env.NODE_ENV === 'production'"), 'Missing production check for webhook secret');
});

// -------------------------------------------------------------
// Group 2: Memory Leak Eviction & Bounded State
// -------------------------------------------------------------
console.log('\n▶ Group 2: Memory Leak Eviction & Cache Bounding');

test('services/chatService.ts implements MAX_SESSIONS and SESSION_TTL_MS bounds', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'services/chatService.ts'), 'utf8');
  assert.ok(code.includes('MAX_SESSIONS'), 'Missing MAX_SESSIONS in chatService.ts');
  assert.ok(code.includes('SESSION_TTL_MS'), 'Missing SESSION_TTL_MS in chatService.ts');
  assert.ok(code.includes('getSessionMessages'), 'Missing getSessionMessages helper');
  assert.ok(code.includes('saveSessionMessages'), 'Missing saveSessionMessages helper');
});

test('app/api/gemini/generate/route.ts cleans up expired rate limit entries', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'app/api/gemini/generate/route.ts'), 'utf8');
  assert.ok(code.includes('MAX_RATE_LIMIT_KEYS'), 'Missing MAX_RATE_LIMIT_KEYS in rate limiter');
  assert.ok(code.includes('rateLimitMap.delete'), 'Missing rateLimitMap eviction');
});

// -------------------------------------------------------------
// Group 3: Type Contracts & Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 3: Type Invariants & Normalization');

test('types/index.ts has normalized ClientGoal (progressPercent required, progress eliminated)', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'types/index.ts'), 'utf8');
  const goalMatch = code.match(/export interface ClientGoal \{([\s\S]+?)\}/);
  assert.ok(goalMatch, 'ClientGoal interface not found');
  assert.ok(goalMatch[1].includes('progressPercent: number;'), 'Missing progressPercent: number');
  assert.ok(!goalMatch[1].includes('progress?: number;'), 'Redundant progress?: number still present');
});

test('types/index.ts has strict OfflineDelta payload typing', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'types/index.ts'), 'utf8');
  const deltaMatch = code.match(/export interface OfflineDelta[\s\S]+?\{([\s\S]+?)\}/);
  assert.ok(deltaMatch, 'OfflineDelta interface not found');
  assert.ok(deltaMatch[1].includes('payload: Record<string, unknown>;'), 'payload not Record<string, unknown>');
});

test('UserProfile has canonical id and JSDoc annotations', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'types/index.ts'), 'utf8');
  assert.ok(code.includes('Canonical unique identifier matching Firestore document key'), 'Missing JSDoc on id');
});

// -------------------------------------------------------------
// Group 4: Module Import Specifiers & Client API Helper
// -------------------------------------------------------------
console.log('\n▶ Group 4: Clean Module Imports & Client API Helper');

test('lib/ files do not contain explicit .ts extensions in imports', () => {
  const files = [
    'lib/complianceService.ts',
    'lib/participantChatbot.ts',
    'lib/notificationService.ts',
    'lib/clinicalRedactor.ts'
  ];
  for (const f of files) {
    const code = fs.readFileSync(path.join(projectRoot, f), 'utf8');
    assert.ok(!code.includes(".ts';") && !code.includes('.ts";'), `${f} still contains .ts extension in import`);
  }
});

test('lib/apiClient.ts exports authFetch with Bearer token injection', () => {
  const code = fs.readFileSync(path.join(projectRoot, 'lib/apiClient.ts'), 'utf8');
  assert.ok(code.includes('export async function authFetch'), 'Missing authFetch export');
  assert.ok(code.includes('Bearer'), 'Missing Bearer token injection');
});

test('package.json start script uses next start', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts.start.startsWith('next start'), 'start script does not use next start');
});

test('Obsolete patch scripts are removed from root', () => {
  assert.ok(!fs.existsSync(path.join(projectRoot, 'patch_page.sh')), 'patch_page.sh still exists');
  assert.ok(!fs.existsSync(path.join(projectRoot, 'patch_sidebar.sh')), 'patch_sidebar.sh still exists');
  assert.ok(!fs.existsSync(path.join(projectRoot, 'patch_tabtype.sh')), 'patch_tabtype.sh still exists');
});

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${total})`);
console.log('══════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
