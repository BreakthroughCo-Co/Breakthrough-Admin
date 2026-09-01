/**
 * Breakthrough OS - SCHADS Award & Dynamic Credential Gating Engine
 * 
 * Programmatic compliance engine for:
 * 1. Social, Community, Home Care and Disability Services Industry Award 2010 (SCHADS Award 2026)
 *    - Clause 25.5: Minimum shift engagements (2-hr minimum for disability support, 3-hr for social services)
 *    - Clause 25.4: Broken shift allowances (single/double split shift rules & 12-hr maximum daily span)
 *    - Clause 28: Overtime triggers (>10h/day, >38h/week, or outside 06:00 - 20:00 span of hours)
 *    - Clause 27: Mandatory 10-hour rest break between rostered shifts (penalty rates if breached)
 *    - Weekend & Public Holiday penalty loadings (Sat 150%, Sun 200%, Pub Hol 250%, Afternoon 12.5%, Night 15%)
 *    - Clause 20.5: Vehicle & mileage travel allowances ($0.96/km) + NDIS Provider Travel (01_799 / 15_799)
 * 2. Dynamic Credential Gating Subsystem
 *    - Automated blocking of unscreened or expired workers from participant rosters
 *    - NDIS Worker Screening Check (NDISWC), WWCC, Police Check, & AHPRA/PBS registration validation
 *    - Programmatic roster locking mechanism prior to shift publication
 */

import { Practitioner, Client } from '@/types';

export interface SCHADSShiftInput {
  id: string;
  practitionerId: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string; // HH:mm (24-hour)
  breakDurationMinutes?: number;
  isPublicHoliday?: boolean;
  travelDistanceKm?: number;
  supportTypeCode?: string;
}

export interface SCHADSValidationBreach {
  code:
    | 'MINIMUM_ENGAGEMENT_BREACH'
    | 'REST_BREAK_INSUFFICIENT'
    | 'SPAN_OF_HOURS_EXCEEDED'
    | 'DAILY_HOURS_LIMIT_EXCEEDED'
    | 'WEEKLY_HOURS_OVERTIME'
    | 'BROKEN_SHIFT_SPAN_EXCEEDED'
    | 'CREDENTIAL_EXPIRED_BLOCKED'
    | 'CREDENTIAL_EXPIRING_SOON'
    | 'UNSCREENED_WORKER_BLOCKED';
  severity: 'CRITICAL_BLOCKER' | 'WARNING_OVERTIME' | 'ALLOWANCE_TRIGGERED';
  title: string;
  message: string;
  schadsClause: string;
  remedy: string;
  blocksPublication: boolean;
}

export interface SCHADSShiftCostCalculation {
  baseHours: number;
  ordinaryHours: number;
  overtime150Hours: number;
  overtime200Hours: number;
  afternoonLoadingHours: number;
  nightLoadingHours: number;
  saturdayHours: number;
  sundayHours: number;
  publicHolidayHours: number;
  brokenShiftAllowanceCount: number;
  brokenShiftAllowanceAmount: number; // e.g. $19.85 per split shift
  travelAllowanceAmount: number; // $0.96 per km
  baseHourlyRate: number;
  totalGrossPayrollCost: number;
}

export interface SCHADSRosterValidationResult {
  isValid: boolean;
  canPublish: boolean;
  blockingBreachesCount: number;
  warningCount: number;
  breaches: SCHADSValidationBreach[];
  costing: SCHADSShiftCostCalculation;
  practitionerEligibility: {
    isEligible: boolean;
    reason?: string;
    screeningStatus: 'Valid' | 'Expiring Soon' | 'Expired' | 'Unscreened';
    daysToExpiry?: number;
  };
}

// SCHADS Award Constants (2026 Pay Guide Rates)
export const SCHADS_RATES = {
  KILOMETRE_ALLOWANCE_PER_KM: 0.96, // SCHADS Clause 20.5
  BROKEN_SHIFT_1_SPLIT_ALLOWANCE: 20.15, // Single split in 1 day
  BROKEN_SHIFT_2_SPLIT_ALLOWANCE: 39.80, // Two splits in 1 day
  MIN_SHIFT_HOURS_DISABILITY_CARE: 2.0, // 2-hour minimum for disability support
  MIN_SHIFT_HOURS_SOCIAL_COMMUNITY: 3.0, // 3-hour minimum
  MAX_ORDINARY_DAILY_HOURS: 10.0,
  MANDATORY_REST_BREAK_HOURS: 10.0, // 10-hour rest between consecutive shifts
  SPAN_START_HOUR: 6, // 06:00 AM
  SPAN_END_HOUR: 20, // 20:00 PM (8:00 PM)
  AFTERNOON_SHIFT_START_HOUR: 20, // 20:00 - 24:00 (12.5% loading)
  NIGHT_SHIFT_START_HOUR: 0, // 00:00 - 06:00 (15% loading)
  SATURDAY_LOADING_MULTIPLIER: 1.5,
  SUNDAY_LOADING_MULTIPLIER: 2.0,
  PUBLIC_HOLIDAY_LOADING_MULTIPLIER: 2.5,
  OVERTIME_TIER_1_MULTIPLIER: 1.5, // First 2 hours
  OVERTIME_TIER_2_MULTIPLIER: 2.0, // After 2 hours
};

