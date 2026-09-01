/**
 * Breakthrough OS - AI Billing Claim Pre-Submission Validator (R5)
 * 
 * Pre-submission validation layer analyzing every billing claim before NDIS PRODA / PACE submission:
 * 1. 2026 NDIS Price Caps enforcement ($214.41 for PBS/Psychology, $193.99 for Allied Health, plus MM1/MM6/MM7 regional modifiers)
 * 2. Mandatory fields validation (NDIS number format, service date, unit rate, hours, support item code)
 * 3. Duplicate claim detection across service dates and clients
 * 4. Clinical case note linkage and approval status verification
 * 5. Remaining participant plan budget depletion alerts
 * 6. Line item code and category validity in 2026 catalogue
 * 7. Plain-English clinical error explanations, suggested corrections, and green/amber/red validation badges
 */

import { BillingClaim, CaseNote, Client, NDISSupportItem, BillingValidationBadge, BillingValidationResult } from '@/types';
import { OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/lib/seedData';

export interface ClaimValidationIssue {
  type:
    | 'RATE_CAP_BREACH'
    | 'DUPLICATE_CLAIM'
    | 'MISSING_CASE_NOTE'
    | 'UNAPPROVED_CASE_NOTE'
    | 'INVALID_SUPPORT_CODE'
    | 'MISSING_MANDATORY_FIELD'
    | 'BUDGET_DEPLETION_RISK';
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  suggestedCorrection?: string;
  autoFix?: Partial<BillingClaim>;
}

export interface ClaimPreSubmissionValidationResult {
  claimId?: string;
  isClean: boolean;
  isValidForSubmission: boolean;
  status: 'CLEAN' | 'WARNING' | 'ERROR';
  badges: BillingValidationBadge[];
  issues: ClaimValidationIssue[];
  errors: string[];
  warnings: string[];
  maxAllowedRate?: number;
  matchingCaseNoteId?: string;
}

export interface ClaimValidationContext {
  allClaims?: BillingClaim[];
  existingClaims?: BillingClaim[];
  caseNotes?: CaseNote[];
  supportItems?: NDISSupportItem[];
  client?: Client | null;
  regionalModifier?: 'MM1' | 'MM2' | 'MM3' | 'MM4' | 'MM5' | 'MM6' | 'MM7';
}

/**
 * Validates a billing claim prior to PRODA PACE submission.
 */
export function validateClaimPreSubmission(
  claim: BillingClaim | Partial<BillingClaim>,
  context: ClaimValidationContext = {}
): ClaimPreSubmissionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const badges: BillingValidationBadge[] = [];
  const issues: ClaimValidationIssue[] = [];

  const catalogue = context.supportItems && context.supportItems.length > 0
    ? context.supportItems
    : OFFICIAL_2026_NDIS_PRICE_GUIDE;

  const existingClaims = context.allClaims || context.existingClaims || [];
  const caseNotes = context.caseNotes || [];
  const client = context.client || null;

  // -------------------------------------------------------------
  // 1. Mandatory Fields Validation
  // -------------------------------------------------------------
  const missingFields: string[] = [];
  if (!claim.ndisNumber || typeof claim.ndisNumber !== 'string' || !claim.ndisNumber.trim()) {
    missingFields.push('NDIS Number');
  } else if (claim.ndisNumber.replace(/\D/g, '').length < 8) {
    missingFields.push('Valid NDIS Number (must be at least 8-9 digits)');
  }

  if (!claim.serviceDate) {
    missingFields.push('Service Date');
  }

  if (!claim.supportItemCode) {
    missingFields.push('Support Item Code');
  }

  if (claim.hours == null || claim.hours <= 0) {
    missingFields.push('Billable Hours (> 0)');
  }

  if (claim.unitRate == null || claim.unitRate <= 0) {
    missingFields.push('Hourly Unit Rate (> $0)');
  }

  if (missingFields.length > 0) {
    const errorMsg = `Missing mandatory billing fields: ${missingFields.join(', ')}.`;
    errors.push(errorMsg);
    badges.push({
      type: 'red',
      code: 'MANDATORY_FIELDS_MISSING',
      message: `Missing required metadata: ${missingFields.slice(0, 2).join(', ')}`,
      suggestedFix: 'Complete all required NDIS billing fields before PACE dispatch.'
    });
    issues.push({
      type: 'MISSING_MANDATORY_FIELD',
      severity: 'ERROR',
      code: 'MANDATORY_FIELDS_MISSING',
      message: errorMsg,
      suggestedCorrection: 'Fill in participant NDIS number, valid service date, positive hours, and line item code.'
    });
  }

  // -------------------------------------------------------------
  // 2. 2026 NDIS Price Cap & Regional Loading Check
  // -------------------------------------------------------------
  let maxAllowedRate = 214.41;
  const matchedItem = catalogue.find((item) => item.code === claim.supportItemCode);

  if (claim.supportItemCode) {
    if (matchedItem) {
      let capRate = matchedItem.pricePerUnit;

      // Apply MMM Regional Loading if specified
      if (context.regionalModifier === 'MM6') {
        capRate = Math.round(capRate * 1.40 * 100) / 100; // +40% Remote
      } else if (context.regionalModifier === 'MM7') {
        capRate = Math.round(capRate * 1.50 * 100) / 100; // +50% Very Remote
      }

      maxAllowedRate = capRate;

      if (claim.unitRate != null && claim.unitRate > capRate + 0.001) {
        const errorMsg = `Claimed unit rate of $${claim.unitRate.toFixed(2)}/hr exceeds 2026 NDIS price cap of $${capRate.toFixed(2)}/hr for ${matchedItem.name} (${matchedItem.code}).`;
        errors.push(errorMsg);
        badges.push({
          type: 'red',
          code: 'RATE_EXCEEDS_2026_CAP',
          message: `Rate $${claim.unitRate.toFixed(2)} > Cap $${capRate.toFixed(2)}`,
          suggestedFix: `Adjust hourly unit rate to $${capRate.toFixed(2)}`
        });
        issues.push({
          type: 'RATE_CAP_BREACH',
          severity: 'ERROR',
          code: 'RATE_EXCEEDS_2026_CAP',
          message: errorMsg,
          suggestedCorrection: `Adjust rate to maximum official 2026 NDIS cap of $${capRate.toFixed(2)}/hr.`,
          autoFix: {
            unitRate: capRate,
            totalAmount: (claim.hours || 1) * capRate
          }
        });
      }
    } else {
      const errorMsg = `Support item code "${claim.supportItemCode}" was not found in the official 2026 NDIS Price Guide catalogue.`;
      errors.push(errorMsg);
      badges.push({
        type: 'red',
        code: 'INVALID_ITEM_CODE',
        message: 'Unknown NDIS item code.',
        suggestedFix: 'Select an active 2026 NDIS support item code.'
      });
      issues.push({
        type: 'INVALID_SUPPORT_CODE',
        severity: 'ERROR',
        code: 'INVALID_ITEM_CODE',
        message: errorMsg,
        suggestedCorrection: 'Use a recognized 2026 NDIS line item code (e.g. 07_002_0115_8_3 for Specialist PBS).'
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Duplicate Claim Detection
  // -------------------------------------------------------------
  if (claim.clientId && claim.serviceDate && claim.supportItemCode) {
    const duplicate = existingClaims.find(
      (c) =>
        c.id !== claim.id &&
        c.clientId === claim.clientId &&
        c.serviceDate === claim.serviceDate &&
        c.supportItemCode === claim.supportItemCode
    );

    if (duplicate) {
      const errorMsg = `Duplicate claim detected: Claim ${duplicate.invoiceNumber || duplicate.id} already exists for client on service date ${claim.serviceDate} with item code ${claim.supportItemCode}.`;
      errors.push(errorMsg);
      badges.push({
        type: 'red',
        code: 'DUPLICATE_CLAIM_DETECTED',
        message: `Duplicate of ${duplicate.invoiceNumber || duplicate.id}`,
        suggestedFix: 'Consolidate hours or delete redundant claim to avoid PACE rejection.'
      });
      issues.push({
        type: 'DUPLICATE_CLAIM',
        severity: 'ERROR',
        code: 'DUPLICATE_CLAIM_DETECTED',
        message: errorMsg,
        suggestedCorrection: `Verify if this claim duplicates ${duplicate.invoiceNumber || duplicate.id}. Cancel duplicate.`
      });
    }
  }

  // -------------------------------------------------------------
  // 4. Clinical Case Note Linkage & Approval
  // -------------------------------------------------------------
  let matchingCaseNoteId: string | undefined;
  if (claim.clientId && claim.serviceDate) {
    const matchingNote = caseNotes.find(
      (n) =>
        n.clientId === claim.clientId &&
        (n.date === claim.serviceDate || n.sessionDate === claim.serviceDate)
    );

    if (matchingNote) {
      matchingCaseNoteId = matchingNote.id;
      if (matchingNote.status !== 'Approved') {
        const warningMsg = `Linked case note (${matchingNote.id}) is currently in "${matchingNote.status}" status, not yet Approved.`;
        warnings.push(warningMsg);
        badges.push({
          type: 'amber',
          code: 'NOTE_PENDING_APPROVAL',
          message: 'Case note pending approval.',
          suggestedFix: 'Approve linked clinical note prior to final audit submission.'
        });
        issues.push({
          type: 'UNAPPROVED_CASE_NOTE',
          severity: 'WARNING',
          code: 'NOTE_PENDING_APPROVAL',
          message: warningMsg,
          suggestedCorrection: 'Request senior practitioner approval on linked case note.'
        });
      }
    } else {
      const errorMsg = `No approved clinical case note or session record found for service date ${claim.serviceDate}. NDIS PACE auditing requires substantiated case notes.`;
      errors.push(errorMsg);
      badges.push({
        type: 'red',
        code: 'ORPHAN_CLAIM_NO_NOTE',
        message: 'Missing linked case note.',
        suggestedFix: 'Create and approve a clinical case note for this service date.'
      });
      issues.push({
        type: 'MISSING_CASE_NOTE',
        severity: 'ERROR',
        code: 'ORPHAN_CLAIM_NO_NOTE',
        message: errorMsg,
        suggestedCorrection: 'Draft a SIMPL/BIRP case note corresponding to this session date.'
      });
    }
  }

  // -------------------------------------------------------------
  // 5. Participant Remaining Budget Overdraw Check
  // -------------------------------------------------------------
  if (client && client.totalBudget > 0) {
    const remaining = client.totalBudget - (client.spentBudget || 0);
    const claimAmount = claim.totalAmount || (claim.hours || 0) * (claim.unitRate || 0);
    if (claimAmount > remaining) {
      const warningMsg = `Claim total ($${claimAmount.toFixed(2)}) exceeds participant remaining plan budget ($${remaining.toFixed(2)}).`;
      warnings.push(warningMsg);
      badges.push({
        type: 'amber',
        code: 'BUDGET_OVERDRAW_RISK',
        message: 'Exceeds remaining plan funds.',
        suggestedFix: 'Request plan review or transfer allocation from other support categories.'
      });
      issues.push({
        type: 'BUDGET_DEPLETION_RISK',
        severity: 'WARNING',
        code: 'BUDGET_OVERDRAW_RISK',
        message: warningMsg,
        suggestedCorrection: `Notify Support Coordinator of budget overdraw risk ($${remaining.toFixed(2)} remaining).`
      });
    }
  }

  // -------------------------------------------------------------
  // 6. Overall Status & Clean Badge
  // -------------------------------------------------------------
  const isClean = errors.length === 0;
  const isValidForSubmission = errors.length === 0;

  if (isClean) {
    badges.push({
      type: 'green',
      code: 'VALIDATION_PASSED',
      message: 'Claim clean & PACE ready.',
      suggestedFix: 'Claim passed all pre-submission checks.'
    });
    badges.push({
      type: 'green',
      code: 'PACE_READY_CLEAN',
      message: 'Claim clean & PACE ready.'
    });
  }

  const status: 'CLEAN' | 'WARNING' | 'ERROR' = errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARNING' : 'CLEAN';

  return {
    claimId: claim.id,
    isClean,
    isValidForSubmission,
    status,
    badges,
    issues,
    errors,
    warnings,
    maxAllowedRate,
    matchingCaseNoteId
  };
}

/**
 * Backwards-compatible validator returning BillingValidationResult format.
 */
export function validateBillingClaim(
  claim: BillingClaim | Partial<BillingClaim>,
  client: Client | null = null,
  existingClaims: BillingClaim[] = [],
  caseNotes: CaseNote[] = [],
  priceGuide: NDISSupportItem[] = OFFICIAL_2026_NDIS_PRICE_GUIDE
): BillingValidationResult {
  const res = validateClaimPreSubmission(claim, {
    client,
    existingClaims,
    caseNotes,
    supportItems: priceGuide
  });

  return {
    isClean: res.isClean,
    badges: res.badges,
    errors: res.errors,
    warnings: res.warnings
  };
}
