/**
 * Breakthrough OS — Company Policy & SOP Knowledge Base (RAG Engine)
 * Grounds clinical, compliance, incident, and billing workflows in internal SOPs and NDIS Practice Standards.
 */

import type { CaseNote, PolicyDocument, PolicySearchResult, PolicyAuditResult } from '@/types';

export const COMPANY_SOP_REGISTRY: PolicyDocument[] = [
  {
    id: 'sop-ndis-ps-01',
    title: 'NDIS Practice Standards — High-Intensity & Specialist Behaviour Support',
    category: 'NDIS_PRACTICE_STANDARDS',
    documentNumber: 'SOP-CLIN-001',
    version: '2026.2',
    effectiveDate: '2026-01-01',
    summary: 'Mandatory clinical delivery framework for NDIS Specialist Behaviour Support (Item 07_002_0115_8_3) requiring functional assessments and proactive environmental adjustments.',
    contentChunks: [
      'Specialist behaviour intervention supports must be delivered by NDIS Commission registered practitioners (Core Module 2A).',
      'Interventions must prioritize proactive skill development, communication replacement strategies, and sensory co-regulation over reactive measures.',
      'All clinical sessions must document objective behavioral baseline measurements, intervention modalities deployed, and measurable goal progression.',
      'Direct participant and nominee consent must be obtained prior to developing or amending behaviour support interventions.',
    ],
    mandatoryRequirements: [
      'Active NDIS Participant Consent on file',
      'Clinical baseline measurements documented per session',
      'Direct link to funded NDIS Capacity Building goal',
      'Evidence-based PBS replacement skill practice',
    ],
    citationRef: 'NDIS (Provider Registration and Practice Standards) Rules 2018, Schedule 3 — Module 2A',
    tags: ['ndis', 'practice-standards', 'pbs', 'capacity-building', 'consent'],
  },
  {
    id: 'sop-rp-02',
    title: 'Restrictive Practices Authorisation, Protocol & Zero-Tolerance Policy',
    category: 'RESTRICTIVE_PRACTICES',
    documentNumber: 'SOP-COMP-002',
    version: '2026.1',
    effectiveDate: '2026-01-01',
    summary: 'Guidelines governing the identification, reduction, elimination, and statutory reporting of chemical, mechanical, physical, environmental, and seclusion restrictive practices.',
    contentChunks: [
      'Any restrictive practice (chemical, physical, mechanical, environmental, or seclusion) must be clearly identified in an approved Comprehensive Behaviour Support Plan.',
      'Unauthorised Restrictive Practices (URPs) must be treated as reportable incidents to the NDIS Commission within 5 business days.',
      'Every BSP containing a regulated restrictive practice must feature a clearly defined fade-out and elimination schedule with 6-month formal clinical reviews.',
      'Prone, supine, or any physical restraint that impairs respiration or circulation is strictly prohibited with zero tolerance under Australian law.',
    ],
    mandatoryRequirements: [
      'State/Territory Authorisation panel approval',
      'Documented fade-out and elimination schedule',
      'Monthly NDIS Commission Restrictive Practice portal lodgement',
      'Debriefing protocol with participant within 24 hours of any restraint deployment',
    ],
    citationRef: 'National Disability Insurance Scheme (Restrictive Practices and Behaviour Support) Rules 2018 (Part 3)',
    tags: ['restrictive-practices', 'urp', 'commission-reporting', 'fade-out', 'safety'],
  },
  {
    id: 'sop-inc-03',
    title: 'Critical Incident Management, Escalation & Statutory Reporting Protocol',
    category: 'INCIDENT_MANAGEMENT',
    documentNumber: 'SOP-GOV-003',
    version: '2026.1',
    effectiveDate: '2026-01-01',
    summary: 'Standard operating procedure for immediate clinical triage, 24-hour Commission notification, risk investigation, and root cause analysis.',
    contentChunks: [
      'Tier 1 Critical Incidents (death, serious injury, abuse, neglect, or unlawful assault) require immediate notification to the Practice Director within 2 hours and statutory lodgement to the NDIS Quality and Safeguards Commission within 24 hours.',
      'Tier 2 Incidents (unauthorised restrictive practice, property damage >$500, emergency services dispatch) require NDIS Commission reporting within 5 business days.',
      'A structured 4-step investigation workflow must be conducted: Initial Log -> Investigation Notes -> Senior Clinical Review -> Practice Director Sign-Off.',
      'Root Cause Analysis (RCA) and preventive action items must be closed within 14 business days of incident occurrence.',
    ],
    mandatoryRequirements: [
      '24-hour statutory notification for critical incidents',
      '4-step multi-tier sign-off audit trail',
      'Participant emergency contact notification within 4 hours',
      'Post-incident support and carer debriefing documentation',
    ],
    citationRef: 'NDIS (Incident Management and Reportable Incidents) Rules 2018 (Sections 19–21)',
    tags: ['incident-reporting', 'reportable-incidents', 'statutory', 'safety', 'director-signoff'],
  },
  {
    id: 'sop-case-04',
    title: 'Clinical Case Note Documentation & Audit Compliance Standard',
    category: 'CASE_NOTES_AUDIT',
    documentNumber: 'SOP-CLIN-004',
    version: '2026.2',
    effectiveDate: '2026-01-01',
    summary: 'Professional documentation guidelines mandating SIMPL or BIRP structure, objective language, Goal Attainment Scaling (GAS), and anti-tamper signing.',
    contentChunks: [
      'Case notes must be recorded and committed within 24 hours of session delivery to preserve audit authenticity.',
      'Language must remain objective, non-judgmental, neuroaffirming, and trauma-informed, separating participant observable facts from practitioner inferences.',
      'Every session note must link to at least one active NDIS capacity building goal and record a Goal Attainment Scaling (GAS) delta (-2 to +2).',
      'Billing claim auto-generation requires a complete clinical note with validated practitioner digital signature.',
    ],
    mandatoryRequirements: [
      'SIMPL or BIRP clinical framework structure',
      'Committed within 24 hours of session delivery',
      'Linked NDIS funded goal with GAS progress score',
      'Digital signature verification stamp',
    ],
    citationRef: 'NDIS Quality and Safeguards Commission Clinical Governance Framework (Module 1, Section 4.2)',
    tags: ['case-notes', 'simpl', 'birp', 'gas-scoring', 'clinical-governance'],
  },
];

