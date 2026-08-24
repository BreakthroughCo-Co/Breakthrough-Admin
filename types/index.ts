export type UserRole = 'ADMIN' | 'PRACTITIONER' | 'VIEWER' | 'SUPPORT_COORDINATOR';

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  photoURL?: string;
  position?: string;
  practitionerId?: string;
  workerScreeningStatus?: 'Active' | 'Pending' | 'Expiring Soon' | 'Expired';
  workerScreeningExpiry?: string;
  policeCheckExpiry?: string;
  ndisOrientationDone?: boolean;
  activeCaseload?: number;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientGoal {
  id: string;
  title: string;
  category: 'Core' | 'Capacity Building' | 'Capital' | 'Social & Community' | string;
  targetDate: string;
  progressPercent: number;
  progress?: number;
  status: 'In Progress' | 'Achieved' | 'Deferred';
  gasScore?: -2 | -1 | 0 | 1 | 2;
  gasHistory?: { date: string; score: -2 | -1 | 0 | 1 | 2; note: string }[];
  linkedNoteIds?: string[];
}

export interface Client {
  id: string;
  ndisNumber: string;
  name: string;
  preferredName?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    mmmZone?: string;
  };
  suburb?: string;
  dateOfBirth: string;
  status: 'Active' | 'Onboarding' | 'Archived' | 'Pending Plan';
  primaryDisability: string;
  secondaryDisabilities?: string[];
  goals: ClientGoal[];
  planStartDate: string;
  planEndDate: string;
  planManagementType?: 'Agency-Managed (NDIA)' | 'Plan-Managed' | 'Self-Managed' | 'NDIA-Managed';
  planType?: string;
  planManager?: {
    agency?: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  supportCoordinator?: {
    name?: string;
    agency?: string;
    email?: string;
    phone?: string;
  };
  budgetBreakdown?: {
    core?: number;
    capacityBuildingTherapy?: number;
    capacityBuildingPBS?: number;
    supportCoordination?: number;
    capital?: number;
  };
  totalBudget: number;
  allocatedBudget: number;
  spentBudget: number;
  primaryPractitionerId: string;
  primaryPractitionerName: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  gpContact?: {
    doctorName?: string;
    clinicName?: string;
    phone?: string;
  };
  highIntensityNeeds?: string[];
  communicationMethod?: string;
  mobilityNeeds?: string;
  triggers?: string[];
  deescalationStrategies?: string;
  primarySupportItemCode?: string;
  agreedHourlyRate?: number;
  weeklyAllocatedHours?: number;
  restrictivePracticesActive: boolean;
  isCustomUserParticipant?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  clientId: string;
  clientName: string;
  practitionerId: string;
  practitionerName: string;
  date: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  sessionDurationMinutes: number;
  durationMinutes?: number;
  billableHours?: number;
  format: 'SIMPL' | 'BIRP' | 'Standard' | 'SOAP';
  category?: string;
  serviceType?: string;
  supportItemCode?: string;
  linkedSupportItemCode?: string;
  invoiceNumber?: string;
  billedAmount?: number;
  text?: string;
  situation?: string;
  intervention?: string;
  progress?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  ndisClaimGenerated?: boolean;
  subjective: string; // Situation / Subjective
  objective: string;  // Intervention / Objective
  assessment: string; // Measurement / Assessment
  plan: string;       // Next steps / Plan
  linkedGoalIds: string[];
  status: 'Draft' | 'Submitted' | 'Approved' | 'Archived';
  flaggedForReview: boolean;
  reviewNotes?: string;
  billable?: boolean;
  isVerified?: boolean;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestrictivePractice {
  id: string;
  clientId: string;
  clientName: string;
  practiceType: 'Chemical' | 'Mechanical' | 'Physical' | 'Environmental' | 'Seclusion';
  type?: string;
  subtype?: string;
  description: string;
  status: 'Proposed' | 'Authorized' | 'Active' | 'Superseded' | 'Expired';
  authorizationBody: string; // e.g. "VIC Senior Practitioner"
  authorizationReference: string;
  authorisationStatus?: string;
  authorisedBy?: string;
  clinicalRationale?: string;
  reductionProtocol?: string;
  fadePlanStatus?: string;
  startDate: string;
  expiryDate: string;
  reductionPlanSummary: string;
  monthlyReportStatus: 'Submitted' | 'Due' | 'Overdue';
  lastReportedDate?: string;
}

export interface Incident {
  id: string;
  clientId: string;
  clientName: string;
  practitionerId?: string;
  practitionerName?: string;
  incidentDate: string;
  incidentTime?: string;
  reportedDate?: string;
  reportedByRole?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical / Reportable';
  status: 'Investigating' | 'Under Investigation' | 'Reported to NDIS Commission' | 'Closed' | 'Corrective Action Required' | 'Resolved' | 'Open';
  type?: string;
  injuries?: string;
  investigationNotes?: string;
  isNdisReportable: boolean;
  ndis24hrNotified: boolean;
  ndis5daySubmitted: boolean;
  description: string;
  immediateActionTaken: string;
  rootCauseAnalysis?: string;
  correctiveActions?: string;
  reportedBy: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  prospectName: string;
  ndisNumber?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  stage: 'New Intake' | 'Screening & Qualification' | 'Service Agreement Pending' | 'Converted to Client' | 'Disqualified';
  source: 'NDIS Portal' | 'Support Coordinator Referral' | 'Direct Website' | 'Hospital / Allied Health';
  estimatedPlanValue: number;
  assignedPractitionerId?: string;
  assignedPractitionerName?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Practitioner {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: 'Senior Behaviour Support Practitioner' | 'Core Behaviour Specialist' | 'Provisional Practitioner' | 'Speech Pathologist' | 'Occupational Therapist';
  role?: string;
  qualification: string;
  ndisRegistrationNumber: string;
  pbsRegistrationLevel?: 'Core Practitioner' | 'Proficient Practitioner' | 'Advanced Practitioner' | 'Specialist Practitioner';
  specialties?: string[];
  specialty?: string;
  status?: string;
  workerScreeningNumber?: string;
  workerScreeningExpiry?: string;
  wwccNumber?: string;
  wwccExpiry?: string;
  screeningStatus: 'Valid' | 'Expiring Soon' | 'Expiring' | 'Expired';
  workerScreeningStatus?: 'Active' | 'Pending' | 'Expiring Soon' | 'Expiring' | 'Expired' | 'Valid';
  screeningId?: string;
  screeningExpiry?: string;
  screeningExpiryDate: string;
  policeCheckExpiry?: string;
  policeCheckExpiryDate: string;
  cprExpiryDate?: string;
  firstAidExpiryDate?: string;
  medicationCertExpiryDate?: string;
  mandatoryTrainingExpiryDate?: string;
  ndisOrientationCompleted: boolean;
  cpdHoursThisYear: number;
  cpdHoursRequired?: number;
  caseloadLimit: number;
  activeCaseloadCount: number;
  activeCaseload?: number;
  historicalSuccessRate?: number; // e.g. 98 (%)
  completedSessionsCount?: number; // e.g. 420
  rating?: number; // e.g. 4.9
}

export interface ABCLog {
  id: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  timeOfDay: string; // HH:mm
  dayOfWeek: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  intensity: number; // 1-5
  durationMinutes: number;
  location: string;
  perceivedFunction: 'Escape/Avoidance' | 'Attention/Social' | 'Tangible/Access' | 'Sensory/Automatic';
  recordedBy: string;
}

export interface BSPDocument {
  id: string;
  clientId: string;
  clientName: string;
  version: string; // e.g. "v1.2"
  status: 'Draft' | 'Panel Review' | 'Submitted to NDIS' | 'Active' | 'Superseded';
  summary: string;
  primaryBehaviorsOfConcern: string[];
  proactiveStrategies: string[];
  reactiveStrategies: string[];
  restrictivePractices: RestrictivePractice[];
  reviewDate: string;
  authorName: string;
  lastUpdated: string;
}

export interface NDISSupportItem {
  code: string;
  name: string;
  category: string;
  pricePerUnit: number;
  unitOfMeasure: 'Hour' | 'Each' | 'Day';
}

export interface BillingClaim {
  id: string;
  clientId: string;
  clientName: string;
  ndisNumber: string;
  serviceDate: string;
  ndisSupportItem: string; // e.g. "07_002_0115_8_3 - Specialist Behavioural Intervention"
  supportItemCode: string;
  hours: number;
  hoursWorked?: number;
  quantity?: number;
  unitRate: number;
  unitPrice?: number;
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Submitted PACE' | 'Paid' | 'Rejected';
  invoiceNumber: string;
  reconciliationStatus?: 'Reconciled' | 'Pending' | 'Failed' | 'SLA_Breach_Risk';
  reconciliationError?: string;
  slaDeadline?: string;
  paymentReceivedDate?: string;
  xeroInvoiceId?: string;
  practitionerId?: string;
  practitionerName?: string;
  supportItemName?: string;
  ndisCategory?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfflineDelta {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  payload: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface CommunicationLog {
  id: string;
  entityType: 'Client' | 'Lead';
  entityId: string;
  entityName: string;
  type: 'Phone Call' | 'Email' | 'In-Person Meeting' | 'NDIS Portal Note';
  timestamp: string;
  authorName: string;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'incident' | 'agreement' | 'hr' | 'compliance' | 'client' | 'billing' | 'clinical' | 'general' | 'system';
  severity: 'high' | 'medium' | 'info' | 'low' | 'success';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export type NoteCategory = 'Clinical' | 'Financial' | 'Compliance' | 'HR' | 'Intake' | 'BSP & Safety' | 'General';

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Deferred';

export interface CRMTask {
  id: string;
  title: string;
  description: string;
  category: NoteCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  sourceNoteId?: string;
  sourceNoteTitle?: string;
  clientId?: string;
  clientName?: string;
  leadId?: string;
  leadName?: string;
  isSyncedFromKeep?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledShift {
  id: string;
  practitionerId: string;
  clientId: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  supportType: string;
}

export interface KeepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KeepNoteItem {
  id: string;
  userId: string;
  title: string;
  text: string;
  color: string;
  category: NoteCategory;
  isPinned: boolean;
  isArchived: boolean;
  labels: string[];
  checklist: KeepChecklistItem[];
  clientId?: string;
  clientName?: string;
  executiveSummary?: string;
  syncedToCrmCount?: number;
  lastSyncedToCrm?: string;
  createdAt: string;
  updatedAt: string;
}


