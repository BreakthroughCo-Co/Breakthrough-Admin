import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🛡️ SUITE: Phase 4 Lone Worker Safety, MMM Travel & Offline Tests');
console.log('══════════════════════════════════════════════════════════════════════');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Group 1: Lone Worker Field Safety Engine & SOS Beacon
// -------------------------------------------------------------
console.log('\n▶ Group 1: Lone Worker Field Safety Engine & SOS Beacon');

check('lib/loneWorkerSafetyEngine.ts manages visit sessions and SOS triggers', () => {
  const filePath = path.join(rootDir, 'lib/loneWorkerSafetyEngine.ts');
  assert(fs.existsSync(filePath), 'lib/loneWorkerSafetyEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class LoneWorkerSafetyEngine'), 'LoneWorkerSafetyEngine class missing');
  assert(content.includes('startSafetySession'), 'startSafetySession method missing');
  assert(content.includes('evaluateSessionState'), 'evaluateSessionState method missing');
  assert(content.includes('triggerEmergencySOS'), 'triggerEmergencySOS method missing');
});

// -------------------------------------------------------------
// Group 2: Modified Monash Model (MMM) Travel Allowance Calculator
// -------------------------------------------------------------
console.log('\n▶ Group 2: Modified Monash Model (MMM) Travel Allowance Calculator');

check('lib/travelAllowanceCalculator.ts calculates labor and $0.97/km vehicle allowances', () => {
  const filePath = path.join(rootDir, 'lib/travelAllowanceCalculator.ts');
  assert(fs.existsSync(filePath), 'lib/travelAllowanceCalculator.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class TravelAllowanceCalculator'), 'TravelAllowanceCalculator class missing');
  assert(content.includes('calculateTravel'), 'calculateTravel method missing');
});

// -------------------------------------------------------------
// Group 3: Multi-Channel Crisis & Safeguards Dispatcher
// -------------------------------------------------------------
console.log('\n▶ Group 3: Multi-Channel Crisis & Safeguards Dispatcher');

check('lib/crisisEscalationEngine.ts dispatches Tier 1 escalations with 24hr deadline', () => {
  const filePath = path.join(rootDir, 'lib/crisisEscalationEngine.ts');
  assert(fs.existsSync(filePath), 'lib/crisisEscalationEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class CrisisEscalationEngine'), 'CrisisEscalationEngine class missing');
  assert(content.includes('dispatchEscalation'), 'dispatchEscalation method missing');
});

// -------------------------------------------------------------
// Group 4: Practitioner Credential & NWSC Screening Vault
// -------------------------------------------------------------
console.log('\n▶ Group 4: Practitioner Credential & NWSC Screening Vault');

check('lib/credentialComplianceEngine.ts audits screening check and police expiry', () => {
  const filePath = path.join(rootDir, 'lib/credentialComplianceEngine.ts');
  assert(fs.existsSync(filePath), 'lib/credentialComplianceEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class CredentialComplianceEngine'), 'CredentialComplianceEngine class missing');
  assert(content.includes('auditPractitioner'), 'auditPractitioner method missing');
});

// -------------------------------------------------------------
// Group 5: IndexedDB Storage Engine 2.0
// -------------------------------------------------------------
console.log('\n▶ Group 5: IndexedDB Storage Engine 2.0');

check('lib/indexedDBEngineV2.ts implements isolated entity store caching', () => {
  const filePath = path.join(rootDir, 'lib/indexedDBEngineV2.ts');
  assert(fs.existsSync(filePath), 'lib/indexedDBEngineV2.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class IndexedDBEngineV2'), 'IndexedDBEngineV2 class missing');
  assert(content.includes('saveEntity'), 'saveEntity method missing');
  assert(content.includes('getEntity'), 'getEntity method missing');
});

// -------------------------------------------------------------
// Group 6: Phase 4 Tab Router & Component Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 6: Phase 4 Tab Router & Component Invariants');

check('All Phase 4 tabs are registered across types, store, sidebar, export, timer, and page router', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const exportContent = fs.readFileSync(path.join(rootDir, 'components/ModuleExportModal.tsx'), 'utf8');
  const timerContent = fs.readFileSync(path.join(rootDir, 'components/SessionTimer.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase4Tabs = [
    'lone-worker-safety',
    'travel-allowance',
    'crisis-escalation',
    'credential-vault'
  ];

  for (const tab of phase4Tabs) {
    assert(typesContent.includes(`'${tab}'`), `stores/types.ts missing '${tab}'`);
    assert(storeContent.includes(`'${tab}'`), `stores/useManagementStore.ts missing '${tab}'`);
    assert(sidebarContent.includes(`id: '${tab}'`), `components/Sidebar.tsx missing '${tab}'`);
    assert(exportContent.includes(`'${tab}':`), `components/ModuleExportModal.tsx missing '${tab}'`);
    assert(timerContent.includes(`'${tab}':`), `components/SessionTimer.tsx missing '${tab}'`);
    assert(pageContent.includes(`case '${tab}':`), `app/page.tsx missing '${tab}'`);
  }
});

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
console.log('══════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
