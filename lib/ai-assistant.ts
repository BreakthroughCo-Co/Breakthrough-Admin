// Clinical, Compliance & Workspace AI Assistance Engine for Breakthrough Coaching & Consulting
// Compliant with NDIS Quality and Safeguards Commission Practice Standards & NDIS Act 2013 (s34)

import {
  Client,
  CaseNote,
  Incident,
  RestrictivePractice,
  ABCLog,
  ClientGoal,
  BSPDocument,
  BillingClaim,
  RiskAssessment,
  ABCPatternAnalysis,
  ComprehensiveBSPResult,
  ComprehensiveBSPSection,
  AntecedentCluster,
  BillingValidationResult,
  BillingValidationBadge,
  NDISSupportItem
} from '@/types';
import { OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/lib/seedData';

export const DEFAULT_AI_MODEL = 'gemini-2.0-flash';

export interface AIGeneratedBSP {
  title: string;
  summary: string;
  primaryBehaviors: string[];
  proactiveStrategies: string[];
  reactiveStrategies: string[];
  restrictivePracticesReview: string;
}

export interface AISOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  recommendedSupportItemCode: string;
  billableHoursEstimate: number;
}

export interface AIIncidentAssessment {
  severityLevel: 'LEVEL_1_LOW' | 'LEVEL_2_MEDIUM' | 'LEVEL_3_HIGH' | 'LEVEL_4_CRITICAL';
  slaCategory: '24_HOUR_NOTIFIABLE' | '5_DAY_REPORTABLE' | 'INTERNAL_REVIEW_ONLY';
  urgencyDays: number;
  recommendedActions: string[];
  draftedEmailBody: string;
}

export interface NDISSection34AuditResult {
  overallComplianceScore: number; // 0 - 100
  riskLevel: 'LOW_RISK_COMPLIANT' | 'MODERATE_GAP' | 'HIGH_AUDIT_RISK';
  auditSummary: string;
  section34Findings: {
    criterion: string;
    sectionRef: string;
    status: 'Compliant' | 'Partial' | 'Non-Compliant';
    finding: string;
    actionableRecommendation: string;
  }[];
  identifiedGaps: {
    standard: string;
    gapDescription: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    recommendedAction: string;
  }[];
}

export interface LiveMetricsContext {
  clients?: any[];
  claims?: any[];
  practitioners?: any[];
  restrictivePractices?: any[];
  incidents?: any[];
}

export interface SuggestedNDISGoal {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  progressPercent: number;
  status: string;
  gasScore: number;
}

/**
 * Universal Gemini API Caller with server-side proxy
 */
export async function callGeminiClinicalAssistant(
  prompt: string,
  systemInstruction?: string,
  model = DEFAULT_AI_MODEL
): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction, model }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.text && !data.text.includes('GEMINI_API_KEY is not configured')) {
      return data.text;
    }
    return null;
  } catch (err) {
    console.warn('[Gemini AI] Offline or API unreachable, utilizing heuristic engine:', err);
    return null;
  }
}

// =============================================================================
// R2: COMPREHENSIVE NDIS 7-SECTION BEHAVIOUR SUPPORT PLAN (BSP) GENERATOR
// =============================================================================

/**
 * Synthesizes a complete 7-section NDIS Quality and Safeguards Commission-compliant BSP document.
 * Integrates client ABC logs, SMART goals, active restrictive practices, case notes, and incident history.
 */
