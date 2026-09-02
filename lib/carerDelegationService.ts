export interface CarerParticipantLink {
  guardianUserId: string;
  guardianName: string;
  guardianEmail: string;
  relationship: 'Parent' | 'Legal Guardian' | 'Plan Nominee' | 'Support Coordinator';
  clientId: string;
  clientName: string;
  ndisNumber: string;
  permissions: {
    canViewCaseNotes: boolean;
    canViewBudgets: boolean;
    canSignServiceAgreements: boolean;
    canScheduleAppointments: boolean;
  };
  linkedSince: string;
  status: 'Active' | 'Pending Verification' | 'Revoked';
}

export class CarerDelegationService {
  /**
   * Returns active participant accounts delegated to a specific carer/guardian.
   */
  public static getDelegatedParticipants(
    guardianEmail: string,
    links: CarerParticipantLink[]
  ): CarerParticipantLink[] {
    return links.filter(
      (link) => link.guardianEmail.toLowerCase() === guardianEmail.toLowerCase() && link.status === 'Active'
    );
  }

  /**
   * Verifies if a carer has explicit permission to execute an action on behalf of a participant.
   */
  public static verifyCarerPermission(
    guardianEmail: string,
    clientId: string,
    action: keyof CarerParticipantLink['permissions'],
    links: CarerParticipantLink[]
  ): boolean {
    const link = links.find(
      (l) => l.guardianEmail.toLowerCase() === guardianEmail.toLowerCase() && l.clientId === clientId && l.status === 'Active'
    );
    return link ? Boolean(link.permissions[action]) : false;
  }
}
