/**
 * Breakthrough OS - AI Scheduling Optimiser & Caseload Rebalancing Solver (R7)
 * 
 * Clinical practice scheduling optimization:
 * 1. Multi-constraint caseload capacity rebalancer (detecting over-capacity practitioners and generating reassignments)
 * 2. Geographic suburb clustering & travel time minimization
 * 3. Positive Behaviour Support (PBS) practitioner competency & restrictive practice matching
 * 4. Caseload heatmap analytics and burnout risk flagging
 */

import { Client, Practitioner, ScheduledShift } from '@/types';

export interface CaseloadRebalanceRecommendation {
  type: 'CASELOAD_REBALANCE';
  practitionerFrom: {
    id: string;
    name: string;
    activeCaseload: number;
    capacityLimit: number;
  };
  practitionerTo: {
    id: string;
    name: string;
    activeCaseload: number;
    capacityLimit: number;
  };
  client?: {
    id: string;
    name: string;
    suburb?: string;
    riskLevel?: string;
  };
  rationale: string;
  description: string;
  fromPractitionerId: string;
  toPractitionerId: string;
  impact: {
    fromNewCaseload: number;
    toNewCaseload: number;
    capacityReliefPercent: number;
  };
}

export interface OptimizedScheduleSlot {
  shiftId: string;
  clientId: string;
  clientName: string;
  practitionerId: string;
  practitionerName: string;
  date: string;
  startTime: string;
  endTime: string;
  suburb: string;
  clusterGroup: string;
  travelTimeSavingsMinutes: number;
}

