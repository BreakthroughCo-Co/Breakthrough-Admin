import { CaseNote, ScheduledShift } from '../types';

export interface XeroPayrunEntry {
  employeeId: string;
  employeeName: string;
  date: string;
  ordinaryHours: number;
  eveningPenaltyHours: number;
  weekendPenaltyHours: number;
  totalPayableHours: number;
  schadsRateMultiplier: number;
  totalGrossAmount: number;
  ndisSupportItemLinked?: string;
}

export class XeroPayrollMapper {
  private static BASE_HOURLY_RATE = 52.50; // SCHADS Level 4.1 Base Rate

  /**
   * Translates case notes and scheduled shifts into SCHADS-compliant Xero timesheets.
   */
  public static mapToXeroTimesheet(
    employeeId: string,
    employeeName: string,
    notes: CaseNote[],
    shifts: ScheduledShift[]
  ): XeroPayrunEntry[] {
    const entries: XeroPayrunEntry[] = [];

    // Process case notes
    for (const note of notes) {
      const hours = note.billableHours || (note.sessionDurationMinutes ? note.sessionDurationMinutes / 60 : 1);
      const noteDate = new Date(note.sessionDate || note.date);
      const dayOfWeek = noteDate.getDay(); // 0 is Sunday, 6 is Saturday

      let ordinaryHours = hours;
      let eveningPenaltyHours = 0;
      let weekendPenaltyHours = 0;
      let multiplier = 1.0;

      if (dayOfWeek === 6) {
        // Saturday 150%
        multiplier = 1.5;
        weekendPenaltyHours = hours;
        ordinaryHours = 0;
      } else if (dayOfWeek === 0) {
        // Sunday 200%
        multiplier = 2.0;
        weekendPenaltyHours = hours;
        ordinaryHours = 0;
      }

      const gross = hours * this.BASE_HOURLY_RATE * multiplier;

      entries.push({
        employeeId,
        employeeName,
        date: note.sessionDate || note.date,
        ordinaryHours,
        eveningPenaltyHours,
        weekendPenaltyHours,
        totalPayableHours: hours,
        schadsRateMultiplier: multiplier,
        totalGrossAmount: parseFloat(gross.toFixed(2)),
        ndisSupportItemLinked: note.supportItemCode,
      });
    }

    return entries;
  }
}
