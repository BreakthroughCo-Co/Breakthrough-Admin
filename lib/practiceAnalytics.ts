/**
 * Breakthrough OS — Practice Analytics Engine (Phase 4.1)
 */

import type { Client, CaseNote, BillingClaim, Incident, Practitioner } from '@/types';

export interface WeeklyTrend {
  week: string;
  sessionCount: number;
  billingTotal: number;
  incidentCount: number;
}

export interface RevenueForecast {
  next4WeeksProjected: number;
  currentMonthActual: number;
  averageWeeklyRevenue: number;
  highValueClients: { clientId: string; clientName: string; weeklyValue: number }[];
}

export interface CaseloadCapacityMetric {
  practitionerId: string;
  practitionerName: string;
  activeCaseload: number;
  caseloadLimit: number;
  capacityPercent: number;
  status: 'ok' | 'warning' | 'critical';
}

function isoWeekLabel(dateStr: string): string {
  const d    = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function computeWeeklyTrends(
  caseNotes: CaseNote[],
  billingClaims: BillingClaim[],
  incidents: Incident[],
  weeksBack = 8,
): WeeklyTrend[] {
  const cutoff = new Date(Date.now() - weeksBack * 7 * 86400000);
  const weeks: Record<string, WeeklyTrend> = {};
  const ensure = (w: string) => { if (!weeks[w]) weeks[w] = { week: w, sessionCount: 0, billingTotal: 0, incidentCount: 0 }; };

  caseNotes
    .filter(n => new Date(n.date || (n as any).createdAt) >= cutoff)
    .forEach(n => { const w = isoWeekLabel(n.date || (n as any).createdAt); ensure(w); weeks[w].sessionCount++; });

  billingClaims
    .filter(c => new Date((c as any).serviceDate || (c as any).createdAt || '') >= cutoff)
    .forEach(c => {
      const w = isoWeekLabel((c as any).serviceDate || (c as any).createdAt || new Date().toISOString());
      ensure(w); weeks[w].billingTotal += (c as any).totalAmount || 0;
    });

  incidents
    .filter(i => new Date((i as any).incidentDate || (i as any).createdAt) >= cutoff)
    .forEach(i => { const w = isoWeekLabel((i as any).incidentDate || (i as any).createdAt); ensure(w); weeks[w].incidentCount++; });

  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
}

export function forecastRevenue(billingClaims: BillingClaim[]): RevenueForecast {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const window28   = new Date(Date.now() - 28 * 86400000);

  const currentMonthActual = billingClaims
    .filter(c => new Date((c as any).serviceDate || '') >= monthStart)
    .reduce((s, c) => s + ((c as any).totalAmount || 0), 0);

  const last4WeeksTotal = billingClaims
    .filter(c => new Date((c as any).serviceDate || '') >= window28)
    .reduce((s, c) => s + ((c as any).totalAmount || 0), 0);

  const averageWeeklyRevenue = last4WeeksTotal / 4;
  const next4WeeksProjected  = averageWeeklyRevenue * 4;

  const clientRevMap: Record<string, { clientId: string; clientName: string; weeklyValue: number }> = {};
  billingClaims
    .filter(c => new Date((c as any).serviceDate || '') >= window28)
    .forEach((c: any) => {
      if (!clientRevMap[c.clientId]) clientRevMap[c.clientId] = { clientId: c.clientId, clientName: c.clientName, weeklyValue: 0 };
      clientRevMap[c.clientId].weeklyValue += (c.totalAmount || 0) / 4;
    });

  return {
    next4WeeksProjected,
    currentMonthActual,
    averageWeeklyRevenue,
    highValueClients: Object.values(clientRevMap).sort((a, b) => b.weeklyValue - a.weeklyValue).slice(0, 5),
  };
}

export function computeCaseloadCapacity(practitioners: Practitioner[], clients: Client[]): CaseloadCapacityMetric[] {
  return practitioners.map(p => {
    const activeCaseload   = clients.filter(c => c.primaryPractitionerId === p.id && c.status === 'Active').length;
    const caseloadLimit    = (p as any).caseloadLimit || 20;
    const capacityPercent  = Math.round((activeCaseload / caseloadLimit) * 100);
    return {
      practitionerId: p.id, practitionerName: p.name,
      activeCaseload, caseloadLimit, capacityPercent,
      status: capacityPercent >= 95 ? 'critical' : capacityPercent >= 80 ? 'warning' : 'ok',
    };
  });
}
