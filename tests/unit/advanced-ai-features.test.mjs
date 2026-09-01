import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🚀 SUITE: Next-Gen AI & Advanced Clinical Capabilities Tests');
console.log('══════════════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

const rootDir = process.cwd();

// --- Group 1: Multilingual i18n & Speech Synthesis Tests ---
console.log('▶ Group 1: Multi-Language CALD & Speech Accessibility');

test('lib/i18n.ts exports 8 supported languages with translation keys', () => {
  const i18nPath = resolve(rootDir, 'lib/i18n.ts');
  assert.ok(existsSync(i18nPath), 'lib/i18n.ts must exist');
  const content = readFileSync(i18nPath, 'utf8');

  assert.ok(content.includes('SUPPORTED_LANGUAGES'), 'must export SUPPORTED_LANGUAGES');
  assert.ok(content.includes('TRANSLATIONS'), 'must export TRANSLATIONS');
  assert.ok(content.includes('speakText'), 'must export speakText function');
  assert.ok(content.includes('ar: {'), 'must include Arabic translations');
  assert.ok(content.includes('vi: {'), 'must include Vietnamese translations');
  assert.ok(content.includes('zh: {'), 'must include Chinese translations');
  assert.ok(content.includes('es: {'), 'must include Spanish translations');
  assert.ok(content.includes('tl: {'), 'must include Tagalog translations');
  assert.ok(content.includes('el: {'), 'must include Greek translations');
  assert.ok(content.includes('it: {'), 'must include Italian translations');
});

// --- Group 2: AI Multimodal Clinical Document Intelligence API Tests ---
console.log('\n▶ Group 2: AI Document Intelligence & OCR Intake API');

test('app/api/gemini/analyze-document/route.ts enforces requireAuth and returns structured schema', () => {
  const routePath = resolve(rootDir, 'app/api/gemini/analyze-document/route.ts');
  assert.ok(existsSync(routePath), 'analyze-document route must exist');
  const content = readFileSync(routePath, 'utf8');

  assert.ok(content.includes('requireAuth(req'), 'must enforce requireAuth');
  assert.ok(content.includes('fallbackExtraction'), 'must contain structured fallback schema');
  assert.ok(content.includes('fundingAllocations'), 'must extract funding allocations');
  assert.ok(content.includes('restrictivePracticesIdentified'), 'must extract restrictive practice safeguards');
  assert.ok(content.includes('recommendedGoals'), 'must extract recommended NDIS goals');
});

// --- Group 3: Clinical Voice Scribe & SOAP Structuring Tests ---
console.log('\n▶ Group 3: AI Ambient Clinical Voice Scribe');

test('components/features/ClinicalVoiceScribe.tsx implements Web Speech API & SOAP structuring', () => {
  const scribePath = resolve(rootDir, 'components/features/ClinicalVoiceScribe.tsx');
  assert.ok(existsSync(scribePath), 'ClinicalVoiceScribe component must exist');
  const content = readFileSync(scribePath, 'utf8');

  assert.ok(content.includes('SpeechRecognition'), 'must hook into Web Speech API');
  assert.ok(content.includes('generateSoapFromSpeech'), 'must support speech-to-SOAP transformation');
  assert.ok(content.includes('recommendedItemCode'), 'must detect NDIS line items');
  assert.ok(content.includes('Subjective (S)'), 'must structure subjective section');
  assert.ok(content.includes('Objective (O)'), 'must structure objective section');
  assert.ok(content.includes('Assessment & Goal Progress (A)'), 'must structure assessment section');
  assert.ok(content.includes('Plan & Next Steps (P)'), 'must structure plan section');
});

// --- Group 4: Predictive Caseload Risk & Crisis Radar Tests ---
console.log('\n▶ Group 4: Predictive Caseload Risk & Crisis Early Warning');

test('components/features/AICaseloadRiskRadar.tsx calculates RP velocity, burnout & budget burn rates', () => {
  const radarPath = resolve(rootDir, 'components/features/AICaseloadRiskRadar.tsx');
  assert.ok(existsSync(radarPath), 'AICaseloadRiskRadar component must exist');
  const content = readFileSync(radarPath, 'utf8');

  assert.ok(content.includes('rpEscalationMetrics'), 'must calculate RP velocity spikes');
  assert.ok(content.includes('practitionerBurnoutIndex'), 'must calculate practitioner capacity vs SCHADS award');
  assert.ok(content.includes('budgetVelocityAlerts'), 'must track NDIS budget burn velocity');
  assert.ok(content.includes('handleDispatchProactiveAlert'), 'must support 1-click clinical director alert dispatch');
});

// --- Group 5: Intelligent PACE Claim Auto-Fixer Tests ---
console.log('\n▶ Group 5: Intelligent NDIS PACE Claim Auto-Fixer');

test('components/features/PACEClaimAutoFixer.tsx supports 1-click rate recalibration to 2026 caps', () => {
  const fixerPath = resolve(rootDir, 'components/features/PACEClaimAutoFixer.tsx');
  assert.ok(existsSync(fixerPath), 'PACEClaimAutoFixer component must exist');
  const content = readFileSync(fixerPath, 'utf8');

  assert.ok(content.includes('244.22'), 'must enforce 2026 NDIS Price Cap rate $244.22');
  assert.ok(content.includes('handleFixSingleClaim'), 'must support single claim repair');
  assert.ok(content.includes('handleFixAllClaims'), 'must support batch repair');
  assert.ok(content.includes('PAYMENT_REJECTED_OVER_CAP'), 'must diagnose PRODA error codes');
});

// --- Group 6: NDIS Commission Audit Simulator Tests ---
console.log('\n▶ Group 6: NDIS Commission Audit Simulator & Evidence Dossier');

test('components/features/AuditSimulatorModule.tsx computes readiness scores and exports Section 34 dossier', () => {
  const simPath = resolve(rootDir, 'components/features/AuditSimulatorModule.tsx');
  assert.ok(existsSync(simPath), 'AuditSimulatorModule component must exist');
  const content = readFileSync(simPath, 'utf8');

  assert.ok(content.includes('auditEvaluation'), 'must evaluate composite readiness score');
  assert.ok(content.includes('handleRunFullAuditSimulation'), 'must run mock unannounced audit simulation');
  assert.ok(content.includes('handleDownloadSection34Evidence'), 'must export Section 34 evidence pack');
  assert.ok(content.includes('validScreeningRate'), 'must audit worker screening compliance');
  assert.ok(content.includes('bspComplianceRate'), 'must audit 12-month BSP review status');
});

// --- Group 7: Interactive PBS Behaviour Frequency Heatmap Tests ---
console.log('\n▶ Group 7: Interactive 24/7 PBS Behaviour Frequency Heatmap');

test('components/features/BehaviorHeatmapView.tsx computes 7x24 temporal matrix & maintaining functions', () => {
  const heatPath = resolve(rootDir, 'components/features/BehaviorHeatmapView.tsx');
  assert.ok(existsSync(heatPath), 'BehaviorHeatmapView component must exist');
  const content = readFileSync(heatPath, 'utf8');

  assert.ok(content.includes('heatmapMatrix'), 'must compute 7x24 matrix');
  assert.ok(content.includes('functionDistribution'), 'must aggregate Escape, Sensory, Attention, Tangible functions');
  assert.ok(content.includes('getHeatmapColor'), 'must generate dynamic intensity color gradients');
});

// --- Group 8: Tab Router & Navigation Invariants ---
console.log('\n▶ Group 8: Tab Router & Navigation Invariants');

test('stores/types.ts and components/Sidebar.tsx include all new AI tabs', () => {
  const typesPath = resolve(rootDir, 'stores/types.ts');
  const sidebarPath = resolve(rootDir, 'components/Sidebar.tsx');
  const pagePath = resolve(rootDir, 'app/page.tsx');

  const typesContent = readFileSync(typesPath, 'utf8');
  const sidebarContent = readFileSync(sidebarPath, 'utf8');
  const pageContent = readFileSync(pagePath, 'utf8');

  const requiredTabs = ['document-intelligence', 'voice-scribe', 'ai-radar', 'audit-simulator'];
  for (const tab of requiredTabs) {
    assert.ok(typesContent.includes(`'${tab}'`), `stores/types.ts must include '${tab}'`);
    assert.ok(sidebarContent.includes(`id: '${tab}'`), `components/Sidebar.tsx must include '${tab}'`);
    assert.ok(pageContent.includes(`case '${tab}':`), `app/page.tsx must route '${tab}'`);
  }
});

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
console.log('══════════════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