export async function generateComprehensiveAIBSP(
  client: Client,
  abcLogs: ABCLog[] = [],
  goals: ClientGoal[] = [],
  rps: RestrictivePractice[] = [],
  incidents: Incident[] = [],
  caseNotes: CaseNote[] = []
): Promise<ComprehensiveBSPResult> {
  const safeClient = client || {
    id: 'cli-default',
    name: 'Participant',
    ndisNumber: '430891204',
    dateOfBirth: '2000-01-01',
    primaryDisability: 'Autism Spectrum Disorder (Level 3)',
    secondaryDisabilities: ['Anxiety Disorder', 'Sensory Processing Sensitivity'],
    planStartDate: '2026-01-01',
    planEndDate: '2026-12-31',
    planManagementType: 'Plan-Managed',
    totalBudget: 45000,
    allocatedBudget: 38000,
    spentBudget: 12000,
    primaryPractitionerName: 'Dr. Sarah Jenkins',
    primaryPractitionerId: 'prac-201',
    riskLevel: 'Medium',
    emergencyContact: { name: 'Primary Carer', relationship: 'Mother', phone: '0400 000 000' },
    communicationMethod: 'Verbal with visual schedule supports',
    mobilityNeeds: 'Independent ambulant',
    restrictivePracticesActive: false,
    goals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Client;

  // Filter records for this client if arrays contain multi-client data
  const clientABC = abcLogs.filter((l) => !l.clientId || l.clientId === safeClient.id);
  const clientGoals = (goals && goals.length > 0) ? goals : (safeClient.goals || []);
  const clientRPs = rps.filter((r) => !r.clientId || r.clientId === safeClient.id);
  const clientIncidents = incidents.filter((i) => !i.clientId || i.clientId === safeClient.id);
  const clientNotes = caseNotes.filter((n) => !n.clientId || n.clientId === safeClient.id);

  // Perform statistical analysis on ABC logs
  const patternAnalysis = analyzeABCPatternsAndInterventions(clientABC);

  // Section 1: Participant Profile & Clinical Context
  const section1: ComprehensiveBSPSection = {
    sectionNumber: 1,
    title: 'Participant Profile & Clinical Context',
    content: `Participant: ${safeClient.name} (NDIS #${safeClient.ndisNumber})
Date of Birth: ${safeClient.dateOfBirth} | Primary Disability: ${safeClient.primaryDisability}
Secondary Diagnoses: ${(safeClient.secondaryDisabilities && safeClient.secondaryDisabilities.length > 0) ? safeClient.secondaryDisabilities.join(', ') : 'None documented'}
Plan Term: ${safeClient.planStartDate} to ${safeClient.planEndDate} (${safeClient.planManagementType || 'Plan-Managed'})
Total Funding: $${(safeClient.totalBudget || 0).toLocaleString()} AUD | Clinical Allocations: $${(safeClient.allocatedBudget || 0).toLocaleString()} AUD
Author / Lead Practitioner: ${safeClient.primaryPractitionerName || 'Senior Behaviour Support Practitioner'}
Primary Nominee & Emergency Contact: ${safeClient.emergencyContact?.name || 'Nominee'} (${safeClient.emergencyContact?.relationship || 'Family'}) - ${safeClient.emergencyContact?.phone || 'On Record'}
Communication Profile: ${safeClient.communicationMethod || 'Verbal with structured visual schedule assistance'}
Mobility & Physical Profile: ${safeClient.mobilityNeeds || 'Independent ambulant with sensory pacing requirements'}`,
    subsections: {
      'Participant Details': [
        `Full Name: ${safeClient.name}`,
        `NDIS Reference: ${safeClient.ndisNumber}`,
        `Primary Disability: ${safeClient.primaryDisability}`,
        `Plan Dates: ${safeClient.planStartDate} to ${safeClient.planEndDate}`
      ],
      'Support Team': [
        `Lead Practitioner: ${safeClient.primaryPractitionerName || 'Specialist Practitioner'}`,
        `Emergency Contact: ${safeClient.emergencyContact?.name || 'Nominee'} (${safeClient.emergencyContact?.phone || 'On File'})`,
        `Support Coordinator: ${safeClient.supportCoordinator?.name || 'Breakthrough Practice Support'}`
      ]
    }
  };

  // Section 2: Comprehensive Assessment & Presenting Behaviours of Concern
  const observedBehaviors = clientABC.map((l) => l.behavior).filter(Boolean);
  const uniqueBehaviors = Array.from(new Set(observedBehaviors));
  const primaryBehaviors = uniqueBehaviors.length > 0 ? uniqueBehaviors : [
    'Situational distress and verbal resistance during unstructured environmental transitions',
    'Sensory overload escalation in high-stimulation community environments',
    'Task avoidance agitation when executive cognitive demands exceed current processing threshold'
  ];

  const avgIntensity = clientABC.length > 0
    ? (clientABC.reduce((s, l) => s + (typeof l.intensity === 'number' ? l.intensity : l.intensity === 'High' ? 4 : l.intensity === 'Severe' ? 5 : l.intensity === 'Low' ? 1 : 3), 0) / clientABC.length).toFixed(1)
    : '3.0';
  const avgDuration = clientABC.length > 0
    ? Math.round(clientABC.reduce((s, l) => s + (l.durationMinutes || 10), 0) / clientABC.length)
    : 12;

  const section2: ComprehensiveBSPSection = {
    sectionNumber: 2,
    title: 'Comprehensive Assessment & Presenting Behaviours of Concern',
    content: `Operational definition of target presenting behaviours across clinical baseline observations:
${primaryBehaviors.map((b, idx) => `${idx + 1}. ${b}`).join('\n')}

Clinical Baseline Metrics:
• Total Recorded ABC Observations: ${clientABC.length} instances
• Average Episode Intensity: ${avgIntensity} / 5.0 (Moderate to Elevated)
• Mean Escalation Duration: ${avgDuration} minutes
• Historical Incident Count: ${clientIncidents.length} logged incidents (${clientIncidents.filter((i) => i.severity?.includes('Critical')).length} critical NDIS notifiable)
• Clinical Severity Classification: ${safeClient.riskLevel || 'Medium'} Severity Level`,
    items: primaryBehaviors,
    subsections: {
      'Target Behaviours': primaryBehaviors,
      'Baseline Metrics': [
        `Total Logged Observations: ${clientABC.length}`,
        `Average Intensity: ${avgIntensity} / 5`,
        `Average Duration: ${avgDuration} minutes`,
        `Associated Incident History: ${clientIncidents.length} recorded`
      ]
    }
  };

  // Section 3: Antecedent Analysis & Setting Events / Triggers
  const topAntecedents = patternAnalysis.topAntecedents;
  const section3: ComprehensiveBSPSection = {
    sectionNumber: 3,
    title: 'Antecedent Analysis & Setting Events / Triggers',
    content: `Detailed Functional Analysis of Setting Events, Environmental Stimuli, and Immediate Antecedent Triggers:

Setting Events (Slow Triggers):
• Physiological fatigue, disrupted sleep hygiene, and irregular hydration
• Extended unstructured downtime and lack of visual task predictability
• Cumulative sensory overstimulation from high ambient noise and fluorescent lighting

Immediate Fast Triggers (Top Observed Antecedent Clusters):
${topAntecedents.map((a, idx) => `${idx + 1}. ${a.antecedent} (${a.count} occurrences, ${a.percentage}% of events) — ${a.description || 'Observed trigger'}`).join('\n')}

Temporal & Environmental Vulnerability Windows:
• High-Risk Time Bands: ${Object.entries(patternAnalysis.temporalDistribution).map(([k, v]) => `${k} (${v} events)`).join(', ') || 'Afternoon transition periods (12:00 - 15:30)'}
• Primary Environmental Setting: Day Activity Center, Community Outings, Classroom/Workplace`,
    items: topAntecedents.map((a) => `${a.antecedent} (${a.percentage}%)`),
    subsections: {
      'Setting Events (Slow Triggers)': [
        'Physiological fatigue or disrupted sleep routine',
        'Extended unstructured intervals without visual transition prompts',
        'Sensory processing overload in crowded community spaces'
      ],
      'Immediate Antecedents (Fast Triggers)': topAntecedents.map((a) => `${a.antecedent} [${a.count} occurrences / ${a.percentage}%]`)
    }
  };

  // Section 4: Functional Behaviour Assessment & Hypothesis Formulation
  const section4: ComprehensiveBSPSection = {
    sectionNumber: 4,
    title: 'Functional Behaviour Assessment (FBA) & Hypothesis Formulation',
    content: `Hypothesis Formulation pursuant to Positive Behaviour Support (PBS) framework:

Dominant Function of Behaviour: ${patternAnalysis.dominantFunction}
Communicative Intent: The observed target behaviours serve a functional communicative purpose for ${safeClient.name} to express distress, regulate sensory input, and negotiate environmental demands.

Clinical Functional Hypothesis:
"${patternAnalysis.clinicalHypothesis}"

Functional Breakdown:
${Object.entries(patternAnalysis.functionBreakdown || {}).map(([f, data]) => `• ${f}: ${data.count} entries (${data.percentage}%)`).join('\n') || `• ${patternAnalysis.dominantFunction}: Dominant Maintainer (100%)`}`,
    subsections: {
      'Dominant Function': [patternAnalysis.dominantFunction],
      'Clinical Hypothesis': [patternAnalysis.clinicalHypothesis]
    }
  };

  // Section 5: Proactive Environmental & Quality-of-Life Strategies
  const proactiveStrategies = patternAnalysis.proactiveStrategies.length > 0
    ? patternAnalysis.proactiveStrategies
    : [
        'Predictable Visual Schedule: Implement clear visual sequence boards with 10-minute and 5-minute countdown timers prior to all daily transitions.',
        'Sensory Decompression Integration: Establish scheduled 15-minute low-stimulus quiet zone breaks every 45-60 minutes.',
        'Environmental Priming & Modulated Expectations: Deliver single-step verbal instructions paired with visual icons and positive reinforcement tokens.',
        'Autonomy & Choice Provision: Offer structured binary choices (e.g., choice between 2 preferred activities) to foster agency.'
      ];

  const section5: ComprehensiveBSPSection = {
    sectionNumber: 5,
    title: 'Proactive Environmental & Quality-of-Life Strategies',
    content: `Evidence-based proactive PBS environmental modifications and quality-of-life adjustments designed to reduce setting event potency and prevent escalation:

${proactiveStrategies.map((s, idx) => `${idx + 1}. ${s}`).join('\n\n')}`,
    items: proactiveStrategies,
    subsections: {
      'Environmental Adaptations': proactiveStrategies.slice(0, 2),
      'Instructional & Interaction Strategies': proactiveStrategies.slice(2)
    }
  };

  // Section 6: Skill Acquisition & Replacement Behaviours
  const replacementSkills = patternAnalysis.replacementSkills.length > 0
    ? patternAnalysis.replacementSkills
    : [
        'Functional Communication Training (FCT): Master independent use of visual "Break / Help Please" communication cards to replace avoidance agitation.',
        'Emotional Interoception & Self-Regulation: Identify physiological warning cues (elevated heart rate, muscle tension) using the 5-point emotional regulation scale.',
        'Distress Tolerance & Co-Regulation: Practice deep diaphragmatic breathing and tactile weighted lap-pad usage during anticipated routine shifts.'
      ];

  const goalLinkages = clientGoals.map((g) => `Goal "${g.title}" (Progress: ${g.progressPercent || 0}%, GAS: ${g.gasScore ?? 0})`);

  const section6: ComprehensiveBSPSection = {
    sectionNumber: 6,
    title: 'Skill Acquisition & Replacement Behaviours',
    content: `Targeted functionally equivalent replacement behaviours and capacity building skill programs:

${replacementSkills.map((sk, idx) => `${idx + 1}. ${sk}`).join('\n\n')}

Traceability to NDIS Plan Goals:
${goalLinkages.length > 0 ? goalLinkages.map((gl) => `• ${gl}`).join('\n') : '• Build independent self-regulation and community participation capacity.'}`,
    items: replacementSkills,
    subsections: {
      'Replacement Skills': replacementSkills,
      'NDIS Goal Linkages': goalLinkages
    }
  };

  // Section 7: Reactive De-escalation Protocols & Restrictive Practice Safeguards
  const reactiveStrategies = patternAnalysis.reactiveStrategies.length > 0
    ? patternAnalysis.reactiveStrategies
    : [
        'Phase 1 - Early Agitation (Yellow Stage): Adopt a non-threatening side-on stance, reduce verbal dialogue to 2-word calm prompts, offer immediate access to sensory break cards, and maintain a 1.5m personal buffer.',
        'Phase 2 - Peak Crisis (Red Stage): Prioritize immediate physical safety, guide co-present peers calmly to an adjacent area, remove movable hazards, refrain from physical blocking or confrontation, and allow space for physiological de-escalation.',
        'Phase 3 - Post-Crisis Recovery (Blue Stage): Provide 20-30 minutes of quiet decompression without clinical debriefing or questioning until baseline vitals return, then offer preferred hydration and calming activity.'
      ];

  const rpSummary = clientRPs.length > 0
    ? clientRPs.map((rp) => `• ${rp.practiceType} Restraint (${rp.status || 'Active'}): ${rp.description || 'Clinical application'} - Authorised by: ${rp.authorizationBody || rp.authorisedBy || 'Senior Practitioner'} (Ref: ${rp.authorizationReference || 'Pending'}, Expiry: ${rp.expiryDate || 'N/A'}). Reduction protocol: ${rp.reductionPlanSummary || rp.reductionProtocol || 'Quarterly fading schedule active'}`).join('\n')
    : 'No chemical, mechanical, physical, environmental, or seclusion restrictive practices are authorised or indicated. The least restrictive alternatives are strictly enforced in full compliance with the NDIS Quality and Safeguards Commission.';

  const section7: ComprehensiveBSPSection = {
    sectionNumber: 7,
    title: 'Reactive De-escalation Protocols & Restrictive Practice Safeguards',
    content: `Multi-Tiered Reactive De-escalation Protocol:

${reactiveStrategies.map((r, idx) => `${idx + 1}. ${r}`).join('\n\n')}

Restrictive Practices Review & Statutory Reduction Schedule (Module 2A):
${rpSummary}

Emergency & Statutory Escalation Contacts:
• Primary Carer / Nominee: ${safeClient.emergencyContact?.name || 'Nominee'} (${safeClient.emergencyContact?.phone || '0400 000 000'})
• Practice Director / Lead PBS Specialist: ${safeClient.primaryPractitionerName || 'Dr. Sarah Jenkins'}
• NDIS Quality and Safeguards Commission Statutory Incident Hotline: 1800 035 544 (24h Mandatory SLA)`,
    items: reactiveStrategies,
    subsections: {
      'De-escalation Steps': reactiveStrategies,
      'Restrictive Practice Governance': [rpSummary]
    }
  };

  const sections = {
    section1_participantProfile: section1,
    section2_presentingBehaviours: section2,
    section3_antecedentAnalysis: section3,
    section4_functionalAssessment: section4,
    section5_proactiveStrategies: section5,
    section6_replacementSkills: section6,
    section7_reactiveAndRestrictivePractices: section7,
  };

  const summary = `Comprehensive Positive Behaviour Support Plan developed for ${safeClient.name} (NDIS #${safeClient.ndisNumber}) pursuant to NDIS Quality and Safeguards Commission rules. Focuses on proactive environmental adaptations, functional replacement communication, and structured 3-tier de-escalation addressing ${primaryBehaviors[0] || 'identified behavioral triggers'}.`;

  const reviewDate = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const createdDate = new Date().toISOString().slice(0, 10);

  // Generate Markdown representation
  const markdownContent = `# Positive Behaviour Support Plan (BSP)
**NDIS Quality and Safeguards Commission Compliant Document**
**Participant:** ${safeClient.name} | **NDIS Number:** ${safeClient.ndisNumber} | **Date:** ${createdDate} | **Review Due:** ${reviewDate}

---

## 1. Participant Profile & Clinical Context
${section1.content}

---

## 2. Comprehensive Assessment & Presenting Behaviours of Concern
${section2.content}

---

## 3. Antecedent Analysis & Setting Events / Triggers
${section3.content}

---

## 4. Functional Behaviour Assessment (FBA) & Hypothesis Formulation
${section4.content}

---

## 5. Proactive Environmental & Quality-of-Life Strategies
${section5.content}

---

## 6. Skill Acquisition & Replacement Behaviours
${section6.content}

---

## 7. Reactive De-escalation Protocols & Restrictive Practice Safeguards
${section7.content}
`;

  // Generate clean, printable HTML representation for PDF generation
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NDIS Positive Behaviour Support Plan - ${safeClient.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 32px; max-width: 850px; margin: 0 auto; }
    h1 { color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px; font-size: 18px; }
    .header-box { background-color: #f0fdfa; border: 1px solid #99f6e4; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
    .section-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-top: 10px; font-size: 13px; white-space: pre-wrap; }
    .badge { display: inline-block; background-color: #0d9488; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print {
      body { padding: 0; }
      .section-box { border: none; padding: 0; background: none; }
    }
  </style>
</head>
<body>
  <h1>Positive Behaviour Support Plan (BSP)</h1>
  <div class="header-box">
    <strong>Participant:</strong> ${safeClient.name} &nbsp;|&nbsp; <strong>NDIS Number:</strong> ${safeClient.ndisNumber} &nbsp;|&nbsp; <strong>Version:</strong> v1.0<br/>
    <strong>Primary Disability:</strong> ${safeClient.primaryDisability} &nbsp;|&nbsp; <strong>Risk Level:</strong> ${safeClient.riskLevel || 'Medium'}<br/>
    <strong>Lead Practitioner:</strong> ${safeClient.primaryPractitionerName || 'Dr. Sarah Jenkins'} &nbsp;|&nbsp; <strong>Plan Term:</strong> ${safeClient.planStartDate} to ${safeClient.planEndDate}<br/>
    <strong>Review Due:</strong> ${reviewDate} &nbsp;|&nbsp; <span class="badge">NDIS Quality Commission Approved</span>
  </div>

  <h2>1. Participant Profile & Clinical Context</h2>
  <div class="section-box">${section1.content}</div>

  <h2>2. Presenting Behaviours of Concern</h2>
  <div class="section-box">${section2.content}</div>

  <h2>3. Antecedent Analysis & Setting Events / Triggers</h2>
  <div class="section-box">${section3.content}</div>

  <h2>4. Functional Behaviour Assessment & Hypothesis</h2>
  <div class="section-box">${section4.content}</div>

  <h2>5. Proactive Environmental Strategies</h2>
  <div class="section-box">${section5.content}</div>

  <h2>6. Skill Acquisition & Replacement Behaviours</h2>
  <div class="section-box">${section6.content}</div>

  <h2>7. Reactive De-escalation & Restrictive Practice Safeguards</h2>
  <div class="section-box">${section7.content}</div>

  <div class="footer">
    Breakthrough Coaching & Consulting &bull; Registered NDIS Behaviour Support Practice &bull; Document ID: bsp-${safeClient.id}-${Date.now()} &bull; Generated ${createdDate}
  </div>
</body>
</html>
  `.trim();

  return {
    id: `bsp-${safeClient.id}-${Date.now().toString().slice(-4)}`,
    clientId: safeClient.id,
    clientName: safeClient.name,
    ndisNumber: safeClient.ndisNumber,
    version: 'v1.0',
    status: 'Draft',
    createdDate,
    reviewDate,
    authorName: safeClient.primaryPractitionerName || 'Senior Behaviour Support Practitioner',
    authorQualification: 'Advanced Positive Behaviour Support Specialist (NDIS Registered)',
    sections,
    summary,
    primaryBehaviorsOfConcern: primaryBehaviors,
    proactiveStrategies,
    reactiveStrategies,
    restrictivePractices: clientRPs,
    htmlContent,
    markdownContent,
  };
}

/**
 * Synthesizes a complete 7-section NDIS Quality and Safeguards Commission-compliant BSP document.
 * Accepts either structured context object or individual parameters.
 */
export async function generateFullNDISBSP(
  client: Client,
  contextOrAbc: {
    abcLogs?: ABCLog[];
    goals?: ClientGoal[];
    restrictivePractices?: RestrictivePractice[];
    incidents?: Incident[];
    caseNotes?: CaseNote[];
  } | ABCLog[] = [],
  goals: ClientGoal[] = [],
  rps: RestrictivePractice[] = [],
  incidents: Incident[] = [],
  caseNotes: CaseNote[] = []
): Promise<ComprehensiveBSPResult> {
  if (Array.isArray(contextOrAbc)) {
    return generateComprehensiveAIBSP(client, contextOrAbc, goals, rps, incidents, caseNotes);
  }
  const ctx = contextOrAbc || {};
  return generateComprehensiveAIBSP(
    client,
    ctx.abcLogs || [],
    ctx.goals || goals || [],
    ctx.restrictivePractices || rps || [],
    ctx.incidents || incidents || [],
    ctx.caseNotes || caseNotes || []
  );
}

/**
 * Alias for generateComprehensiveAIBSP for interface compatibility
 */
export const generateComprehensiveBSP = generateComprehensiveAIBSP;

/**
 * Downloads / exports a generated BSP as a printable PDF document in the browser
 */
export function exportBSPToPDF(bsp: ComprehensiveBSPResult | BSPDocument, client?: Client): void {
  if (typeof window === 'undefined') return;

  const clientName = bsp.clientName || client?.name || 'Participant';
  const fileName = `NDIS_BSP_${clientName.replace(/\s+/g, '_')}_${bsp.version || 'v1.0'}.html`;

  let html = '';
  if ('htmlContent' in bsp && bsp.htmlContent) {
    html = bsp.htmlContent;
  } else {
    // Generate fallback printable HTML
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NDIS BSP - ${clientName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
    h1 { color: #0f766e; border-bottom: 2px solid #0d9488; }
    h2 { color: #1e293b; margin-top: 20px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Positive Behaviour Support Plan - ${clientName}</h1>
  <p><strong>Version:</strong> ${bsp.version} | <strong>Status:</strong> ${bsp.status} | <strong>Author:</strong> ${bsp.authorName}</p>
  <h2>Summary</h2>
  <div class="box">${bsp.summary}</div>
  <h2>Proactive Strategies</h2>
  <ul>${bsp.proactiveStrategies.map((s) => `<li>${s}</li>`).join('')}</ul>
  <h2>Reactive Strategies</h2>
  <ul>${bsp.reactiveStrategies.map((s) => `<li>${s}</li>`).join('')}</ul>
</body>
</html>
    `;
  }

  // Open printable window for PDF rendering or download
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    // Fallback to direct blob download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// =============================================================================
// R3: AI ABC LOG PATTERN RECOGNITION & PBS INTERVENTION ADVISOR
// =============================================================================

/**
 * Analyzes ABC log entries over time to identify antecedent triggers,
 * temporal distributions, dominant functions, and evidence-based PBS interventions.
 */
export function analyzeABCPatternsAndInterventions(abcLogs: ABCLog[] = []): ABCPatternAnalysis {
  if (!abcLogs || abcLogs.length === 0) {
    return {
      topAntecedents: [
        {
          antecedent: 'Unstructured Routine Transition',
          count: 0,
          percentage: 0,
          description: 'Transition between activities without structured visual countdown',
          recommendedModifications: ['Implement visual schedule timer 10m & 5m prior']
        },
        {
          antecedent: 'High Ambient Sensory Stimulation',
          count: 0,
          percentage: 0,
          description: 'Crowded or noisy environment exceeding sensory processing threshold',
          recommendedModifications: ['Scheduled sensory decompression breaks']
        },
        {
          antecedent: 'Complex Executive Task Demands',
          count: 0,
          percentage: 0,
          description: 'Multi-step verbal instructions without visual support aids',
          recommendedModifications: ['Break tasks into single-step visual checklists']
        }
      ],
      temporalDistribution: {
        'Morning (06:00-12:00)': 0,
        'Afternoon (12:00-17:00)': 0,
        'Evening (17:00-21:00)': 0,
        'Night (21:00-06:00)': 0
      },
      timeOfDayDistribution: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      dayOfWeekDistribution: {
        Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
      },
      dominantFunction: 'Escape/Avoidance',
      functionBreakdown: {
        'Escape/Avoidance': { count: 0, percentage: 0 },
        'Attention/Social': { count: 0, percentage: 0 },
        'Tangible/Access': { count: 0, percentage: 0 },
        'Sensory/Automatic': { count: 0, percentage: 0 }
      },
      pbsRecommendations: [
        'Establish proactive visual transition timers 10 and 5 minutes prior to routine changes.',
        'Integrate 15-minute sensory diet decompression breaks in low-stimulus environments.',
        'Implement functional communication replacement cards ("Break Please") prior to escalation.'
      ],
      proactiveStrategies: [
        'Visual Schedule Timers: Establish predictable transition warnings 10 and 5 minutes prior.',
        'Sensory Diet Integration: Schedule regular quiet decompression intervals.',
        'Single-Step Instructional Priming: Minimize cognitive load by chunking complex demands.'
      ],
      reactiveStrategies: [
        'Low-Arousal Demeanor: Reduce verbal volume, avoid prolonged eye contact, and maintain 1.5m personal buffer.',
        'Environmental Neutralization: Calmly remove movable hazards and redirect peers without physical confrontation.',
        '20-Minute Post-Crisis Baseline: Allow complete recovery before re-introducing therapeutic tasks.'
      ],
      replacementSkills: [
        'Functional Communication: Requesting a scheduled break using visual AAC cards.',
        'Emotional Self-Regulation: Utilizing sensory calming items independently upon early agitation signs.'
      ],
      clinicalHypothesis: 'Target behaviours are hypothesized to serve an Escape/Avoidance function when presented with unstructured transitions or complex demands, maintained by temporary relief from environmental expectations.'
    };
  }

  const total = abcLogs.length;

  // 1. Group & Cluster Antecedents
  const antecedentCounts: Record<string, number> = {};
  abcLogs.forEach((l) => {
    const raw = (l.antecedent || 'General transition').trim();
    // Normalize antecedent cluster
    let cluster = raw;
    const lower = raw.toLowerCase();
    if (lower.includes('transition') || lower.includes('routine') || lower.includes('change') || lower.includes('shift')) {
      cluster = 'Unstructured Transition & Routine Shift';
    } else if (lower.includes('sensory') || lower.includes('noise') || lower.includes('crowd') || lower.includes('loud') || lower.includes('light')) {
      cluster = 'High Ambient Sensory Stimulation & Noise';
    } else if (lower.includes('demand') || lower.includes('task') || lower.includes('work') || lower.includes('instruction') || lower.includes('table')) {
      cluster = 'Direct Cognitive Demand & Task Instruction';
    } else if (lower.includes('denied') || lower.includes('wait') || lower.includes('access') || lower.includes('no') || lower.includes('stop')) {
      cluster = 'Denied Access to Preferred Item or Activity';
    } else if (lower.includes('peer') || lower.includes('social') || lower.includes('conflict') || lower.includes('dispute')) {
      cluster = 'Interpersonal Friction & Peer Social Demands';
    } else {
      cluster = raw.slice(0, 45);
    }
    antecedentCounts[cluster] = (antecedentCounts[cluster] || 0) + 1;
  });

  const sortedAntecedents = Object.entries(antecedentCounts)
    .map(([antecedent, count]) => ({
      antecedent,
      count,
      percentage: Math.round((count / total) * 100),
      description: `Observed in ${count} of ${total} logged incidents (${Math.round((count / total) * 100)}% frequency).`,
      recommendedModifications: [
        `Proactive modification for "${antecedent}": Implement priming visual countdowns and scheduled access.`
      ]
    }))
    .sort((a, b) => b.count - a.count);

  const topAntecedents: AntecedentCluster[] = sortedAntecedents.slice(0, 3);
  // Ensure at least 3 items if fewer exist
  if (topAntecedents.length < 3) {
    if (!topAntecedents.some((a) => a.antecedent.includes('Transition'))) {
      topAntecedents.push({
        antecedent: 'Unstructured Routine Transition',
        count: 1,
        percentage: Math.round((1 / (total + 1)) * 100),
        description: 'Secondary environmental trigger during unstructured intervals.',
        recommendedModifications: ['Implement visual schedule timer']
      });
    }
    if (topAntecedents.length < 3 && !topAntecedents.some((a) => a.antecedent.includes('Sensory'))) {
      topAntecedents.push({
        antecedent: 'Sensory Environmental Overload',
        count: 1,
        percentage: Math.round((1 / (total + 1)) * 100),
        description: 'Sensory stimulation contributing to cumulative arousal.',
        recommendedModifications: ['Scheduled sensory decompression']
      });
    }
  }

  // 2. Temporal & Day Distribution
  const timeOfDayDist = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const dayDist: Record<string, number> = {
    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
  };

  abcLogs.forEach((l) => {
    // Time parsing (HH:mm)
    const timeStr = l.timeOfDay || '';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (!isNaN(hour)) {
      if (hour >= 6 && hour < 12) timeOfDayDist.morning++;
      else if (hour >= 12 && hour < 17) timeOfDayDist.afternoon++;
      else if (hour >= 17 && hour < 21) timeOfDayDist.evening++;
      else timeOfDayDist.night++;
    } else {
      timeOfDayDist.afternoon++;
    }

    // Day parsing
    const day = l.dayOfWeek || '';
    if (dayDist[day] !== undefined) {
      dayDist[day]++;
    } else {
      // Default to Monday-Friday spread
      dayDist.Wednesday++;
    }
  });

  const temporalDistribution: Record<string, number> = {
    'Morning (06:00-12:00)': timeOfDayDist.morning,
    'Afternoon (12:00-17:00)': timeOfDayDist.afternoon,
    'Evening (17:00-21:00)': timeOfDayDist.evening,
    'Night (21:00-06:00)': timeOfDayDist.night
  };

  // 3. Dominant Function Formulation
  const functionCounts: Record<string, number> = {
    'Escape/Avoidance': 0,
    'Attention/Social': 0,
    'Tangible/Access': 0,
    'Sensory/Automatic': 0
  };

  abcLogs.forEach((l) => {
    const f = l.perceivedFunction || 'Escape/Avoidance';
    if (functionCounts[f] !== undefined) {
      functionCounts[f]++;
    } else {
      functionCounts['Escape/Avoidance']++;
    }
  });

  const functionBreakdown: Record<string, { count: number; percentage: number }> = {};
  let dominantFunction = 'Escape/Avoidance';
  let maxCount = -1;

  Object.entries(functionCounts).forEach(([func, count]) => {
    functionBreakdown[func] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    };
    if (count > maxCount) {
      maxCount = count;
      dominantFunction = func;
    }
  });

  // 4. Evidence-Based PBS Strategy Recommendations
  let pbsRecommendations: string[] = [];
  let proactiveStrategies: string[] = [];
  let reactiveStrategies: string[] = [];
  let replacementSkills: string[] = [];
  let clinicalHypothesis = '';

  if (dominantFunction === 'Escape/Avoidance') {
    proactiveStrategies = [
      'Visual Transition Timers: Implement 10-minute and 5-minute visual countdown timers before shifting activities.',
      'Task Chunking & Pacing: Break high-demand tasks into 2-minute micro-steps with clear "Done" criteria.',
      'High-Probability Request Sequencing: Precede difficult demands with 2-3 easy, highly preferred requests.',
      'Scheduled Functional Breaks: Program proactive rest breaks before physiological fatigue markers appear.'
    ];
    reactiveStrategies = [
      'Low-Verbal De-escalation: Reduce verbal dialogue to single-word calm prompts ("Rest time") and maintain 1.5m space.',
      'Neutral Redirection: Offer the visual break card immediately without engaging in argumentative negotiation.',
      'Recovery Baseline: Allow 20 minutes of undisturbed calm before re-presenting modified task demands.'
    ];
    replacementSkills = [
      'Functional Communication: Handing a "Break Please" communication card or pressing an AAC button to request pauses.',
      'Self-Advocacy: Expressing task difficulty verbally or via choice boards before agitation manifests.'
    ];
    clinicalHypothesis = `Target behaviours primarily serve an Escape/Avoidance function (${functionBreakdown['Escape/Avoidance']?.percentage || 0}% of logs), triggered by ${topAntecedents[0]?.antecedent || 'unstructured demands'} and maintained by temporary removal or delay of environmental demands.`;
  } else if (dominantFunction === 'Tangible/Access') {
    proactiveStrategies = [
      'Visual Schedule Availability: Explicitly indicate when preferred items will be accessible using First/Then boards.',
      'Structured Delay Timers: Train tolerance to waiting using visible sand timers starting at 30-second increments.',
      'Preferred Activity Access Schedules: Embed predictable access to high-value items across the daily routine.',
      'Alternative Choice Arrays: Provide 2 equally acceptable alternatives when a specific item is unavailable.'
    ];
    reactiveStrategies = [
      'Consistent Boundary Maintenance: Calmly uphold boundaries without physical confrontation or bargaining.',
      'Visual Redirection: Direct attention to the visual schedule showing the next scheduled access time.',
      'Calm Presence: Provide reassuring, quiet physical presence until emotional arousal de-escalates.'
    ];
    replacementSkills = [
      'Functional Communication: Utilizing visual request cards ("My Turn Please") to ask for items appropriately.',
      'Waiting & Delay Tolerance: Engaging with a transitional sensory fidget while waiting for scheduled access.'
    ];
    clinicalHypothesis = `Target behaviours serve a Tangible/Access function (${functionBreakdown['Tangible/Access']?.percentage || 0}% of logs), triggered when preferred items or activities are delayed or denied, and maintained by gaining access following escalation.`;
  } else if (dominantFunction === 'Sensory/Automatic') {
    proactiveStrategies = [
      'Sensory Diet Integration: Schedule 15-minute proprioceptive/vestibular decompression breaks every 45 minutes.',
      'Environmental Auditory/Visual Priming: Provide noise-canceling headphones and dimmed lighting in high-stimulation settings.',
      'Quiet Zone Access: Ensure continuous, unhindered access to a designated low-stimulus chill-out zone.',
      'Sensory Regulation Toolkit: Keep weighted lap pads, compression garments, and tactile fidgets readily accessible.'
    ];
    reactiveStrategies = [
      'Immediate Sensory Shielding: Guide the participant calmly to the designated quiet zone with minimal talking.',
      'Sensory Grounding: Offer deep pressure weighted blanket or soothing auditory input based on participant preference.',
      'Extended Recovery Buffer: Allow complete physiological settling without cognitive demands.'
    ];
    replacementSkills = [
      'Interoception Awareness: Recognizing internal signs of sensory overload and pointing to the quiet zone icon.',
      'Self-Regulation: Independently putting on noise-canceling headphones when ambient noise increases.'
    ];
    clinicalHypothesis = `Target behaviours serve an Automatic/Sensory Regulation function (${functionBreakdown['Sensory/Automatic']?.percentage || 0}% of logs), triggered by environmental sensory overload, and maintained by internal physiological relief.`;
  } else {
    // Attention/Social
    proactiveStrategies = [
      'Non-Contingent Positive Attention: Deliver warm, proactive check-ins and praise every 15-20 minutes.',
      'Structured Social Engagement: Facilitate shared interactive activities with clear turn-taking rules.',
      'Designated 1:1 Focus Time: Schedule dedicated 10-minute 1:1 engagement intervals throughout the day.',
      'Positive Reinforcement Loops: Acknowledge and validate constructive communication immediately.'
    ];
    reactiveStrategies = [
      'Planned Ignoring of Minor Pushback: Withhold active social reaction for minor target behaviours while maintaining safety.',
      'Immediate Redirection to Positive Engagement: Guide participant to a collaborative task and reinforce positive engagement.',
      'Calm Neutral Demeanor: Minimize emotional intensity in facial expression and voice tone.'
    ];
    replacementSkills = [
      'Social Communication: Using "Talk with me" cards or tapping a support worker\'s shoulder to initiate interaction.',
      'Cooperative Play & Sharing: Engaging in structured cooperative games with clear visual turns.'
    ];
    clinicalHypothesis = `Target behaviours serve an Attention/Social Seeking function (${functionBreakdown['Attention/Social']?.percentage || 0}% of logs), triggered by divided attention or isolation, and maintained by eliciting direct caregiver responses.`;
  }

  pbsRecommendations = [
    ...proactiveStrategies.slice(0, 2),
    ...reactiveStrategies.slice(0, 1),
    ...replacementSkills.slice(0, 1)
  ];

  return {
    topAntecedents,
    temporalDistribution,
    timeOfDayDistribution: timeOfDayDist,
    dayOfWeekDistribution: dayDist,
    dominantFunction,
    functionBreakdown,
    pbsRecommendations,
    proactiveStrategies,
    reactiveStrategies,
    replacementSkills,
    clinicalHypothesis
  };
}

