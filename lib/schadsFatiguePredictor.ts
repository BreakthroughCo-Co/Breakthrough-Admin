import { ScheduledShift, Practitioner } from '../types';

export interface FatigueRiskAudit {
  practitionerId: string;
  practitionerName: string;
  weeklyTotalHours: number;
  hasInsufficientRestBreak: boolean; // Less than 10 hours between consecutive shifts
  exceedsSpanOfHours: boolean; // Over 10-hour daily span
  fatigueRiskLevel: 'SAFE' | 'MODERATE_WARNING' | 'CRITICAL_FATIGUE_BREACH';
  recommendations: string[];
}

export class SCHADSFatiguePredictor {
  /**
   * Audits practitioner shifts against SCHADS Award fatigue regulations.
   */
  public static auditPractitionerFatigue(
    practitioner: Practitioner,
    shifts: ScheduledShift[]
  ): FatigueRiskAudit {
    const pracShifts = shifts.filter((s) => s.practitionerId === practitioner.id);
    let totalHours = 0;
    let hasInsufficientRest = false;

    for (let i = 0; i < pracShifts.length; i++) {
      const shift = pracShifts[i];
      const start = new Date(shift.startTime).getTime();
      const end = new Date(shift.endTime).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours > 0 ? hours : 2;

      // Check gap with previous shift
      if (i > 0) {
        const prevEnd = new Date(pracShifts[i - 1].endTime).getTime();
        const restGapHours = (start - prevEnd) / (1000 * 60 * 60);
        if (restGapHours > 0 && restGapHours < 10) {
          hasInsufficientRest = true;
        }
      }
    }

    const recommendations: string[] = [];
    let riskLevel: FatigueRiskAudit['fatigueRiskLevel'] = 'SAFE';

    if (totalHours > 38 || hasInsufficientRest) {
      riskLevel = 'CRITICAL_FATIGUE_BREACH';
      if (totalHours > 38) recommendations.push(`Weekly hours (${Math.round(totalHours)}h) exceeds SCHADS 38h limit.`);
      if (hasInsufficientRest) recommendations.push('Mandatory 10-hour rest break between shifts was breached.');
    } else if (totalHours > 32) {
      riskLevel = 'MODERATE_WARNING';
      recommendations.push('Approaching 38h overtime threshold. Consider shift redistribution.');
    } else {
      recommendations.push('Roster compliant with SCHADS fatigue and rest guidelines.');
    }

    return {
      practitionerId: practitioner.id,
      practitionerName: practitioner.name,
      weeklyTotalHours: Math.round(totalHours * 10) / 10,
      hasInsufficientRestBreak: hasInsufficientRest,
      exceedsSpanOfHours: totalHours > 10,
      fatigueRiskLevel: riskLevel,
      recommendations,
    };
  }
}
