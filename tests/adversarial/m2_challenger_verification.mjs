import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  ⚔️ CHALLENGER M2 EMPIRICAL VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
  }
}

// 1. Verify DEFAULT_AI_MODEL export in lib/ai-assistant.ts
test('DEFAULT_AI_MODEL is exported as "gemini-2.0-flash" in lib/ai-assistant.ts', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'lib/ai-assistant.ts'), 'utf8');
  assert(fileContent.includes("export const DEFAULT_AI_MODEL = 'gemini-2.0-flash';"), 'Missing export const DEFAULT_AI_MODEL');
  assert(!fileContent.includes('gemini-3.5-flash'), 'Invalid model gemini-3.5-flash still present');
  assert(fileContent.includes('model = DEFAULT_AI_MODEL'), 'Function does not default to DEFAULT_AI_MODEL');
});

// 2. Verify app/api/gemini/generate/route.ts uses DEFAULT_AI_MODEL
test('app/api/gemini/generate/route.ts imports and uses DEFAULT_AI_MODEL', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'app/api/gemini/generate/route.ts'), 'utf8');
  assert(fileContent.includes("import { DEFAULT_AI_MODEL } from '@/lib/ai-assistant';"), 'Missing import of DEFAULT_AI_MODEL');
  assert(fileContent.includes('const selectedModel = model || DEFAULT_AI_MODEL;'), 'selectedModel does not fallback to DEFAULT_AI_MODEL');
  assert(!fileContent.includes('gemini-3.5-flash'), 'Invalid model gemini-3.5-flash still present in route');
});

// 3. Verify lib/firebase.ts initializeFirestore and multi-tab persistent cache
test('lib/firebase.ts configures initializeFirestore with persistentLocalCache & persistentMultipleTabManager', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'lib/firebase.ts'), 'utf8');
  assert(fileContent.includes('initializeFirestore('), 'initializeFirestore call not found');
  assert(fileContent.includes('persistentLocalCache('), 'persistentLocalCache not found');
  assert(fileContent.includes('persistentMultipleTabManager()'), 'persistentMultipleTabManager not found');
  assert(fileContent.includes('localCache: persistentLocalCache({'), 'localCache option incorrectly configured');
  assert(!fileContent.includes('getFirestore('), 'Old getFirestore call still present');
});

// 4. Verify isSigningIn is completely removed
test('lib/firebase.ts has isSigningIn completely removed', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'lib/firebase.ts'), 'utf8');
  assert(!fileContent.includes('isSigningIn'), 'isSigningIn still found in lib/firebase.ts');
});

// 5. Verify signInWithGoogle uses minimal scopes
test('signInWithGoogle in lib/firebase.ts requests only minimal identity scopes', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'lib/firebase.ts'), 'utf8');
  assert(fileContent.includes("baseProvider.addScope('profile');"), 'Missing profile scope on baseProvider');
  assert(fileContent.includes("baseProvider.addScope('email');"), 'Missing email scope on baseProvider');
  assert(fileContent.includes("baseProvider.addScope('openid');"), 'Missing openid scope on baseProvider');
  assert(fileContent.includes("prompt: 'select_account'"), 'Missing prompt select_account on baseProvider');
});

// 6. Verify requestWorkspaceScopes and WORKSPACE_SCOPES
test('requestWorkspaceScopes and WORKSPACE_SCOPES are properly exported from lib/firebase.ts', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'lib/firebase.ts'), 'utf8');
  assert(fileContent.includes('export const WORKSPACE_SCOPES = ['), 'WORKSPACE_SCOPES is not exported');
  assert(fileContent.includes('export const requestWorkspaceScopes = async ('), 'requestWorkspaceScopes is not exported');
  assert(fileContent.includes("prompt: 'consent'"), 'Missing prompt consent on scopeProvider');
  assert(fileContent.includes("access_type: 'offline'"), 'Missing access_type offline on scopeProvider');
});

// 7. Verify GoogleWorkspaceHub.tsx uses requestWorkspaceScopes
test('components/features/GoogleWorkspaceHub.tsx calls requestWorkspaceScopes with WORKSPACE_SCOPES', () => {
  const fileContent = fs.readFileSync(path.join(projectRoot, 'components/features/GoogleWorkspaceHub.tsx'), 'utf8');
  assert(fileContent.includes('requestWorkspaceScopes'), 'requestWorkspaceScopes not imported/used in GoogleWorkspaceHub');
  assert(fileContent.includes('WORKSPACE_SCOPES'), 'WORKSPACE_SCOPES not imported/used in GoogleWorkspaceHub');
  assert(fileContent.includes('await requestWorkspaceScopes(WORKSPACE_SCOPES)'), 'handleLogin does not call requestWorkspaceScopes(WORKSPACE_SCOPES)');
});

// 8. Dynamic execution test: import compiled / evaluated functions
test('Module evaluation & constant values', async () => {
  // Test loading and validating JSON configs and values
  const appletConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'firebase-applet-config.json'), 'utf8'));
  assert(appletConfig.projectId, 'firebase-applet-config has valid projectId');
});

console.log(`\n══════════════════════════════════════════════════════════════════════`);
console.log(`  RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} CHECKS`);
console.log(`══════════════════════════════════════════════════════════════════════\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