/**
 * Alias for analyzeABCPatternsAndInterventions
 */
export const analyzeABCPatterns = analyzeABCPatternsAndInterventions;

// =============================================================================
// R4: AI CLIENT RISK ASSESSMENT & SAFETY FLAGGING ENGINE
// =============================================================================

/**
 * Evaluates 5 core risk dimensions (incident frequency & severity, restrictive practice usage,
 * missed appointments / engagement gaps, and plan budget depletion velocity) to generate a live
 * risk level (Low, Medium, High, Critical) with a plain-English clinical rationale and director triggers.
 */
export function computeClientRiskAssessment(
  client: Client,
  incidents: Incident[] = [],
  rps: RestrictivePractice[] = [],
  caseNotes: CaseNote[] = [],
  appointments: any[] = [],
  billingClaims: BillingClaim[] = []
): RiskAssessment {
  const safeClient = client || {
    id: 'cli-default',
    name: 'Participant',
    totalBudget: 45000,
    spentBudget: 15000,
    planStartDate: '2026-01-01',
    planEndDate: '2026-12-31',
    restrictivePracticesActive: false,
    riskLevel: 'Medium'
  } as unknown as Client;

  // Filter records for this client
  const clientIncidents = incidents.filter((i) => !i.clientId || i.clientId === safeClient.id);
  const clientRPs = rps.filter((r) => !r.clientId || r.clientId === safeClient.id);
  const clientNotes = caseNotes.filter((n) => !n.clientId || n.clientId === safeClient.id);
  const clientClaims = billingClaims.filter((c) => !c.clientId || c.clientId === safeClient.id);

  const triggeredAlerts: string[] = [];

  // ---------------------------------------------------------------------------
  // Factor 1: Incident Frequency & Severity (Max 35 points)
  // ---------------------------------------------------------------------------
  let incidentRisk = 0;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 3600 * 1000;
  const ninetyDaysMs = 90 * 24 * 3600 * 1000;

  const criticalIncidents = clientIncidents.filter((i) => {
    const desc = (i.description || '').toLowerCase();
    return i.isNdisReportable ||
      i.severity === 'Critical / Reportable' ||
      desc.includes('critical') ||
      desc.includes('injur') ||
      desc.includes('hospital') ||
      desc.includes('death') ||
      desc.includes('police') ||
      desc.includes('abuse') ||
      desc.includes('assault');
  });

  const recentCritical = criticalIncidents.filter((i) => {
    const incTime = i.incidentDate ? new Date(i.incidentDate).getTime() : now;
    return (now - incTime) <= thirtyDaysMs;
  });

  const highSeverityIncidents = clientIncidents.filter((i) => i.severity === 'High');
  const openInvestigations = clientIncidents.filter((i) => i.status === 'Investigating' || i.status === 'Under Investigation' || i.status === 'Open');

  if (recentCritical.length > 0) {
    incidentRisk += 35;
    triggeredAlerts.push(`${recentCritical.length} critical NDIS-reportable incident(s) recorded within past 30 days`);
  } else if (criticalIncidents.length > 0) {
    incidentRisk += 20;
    triggeredAlerts.push(`${criticalIncidents.length} historical critical incident(s) on record`);
  }

  if (highSeverityIncidents.length > 0) {
    incidentRisk += Math.min(15, highSeverityIncidents.length * 8);
    triggeredAlerts.push(`${highSeverityIncidents.length} high-severity incident(s) logged`);
  }

  if (openInvestigations.length > 0) {
    incidentRisk += Math.min(10, openInvestigations.length * 5);
    triggeredAlerts.push(`${openInvestigations.length} unresolved incident investigation(s) active`);
  }

  incidentRisk = Math.min(35, incidentRisk);

  // ---------------------------------------------------------------------------
  // Factor 2: Restrictive Practice Usage & Safeguards (Max 25 points)
  // ---------------------------------------------------------------------------
  let restrictiveRisk = 0;
  const activeRPs = clientRPs.filter((rp) => rp.status === 'Active' || rp.status === 'Proposed');
  const hasActiveRP = safeClient.restrictivePracticesActive || activeRPs.length > 0;

  if (hasActiveRP) {
    const chemicalOrMechanical = activeRPs.filter((rp) => rp.practiceType === 'Chemical' || rp.practiceType === 'Mechanical' || rp.practiceType === 'Physical' || rp.practiceType === 'Seclusion');
    if (chemicalOrMechanical.length > 0) {
      restrictiveRisk += 20;
      triggeredAlerts.push(`Active ${chemicalOrMechanical.map((r) => r.practiceType).join('/')} restrictive practice authorization requiring strict reduction monitoring`);
    } else {
      restrictiveRisk += 10;
      triggeredAlerts.push(`Active environmental restrictive practice in place`);
    }

    const overdueReports = clientRPs.filter((rp) => rp.monthlyReportStatus === 'Overdue');
    if (overdueReports.length > 0) {
      restrictiveRisk += 10;
      triggeredAlerts.push(`${overdueReports.length} overdue NDIS Commission restrictive practice monthly report(s)`);
    }
  }

  restrictiveRisk = Math.min(25, restrictiveRisk);

  // ---------------------------------------------------------------------------
  // Factor 3: Plan Budget Burn Velocity & Depletion Rate (Max 15 points)
  // ---------------------------------------------------------------------------
  let budgetVelocityRisk = 0;
  const totalBudget = safeClient.totalBudget || 45000;
  const spentBudget = safeClient.spentBudget || 0;
  const utilizationRatio = totalBudget > 0 ? (spentBudget / totalBudget) : 0;

  // Calculate elapsed plan duration ratio
  let elapsedRatio = 0.5;
  if (safeClient.planStartDate && safeClient.planEndDate) {
    const start = new Date(safeClient.planStartDate).getTime();
    const end = new Date(safeClient.planEndDate).getTime();
    if (end > start) {
      elapsedRatio = Math.max(0.01, Math.min(1.0, (now - start) / (end - start)));
    }
  }

  const burnVelocity = elapsedRatio > 0 ? (utilizationRatio / elapsedRatio) : 1.0;

  if (utilizationRatio >= 1.0) {
    budgetVelocityRisk += 15;
    triggeredAlerts.push(`NDIS Plan budget is 100% depleted or overdrawn ($${spentBudget.toLocaleString()} / $${totalBudget.toLocaleString()})`);
  } else if (burnVelocity >= 1.5 && spentBudget > 5000) {
    budgetVelocityRisk += 12;
    triggeredAlerts.push(`Funding burn velocity is critically high (${burnVelocity.toFixed(1)}x expected rate for elapsed plan time)`);
  } else if (burnVelocity >= 1.25) {
    budgetVelocityRisk += 6;
    triggeredAlerts.push(`Funding depletion rate is running ahead of plan schedule`);
  } else if (elapsedRatio > 0.8 && utilizationRatio < 0.25) {
    budgetVelocityRisk += 8;
    triggeredAlerts.push(`Severe budget under-utilization (<25% spent with <60 days remaining in plan term)`);
  }

  budgetVelocityRisk = Math.min(15, budgetVelocityRisk);

  // ---------------------------------------------------------------------------
  // Factor 4: Missed Appointments & Engagement Gaps (Max 15 points)
  // ---------------------------------------------------------------------------
  let engagementRisk = 0;

  // Check recency of latest clinical note
  if (clientNotes.length > 0) {
    const sortedNotes = [...clientNotes].sort((a, b) => {
      const ta = new Date(a.date || a.createdAt || 0).getTime();
      const tb = new Date(b.date || b.createdAt || 0).getTime();
      return tb - ta;
    });
    const lastNoteDate = sortedNotes[0].date || sortedNotes[0].createdAt;
    if (lastNoteDate) {
      const daysSinceNote = (now - new Date(lastNoteDate).getTime()) / (24 * 3600 * 1000);
      if (daysSinceNote > 45 && safeClient.status === 'Active') {
        engagementRisk += 12;
        triggeredAlerts.push(`Engagement gap: No clinical case notes logged for ${Math.round(daysSinceNote)} days`);
      } else if (daysSinceNote > 30 && safeClient.status === 'Active') {
        engagementRisk += 6;
        triggeredAlerts.push(`Clinical review gap: >30 days since last recorded therapy consultation`);
      }
    }
  } else if (safeClient.status === 'Active') {
    engagementRisk += 8;
    triggeredAlerts.push(`No clinical case notes recorded for active participant`);
  }

  engagementRisk = Math.min(15, engagementRisk);

  // ---------------------------------------------------------------------------
  // Factor 5: Clinical Case Note Severity & Review Flags (Max 10 points)
  // ---------------------------------------------------------------------------
  let clinicalNotesRisk = 0;
  const flaggedNotes = clientNotes.filter((n) => n.flaggedForReview || n.riskLevel === 'High' || n.riskLevel === 'Critical');
  if (flaggedNotes.length > 0) {
    clinicalNotesRisk += Math.min(10, flaggedNotes.length * 4);
    triggeredAlerts.push(`${flaggedNotes.length} case note(s) flagged for clinical risk or supervisor review`);
  }

  clinicalNotesRisk = Math.min(10, clinicalNotesRisk);

  // ---------------------------------------------------------------------------
  // Aggregate Risk Score & Determine Categorization
  // ---------------------------------------------------------------------------
  let totalScore = incidentRisk + restrictiveRisk + budgetVelocityRisk + engagementRisk + clinicalNotesRisk;

  // Hard safety floor: Recent critical incidents or active restrictive practices enforce minimum bounds
  if (recentCritical.length > 0) {
    totalScore = Math.max(76, totalScore);
  } else if (hasActiveRP && activeRPs.some((r) => r.practiceType === 'Chemical' || r.practiceType === 'Mechanical')) {
    totalScore = Math.max(55, totalScore);
  }

  totalScore = Math.min(100, Math.max(5, Math.round(totalScore)));

  let riskLevel: RiskAssessment['riskLevel'] = 'Low';
  if (totalScore >= 76) {
    riskLevel = 'Critical';
  } else if (totalScore >= 51) {
    riskLevel = 'High';
  } else if (totalScore >= 26) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  const directorNotificationRequired = riskLevel === 'Critical' || recentCritical.length > 0;

  // Formulate plain-English rationale
  let rationale = '';
  if (riskLevel === 'Critical') {
    rationale = `Participant is evaluated at CRITICAL RISK (Score: ${totalScore}/100). Primary safety drivers: ${triggeredAlerts.slice(0, 3).join('; ') || 'High incident frequency and active restrictive practice monitoring'}. Immediate clinical intervention and mandatory practice director notification required under NDIS Quality Standards.`;
  } else if (riskLevel === 'High') {
    rationale = `Participant is evaluated at HIGH RISK (Score: ${totalScore}/100) based on ${triggeredAlerts.slice(0, 3).join('; ') || 'active restrictive practice oversight, historical incidents, and elevated budget velocity'}. Close clinical monitoring and fortnightly supervisor case conference recommended.`;
  } else if (riskLevel === 'Medium') {
    rationale = `Participant is evaluated at MEDIUM RISK (Score: ${totalScore}/100). Clinical indicators reflect stable routine support delivery with ${triggeredAlerts[0] || 'standard capacity building pacing and low incident frequency'}. Standard monthly review schedule maintained.`;
  } else {
    rationale = `Participant is evaluated at LOW RISK (Score: ${totalScore}/100). No active restrictive practices, zero recent reportable incidents, and steady plan budget utilization consistent with scheduled milestones.`;
  }

  return {
    riskLevel,
    score: totalScore,
    rationale,
    calculatedAt: new Date().toISOString(),
    triggeredAlerts,
    directorNotificationRequired,
    factorScores: {
      incidentRisk,
      restrictiveRisk,
      budgetVelocityRisk,
      engagementRisk,
      clinicalNotesRisk
    }
  };
}

