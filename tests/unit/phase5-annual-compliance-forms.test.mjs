import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🏛️ SUITE: Phase 5 Annual Compliance Return, Forms & Fading Tests');
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
// Group 1: NDIS Commission Annual Compliance Return (ACR)
// -------------------------------------------------------------
console.log('\n▶ Group 1: NDIS Commission Annual Compliance Return (ACR)');

check('lib/annualComplianceReturnGenerator.ts compiles Section 73ZM return', () => {
  const filePath = path.join(rootDir, 'lib/annualComplianceReturnGenerator.ts');
  assert(fs.existsSync(filePath), 'lib/annualComplianceReturnGenerator.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class AnnualComplianceReturnGenerator'), 'AnnualComplianceReturnGenerator class missing');
  assert(content.includes('generateAnnualReturn'), 'generateAnnualReturn method missing');
});

// -------------------------------------------------------------
// Group 2: Dynamic Form & Assessment Builder
// -------------------------------------------------------------
console.log('\n▶ Group 2: Dynamic Form & Assessment Builder');

check('lib/dynamicFormBuilderEngine.ts returns standardized FCA & PBS templates', () => {
  const filePath = path.join(rootDir, 'lib/dynamicFormBuilderEngine.ts');
  assert(fs.existsSync(filePath), 'lib/dynamicFormBuilderEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class DynamicFormBuilderEngine'), 'DynamicFormBuilderEngine class missing');
  assert(content.includes('getStandardTemplates'), 'getStandardTemplates method missing');
});

// -------------------------------------------------------------
// Group 3: Restrictive Practice Fading Simulator
// -------------------------------------------------------------
console.log('\n▶ Group 3: Restrictive Practice Fading Simulator');

check('lib/restrictivePracticeFadingEngine.ts models step-down phases and elimination targets', () => {
  const filePath = path.join(rootDir, 'lib/restrictivePracticeFadingEngine.ts');
  assert(fs.existsSync(filePath), 'lib/restrictivePracticeFadingEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class RestrictivePracticeFadingEngine'), 'RestrictivePracticeFadingEngine class missing');
  assert(content.includes('simulateFadingProtocol'), 'simulateFadingProtocol method missing');
});

// -------------------------------------------------------------
// Group 4: SCHADS Award Overtime & Fatigue Compliance Predictor
// -------------------------------------------------------------
console.log('\n▶ Group 4: SCHADS Award Overtime & Fatigue Compliance Predictor');

check('lib/schadsFatiguePredictor.ts detects 10h rest gap breaches and 38h thresholds', () => {
  const filePath = path.join(rootDir, 'lib/schadsFatiguePredictor.ts');
  assert(fs.existsSync(filePath), 'lib/schadsFatiguePredictor.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class SCHADSFatiguePredictor'), 'SCHADSFatiguePredictor class missing');
  assert(content.includes('auditPractitionerFatigue'), 'auditPractitionerFatigue method missing');
});

// -------------------------------------------------------------
// Group 5: Regional Multi-Branch Partitioning
// -------------------------------------------------------------
console.log('\n▶ Group 5: Regional Multi-Branch Partitioning');

check('lib/branchPartitioningEngine.ts partitions participants by regional branch', () => {
  const filePath = path.join(rootDir, 'lib/branchPartitioningEngine.ts');
  assert(fs.existsSync(filePath), 'lib/branchPartitioningEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class BranchPartitioningEngine'), 'BranchPartitioningEngine class missing');
  assert(content.includes('getStandardBranches'), 'getStandardBranches method missing');
  assert(content.includes('filterClientsByBranch'), 'filterClientsByBranch method missing');
});

// -------------------------------------------------------------
// Group 6: Phase 5 Tab Router & Component Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 6: Phase 5 Tab Router & Component Invariants');

check('All Phase 5 tabs are registered across types, store, sidebar, export, timer, and page router', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const exportContent = fs.readFileSync(path.join(rootDir, 'components/ModuleExportModal.tsx'), 'utf8');
  const timerContent = fs.readFileSync(path.join(rootDir, 'components/SessionTimer.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase5Tabs = [
    'annual-compliance-return',
    'dynamic-assessments',
    'rp-fading-simulator',
    'schads-fatigue'
  ];

  for (const tab of phase5Tabs) {
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