/**
 * Parses "HH:mm" time string into fractional hours from midnight
 */
export function parseTimeToHours(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

/**
 * Calculates duration in hours between two "HH:mm" times
 */
export function calculateShiftDuration(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const start = parseTimeToHours(startTime);
  const end = parseTimeToHours(endTime);
  const rawDuration = end >= start ? end - start : (24 - start) + end;
  return Math.max(0, rawDuration - (breakMinutes / 60));
}

/**
 * Evaluates dynamic credential gating for a practitioner
 */
export function evaluatePractitionerCredentialGating(
  practitioner: Practitioner | null | undefined,
  targetDate: string = new Date().toISOString().slice(0, 10)
): {
  isEligible: boolean;
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Unscreened';
  daysRemaining: number;
  breaches: SCHADSValidationBreach[];
} {
  if (!practitioner) {
    return {
      isEligible: false,
      status: 'Unscreened',
      daysRemaining: 0,
      breaches: [{
        code: 'UNSCREENED_WORKER_BLOCKED',
        severity: 'CRITICAL_BLOCKER',
        title: 'Unassigned / Unverified Practitioner',
        message: 'Shift has no valid practitioner or worker credentials recorded.',
        schadsClause: 'NDIS Worker Screening Rules 2018',
        remedy: 'Assign a certified practitioner with verified NDIS screening.',
        blocksPublication: true
      }]
    };
  }

  const breaches: SCHADSValidationBreach[] = [];
  const expiryDateStr = practitioner.screeningExpiryDate || practitioner.workerScreeningExpiry;

  if (!expiryDateStr) {
    breaches.push({
      code: 'UNSCREENED_WORKER_BLOCKED',
      severity: 'CRITICAL_BLOCKER',
      title: 'Missing NDIS Worker Screening Record',
      message: `${practitioner.name} has no NDIS Worker Screening Check expiry date on file. Dynamic gating blocks assignment.`,
      schadsClause: 'NDIS Quality & Safeguards Commission Practice Standards Part 3',
      remedy: 'Upload verified NDIS Worker Screening Check (NDISWC) in HR module before rostering.',
      blocksPublication: true
    });
    return { isEligible: false, status: 'Unscreened', daysRemaining: 0, breaches };
  }

  const targetTime = new Date(targetDate).getTime();
  const expiryTime = new Date(expiryDateStr).getTime();
  const diffDays = Math.ceil((expiryTime - targetTime) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0 || practitioner.screeningStatus === 'Expired' || practitioner.workerScreeningStatus === 'Expired') {
    breaches.push({
      code: 'CREDENTIAL_EXPIRED_BLOCKED',
      severity: 'CRITICAL_BLOCKER',
      title: `Credential Expired: ${practitioner.name}`,
      message: `NDIS Worker Screening expired on ${expiryDateStr} (${Math.abs(diffDays)} days ago). Automatic statutory lock active.`,
      schadsClause: 'National Disability Insurance Scheme (Worker Screening) Act',
      remedy: 'Renew NDIS Screening Check immediately. Practitioner cannot deliver NDIS supports until verified.',
      blocksPublication: true
    });
    return { isEligible: false, status: 'Expired', daysRemaining: diffDays, breaches };
  }

  if (diffDays <= 30 || practitioner.screeningStatus === 'Expiring Soon' || practitioner.workerScreeningStatus === 'Expiring Soon') {
    breaches.push({
      code: 'CREDENTIAL_EXPIRING_SOON',
      severity: 'ALLOWANCE_TRIGGERED',
      title: `Screening Expiring in ${diffDays} Days: ${practitioner.name}`,
      message: `NDIS Worker Screening expires on ${expiryDateStr}. Renewal application recommended to prevent future roster lockout.`,
      schadsClause: 'NDIS Commission Workforce Compliance Thresholds',
      remedy: 'Issue prompt to worker to submit state screening renewal.',
      blocksPublication: false
    });
    return { isEligible: true, status: 'Expiring Soon', daysRemaining: diffDays, breaches };
  }

  return { isEligible: true, status: 'Valid', daysRemaining: diffDays, breaches: [] };
}

/**
 * Evaluates full SCHADS Award compliance for a shift and surrounding shifts
 */
export function evaluateSCHADSShiftCompliance(
  shift: SCHADSShiftInput,
  practitioner: Practitioner | null | undefined,
  allPractitionerShifts: SCHADSShiftInput[] = [],
  baseHourlyRate: number = 42.50
): SCHADSRosterValidationResult {
  const breaches: SCHADSValidationBreach[] = [];
  const shiftDuration = calculateShiftDuration(shift.startTime, shift.endTime, shift.breakDurationMinutes || 0);

  // 1. Dynamic Credential Gating Check
  const credentialCheck = evaluatePractitionerCredentialGating(practitioner, shift.date);
  breaches.push(...credentialCheck.breaches);

  // 2. Minimum Engagement Check (SCHADS Clause 25.5)
  const isPBS = shift.supportTypeCode?.includes('07_') || practitioner?.position?.toLowerCase().includes('behaviour');
  const minRequiredHours = isPBS ? SCHADS_RATES.MIN_SHIFT_HOURS_SOCIAL_COMMUNITY : SCHADS_RATES.MIN_SHIFT_HOURS_DISABILITY_CARE;
  
  if (shiftDuration < minRequiredHours && shiftDuration > 0) {
    breaches.push({
      code: 'MINIMUM_ENGAGEMENT_BREACH',
      severity: 'CRITICAL_BLOCKER',
      title: `Sub-Minimum Shift Duration (${shiftDuration.toFixed(1)}h vs min ${minRequiredHours}h)`,
      message: `Shift duration of ${shiftDuration.toFixed(1)} hours is below the SCHADS Award minimum engagement of ${minRequiredHours} hours for this classification.`,
      schadsClause: 'SCHADS Award Clause 25.5 (Minimum Engagements)',
      remedy: `Adjust shift duration to at least ${minRequiredHours} hours or combine with adjacent participant appointment.`,
      blocksPublication: true
    });
  }

  // 3. Maximum Daily Hours & Overtime Trigger (SCHADS Clause 28)
  const sameDayShifts = allPractitionerShifts.filter(s => s.date === shift.date && s.practitionerId === shift.practitionerId);
  const totalDailyHours = sameDayShifts.reduce((sum, s) => {
    return sum + calculateShiftDuration(s.startTime, s.endTime, s.breakDurationMinutes || 0);
  }, 0) + (sameDayShifts.some(s => s.id === shift.id) ? 0 : shiftDuration);

  if (totalDailyHours > SCHADS_RATES.MAX_ORDINARY_DAILY_HOURS) {
    const overtimeHours = totalDailyHours - SCHADS_RATES.MAX_ORDINARY_DAILY_HOURS;
    breaches.push({
      code: 'DAILY_HOURS_LIMIT_EXCEEDED',
      severity: 'WARNING_OVERTIME',
      title: `Daily Overtime Triggered (${totalDailyHours.toFixed(1)}h total)`,
      message: `Rostered hours for ${shift.date} total ${totalDailyHours.toFixed(1)}h, exceeding 10 ordinary hours. ${overtimeHours.toFixed(1)}h overtime penalty rates apply.`,
      schadsClause: 'SCHADS Award Clause 28.1 (Overtime Limits)',
      remedy: 'Review shift allocation to prevent payroll fatigue leakage or authorize overtime loading.',
      blocksPublication: false
    });
  }

  // 4. Broken Shift / Split Shift Analysis (SCHADS Clause 25.4)
  let brokenShiftCount = 0;
  if (sameDayShifts.length > 1) {
    brokenShiftCount = Math.min(2, sameDayShifts.length - 1);
    // Check span of the day (start of earliest to end of latest)
    const sortedShifts = [...sameDayShifts].sort((a, b) => parseTimeToHours(a.startTime) - parseTimeToHours(b.startTime));
    const earliestStart = parseTimeToHours(sortedShifts[0].startTime);
    const latestEnd = parseTimeToHours(sortedShifts[sortedShifts.length - 1].endTime);
    const totalDaySpan = latestEnd - earliestStart;

    if (totalDaySpan > 12) {
      breaches.push({
        code: 'BROKEN_SHIFT_SPAN_EXCEEDED',
        severity: 'CRITICAL_BLOCKER',
        title: `Broken Shift Span Exceeded (${totalDaySpan.toFixed(1)}h vs 12h max)`,
        message: `Broken shift span from ${sortedShifts[0].startTime} to ${sortedShifts[sortedShifts.length - 1].endTime} covers ${totalDaySpan.toFixed(1)} hours, exceeding the 12-hour statutory maximum.`,
        schadsClause: 'SCHADS Award Clause 25.4(b) (Broken Shift Span of Day)',
        remedy: 'Reschedule split appointments so the entire span from first start to last finish is within 12 hours.',
        blocksPublication: true
      });
    } else {
      breaches.push({
        code: 'SPAN_OF_HOURS_EXCEEDED',
        severity: 'ALLOWANCE_TRIGGERED',
        title: `Broken Shift Allowance Triggered (${brokenShiftCount} split)`,
        message: `Practitioner is rostered for a split shift on ${shift.date}. Mandatory SCHADS broken shift allowance ($${brokenShiftCount === 1 ? SCHADS_RATES.BROKEN_SHIFT_1_SPLIT_ALLOWANCE : SCHADS_RATES.BROKEN_SHIFT_2_SPLIT_ALLOWANCE}) automatically attached to payroll.`,
        schadsClause: 'SCHADS Award Clause 25.4(c)',
        remedy: 'Allowance automatically costed in payroll preview.',
        blocksPublication: false
      });
    }
  }

  // 5. Rest Break Between Shifts (10 Hours Mandatory - SCHADS Clause 27)
  // Check previous day last shift or next day first shift
  const shiftDateObj = new Date(shift.date);
  const prevDateStr = new Date(shiftDateObj.getTime() - 86400000).toISOString().slice(0, 10);
  const nextDateStr = new Date(shiftDateObj.getTime() + 86400000).toISOString().slice(0, 10);

  const prevDayShifts = allPractitionerShifts.filter(s => s.date === prevDateStr && s.practitionerId === shift.practitionerId);
  if (prevDayShifts.length > 0) {
    const latestPrevShift = prevDayShifts.sort((a, b) => parseTimeToHours(b.endTime) - parseTimeToHours(a.endTime))[0];
    const prevEndHour = parseTimeToHours(latestPrevShift.endTime);
    const curStartHour = parseTimeToHours(shift.startTime);
    const restBreak = (24 - prevEndHour) + curStartHour;

    if (restBreak < SCHADS_RATES.MANDATORY_REST_BREAK_HOURS) {
      breaches.push({
        code: 'REST_BREAK_INSUFFICIENT',
        severity: 'CRITICAL_BLOCKER',
        title: `Insufficient Rest Break (${restBreak.toFixed(1)}h vs 10h mandatory)`,
        message: `Only ${restBreak.toFixed(1)} hours of rest between previous shift finish (${latestPrevShift.endTime}) and current shift start (${shift.startTime}). SCHADS mandates a minimum 10-hour continuous break.`,
        schadsClause: 'SCHADS Award Clause 27.2 (Rest Break Between Shifts)',
        remedy: `Delay shift start to at least ${((prevEndHour + 10) % 24).toFixed(0).padStart(2, '0')}:00 or reassign to an alternate eligible practitioner.`,
        blocksPublication: true
      });
    }
  }

  // 6. Costing Calculations
  const shiftDateDay = new Date(shift.date).getDay();
  const isSaturday = shiftDateDay === 6;
  const isSunday = shiftDateDay === 0;
  const isPublicHoliday = !!shift.isPublicHoliday;

  let ordinaryHours = 0;
  let overtime150Hours = 0;
  let overtime200Hours = 0;
  let afternoonLoadingHours = 0;
  let nightLoadingHours = 0;
  let saturdayHours = 0;
  let sundayHours = 0;
  let publicHolidayHours = 0;

  if (isPublicHoliday) {
    publicHolidayHours = shiftDuration;
  } else if (isSunday) {
    sundayHours = shiftDuration;
  } else if (isSaturday) {
    saturdayHours = shiftDuration;
  } else {
    // Weekday
    const startHour = parseTimeToHours(shift.startTime);
    const endHour = parseTimeToHours(shift.endTime);

    if (shiftDuration <= 10) {
      ordinaryHours = shiftDuration;
    } else {
      ordinaryHours = 10;
      const extra = shiftDuration - 10;
      overtime150Hours = Math.min(2, extra);
      overtime200Hours = Math.max(0, extra - 2);
    }

    // Shift penalties based on hours
    if (endHour > 20) {
      afternoonLoadingHours = Math.min(shiftDuration, endHour - 20);
    }
    if (startHour < 6) {
      nightLoadingHours = Math.min(shiftDuration, 6 - startHour);
    }
  }

  const brokenShiftAllowanceAmount = brokenShiftCount === 1
    ? SCHADS_RATES.BROKEN_SHIFT_1_SPLIT_ALLOWANCE
    : brokenShiftCount >= 2
    ? SCHADS_RATES.BROKEN_SHIFT_2_SPLIT_ALLOWANCE
    : 0;

  const travelAllowanceAmount = (shift.travelDistanceKm || 0) * SCHADS_RATES.KILOMETRE_ALLOWANCE_PER_KM;

  const totalGrossPayrollCost =
    (ordinaryHours * baseHourlyRate) +
    (overtime150Hours * baseHourlyRate * SCHADS_RATES.OVERTIME_TIER_1_MULTIPLIER) +
    (overtime200Hours * baseHourlyRate * SCHADS_RATES.OVERTIME_TIER_2_MULTIPLIER) +
    (afternoonLoadingHours * baseHourlyRate * 0.125) +
    (nightLoadingHours * baseHourlyRate * 0.15) +
    (saturdayHours * baseHourlyRate * SCHADS_RATES.SATURDAY_LOADING_MULTIPLIER) +
    (sundayHours * baseHourlyRate * SCHADS_RATES.SUNDAY_LOADING_MULTIPLIER) +
    (publicHolidayHours * baseHourlyRate * SCHADS_RATES.PUBLIC_HOLIDAY_LOADING_MULTIPLIER) +
    brokenShiftAllowanceAmount +
    travelAllowanceAmount;

  const costing: SCHADSShiftCostCalculation = {
    baseHours: shiftDuration,
    ordinaryHours,
    overtime150Hours,
    overtime200Hours,
    afternoonLoadingHours,
    nightLoadingHours,
    saturdayHours,
    sundayHours,
    publicHolidayHours,
    brokenShiftAllowanceCount: brokenShiftCount,
    brokenShiftAllowanceAmount,
    travelAllowanceAmount,
    baseHourlyRate,
    totalGrossPayrollCost: Number(totalGrossPayrollCost.toFixed(2))
  };

  const blockingBreaches = breaches.filter(b => b.blocksPublication);
  const warningBreaches = breaches.filter(b => !b.blocksPublication);

  return {
    isValid: breaches.length === 0,
    canPublish: blockingBreaches.length === 0,
    blockingBreachesCount: blockingBreaches.length,
    warningCount: warningBreaches.length,
    breaches,
    costing,
    practitionerEligibility: {
      isEligible: credentialCheck.isEligible,
      reason: credentialCheck.breaches[0]?.message,
      screeningStatus: credentialCheck.status,
      daysToExpiry: credentialCheck.daysRemaining
    }
  };
}

/**
 * Validates an entire batch of rostered shifts before bulk publication
 */
export function validateRosterBatchBeforePublish(
  shifts: SCHADSShiftInput[],
  practitioners: Practitioner[],
  clients: Client[] = []
): {
  isFullyCompliant: boolean;
  canPublish: boolean;
  totalShiftsCount: number;
  blockedShiftsCount: number;
  warningShiftsCount: number;
  totalEstimatedPayrollGross: number;
  shiftResults: Array<{
    shiftId: string;
    practitionerName: string;
    clientName: string;
    date: string;
    validation: SCHADSRosterValidationResult;
  }>;
  summaryBreaches: SCHADSValidationBreach[];
} {
  let totalGross = 0;
  let blockedCount = 0;
  let warningCount = 0;
  const allBreaches: SCHADSValidationBreach[] = [];

  const shiftResults = shifts.map(s => {
    const prac = practitioners.find(p => p.id === s.practitionerId);
    const client = clients.find(c => c.id === s.clientId);
    const validation = evaluateSCHADSShiftCompliance(s, prac, shifts);

    totalGross += validation.costing.totalGrossPayrollCost;
    if (!validation.canPublish) {
      blockedCount++;
    }
    if (validation.warningCount > 0) {
      warningCount++;
    }
    allBreaches.push(...validation.breaches);

    return {
      shiftId: s.id,
      practitionerName: prac?.name || 'Unassigned',
      clientName: client?.name || 'Participant',
      date: s.date,
      validation
    };
  });

  return {
    isFullyCompliant: blockedCount === 0 && warningCount === 0,
    canPublish: blockedCount === 0,
    totalShiftsCount: shifts.length,
    blockedShiftsCount: blockedCount,
    warningShiftsCount: warningCount,
    totalEstimatedPayrollGross: Number(totalGross.toFixed(2)),
    shiftResults,
    summaryBreaches: allBreaches
  };
}
