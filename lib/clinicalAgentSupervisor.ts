import { CaseNote, Client, RestrictivePractice } from '../types';

export interface ClinicalAuditFinding {
  ruleId: string;
  category: 'SOAP_COMPLIANCE' | 'NDIS_PRICE_GUIDE' | 'RESTRICTIVE_PRACTICE' | 'GOAL_ALIGNMENT';
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
  message: string;
  remediationSnippet?: string;
}

export interface ClinicalSupervisionReview {
  caseNoteId: string;
  complianceScore: number; // 0 - 100
  isApprovedForBilling: boolean;
  findings: ClinicalAuditFinding[];
  recommendedGASScore: number;
  supervisedAt: string;
}

export class ClinicalAgentSupervisor {
  /**
   * Evaluates a clinical case note against NDIS Practice Standards & SOAP rigor.
   */
  public static reviewCaseNote(
    note: CaseNote,
    client?: Client,
    clientRPs?: RestrictivePractice[]
  ): ClinicalSupervisionReview {
    const findings: ClinicalAuditFinding[] = [];
    let score = 100;

    // 1. SOAP Rigor Checks
    if (!note.subjective || note.subjective.length < 20) {
      findings.push({
        ruleId: 'SOAP_SUBJ_INSUFFICIENT',
        category: 'SOAP_COMPLIANCE',
        severity: 'WARNING',
        message: 'Subjective section lacks sufficient context regarding participant presentation or direct quotes.',
      });
      score -= 15;
    }

    if (!note.objective || note.objective.length < 30) {
      findings.push({
        ruleId: 'SOAP_OBJ_INSUFFICIENT',
        category: 'SOAP_COMPLIANCE',
        severity: 'CRITICAL',
        message: 'Objective data lacks measurable metrics (e.g. frequency, duration, intensity of target behaviors).',
      });
      score -= 25;
    }

    if (!note.assessment || note.assessment.length < 20) {
      findings.push({
        ruleId: 'SOAP_ASSESS_INSUFFICIENT',
        category: 'SOAP_COMPLIANCE',
        severity: 'WARNING',
        message: 'Clinical assessment does not interpret the efficacy of positive behaviour support interventions applied.',
      });
      score -= 15;
    }

    // 2. Restrictive Practice Detection
    const mentionsRestraint =
      /seclusion|lock|held down|physical restraint|chemical|prn medication|sedat/i.test(
        `${note.subjective} ${note.objective} ${note.assessment} ${note.plan}`
      );

    if (mentionsRestraint) {
      const hasAuthorizedRP = clientRPs && clientRPs.some((rp) => rp.status === 'Authorized' || rp.status === 'Active');
      if (!hasAuthorizedRP) {
        findings.push({
          ruleId: 'UNAUTHORIZED_RESTRICTIVE_PRACTICE_DETECTED',
          category: 'RESTRICTIVE_PRACTICE',
          severity: 'CRITICAL',
          message: 'Note mentions restrictive procedures without a corresponding state-authorized RP on file. Mandatory 24-hour Commission notification required.',
        });
        score -= 40;
      }
    }

    // 3. Goal Alignment
    if (!note.linkedGoalIds || note.linkedGoalIds.length === 0) {
      findings.push({
        ruleId: 'MISSING_GOAL_LINKAGE',
        category: 'GOAL_ALIGNMENT',
        severity: 'SUGGESTION',
        message: 'Note is not linked to any active NDIS Participant Goals. Link to ensure billable audit compliance.',
      });
      score -= 10;
    }

    const finalScore = Math.max(0, score);
    const isApprovedForBilling = finalScore >= 70 && !findings.some((f) => f.severity === 'CRITICAL');

    return {
      caseNoteId: note.id,
      complianceScore: finalScore,
      isApprovedForBilling,
      findings,
      recommendedGASScore: finalScore >= 85 ? 1 : 0,
      supervisedAt: new Date().toISOString(),
    };
  }
}