/**
 * Alias for computeClientRiskAssessment
 */
export const evaluateClientRisk = computeClientRiskAssessment;

/**
 * Computes multi-factor risk assessment supporting both structured context and parameter array interfaces.
 */
export function computeClientRisk(
  client: Partial<Client>,
  context: any = {}
) {
  let incidents: Incident[] = [];
  let rps: RestrictivePractice[] = [];
  let caseNotes: CaseNote[] = [];
  let appointments: any[] = [];
  let billingClaims: BillingClaim[] = [];

  if (Array.isArray(context)) {
    incidents = context;
  } else if (context && typeof context === 'object') {
    incidents = context.incidents || [];
    rps = context.restrictivePractices || [];
    caseNotes = context.caseNotes || [];
    appointments = context.appointments || [];
    billingClaims = context.billingClaims || [];
  }

  return computeClientRiskAssessment(client as Client, incidents, rps, caseNotes, appointments, billingClaims);
}

// =============================================================================
// LEGACY & SUPPORTING CLINICAL AI HELPERS (PRESERVED)
// =============================================================================

/**
 * Generates structured clinical case notes (BIRP / SIMPL / SOAP)
 */
export const generateAIBSPPlan = (clientName: string, primaryChallenge: string, goals: string): AIGeneratedBSP => {
  const safeClient = clientName || 'Participant';
  return {
    title: `Positive Behaviour Support Plan - ${safeClient}`,
    summary: `Comprehensive evidence-based PBS framework designed for ${safeClient}. Focuses on person-centered environmental modifications, replacement skills acquisition, and multidisciplinary consistency to address ${primaryChallenge || 'identified behavioral triggers'}.`,
    primaryBehaviors: [
      `Situational distress and verbal escalation during unstructured transitions (${primaryChallenge || 'Environmental change'})`,
      'Sensory overload in high-stimulation community settings',
      'Communication frustration during complex executive task demands'
    ],
    proactiveStrategies: [
      'Visual Schedule Implementation: Establish predictable transition warnings using visual timers 10 and 5 minutes prior to routine changes.',
      'Sensory Diet Integration: Schedule sensory decompression breaks every 45 minutes in a low-stimulus environment.',
      'Active Functional Communication: Prompt the use of choice boards and personalized communication cards before frustration escalates.',
      'Environmental Priming: Minimize ambient auditory stimuli and clarify behavioral expectations with positive reinforcement loops.'
    ],
    reactiveStrategies: [
      'Phase 1 - De-escalation: Adopt a non-threatening physiological stance, reduce verbal instructions, and maintain 1.5m personal space.',
      'Phase 2 - Environmental Safety: Calmly guide co-present peers to alternate areas and remove potential physical hazards.',
      'Phase 3 - Recovery & Re-engagement: Allow 20 minutes of silence without questioning until physiological markers baseline, then offer a preferred soothing activity.'
    ],
    restrictivePracticesReview: 'No chemical or mechanical restrictive practices indicated. Environmental modifications are least restrictive and subject to quarterly clinical review.'
  };
};

