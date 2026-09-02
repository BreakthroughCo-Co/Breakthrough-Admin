import { Client, CaseNote, ClientGoal } from '../types';

export interface FHIRResourceBundle {
  resourceType: 'Bundle';
  type: 'collection';
  timestamp: string;
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: {
      resourceType: string;
      id: string;
      [key: string]: any;
    };
  }>;
}

export class FHIRInteroperabilityGateway {
  /**
   * Transforms internal NDIS participant records into HL7 FHIR R4 Bundle.
   */
  public static exportToFHIRBundle(
    client: Client,
    goals: ClientGoal[],
    notes: CaseNote[]
  ): FHIRResourceBundle {
    const patientResource = {
      resourceType: 'Patient',
      id: `patient-${client.id}`,
      identifier: [
        {
          system: 'http://ns.electronichealth.net.au/id/ndis',
          value: client.ndisNumber || '430000000',
        },
      ],
      name: [
        {
          use: 'official',
          text: client.name,
        },
      ],
      gender: 'unknown',
      birthDate: '1995-05-12',
    };

    const carePlanResource = {
      resourceType: 'CarePlan',
      id: `careplan-${client.id}`,
      status: 'active',
      intent: 'plan',
      subject: {
        reference: `Patient/patient-${client.id}`,
        display: client.name,
      },
      category: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '386053000',
              display: 'Positive Behaviour Support Plan',
            },
          ],
        },
      ],
      goal: goals.map((g) => ({
        display: g.title,
      })),
    };

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: 2,
      entry: [
        {
          fullUrl: `urn:uuid:patient-${client.id}`,
          resource: patientResource,
        },
        {
          fullUrl: `urn:uuid:careplan-${client.id}`,
          resource: carePlanResource,
        },
      ],
    };
  }
}
