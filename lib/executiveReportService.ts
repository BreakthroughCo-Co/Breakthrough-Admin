/**
 * Breakthrough OS — Monthly Executive Report Service (Phase 4.2)
 */

import type { Client, CaseNote, BillingClaim, Incident, Practitioner } from '@/types';

export interface ExecutiveReportData {
  month: string;
  generatedAt: string;
  totalRevenue: number;
  totalSessionsDelivered: number;
  avgBudgetUtilisation: number;
  newIntakes: number;
  planRenewalsDue60Days: number;
  goalAchievementRate: number;
  incidentRatePerClient: number;
  topPractitioners: { name: string; sessions: number; revenue: number }[];
  atRiskClients: { name: string; riskLevel: string }[];
}

export function generateExecutiveReport(
  clients: Client[],
  caseNotes: CaseNote[],
  billingClaims: BillingClaim[],
  incidents: Incident[],
  practitioners: Practitioner[],
): ExecutiveReportData {
  const now        = new Date();
  const monthStr   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const in60Days   = new Date(Date.now() + 60 * 86400000);

  const thisMonthNotes     = caseNotes.filter(n => new Date(n.date || (n as any).createdAt) >= monthStart);
  const thisMonthClaims    = billingClaims.filter((c: any) => new Date(c.serviceDate || c.createdAt || '') >= monthStart);
  const thisMonthIncidents = incidents.filter((i: any) => new Date(i.incidentDate || i.createdAt) >= monthStart);

  const totalRevenue          = thisMonthClaims.reduce((s: number, c: any) => s + (c.totalAmount || 0), 0);
  const totalSessionsDelivered = thisMonthNotes.filter(n => n.status === 'Approved').length;

  const activeClients = clients.filter(c => c.status === 'Active');
  const avgBudgetUtilisation = activeClients.length > 0
    ? Math.round(activeClients.reduce((s, c) => s + (c.totalBudget > 0 ? ((c.spentBudget || 0) / c.totalBudget) * 100 : 0), 0) / activeClients.length)
    : 0;

  const newIntakes             = clients.filter(c => new Date(c.createdAt) >= monthStart).length;
  const planRenewalsDue60Days  = clients.filter(c => c.status === 'Active' && c.planEndDate && new Date(c.planEndDate) <= in60Days && new Date(c.planEndDate) >= now).length;

  const allGoals = clients.flatMap(c => c.goals || []);
  const goalAchievementRate = allGoals.length > 0
    ? Math.round((allGoals.filter(g => g.status === 'Achieved').length / allGoals.length) * 100) : 0;

  const incidentRatePerClient = activeClients.length > 0
    ? Math.round((thisMonthIncidents.length / activeClients.length) * 100) / 100 : 0;

  const pracStats: Record<string, { name: string; sessions: number; revenue: number }> = {};
  thisMonthNotes.forEach(n => {
    if (!pracStats[n.practitionerId]) pracStats[n.practitionerId] = { name: n.practitionerName, sessions: 0, revenue: 0 };
    pracStats[n.practitionerId].sessions++;
  });
  thisMonthClaims.forEach((c: any) => {
    if (c.practitionerId && pracStats[c.practitionerId]) pracStats[c.practitionerId].revenue += c.totalAmount || 0;
  });

  return {
    month: monthStr,
    generatedAt: now.toISOString(),
    totalRevenue,
    totalSessionsDelivered,
    avgBudgetUtilisation,
    newIntakes,
    planRenewalsDue60Days,
    goalAchievementRate,
    incidentRatePerClient,
    topPractitioners: Object.values(pracStats).sort((a, b) => b.sessions - a.sessions).slice(0, 5),
    atRiskClients: clients
      .filter(c => c.status === 'Active' && (c.riskLevel === 'High' || c.riskLevel === 'Critical'))
      .map(c => ({ name: c.name, riskLevel: c.riskLevel }))
      .slice(0, 10),
  };
}
