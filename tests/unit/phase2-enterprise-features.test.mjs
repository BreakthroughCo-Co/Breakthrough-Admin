import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🏢 SUITE: Phase 2 Enterprise Capabilities & Interoperability Tests');
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
// Group 1: DLP & Privacy Act Sanitizer
// -------------------------------------------------------------
console.log('\n▶ Group 1: Data Loss Prevention (DLP) & Privacy Act Sanitizer');

check('lib/dlpSanitizer.ts exists and masks Australian Medicare and Credit Cards', async () => {
  const filePath = path.join(rootDir, 'lib/dlpSanitizer.ts');
  assert(fs.existsSync(filePath), 'lib/dlpSanitizer.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class DLPSanitizer'), 'DLPSanitizer class missing');
  assert(content.includes('sanitize'), 'sanitize method missing');
});

// -------------------------------------------------------------
// Group 2: Cryptographic E-Signatures
// -------------------------------------------------------------
console.log('\n▶ Group 2: Cryptographic Digital Signatures & SHA-256 Tamper Verification');

check('lib/cryptographicSigner.ts exists and produces valid SHA-256 certificates', () => {
  const filePath = path.join(rootDir, 'lib/cryptographicSigner.ts');
  assert(fs.existsSync(filePath), 'lib/cryptographicSigner.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class CryptographicSigner'), 'CryptographicSigner class missing');
  assert(content.includes('hashDocument'), 'hashDocument method missing');
  assert(content.includes('signDocument'), 'signDocument method missing');
  assert(content.includes('verifyCertificate'), 'verifyCertificate method missing');
});

// -------------------------------------------------------------
// Group 3: Machine Learning Participant Churn & Retention Radar
// -------------------------------------------------------------
console.log('\n▶ Group 3: Participant Churn & Retention Predictor');

check('lib/churnPredictor.ts evaluates engagement velocity and returns risk scores', () => {
  const filePath = path.join(rootDir, 'lib/churnPredictor.ts');
  assert(fs.existsSync(filePath), 'lib/churnPredictor.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class ChurnPredictor'), 'ChurnPredictor class missing');
  assert(content.includes('evaluateParticipant'), 'evaluateParticipant method missing');
});

// -------------------------------------------------------------
// Group 4: Direct PRODA B2G Claim Connector
// -------------------------------------------------------------
console.log('\n▶ Group 4: Direct PRODA B2G Gateway & Digital Connector');

check('lib/prodaB2GConnector.ts validates 2026 NDIS price caps and adjudicates claims', () => {
  const filePath = path.join(rootDir, 'lib/prodaB2GConnector.ts');
  assert(fs.existsSync(filePath), 'lib/prodaB2GConnector.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class PRODAB2GConnector'), 'PRODAB2GConnector class missing');
  assert(content.includes('submitDirectClaim'), 'submitDirectClaim method missing');
  assert(content.includes('submitBulkClaims'), 'submitBulkClaims method missing');
});

// -------------------------------------------------------------
// Group 5: SCHADS-Compliant Xero Payroll Mapper
// -------------------------------------------------------------
console.log('\n▶ Group 5: Xero / MYOB SCHADS Payroll Mapper');

check('lib/xeroPayrollMapper.ts computes weekend multipliers (150% Sat, 200% Sun)', () => {
  const filePath = path.join(rootDir, 'lib/xeroPayrollMapper.ts');
  assert(fs.existsSync(filePath), 'lib/xeroPayrollMapper.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class XeroPayrollMapper'), 'XeroPayrollMapper class missing');
  assert(content.includes('mapToXeroTimesheet'), 'mapToXeroTimesheet method missing');
});

// -------------------------------------------------------------
// Group 6: Roster Constraint Optimizer
// -------------------------------------------------------------
console.log('\n▶ Group 6: Roster Constraint Optimizer');

check('lib/rosterConstraintOptimizer.ts minimizes travel and prevents rest breaches', () => {
  const filePath = path.join(rootDir, 'lib/rosterConstraintOptimizer.ts');
  assert(fs.existsSync(filePath), 'lib/rosterConstraintOptimizer.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class RosterConstraintOptimizer'), 'RosterConstraintOptimizer class missing');
  assert(content.includes('optimizeRoster'), 'optimizeRoster method missing');
});

// -------------------------------------------------------------
// Group 7: NDIS Plan Reassessment Report Synthesizer
// -------------------------------------------------------------
console.log('\n▶ Group 7: NDIS 12-Month Plan Reassessment Synthesizer');

check('lib/planReportGenerator.ts aggregates notes and goals into Section 34 dossier', () => {
  const filePath = path.join(rootDir, 'lib/planReportGenerator.ts');
  assert(fs.existsSync(filePath), 'lib/planReportGenerator.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class PlanReportGenerator'), 'PlanReportGenerator class missing');
  assert(content.includes('generateReport'), 'generateReport method missing');
});

// -------------------------------------------------------------
// Group 8: Tab Router & Navigation Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 8: Tab Router & Navigation Invariants');

check('stores/types.ts and stores/useManagementStore.ts include all Phase 2 tabs', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase2Tabs = ['proda-gateway', 'plan-report-writer', 'churn-radar', 'agreements-signing', 'telehealth'];

  for (const tab of phase2Tabs) {
    assert(typesContent.includes(`'${tab}'`), `stores/types.ts missing '${tab}'`);
    assert(storeContent.includes(`'${tab}'`), `stores/useManagementStore.ts missing '${tab}'`);
    assert(sidebarContent.includes(`id: '${tab}'`), `components/Sidebar.tsx missing '${tab}'`);
    assert(pageContent.includes(`case '${tab}':`), `app/page.tsx missing '${tab}'`);
  }
});

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
console.log('══════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
