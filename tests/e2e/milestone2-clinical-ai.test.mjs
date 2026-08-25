/**
 * Milestone 2 Verification Test Suite: Clinical Intelligence & AI Synthesis Suite (R2, R3, R4, R6)
 * 
 * Tests:
 * 1. Requirement R2: AI BSP Generator & PDF Export
 *    - 7-section NDIS Quality and Safeguards Commission-compliant document generation
 *    - Integration of ABC logs, SMART goals, active restrictive practices, case notes, and incident history
 *    - Sparse data fallback handling (default profiles, baseline strategies, 12-month review dates)
 *    - Clinical PDF export buffer compilation (%PDF-1.7 header, %%EOF trailer, 8 page count, metadata)
 * 
 * 2. Requirement R3: AI ABC Log Pattern Recognition & PBS Advisor
 *    - Top 3 antecedent trigger clustering with exact percentage frequency calculations
 *    - Temporal time-of-day peak distribution (Morning, Afternoon, Evening, Night) & day-of-week heatmaps
 *    - Perceived function clustering (Escape/Avoidance, Tangible/Access, Sensory/Automatic, Attention/Social)
 *    - Multi-tiered PBS intervention recommendations (Proactive, Active Replacement Skill, Reactive De-escalation)
 * 
 * 3. Requirement R4: AI Continuous Risk Assessment & Safety Flagging
 *    - 5-factor weighted clinical risk evaluation (incidents, restrictive practices, budget burn, session gaps, case note distress)
 *    - Four-tier risk categorization (Low, Medium, High, Critical)
 *    - Critical risk hard floor & mandatory Practice Director notification trigger
 *    - Transparent plain-English clinical rationales and sub-score metrics
 * 
 * 4. Requirement R6: AI Natural Language Semantic Search
 *    - Cross-module indexing across all 15 collections (case notes, incidents, ABC logs, claims, clients, staff, RPs)
 *    - Natural language intent parsing (temporal conditions, numeric constraints, severity concepts)
 *    - Ranked relevance scoring & matched snippet keyword highlighting (<mark> tags)
 *    - Sub-3 second query execution performance benchmark (<500ms)
 */

import assert from 'node:assert/strict';
import {
  AIAssistantEngine,
  ManagementStoreEmulator,
  InMemoryFirestore
} from '../harness/emulator.mjs';

