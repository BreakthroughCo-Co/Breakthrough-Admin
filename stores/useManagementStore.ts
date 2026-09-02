import { create } from 'zustand';
import {
  UserProfile,
  UserRole,
  Client,
  ClientGoal,
  CaseNote,
  RestrictivePractice,
  Incident,
  Lead,
  Practitioner,
  ABCLog,
  BSPDocument,
  BillingClaim,
  NDISSupportItem,
  AuditLog,
  AppNotification,
  OfflineDelta,
  CRMTask,
  TaskPriority,
  TaskStatus,
  NoteCategory,
  ScheduledShift
} from '@/types';
import { User } from 'firebase/auth';
import { logOutGoogle } from '@/lib/firebase';
import {
  fetchClients,
  createClient as createClientDoc,
  updateClient as updateClientDoc,
  deleteClient as deleteClientDoc,
  fetchCaseNotes,
  createCaseNote as createCaseNoteDoc,
  updateCaseNote as updateCaseNoteDoc,
  deleteCaseNote as deleteCaseNoteDoc,
  fetchBillingClaims,
  createBillingClaim as createBillingClaimDoc,
  updateBillingClaim as updateBillingClaimDoc,
  deleteBillingClaim as deleteBillingClaimDoc,
  fetchIncidents,
  createIncident as createIncidentDoc,
  updateIncident as updateIncidentDoc,
  deleteIncident as deleteIncidentDoc,
  fetchRestrictivePractices,
  createRestrictivePractice as createRestrictivePracticeDoc,
  updateRestrictivePractice as updateRestrictivePracticeDoc,
  deleteRestrictivePractice as deleteRestrictivePracticeDoc,
  fetchABCLogs,
  createABCLog as createABCLogDoc,
  updateABCLog as updateABCLogDoc,
  deleteABCLog as deleteABCLogDoc,
  fetchBSPDocuments,
  createBSPDocument as createBSPDocumentDoc,
  updateBSPDocument as updateBSPDocumentDoc,
  deleteBSPDocument as deleteBSPDocumentDoc,
  fetchCRMLeads,
  createCRMLead as createCRMLeadDoc,
  updateCRMLead as updateCRMLeadDoc,
  deleteCRMLead as deleteCRMLeadDoc,
  fetchCRMTasks,
  createCRMTask as createCRMTaskDoc,
  updateCRMTask as updateCRMTaskDoc,
  deleteCRMTask as deleteCRMTaskDoc,
  fetchPractitioners,
  createPractitioner as createPractitionerDoc,
  updatePractitioner as updatePractitionerDoc,
  deletePractitioner as deletePractitionerDoc,
  fetchSupportItems,
  createSupportItem as createSupportItemDoc,
  updateSupportItem as updateSupportItemDoc,
  fetchAuditLogs,
  createAuditLog as createAuditLogDoc,
  fetchScheduledShifts,
  createScheduledShift as createScheduledShiftDoc,
  updateScheduledShift as updateScheduledShiftDoc,
  deleteScheduledShift as deleteScheduledShiftDoc,
  fetchUsers,
  getUserProfile,
  saveUserProfile,
  seedInitialFirestoreDataIfEmpty,
  createDocument,
  updateDocument,
  deleteDocument
} from '@/lib/firestoreService';
import { initFirestoreListeners } from '@/lib/firestoreListeners';
import { dispatchTrigger } from '@/lib/notificationService';

// Module-level cleanup handle for real-time Firestore listeners (Phase 3)
let _firestoreListenersCleanup: (() => void) | null = null;

function mapEntityToCollection(entity: string): string {
  const norm = (entity || '').toLowerCase().trim();
  switch (norm) {
    case 'client':
      return 'clients';
    case 'casenote':
    case 'case_note':
    case 'note':
      return 'caseNotes';
    case 'billingclaim':
    case 'billing_claim':
    case 'claim':
      return 'billingClaims';
    case 'incident':
      return 'incidents';
    case 'restrictivepractice':
    case 'restrictive_practice':
    case 'rp':
      return 'restrictivePractices';
    case 'abclog':
    case 'abc_log':
    case 'abc':
      return 'abcLogs';
    case 'bspdocument':
    case 'bsp_document':
    case 'bsp':
      return 'bspDocuments';
    case 'crmlead':
    case 'crm_lead':
    case 'lead':
      return 'crmLeads';
    case 'crmtask':
    case 'crm_task':
    case 'task':
      return 'crmTasks';
    case 'practitioner':
      return 'practitioners';
    case 'supportitem':
    case 'support_item':
    case 'ndissupportitem':
      return 'supportItems';
    case 'auditlog':
    case 'audit_log':
    case 'audit':
      return 'auditLogs';
    case 'scheduledshift':
    case 'scheduled_shift':
    case 'shift':
      return 'scheduledShifts';
    case 'userprofile':
    case 'user_profile':
    case 'user':
      return 'users';
    case 'notification':
    case 'appnotification':
    case 'app_notification':
      return 'notifications';
    default:
      return norm.endsWith('s') ? norm : `${norm}s`;
  }
}

export type TabType =
  | 'command-center'
  | 'clients'
  | 'ndis-goals'
  | 'google-maps'
  | 'case-notes'
  | 'incidents'
  | 'restrictive-practices'
  | 'abc-analyser'
  | 'bsp-plans'
  | 'practice-tools'
  | 'document-intelligence'
  | 'voice-scribe'
  | 'ai-radar'
  | 'audit-simulator'
  | 'proda-gateway'
  | 'plan-report-writer'
  | 'churn-radar'
  | 'agreements-signing'
  | 'telehealth'
  | 'clinical-supervisor'
  | 'bigquery-analytics'
  | 'clinical-benchmarks'
  | 'carer-family-hub'
  | 'gamified-goals'
  | 'lone-worker-safety'
  | 'travel-allowance'
  | 'crisis-escalation'
  | 'credential-vault'
  | 'annual-compliance-return'
  | 'dynamic-assessments'
  | 'rp-fading-simulator'
  | 'schads-fatigue'
  | 'clinical-copilot'
  | 'sensory-audit'
  | 'peer-supervision'
  | 'fhir-gateway'
  | 'budget-forecaster'
  | 'outcome-suite'
  | 'feedback-pulse'
  | 'audio-vault'
  | 'price-indexation'
  | 'disaster-recovery'
  | 'google-workspace'
  | 'google-keep'
  | 'google-classroom'
  | 'audit'
  | 'crm'
  | 'billing'
  | 'hr-roster'
  | 'audit-logs'
  | 'security-audit'
  | 'integrations'
  | 'participant-portal'
  | 'ai-predictive-insights';

export const OFFICIAL_2026_NDIS_PRICE_GUIDE: NDISSupportItem[] = [
  {
    code: '07_002_0115_8_3',
    name: 'Specialist Behavioural Intervention Support',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_004_0115_8_3',
    name: 'Individual Behaviour Support Plan Development & Training',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_056_0128_1_3',
    name: 'Assessment Recommendation Therapy Support - Allied Health',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_043_0128_1_3',
    name: 'Counselling / Allied Health Psychology Support',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_054_0128_1_3',
    name: 'Occupational Therapy - Functional Capacity Assessment & Intervention',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_052_0128_1_3',
    name: 'Speech Pathology Assessment & Clinical AAC Support',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_001_0115_8_3',
    name: 'Behavior Support Practitioner Supervision & Quality Review',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_005_0118_1_3',
    name: 'Early Childhood Support - Key Worker / Behaviour Specialist',
    category: 'Capacity Building - Early Childhood',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_799_0115_8_3',
    name: 'Provider Travel - Behaviour Support Specialist (Non-Face-To-Face)',
    category: 'Capacity Building - Travel & Non-Face-To-Face',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_799_0128_1_3',
    name: 'Provider Travel - Allied Health & Therapy Supports',
    category: 'Capacity Building - Travel & Non-Face-To-Face',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_001_0106_8_3',
    name: 'Support Coordination - Level 2: Coordination of Supports',
    category: 'Capacity Building - Support Coordination',
    pricePerUnit: 100.14,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_002_0132_8_3',
    name: 'Specialist Support Coordination - Level 3: High Complex Needs',
    category: 'Capacity Building - Support Coordination',
    pricePerUnit: 190.54,
    unitOfMeasure: 'Hour',
  },
  {
    code: '01_011_0107_1_1',
    name: 'Assistance With Self-Care Activities - Standard Weekday Daytime',
    category: 'Core - Assistance with Daily Life',
    pricePerUnit: 67.56,
    unitOfMeasure: 'Hour',
  },
  {
    code: '01_015_0107_1_1',
    name: 'Assistance With Self-Care Activities - Weekday Evening',
    category: 'Core - Assistance with Daily Life',
    pricePerUnit: 74.44,
    unitOfMeasure: 'Hour',
  },
  {
    code: '01_013_0107_1_1',
    name: 'Assistance With Self-Care Activities - Saturday Support',
    category: 'Core - Assistance with Daily Life',
    pricePerUnit: 95.07,
    unitOfMeasure: 'Hour',
  },
  {
    code: '01_014_0107_1_1',
    name: 'Assistance With Self-Care Activities - Sunday Support',
    category: 'Core - Assistance with Daily Life',
    pricePerUnit: 122.59,
    unitOfMeasure: 'Hour',
  },
  {
    code: '04_104_0125_6_1',
    name: 'Access Community, Social and Rec Activities - Standard Weekday',
    category: 'Core - Social & Community Participation',
    pricePerUnit: 67.56,
    unitOfMeasure: 'Hour',
  },
  {
    code: '05_220600111_0105_1_2',
    name: 'Low Cost Assistive Technology for Sensory & Communication Support',
    category: 'Capital - Assistive Technology',
    pricePerUnit: 495.00,
    unitOfMeasure: 'Each',
  },
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-director',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@breakthrough.org.au',
    role: 'ADMIN',
    position: 'Clinical Director & Principal PBS Specialist',
    practitionerId: 'prac-201',
    workerScreeningStatus: 'Active',
    workerScreeningExpiry: '2028-09-30',
    policeCheckExpiry: '2027-11-15',
    ndisOrientationDone: true,
    activeCaseload: 14,
  },
  {
    id: 'user-specialist',
    name: 'Marcus Vance',
    email: 'marcus.vance@breakthrough.org.au',
    role: 'PRACTITIONER',
    position: 'Senior Behaviour Support Practitioner',
    practitionerId: 'prac-202',
    workerScreeningStatus: 'Active',
    workerScreeningExpiry: '2027-05-12',
    policeCheckExpiry: '2026-10-20',
    ndisOrientationDone: true,
    activeCaseload: 18,
  },
  {
    id: 'user-auditor',
    name: 'Elena Rostova',
    email: 'elena.rostova@breakthrough.org.au',
    role: 'VIEWER',
    position: 'Compliance & Quality Safeguards Officer',
    practitionerId: 'prac-203',
    workerScreeningStatus: 'Active',
    workerScreeningExpiry: '2028-01-14',
    policeCheckExpiry: '2027-06-30',
    ndisOrientationDone: true,
    activeCaseload: 0,
  },
  {
    id: 'user-coordinator',
    name: 'Sarah Davies',
    email: 'sarah.davies@breakthrough.org.au',
    role: 'SUPPORT_COORDINATOR',
    position: 'Lead Support Coordinator & Intake Specialist',
    practitionerId: 'prac-204',
    workerScreeningStatus: 'Active',
    workerScreeningExpiry: '2027-11-20',
    policeCheckExpiry: '2026-12-15',
    ndisOrientationDone: true,
    activeCaseload: 22,
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-101',
    ndisNumber: '430891245',
    name: 'Jordan Miller',
    dateOfBirth: '2004-03-15',
    status: 'Active',
    primaryDisability: 'Autism Spectrum Disorder (Level 3)',
    secondaryDisabilities: ['Generalized Anxiety Disorder', 'Sensory Processing Sensitivity'],
    goals: [
      {
        id: 'g-101',
        title: 'Master independent emotional regulation techniques during sensory overload in community environments',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 68,
        status: 'In Progress',
        gasScore: 1,
        gasHistory: [
          { date: '2026-01-10', score: -1, note: 'Baseline assessed with high escalation triggers' },
          { date: '2026-04-15', score: 0, note: 'Sensory breaks successfully introduced' },
          { date: '2026-07-20', score: 1, note: 'Independent use of visual noise dampening cues' }
        ]
      },
      {
        id: 'g-102',
        title: 'Establish routine functional communication system for daily preferences',
        category: 'Core',
        targetDate: '2026-10-31',
        progressPercent: 82,
        status: 'In Progress',
        gasScore: 1
      }
    ],
    planStartDate: '2026-01-01',
    planEndDate: '2026-12-31',
    totalBudget: 48500,
    allocatedBudget: 42000,
    spentBudget: 24350,
    primaryPractitionerId: 'prac-202',
    primaryPractitionerName: 'Marcus Vance',
    riskLevel: 'Medium',
    emergencyContact: {
      name: 'Karen Miller',
      relationship: 'Mother & Primary Nominee',
      phone: '0412 889 201'
    },
    restrictivePracticesActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-08-10T14:30:00Z'
  },
  {
    id: 'cli-102',
    ndisNumber: '431092841',
    name: 'Samantha Reed',
    dateOfBirth: '1998-11-22',
    status: 'Active',
    primaryDisability: 'Acquired Brain Injury (ABI)',
    secondaryDisabilities: ['Executive Function Impairment'],
    goals: [
      {
        id: 'g-103',
        title: 'Increase vocational routine tolerance with visual schedule prompting',
        category: 'Social & Community',
        targetDate: '2026-11-30',
        progressPercent: 55,
        status: 'In Progress',
        gasScore: 0
      }
    ],
    planStartDate: '2026-02-15',
    planEndDate: '2027-02-14',
    totalBudget: 36000,
    allocatedBudget: 31000,
    spentBudget: 15400,
    primaryPractitionerId: 'prac-201',
    primaryPractitionerName: 'Dr. Sarah Jenkins',
    riskLevel: 'Low',
    emergencyContact: {
      name: 'David Reed',
      relationship: 'Brother / Support Nominee',
      phone: '0433 112 904'
    },
    restrictivePracticesActive: false,
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-08-08T11:20:00Z'
  },
  {
    id: 'cli-103',
    ndisNumber: '439901422',
    name: 'Liam O’Connor',
    dateOfBirth: '2010-06-08',
    status: 'Active',
    primaryDisability: 'Intellectual Disability & ADHD',
    secondaryDisabilities: ['Receptive Language Disorder'],
    goals: [
      {
        id: 'g-104',
        title: 'Reduce frequency of high-intensity physical agitation during school-to-home transitions',
        category: 'Capacity Building',
        targetDate: '2026-09-30',
        progressPercent: 75,
        status: 'In Progress',
        gasScore: 1
      }
    ],
    planStartDate: '2025-10-01',
    planEndDate: '2026-09-30',
    totalBudget: 54000,
    allocatedBudget: 50000,
    spentBudget: 43200,
    primaryPractitionerId: 'prac-202',
    primaryPractitionerName: 'Marcus Vance',
    riskLevel: 'High',
    emergencyContact: {
      name: 'Claire O’Connor',
      relationship: 'Mother',
      phone: '0409 773 194'
    },
    restrictivePracticesActive: true,
    createdAt: '2025-10-01T08:30:00Z',
    updatedAt: '2026-08-12T16:00:00Z'
  }
];