/**
 * Semantic keyword search across the internal Company Policy & SOP Knowledge Base
 */
export function searchPolicyKnowledge(query: string): PolicySearchResult[] {
  if (!query || query.trim().length === 0) {
    return COMPANY_SOP_REGISTRY.map(doc => ({
      documentId: doc.id,
      title: doc.title,
      category: doc.category,
      relevanceScore: 1.0,
      matchedChunk: doc.summary,
      citationRef: doc.citationRef,
      mandatoryRequirements: doc.mandatoryRequirements,
    }));
  }

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const results: PolicySearchResult[] = [];

  for (const doc of COMPANY_SOP_REGISTRY) {
    let score = 0;
    let bestChunk = doc.summary;

    // Title match
    if (doc.title.toLowerCase().includes(query.toLowerCase())) score += 10;
    // Tag match
    for (const tag of doc.tags) {
      if (query.toLowerCase().includes(tag)) score += 5;
    }

    // Chunk match
    for (const chunk of doc.contentChunks) {
      let chunkHits = 0;
      for (const term of terms) {
        if (chunk.toLowerCase().includes(term)) chunkHits++;
      }
      if (chunkHits > 0) {
        score += chunkHits * 3;
        bestChunk = chunk;
      }
    }

    if (score > 0) {
      results.push({
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        relevanceScore: Math.min(100, Math.round(score * 10)),
        matchedChunk: bestChunk,
        citationRef: doc.citationRef,
        mandatoryRequirements: doc.mandatoryRequirements,
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Audits a draft or signed clinical case note against company SOPs and NDIS Practice Standards.
 */
export function auditCaseNoteAgainstSOPs(note: CaseNote): PolicyAuditResult {
  const deficiencies: PolicyAuditResult['flaggedDeficiencies'] = [];
  const passed: string[] = [];

  // Check 1: Framework structure (Subjective, Objective, Assessment, Plan)
  if (note.subjective && note.objective && note.assessment && note.plan) {
    passed.push('SIMPL / BIRP Complete 4-Quadrant Clinical Structure (SOP-CLIN-004)');
  } else {
    deficiencies.push({
      standard: 'SOP-CLIN-004 (Documentation Standard)',
      requirement: 'Complete 4-Quadrant Clinical Framework',
      finding: 'One or more required sections (Subjective, Objective, Assessment, Plan) are empty.',
      suggestedRemedy: 'Complete all 4 clinical quadrants to satisfy NDIS Commission Section 34 audit requirements.',
      severity: 'High',
    });
  }

  // Check 2: Linked Goals
  if (note.linkedGoalIds && note.linkedGoalIds.length > 0) {
    passed.push('Linked to Funded NDIS Goals (SOP-CLIN-001)');
  } else {
    deficiencies.push({
      standard: 'SOP-CLIN-001 (NDIS Practice Standards)',
      requirement: 'Direct link to funded NDIS Capacity Building goal',
      finding: 'Session note does not specify which NDIS participant goal was supported.',
      suggestedRemedy: 'Select at least one active capacity building goal from the participant profile.',
      severity: 'Medium',
    });
  }

  // Check 3: Non-judgmental & Objective language checks
  const subjectiveLower = (note.subjective || '').toLowerCase();
  const subjectiveFlagWords = ['naughty', 'bad', 'manipulative', 'stubborn', 'refused on purpose', 'aggressive for no reason'];
  const foundFlagWords = subjectiveFlagWords.filter(w => subjectiveLower.includes(w));

  if (foundFlagWords.length === 0) {
    passed.push('Neuroaffirming & Objective Clinical Language (SOP-CLIN-004)');
  } else {
    deficiencies.push({
      standard: 'SOP-CLIN-004 (Language Standards)',
      requirement: 'Objective, non-judgmental, trauma-informed terminology',
      finding: `Found non-clinical terms: "${foundFlagWords.join(', ')}".`,
      suggestedRemedy: 'Replace subjective labels with observable behavioral descriptions (e.g. "displayed distress indicators" instead of "bad").',
      severity: 'Medium',
    });
  }

  // Check 4: Restrictive Practice mention
  const allText = `${note.subjective} ${note.objective} ${note.assessment} ${note.plan}`.toLowerCase();
  const rpWords = ['held down', 'locked in', 'physically restrained', 'chemical restraint', 'sedated', 'seclusion'];
  const foundRP = rpWords.filter(w => allText.includes(w));

  if (foundRP.length > 0) {
    deficiencies.push({
      standard: 'SOP-COMP-002 (Restrictive Practices Protocol)',
      requirement: 'Statutory Restrictive Practice Incident Reporting',
      finding: `Note references potential restraint: "${foundRP.join(', ')}".`,
      suggestedRemedy: 'Ensure an official Incident Record and NDIS Commission Restrictive Practice notification are submitted immediately.',
      severity: 'High',
    });
  } else {
    passed.push('Zero Unauthorised Restrictive Practice Indications (SOP-COMP-002)');
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - deficiencies.length * 25)));

  return {
    isAuditCompliant: deficiencies.length === 0,
    complianceScore: score,
    passedStandards: passed,
    flaggedDeficiencies: deficiencies,
    citationReferences: [
      'NDIS (Provider Registration and Practice Standards) Rules 2018, Schedule 3',
      'NDIS (Restrictive Practices and Behaviour Support) Rules 2018 (Part 3)',
      'NDIS Quality and Safeguards Commission Clinical Governance Framework (SOP-CLIN-004)',
    ],
  };
}
