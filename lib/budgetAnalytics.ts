/**
 * Breakthrough OS — NDIS Plan Budget Burn Rate Analytics (Phase 2.3)
 */

import type { Client } from '@/types';

export type BurnRateStatus = 'on-track' | 'at-risk-overspend' | 'at-risk-underspend' | 'critical';

export interface BudgetBurnAnalysis {
  clientId: string;
  clientName: string;
  dailyBurnRate: number;
  projectedEndSpend: number;
  totalPlanDays: number;
  daysElapsed: number;
  daysRemaining: number;
  burnRateStatus: BurnRateStatus;
  percentSpent: number;
  planExpiresInDays: number;
}

export function analyzeBudgetBurn(client: Client): BudgetBurnAnalysis {
  const now   = new Date();
  const start = new Date(client.planStartDate || now.toISOString());
  const end   = new Date(client.planEndDate   || now.toISOString());

  const totalPlanDays  = Math.max(1, Math.round((end.getTime()   - start.getTime()) / 86400000));
  const daysElapsed    = Math.max(1, Math.round((now.getTime()   - start.getTime()) / 86400000));
  const daysRemaining  = Math.max(0, Math.round((end.getTime()   - now.getTime())   / 86400000));

  const spent              = client.spentBudget || 0;
  const total              = client.totalBudget || 0;
  const dailyBurnRate      = spent / daysElapsed;
  const projectedEndSpend  = dailyBurnRate * totalPlanDays;
  const percentSpent       = total > 0 ? Math.round((spent / total) * 100) : 0;
  const expectedPercent    = Math.round((daysElapsed / totalPlanDays) * 100);

  let burnRateStatus: BurnRateStatus = 'on-track';
  if (total > 0 && projectedEndSpend > total * 1.15) burnRateStatus = 'critical';
  else if (percentSpent > expectedPercent + 15)       burnRateStatus = 'at-risk-overspend';
  else if (percentSpent < expectedPercent - 15 && daysRemaining < 60) burnRateStatus = 'at-risk-underspend';

  return {
    clientId: client.id, clientName: client.name,
    dailyBurnRate:     Math.round(dailyBurnRate    * 100) / 100,
    projectedEndSpend: Math.round(projectedEndSpend * 100) / 100,
    totalPlanDays, daysElapsed, daysRemaining, burnRateStatus, percentSpent,
    planExpiresInDays: daysRemaining,
  };
}

export function getClientsAtBudgetRisk(clients: Client[]): BudgetBurnAnalysis[] {
  return clients
    .filter(c => c.status === 'Active' && c.planStartDate && c.planEndDate)
    .map(analyzeBudgetBurn)
    .filter(a => a.burnRateStatus !== 'on-track')
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