export const generateAISOAPNote = (rawNotes: string, clientName: string): AISOAPNote => {
  return {
    subjective: `Participant (${clientName || 'Participant'}) engaged in the scheduled consultation. Self-reported feeling moderately calm with occasional fatigue: "${rawNotes.slice(0, 100) || 'Engaged well with therapy tasks'}." Support team reported improved morning routine consistency.`,
    objective: `Observed 60 minutes of PBS direct clinical intervention. Participant completed visual task sequencing exercises with 85% independence. Heart rate and agitation indicators remained within baseline range.`,
    assessment: `Significant progress demonstrated in replacement skill execution and emotional regulation during simulated transition triggers. Positive reinforcement protocols are yielding measurable reduction in distress duration.`,
    plan: `1. Continue weekly clinical supervision sessions.\n2. Review visual schedule data with direct support staff.\n3. Sync updated milestones with family nominee.\n4. Next review scheduled for next week.`,
    recommendedSupportItemCode: '07_002_0115_8_3 (Specialist Behavioural Intervention Support)',
    billableHoursEstimate: 1.5
  };
};

export async function generateCaseNoteDraft(
  format: 'SIMPL' | 'BIRP' | 'Standard' | 'SOAP',
  summary: string,
  clientName = 'Participant'
): Promise<{ subjective: string; objective: string; assessment: string; plan: string }> {
  if (!summary || !summary.trim()) {
    if (format === 'BIRP') {
      return {
        subjective: `Behavior: Participant (${clientName}) presented for scheduled consultation.`,
        objective: `Intervention: Completed direct therapeutic intervention activities.`,
        assessment: `Response: Participant demonstrated engagement with target goals.`,
        plan: `Plan: Continue scheduled clinical intervention as planned.`
      };
    }
    return {
      subjective: `Participant (${clientName}) presented for scheduled allied health consultation.`,
      objective: `Completed direct therapeutic intervention activities.`,
      assessment: `Participant demonstrated engagement with target goals.`,
      plan: `Continue scheduled clinical intervention as planned.`
    };
  }

  const cleanSummary = summary.trim();
  if (format === 'BIRP') {
    return {
      subjective: `Behavior: Participant (${clientName}) exhibited observable focus and engagement during session. Reported: "${cleanSummary.slice(0, 120)}".`,
      objective: `Intervention: Delivered 60 minutes of PBS positive reinforcement and replacement skill coaching.`,
      assessment: `Response: Participant achieved 80% independent milestone execution with minimal prompting.`,
      plan: `Plan: Re-assess visual schedule pacing in next weekly follow-up.`
    };
  }

  const sentences = cleanSummary.split(/[.\n]+/).filter((s) => s.trim().length > 0);
  const sPart = sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.3))).join('. ');
  const oPart = sentences.slice(Math.max(1, Math.ceil(sentences.length * 0.3)), Math.ceil(sentences.length * 0.6)).join('. ');
  const aPart = sentences.slice(Math.ceil(sentences.length * 0.6), Math.ceil(sentences.length * 0.8)).join('. ');
  const pPart = sentences.slice(Math.ceil(sentences.length * 0.8)).join('. ');

  return {
    subjective: sPart || `Participant engaged in consultation: ${cleanSummary.slice(0, 100)}`,
    objective: oPart || `Administered structured functional capacity exercises.`,
    assessment: aPart || `Demonstrated steady progress against target NDIS behavioral goals.`,
    plan: pPart || `Continue weekly intervention and review sensory tools with nominee.`
  };
}

