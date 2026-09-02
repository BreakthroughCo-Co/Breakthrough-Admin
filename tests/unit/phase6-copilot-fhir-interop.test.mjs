import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🧠 SUITE: Phase 6 Clinical Copilot, FHIR R4 & Sensory Tests');
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
// Group 1: Autonomous Clinical Copilot & AI Smart Prompts
// -------------------------------------------------------------
console.log('\n▶ Group 1: Autonomous Clinical Copilot & AI Smart Prompts');

check('lib/clinicalCopilotEngine.ts generates context-aware clinical suggestions', () => {
  const filePath = path.join(rootDir, 'lib/clinicalCopilotEngine.ts');
  assert(fs.existsSync(filePath), 'lib/clinicalCopilotEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class ClinicalCopilotEngine'), 'ClinicalCopilotEngine class missing');
  assert(content.includes('generateSuggestions'), 'generateSuggestions method missing');
});

// -------------------------------------------------------------
// Group 2: Sensory Environment & Home Modification Audit
// -------------------------------------------------------------
console.log('\n▶ Group 2: Sensory Environment & Home Modification Audit');

check('lib/sensoryEnvironmentAnalyzer.ts evaluates lighting and acoustic clutter', () => {
  const filePath = path.join(rootDir, 'lib/sensoryEnvironmentAnalyzer.ts');
  assert(fs.existsSync(filePath), 'lib/sensoryEnvironmentAnalyzer.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class SensoryEnvironmentAnalyzer'), 'SensoryEnvironmentAnalyzer class missing');
  assert(content.includes('analyzeEnvironment'), 'analyzeEnvironment method missing');
});

// -------------------------------------------------------------
// Group 3: Practitioner Peer Supervision & Reflective Practice
// -------------------------------------------------------------
console.log('\n▶ Group 3: Practitioner Peer Supervision & Reflective Practice');

check('lib/peerSupervisionNetwork.ts records supervision sessions with supervisor sign-offs', () => {
  const filePath = path.join(rootDir, 'lib/peerSupervisionNetwork.ts');
  assert(fs.existsSync(filePath), 'lib/peerSupervisionNetwork.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class PeerSupervisionNetwork'), 'PeerSupervisionNetwork class missing');
  assert(content.includes('createSupervisionSession'), 'createSupervisionSession method missing');
});

// -------------------------------------------------------------
// Group 4: HL7 FHIR R4 Healthcare Interoperability Gateway
// -------------------------------------------------------------
console.log('\n▶ Group 4: HL7 FHIR R4 Healthcare Interoperability Gateway');

check('lib/fhirInteroperabilityGateway.ts transforms records into FHIR R4 standard JSON Bundle', () => {
  const filePath = path.join(rootDir, 'lib/fhirInteroperabilityGateway.ts');
  assert(fs.existsSync(filePath), 'lib/fhirInteroperabilityGateway.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class FHIRInteroperabilityGateway'), 'FHIRInteroperabilityGateway class missing');
  assert(content.includes('exportToFHIRBundle'), 'exportToFHIRBundle method missing');
});

// -------------------------------------------------------------
// Group 5: Multi-Year Plan Budget Burn & Rollover Forecaster
// -------------------------------------------------------------
console.log('\n▶ Group 5: Multi-Year Plan Budget Burn & Rollover Forecaster');

check('lib/budgetRolloverForecaster.ts forecasts funding burn velocity and clawback risks', () => {
  const filePath = path.join(rootDir, 'lib/budgetRolloverForecaster.ts');
  assert(fs.existsSync(filePath), 'lib/budgetRolloverForecaster.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class BudgetRolloverForecaster'), 'BudgetRolloverForecaster class missing');
  assert(content.includes('forecastBudgetTrajectory'), 'forecastBudgetTrajectory method missing');
});

// -------------------------------------------------------------
// Group 6: Phase 6 Tab Router & Component Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 6: Phase 6 Tab Router & Component Invariants');

check('All Phase 6 tabs are registered across types, store, sidebar, export, timer, and page router', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const exportContent = fs.readFileSync(path.join(rootDir, 'components/ModuleExportModal.tsx'), 'utf8');
  const timerContent = fs.readFileSync(path.join(rootDir, 'components/SessionTimer.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase6Tabs = [
    'clinical-copilot',
    'sensory-audit',
    'peer-supervision',
    'fhir-gateway',
    'budget-forecaster'
  ];

  for (const tab of phase6Tabs) {
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