const INITIAL_PRACTITIONERS: Practitioner[] = [
  {
    id: 'prac-201',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@breakthrough.org.au',
    phone: '0411 234 567',
    position: 'Senior Behaviour Support Practitioner',
    qualification: 'PhD Clinical Psychology, MAPS, NDIS Advanced PBS',
    ndisRegistrationNumber: 'PRAC-NDIS-08819',
    pbsRegistrationLevel: 'Advanced Practitioner',
    specialties: ['Complex Behaviour Support', 'Restrictive Practice Reduction', 'Neurodiversity'],
    status: 'Active',
    workerScreeningNumber: 'NDIS-WSC-9908124',
    workerScreeningExpiry: '2028-09-30',
    wwccNumber: 'WWC0981724E',
    wwccExpiry: '2028-09-30',
    screeningStatus: 'Valid',
    screeningExpiryDate: '2028-09-30',
    policeCheckExpiryDate: '2027-11-15',
    cprExpiryDate: '2027-04-10',
    firstAidExpiryDate: '2027-04-10',
    medicationCertExpiryDate: '2027-08-15',
    mandatoryTrainingExpiryDate: '2027-02-01',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 38,
    cpdHoursRequired: 30,
    caseloadLimit: 20,
    activeCaseloadCount: 14,
    historicalSuccessRate: 94,
    completedSessionsCount: 420,
    rating: 4.9
  },
  {
    id: 'prac-202',
    name: 'Marcus Vance',
    email: 'marcus.vance@breakthrough.org.au',
    phone: '0422 345 678',
    position: 'Senior Behaviour Support Practitioner',
    qualification: 'Master of Applied Behaviour Analysis, BCBA',
    ndisRegistrationNumber: 'PRAC-NDIS-07742',
    pbsRegistrationLevel: 'Proficient Practitioner',
    specialties: ['Autism Spectrum Disorder', 'Functional Behaviour Assessments', 'Staff Coaching'],
    status: 'Active',
    workerScreeningNumber: 'NDIS-WSC-7718290',
    workerScreeningExpiry: '2027-05-12',
    wwccNumber: 'WWC0876123V',
    wwccExpiry: '2027-05-12',
    screeningStatus: 'Valid',
    screeningExpiryDate: '2027-05-12',
    policeCheckExpiryDate: '2026-10-20',
    cprExpiryDate: '2026-09-15',
    firstAidExpiryDate: '2026-09-15',
    medicationCertExpiryDate: '2026-08-28',
    mandatoryTrainingExpiryDate: '2026-09-10',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 26,
    cpdHoursRequired: 30,
    caseloadLimit: 22,
    activeCaseloadCount: 18,
    historicalSuccessRate: 91,
    completedSessionsCount: 512,
    rating: 4.8
  },
  {
    id: 'prac-203',
    name: 'Elena Rostova',
    email: 'elena.rostova@breakthrough.org.au',
    phone: '0433 456 789',
    position: 'Occupational Therapist',
    qualification: 'Bachelor of Occupational Therapy (Hons), AHPRA',
    ndisRegistrationNumber: 'PRAC-NDIS-09124',
    pbsRegistrationLevel: 'Core Practitioner',
    specialties: ['Sensory Modulation', 'Ergonomic Environments', 'Capacity Assessment'],
    status: 'Active',
    workerScreeningNumber: 'NDIS-WSC-5529184',
    workerScreeningExpiry: '2028-01-14',
    wwccNumber: 'WWC0745912E',
    wwccExpiry: '2028-01-14',
    screeningStatus: 'Valid',
    screeningExpiryDate: '2028-01-14',
    policeCheckExpiryDate: '2027-06-30',
    cprExpiryDate: '2027-03-20',
    firstAidExpiryDate: '2027-03-20',
    medicationCertExpiryDate: '2027-05-18',
    mandatoryTrainingExpiryDate: '2027-01-15',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 31,
    cpdHoursRequired: 30,
    caseloadLimit: 18,
    activeCaseloadCount: 12,
    historicalSuccessRate: 96,
    completedSessionsCount: 340,
    rating: 4.9
  },
  {
    id: 'prac-204',
    name: 'Liam Gallagher',
    email: 'liam.gallagher@breakthrough.org.au',
    phone: '0444 567 890',
    position: 'Provisional Practitioner',
    qualification: 'Bachelor of Psychological Science, Provisional PBS',
    ndisRegistrationNumber: 'PRAC-NDIS-10384',
    pbsRegistrationLevel: 'Core Practitioner',
    specialties: ['Positive Behaviour Support Coaching', 'Transition Support'],
    status: 'Active',
    workerScreeningNumber: 'NDIS-WSC-3391824',
    workerScreeningExpiry: '2026-09-02',
    wwccNumber: 'WWC0612984V',
    wwccExpiry: '2026-09-02',
    screeningStatus: 'Expiring Soon',
    screeningExpiryDate: '2026-09-02',
    policeCheckExpiryDate: '2026-08-30',
    cprExpiryDate: '2026-08-25',
    firstAidExpiryDate: '2026-08-25',
    medicationCertExpiryDate: '2026-08-29',
    mandatoryTrainingExpiryDate: '2026-08-27',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 18,
    cpdHoursRequired: 30,
    caseloadLimit: 15,
    activeCaseloadCount: 9,
    historicalSuccessRate: 88,
    completedSessionsCount: 120,
    rating: 4.7
  }
];

const INITIAL_RESTRICTIVE_PRACTICES: RestrictivePractice[] = [
  {
    id: 'rp-301',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practiceType: 'Environmental',
    description: 'Locked kitchen pantry containing high-sugar sensory items outside scheduled snack periods',
    status: 'Authorized',
    authorizationBody: 'Victorian Senior Practitioner Panel',
    authorizationReference: 'VSP-AUTH-2026-8819',
    startDate: '2026-02-01',
    expiryDate: '2027-01-31',
    reductionPlanSummary: 'Graduated visual food choice cards and self-monitoring schedule to fade lock dependency by Q4 2026.',
    monthlyReportStatus: 'Submitted',
    lastReportedDate: '2026-08-01'
  },
  {
    id: 'rp-302',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practiceType: 'Chemical',
    description: 'Low-dose Clonidine (0.05mg) as prescribed by paediatrician for acute autonomic arousal with extreme self-injury risk',
    status: 'Authorized',
    authorizationBody: 'NDIS Quality & Safeguards Commission State Authorizer',
    authorizationReference: 'NDIS-RP-2026-0441',
    startDate: '2026-03-15',
    expiryDate: '2026-09-14',
    reductionPlanSummary: 'Multi-sensory deep pressure protocol implemented 15 mins prior to transition triggers to reduce PRN administration by 50%.',
    monthlyReportStatus: 'Due',
    lastReportedDate: '2026-07-28'
  }
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-400',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-201',
    practitionerName: 'Dr. Sarah Jenkins',
    incidentDate: '2026-08-16T14:10:00Z',
    severity: 'Critical / Reportable',
    status: 'Investigating',
    isNdisReportable: true,
    ndis24hrNotified: true,
    ndis5daySubmitted: false,
    description: 'Participant demonstrated intense acute agitation with unexpected physical strike during community therapy transition, requiring 30-sec emergency guide.',
    immediateActionTaken: 'Staff initiated positive de-escalation protocol level 3; participant guided to low-stimulus vehicle; 24-hr Commission notice lodged.',
    rootCauseAnalysis: 'Sensory overload combined with sudden transport delay; formal 5-day root cause investigation pending.',
    correctiveActions: 'Reviewing transport schedule buffer times; updated proactive sensory transition kit in progress.',
    reportedBy: 'Dr. Sarah Jenkins',
    createdAt: '2026-08-16T14:10:00Z'
  },
  {
    id: 'inc-401',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    incidentDate: '2026-08-14T10:15:00Z',
    severity: 'Medium',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Verbal agitation and thrown plastic cup during sensory transition at day program. No physical contact or injury.',
    immediateActionTaken: 'Practitioner guided participant to quiet sensory decompression corner; offered noise-canceling headphones.',
    rootCauseAnalysis: 'Unannounced fire alarm testing in adjacent suite triggered unexpected sensory hyper-reactivity.',
    correctiveActions: 'Day program coordination protocol established to provide 30-minute advance written notification for all facility auditory tests.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-08-14T10:15:00Z'
  },
  {
    id: 'inc-402',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-201',
    practitionerName: 'Dr. Sarah Jenkins',
    incidentDate: '2026-08-02T16:30:00Z',
    severity: 'Low',
    status: 'Resolved',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Minor refusal during transition from sensory swing to tabletop activity.',
    immediateActionTaken: 'Visual timer reset for additional 3 minutes followed by successful transition.',
    reportedBy: 'Dr. Sarah Jenkins',
    createdAt: '2026-08-02T16:30:00Z'
  },
  {
    id: 'inc-403',
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    incidentDate: '2026-07-22T14:45:00Z',
    severity: 'Critical / Reportable',
    status: 'Closed',
    isNdisReportable: true,
    ndis24hrNotified: true,
    ndis5daySubmitted: true,
    description: 'Severe escalation resulting in self-injurious head banging during crowded shopping mall therapy outing.',
    immediateActionTaken: 'Participant escorted to quiet parent vehicle immediately, sensory compression applied, 24-hr NDIS Commission notification lodged.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-07-22T14:45:00Z'
  },
  {
    id: 'inc-404',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practitionerId: 'prac-203',
    practitionerName: 'Elena Rostova',
    incidentDate: '2026-07-11T11:20:00Z',
    severity: 'High',
    status: 'Resolved',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Property damage during sensory overload in communal dining area.',
    immediateActionTaken: 'Staff cleared area and offered weighted lap blanket and low-stimulus room.',
    reportedBy: 'Elena Rostova',
    createdAt: '2026-07-11T11:20:00Z'
  },
  {
    id: 'inc-405',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    incidentDate: '2026-06-18T15:10:00Z',
    severity: 'High',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'High-intensity vocal outburst and kicking therapy partition during schedule delay.',
    immediateActionTaken: 'Practitioner deployed first-then visual sequence and calming music.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-06-18T15:10:00Z'
  },
  {
    id: 'inc-406',
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    practitionerId: 'prac-201',
    practitionerName: 'Dr. Sarah Jenkins',
    incidentDate: '2026-05-29T17:00:00Z',
    severity: 'Critical / Reportable',
    status: 'Closed',
    isNdisReportable: true,
    ndis24hrNotified: true,
    ndis5daySubmitted: true,
    description: 'Emergency physical hold applied for 45 seconds to prevent participant from running towards high-traffic roadway.',
    immediateActionTaken: 'Safety secured, emergency debrief conducted, restrictive practice reported to NDIS Commission within 24 hours.',
    reportedBy: 'Dr. Sarah Jenkins',
    createdAt: '2026-05-29T17:00:00Z'
  },
  {
    id: 'inc-407',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practitionerId: 'prac-203',
    practitionerName: 'Elena Rostova',
    incidentDate: '2026-05-14T09:40:00Z',
    severity: 'Medium',
    status: 'Resolved',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Sensory dysregulation during speech therapy assessment session.',
    immediateActionTaken: 'Deep pressure proprioceptive exercises provided.',
    reportedBy: 'Elena Rostova',
    createdAt: '2026-05-14T09:40:00Z'
  },
  {
    id: 'inc-408',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    incidentDate: '2026-04-20T13:15:00Z',
    severity: 'Low',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Mild anxiety manifestation prior to community transport boarding.',
    immediateActionTaken: 'Social story reviewed with participant.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-04-20T13:15:00Z'
  },
  {
    id: 'inc-409',
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    practitionerId: 'prac-201',
    practitionerName: 'Dr. Sarah Jenkins',
    incidentDate: '2026-03-12T16:20:00Z',
    severity: 'High',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Intense aggression toward support equipment after unexpected routine alteration.',
    immediateActionTaken: 'Positive Behaviour Support de-escalation protocol level 2 initiated.',
    reportedBy: 'Dr. Sarah Jenkins',
    createdAt: '2026-03-12T16:20:00Z'
  },
  {
    id: 'inc-410',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    incidentDate: '2026-02-18T10:05:00Z',
    severity: 'Medium',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Refusal and verbal protest during gross motor therapy session.',
    immediateActionTaken: 'Alternative choice of therapy equipment offered.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-02-18T10:05:00Z'
  },
  {
    id: 'inc-411',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-201',
    practitionerName: 'Dr. Sarah Jenkins',
    incidentDate: '2026-01-25T14:30:00Z',
    severity: 'High',
    status: 'Closed',
    isNdisReportable: false,
    ndis24hrNotified: false,
    ndis5daySubmitted: false,
    description: 'Severe sensory meltdown upon return from extended holiday break.',
    immediateActionTaken: 'Quiet room decompression protocol executed with low lighting and deep pressure vest.',
    reportedBy: 'Dr. Sarah Jenkins',
    createdAt: '2026-01-25T14:30:00Z'
  }
];

