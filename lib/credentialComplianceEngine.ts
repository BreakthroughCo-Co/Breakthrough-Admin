import { Practitioner } from '../types';

export interface CredentialAuditItem {
  practitionerId: string;
  practitionerName: string;
  screeningStatus: string;
  daysUntilScreeningExpiry: number;
  daysUntilPoliceExpiry: number;
  pbsLevel: string;
  isEligibleForShiftAssignment: boolean;
  warnings: string[];
}

export class CredentialComplianceEngine {
  /**
   * Audits a practitioner's credentials and determines shift assignment clearance.
   */
  public static auditPractitioner(practitioner: Practitioner): CredentialAuditItem {
    const now = new Date().getTime();
    const warnings: string[] = [];

    // NWSC Screening Expiry
    const screeningExpiry = new Date(practitioner.screeningExpiryDate || '2028-01-01').getTime();
    const daysUntilScreening = Math.floor((screeningExpiry - now) / (1000 * 60 * 60 * 24));

    // Police Check Expiry
    const policeExpiry = new Date(practitioner.policeCheckExpiryDate || '2027-01-01').getTime();
    const daysUntilPolice = Math.floor((policeExpiry - now) / (1000 * 60 * 60 * 24));

    let isEligible = true;

    if (daysUntilScreening <= 0) {
      warnings.push('CRITICAL: NDIS Worker Screening (NWSC) has EXPIRED. Shift assignment blocked.');
      isEligible = false;
    } else if (daysUntilScreening <= 30) {
      warnings.push(`WARNING: NDIS Worker Screening expires in ${daysUntilScreening} days. Renewal required.`);
    }

    if (daysUntilPolice <= 0) {
      warnings.push('CRITICAL: National Police Check has EXPIRED. Shift assignment blocked.');
      isEligible = false;
    }

    return {
      practitionerId: practitioner.id,
      practitionerName: practitioner.name,
      screeningStatus: practitioner.screeningStatus || 'CLEAR',
      daysUntilScreeningExpiry: daysUntilScreening,
      daysUntilPoliceExpiry: daysUntilPolice,
      pbsLevel: practitioner.pbsRegistrationLevel || 'Proficient Practitioner',
      isEligibleForShiftAssignment: isEligible,
      warnings,
    };
  }
}