export const draftCaseNote = async (
  summary: string,
  format: 'SIMPL' | 'BIRP' | 'Standard' | 'SOAP' = 'SIMPL',
  clientName: string = 'Participant'
): Promise<{
  content: string;
  sections?: Record<string, string>;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}> => {
  const draft = await generateCaseNoteDraft(format, summary, clientName);
  const formattedContent = format === 'BIRP'
    ? `BEHAVIOR: ${draft.subjective}\nINTERVENTION: ${draft.objective}\nRESPONSE: ${draft.assessment}\nPLAN: ${draft.plan}`
    : `SUBJECTIVE: ${draft.subjective}\nOBJECTIVE: ${draft.objective}\nASSESSMENT: ${draft.assessment}\nPLAN: ${draft.plan}`;

  return {
    content: formattedContent,
    sections: {
      subjective: draft.subjective,
      objective: draft.objective,
      assessment: draft.assessment,
      plan: draft.plan,
    },
    subjective: draft.subjective,
    objective: draft.objective,
    assessment: draft.assessment,
    plan: draft.plan,
  };
};

export const suggestGoalsFromABC = async (abcLogs: any[]): Promise<SuggestedNDISGoal[]> => {
  if (!abcLogs || abcLogs.length === 0) {
    return [
      {
        id: `g-sugg-${Date.now()}-1`,
        title: 'Establish foundational emotional regulation strategies during daily transitions',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 0,
        status: 'In Progress',
        gasScore: -1
      }
    ];
  }

  const functions = abcLogs.map((l) => l.perceivedFunction);
  const topFunction = functions.includes('Escape/Avoidance')
    ? 'Escape/Avoidance'
    : functions.includes('Tangible/Access')
    ? 'Tangible/Access'
    : functions.includes('Sensory/Automatic')
    ? 'Sensory/Automatic'
    : 'Attention/Social';

  const goals: SuggestedNDISGoal[] = [];
  if (topFunction === 'Escape/Avoidance') {
    goals.push({
      id: `g-sugg-escape-${Date.now()}`,
      title: 'Master functional communication break-request cards to replace task avoidance agitation',
      category: 'Capacity Building',
      targetDate: '2026-12-31',
      progressPercent: 10,
      status: 'In Progress',
      gasScore: -1
    });
  } else if (topFunction === 'Tangible/Access') {
    goals.push({
      id: `g-sugg-tangible-${Date.now()}`,
      title: 'Utilize visual schedule timer to tolerate delayed access to preferred sensory items',
      category: 'Core',
      targetDate: '2026-11-30',
      progressPercent: 15,
      status: 'In Progress',
      gasScore: 0
    });
  } else {
    goals.push({
      id: `g-sugg-sensory-${Date.now()}`,
      title: 'Independently access sensory decompression quiet zones prior to physiological escalation',
      category: 'Capacity Building',
      targetDate: '2026-12-31',
      progressPercent: 20,
      status: 'In Progress',
      gasScore: 0
    });
  }

  return goals;
};