const INITIAL_CASE_NOTES: CaseNote[] = [
  {
    id: 'note-501',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    date: '2026-08-12',
    sessionDurationMinutes: 90,
    format: 'Standard',
    subjective: 'Participant arrived calm; mother reported two successful community outings this week with zero dysregulation events.',
    objective: 'Practitioner conducted a 45-minute structured functional activity evaluating the newly introduced visual schedule board. Jordan independently initiated 4 communication exchanges using PECS.',
    assessment: 'Participant is demonstrating rapid acquisition of secondary communication pathways. Goal 1.1 progression is on track.',
    plan: 'Deliver 1-hour coaching session with primary support worker on Wednesday; introduce step 2 in sensory regulation binder.',
    linkedGoalIds: ['g-101'],
    status: 'Approved',
    flaggedForReview: false,
    createdAt: '2026-08-12T16:00:00Z',
    updatedAt: '2026-08-12T16:45:00Z'
  }
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-601',
    prospectName: 'Ethan Brooks',
    ndisNumber: '439182773',
    contactName: 'Jessica Brooks (Parent)',
    contactEmail: 'jessica.brooks@example.com',
    contactPhone: '0421 990 812',
    stage: 'Service Agreement Pending',
    source: 'Support Coordinator Referral',
    estimatedPlanValue: 42000,
    assignedPractitionerId: 'prac-202',
    assignedPractitionerName: 'Marcus Vance',
    notes: 'Requires Comprehensive Functional Behaviour Assessment and Interim Behaviour Support Plan before October 2026.',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z'
  },
  {
    id: 'lead-602',
    prospectName: 'Maya Patel',
    ndisNumber: '438771209',
    contactName: 'Ravi Patel',
    contactEmail: 'ravi.patel@example.com',
    contactPhone: '0432 554 123',
    stage: 'New Intake',
    source: 'Direct Website',
    estimatedPlanValue: 28000,
    assignedPractitionerId: 'prac-201',
    assignedPractitionerName: 'Dr. Sarah Jenkins',
    notes: 'Transition to supported independent living (SIL); requires baseline sensory and communication profile.',
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-15T08:30:00Z'
  }
];

const INITIAL_ABC_LOGS: ABCLog[] = [
  {
    id: 'abc-701',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    timestamp: '2026-08-13T14:20:00Z',
    timeOfDay: '14:20',
    dayOfWeek: 'Thursday',
    antecedent: 'Transition from iPad video game to dinnertime meal prep in crowded kitchen',
    behavior: 'Vocal protest, dropped to floor, refused to move for 8 minutes',
    consequence: 'Worker provided visual timer giving 3-minute extension; participant stood up calmly when timer chimed',
    intensity: 3,
    durationMinutes: 8,
    location: 'Family Residence - Kitchen',
    perceivedFunction: 'Escape/Avoidance',
    recordedBy: 'Support Worker Dave T.'
  }
];

const INITIAL_CLAIMS: BillingClaim[] = [
  {
    id: 'claim-801',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    ndisNumber: '430891245',
    serviceDate: '2026-08-12',
    ndisSupportItem: 'Specialist Behavioural Intervention Support',
    supportItemCode: '07_002_0115_8_3',
    hours: 1.5,
    unitRate: 214.41,
    totalAmount: 321.62,
    status: 'Approved',
    invoiceNumber: 'INV-BK-2026-0941',
    reconciliationStatus: 'Reconciled',
    slaDeadline: '2026-08-26',
    paymentReceivedDate: '2026-08-14'
  },
  {
    id: 'claim-802',
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    ndisNumber: '431092841',
    serviceDate: '2026-08-11',
    ndisSupportItem: 'Assessment Recommendation Therapy Support - Allied Health',
    supportItemCode: '15_056_0128_1_3',
    hours: 2.0,
    unitRate: 193.99,
    totalAmount: 387.98,
    status: 'Pending',
    invoiceNumber: 'INV-BK-2026-0942',
    reconciliationStatus: 'SLA_Breach_Risk',
    reconciliationError: 'PACE Submission pending > 5 business days; nearing 7-day payment SLA window',
    slaDeadline: '2026-08-18'
  },
  {
    id: 'claim-803',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    ndisNumber: '430891245',
    serviceDate: '2026-08-04',
    ndisSupportItem: 'Individual Behaviour Support Plan Development & Training',
    supportItemCode: '07_004_0115_8_3',
    hours: 3.0,
    unitRate: 235.00,
    totalAmount: 705.00,
    status: 'Rejected',
    invoiceNumber: 'INV-BK-2026-0938',
    reconciliationStatus: 'Failed',
    reconciliationError: 'Unit rate $235.00 exceeds NDIS price cap of $214.41/hr for line item 07_004_0115_8_3',
    slaDeadline: '2026-08-11'
  }
];

const INITIAL_BSP: BSPDocument = {
  id: 'bsp-main',
  clientId: 'cli-101',
  clientName: 'Jordan Miller',
  version: '2.1',
  status: 'Active',
  summary: 'Comprehensive Positive Behaviour Support Plan focusing on proactive sensory regulation, environmental predictability, and functional communication training.',
  primaryBehaviorsOfConcern: [
    'Sensory overload flight / bolting behaviors during high-decibel community transitions',
    'Intense vocal protesting and task refusal during abrupt activity changes'
  ],
  proactiveStrategies: [
    'Maintain consistent visual scheduling with minimum 5-minute countdown timers prior to all activity transitions',
    'Pre-emptively equip participant with active noise-dampening headphones in busy retail / public transit spaces',
    'Provide structured choice opportunities between two preferred activities every 60 minutes'
  ],
  reactiveStrategies: [
    'Low-arousal verbal de-escalation: reduce vocal volume, speak in short 2-3 word neutral phrases',
    'Create generous physical buffer space; avoid blocking natural exit pathways',
    'Offer familiar calming sensory tools (weighted lap pad, tactile resistance squeeze ball)'
  ],
  restrictivePractices: INITIAL_RESTRICTIVE_PRACTICES,
  reviewDate: '2027-01-31',
  authorName: 'Marcus Vance (Senior PBS Practitioner)',
  lastUpdated: '2026-08-10T14:30:00Z'
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'NDIS Commission Monthly Submission Ready',
    message: 'Monthly restrictive practice summary report for Jordan Miller is due in 16 days.',
    type: 'clinical',
    severity: 'high',
    timestamp: '2026-08-15T08:00:00Z',
    read: false,
    linkTab: 'restrictive-practices'
  },
  {
    id: 'notif-2',
    title: 'Google Workspace Gateway Live',
    message: 'Direct OAuth connected with Google Drive, Sheets, Docs, Calendar, Meet, and Gmail.',
    type: 'compliance',
    severity: 'low',
    timestamp: '2026-08-15T09:30:00Z',
    read: false,
    linkTab: 'google-workspace'
  }
];

const INITIAL_CRM_TASKS: CRMTask[] = [
  {
    id: 'task-101',
    title: 'Review afternoon de-escalation log with support team',
    description: 'Check Jordan responded to 5-minute visual timer cue card during Tuesday transit.',
    category: 'Clinical',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-08-22',
    assignedTo: 'Marcus Vance',
    sourceNoteId: 'keep-1',
    sourceNoteTitle: 'Jordan Miller - Sensory De-escalation Protocol',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    isSyncedFromKeep: true,
    createdAt: '2026-08-15T09:15:00Z',
    updatedAt: '2026-08-15T09:15:00Z'
  },
  {
    id: 'task-102',
    title: 'Generate monthly incident trend graph for Senior Practitioner',
    description: 'Prepare restrictive practice summary submission reports for Liam O’Connor audit review.',
    category: 'Compliance',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: '2026-08-25',
    assignedTo: 'Elena Rostova',
    sourceNoteId: 'keep-2',
    sourceNoteTitle: 'NDIS Commission Monthly Submission Checklist',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    isSyncedFromKeep: true,
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z'
  },
  {
    id: 'task-103',
    title: 'Draft Service Agreement schedule for FBA & Interim Plan',
    description: 'Follow up with Jessica Brooks regarding $42,000 NDIS funding allocation.',
    category: 'Financial',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-08-24',
    assignedTo: 'Dr. Sarah Jenkins',
    leadId: 'lead-601',
    leadName: 'Ethan Brooks',
    isSyncedFromKeep: false,
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z'
  },
  {
    id: 'task-104',
    title: 'Sign off on interim BSP v2.1 with Principal Specialist',
    description: 'Present ABC scatterplot analysis and schedule parent feedback videoconference.',
    category: 'Clinical',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-08-28',
    assignedTo: 'Marcus Vance',
    sourceNoteId: 'keep-3',
    sourceNoteTitle: 'Supervision Session Agenda with Principal Specialist',
    isSyncedFromKeep: true,
    createdAt: '2026-08-13T14:20:00Z',
    updatedAt: '2026-08-14T16:00:00Z'
  },
  {
    id: 'task-105',
    title: 'Verify worker screening renewals for PBS supervision roster',
    description: 'Ensure provisional practitioner WWCC and NDIS orientation completion checks are logged.',
    category: 'HR',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '2026-08-30',
    assignedTo: 'Elena Rostova',
    isSyncedFromKeep: false,
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-12T10:00:00Z'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1001',
    timestamp: '2026-08-15T09:30:00Z',
    actorId: 'user-director',
    actorName: 'Dr. Sarah Jenkins',
    actorRole: 'ADMIN',
    action: 'LOGIN',
    entity: 'SystemSession',
    entityId: 'sess-8819',
    details: 'Authenticated via Google Workspace SSO into Breakthrough OS',
    ipAddress: '10.0.0.1'
  },
  {
    id: 'log-1002',
    timestamp: '2026-08-14T16:00:00Z',
    actorId: 'user-specialist',
    actorName: 'Marcus Vance',
    actorRole: 'PRACTITIONER',
    action: 'CREATE',
    entity: 'CaseNote',
    entityId: 'note-501',
    details: 'Logged SOAP clinical session note for Jordan Miller with auto-billing claim',
    ipAddress: '10.0.0.1'
  }
];

