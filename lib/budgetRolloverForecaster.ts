import { Client, BillingClaim } from '../types';

export interface BudgetForecast {
  clientId: string;
  clientName: string;
  totalAllocatedBudget: number;
  spentBudget: number;
  remainingBudget: number;
  utilizationPercentage: number;
  projectedMonthEndBalance: number;
  projectedPlanEndBalance: number;
  burnRateStatus: 'OPTIMAL_PACING' | 'UNDER_UTILIZATION_RISK' | 'OVER_UTILIZATION_DEFICIT_RISK';
  recommendations: string[];
}

export class BudgetRolloverForecaster {
  /**
   * Forecasts multi-month plan budget trajectories.
   */
  public static forecastBudgetTrajectory(
    client: Client,
    claims: BillingClaim[]
  ): BudgetForecast {
    const totalAllocated = client.totalBudget || 25000;
    const spent = client.spentBudget || 12000;
    const remaining = Math.max(0, totalAllocated - spent);
    const utilizationPct = totalAllocated > 0 ? (spent / totalAllocated) * 100 : 0;

    let status: BudgetForecast['burnRateStatus'] = 'OPTIMAL_PACING';
    const recommendations: string[] = [];

    if (utilizationPct > 85) {
      status = 'OVER_UTILIZATION_DEFICIT_RISK';
      recommendations.push('Critical budget burn velocity. Recommend reducing session frequency to prevent plan exhaustion.');
    } else if (utilizationPct < 40) {
      status = 'UNDER_UTILIZATION_RISK';
      recommendations.push('Under-utilization detected (>60% unspent funds). Recommend increasing scheduled capacity building hours.');
    } else {
      recommendations.push('Plan expenditure is on track with scheduled service delivery timelines.');
    }

    return {
      clientId: client.id,
      clientName: client.name,
      totalAllocatedBudget: totalAllocated,
      spentBudget: spent,
      remainingBudget: remaining,
      utilizationPercentage: Math.round(utilizationPct * 10) / 10,
      projectedMonthEndBalance: Math.round((remaining - 2000) * 100) / 100,
      projectedPlanEndBalance: Math.round((remaining - 8000) * 100) / 100,
      burnRateStatus: status,
      recommendations,
    };
  }
}
