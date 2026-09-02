import { Incident } from '../types';

export interface CrisisEscalationEvent {
  incidentId: string;
  severity: 'Critical / Reportable' | 'High' | 'Medium' | 'Low';
  escalationLevel: 'TIER_1_DIRECTOR_IMMEDIATE' | 'TIER_2_CLINICAL_LEAD' | 'TIER_3_STANDARD_REVIEW';
  channelsDispatched: ('SMS' | 'EMAIL' | 'PUSH' | 'COMMAND_CENTER_BANNER')[];
  statutoryNDISCommissionDeadline: string;
  notifiedStakeholders: string[];
  dispatchedAt: string;
}

export class CrisisEscalationEngine {
  /**
   * Evaluates an incident report and executes immediate multi-channel escalation.
   */
  public static dispatchEscalation(incident: Incident): CrisisEscalationEvent {
    const isReportable =
      incident.isNdisReportable ||
      incident.severity === 'Critical / Reportable' ||
      /unauthorized restrictive practice|assault|severe injury|hospital|self-harm/i.test(
        `${incident.description} ${incident.category}`
      );

    const now = new Date();
    // NDIS 24-hour statutory deadline for critical reportable incidents
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    if (isReportable) {
      return {
        incidentId: incident.id,
        severity: 'Critical / Reportable',
        escalationLevel: 'TIER_1_DIRECTOR_IMMEDIATE',
        channelsDispatched: ['SMS', 'EMAIL', 'PUSH', 'COMMAND_CENTER_BANNER'],
        statutoryNDISCommissionDeadline: deadline,
        notifiedStakeholders: [
          'clinical.director@breakthrough.org.au',
          'quality.safeguards@breakthrough.org.au',
          '+61400000101 (Director On-Call Phone)',
        ],
        dispatchedAt: now.toISOString(),
      };
    }

    return {
      incidentId: incident.id,
      severity: incident.severity as any,
      escalationLevel: 'TIER_3_STANDARD_REVIEW',
      channelsDispatched: ['EMAIL', 'COMMAND_CENTER_BANNER'],
      statutoryNDISCommissionDeadline: 'N/A - Non-Reportable',
      notifiedStakeholders: ['supervisor@breakthrough.org.au'],
      dispatchedAt: now.toISOString(),
    };
  }
}