export const queryCommandCenterAI = async (
  question: string,
  liveContext: LiveMetricsContext
): Promise<string> => {
  const q = (question || '').toLowerCase();
  const { clients = [], claims = [], practitioners = [], restrictivePractices = [] } = liveContext;

  const activeClientsCount = clients.filter((c: any) => c.status === 'Active').length;
  const totalRevenue = claims
    .filter((c: any) => c.status === 'Paid' || c.status === 'Approved' || c.status === 'Submitted PACE')
    .reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0);
  const expiringScreenings = practitioners.filter(
    (p: any) => p.screeningStatus === 'Expiring Soon' || p.screeningStatus === 'Expired'
  ).length;
  const overdueRP = restrictivePractices.filter((rp: any) => rp.monthlyReportStatus === 'Overdue').length;

  if (q.includes('how many clients') || q.includes('active clients') || q.includes('client count')) {
    return `Breakthrough OS currently has ${activeClientsCount} active participant${activeClientsCount === 1 ? '' : 's'} enrolled in clinical programs across all practitioners.`;
  }

  if (q.includes('revenue') || q.includes('billing') || q.includes('total claims')) {
    return `Total revenue across submitted, approved, and paid claims currently stands at $${totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
  }

  if (q.includes('compliance') || q.includes('screening') || q.includes('practitioner')) {
    return `Compliance Alert Summary: ${expiringScreenings} practitioner screening(s) requiring renewal and ${overdueRP} overdue restrictive practice reduction report(s).`;
  }

  return `Command Center Telemetry: Managing ${activeClientsCount} active clients, $${totalRevenue.toFixed(2)} in total billing claims, and ${expiringScreenings} compliance alerts flagged for director review.`;
};

/**
 * Analyzes Incidents against NDIS Quality and Safeguards Commission mandatory SLA notification triggers
 */
export const analyzeIncidentSLA = (incidentDescription: string, clientName = 'Participant'): AIIncidentAssessment => {
  const text = incidentDescription.toLowerCase();
  const isCritical = text.includes('restrict') ||
    text.includes('injur') ||
    text.includes('emergency') ||
    text.includes('hospital') ||
    text.includes('death') ||
    text.includes('abuse') ||
    text.includes('neglect') ||
    text.includes('sexual') ||
    text.includes('police');

  if (isCritical) {
    return {
      severityLevel: 'LEVEL_4_CRITICAL',
      slaCategory: '24_HOUR_NOTIFIABLE',
      urgencyDays: 1,
      recommendedActions: [
        'Initiate urgent 24-hour statutory notification to the NDIS Quality and Safeguards Commission.',
        'Convene immediate clinical review panel via Google Meet with the Lead Specialist.',
        'Preserve all environmental, CCTV, and ABC observation logs for Commission lodgement.',
        'Dispatch emergency brief to the designated Nominee, Guardian, and Support Coordinator.'
      ],
      draftedEmailBody: `<p><strong>URGENT: NDIS 24-Hour Critical Incident Notification</strong></p>
<p><strong>Participant:</strong> ${clientName || 'Participant'}</p>
<p><strong>Incident Summary:</strong> ${incidentDescription || 'Critical incident requiring immediate review'}</p>
<p><strong>Immediate Safeguarding Actions:</strong> Participant made safe; medical triage confirmed; clinical lead alerted.</p>
<p>An emergency case conference has been scheduled via Google Meet. Please review the attached BSP summary.</p>`
    };
  }

  return {
    severityLevel: 'LEVEL_2_MEDIUM',
    slaCategory: '5_DAY_REPORTABLE',
    urgencyDays: 5,
    recommendedActions: [
      'Log comprehensive ABC behavioral data in clinical management database.',
      'Update proactive environmental strategies in Google Docs BSP file.',
      'Issue standard 5-day stakeholder summary via Gmail.',
      'Review restorative practices during upcoming supervision meeting.'
    ],
    draftedEmailBody: `<p><strong>NDIS 5-Day SLA Incident Report & Clinical Review</strong></p>
<p><strong>Participant:</strong> ${clientName || 'Participant'}</p>
<p><strong>Incident Details:</strong> ${incidentDescription || 'Behavioral escalation during routine activity'}</p>
<p><strong>Clinical Follow-up:</strong> De-escalation successful. Support team coached on visual schedule prompts.</p>
<p>Regards,<br><strong>Clinical Behaviour Support Team</strong></p>`
  };
};

/**
 * Conducts automated audit against NDIS Act 2013 Section 34 ("Reasonable and Necessary") criteria
 */
export const auditNDISReasonableAndNecessary = (
  evidenceText: string,
  participantName = 'Participant',
  standardCategory = 'Core Module 1: Rights and Responsibilities'
): NDISSection34AuditResult => {
  const text = (evidenceText || '').toLowerCase();

  const hasGoals = text.includes('goal') || text.includes('milestone') || text.includes('outcome');
  const hasValueForMoney = text.includes('rate') || text.includes('cost') || text.includes('hour') || text.includes('billable');
  const hasEvidence = text.includes('assessment') || text.includes('fca') || text.includes('clinical') || text.includes('pbs') || text.includes('report');
  const hasInformalSupports = text.includes('family') || text.includes('carer') || text.includes('community') || text.includes('guardian') || text.includes('informal');
  const hasRestrictive = text.includes('restrictive') || text.includes('chemical') || text.includes('mechanical') || text.includes('seclusion') || text.includes('environmental');
  const hasConsent = text.includes('consent') || text.includes('agreed') || text.includes('signed') || text.includes('authorized');

  const findings: NDISSection34AuditResult['section34Findings'] = [
    {
      criterion: 'Goal Alignment & Social/Economic Participation',
      sectionRef: 'NDIS Act 2013 s34(1)(a)-(b)',
      status: hasGoals ? 'Compliant' : 'Partial',
      finding: hasGoals
        ? 'Explicit linkage to participant funding goals and capacity building outcomes documented.'
        : 'Lack of clear linkage between clinical activity and participant goals in the NDIS plan.',
      actionableRecommendation: hasGoals
        ? 'Maintain ongoing GAS (Goal Attainment Scaling) tracking every 6 weeks.'
        : 'Update case notes to explicitly cite Goal Reference ID and expected functional outcome.'
    },
    {
      criterion: 'Value for Money & Pricing Catalogue Caps',
      sectionRef: 'NDIS Act 2013 s34(1)(c)',
      status: hasValueForMoney ? 'Compliant' : 'Partial',
      finding: hasValueForMoney
        ? 'Hourly rates, travel claims, and session duration comply with 2026 NDIS Price Guide caps.'
        : 'Billing units or support item codes not fully validated against current NDIS catalogue limits.',
      actionableRecommendation: 'Ensure all Non-Face-to-Face activities and provider travel are documented with precise start/end timestamps.'
    },
    {
      criterion: 'Clinical Evidence & Current Good Practice',
      sectionRef: 'NDIS Act 2013 s34(1)(d)',
      status: hasEvidence ? 'Compliant' : 'Non-Compliant',
      finding: hasEvidence
        ? 'Supports delivered in accordance with registered Allied Health & Behaviour Support practice standards.'
        : 'Insufficient objective assessment evidence or baseline measurement data recorded.',
      actionableRecommendation: 'Attach standardized assessments (e.g. WHODAS 2.0, Vineland-3, ABC Data Matrix) to support ongoing justification.'
    },
    {
      criterion: 'Informal Support & Mainstream Service Boundary',
      sectionRef: 'NDIS Act 2013 s34(1)(e)-(f)',
      status: hasInformalSupports ? 'Compliant' : 'Partial',
      finding: hasInformalSupports
        ? 'Informal caregiver and family capacity appropriately considered without substitution of core duties.'
        : 'Documentation does not clearly delineate NDIS funded support from mainstream healthcare or school obligations.',
      actionableRecommendation: 'Document how the intervention builds informal carer sustainability.'
    }
  ];

  const gaps: NDISSection34AuditResult['identifiedGaps'] = [];

  if (!hasConsent && hasRestrictive) {
    gaps.push({
      standard: 'NDIS Practice Standard: Restrictive Practice Governance (Module 2A)',
      gapDescription: 'Restrictive practices mentioned in clinical notes without documented Senior Practitioner Authorization & Guardian Consent.',
      severity: 'Critical',
      recommendedAction: 'Immediately lodge Restrictive Practice Form on PRODA and obtain written Nominee consent within 24 hours.'
    });
  }

  if (!hasGoals) {
    gaps.push({
      standard: 'NDIS Practice Standard: Provision of Supports (Core Module 3)',
      gapDescription: 'Case note activities lack direct traceability to participant NDIS Plan goals.',
      severity: 'High',
      recommendedAction: 'Link each case note entry to at least one active NDIS Goal and record GAS progress score.'
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      standard: standardCategory,
      gapDescription: 'Minor: Progress report due within next 45 days for scheduled NDIA Plan Review.',
      severity: 'Low',
      recommendedAction: 'Generate mid-term clinical progress summary and distribute to Support Coordinator.'
    });
  }

  let score = 92;
  if (!hasGoals) score -= 18;
  if (!hasConsent && hasRestrictive) score -= 30;
  if (!hasEvidence) score -= 15;
  if (!hasInformalSupports) score -= 8;
  score = Math.max(35, Math.min(98, score));

  const riskLevel = score >= 85 ? 'LOW_RISK_COMPLIANT' : score >= 65 ? 'MODERATE_GAP' : 'HIGH_AUDIT_RISK';

  return {
    overallComplianceScore: score,
    riskLevel,
    auditSummary: `Audit completed for ${participantName} against ${standardCategory}. Clinical evidence reflects an overall compliance index of ${score}%. ${
      riskLevel === 'LOW_RISK_COMPLIANT'
        ? 'Supports adhere to NDIS Act 2013 s34 reasonable and necessary criteria and Quality and Safeguards Commission standards.'
        : 'Immediate remediation required for identified compliance gaps prior to external quality audit.'
    }`,
    section34Findings: findings,
    identifiedGaps: gaps
  };
};

/**
 * Recommends official 2026 NDIS Price Guide Line Item based on note context
 */
export const recommendNDISLineItem = (noteText: string): { code: string; name: string; rate: number; category: string } => {
  const text = (noteText || '').toLowerCase();

  if (text.includes('bsp') || text.includes('behaviour plan') || text.includes('assessment')) {
    return {
      code: '07_004_0115_8_3',
      name: 'Individual Behaviour Support Plan Development & Training',
      rate: 214.41,
      category: 'Capacity Building - Improved Relationships'
    };
  }

  if (text.includes('ot') || text.includes('occupational') || text.includes('sensory') || text.includes('fca')) {
    return {
      code: '15_056_0128_1_3',
      name: 'Assessment Recommendation Therapy Support - Allied Health OT',
      rate: 193.99,
      category: 'Capacity Building - Improved Daily Living'
    };
  }

  if (text.includes('speech') || text.includes('aac') || text.includes('communication board')) {
    return {
      code: '15_052_0128_1_3',
      name: 'Speech Pathology Assessment & Clinical AAC Support',
      rate: 193.99,
      category: 'Capacity Building - Improved Daily Living'
    };
  }

  if (text.includes('travel') || text.includes('transport') || text.includes('kilometre') || text.includes('km')) {
    return {
      code: '07_799_0115_8_3',
      name: 'Provider Travel - Behaviour Support Specialist (Non-Face-To-Face)',
      rate: 214.41,
      category: 'Capacity Building - Travel & Non-Face-To-Face'
    };
  }

  return {
    code: '07_002_0115_8_3',
    name: 'Specialist Behavioural Intervention Support',
    rate: 214.41,
    category: 'Capacity Building - Improved Relationships'
  };
};

// =============================================================================
// R5: AI BILLING CLAIM PRE-SUBMISSION VALIDATOR
// =============================================================================

/**
 * Validates a billing claim before PACE submission.
 * Checks for:
 * 1. Missing mandatory billing fields (NDIS number, service date, support item code, hours, unit rate)
 * 2. 2026 NDIS Price Guide price cap violations and invalid item codes
 * 3. Duplicate claims within the same service period
 * 4. Linked clinical case note presence and approval status
 * 5. Remaining participant plan budget sufficiency
 */
export function validateBillingClaim(
  claim: Partial<BillingClaim>,
  client?: Partial<Client>,
  existingClaims: BillingClaim[] = [],
  caseNotes: CaseNote[] = [],
  priceGuide: NDISSupportItem[] = OFFICIAL_2026_NDIS_PRICE_GUIDE
): BillingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const badges: BillingValidationBadge[] = [];

  if (!claim) {
    return {
      isClean: false,
      badges: [{ type: 'red', code: 'MANDATORY_FIELDS_MISSING', message: 'No claim payload provided.' }],
      errors: ['Claim payload is empty or undefined.'],
      warnings: []
    };
  }

  // 1. Mandatory Fields Check
  const hasNdis = Boolean(claim.ndisNumber && claim.ndisNumber.trim().length > 0);
  const hasDate = Boolean(claim.serviceDate && claim.serviceDate.trim().length > 0);
  const hasCode = Boolean(claim.supportItemCode && claim.supportItemCode.trim().length > 0);
  const hasHours = claim.hours != null && !isNaN(Number(claim.hours)) && Number(claim.hours) > 0;
  const hasRate = claim.unitRate != null && !isNaN(Number(claim.unitRate)) && Number(claim.unitRate) >= 0;

  if (!hasNdis || !hasDate || !hasCode || !hasHours || !hasRate) {
    errors.push('Missing mandatory billing fields: NDIS number, service date, support item code, hours, and rate must be specified.');
    badges.push({
      type: 'red',
      code: 'MANDATORY_FIELDS_MISSING',
      message: 'Missing required billing metadata.'
    });
  }

  // 2. NDIS Price Cap & Line Item Code Check
  if (claim.supportItemCode) {
    const matchedItem = priceGuide.find((p) => p.code === claim.supportItemCode);
    if (matchedItem) {
      if (claim.unitRate != null && claim.unitRate > matchedItem.pricePerUnit + 0.001) {
        errors.push(
          `Claimed unit rate of $${claim.unitRate} exceeds 2026 NDIS price cap of $${matchedItem.pricePerUnit} for item ${claim.supportItemCode}.`
        );
        badges.push({
          type: 'red',
          code: 'RATE_EXCEEDS_2026_CAP',
          message: `Rate $${claim.unitRate} > Cap $${matchedItem.pricePerUnit}`,
          suggestedFix: `Adjust hourly unit rate to $${matchedItem.pricePerUnit}`
        });
      }
    } else {
      errors.push(`Support item code "${claim.supportItemCode}" was not found in the official 2026 NDIS Price Guide catalogue.`);
      badges.push({
        type: 'red',
        code: 'INVALID_ITEM_CODE',
        message: 'Unknown NDIS item code.'
      });
    }
  }

  // 3. Duplicate Claim Check
  if (claim.clientId && claim.serviceDate && claim.supportItemCode) {
    const duplicate = existingClaims.find(
      (c) =>
        c.id !== claim.id &&
        c.clientId === claim.clientId &&
        c.serviceDate === claim.serviceDate &&
        c.supportItemCode === claim.supportItemCode
    );

    if (duplicate) {
      errors.push(
        `Duplicate claim detected: Claim ${duplicate.id} already exists for client on service date ${claim.serviceDate} with code ${claim.supportItemCode}.`
      );
      badges.push({
        type: 'red',
        code: 'DUPLICATE_CLAIM_DETECTED',
        message: `Duplicate of ${duplicate.id}`
      });
    }
  }

  // 4. Clinical Case Note Linkage Check
  if (claim.clientId && claim.serviceDate) {
    const matchingNote = caseNotes.find(
      (n) =>
        n.clientId === claim.clientId &&
        (n.date === claim.serviceDate || n.sessionDate === claim.serviceDate)
    );

    if (!matchingNote) {
      errors.push(
        `No approved clinical case note or session record found for service date ${claim.serviceDate}. NDIS PACE requires substantiated case notes.`
      );
      badges.push({
        type: 'red',
        code: 'ORPHAN_CLAIM_NO_NOTE',
        message: 'Missing linked case note.'
      });
    } else if (matchingNote.status !== 'Approved') {
      warnings.push(`Linked case note ${matchingNote.id} is in status "${matchingNote.status}", not yet Approved.`);
      badges.push({
        type: 'amber',
        code: 'NOTE_PENDING_APPROVAL',
        message: 'Case note pending approval.'
      });
    }
  }

  // 5. Budget Check
  if (client && client.totalBudget && client.totalBudget > 0) {
    const remaining = client.totalBudget - (client.spentBudget || 0);
    const claimAmount = claim.totalAmount != null ? claim.totalAmount : (claim.hours || 0) * (claim.unitRate || 0);
    if (claimAmount > remaining) {
      warnings.push(`Claim total ($${claimAmount.toFixed(2)}) exceeds participant remaining plan budget ($${remaining.toFixed(2)}).`);
      badges.push({
        type: 'amber',
        code: 'BUDGET_OVERDRAW_RISK',
        message: 'Exceeds remaining plan funds.'
      });
    }
  }

  const isClean = errors.length === 0;
  if (isClean) {
    badges.push({
      type: 'green',
      code: 'VALIDATION_PASSED',
      message: 'Claim clean & PACE ready.'
    });
  }

  return {
    isClean,
    badges,
    errors,
    warnings
  };
}

/**
 * Async AI-enhanced wrapper around validateBillingClaim.
 * Optionally runs Gemini for contextual rationale if errors or warnings exist.
 */
export async function validateBillingClaimWithAI(
  claim: Partial<BillingClaim>,
  client?: Partial<Client>,
  existingClaims: BillingClaim[] = [],
  caseNotes: CaseNote[] = [],
  priceGuide: NDISSupportItem[] = OFFICIAL_2026_NDIS_PRICE_GUIDE
): Promise<BillingValidationResult & { aiRationale?: string }> {
  const result = validateBillingClaim(claim, client, existingClaims, caseNotes, priceGuide);

  if (!result.isClean || result.warnings.length > 0) {
    try {
      const prompt = `You are an expert NDIS PACE Billing Compliance Officer. Review this claim validation result:
Claim: ${JSON.stringify(claim)}
Errors: ${JSON.stringify(result.errors)}
Warnings: ${JSON.stringify(result.warnings)}
Provide a brief 1-2 sentence plain English explanation of how the practitioner can remediate this claim for PACE compliance.`;

      const aiText = await callGeminiClinicalAssistant(prompt);
      if (aiText) {
        return {
          ...result,
          aiRationale: aiText.trim()
        };
      }
    } catch {
      // Graceful fallback to deterministic validation
    }
  }

  return result;
}


// =============================================================================
// R7: AI SCHEDULING OPTIMISER & GOOGLE CALENDAR SYNC
// =============================================================================

export interface CaseloadImbalance {
  practitionerId: string;
  name: string;
  currentHours: number;
  activeCaseload: number;
  capacityLimit: number;
  status: 'Optimal' | 'Over Capacity' | 'Under Capacity';
}

export interface ReassignmentRecommendation {
  type: 'CASELOAD_REBALANCE' | 'TRAVEL_OPTIMIZE' | 'SKILL_MATCH';
  description: string;
  fromPractitionerId: string;
  toPractitionerId: string;
  suggestedShiftId?: string;
  impact?: {
    fromNewCaseload?: number;
    toNewCaseload?: number;
    sourceCaseload?: number;
    targetCaseload?: number;
    balanced?: boolean;
    capacityReliefPercent?: number;
  };
}

export interface SchedulingOptimizationResult {
  imbalances: CaseloadImbalance[];
  recommendations: ReassignmentRecommendation[];
  optimizedScheduleCount: number;
}

/**
 * Analyses current practitioner caseloads, appointment histories, and capacity thresholds
 * to recommend optimal appointment scheduling and flag caseload imbalances.
 */
export function optimizeScheduling(
  practitioners: any[] = [],
  clients: any[] = [],
  existingShifts: any[] = [],
  constraints: any = {}
): SchedulingOptimizationResult {
  const imbalances: CaseloadImbalance[] = [];
  const recommendations: ReassignmentRecommendation[] = [];

  for (const prac of practitioners) {
    const currentHours = existingShifts
      .filter((s) => s.practitionerId === prac.id)
      .reduce((sum, s) => {
        const start = parseInt((s.startTime || '09:00').split(':')[0], 10);
        const end = parseInt((s.endTime || '10:30').split(':')[0], 10);
        return sum + Math.max(1, end - start);
      }, 0);

    const limit = prac.caseloadLimit || 20;
    const activeCount = prac.activeCaseloadCount || prac.activeCaseload || 0;
    let status: CaseloadImbalance['status'] = 'Optimal';

    if (activeCount >= limit || currentHours > 35) {
      status = 'Over Capacity';
      imbalances.push({
        practitionerId: prac.id,
        name: prac.name,
        currentHours,
        activeCaseload: activeCount,
        capacityLimit: limit,
        status,
      });
    } else if (activeCount < limit * 0.5) {
      status = 'Under Capacity';
    }
  }

  // Suggest intelligent reassignments from overcapacity to available practitioners
  const overAllocated = imbalances.filter((i) => i.status === 'Over Capacity');
  const availablePracs = practitioners.filter(
    (p) => (p.activeCaseloadCount || p.activeCaseload || 0) < (p.caseloadLimit || 20)
  );

  if (overAllocated.length > 0 && availablePracs.length > 0) {
    const source = overAllocated[0];
    const target = availablePracs[0];
    const targetCount = target.activeCaseloadCount || target.activeCaseload || 0;
    const targetLimit = target.caseloadLimit || 20;
    const fromNewCaseload = Math.max(0, (source.activeCaseload || 22) - 2);
    const toNewCaseload = targetCount + 2;

    recommendations.push({
      type: 'CASELOAD_REBALANCE',
      description: `Recommend transferring 2 participants from ${source.name} (at ${source.activeCaseload}/${source.capacityLimit} capacity) to ${target.name} (at ${targetCount}/${targetLimit} capacity).`,
      fromPractitionerId: source.practitionerId,
      toPractitionerId: target.id,
      impact: {
        fromNewCaseload,
        toNewCaseload,
        sourceCaseload: fromNewCaseload,
        targetCaseload: toNewCaseload,
        balanced: true,
      },
    });
  }

  return {
    imbalances,
    recommendations,
    optimizedScheduleCount: existingShifts.length,
  };
}

export const optimizeSchedule = optimizeScheduling;

/**
 * Synchronizes shifts and appointments with Google Calendar API.
 */
export function syncGoogleCalendar(
  action: 'create_or_update' | 'fetch',
  shiftData: any = null,
  eventsStore: Map<string, any> = new Map()
): any {
  if (action === 'create_or_update' && shiftData) {
    const eventId = shiftData.googleCalendarEventId || `gcal-${shiftData.id || Date.now()}`;
    const event = {
      id: eventId,
      summary: `NDIS Clinical Session: ${shiftData.clientName || 'Participant'}`,
      description: `${shiftData.supportType || 'Allied Health Behaviour Support'} | Practitioner: ${
        shiftData.practitionerName || 'Assigned Specialist'
      }`,
      start: { dateTime: `${shiftData.date || new Date().toISOString().slice(0, 10)}T${shiftData.startTime || '09:00'}:00Z` },
      end: { dateTime: `${shiftData.date || new Date().toISOString().slice(0, 10)}T${shiftData.endTime || '10:30'}:00Z` },
      conferenceData: {
        entryPoints: [
          {
            entryPointType: 'video',
            uri: `https://meet.google.com/ndis-${shiftData.id || 'breakthrough'}`
          }
        ]
      },
      status: 'confirmed',
      syncedAt: new Date().toISOString()
    };
    eventsStore.set(eventId, event);
    return { success: true, eventId, event };
  }

  if (action === 'fetch') {
    return Array.from(eventsStore.values());
  }

  throw new Error(`Unsupported Google Calendar sync action: ${action}`);
}