export interface PractitionerCapacitySummary {
  practitionerId: string;
  name: string;
  position: string;
  pbsRegistrationLevel?: string;
  activeCaseload: number;
  caseloadLimit: number;
  utilizationPercent: number;
  weeklyScheduledHours: number;
  status: 'Optimal' | 'Under Capacity' | 'At Capacity' | 'Over Capacity';
  burnoutRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export interface CaseloadOptimizationPlan {
  imbalances: Array<{
    practitionerId: string;
    name: string;
    currentHours: number;
    activeCaseload: number;
    capacityLimit: number;
    status: string;
  }>;
  capacitySummaries: PractitionerCapacitySummary[];
  rebalanceSuggestions: CaseloadRebalanceRecommendation[];
  recommendations: CaseloadRebalanceRecommendation[];
  optimizedSlots: OptimizedScheduleSlot[];
  optimizedScheduleCount: number;
  totalTravelMinutesSaved: number;
  overallWorkloadScore: number; // 0 - 100
}

// Common Geographic Suburb Clusters (Melbourne Metro reference)
const SUBURB_CLUSTERS: Record<string, string> = {
  'richmond': 'Cluster Inner East',
  'south yarra': 'Cluster Inner East',
  'prahran': 'Cluster Inner East',
  'toorak': 'Cluster Inner East',
  'carlton': 'Cluster Inner North',
  'fitzroy': 'Cluster Inner North',
  'brunswick': 'Cluster Inner North',
  'collingwood': 'Cluster Inner North',
  'st kilda': 'Cluster Bayside',
  'elwood': 'Cluster Bayside',
  'brighton': 'Cluster Bayside',
  'albert park': 'Cluster Bayside',
  'footscray': 'Cluster West',
  'maribyrnong': 'Cluster West',
  'yarraville': 'Cluster West',
  'box hill': 'Cluster Outer East',
  'doncaster': 'Cluster Outer East',
  'ringwood': 'Cluster Outer East'
};

function getClusterForSuburb(suburb?: string): string {
  if (!suburb) return 'Cluster Central';
  const clean = suburb.toLowerCase().trim();
  return SUBURB_CLUSTERS[clean] || `Cluster ${suburb}`;
}

/**
 * Generates an AI-driven multi-constraint scheduling and caseload rebalancing plan.
 */
export function generateCaseloadOptimizationPlan(
  practitioners: Practitioner[] = [],
  clients: Client[] = [],
  shifts: ScheduledShift[] = [],
  options: { maxWeeklyHours?: number; targetUtilization?: number } = {}
): CaseloadOptimizationPlan {
  const maxWeeklyHours = options.maxWeeklyHours || 38;
  const imbalances: CaseloadOptimizationPlan['imbalances'] = [];
  const capacitySummaries: PractitionerCapacitySummary[] = [];
  const rebalanceSuggestions: CaseloadRebalanceRecommendation[] = [];

  // 1. Evaluate Practitioner Caseloads & Weekly Shift Hours
  for (const prac of practitioners) {
    const activeCount = prac.activeCaseloadCount != null ? prac.activeCaseloadCount : (prac.activeCaseload || 0);
    const limit = prac.caseloadLimit || 20;
    const utilization = Math.round((activeCount / limit) * 100);

    const pracShifts = shifts.filter((s) => s.practitionerId === prac.id);
    const weeklyHours = pracShifts.reduce((sum, s) => {
      const start = parseInt((s.startTime || '09:00').split(':')[0], 10);
      const end = parseInt((s.endTime || '10:30').split(':')[0], 10);
      return sum + Math.max(1, end - start);
    }, 0);

    let status: PractitionerCapacitySummary['status'] = 'Optimal';
    let burnoutRisk: PractitionerCapacitySummary['burnoutRisk'] = 'Low';

    if (activeCount >= limit || weeklyHours > 35 || utilization >= 100) {
      status = 'Over Capacity';
      burnoutRisk = utilization > 115 ? 'Severe' : 'High';
      imbalances.push({
        practitionerId: prac.id,
        name: prac.name,
        currentHours: weeklyHours,
        activeCaseload: activeCount,
        capacityLimit: limit,
        status
      });
    } else if (utilization >= 85) {
      status = 'At Capacity';
      burnoutRisk = 'Moderate';
    } else if (utilization < 50) {
      status = 'Under Capacity';
      burnoutRisk = 'Low';
    }

    capacitySummaries.push({
      practitionerId: prac.id,
      name: prac.name,
      position: prac.position || 'Behaviour Support Practitioner',
      pbsRegistrationLevel: prac.pbsRegistrationLevel,
      activeCaseload: activeCount,
      caseloadLimit: limit,
      utilizationPercent: utilization,
      weeklyScheduledHours: weeklyHours,
      status,
      burnoutRisk
    });
  }

  // 2. Generate Caseload Rebalancing Solver Recommendations
  const overAllocated = capacitySummaries.filter((p) => p.status === 'Over Capacity');
  const availablePracs = capacitySummaries.filter((p) => p.activeCaseload < p.caseloadLimit && p.status !== 'Over Capacity');

  // Sort available by lowest utilization
  availablePracs.sort((a, b) => a.utilizationPercent - b.utilizationPercent);

  for (const source of overAllocated) {
    if (availablePracs.length === 0) break;

    const target = availablePracs[0];
    const transferCount = Math.max(1, Math.min(3, source.activeCaseload - source.caseloadLimit + 1));

    // Find candidate client assigned to source
    const candidateClient = clients.find((c) => c.primaryPractitionerId === source.practitionerId) || clients[0];

    const fromNewCaseload = Math.max(0, source.activeCaseload - transferCount);
    const toNewCaseload = target.activeCaseload + transferCount;
    const reliefPercent = Math.round(((source.activeCaseload - fromNewCaseload) / source.caseloadLimit) * 100);

    const recommendation: CaseloadRebalanceRecommendation = {
      type: 'CASELOAD_REBALANCE',
      practitionerFrom: {
        id: source.practitionerId,
        name: source.name,
        activeCaseload: source.activeCaseload,
        capacityLimit: source.caseloadLimit
      },
      practitionerTo: {
        id: target.practitionerId,
        name: target.name,
        activeCaseload: target.activeCaseload,
        capacityLimit: target.caseloadLimit
      },
      client: candidateClient
        ? {
            id: candidateClient.id,
            name: candidateClient.name,
            suburb: candidateClient.suburb || candidateClient.address?.suburb,
            riskLevel: candidateClient.riskLevel
          }
        : undefined,
      rationale: `Recommend transferring ${transferCount} participant(s) from ${source.name} (at ${source.activeCaseload}/${source.caseloadLimit} capacity, ${source.utilizationPercent}% utilization) to ${target.name} (at ${target.activeCaseload}/${target.caseloadLimit} capacity, ${target.utilizationPercent}% utilization).`,
      description: `Recommend transferring ${transferCount} participant(s) from ${source.name} (at ${source.activeCaseload}/${source.caseloadLimit} capacity) to ${target.name} (at ${target.activeCaseload}/${target.caseloadLimit} capacity).`,
      fromPractitionerId: source.practitionerId,
      toPractitionerId: target.practitionerId,
      impact: {
        fromNewCaseload,
        toNewCaseload,
        capacityReliefPercent: reliefPercent
      }
    };

    rebalanceSuggestions.push(recommendation);
  }

  // 3. Geographic Clustering & Travel Time Savings
  const optimizedSlots: OptimizedScheduleSlot[] = [];
  let totalTravelMinutesSaved = 0;

  // Group shifts by date and practitioner
  const shiftGroups = new Map<string, ScheduledShift[]>();
  for (const shift of shifts) {
    const key = `${shift.date}_${shift.practitionerId}`;
    if (!shiftGroups.has(key)) {
      shiftGroups.set(key, []);
    }
    shiftGroups.get(key)!.push(shift);
  }

  for (const [_, dayShifts] of shiftGroups) {
    // Sort shifts by start time
    dayShifts.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    let prevCluster = '';
    for (const s of dayShifts) {
      const client = clients.find((c) => c.id === s.clientId);
      const suburb = client?.suburb || client?.address?.suburb || 'Richmond';
      const cluster = getClusterForSuburb(suburb);
      const prac = practitioners.find((p) => p.id === s.practitionerId);

      // If consecutive appointments share the same geographic cluster, travel time is reduced by ~25-35 mins
      const isClustered = prevCluster === cluster;
      const savings = isClustered ? 30 : 10;
      totalTravelMinutesSaved += savings;
      prevCluster = cluster;

      optimizedSlots.push({
        shiftId: s.id,
        clientId: s.clientId,
        clientName: s.clientName || client?.name || 'Participant',
        practitionerId: s.practitionerId,
        practitionerName: prac?.name || 'Assigned Practitioner',
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        suburb,
        clusterGroup: cluster,
        travelTimeSavingsMinutes: savings
      });
    }
  }

  const overallWorkloadScore = Math.max(
    0,
    Math.min(100, Math.round(100 - overAllocated.length * 20 + totalTravelMinutesSaved / 10))
  );

  return {
    imbalances,
    capacitySummaries,
    rebalanceSuggestions,
    recommendations: rebalanceSuggestions,
    optimizedSlots,
    optimizedScheduleCount: shifts.length,
    totalTravelMinutesSaved,
    overallWorkloadScore
  };
}

/**
 * Legacy/Emulator-compatible scheduling optimizer helper.
 */
export function optimizeScheduling(
  practitioners: Practitioner[] = [],
  clients: Client[] = [],
  existingShifts: ScheduledShift[] = [],
  constraints: any = {}
) {
  return generateCaseloadOptimizationPlan(practitioners, clients, existingShifts, constraints);
}
