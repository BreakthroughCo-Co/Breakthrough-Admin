import { Client, CaseNote } from '../types';

export interface ChurnRiskAnalysis {
  clientId: string;
  clientName: string;
  churnRiskScore: number; // 0 (low) to 100 (critical)
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: {
    cancellationRatePercent: number;
    daysSinceLastSession: number;
    goalStagnationScore: number;
    budgetBurnVariancePercent: number;
  };
  recommendations: string[];
}

export class ChurnPredictor {
  /**
   * Evaluates a participant's engagement metrics to predict disengagement/churn risk.
   */
  public static evaluateParticipant(
    client: Client,
    caseNotes: CaseNote[],
    daysThreshold: number = 30
  ): ChurnRiskAnalysis {
    const clientNotes = caseNotes.filter((n) => n.clientId === client.id);
    const now = new Date();

    // 1. Calculate days since last session
    let daysSinceLastSession = 90;
    if (clientNotes.length > 0) {
      const dates = clientNotes
        .map((n) => new Date(n.sessionDate || n.date).getTime())
        .filter((t) => !isNaN(t));
      if (dates.length > 0) {
        const latestTime = Math.max(...dates);
        daysSinceLastSession = Math.max(0, Math.floor((now.getTime() - latestTime) / (1000 * 60 * 60 * 24)));
      }
    }

    // 2. Cancellation and Session Velocity
    const totalSessions = clientNotes.length;
    const cancelledNotes = clientNotes.filter(
      (n) => n.status === 'Draft' && (n.subjective?.toLowerCase().includes('cancel') || n.plan?.toLowerCase().includes('dna'))
    ).length;
    const cancellationRatePercent = totalSessions > 0 ? (cancelledNotes / totalSessions) * 100 : 0;

    // 3. Goal Stagnation
    const goals = client.goals || [];
    const avgGoalProgress =
      goals.length > 0
        ? goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / goals.length
        : 50;
    const goalStagnationScore = Math.max(0, 100 - avgGoalProgress);

    // 4. Budget Burn Variance
    const allocated = client.allocatedBudget || 10000;
    const utilized = client.spentBudget || 0;
    const budgetBurnVariancePercent = Math.abs(((utilized / allocated) * 100) - 50);

    // Calculate composite risk score (0-100)
    let score = 0;
    if (daysSinceLastSession > 30) score += 35;
    else if (daysSinceLastSession > 14) score += 15;

    if (cancellationRatePercent > 25) score += 30;
    else if (cancellationRatePercent > 10) score += 15;

    if (goalStagnationScore > 70) score += 20;
    if (budgetBurnVariancePercent > 40) score += 15;

    const churnRiskScore = Math.min(100, Math.round(score));

    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (churnRiskScore >= 75) riskLevel = 'Critical';
    else if (churnRiskScore >= 50) riskLevel = 'High';
    else if (churnRiskScore >= 25) riskLevel = 'Medium';

    const recommendations: string[] = [];
    if (daysSinceLastSession > 21) {
      recommendations.push('Schedule proactive care coordination check-in call.');
    }
    if (cancellationRatePercent > 20) {
      recommendations.push('Review appointment schedule suitability with participant/carer.');
    }
    if (goalStagnationScore > 60) {
      recommendations.push('Perform mid-term NDIS goal review and therapy recalibration.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Engagement levels healthy. Maintain regular bi-weekly therapy.');
    }

    return {
      clientId: client.id,
      clientName: client.name,
      churnRiskScore,
      riskLevel,
      factors: {
        cancellationRatePercent: Math.round(cancellationRatePercent),
        daysSinceLastSession,
        goalStagnationScore: Math.round(goalStagnationScore),
        budgetBurnVariancePercent: Math.round(budgetBurnVariancePercent),
      },
      recommendations,
    };
  }
}
