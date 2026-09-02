import { Practitioner } from '../types';

export interface SupervisionLog {
  logId: string;
  superviseeId: string;
  superviseeName: string;
  supervisorId: string;
  supervisorName: string;
  sessionDate: string;
  durationHours: number;
  competencyDomain: 'FUNCTIONAL_BEHAVIOURAL_ASSESSMENT' | 'PBS_FORMULATION' | 'RESTRICTIVE_PRACTICE_ETHICS' | 'SCHADS_CASELOAD_MANAGEMENT';
  reflectiveNotes: string;
  actionItems: string[];
  isSupervisorSigned: boolean;
}

export class PeerSupervisionNetwork {
  /**
   * Records a structured peer supervision session with compliance tracking.
   */
  public static createSupervisionSession(
    supervisee: Practitioner,
    supervisor: Practitioner,
    domain: SupervisionLog['competencyDomain'],
    durationHours: number = 1.0,
    reflectiveNotes?: string
  ): SupervisionLog {
    return {
      logId: `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superviseeId: supervisee.id,
      superviseeName: supervisee.name,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      sessionDate: new Date().toISOString().slice(0, 10),
      durationHours,
      competencyDomain: domain,
      reflectiveNotes:
        reflectiveNotes ||
        'Reviewed complex participant case presentation. Analyzed functional hypothesis and finalized fading plan for restrictive practice reduction.',
      actionItems: [
        'Complete 14-day ABC frequency logging review',
        'Update Positive Behaviour Support Plan Section 4 (Reactive Strategies)',
        'Schedule next 1:1 clinical supervision in 14 days',
      ],
      isSupervisorSigned: true,
    };
  }
}
