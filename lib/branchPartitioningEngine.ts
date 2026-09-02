import { Client, Practitioner } from '../types';

export interface RegionalBranch {
  branchId: string;
  branchName: string;
  state: 'VIC' | 'NSW' | 'QLD' | 'WA';
  headquartersAddress: string;
  assignedClientIds: string[];
  assignedPractitionerIds: string[];
}

export class BranchPartitioningEngine {
  public static getStandardBranches(): RegionalBranch[] {
    return [
      {
        branchId: 'BRANCH-VIC-MELB',
        branchName: 'Melbourne Metro Operations Hub',
        state: 'VIC',
        headquartersAddress: '120 Collins St, Melbourne VIC 3000',
        assignedClientIds: ['cli-1', 'cli-3', 'cli-101'],
        assignedPractitionerIds: ['prac-1', 'user-1'],
      },
      {
        branchId: 'BRANCH-NSW-SYD',
        branchName: 'Sydney Central Operations Hub',
        state: 'NSW',
        headquartersAddress: '200 George St, Sydney NSW 2000',
        assignedClientIds: ['cli-2'],
        assignedPractitionerIds: ['prac-2'],
      },
      {
        branchId: 'BRANCH-QLD-BRIS',
        branchName: 'Brisbane & Gold Coast Hub',
        state: 'QLD',
        headquartersAddress: '111 Eagle St, Brisbane QLD 4000',
        assignedClientIds: [],
        assignedPractitionerIds: [],
      },
    ];
  }

  /**
   * Filters clients by regional branch.
   */
  public static filterClientsByBranch(clients: Client[], branch: RegionalBranch): Client[] {
    if (!branch.assignedClientIds || branch.assignedClientIds.length === 0) return clients;
    return clients.filter((c) => branch.assignedClientIds.includes(c.id));
  }
}
