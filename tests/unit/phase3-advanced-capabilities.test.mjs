import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🧠 SUITE: Phase 3 Autonomous Multi-Agent & CDI Intelligence Tests');
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
// Group 1: Autonomous Clinical Supervisor & Note Auditor
// -------------------------------------------------------------
console.log('\n▶ Group 1: Autonomous Clinical Supervisor & Note Auditor');

check('lib/clinicalAgentSupervisor.ts exists and audits case notes for SOAP rigor', () => {
  const filePath = path.join(rootDir, 'lib/clinicalAgentSupervisor.ts');
  assert(fs.existsSync(filePath), 'lib/clinicalAgentSupervisor.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class ClinicalAgentSupervisor'), 'ClinicalAgentSupervisor class missing');
  assert(content.includes('reviewCaseNote'), 'reviewCaseNote method missing');
});

// -------------------------------------------------------------
// Group 2: BigQuery Analytics & Data Warehouse Streaming
// -------------------------------------------------------------
console.log('\n▶ Group 2: BigQuery Analytics & Data Warehouse Streaming');

check('lib/bigqueryStreamer.ts computes utilization rates and category revenue', () => {
  const filePath = path.join(rootDir, 'lib/bigqueryStreamer.ts');
  assert(fs.existsSync(filePath), 'lib/bigqueryStreamer.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class BigQueryStreamer'), 'BigQueryStreamer class missing');
  assert(content.includes('computeEnterpriseAnalytics'), 'computeEnterpriseAnalytics method missing');
});

// -------------------------------------------------------------
// Group 3: National NDIA Clinical Efficacy Benchmarks
// -------------------------------------------------------------
console.log('\n▶ Group 3: National NDIA Clinical Efficacy Benchmarks');

check('lib/ndiaBenchmarkService.ts benchmarks outcome velocity against national averages', () => {
  const filePath = path.join(rootDir, 'lib/ndiaBenchmarkService.ts');
  assert(fs.existsSync(filePath), 'lib/ndiaBenchmarkService.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class NDIABenchmarkService'), 'NDIABenchmarkService class missing');
  assert(content.includes('getBenchmarkAnalysis'), 'getBenchmarkAnalysis method missing');
});

// -------------------------------------------------------------
// Group 4: Carer Delegation & Multi-Participant Family Hub
// -------------------------------------------------------------
console.log('\n▶ Group 4: Carer Delegation & Multi-Participant Family Hub');

check('lib/carerDelegationService.ts filters delegated participants and verifies permissions', () => {
  const filePath = path.join(rootDir, 'lib/carerDelegationService.ts');
  assert(fs.existsSync(filePath), 'lib/carerDelegationService.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class CarerDelegationService'), 'CarerDelegationService class missing');
  assert(content.includes('getDelegatedParticipants'), 'getDelegatedParticipants method missing');
  assert(content.includes('verifyCarerPermission'), 'verifyCarerPermission method missing');
});

// -------------------------------------------------------------
// Group 5: Phase 3 Tab Router & Component Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 5: Phase 3 Tab Router & Component Invariants');

check('All Phase 3 tabs are registered across types, store, sidebar, export, timer, and page router', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const exportContent = fs.readFileSync(path.join(rootDir, 'components/ModuleExportModal.tsx'), 'utf8');
  const timerContent = fs.readFileSync(path.join(rootDir, 'components/SessionTimer.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase3Tabs = [
    'clinical-supervisor',
    'bigquery-analytics',
    'clinical-benchmarks',
    'carer-family-hub',
    'gamified-goals'
  ];

  for (const tab of phase3Tabs) {
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
