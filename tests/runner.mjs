#!/usr/bin/env node

/**
 * Breakthrough OS E2E Test Suite Runner
 * 
 * Executes all 4 Tiers of E2E test suites across all 5 Phases:
 * Tier 1: Feature Coverage (≥25 tests)
 * Tier 2: Boundary & Corner Cases (≥25 tests)
 * Tier 3: Pairwise Cross-Feature Combinations (≥10 tests)
 * Tier 4: Real-World Clinical & Practice Management Workflows (≥5 scenarios)
 */

import { runTier1Tests } from './e2e/tier1-feature-coverage.test.mjs';
import { runTier2Tests } from './e2e/tier2-boundary-corner.test.mjs';
import { runTier3Tests } from './e2e/tier3-pairwise-cross-feature.test.mjs';
import { runTier4Tests } from './e2e/tier4-real-world-workloads.test.mjs';
import { runTier5Tests } from './e2e/tier5-adversarial-stress.test.mjs';

// ANSI Color Formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m'
};

class TestReporter {
  constructor() {
    this.totalTests = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
    this.startTime = Date.now();
    this.currentSuite = '';
    this.currentPhase = '';
    this.tierResults = {
      'Tier 1': { total: 0, passed: 0, failed: 0 },
      'Tier 2': { total: 0, passed: 0, failed: 0 },
      'Tier 3': { total: 0, passed: 0, failed: 0 },
      'Tier 4': { total: 0, passed: 0, failed: 0 },
      'Tier 5': { total: 0, passed: 0, failed: 0 }
    };
  }

  startSuite(name) {
    this.currentSuite = name;
    console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  🚀 SUITE: ${name}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  }

  startPhase(name) {
    this.currentPhase = name;
    console.log(`\n  ${colors.bright}${colors.yellow}▶ ${name}${colors.reset}`);
  }

  async test(name, fn) {
    this.totalTests++;
    const tierKey = this.currentSuite.startsWith('Tier 1') ? 'Tier 1'
      : this.currentSuite.startsWith('Tier 2') ? 'Tier 2'
      : this.currentSuite.startsWith('Tier 3') ? 'Tier 3'
      : this.currentSuite.startsWith('Tier 4') ? 'Tier 4'
      : 'Tier 5';

    this.tierResults[tierKey].total++;
    const testStart = performance.now();

    try {
      await fn();
      const duration = (performance.now() - testStart).toFixed(1);
      this.passed++;
      this.tierResults[tierKey].passed++;
      console.log(`    ${colors.green}✔ PASS${colors.reset} ${colors.dim}[${duration}ms]${colors.reset} ${name}`);
    } catch (err) {
      const duration = (performance.now() - testStart).toFixed(1);
      this.failed++;
      this.tierResults[tierKey].failed++;
      console.log(`    ${colors.red}✖ FAIL${colors.reset} ${colors.dim}[${duration}ms]${colors.reset} ${colors.bright}${name}${colors.reset}`);
      console.log(`      ${colors.red}Error: ${err.message}${colors.reset}`);
      this.errors.push({
        suite: this.currentSuite,
        phase: this.currentPhase,
        test: name,
        error: err
      });
    }
  }

  printSummary() {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.white}  📊 BREAKTHROUGH OS E2E TEST EXECUTION SUMMARY${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);

    console.log(`\n  ${colors.bright}Tier Breakdown:${colors.reset}`);
    console.log(`  ┌──────────────────────────────────────────────┬────────┬────────┬────────┐`);
    console.log(`  │ Tier Name                                    │ Total  │ Passed │ Failed │`);
    console.log(`  ├──────────────────────────────────────────────┼────────┼────────┼────────┤`);
    for (const [tier, data] of Object.entries(this.tierResults)) {
      const passedStr = data.failed === 0 ? `${colors.green}${data.passed}${colors.reset}` : `${data.passed}`;
      const failedStr = data.failed > 0 ? `${colors.red}${data.failed}${colors.reset}` : `${data.failed}`;
      const namePad = tier.padEnd(44);
      const totalPad = String(data.total).padStart(6);
      const passedPad = String(data.passed).padStart(6);
      const failedPad = String(data.failed).padStart(6);
      console.log(`  │ ${namePad} │ ${totalPad} │ ${passedPad} │ ${failedPad} │`);
    }
    console.log(`  └──────────────────────────────────────────────┴────────┴────────┴────────┘`);

    console.log(`\n  ${colors.bright}Totals:${colors.reset}`);
    console.log(`  • Total Tests Executed : ${colors.bright}${this.totalTests}${colors.reset}`);
    console.log(`  • Tests Passed         : ${colors.green}${colors.bright}${this.passed}${colors.reset}`);
    console.log(`  • Tests Failed         : ${this.failed > 0 ? colors.red : colors.dim}${colors.bright}${this.failed}${colors.reset}`);
    console.log(`  • Total Execution Time : ${colors.yellow}${totalDuration}s${colors.reset}`);

    if (this.errors.length > 0) {
      console.log(`\n${colors.bright}${colors.red}  ✖ FAILED TEST DETAILS (${this.errors.length}):${colors.reset}`);
      this.errors.forEach((e, idx) => {
        console.log(`\n  ${idx + 1}) [${e.suite}] ${e.test}`);
        console.log(`     ${colors.red}${e.error.stack || e.error.message}${colors.reset}`);
      });
      console.log(`\n${colors.bgRed}${colors.bright}  TEST SUITE RUN FAILED  ${colors.reset}\n`);
      return false;
    } else {
      console.log(`\n${colors.bgGreen}${colors.bright}  ✔ ALL E2E TEST SUITES PASSED CLEANLY (100% PASS RATE)  ${colors.reset}\n`);
      return true;
    }
  }
}

async function main() {
  console.log(`\n${colors.bright}${colors.magenta}╔══════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║        BREAKTHROUGH OS - COMPLETE E2E TEST HARNESS & RUNNER          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║        NDIS Practice Management Platform Automated Verification      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚══════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  const reporter = new TestReporter();

  try {
    // Execute all 5 Tiers
    await runTier1Tests(reporter);
    await runTier2Tests(reporter);
    await runTier3Tests(reporter);
    await runTier4Tests(reporter);
    await runTier5Tests(reporter);

    const success = reporter.printSummary();
    process.exit(success ? 0 : 1);
  } catch (fatalErr) {
    console.error(`\n${colors.red}FATAL ERROR EXECUTING TEST RUNNER:${colors.reset}`, fatalErr);
    process.exit(1);
  }
}

main();