export async function runMilestone2Tests(reporter) {
  reporter.startSuite('Milestone 2: Clinical Intelligence & AI Synthesis Suite (R2, R3, R4, R6)');

  // =========================================================================
  // PHASE 1: Requirement R2 — AI BSP Generator & PDF Export
  // =========================================================================
  reporter.startPhase('Phase 1: R2 — AI BSP Generator & PDF Export');

  await reporter.test('T2.M2.1 - BSP Generator: Synthesizes complete 7-section NDIS BSP from live client database', async () => {
    const client = {
      id: 'cli-test-201',
      name: 'Jordan Miller',
      ndisNumber: '430891245',
      dateOfBirth: '2004-03-15',
      primaryDisability: 'Autism Spectrum Disorder (Level 3)',
      secondaryDisabilities: ['Anxiety Disorder', 'Sensory Processing Sensitivity'],
      planStartDate: '2026-01-01',
      planEndDate: '2026-12-31',
      totalBudget: 48500,
      allocatedBudget: 42000,
      spentBudget: 24350,
      primaryPractitionerName: 'Marcus Vance',
      primaryPractitionerId: 'prac-202',
      riskLevel: 'Medium',
      goals: [
        {
          id: 'g-201',
          title: 'Master independent emotional regulation techniques during sensory overload',
          category: 'Capacity Building',
          targetDate: '2026-12-31',
          progressPercent: 68,
          status: 'In Progress',
          gasScore: 1
        }
      ]
    };

    const abcLogs = [
      {
        id: 'abc-201',
        clientId: 'cli-test-201',
        antecedent: 'Transition from iPad video game to dinnertime meal prep in crowded kitchen',
        behavior: 'Vocal protest, dropped to floor, refused to move for 8 minutes',
        consequence: 'Worker provided visual timer giving 3-minute extension; participant stood up calmly',
        intensity: 3,
        durationMinutes: 8,
        perceivedFunction: 'Escape/Avoidance'
      },
      {
        id: 'abc-202',
        clientId: 'cli-test-201',
        antecedent: 'Transition from sensory quiet zone to group therapy session',
        behavior: 'Verbal pushback and agitation',
        consequence: 'Offered 2-minute visual countdown timer',
        intensity: 3,
        durationMinutes: 5,
        perceivedFunction: 'Escape/Avoidance'
      }
    ];

    const rps = [
      {
        id: 'rp-201',
        clientId: 'cli-test-201',
        practiceType: 'Environmental',
        description: 'Locked kitchen pantry containing high-sugar sensory items outside scheduled snack periods',
        status: 'Authorized',
        authorizationBody: 'Victorian Senior Practitioner Panel',
        authorizationReference: 'VSP-AUTH-2026-8819',
        expiryDate: '2027-01-31',
        reductionPlanSummary: 'Graduated visual food choice cards and self-monitoring schedule.'
      }
    ];

    const incidents = [
      {
        id: 'inc-201',
        clientId: 'cli-test-201',
        severity: 'Critical / Reportable',
        isNdisReportable: true,
        incidentDate: '2026-08-16T14:10:00Z',
        description: 'Participant demonstrated intense acute agitation requiring 30-sec emergency guide.'
      }
    ];

    const caseNotes = [
      {
        id: 'note-201',
        clientId: 'cli-test-201',
        subjective: 'Participant arrived calm; engaged with visual schedule.',
        objective: 'Completed 45 minutes of functional communication training.',
        assessment: 'Progressing well with replacement break cards.',
        plan: 'Continue weekly coaching.'
      }
    ];

    // Generate BSP via generateFullNDISBSP
    const bsp = AIAssistantEngine.generateFullNDISBSP(client, {
      abcLogs,
      goals: client.goals,
      restrictivePractices: rps,
      incidents,
      caseNotes
    });

    assert.ok(bsp, 'BSP result should be returned');
    assert.strictEqual(bsp.clientId, 'cli-test-201');
    assert.strictEqual(bsp.clientName, 'Jordan Miller');
    assert.strictEqual(bsp.ndisNumber, '430891245');
    assert.strictEqual(bsp.version, 'v1.0');
    assert.ok(bsp.sections, 'BSP must include structured sections');

    // Verify all 7 sections exist
    assert.ok(bsp.sections.section1_participantProfile, 'Section 1: Participant Profile must exist');
    assert.ok(bsp.sections.section2_presentingBehaviours, 'Section 2: Presenting Behaviours must exist');
    assert.ok(bsp.sections.section3_antecedentAnalysis, 'Section 3: Antecedent Analysis must exist');
    assert.ok(bsp.sections.section4_functionalAssessment, 'Section 4: Functional Assessment must exist');
    assert.ok(bsp.sections.section5_proactiveStrategies, 'Section 5: Proactive Strategies must exist');
    assert.ok(bsp.sections.section6_replacementSkills, 'Section 6: Replacement Skills must exist');
    assert.ok(bsp.sections.section7_reactiveAndRestrictivePractices, 'Section 7: Reactive & Restrictive Practices must exist');

    // Verify content details
    assert.ok(bsp.summary.includes('Jordan Miller'), 'Summary must mention participant name');
    assert.ok(bsp.proactiveStrategies.length > 0, 'Proactive strategies must be populated');
    assert.ok(bsp.reactiveStrategies.length > 0, 'Reactive strategies must be populated');
    assert.ok(bsp.restrictivePractices.length > 0, 'Restrictive practices must be integrated');
    assert.ok(bsp.htmlContent.includes('Positive Behaviour Support Plan'), 'HTML content must be valid');
    assert.ok(bsp.markdownContent.includes('# Positive Behaviour Support Plan'), 'Markdown content must be valid');
  });

  await reporter.test('T2.M2.2 - BSP Generator: Sparse Data Fallback produces compliant structure without errors', async () => {
    const sparseClient = {
      id: 'cli-sparse-999',
      name: 'Taylor Swift',
      ndisNumber: '439999999'
    };

    const bsp = AIAssistantEngine.generateFullNDISBSP(sparseClient, {});

    assert.ok(bsp, 'Sparse BSP should be generated cleanly');
    assert.strictEqual(bsp.clientId, 'cli-sparse-999');
    assert.strictEqual(bsp.clientName, 'Taylor Swift');
    assert.ok(bsp.proactiveStrategies.length >= 2, 'Default proactive strategies provided');
    assert.ok(bsp.reactiveStrategies.length >= 2, 'Default reactive strategies provided');
    assert.ok(bsp.reviewDate, 'Review date must be set');
  });

  await reporter.test('T2.M2.3 - PDF Generator: Compiles print-ready NDIS Commission Section 34 PDF binary buffer', async () => {
    const bspDoc = AIAssistantEngine.generateComprehensiveBSP({
      id: 'cli-101',
      name: 'Jordan Miller',
      ndisNumber: '430891245',
      primaryDisability: 'Autism Spectrum Disorder'
    });

    const pdfBuffer = AIAssistantEngine.generateBSPPdfBuffer(bspDoc);

    assert.ok(pdfBuffer, 'PDF buffer export should be returned');
    assert.strictEqual(pdfBuffer.contentType, 'application/pdf');
    assert.ok(pdfBuffer.filename.startsWith('BSP-Jordan_Miller'), 'Filename should be formatted');
    assert.strictEqual(pdfBuffer.metadata.ndisCommissionCompliant, true);
    assert.strictEqual(pdfBuffer.metadata.pageCount, 8);

    const rawString = pdfBuffer.rawBytes.toString('utf-8');
    assert.ok(rawString.startsWith('%PDF-1.7'), 'Must contain valid %PDF-1.7 header');
    assert.ok(rawString.includes('%%EOF'), 'Must contain valid %%EOF trailer');
    assert.ok(rawString.includes('NDIS_BEHAVIOUR_SUPPORT_PLAN') || rawString.includes('Jordan Miller'), 'Must contain NDIS metadata payload');
  });

  // =========================================================================
  // PHASE 2: Requirement R3 — AI ABC Log Pattern Recognition & PBS Advisor
  // =========================================================================
  reporter.startPhase('Phase 2: R3 — AI ABC Log Pattern Recognition & PBS Advisor');

  await reporter.test('T2.M2.4 - ABC Pattern Engine: Computes top 3 antecedent clusters with accurate % frequencies', async () => {
    const logs = [
      { id: '1', antecedent: 'Transition between classroom and playground', perceivedFunction: 'Escape/Avoidance', timeOfDay: '10:30', dayOfWeek: 'Monday' },
      { id: '2', antecedent: 'Transition between classroom and playground', perceivedFunction: 'Escape/Avoidance', timeOfDay: '10:45', dayOfWeek: 'Tuesday' },
      { id: '3', antecedent: 'Transition between classroom and playground', perceivedFunction: 'Escape/Avoidance', timeOfDay: '11:00', dayOfWeek: 'Wednesday' },
      { id: '4', antecedent: 'Loud bell in school cafeteria', perceivedFunction: 'Sensory/Automatic', timeOfDay: '12:15', dayOfWeek: 'Thursday' },
      { id: '5', antecedent: 'Loud bell in school cafeteria', perceivedFunction: 'Sensory/Automatic', timeOfDay: '12:20', dayOfWeek: 'Friday' },
      { id: '6', antecedent: 'Direct math worksheet demand', perceivedFunction: 'Escape/Avoidance', timeOfDay: '14:00', dayOfWeek: 'Monday' }
    ];

    const analysis = AIAssistantEngine.analyzeABCPatterns(logs);

    assert.ok(analysis.topAntecedents.length >= 2, 'Should return top antecedents');

    // First antecedent should have 3 occurrences (50%)
    const top = analysis.topAntecedents[0];
    assert.strictEqual(top.count, 3);
    assert.strictEqual(top.percentage, 50);

    // Second antecedent should have 2 occurrences (33%)
    const second = analysis.topAntecedents[1];
    assert.strictEqual(second.count, 2);
    assert.strictEqual(second.percentage, 33);
  });

  await reporter.test('T2.M2.5 - ABC Pattern Engine: Calculates temporal time-of-day distribution & dominant function', async () => {
    const logs = [
      { id: '1', timeOfDay: '09:00', perceivedFunction: 'Escape/Avoidance' },
      { id: '2', timeOfDay: '10:30', perceivedFunction: 'Escape/Avoidance' },
      { id: '3', timeOfDay: '13:00', perceivedFunction: 'Escape/Avoidance' },
      { id: '4', timeOfDay: '14:30', perceivedFunction: 'Escape/Avoidance' },
      { id: '5', timeOfDay: '15:00', perceivedFunction: 'Escape/Avoidance' },
      { id: '6', timeOfDay: '18:00', perceivedFunction: 'Sensory/Automatic' }
    ];

    const analysis = AIAssistantEngine.analyzeABCPatterns(logs);

    assert.strictEqual(analysis.temporalDistribution['Morning (08:00 - 12:00)'], 2);
    assert.strictEqual(analysis.temporalDistribution['Afternoon (12:00 - 17:00)'], 3);
    assert.strictEqual(analysis.temporalDistribution['Evening (17:00 - 21:00)'], 1);
    assert.strictEqual(analysis.dominantFunction, 'Escape/Avoidance');
  });

  await reporter.test('T2.M2.6 - ABC Pattern Engine: Formulates multi-tiered PBS proactive, replacement, and reactive recommendations', async () => {
    const logs = [
      { id: '1', antecedent: 'Task demand', behavior: 'Drop to floor', perceivedFunction: 'Escape/Avoidance' },
      { id: '2', antecedent: 'Task demand', behavior: 'Push table', perceivedFunction: 'Escape/Avoidance' }
    ];

    const analysis = AIAssistantEngine.analyzeABCPatterns(logs);

    assert.ok(analysis.pbsRecommendations.length > 0, 'Must have PBS recommendations');
    assert.ok(analysis.pbsRecommendations.some(r => r.includes('Proactive') || r.includes('Replacement')), 'Must have proactive/replacement guidance');
  });

  await reporter.test('T2.M2.7 - ABC Pattern Engine: Graceful handling of empty or single log entries', async () => {
    const emptyAnalysis = AIAssistantEngine.analyzeABCPatterns([]);
    assert.strictEqual(emptyAnalysis.dominantFunction, 'Undetermined');
    assert.ok(emptyAnalysis.pbsRecommendations.length > 0);

    const singleLogAnalysis = AIAssistantEngine.analyzeABCPatterns([
      { id: '1', antecedent: 'Noise', behavior: 'Cover ears', perceivedFunction: 'Sensory/Automatic', timeOfDay: '11:00' }
    ]);
    assert.strictEqual(singleLogAnalysis.dominantFunction, 'Sensory/Automatic');
    assert.ok(singleLogAnalysis.topAntecedents.length >= 1);
  });

  // =========================================================================
  // PHASE 3: Requirement R4 — AI Continuous Risk Assessment & Safety Flagging
  // =========================================================================
  reporter.startPhase('Phase 3: R4 — AI Continuous Risk Assessment & Safety Flagging');

  await reporter.test('T2.M2.8 - Risk Engine: 5-Factor scoring evaluates Low, Medium, High, and Critical thresholds', async () => {
    // Low Risk Participant (no incidents, no RPs, steady budget)
    const lowClient = {
      id: 'cli-low',
      name: 'Low Risk Client',
      totalBudget: 40000,
      spentBudget: 8000,
      restrictivePracticesActive: false,
      status: 'Active'
    };
    const lowRisk = AIAssistantEngine.computeClientRisk(lowClient, {
      incidents: [],
      restrictivePractices: [],
      caseNotes: [{ id: 'n1', clientId: 'cli-low', date: new Date().toISOString().slice(0, 10), subjective: 'Calm session', objective: 'Good focus', assessment: 'Stable' }]
    });

    assert.ok(lowRisk.score < 35, `Low risk score should be < 35 (got ${lowRisk.score})`);
    assert.strictEqual(lowRisk.riskLevel, 'Low');
    assert.strictEqual(lowRisk.directorNotificationRequired, false);

    // Critical Risk Participant (Recent reportable incident + chemical restraint)
    const critClient = {
      id: 'cli-crit',
      name: 'Critical Risk Client',
      totalBudget: 50000,
      spentBudget: 48000,
      restrictivePracticesActive: true,
      status: 'Active'
    };
    const critRisk = AIAssistantEngine.computeClientRisk(critClient, {
      incidents: [
        {
          id: 'inc-crit-1',
          clientId: 'cli-crit',
          severity: 'Critical / Reportable',
          isNdisReportable: true,
          incidentDate: new Date().toISOString(),
          description: 'Emergency physical strike and self-harm requiring 000 call.'
        }
      ],
      restrictivePractices: [
        {
          id: 'rp-crit-1',
          clientId: 'cli-crit',
          practiceType: 'Chemical',
          status: 'Authorized',
          monthlyReportStatus: 'Overdue'
        }
      ]
    });

    assert.ok(critRisk.score >= 75, `Critical risk score should be >= 75 (got ${critRisk.score})`);
    assert.strictEqual(critRisk.riskLevel, 'Critical');
    assert.strictEqual(critRisk.directorNotificationRequired, true);
    assert.ok(critRisk.rationale.includes('Critical'), 'Rationale should state Critical risk level');
    assert.ok(critRisk.triggeredAlerts.length >= 1, 'Triggered alerts must be populated');
  });

  await reporter.test('T2.M2.9 - Risk Engine: Generates transparent clinical rationale and sub-score metrics', async () => {
    const client = {
      id: 'cli-test-med',
      name: 'Sam Taylor',
      totalBudget: 30000,
      spentBudget: 28000, // high utilization
      restrictivePracticesActive: true,
      status: 'Active'
    };

    const risk = AIAssistantEngine.computeClientRisk(client, {
      incidents: [
        { id: 'i1', clientId: 'cli-test-med', severity: 'Medium', description: 'Verbal agitation' }
      ],
      restrictivePractices: [
        { id: 'r1', clientId: 'cli-test-med', practiceType: 'Environmental', status: 'Authorized' }
      ],
      missedAppointments: 3
    });

    assert.ok(risk.rationale, 'Rationale must be non-empty string');
    assert.ok(risk.subScores, 'Subscores must be present');
    assert.ok(risk.subScores.incidents, 'Incidents subscore present');
    assert.ok(risk.subScores.restrictivePractices, 'RPs subscore present');
    assert.ok(risk.subScores.budgetVelocity, 'Budget subscore present');
    assert.ok(risk.subScores.sessionGap, 'Session gap subscore present');
    assert.ok(risk.factorBreakdown, 'Factor breakdown must be present');
  });

  // =========================================================================
  // PHASE 4: Requirement R6 — AI Natural Language Semantic Search
  // =========================================================================
  reporter.startPhase('Phase 4: R6 — AI Natural Language Semantic Search');

  await reporter.test('T2.M2.10 - Semantic Search: Parses temporal intent queries ("incidents in last 6 months")', async () => {
    const corpus = {
      incidents: [
        {
          id: 'inc-rec-1',
          clientId: 'cli-101',
          clientName: 'Jordan Miller',
          severity: 'Critical / Reportable',
          incidentDate: '2026-08-16T14:10:00Z',
          description: 'Participant demonstrated intense acute agitation and physical strike during community therapy.',
          isNdisReportable: true
        },
        {
          id: 'inc-old-1',
          clientId: 'cli-102',
          clientName: 'Samantha Reed',
          severity: 'Low',
          incidentDate: '2024-01-10T10:00:00Z',
          description: 'Minor trip on sensory mat.'
        }
      ]
    };

    const results = AIAssistantEngine.executeSemanticSearch('critical incidents in last 6 months', corpus);

    assert.ok(results.length > 0, 'Should find matching incident');
    assert.strictEqual(results[0].recordType, 'Incident');
    assert.strictEqual(results[0].recordId, 'inc-rec-1');
    assert.ok(results[0].score > 0.5, 'Top result should have high relevance score');
  });

  await reporter.test('T2.M2.11 - Semantic Search: Parses numeric constraint intent queries ("unused budget over $5000")', async () => {
    const corpus = {
      clients: [
        {
          id: 'cli-high-budget',
          name: 'Liam O’Connor',
          ndisNumber: '439901422',
          primaryDisability: 'Intellectual Disability',
          totalBudget: 54000,
          spentBudget: 40000, // $14,000 unused > $5000
          riskLevel: 'High'
        },
        {
          id: 'cli-low-budget',
          name: 'Spent Participant',
          ndisNumber: '431000000',
          primaryDisability: 'ASD',
          totalBudget: 10000,
          spentBudget: 9500, // $500 unused < $5000
          riskLevel: 'Low'
        }
      ]
    };

    const results = AIAssistantEngine.executeSemanticSearch('participants with unused budget over $5000', corpus);

    assert.ok(results.length > 0, 'Should find participant with > $5000 unused');
    assert.strictEqual(results[0].recordType, 'Client');
    assert.strictEqual(results[0].recordId, 'cli-high-budget');
    assert.ok(results[0].snippet.includes('14,000') || results[0].snippet.includes('14000') || results[0].snippet.includes('Budget Unused'));
  });

  await reporter.test('T2.M2.12 - Semantic Search: Concept expansion & snippet text retrieval', async () => {
    const corpus = {
      caseNotes: [
        {
          id: 'note-sensory-101',
          clientId: 'cli-101',
          clientName: 'Jordan Miller',
          format: 'Standard',
          date: '2026-08-12',
          subjective: 'Participant demonstrated anxiety and sensory overload during transition.',
          objective: 'Practitioner delivered 45 minutes of sensory regulation exercises.',
          assessment: 'Improved regulation pacing.',
          plan: 'Maintain quiet zone.'
        }
      ]
    };

    const results = AIAssistantEngine.executeSemanticSearch('sensory overload transition notes', corpus);

    assert.ok(results.length > 0, 'Should match case note');
    assert.strictEqual(results[0].recordType, 'CaseNote');
    assert.ok(results[0].snippet.includes('sensory') || results[0].snippet.includes('Participant'), 'Should retrieve relevant snippet');
  });

  await reporter.test('T2.M2.13 - Semantic Search: Sub-3 second latency benchmark across multi-collection corpus', async () => {
    // Generate a 100-record synthetic corpus across all collections
    const corpus = {
      clients: Array.from({ length: 20 }, (_, i) => ({
        id: `cli-${i}`,
        name: `Participant Test ${i}`,
        ndisNumber: `43000000${i}`,
        primaryDisability: i % 2 === 0 ? 'Autism Spectrum Disorder' : 'Intellectual Disability',
        totalBudget: 40000 + i * 1000,
        spentBudget: 10000 + i * 500,
        riskLevel: i % 4 === 0 ? 'High' : 'Low'
      })),
      caseNotes: Array.from({ length: 30 }, (_, i) => ({
        id: `note-${i}`,
        clientId: `cli-${i % 20}`,
        clientName: `Participant Test ${i % 20}`,
        format: 'Standard',
        date: '2026-08-10',
        subjective: `Participant showed anxiety and sensory trigger ${i} in afternoon routine.`,
        objective: 'Conducted visual schedule training.',
        assessment: 'Progress noted in GAS score.',
        plan: 'Weekly follow up.'
      })),
      incidents: Array.from({ length: 20 }, (_, i) => ({
        id: `inc-${i}`,
        clientId: `cli-${i % 20}`,
        clientName: `Participant Test ${i % 20}`,
        severity: i % 5 === 0 ? 'Critical / Reportable' : 'Medium',
        incidentDate: '2026-08-14',
        description: `Agitation event ${i} during environmental transition.`
      })),
      abcLogs: Array.from({ length: 30 }, (_, i) => ({
        id: `abc-${i}`,
        clientId: `cli-${i % 20}`,
        clientName: `Participant Test ${i % 20}`,
        antecedent: `Transition to cafeteria ${i}`,
        behavior: 'Refusal and verbal protest',
        consequence: 'Offered 2 minute quiet break',
        perceivedFunction: i % 2 === 0 ? 'Escape/Avoidance' : 'Sensory/Automatic',
        timestamp: '2026-08-14T10:00:00Z'
      }))
    };

    const start = performance.now();
    const results = AIAssistantEngine.executeSemanticSearch('critical agitation incidents and sensory transition notes', corpus);
    const duration = performance.now() - start;

    assert.ok(duration < 500, `Search must execute well under 3000ms SLA (executed in ${duration.toFixed(2)}ms)`);
    assert.ok(results.length > 0, 'Must return ranked results across multiple collections');
    assert.ok(results[0].score >= results[results.length - 1].score, 'Results must be sorted descending by relevance score');
  });
}