interface ManagementState {
  currentUser: UserProfile;
  users: UserProfile[];
  isAuthenticated: boolean;
  authLoading: boolean;
  theme: 'light' | 'dark';
  activeTab: TabType;
  searchTerm: string;
  selectedClientId: string | null;
  isCommandPaletteOpen: boolean;
  isMobileSidebarOpen: boolean;
  
  clients: Client[];
  caseNotes: CaseNote[];
  restrictivePractices: RestrictivePractice[];
  incidents: Incident[];
  leads: Lead[];
  crmTasks: CRMTask[];
  practitioners: Practitioner[];
  abcLogs: ABCLog[];
  bsp: BSPDocument;
  bspPlans: BSPDocument[];
  bspDocuments: BSPDocument[];
  claims: BillingClaim[];
  billingClaims: BillingClaim[];
  supportItems: NDISSupportItem[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  scheduledShifts: ScheduledShift[];

  // Real-time Global Connectivity & Offline-First Delta Synchronizer
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'pending';
  pendingChangesCount: number;
  offlineQueue: OfflineDelta[];
  lastSyncTime: string;

  // Actions
  setUserProfile: (profile: UserProfile | null) => void;
  signOutUser: () => Promise<void>;
  handleAuthUser: (firebaseUser: User | null) => Promise<UserProfile | null>;
  canEdit: () => boolean;
  canDelete: () => boolean;
  isAdmin: () => boolean;
  isPractitioner: () => boolean;
  isViewer: () => boolean;
  isSupportCoordinator: () => boolean;

  switchUser: (id: string) => void;
  setUserRole: (role: UserRole) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: TabType) => void;
  setSearchTerm: (term: string) => void;
  setSelectedClientId: (id: string | null) => void;
  navigateToClient: (identifier: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  setOnlineStatus: (status: boolean) => void;
  triggerDeltaSync: () => Promise<void>;
  simulateOfflineToggle: () => void;
  queueOfflineDelta: (action: string, entity: string, entityId: string, payload: any) => void;

  addClient: (client: Client | Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addClientGoal: (clientId: string, goal: Omit<ClientGoal, 'id'>) => void;
  updateClientGoal: (clientId: string, goalId: string, updates: Partial<ClientGoal>) => void;
  deleteClientGoal: (clientId: string, goalId: string) => void;
  linkCaseNoteToGoal: (clientId: string, goalId: string, noteId: string) => void;

  addCaseNote: (note: CaseNote | Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCaseNote: (id: string, updates: Partial<CaseNote>) => void;
  deleteCaseNote: (id: string) => void;

  addRestrictivePractice: (practice: RestrictivePractice | Omit<RestrictivePractice, 'id'>) => void;
  updateRestrictivePractice: (id: string, updates: Partial<RestrictivePractice>) => void;
  deleteRestrictivePractice: (id: string) => void;

  addIncident: (incident: Incident | Omit<Incident, 'id' | 'createdAt'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  updateIncidentStatus: (id: string, status: any) => void;
  deleteIncident: (id: string) => void;

  addLead: (lead: Lead | Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  updateLeadStage: (id: string, stage: Lead['stage']) => void;
  deleteLead: (id: string) => void;

  addCRMTask: (task: CRMTask | Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCRMTask: (id: string, updates: Partial<CRMTask>) => void;
  deleteCRMTask: (id: string) => void;
  toggleCRMTaskStatus: (id: string) => void;
  syncKeepNoteToCRMTasks: (
    note: any,
    options?: { priority?: TaskPriority; dueDate?: string; assignedTo?: string; defaultCategory?: NoteCategory }
  ) => { count: number; taskIds: string[] };

  addPractitioner: (practitioner: Practitioner) => void;
  updatePractitioner: (id: string, updates: Partial<Practitioner>) => void;
  deletePractitioner: (id: string) => void;

  addABCLog: (log: ABCLog | Omit<ABCLog, 'id'>) => void;
  updateAbcLog: (id: string, updates: Partial<ABCLog>) => void;
  deleteABCLog: (id: string) => void;

  updateBSP: (updates: Partial<BSPDocument>) => void;
  addBSPPlan: (bsp: BSPDocument | Omit<BSPDocument, 'id' | 'lastUpdated'>) => void;
  addBSPDocument: (bsp: BSPDocument | Omit<BSPDocument, 'id' | 'lastUpdated'>) => void;
  updateBspDocument: (id: string, updates: Partial<BSPDocument>) => void;
  updateBSPDocument: (id: string, updates: Partial<BSPDocument>) => void;
  deleteBSPDocument: (id: string) => void;

  addBillingClaim: (claim: BillingClaim | Omit<BillingClaim, 'id' | 'invoiceNumber'>) => void;
  updateBillingClaim: (id: string, updates: Partial<BillingClaim>) => void;
  updateBillingStatus: (id: string, status: BillingClaim['status']) => void;
  deleteBillingClaim: (id: string) => void;
  reconcileClaim: (id: string, status: 'Reconciled' | 'Failed' | 'SLA_Breach_Risk', note?: string) => void;
  autoReconcileAllClaims: () => void;

  addScheduledShift: (shift: ScheduledShift | Omit<ScheduledShift, 'id'>) => void;
  updateScheduledShift: (id: string, updates: Partial<ScheduledShift>) => void;
  deleteScheduledShift: (id: string) => void;

  isUsingMockData: boolean;
  clearAllMockData: (keepCurrentUser?: boolean) => void;
  loadDemoData: () => void;
  importClientsFromCSV: (csvText: string) => number;
  exportFullDatabaseJSON: () => string;
  exportClientsCSV: () => string;
  generateParticipantTemplateCSV: () => string;

  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  resetToDefaultData: () => void;
  loadFromFirestore: () => Promise<void>;
  syncWithFirestore: () => Promise<void>;
  startRealtimeListeners: () => void;
  stopRealtimeListeners: () => void;
  setEntities: (collection: string, data: any[]) => void;
}

export const useManagementStore = create<ManagementState>((set, get) => ({
  currentUser: INITIAL_USERS[0],
  users: INITIAL_USERS,
  isAuthenticated: false,
  authLoading: true,
  theme: 'dark',
  activeTab: 'google-workspace',
  searchTerm: '',
  selectedClientId: null,
  isCommandPaletteOpen: false,
  isMobileSidebarOpen: false,

  isUsingMockData: true,
  clients: INITIAL_CLIENTS,
  caseNotes: INITIAL_CASE_NOTES,
  restrictivePractices: INITIAL_RESTRICTIVE_PRACTICES,
  incidents: INITIAL_INCIDENTS,
  leads: INITIAL_LEADS,
  crmTasks: INITIAL_CRM_TASKS,
  practitioners: INITIAL_PRACTITIONERS,
  abcLogs: INITIAL_ABC_LOGS,
  bsp: INITIAL_BSP,
  bspPlans: [INITIAL_BSP],
  bspDocuments: [INITIAL_BSP],
  claims: INITIAL_CLAIMS,
  billingClaims: INITIAL_CLAIMS,
  supportItems: OFFICIAL_2026_NDIS_PRICE_GUIDE,
  auditLogs: INITIAL_AUDIT_LOGS,
  notifications: INITIAL_NOTIFICATIONS,
  scheduledShifts: [],

  // Authentication & RBAC Methods
  setUserProfile: (profile: UserProfile | null) => {
    if (profile) {
      set({ currentUser: profile, isAuthenticated: true, authLoading: false });
      get().addAuditLog(
        'SET_PROFILE',
        'UserProfile',
        profile.id,
        `User session profile updated: ${profile.name} (${profile.role})`
      );
    } else {
      set({ currentUser: INITIAL_USERS[0], isAuthenticated: false, authLoading: false });
    }
  },

  signOutUser: async () => {
    try {
      await logOutGoogle();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    const currentId = get().currentUser?.id || 'unknown';
    set({
      currentUser: INITIAL_USERS[0],
      isAuthenticated: false,
      authLoading: false
    });
    get().addAuditLog('LOGOUT', 'UserProfile', currentId, 'User signed out from Breakthrough OS');
  },

  handleAuthUser: async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      set({ isAuthenticated: false, authLoading: false });
      return null;
    }
    // Default newly registered users strictly to PENDING until approved by Administrator
    const role: UserRole = 'PENDING';

    const defaultProfile: UserProfile = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NDIS Specialist',
      displayName: firebaseUser.displayName || undefined,
      email: firebaseUser.email || '',
      role: role,
      photoURL: firebaseUser.photoURL || undefined,
      avatarUrl: firebaseUser.photoURL || undefined,
      position: 'Pending Verification',
      practitionerId: `prac-${firebaseUser.uid.slice(-4)}`,
      workerScreeningStatus: 'Pending',
      workerScreeningExpiry: '2028-12-31',
      policeCheckExpiry: '2027-12-31',
      ndisOrientationDone: false,
      activeCaseload: 0,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Race Firestore profile retrieval with a strict 1500ms timeout so the user never stalls
      const profilePromise = getUserProfile(firebaseUser.uid);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const fetchedProfile = await Promise.race([profilePromise, timeoutPromise]).catch(() => null);

      const activeProfile = fetchedProfile || defaultProfile;

      // Immediately set user profile and grant authenticated status
      set({ currentUser: activeProfile, isAuthenticated: true, authLoading: false });

      // Save/update profile in background non-blockingly if it was freshly generated
      if (!fetchedProfile) {
        saveUserProfile(defaultProfile).catch((err) =>
          console.warn('Background profile persist notice:', err?.message || err)
        );
      }

      return activeProfile;
    } catch (err) {
      console.warn('handleAuthUser fallback engaged:', err);
      set({ currentUser: defaultProfile, isAuthenticated: true, authLoading: false });
      return defaultProfile;
    }
  },

  canEdit: () => {
    const role = get().currentUser?.role;
    return role === 'ADMIN' || role === 'PRACTITIONER' || role === 'SUPPORT_COORDINATOR';
  },

  canDelete: () => {
    return get().currentUser?.role === 'ADMIN';
  },

  isAdmin: () => {
    return get().currentUser?.role === 'ADMIN';
  },

  isPractitioner: () => {
    const role = get().currentUser?.role;
    return role === 'PRACTITIONER' || role === 'ADMIN';
  },

  isViewer: () => {
    return get().currentUser?.role === 'VIEWER';
  },

  isSupportCoordinator: () => {
    const role = get().currentUser?.role;
    return role === 'SUPPORT_COORDINATOR' || role === 'ADMIN';
  },

  // Connectivity & Delta Synchronizer State
  isOnline: true,
  syncStatus: 'synced',
  pendingChangesCount: 0,
  offlineQueue: [],
  lastSyncTime: new Date().toISOString(),

  setOnlineStatus: (isOnline: boolean) => {
    set((state) => {
      const syncStatus = !isOnline
        ? 'offline'
        : state.offlineQueue.length > 0
        ? 'pending'
        : 'synced';
      return { isOnline, syncStatus };
    });
    if (isOnline && get().offlineQueue.length > 0) {
      get().triggerDeltaSync();
    }
  },

  simulateOfflineToggle: () => {
    const nextOnline = !get().isOnline;
    get().setOnlineStatus(nextOnline);
    get().addNotification({
      title: nextOnline ? 'Network Connection Restored' : 'Operating in Field Offline Mode',
      message: nextOnline
        ? 'Online connectivity detected. Synchronizing queued clinical and billing deltas with Cloud ledger.'
        : 'Local delta cache active. All case notes, billing claims, and audits will be safely queued locally.',
      type: 'compliance',
      severity: nextOnline ? 'low' : 'medium'
    });
  },

  queueOfflineDelta: (action, entity, entityId, payload) => {
    const delta: OfflineDelta = {
      id: `delta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      payload
    };
    set((state) => ({
      offlineQueue: [...state.offlineQueue, delta],
      pendingChangesCount: state.offlineQueue.length + 1,
      syncStatus: state.isOnline ? 'pending' : 'offline'
    }));
  },

  triggerDeltaSync: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) {
      set({ syncStatus: 'synced', pendingChangesCount: 0, lastSyncTime: new Date().toISOString() });
      return;
    }

    set({ syncStatus: 'syncing' });
    const queueToProcess = [...queue];
    const successfulDeltaIds: string[] = [];
    let syncErrors = 0;

    for (const delta of queueToProcess) {
      try {
        const colName = mapEntityToCollection(delta.entity);
        if (delta.action === 'CREATE' || delta.action === 'UPDATE' || delta.action === 'UPDATE_GOALS') {
          const docData = delta.payload || {};
          await createDocument(colName, docData, delta.entityId);
        } else if (delta.action === 'DELETE') {
          await deleteDocument(colName, delta.entityId);
        }
        successfulDeltaIds.push(delta.id);
      } catch (err) {
        console.warn(`[DeltaSync] Failed to synchronize delta ${delta.id} (${delta.entity}/${delta.entityId}):`, err);
        syncErrors++;
      }
    }

    const processedCount = successfulDeltaIds.length;
    set((state) => {
      const remainingQueue = state.offlineQueue.filter((d) => !successfulDeltaIds.includes(d.id));
      const isFullySynced = remainingQueue.length === 0;
      return {
        offlineQueue: remainingQueue,
        pendingChangesCount: remainingQueue.length,
        syncStatus: isFullySynced ? 'synced' : (state.isOnline ? 'pending' : 'offline'),
        lastSyncTime: processedCount > 0 ? new Date().toISOString() : state.lastSyncTime
      };
    });

    if (processedCount > 0) {
      get().addAuditLog(
        'DELTA_SYNC_SUCCESS',
        'OfflineDeltaQueue',
        `batch-${Date.now()}`,
        `Successfully synchronized ${processedCount} pending local deltas to cloud database.${syncErrors > 0 ? ` (${syncErrors} failed and remained in queue)` : ''}`
      );

      get().addNotification({
        title: 'Offline Deltas Synchronized',
        message: `Successfully flushed ${processedCount} queued offline records to the cloud database.${syncErrors > 0 ? ` (${syncErrors} remaining in queue)` : ''}`,
        type: 'compliance',
        severity: syncErrors > 0 ? 'medium' : 'low'
      });
    } else if (syncErrors > 0) {
      set({ syncStatus: get().isOnline ? 'pending' : 'offline' });
    }
  },

  switchUser: (id: string) => {
    const user = get().users.find((u) => u.id === id);
    if (user) {
      set({ currentUser: user });
      get().addAuditLog('SWITCH_USER', 'UserProfile', user.id, `Active session switched to ${user.name} (${user.role})`);
    }
  },

  setUserRole: (role: UserRole) => {
    set((state) => ({
      currentUser: { ...state.currentUser, role }
    }));
    get().addAuditLog('UPDATE_ROLE', 'UserProfile', get().currentUser.id, `User role altered to ${role}`);
  },

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedClientId: (selectedClientId) => set({ selectedClientId }),
  navigateToClient: (identifier: string) => {
    const raw = identifier.trim();
    const cleanId = raw.replace(/^[#\[\]]+|[#\[\]]+$/g, '').trim().toLowerCase();
    const cleanNum = cleanId.replace(/^cid-|^cli-|^client-/, '');
    const clients = get().clients;

    const match = clients.find((c) => {
      const cId = c.id.toLowerCase();
      const cNum = cId.replace(/^cli-|^cid-/, '');
      const cNdis = c.ndisNumber.toLowerCase();
      const cName = c.name.toLowerCase();

      return (
        cId === cleanId ||
        cNum === cleanNum ||
        cNdis === cleanId ||
        cNdis === cleanNum ||
        cName.includes(cleanId) ||
        cleanId.includes(cId) ||
        `cli-${cleanNum}` === cId ||
        `cid-${cleanNum}` === cId
      );
    });

    if (match) {
      set({ selectedClientId: match.id, activeTab: 'clients' });
      get().addNotification({
        title: `Viewing Client Dashboard: ${match.name}`,
        message: `Navigated to ${match.name} (NDIS: ${match.ndisNumber}) via smart Keep link.`,
        type: 'client',
        severity: 'low'
      });
    } else {
      set({ activeTab: 'clients' });
    }
  },
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  addClient: (clientData) => {
    const newClient: Client = {
      id: (clientData as Client).id || `cli-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...clientData,
    } as Client;

    set((state) => ({ clients: [newClient, ...state.clients] }));
    get().addAuditLog('CREATE', 'Client', newClient.id, `Enrolled participant ${newClient.name} (NDIS: ${newClient.ndisNumber})`);

    createClientDoc(newClient).catch((err) => {
      console.warn('Firestore write failed for addClient, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'Client', newClient.id, newClient);
    });
  },

  updateClient: (id, updates) => {
    const updatedAt = new Date().toISOString();
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates, updatedAt } : c))
    }));
    get().addAuditLog('UPDATE', 'Client', id, `Updated participant record`);

    updateClientDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateClient, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Client', id, updates);
    });
  },

  deleteClient: (id) => {
    const target = get().clients.find((c) => c.id === id);
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id)
    }));
    if (target) {
      get().addAuditLog('DELETE', 'Client', id, `Archived participant record for ${target.name}`);
    }

    deleteClientDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteClient, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'Client', id, { id });
    });
  },

  addClientGoal: (clientId, goalData) => {
    const newGoal: ClientGoal = {
      id: `g-${Date.now().toString().slice(-4)}`,
      ...goalData,
    };
    let updatedGoals: ClientGoal[] = [];
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id === clientId) {
          updatedGoals = [...c.goals, newGoal];
          return { ...c, goals: updatedGoals, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    }));
    get().addAuditLog('CREATE', 'ClientGoal', newGoal.id, `Added goal "${newGoal.title}" to participant record`);

    if (updatedGoals.length > 0) {
      updateClientDoc(clientId, { goals: updatedGoals }).catch((err) => {
        get().queueOfflineDelta('UPDATE_GOALS', 'Client', clientId, { goals: updatedGoals });
      });
    }
  },

  updateClientGoal: (clientId, goalId, updates) => {
    let updatedGoals: ClientGoal[] = [];
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id !== clientId) return c;
        updatedGoals = c.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g));
        return {
          ...c,
          goals: updatedGoals,
          updatedAt: new Date().toISOString()
        };
      })
    }));
    get().addAuditLog('UPDATE', 'ClientGoal', goalId, `Updated goal milestone progress`);

    if (updatedGoals.length > 0) {
      updateClientDoc(clientId, { goals: updatedGoals }).catch((err) => {
        get().queueOfflineDelta('UPDATE_GOALS', 'Client', clientId, { goals: updatedGoals });
      });
    }
  },

  deleteClientGoal: (clientId, goalId) => {
    let updatedGoals: ClientGoal[] = [];
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id !== clientId) return c;
        updatedGoals = c.goals.filter((g) => g.id !== goalId);
        return {
          ...c,
          goals: updatedGoals,
          updatedAt: new Date().toISOString()
        };
      })
    }));
    get().addAuditLog('DELETE', 'ClientGoal', goalId, `Removed goal from participant record`);

    updateClientDoc(clientId, { goals: updatedGoals }).catch((err) => {
      get().queueOfflineDelta('UPDATE_GOALS', 'Client', clientId, { goals: updatedGoals });
    });
  },

  linkCaseNoteToGoal: (clientId, goalId, noteId) => {
    let updatedGoals: ClientGoal[] = [];
    let updatedNoteGoals: string[] = [];
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id !== clientId) return c;
        updatedGoals = c.goals.map((g) => {
          if (g.id !== goalId) return g;
          const existingLinks = g.linkedNoteIds || [];
          if (existingLinks.includes(noteId)) return g;
          return {
            ...g,
            linkedNoteIds: [...existingLinks, noteId]
          };
        });
        return {
          ...c,
          goals: updatedGoals,
          updatedAt: new Date().toISOString()
        };
      }),
      caseNotes: state.caseNotes.map((n) => {
        if (n.id !== noteId) return n;
        const linkedGoals = n.linkedGoalIds || [];
        if (linkedGoals.includes(goalId)) {
          updatedNoteGoals = linkedGoals;
          return n;
        }
        updatedNoteGoals = [...linkedGoals, goalId];
        return {
          ...n,
          linkedGoalIds: updatedNoteGoals,
          updatedAt: new Date().toISOString()
        };
      })
    }));
    get().addAuditLog('LINK_NOTE_GOAL', 'ClientGoal', goalId, `Linked case note ${noteId} to goal ${goalId}`);

    if (updatedGoals.length > 0) {
      updateClientDoc(clientId, { goals: updatedGoals }).catch((err) => {
        console.warn('Failed to persist goal link to client doc:', err);
      });
    }
    if (updatedNoteGoals.length > 0) {
      updateCaseNoteDoc(noteId, { linkedGoalIds: updatedNoteGoals }).catch((err) => {
        console.warn('Failed to persist goal link to caseNote doc:', err);
      });
    }
  },

  addCaseNote: (noteData) => {
    const newNote: CaseNote = {
      id: (noteData as CaseNote).id || `note-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...noteData,
    } as CaseNote;

    set((state) => ({ caseNotes: [newNote, ...state.caseNotes] }));
    get().addAuditLog('CREATE', 'CaseNote', newNote.id, `Logged ${newNote.format} case note for ${newNote.clientName}`);

    createCaseNoteDoc(newNote).catch((err) => {
      console.warn('Firestore write failed for addCaseNote, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'CaseNote', newNote.id, newNote);
    });
  },

  updateCaseNote: (id, updates) => {
    const updatedAt = new Date().toISOString();
    set((state) => ({
      caseNotes: state.caseNotes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt } : n))
    }));
    get().addAuditLog('UPDATE', 'CaseNote', id, `Updated clinical case note`);

    updateCaseNoteDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateCaseNote, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'CaseNote', id, updates);
    });
  },

  deleteCaseNote: (id) => {
    set((state) => ({
      caseNotes: state.caseNotes.filter((n) => n.id !== id)
    }));
    get().addAuditLog('DELETE', 'CaseNote', id, `Deleted clinical case note`);

    deleteCaseNoteDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteCaseNote, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'CaseNote', id, { id });
    });
  },

  addRestrictivePractice: (practiceData) => {
    const newPractice: RestrictivePractice = {
      id: (practiceData as RestrictivePractice).id || `rp-${Date.now().toString().slice(-4)}`,
      ...practiceData
    } as RestrictivePractice;

    set((state) => ({
      restrictivePractices: [newPractice, ...state.restrictivePractices]
    }));
    get().addAuditLog('CREATE', 'RestrictivePractice', newPractice.id, `Lodged ${newPractice.practiceType} restriction for ${newPractice.clientName}`);

    createRestrictivePracticeDoc(newPractice).catch((err) => {
      console.warn('Firestore write failed for addRestrictivePractice, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'RestrictivePractice', newPractice.id, newPractice);
    });
  },

  updateRestrictivePractice: (id, updates) => {
    set((state) => ({
      restrictivePractices: state.restrictivePractices.map((rp) => (rp.id === id ? { ...rp, ...updates } : rp))
    }));
    get().addAuditLog('UPDATE', 'RestrictivePractice', id, `Updated restrictive practice governance record`);

    updateRestrictivePracticeDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateRestrictivePractice, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'RestrictivePractice', id, updates);
    });
  },

  deleteRestrictivePractice: (id) => {
    set((state) => ({
      restrictivePractices: state.restrictivePractices.filter((rp) => rp.id !== id)
    }));
    get().addAuditLog('DELETE', 'RestrictivePractice', id, `Removed restrictive practice record`);

    deleteRestrictivePracticeDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteRestrictivePractice, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'RestrictivePractice', id, { id });
    });
  },

  addIncident: (incidentData) => {
    const newIncident: Incident = {
      id: (incidentData as Incident).id || `inc-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      ...incidentData
    } as Incident;

    set((state) => ({ incidents: [newIncident, ...state.incidents] }));
    get().addAuditLog('CREATE', 'Incident', newIncident.id, `Reported ${newIncident.severity} incident for ${newIncident.clientName}`);

    createIncidentDoc(newIncident).catch((err) => {
      console.warn('Firestore write failed for addIncident, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'Incident', newIncident.id, newIncident);
    });

    const isHighOrCritical =
      newIncident.severity === 'High' ||
      newIncident.severity === 'Critical / Reportable' ||
      newIncident.severity.toLowerCase().includes('high') ||
      newIncident.severity.toLowerCase().includes('critical') ||
      newIncident.isNdisReportable;

    if (isHighOrCritical) {
      const isCritical = newIncident.severity.includes('Critical') || newIncident.isNdisReportable;
      get().addNotification({
        title: `🚨 ${isCritical ? 'CRITICAL / NDIS REPORTABLE' : 'HIGH SEVERITY'} INCIDENT: ${newIncident.clientName}`,
        message: `${newIncident.severity} incident recorded for participant ${newIncident.clientName} (Reported by ${newIncident.reportedBy || 'Practitioner'}). Action taken: "${newIncident.immediateActionTaken.slice(0, 100)}...". ${
          isCritical
            ? 'Mandatory 24-hour statutory lodgement to NDIS Quality and Safeguards Commission required.'
            : 'Requires immediate clinical supervisor review and follow-up.'
        }`,
        type: 'incident',
        severity: 'high',
        linkTab: 'incidents'
      });

      get().addAuditLog(
        'COMMAND_CENTER_AUTOMATED_ESCALATION',
        'Incident',
        newIncident.id,
        `Automated Workflow: Dispatched High/Critical incident notification to Command Center for participant ${newIncident.clientName}`
      );

      // Automated multi-channel alert dispatch (Email & SMS to Practice Director)
      const matchingClient = get().clients.find((c) => c.id === newIncident.clientId);
      dispatchTrigger('CRITICAL_INCIDENT', {
        incident: newIncident,
        client: matchingClient
      }).catch((err) => {
        console.warn('Automated incident notification trigger dispatch warning:', err);
      });
    }
  },

  updateIncident: (id, updates) => {
    set((state) => ({
      incidents: state.incidents.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc))
    }));
    get().addAuditLog('UPDATE', 'Incident', id, `Updated incident escalation status`);

    updateIncidentDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateIncident, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Incident', id, updates);
    });
  },

  updateIncidentStatus: (id, status) => {
    set((state) => ({
      incidents: state.incidents.map((inc) => (inc.id === id ? { ...inc, status } : inc))
    }));
    get().addAuditLog('UPDATE', 'Incident', id, `Updated incident status to ${status}`);

    updateIncidentDoc(id, { status }).catch((err) => {
      console.warn('Firestore write failed for updateIncidentStatus, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Incident', id, { status });
    });
  },

  deleteIncident: (id) => {
    set((state) => ({
      incidents: state.incidents.filter((inc) => inc.id !== id)
    }));
    get().addAuditLog('DELETE', 'Incident', id, `Archived incident record`);

    deleteIncidentDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteIncident, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'Incident', id, { id });
    });
  },

  addLead: (leadData) => {
    const newLead: Lead = {
      id: (leadData as Lead).id || `lead-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...leadData
    } as Lead;

    set((state) => ({ leads: [newLead, ...state.leads] }));
    get().addAuditLog('CREATE', 'Lead', newLead.id, `Created CRM intake lead for ${newLead.prospectName}`);

    createCRMLeadDoc(newLead).catch((err) => {
      console.warn('Firestore write failed for addLead, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'Lead', newLead.id, newLead);
    });
  },

  updateLead: (id, updates) => {
    const updatedAt = new Date().toISOString();
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates, updatedAt } : l))
    }));
    get().addAuditLog('UPDATE', 'Lead', id, `Updated CRM intake pipeline stage`);

    updateCRMLeadDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateLead, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Lead', id, updates);
    });
  },

  updateLeadStage: (id, stage) => {
    const updatedAt = new Date().toISOString();
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, stage, updatedAt } : l))
    }));
    get().addAuditLog('UPDATE', 'Lead', id, `Advanced CRM lead stage to ${stage}`);

    updateCRMLeadDoc(id, { stage, updatedAt }).catch((err) => {
      console.warn('Firestore write failed for updateLeadStage, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Lead', id, { stage });
    });
  },

  deleteLead: (id) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id)
    }));
    get().addAuditLog('DELETE', 'Lead', id, `Removed CRM lead`);

    deleteCRMLeadDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteLead, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'Lead', id, { id });
    });
  },

  addCRMTask: (taskData) => {
    const id = (taskData as CRMTask).id || `task-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const newTask: CRMTask = Object.assign(
      {
        status: 'Pending' as const,
        priority: 'Medium' as const,
        category: 'General' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignedTo: 'Marcus Vance',
        createdAt: now,
        updatedAt: now
      },
      taskData,
      { id }
    );

    set((state) => ({ crmTasks: [newTask, ...state.crmTasks] }));
    get().addAuditLog('CREATE', 'CRMTask', newTask.id, `Created CRM action task: "${newTask.title}"`);

    createCRMTaskDoc(newTask).catch((err) => {
      console.warn('Firestore write failed for addCRMTask, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'CRMTask', newTask.id, newTask);
    });
  },

  updateCRMTask: (id, updates) => {
    const updatedAt = new Date().toISOString();
    const fullUpdates = {
      ...updates,
      completedAt: updates.status === 'Completed' ? new Date().toISOString() : undefined,
      updatedAt
    };
    set((state) => ({
      crmTasks: state.crmTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              completedAt: updates.status === 'Completed' ? new Date().toISOString() : t.completedAt,
              updatedAt
            }
          : t
      )
    }));
    get().addAuditLog('UPDATE', 'CRMTask', id, `Updated CRM task`);

    updateCRMTaskDoc(id, fullUpdates).catch((err) => {
      console.warn('Firestore write failed for updateCRMTask, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'CRMTask', id, updates);
    });
  },

  deleteCRMTask: (id) => {
    set((state) => ({
      crmTasks: state.crmTasks.filter((t) => t.id !== id)
    }));
    get().addAuditLog('DELETE', 'CRMTask', id, `Deleted CRM task`);

    deleteCRMTaskDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteCRMTask, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'CRMTask', id, { id });
    });
  },

  toggleCRMTaskStatus: (id) => {
    const target = get().crmTasks.find((t) => t.id === id);
    if (!target) return;
    const nextStatus: TaskStatus = target.status === 'Completed' ? 'Pending' : 'Completed';
    get().updateCRMTask(id, { status: nextStatus });
  },

  syncKeepNoteToCRMTasks: (note, options) => {
    const createdTaskIds: string[] = [];
    const targetCategory: NoteCategory = options?.defaultCategory ||
      (note.labels?.some((l: string) => /clinical|bsp|sensory/i.test(l)) ? 'Clinical'
      : note.labels?.some((l: string) => /financial|budget|claim|invoice|pricing/i.test(l)) ? 'Financial'
      : note.labels?.some((l: string) => /compliance|audit|safeguard|commission|incident/i.test(l)) ? 'Compliance'
      : note.labels?.some((l: string) => /hr|staff|worker|roster/i.test(l)) ? 'HR'
      : note.labels?.some((l: string) => /intake|lead|referral/i.test(l)) ? 'Intake'
      : 'General');

    const defaultDueDate = options?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultPriority: TaskPriority = options?.priority ||
      (note.labels?.some((l: string) => /urgent|critical|alert/i.test(l)) ? 'Critical' : 'High');
    const assignedPractitioner = options?.assignedTo || 'Marcus Vance';

    if (note.checklist && note.checklist.length > 0) {
      const activeItems = note.checklist.filter((item: any) => !item.completed);
      const itemsToSync = activeItems.length > 0 ? activeItems : note.checklist;

      itemsToSync.forEach((item: any, idx: number) => {
        const taskId = `task-keep-${Date.now().toString().slice(-4)}-${idx + 1}`;
        const task: CRMTask = {
          id: taskId,
          title: item.text,
          description: `Action item extracted from Google Keep Note: "${note.title}". ${note.text ? `\nContext: ${note.text}` : ''}`,
          category: targetCategory,
          priority: defaultPriority,
          status: item.completed ? 'Completed' : 'Pending',
          dueDate: defaultDueDate,
          assignedTo: assignedPractitioner,
          sourceNoteId: note.id,
          sourceNoteTitle: note.title,
          clientId: note.clientId,
          clientName: note.clientName,
          isSyncedFromKeep: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        get().addCRMTask(task);
        createdTaskIds.push(taskId);
      });
    } else {
      const taskId = `task-keep-${Date.now().toString().slice(-4)}`;
      const task: CRMTask = {
        id: taskId,
        title: note.title || 'Action Item from Keep',
        description: note.text || 'Review Keep note details.',
        category: targetCategory,
        priority: defaultPriority,
        status: 'Pending',
        dueDate: defaultDueDate,
        assignedTo: assignedPractitioner,
        sourceNoteId: note.id,
        sourceNoteTitle: note.title,
        clientId: note.clientId,
        clientName: note.clientName,
        isSyncedFromKeep: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      get().addCRMTask(task);
      createdTaskIds.push(taskId);
    }

    get().addNotification({
      title: 'Action Items Synced to CRM',
      message: `Pushed ${createdTaskIds.length} NDIS action items from note "${note.title}" into CRM Task Management.`,
      type: 'clinical',
      severity: 'low',
      linkTab: 'crm'
    });

    get().addAuditLog(
      'SYNC_KEEP_TO_CRM',
      'GoogleKeepModule',
      note.id,
      `Synchronized ${createdTaskIds.length} prioritized action tasks to CRM pipeline`
    );

    return { count: createdTaskIds.length, taskIds: createdTaskIds };
  },

  addPractitioner: (practitioner) => {
    set((state) => ({ practitioners: [practitioner, ...state.practitioners] }));
    get().addAuditLog('CREATE', 'Practitioner', practitioner.id, `Added practitioner ${practitioner.name} to HR roster`);

    createPractitionerDoc(practitioner).catch((err) => {
      console.warn('Firestore write failed for addPractitioner, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'Practitioner', practitioner.id, practitioner);
    });
  },

  updatePractitioner: (id, updates) => {
    set((state) => ({
      practitioners: state.practitioners.map((p) => (p.id === id ? { ...p, ...updates } : p))
    }));
    get().addAuditLog('UPDATE', 'Practitioner', id, `Updated practitioner credentials`);

    updatePractitionerDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updatePractitioner, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'Practitioner', id, updates);
    });
  },

  deletePractitioner: (id) => {
    set((state) => ({
      practitioners: state.practitioners.filter((p) => p.id !== id)
    }));
    get().addAuditLog('DELETE', 'Practitioner', id, `Removed practitioner from HR roster`);

    deletePractitionerDoc(id).catch((err) => {
      console.warn('Firestore write failed for deletePractitioner, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'Practitioner', id, { id });
    });
  },

  addABCLog: (logData) => {
    const newLog: ABCLog = {
      id: (logData as ABCLog).id || `abc-${Date.now().toString().slice(-4)}`,
      ...logData
    } as ABCLog;

    set((state) => ({ abcLogs: [newLog, ...state.abcLogs] }));
    get().addAuditLog('CREATE', 'ABCLog', newLog.id, `Logged ABC behavior event for ${newLog.clientName}`);

    createABCLogDoc(newLog).catch((err) => {
      console.warn('Firestore write failed for addABCLog, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'ABCLog', newLog.id, newLog);
    });
  },

  updateAbcLog: (id, updates) => {
    set((state) => ({
      abcLogs: state.abcLogs.map((log) => (log.id === id ? { ...log, ...updates } : log))
    }));
    get().addAuditLog('UPDATE', 'ABCLog', id, `Updated ABC behavior observation log`);

    updateABCLogDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateAbcLog, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'ABCLog', id, updates);
    });
  },

  deleteABCLog: (id) => {
    set((state) => ({
      abcLogs: state.abcLogs.filter((log) => log.id !== id)
    }));
    get().addAuditLog('DELETE', 'ABCLog', id, `Deleted ABC behavior log`);

    deleteABCLogDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteABCLog, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'ABCLog', id, { id });
    });
  },

  updateBSP: (updates) => {
    const lastUpdated = new Date().toISOString();
    const currentBspId = get().bsp?.id || 'bsp-901';
    const updatedBsp = { ...get().bsp, ...updates, lastUpdated };
    set((state) => ({
      bsp: updatedBsp,
      bspPlans: state.bspPlans.map((p) => (p.id === updatedBsp.id ? updatedBsp : p)),
      bspDocuments: state.bspDocuments.map((d) => (d.id === updatedBsp.id ? updatedBsp : d))
    }));
    get().addAuditLog('UPDATE', 'BSP', currentBspId, `Updated Behaviour Support Plan`);

    updateBSPDocumentDoc(currentBspId, updates).catch((err) => {
      console.warn('Firestore write failed for updateBSP, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'BSPDocument', currentBspId, updates);
    });
  },

  addBSPPlan: (bspData) => {
    const bsp: BSPDocument = {
      id: (bspData as BSPDocument).id || `bsp-${Date.now().toString().slice(-4)}`,
      lastUpdated: (bspData as BSPDocument).lastUpdated || new Date().toISOString(),
      ...bspData
    } as BSPDocument;
    set((state) => ({
      bspPlans: [bsp, ...state.bspPlans],
      bspDocuments: [bsp, ...(state.bspDocuments || [])],
      bsp
    }));
    get().addAuditLog('CREATE', 'BSP', bsp.id, `Registered Behaviour Support Plan v${bsp.version}`);

    createBSPDocumentDoc(bsp).catch((err) => {
      console.warn('Firestore write failed for addBSPPlan, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'BSPDocument', bsp.id, bsp);
    });
  },

  addBSPDocument: (bspData) => {
    get().addBSPPlan(bspData);
  },

  updateBspDocument: (id, updates) => {
    const lastUpdated = new Date().toISOString();
    set((state) => ({
      bspDocuments: state.bspDocuments.map((d) => (d.id === id ? { ...d, ...updates, lastUpdated } : d)),
      bspPlans: state.bspPlans.map((p) => (p.id === id ? { ...p, ...updates, lastUpdated } : p)),
      bsp: state.bsp?.id === id ? { ...state.bsp, ...updates, lastUpdated } : state.bsp
    }));
    get().addAuditLog('UPDATE', 'BSPDocument', id, `Updated Behaviour Support Plan`);

    updateBSPDocumentDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateBspDocument, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'BSPDocument', id, updates);
    });
  },

  updateBSPDocument: (id, updates) => {
    get().updateBspDocument(id, updates);
  },

  deleteBSPDocument: (id) => {
    set((state) => ({
      bspDocuments: state.bspDocuments.filter((d) => d.id !== id),
      bspPlans: state.bspPlans.filter((p) => p.id !== id)
    }));
    get().addAuditLog('DELETE', 'BSPDocument', id, `Removed Behaviour Support Plan`);

    deleteBSPDocumentDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteBSPDocument, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'BSPDocument', id, { id });
    });
  },

  addBillingClaim: (claimData) => {
    const invoiceNum = (claimData as BillingClaim).invoiceNumber || `INV-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClaim: BillingClaim = Object.assign(
      {
        ndisNumber: '430000000',
        ndisSupportItem: (claimData as any).supportItemName || (claimData as any).supportItemCode || '07_002_0115_8_3 - Specialist Behavioural Intervention',
        hours: (claimData as any).hours ?? (claimData as any).hoursWorked ?? (claimData as any).quantity ?? 1
      },
      claimData,
      {
        id: (claimData as BillingClaim).id || `claim-${Date.now().toString().slice(-4)}`,
        invoiceNumber: invoiceNum
      }
    ) as BillingClaim;

    set((state) => ({
      claims: [newClaim, ...state.claims],
      billingClaims: [newClaim, ...state.billingClaims]
    }));
    get().addAuditLog('CREATE', 'BillingClaim', newClaim.id, `Generated NDIS billable claim ${newClaim.invoiceNumber} for ${newClaim.clientName}`);

    createBillingClaimDoc(newClaim).catch((err) => {
      console.warn('Firestore write failed for addBillingClaim, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'BillingClaim', newClaim.id, newClaim);
    });
  },

  updateBillingClaim: (id, updates) => {
    set((state) => {
      const updatedClaims = state.billingClaims.map((c) => (c.id === id ? { ...c, ...updates } : c));
      return {
        billingClaims: updatedClaims,
        claims: updatedClaims
      };
    });
    get().addAuditLog('UPDATE', 'BillingClaim', id, `Updated billing claim`);

    updateBillingClaimDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateBillingClaim, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'BillingClaim', id, updates);
    });
  },

  updateBillingStatus: (id, status) => {
    get().updateBillingClaim(id, { status });
  },

  deleteBillingClaim: (id) => {
    set((state) => ({
      billingClaims: state.billingClaims.filter((c) => c.id !== id),
      claims: state.claims.filter((c) => c.id !== id)
    }));
    get().addAuditLog('DELETE', 'BillingClaim', id, `Voided NDIS billing claim`);

    deleteBillingClaimDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteBillingClaim, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'BillingClaim', id, { id });
    });
  },

  reconcileClaim: (id, status, errorNote) => {
    const reconciliationError = errorNote || (status === 'Reconciled' ? undefined : undefined);
    get().updateBillingClaim(id, {
      reconciliationStatus: status,
      ...(reconciliationError !== undefined ? { reconciliationError } : {})
    });

    const claim = get().billingClaims.find((c) => c.id === id);
    if (claim) {
      get().addAuditLog(
        'RECONCILE_CLAIM',
        'BillingClaim',
        id,
        `Invoice ${claim.invoiceNumber} reconciliation marked as ${status}${errorNote ? `: ${errorNote}` : ''}`
      );

      if (status === 'Failed' || status === 'SLA_Breach_Risk') {
        get().addNotification({
          title: `NDIS Claim Reconciliation Alert: ${claim.invoiceNumber}`,
          message: `Claim for ${claim.clientName} (${claim.supportItemCode}) status is ${status}. ${errorNote || ''}`,
          type: 'billing',
          severity: status === 'Failed' ? 'high' : 'medium',
          linkTab: 'billing'
        });
      }
    }
  },

  autoReconcileAllClaims: () => {
    const claims = get().billingClaims;
    let failedCount = 0;
    let atRiskCount = 0;
    let reconciledCount = 0;

    const updated = claims.map((c) => {
      if (c.unitRate > 214.41) {
        failedCount++;
        return {
          ...c,
          reconciliationStatus: 'Failed' as const,
          reconciliationError: `Unit rate $${c.unitRate.toFixed(2)} exceeds standard NDIS price guide cap of $214.41/hr`
        };
      }
      if (c.status === 'Rejected') {
        failedCount++;
        return {
          ...c,
          reconciliationStatus: 'Failed' as const,
          reconciliationError: c.reconciliationError || 'PACE Provider Portal rejected invoice transmission'
        };
      }
      if (c.status === 'Pending') {
        atRiskCount++;
        return {
          ...c,
          reconciliationStatus: 'SLA_Breach_Risk' as const,
          reconciliationError: 'PACE Submission pending > 5 business days; nearing 7-day payment SLA window'
        };
      }
      reconciledCount++;
      return {
        ...c,
        reconciliationStatus: 'Reconciled' as const,
        reconciliationError: undefined
      };
    });

    set({ billingClaims: updated, claims: updated });

    get().addAuditLog(
      'BATCH_RECONCILIATION_RUN',
      'BillingReconciliationEngine',
      `batch-${Date.now()}`,
      `Auto-reconciled ${claims.length} claims. Results: ${reconciledCount} Reconciled, ${failedCount} Failed, ${atRiskCount} SLA Breach Risks.`
    );

    if (failedCount > 0 || atRiskCount > 0) {
      get().addNotification({
        title: 'NDIS Billing SLA & Reconciliation Warning',
        message: `Automated engine detected ${failedCount} failed line-item reconciliations and ${atRiskCount} claims nearing SLA breach window.`,
        type: 'billing',
        severity: failedCount > 0 ? 'high' : 'medium',
        linkTab: 'billing'
      });
    }
  },

  addScheduledShift: (shiftData) => {
    const newShift: ScheduledShift = {
      id: (shiftData as ScheduledShift).id || `shift-${Date.now().toString().slice(-4)}`,
      ...shiftData
    } as ScheduledShift;

    set((state) => ({ scheduledShifts: [newShift, ...state.scheduledShifts] }));
    get().addAuditLog('CREATE', 'ScheduledShift', newShift.id, `Scheduled shift for ${newShift.clientName}`);

    createScheduledShiftDoc(newShift).catch((err) => {
      console.warn('Firestore write failed for addScheduledShift, queueing offline:', err);
      get().queueOfflineDelta('CREATE', 'ScheduledShift', newShift.id, newShift);
    });
  },

  updateScheduledShift: (id, updates) => {
    set((state) => ({
      scheduledShifts: state.scheduledShifts.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
    get().addAuditLog('UPDATE', 'ScheduledShift', id, `Updated scheduled shift`);

    updateScheduledShiftDoc(id, updates).catch((err) => {
      console.warn('Firestore write failed for updateScheduledShift, queueing offline:', err);
      get().queueOfflineDelta('UPDATE', 'ScheduledShift', id, updates);
    });
  },

  deleteScheduledShift: (id) => {
    set((state) => ({
      scheduledShifts: state.scheduledShifts.filter((s) => s.id !== id)
    }));
    get().addAuditLog('DELETE', 'ScheduledShift', id, `Removed scheduled shift`);

    deleteScheduledShiftDoc(id).catch((err) => {
      console.warn('Firestore write failed for deleteScheduledShift, queueing offline:', err);
      get().queueOfflineDelta('DELETE', 'ScheduledShift', id, { id });
    });
  },

  addAuditLog: (action, entity, entityId, details) => {
    const user = get().currentUser;
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId: user?.id || 'sys-user',
      actorName: user?.name || 'Authorized Practitioner',
      actorRole: user?.role || 'PRACTITIONER',
      action,
      entity,
      entityId,
      details,
      ipAddress: '127.0.0.1'
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));

    createAuditLogDoc(newLog).catch(() => {
      // Audit log write failure in firestore is non-blocking
    });
  },

  addNotification: (notifData) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notifData
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    }));
  },

  markNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  clearAllMockData: (keepCurrentUser = true) => {
    set({
      isUsingMockData: false,
      clients: [],
      caseNotes: [],
      restrictivePractices: [],
      incidents: [],
      leads: [],
      crmTasks: [],
      abcLogs: [],
      bspPlans: [],
      bspDocuments: [],
      claims: [],
      billingClaims: [],
      scheduledShifts: [],
      selectedClientId: null
    });
    get().addAuditLog(
      'WIPE_DEMO_DATABASE',
      'DatabaseEngine',
      'db-root',
      'Cleared all mock participants, notes, and records to initialize production database'
    );
  },

  loadDemoData: () => {
    set({
      isUsingMockData: true,
      currentUser: INITIAL_USERS[0],
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      caseNotes: INITIAL_CASE_NOTES,
      restrictivePractices: INITIAL_RESTRICTIVE_PRACTICES,
      incidents: INITIAL_INCIDENTS,
      leads: INITIAL_LEADS,
      crmTasks: INITIAL_CRM_TASKS,
      practitioners: INITIAL_PRACTITIONERS,
      abcLogs: INITIAL_ABC_LOGS,
      bsp: INITIAL_BSP,
      bspPlans: [INITIAL_BSP],
      bspDocuments: [INITIAL_BSP],
      claims: INITIAL_CLAIMS,
      billingClaims: INITIAL_CLAIMS,
      supportItems: OFFICIAL_2026_NDIS_PRICE_GUIDE,
      auditLogs: INITIAL_AUDIT_LOGS,
      notifications: INITIAL_NOTIFICATIONS,
      scheduledShifts: []
    });
    get().addAuditLog('RESTORE_DEMO_DATA', 'DatabaseEngine', 'db-root', 'Loaded sample NDIS demo database');
  },

  importClientsFromCSV: (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return 0;

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
      const newClients: Client[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length === 0 || !row[0]) continue;

        const name = row[headers.indexOf('name')] || row[0] || `Participant ${i}`;
        const ndisNumber = row[headers.indexOf('ndisnumber')] || row[headers.indexOf('ndis number')] || row[1] || `43${Math.floor(1000000 + Math.random() * 9000000)}`;
        const dob = row[headers.indexOf('dateofbirth')] || row[headers.indexOf('dob')] || '2000-01-01';
        const disability = row[headers.indexOf('primarydisability')] || row[headers.indexOf('disability')] || 'NDIS Support';
        const budget = Number(row[headers.indexOf('totalbudget')] || row[headers.indexOf('budget')]) || 45000;
        const planType = (row[headers.indexOf('planmanagementtype')] || row[headers.indexOf('management')] || 'Plan-Managed') as any;
        const risk = (row[headers.indexOf('risklevel')] || row[headers.indexOf('risk')] || 'Medium') as any;

        const client: Client = {
          id: `cli-imp-${Date.now()}-${i}`,
          name,
          ndisNumber,
          dateOfBirth: dob,
          primaryDisability: disability,
          status: 'Active',
          totalBudget: budget,
          allocatedBudget: Math.round(budget * 0.8),
          spentBudget: 0,
          planStartDate: new Date().toISOString().split('T')[0],
          planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          planManagementType: planType,
          riskLevel: risk,
          goals: [
            {
              id: `g-imp-${i}-1`,
              title: `Primary NDIS Capacity Building Goal for ${name}`,
              category: 'Capacity Building',
              targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              progressPercent: 20,
              status: 'In Progress',
              gasScore: 0
            }
          ],
          primaryPractitionerId: get().currentUser.practitionerId || 'prac-201',
          primaryPractitionerName: get().currentUser.name || 'Practitioner',
          emergencyContact: {
            name: row[headers.indexOf('contactname')] || 'Emergency Contact',
            relationship: 'Nominee / Contact',
            phone: row[headers.indexOf('phone')] || '0400 000 000'
          },
          restrictivePracticesActive: false,
          isCustomUserParticipant: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        newClients.push(client);
        createClientDoc(client).catch((err) => {
          console.warn('Failed to persist imported client to Firestore:', err);
        });
      }

      set((state) => ({
        clients: [...newClients, ...state.clients],
        isUsingMockData: false
      }));

      get().addAuditLog(
        'IMPORT_CSV_PARTICIPANTS',
        'DatabaseEngine',
        `import-${Date.now()}`,
        `Successfully imported ${newClients.length} participants from CSV roster`
      );

      return newClients.length;
    } catch (e) {
      console.error('Error parsing participant CSV:', e);
      return 0;
    }
  },

  exportFullDatabaseJSON: () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: '2026.1-ndis-enterprise',
      app: 'Breakthrough OS - NDIS Business Operating System',
      clients: get().clients,
      caseNotes: get().caseNotes,
      restrictivePractices: get().restrictivePractices,
      incidents: get().incidents,
      billingClaims: get().billingClaims,
      crmLeads: get().leads,
      crmTasks: get().crmTasks,
      practitioners: get().practitioners
    };
    return JSON.stringify(data, null, 2);
  },

  exportClientsCSV: () => {
    const clients = get().clients;
    const headers = [
      'Name',
      'NDIS Number',
      'Date of Birth',
      'Primary Disability',
      'Status',
      'Plan Management Type',
      'Plan Start Date',
      'Plan End Date',
      'Total Budget',
      'Spent Budget',
      'Risk Level',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Primary Goal'
    ];

    const rows = clients.map((c) => [
      `"${c.name}"`,
      `"${c.ndisNumber}"`,
      `"${c.dateOfBirth}"`,
      `"${c.primaryDisability}"`,
      `"${c.status}"`,
      `"${c.planManagementType || 'Plan-Managed'}"`,
      `"${c.planStartDate}"`,
      `"${c.planEndDate}"`,
      c.totalBudget || 0,
      c.spentBudget || 0,
      `"${c.riskLevel}"`,
      `"${c.emergencyContact?.name || ''}"`,
      `"${c.emergencyContact?.phone || ''}"`,
      `"${c.goals?.[0]?.title || ''}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  generateParticipantTemplateCSV: () => {
    const headers = [
      'Name',
      'NDIS Number',
      'Date of Birth',
      'Primary Disability',
      'Total Budget',
      'Plan Management Type',
      'Risk Level',
      'Contact Name',
      'Phone',
      'Address',
      'Suburb',
      'State',
      'Postcode'
    ];
    const sampleRow = [
      '"Jordan Miller"',
      '"430891245"',
      '"2004-03-15"',
      '"Autism Spectrum Disorder (Level 3)"',
      '48500',
      '"Plan-Managed"',
      '"Medium"',
      '"Karen Miller"',
      '"0412 889 201"',
      '"12 Example Street"',
      '"Melbourne"',
      '"VIC"',
      '"3000"'
    ];
    return [headers.join(','), sampleRow.join(',')].join('\n');
  },

  resetToDefaultData: () => {
    get().loadDemoData();
  },

  loadFromFirestore: async () => {
    await get().syncWithFirestore();
  },

  syncWithFirestore: async () => {
    set({ syncStatus: 'syncing' });
    try {
      const [
        fetchedClients,
        fetchedCaseNotes,
        fetchedClaims,
        fetchedIncidents,
        fetchedRP,
        fetchedABC,
        fetchedBSP,
        fetchedLeads,
        fetchedTasks,
        fetchedPracs,
        fetchedSupportItems,
        fetchedAuditLogs,
        fetchedShifts,
        fetchedUsers
      ] = await Promise.all([
        fetchClients().catch(() => []),
        fetchCaseNotes().catch(() => []),
        fetchBillingClaims().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchRestrictivePractices().catch(() => []),
        fetchABCLogs().catch(() => []),
        fetchBSPDocuments().catch(() => []),
        fetchCRMLeads().catch(() => []),
        fetchCRMTasks().catch(() => []),
        fetchPractitioners().catch(() => []),
        fetchSupportItems().catch(() => []),
        fetchAuditLogs().catch(() => []),
        fetchScheduledShifts().catch(() => []),
        fetchUsers().catch(() => [])
      ]);

      const hasAnyData =
        fetchedClients.length > 0 ||
        fetchedCaseNotes.length > 0 ||
        fetchedClaims.length > 0 ||
        fetchedIncidents.length > 0 ||
        fetchedPracs.length > 0 ||
        fetchedLeads.length > 0;

      if (!hasAnyData) {
        console.info('Firestore is empty. Seeding initial standard dataset...');
        await seedInitialFirestoreDataIfEmpty({
          users: INITIAL_USERS,
          clients: INITIAL_CLIENTS,
          caseNotes: INITIAL_CASE_NOTES,
          billingClaims: INITIAL_CLAIMS,
          incidents: INITIAL_INCIDENTS,
          restrictivePractices: INITIAL_RESTRICTIVE_PRACTICES,
          abcLogs: INITIAL_ABC_LOGS,
          bspDocuments: [INITIAL_BSP],
          leads: INITIAL_LEADS,
          crmTasks: INITIAL_CRM_TASKS,
          practitioners: INITIAL_PRACTITIONERS,
          supportItems: OFFICIAL_2026_NDIS_PRICE_GUIDE,
          auditLogs: INITIAL_AUDIT_LOGS,
          notifications: INITIAL_NOTIFICATIONS
        });

        const [
          reClients,
          reNotes,
          reClaims,
          reIncidents,
          reRP,
          reABC,
          reBSP,
          reLeads,
          reTasks,
          rePracs,
          reItems,
          reAudits,
          reShifts,
          reUsers
        ] = await Promise.all([
          fetchClients().catch(() => INITIAL_CLIENTS),
          fetchCaseNotes().catch(() => INITIAL_CASE_NOTES),
          fetchBillingClaims().catch(() => INITIAL_CLAIMS),
          fetchIncidents().catch(() => INITIAL_INCIDENTS),
          fetchRestrictivePractices().catch(() => INITIAL_RESTRICTIVE_PRACTICES),
          fetchABCLogs().catch(() => INITIAL_ABC_LOGS),
          fetchBSPDocuments().catch(() => [INITIAL_BSP]),
          fetchCRMLeads().catch(() => INITIAL_LEADS),
          fetchCRMTasks().catch(() => INITIAL_CRM_TASKS),
          fetchPractitioners().catch(() => INITIAL_PRACTITIONERS),
          fetchSupportItems().catch(() => OFFICIAL_2026_NDIS_PRICE_GUIDE),
          fetchAuditLogs().catch(() => INITIAL_AUDIT_LOGS),
          fetchScheduledShifts().catch(() => []),
          fetchUsers().catch(() => INITIAL_USERS)
        ]);

        set({
          clients: reClients.length > 0 ? reClients : INITIAL_CLIENTS,
          caseNotes: reNotes.length > 0 ? reNotes : INITIAL_CASE_NOTES,
          billingClaims: reClaims.length > 0 ? reClaims : INITIAL_CLAIMS,
          claims: reClaims.length > 0 ? reClaims : INITIAL_CLAIMS,
          incidents: reIncidents.length > 0 ? reIncidents : INITIAL_INCIDENTS,
          restrictivePractices: reRP.length > 0 ? reRP : INITIAL_RESTRICTIVE_PRACTICES,
          abcLogs: reABC.length > 0 ? reABC : INITIAL_ABC_LOGS,
          bspDocuments: reBSP.length > 0 ? reBSP : [INITIAL_BSP],
          bspPlans: reBSP.length > 0 ? reBSP : [INITIAL_BSP],
          bsp: reBSP[0] || INITIAL_BSP,
          leads: reLeads.length > 0 ? reLeads : INITIAL_LEADS,
          crmTasks: reTasks.length > 0 ? reTasks : INITIAL_CRM_TASKS,
          practitioners: rePracs.length > 0 ? rePracs : INITIAL_PRACTITIONERS,
          supportItems: reItems.length > 0 ? reItems : OFFICIAL_2026_NDIS_PRICE_GUIDE,
          auditLogs: reAudits.length > 0 ? reAudits : INITIAL_AUDIT_LOGS,
          scheduledShifts: reShifts,
          users: reUsers.length > 0 ? reUsers : INITIAL_USERS,
          isUsingMockData: false,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString()
        });
      } else {
        set({
          clients: fetchedClients.length > 0 ? fetchedClients : INITIAL_CLIENTS,
          caseNotes: fetchedCaseNotes.length > 0 ? fetchedCaseNotes : INITIAL_CASE_NOTES,
          billingClaims: fetchedClaims.length > 0 ? fetchedClaims : INITIAL_CLAIMS,
          claims: fetchedClaims.length > 0 ? fetchedClaims : INITIAL_CLAIMS,
          incidents: fetchedIncidents.length > 0 ? fetchedIncidents : INITIAL_INCIDENTS,
          restrictivePractices: fetchedRP.length > 0 ? fetchedRP : INITIAL_RESTRICTIVE_PRACTICES,
          abcLogs: fetchedABC.length > 0 ? fetchedABC : INITIAL_ABC_LOGS,
          bspDocuments: fetchedBSP.length > 0 ? fetchedBSP : [INITIAL_BSP],
          bspPlans: fetchedBSP.length > 0 ? fetchedBSP : [INITIAL_BSP],
          bsp: fetchedBSP[0] || INITIAL_BSP,
          leads: fetchedLeads.length > 0 ? fetchedLeads : INITIAL_LEADS,
          crmTasks: fetchedTasks.length > 0 ? fetchedTasks : INITIAL_CRM_TASKS,
          practitioners: fetchedPracs.length > 0 ? fetchedPracs : INITIAL_PRACTITIONERS,
          supportItems: fetchedSupportItems.length > 0 ? fetchedSupportItems : OFFICIAL_2026_NDIS_PRICE_GUIDE,
          auditLogs: fetchedAuditLogs.length > 0 ? fetchedAuditLogs : INITIAL_AUDIT_LOGS,
          scheduledShifts: fetchedShifts,
          users: fetchedUsers.length > 0 ? fetchedUsers : INITIAL_USERS,
          isUsingMockData: false,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to sync with Firestore, operating in cached mode:', error);
      set({ syncStatus: 'offline' });
    }
  },

  // ──────────────────────────────────────────────────────────
  // Phase 3 — Real-Time Firestore onSnapshot Listeners
  // Attaches persistent subscriptions so the Zustand store
  // updates instantly when any tab or device writes to Firestore.
  // ──────────────────────────────────────────────────────────
  startRealtimeListeners: () => {
    // Tear down any existing listeners first (idempotent)
    get().stopRealtimeListeners();
    _firestoreListenersCleanup = initFirestoreListeners(useManagementStore);
    set({ syncStatus: 'synced' });
  },

  stopRealtimeListeners: () => {
    if (_firestoreListenersCleanup) {
      try {
        _firestoreListenersCleanup();
      } catch (err) {
        console.warn('[Realtime] Error stopping Firestore listeners:', err);
      }
      _firestoreListenersCleanup = null;
    }
  },

  setEntities: (collection: string, data: any[]) => {
    const norm = (collection || '').toLowerCase().trim();
    switch (norm) {
      case 'clients':
        set({ clients: data });
        break;
      case 'casenotes':
      case 'case_notes':
      case 'notes':
        set({ caseNotes: data });
        break;
      case 'billingclaims':
      case 'billing_claims':
      case 'claims':
        set({ billingClaims: data, claims: data });
        break;
      case 'incidents':
        set({ incidents: data });
        break;
      case 'restrictivepractices':
      case 'restrictive_practices':
      case 'rp':
        set({ restrictivePractices: data });
        break;
      case 'abclogs':
      case 'abc_logs':
      case 'abc':
        set({ abcLogs: data });
        break;
      case 'bspdocuments':
      case 'bsp_documents':
      case 'bsp':
        set({ bspDocuments: data, bspPlans: data, ...(data && data.length > 0 ? { bsp: data[0] } : {}) });
        break;
      case 'crmleads':
      case 'crm_leads':
      case 'leads':
        set({ leads: data });
        break;
      case 'crmtasks':
      case 'crm_tasks':
      case 'tasks':
        set({ crmTasks: data });
        break;
      case 'practitioners':
        set({ practitioners: data });
        break;
      case 'supportitems':
      case 'support_items':
        set({ supportItems: data });
        break;
      case 'auditlogs':
      case 'audit_logs':
        set({ auditLogs: data });
        break;
      case 'scheduledshifts':
      case 'scheduled_shifts':
      case 'shifts':
        set({ scheduledShifts: data });
        break;
      case 'users':
        set({ users: data });
        break;
      case 'notifications':
        set({ notifications: data });
        break;
      default:
        set({ [collection]: data });
        break;
    }
  }
}));

