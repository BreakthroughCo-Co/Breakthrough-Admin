/**
 * Breakthrough OS — Payroll Export Service (Phase 3.1)
 * SCHADS Award 2026 payroll period calculator + Xero-compatible CSV export.
 */

import type { Practitioner, ScheduledShift } from '@/types';

export interface PayrollPeriodSummary {
  practitionerId: string;
  practitionerName: string;
  periodStart: string;
  periodEnd: string;
  shiftCount: number;
  totalOrdinaryHours: number;
  totalOvertimeHours: number;
  travelAllowanceKm: number;
  travelAllowanceDollars: number;
  grossPay: number;
  breaches: { shiftId: string; breachTitle: string }[];
}

export interface PayrollRunResult {
  periodStart: string;
  periodEnd: string;
  summaries: PayrollPeriodSummary[];
  totalGrossPay: number;
  hasBreaches: boolean;
  csvContent: string;
}

function timeToDecimalHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + (m || 0) / 60;
}

function shiftHours(start: string, end: string): number {
  const s = timeToDecimalHours(start);
  let e   = timeToDecimalHours(end);
  if (e <= s) e += 24; // overnight
  return Math.max(0, e - s);
}

function isWeekend(dateStr: string): { isSat: boolean; isSun: boolean } {
  const d = new Date(dateStr);
  return { isSat: d.getDay() === 6, isSun: d.getDay() === 0 };
}

// SCHADS Award Level 3 base rate 2026 + ATO mileage rate
const BASE_RATE   = 35.50;
const TRAVEL_RATE = 0.96;

export function runPayrollPeriod(
  shifts: ScheduledShift[],
  practitioners: Practitioner[],
  periodStart: string,
  periodEnd: string,
): PayrollRunResult {
  const periodShifts = shifts.filter(s => s.date >= periodStart && s.date <= periodEnd);
  const summaries: PayrollPeriodSummary[] = [];

  for (const prac of practitioners) {
    const pracShifts = periodShifts.filter(s => s.practitionerId === prac.id);
    if (pracShifts.length === 0) continue;

    let totalOrdinaryHours = 0;
    let totalOvertimeHours = 0;
    let grossPay = 0;

    for (const shift of pracShifts) {
      const hours         = shiftHours(shift.startTime, shift.endTime);
      const { isSat, isSun } = isWeekend(shift.date);
      const ordinaryHours = Math.min(hours, 7.6);
      const overtimeHours = Math.max(0, hours - 7.6);

      let shiftPay: number;
      if (isSun)      shiftPay = hours * BASE_RATE * 2.0;
      else if (isSat) shiftPay = hours * BASE_RATE * 1.5;
      else            shiftPay = ordinaryHours * BASE_RATE + overtimeHours * BASE_RATE * 1.5;

      totalOrdinaryHours += ordinaryHours;
      totalOvertimeHours += overtimeHours;
      grossPay           += shiftPay;
    }

    const totalTravelKm    = 20 * pracShifts.length; // 20 km round-trip default
    const travelDollars    = Math.round(totalTravelKm * TRAVEL_RATE * 100) / 100;
    grossPay              += travelDollars;

    summaries.push({
      practitionerId: prac.id, practitionerName: prac.name,
      periodStart, periodEnd,
      shiftCount:           pracShifts.length,
      totalOrdinaryHours:   Math.round(totalOrdinaryHours * 100) / 100,
      totalOvertimeHours:   Math.round(totalOvertimeHours * 100) / 100,
      travelAllowanceKm:    totalTravelKm,
      travelAllowanceDollars: travelDollars,
      grossPay:             Math.round(grossPay * 100) / 100,
      breaches: [],
    });
  }

  const totalGrossPay = summaries.reduce((s, x) => s + x.grossPay, 0);

  const csvLines = [
    'Employee Name,Employee ID,Period Start,Period End,Shifts,Ordinary Hrs,Overtime Hrs,Travel (km),Travel ($),Gross Pay',
    ...summaries.map(s =>
      [`"${s.practitionerName}"`, s.practitionerId, s.periodStart, s.periodEnd,
       s.shiftCount, s.totalOrdinaryHours, s.totalOvertimeHours,
       s.travelAllowanceKm, s.travelAllowanceDollars, s.grossPay].join(',')
    ),
  ];

  return {
    periodStart, periodEnd, summaries,
    totalGrossPay: Math.round(totalGrossPay * 100) / 100,
    hasBreaches: false,
    csvContent: csvLines.join('\n'),
  };
}

export function downloadPayrollCSV(result: PayrollRunResult): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `payroll-${result.periodStart}-to-${result.periodEnd}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