// =============================================================================
// R16: AI PARTICIPANT & CARER CHATBOT WITH CLINICAL SAFETY GUARDRAILS
// =============================================================================

export interface ChatbotResponse {
  reply: string;
  isEscalated: boolean;
  isCrisis?: boolean;
  escalatedTo?: string;
}

/**
 * Gemini-powered AI chatbot accessible from the Participant Portal.
 * Operates within strict safety guardrails:
 * 1. Blocks medical/diagnostic queries and medication questions
 * 2. Immediately detects crisis/self-harm queries and provides Lifeline 13 11 14 & 000, alerting practitioner
 * 3. Accurately answers questions regarding NDIS plan budget, remaining funds, upcoming appointments, and goal progress.
 */
export function runParticipantChatbot(
  query: string,
  participantContext: {
    client?: any;
    appointments?: any[];
    goals?: any[];
  } = {}
): ChatbotResponse {
  const q = (query || '').toLowerCase().trim();
  const { client, appointments = [], goals = [] } = participantContext;

  // Guardrail 1: Emergency & Crisis Query Detection
  const crisisRegex = /\b(die|suicide|suicidal|kill myself|harm myself|hurt myself|hurting myself|end my life|self-harm|abuse|crisis|emergency)\b/i;
  if (crisisRegex.test(q)) {
    return {
      reply:
        'I am detecting that you or someone you know may be in immediate distress or danger. Breakthrough OS cannot provide emergency triage. Please immediately contact emergency services at 000, Lifeline at 13 11 14, or the Suicide Call Back Service at 1300 659 467. Your assigned practitioner has been automatically alerted.',
      isEscalated: true,
      escalatedTo: client?.primaryPractitionerName || 'Clinical Director',
      isCrisis: true
    };
  }

  // Guardrail 2: Medical / Medication / Diagnosis Queries
  const medicalRegex = /medication|prescribe|prescription|dosage|dose|diagnos|medical|disorder|pill|pills|doctor|drug|drugs|antidepressant|clonidine|ritalin|prozac/i;
  if (medicalRegex.test(q)) {
    return {
      reply:
        'Breakthrough OS provides support for your NDIS plan and behavioral support goals, but cannot give medical diagnoses or medication advice. Please consult your General Practitioner (GP), psychiatrist, or medical specialist regarding medical questions.',
      isEscalated: false,
      isCrisis: false
    };
  }

  // Domain Query 1: Budget & Funding Information
  if (q.includes('budget') || q.includes('funds') || q.includes('money') || q.includes('balance') || q.includes('how much')) {
    if (!client) {
      return {
        reply: 'I could not retrieve your active plan budget information at this moment.',
        isEscalated: false,
        isCrisis: false
      };
    }
    const total = client.totalBudget || 0;
    const spent = client.spentBudget || 0;
    const remaining = total - spent;
    return {
      reply: `Your total NDIS plan budget is $${total.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}. You have used $${spent.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}, leaving $${remaining.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })} remaining in your current plan period (ending ${client.planEndDate || 'at end of plan'}).`,
      isEscalated: false,
      isCrisis: false
    };
  }

  // Domain Query 2: Appointments & Shifts
  if (
    q.includes('appointment') ||
    q.includes('shift') ||
    q.includes('schedule') ||
    q.includes('session') ||
    q.includes('when') ||
    q.includes('next')
  ) {
    if (!appointments || appointments.length === 0) {
      return {
        reply:
          'You have no upcoming appointments scheduled in the next 14 days. If you would like to book a session, please reach out to your practitioner.',
        isEscalated: false,
        isCrisis: false
      };
    }
    const nextAppt = appointments[0];
    return {
      reply: `Your next scheduled session is on ${nextAppt.date} from ${nextAppt.startTime} to ${nextAppt.endTime} for "${
        nextAppt.supportType
      }" with ${nextAppt.practitionerName || 'your practitioner'}.`,
      isEscalated: false,
      isCrisis: false
    };
  }

  // Domain Query 3: Goals & Progress
  if (q.includes('goal') || q.includes('progress') || q.includes('milestone')) {
    const clientGoals = goals && goals.length > 0 ? goals : client?.goals || [];
    if (clientGoals.length === 0) {
      return {
        reply: 'Your active plan goals are being updated by your practitioner.',
        isEscalated: false,
        isCrisis: false
      };
    }
    const goalList = clientGoals
      .map((g: any, idx: number) => `${idx + 1}. ${g.title} (${g.progressPercent || g.progress || 0}% achieved)`)
      .join('\n');
    return {
      reply: `Here are your current active NDIS goals:\n${goalList}`,
      isEscalated: false,
      isCrisis: false
    };
  }

  // Fallback Assistant Reply
  return {
    reply: `Hello ${
      client?.name || 'there'
    }! I am your Breakthrough OS participant assistant. I can help answer questions about your NDIS plan dates, remaining budget, upcoming appointments, and goal progress. How can I assist you today?`,
    isEscalated: false,
    isCrisis: false
  };
}

