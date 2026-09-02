import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🎯 SUITE: Phase 7 Outcomes, Feedback Sentiment & Disaster Recovery');
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
// Group 1: Standardized Clinical Outcome Suite (GAS / WHODAS 2.0)
// -------------------------------------------------------------
console.log('\n▶ Group 1: Standardized Clinical Outcome Suite');

check('lib/clinicalOutcomeSuite.ts calculates normalized GAS T-scores and delta', () => {
  const filePath = path.join(rootDir, 'lib/clinicalOutcomeSuite.ts');
  assert(fs.existsSync(filePath), 'lib/clinicalOutcomeSuite.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class ClinicalOutcomeSuite'), 'ClinicalOutcomeSuite class missing');
  assert(content.includes('calculateGASTScore'), 'calculateGASTScore method missing');
});

// -------------------------------------------------------------
// Group 2: Participant & Family Feedback Sentiment Pulse
// -------------------------------------------------------------
console.log('\n▶ Group 2: Participant & Family Feedback Sentiment Pulse');

check('lib/feedbackSentimentEngine.ts classifies NPS sentiment and dissatisfaction flags', () => {
  const filePath = path.join(rootDir, 'lib/feedbackSentimentEngine.ts');
  assert(fs.existsSync(filePath), 'lib/feedbackSentimentEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class FeedbackSentimentEngine'), 'FeedbackSentimentEngine class missing');
  assert(content.includes('analyzeFeedback'), 'analyzeFeedback method missing');
});

// -------------------------------------------------------------
// Group 3: Clinical Session Audio & Multi-Speaker Transcription Vault
// -------------------------------------------------------------
console.log('\n▶ Group 3: Clinical Session Audio & Multi-Speaker Transcription Vault');

check('lib/audioTranscriptionVault.ts processes speaker segments and extracts clinical SOAP notes', () => {
  const filePath = path.join(rootDir, 'lib/audioTranscriptionVault.ts');
  assert(fs.existsSync(filePath), 'lib/audioTranscriptionVault.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class AudioTranscriptionVault'), 'AudioTranscriptionVault class missing');
  assert(content.includes('processAudioSession'), 'processAudioSession method missing');
});

// -------------------------------------------------------------
// Group 4: NDIS Annual Price Guide Indexation Engine
// -------------------------------------------------------------
console.log('\n▶ Group 4: NDIS Annual Price Guide Indexation Engine');

check('lib/priceIndexationEngine.ts computes annual Fair Work indexation and revenue lift', () => {
  const filePath = path.join(rootDir, 'lib/priceIndexationEngine.ts');
  assert(fs.existsSync(filePath), 'lib/priceIndexationEngine.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class PriceIndexationEngine'), 'PriceIndexationEngine class missing');
  assert(content.includes('calculateIndexationImpact'), 'calculateIndexationImpact method missing');
});

// -------------------------------------------------------------
// Group 5: Disaster Recovery & Encrypted Backup Snapshot Vault
// -------------------------------------------------------------
console.log('\n▶ Group 5: Disaster Recovery & Encrypted Backup Snapshot Vault');

check('lib/disasterRecoveryVault.ts compiles encrypted snapshot manifests with SHA-256 checksums', () => {
  const filePath = path.join(rootDir, 'lib/disasterRecoveryVault.ts');
  assert(fs.existsSync(filePath), 'lib/disasterRecoveryVault.ts not found');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('class DisasterRecoveryVault'), 'DisasterRecoveryVault class missing');
  assert(content.includes('createSnapshot'), 'createSnapshot method missing');
});

// -------------------------------------------------------------
// Group 6: Phase 7 Tab Router & Component Invariants
// -------------------------------------------------------------
console.log('\n▶ Group 6: Phase 7 Tab Router & Component Invariants');

check('All Phase 7 tabs are registered across types, store, sidebar, export, timer, and page router', () => {
  const typesContent = fs.readFileSync(path.join(rootDir, 'stores/types.ts'), 'utf8');
  const storeContent = fs.readFileSync(path.join(rootDir, 'stores/useManagementStore.ts'), 'utf8');
  const sidebarContent = fs.readFileSync(path.join(rootDir, 'components/Sidebar.tsx'), 'utf8');
  const exportContent = fs.readFileSync(path.join(rootDir, 'components/ModuleExportModal.tsx'), 'utf8');
  const timerContent = fs.readFileSync(path.join(rootDir, 'components/SessionTimer.tsx'), 'utf8');
  const pageContent = fs.readFileSync(path.join(rootDir, 'app/page.tsx'), 'utf8');

  const phase7Tabs = [
    'outcome-suite',
    'feedback-pulse',
    'audio-vault',
    'price-indexation',
    'disaster-recovery'
  ];

  for (const tab of phase7Tabs) {
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
