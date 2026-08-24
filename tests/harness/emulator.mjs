/**
 * Breakthrough OS Test Harness & In-Memory Emulation Suite
 * 
 * Provides faithful in-memory implementations of:
 * 1. Firestore Database (CRUD, Collections, Doc References, Queries, onSnapshot Listeners, Batch operations)
 * 2. Firestore Security Rules & Blueprint Schema Validator
 * 3. Firebase Authentication & Role Management (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR)
 * 4. Optimistic Zustand Store Manager with Offline Delta Queuing & Batch Sync
 * 5. Gemini AI Assistant & Deterministic Clinical Heuristic Engine
 * 6. Dashboard Metrics & Analytics Aggregators (Billing, Compliance, Caseload, Budget)
 */

import fs from 'node:fs';
import path from 'node:path';

// --- OFFICIAL NDIS 2026 PRICE GUIDE PRESETS ---
export const NDIS_2026_PRICE_GUIDE = [
  {
    code: '07_002_0115_8_3',
    name: 'Specialist Behavioural Intervention Support',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour'
  },
  {
    code: '07_004_0115_8_3',
    name: 'Individual Behaviour Support Plan Development & Training',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour'
  },
  {
    code: '15_056_0128_1_3',
    name: 'Assessment Recommendation Therapy Support - Allied Health',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour'
  },
  {
    code: '15_043_0128_1_3',
    name: 'Counselling / Allied Health Psychology Support',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour'
  },
  {
    code: '15_054_0128_1_3',
    name: 'Occupational Therapy - Functional Capacity Assessment & Intervention',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour'
  },
  {
    code: '15_052_0128_1_3',
    name: 'Speech Pathology Assessment & Clinical AAC Support',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour'
  },
  {
    code: '07_799_0115_8_3',
    name: 'Provider Travel - Behaviour Support Specialist (Non-Face-To-Face)',
    category: 'Capacity Building - Travel & Non-Face-To-Face',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour'
  }
];

// --- INITIAL SEED DATA ---
export const SEED_USERS = [
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
    activeCaseload: 14
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
    activeCaseload: 18
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
    activeCaseload: 0
  }
];

export const SEED_PRACTITIONERS = [
  {
    id: 'prac-201',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@breakthrough.org.au',
    phone: '0411 234 567',
    position: 'Senior Behaviour Support Practitioner',
    qualification: 'PhD Clinical Psychology, MAPS, NDIS Advanced PBS',
    ndisRegistrationNumber: 'PRAC-NDIS-08819',
    pbsRegistrationLevel: 'Advanced Practitioner',
    screeningStatus: 'Valid',
    screeningExpiryDate: '2028-09-30',
    policeCheckExpiryDate: '2027-11-15',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 38,
    cpdHoursRequired: 30,
    caseloadLimit: 20,
    activeCaseloadCount: 14,
    historicalSuccessRate: 94
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
    screeningStatus: 'Valid',
    screeningExpiryDate: '2027-05-12',
    policeCheckExpiryDate: '2026-10-20',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 26,
    cpdHoursRequired: 30,
    caseloadLimit: 22,
    activeCaseloadCount: 18,
    historicalSuccessRate: 91
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
    screeningStatus: 'Valid',
    screeningExpiryDate: '2028-01-14',
    policeCheckExpiryDate: '2027-06-30',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 31,
    cpdHoursRequired: 30,
    caseloadLimit: 18,
    activeCaseloadCount: 12,
    historicalSuccessRate: 96
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
    screeningStatus: 'Expiring Soon',
    screeningExpiryDate: '2026-09-02',
    policeCheckExpiryDate: '2026-08-30',
    ndisOrientationCompleted: true,
    cpdHoursThisYear: 18,
    cpdHoursRequired: 30,
    caseloadLimit: 15,
    activeCaseloadCount: 9,
    historicalSuccessRate: 88
  }
];

export const SEED_CLIENTS = [
  {
    id: 'cli-101',
    ndisNumber: '430891245',
    name: 'Jordan Miller',
    dateOfBirth: '2004-03-15',
    status: 'Active',
    primaryDisability: 'Autism Spectrum Disorder (Level 3)',
    goals: [
      {
        id: 'g-101',
        title: 'Master independent emotional regulation techniques during sensory overload',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 68,
        status: 'In Progress',
        gasScore: 1
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
    restrictivePracticesActive: true,
    emergencyContact: {
      name: 'Karen Miller',
      relationship: 'Mother & Primary Nominee',
      phone: '0412 889 201'
    },
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
    restrictivePracticesActive: false,
    emergencyContact: {
      name: 'David Reed',
      relationship: 'Brother / Support Nominee',
      phone: '0433 112 904'
    },
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
    restrictivePracticesActive: true,
    emergencyContact: {
      name: 'Claire O’Connor',
      relationship: 'Mother',
      phone: '0409 773 194'
    },
    createdAt: '2025-10-01T08:30:00Z',
    updatedAt: '2026-08-12T16:00:00Z'
  }
];

export const SEED_CASE_NOTES = [
  {
    id: 'note-501',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    practitionerId: 'prac-202',
    practitionerName: 'Marcus Vance',
    authorId: 'user-specialist',
    date: '2026-08-12',
    sessionDurationMinutes: 90,
    format: 'Standard',
    subjective: 'Participant arrived calm; mother reported two successful community outings this week with zero dysregulation events.',
    objective: 'Practitioner conducted a 45-minute structured functional activity evaluating the newly introduced visual schedule board.',
    assessment: 'Participant is demonstrating rapid acquisition of secondary communication pathways. Goal 1.1 progression is on track.',
    plan: 'Deliver 1-hour coaching session with primary support worker on Wednesday; introduce step 2 in sensory regulation binder.',
    linkedGoalIds: ['g-101'],
    status: 'Approved',
    flaggedForReview: false,
    createdAt: '2026-08-12T16:00:00Z',
    updatedAt: '2026-08-12T16:45:00Z'
  }
];

export const SEED_CLAIMS = [
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
    invoiceNumber: 'INV-2026-8801',
    reconciliationStatus: 'Reconciled'
  },
  {
    id: 'claim-802',
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    ndisNumber: '431092841',
    serviceDate: '2026-08-10',
    ndisSupportItem: 'Assessment Recommendation Therapy Support',
    supportItemCode: '15_056_0128_1_3',
    hours: 2.0,
    unitRate: 193.99,
    totalAmount: 387.98,
    status: 'Paid',
    invoiceNumber: 'INV-2026-8802',
    reconciliationStatus: 'Reconciled'
  },
  {
    id: 'claim-803',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    ndisNumber: '439901422',
    serviceDate: '2026-08-14',
    ndisSupportItem: 'Specialist Behavioural Intervention Support',
    supportItemCode: '07_002_0115_8_3',
    hours: 1.0,
    unitRate: 214.41,
    totalAmount: 214.41,
    status: 'Submitted PACE',
    invoiceNumber: 'INV-2026-8803',
    reconciliationStatus: 'Pending'
  }
];

export const SEED_INCIDENTS = [
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
    description: 'Verbal agitation and thrown plastic cup during sensory transition at day program.',
    immediateActionTaken: 'Practitioner guided participant to quiet sensory decompression corner.',
    reportedBy: 'Marcus Vance',
    createdAt: '2026-08-14T10:15:00Z'
  }
];

export const SEED_RESTRICTIVE_PRACTICES = [
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
    reductionPlanSummary: 'Graduated visual food choice cards and self-monitoring schedule.',
    monthlyReportStatus: 'Submitted',
    lastReportedDate: '2026-08-01'
  },
  {
    id: 'rp-302',
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    practiceType: 'Chemical',
    description: 'Low-dose Clonidine (0.05mg) as prescribed by paediatrician for acute autonomic arousal',
    status: 'Authorized',
    authorizationBody: 'NDIS Quality & Safeguards Commission State Authorizer',
    authorizationReference: 'NDIS-RP-2026-0441',
    startDate: '2026-03-15',
    expiryDate: '2026-09-14',
    reductionPlanSummary: 'Multi-sensory deep pressure protocol implemented 15 mins prior to transition.',
    monthlyReportStatus: 'Due',
    lastReportedDate: '2026-07-28'
  }
];

export const SEED_ABC_LOGS = [
  {
    id: 'abc-701',
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    timestamp: '2026-08-13T14:20:00Z',
    timeOfDay: '14:20',
    dayOfWeek: 'Thursday',
    antecedent: 'Transition from iPad video game to dinnertime meal prep in crowded kitchen',
    behavior: 'Vocal protest, dropped to floor, refused to move for 8 minutes',
    consequence: 'Worker provided visual timer giving 3-minute extension; participant stood up calmly',
    intensity: 3,
    durationMinutes: 8,
    location: 'Family Residence - Kitchen',
    perceivedFunction: 'Escape/Avoidance',
    recordedBy: 'Support Worker Dave T.'
  }
];

export const SEED_LEADS = [
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
  }
];

// --- IN-MEMORY FIRESTORE DATABASE EMULATOR ---
export class InMemoryFirestore {
  constructor() {
    this.collections = new Map();
    this.listeners = new Map(); // path -> Set of callbacks
    this.isOnline = true;
    this.initializeDefaultCollections();
  }

  initializeDefaultCollections() {
    this.setCollection('users', SEED_USERS);
    this.setCollection('practitioners', SEED_PRACTITIONERS);
    this.setCollection('clients', SEED_CLIENTS);
    this.setCollection('caseNotes', SEED_CASE_NOTES);
    this.setCollection('billingClaims', SEED_CLAIMS);
    this.setCollection('incidents', SEED_INCIDENTS);
    this.setCollection('restrictivePractices', SEED_RESTRICTIVE_PRACTICES);
    this.setCollection('abcLogs', SEED_ABC_LOGS);
    this.setCollection('leads', SEED_LEADS);
    this.setCollection('supportItems', NDIS_2026_PRICE_GUIDE);
    this.setCollection('auditLogs', []);
    this.setCollection('notifications', []);
    this.setCollection('system', [{ id: 'connection_test', status: 'ok', timestamp: new Date().toISOString() }]);
  }

  setCollection(name, items) {
    const colMap = new Map();
    for (const item of items) {
      colMap.set(item.id || item.code, JSON.parse(JSON.stringify(item)));
    }
    this.collections.set(name, colMap);
  }

  getCollectionMap(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name);
  }

  async getDoc(colName, docId, authContext = null) {
    this.assertNetwork();
    this.evaluateSecurityRule('get', colName, docId, null, authContext);
    const col = this.getCollectionMap(colName);
    const doc = col.get(docId);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  async listDocs(colName, authContext = null) {
    this.assertNetwork();
    this.evaluateSecurityRule('list', colName, null, null, authContext);
    const col = this.getCollectionMap(colName);
    return Array.from(col.values()).map(d => JSON.parse(JSON.stringify(d)));
  }

  async setDoc(colName, docId, data, authContext = null, options = { merge: false }) {
    this.assertNetwork();
    this.evaluateSecurityRule('write', colName, docId, data, authContext);
    const col = this.getCollectionMap(colName);
    const existing = col.get(docId);
    const updated = options.merge && existing
      ? { ...existing, ...data, updatedAt: new Date().toISOString() }
      : { id: docId, ...data, updatedAt: new Date().toISOString() };
    if (!updated.createdAt) {
      updated.createdAt = existing?.createdAt || new Date().toISOString();
    }
    col.set(docId, updated);
    this.notifyListeners(colName);
    return docId;
  }

  async addDoc(colName, data, authContext = null) {
    this.assertNetwork();
    const docId = data.id || `${colName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await this.setDoc(colName, docId, data, authContext);
    return docId;
  }

  async updateDoc(colName, docId, updates, authContext = null) {
    this.assertNetwork();
    const col = this.getCollectionMap(colName);
    const existing = col.get(docId);
    if (!existing) {
      throw new Error(`Document ${docId} not found in collection ${colName}`);
    }
    this.evaluateSecurityRule('update', colName, docId, updates, authContext, existing);
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    col.set(docId, merged);
    this.notifyListeners(colName);
  }

  async deleteDoc(colName, docId, authContext = null) {
    this.assertNetwork();
    const col = this.getCollectionMap(colName);
    const existing = col.get(docId);
    this.evaluateSecurityRule('delete', colName, docId, null, authContext, existing);
    col.delete(docId);
    this.notifyListeners(colName);
  }

  writeBatch(authContext = null) {
    const ops = [];
    return {
      set: (colName, docId, data, options = { merge: true }) => {
        if (ops.length >= 500) {
          throw new Error('INVALID_ARGUMENT: Maximum 500 operations allowed per batch in Firestore');
        }
        ops.push({ type: 'set', colName, docId, data, options });
      },
      delete: (colName, docId) => {
        if (ops.length >= 500) {
          throw new Error('INVALID_ARGUMENT: Maximum 500 operations allowed per batch in Firestore');
        }
        ops.push({ type: 'delete', colName, docId });
      },
      commit: async () => {
        this.assertNetwork();
        if (ops.length > 500) {
          throw new Error('INVALID_ARGUMENT: Maximum 500 operations allowed per batch in Firestore');
        }
        for (const op of ops) {
          if (op.type === 'set') {
            await this.setDoc(op.colName, op.docId, op.data, authContext, op.options);
          } else if (op.type === 'delete') {
            await this.deleteDoc(op.colName, op.docId, authContext);
          }
        }
      }
    };
  }

  async batchWriteDocuments(colName, documents, authContext = null) {
    if (!documents || documents.length === 0) return;
    const CHUNK_SIZE = 450;
    for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
      const chunk = documents.slice(i, i + CHUNK_SIZE);
      const batch = this.writeBatch(authContext);
      for (const item of chunk) {
        batch.set(colName, item.id || item.code, item, { merge: true });
      }
      await batch.commit();
    }
  }

  // onSnapshot Real-time Listener Support
  onSnapshot(colName, callback, errorCallback) {
    if (!this.listeners.has(colName)) {
      this.listeners.set(colName, new Set());
    }
    const listenersSet = this.listeners.get(colName);
    listenersSet.add(callback);

    // Initial snapshot invocation
    const currentData = Array.from(this.getCollectionMap(colName).values()).map(d => JSON.parse(JSON.stringify(d)));
    callback(currentData);

    // Return unsubscribe function
    return () => {
      listenersSet.delete(callback);
    };
  }

  notifyListeners(colName) {
    if (this.listeners.has(colName)) {
      const currentData = Array.from(this.getCollectionMap(colName).values()).map(d => JSON.parse(JSON.stringify(d)));
      for (const cb of this.listeners.get(colName)) {
        try {
          cb(currentData);
        } catch (err) {
          console.error(`Listener error on ${colName}:`, err);
        }
      }
    }
  }

  setOnlineStatus(online) {
    this.isOnline = online;
  }

  assertNetwork() {
    if (!this.isOnline) {
      throw new Error('the client is offline');
    }
  }

  // Security Rules & RBAC Evaluation Engine
  evaluateSecurityRule(operation, colName, docId, data, authContext, existingDoc = null) {
    // 1. System doc is public
    if (colName === 'system') return true;

    // 2. Default deny for unauthenticated requests
    if (!authContext || !authContext.uid) {
      throw new Error(`PERMISSION_DENIED: Unauthenticated request rejected on /${colName}/${docId || ''}`);
    }

    const { role, uid } = authContext;

    // 3. ID Validation
    if (docId && (docId.length > 128 || !/^[a-zA-Z0-9_\-]+$/.test(docId))) {
      throw new Error(`INVALID_ARGUMENT: Document ID "${docId}" violates format rules`);
    }

    // 4. Role-based Collection Constraints
    if (colName === 'users') {
      if (operation === 'delete') {
        throw new Error('PERMISSION_DENIED: User profiles cannot be deleted via client SDK');
      }
      if (operation === 'get' || operation === 'update' || operation === 'write') {
        if (docId !== uid && role !== 'ADMIN') {
          throw new Error(`PERMISSION_DENIED: Cannot access private user record /users/${docId}`);
        }
      }
    }

    if (operation === 'write' || operation === 'create' || operation === 'update' || operation === 'delete') {
      // VIEWER role is strictly read-only across all clinical and financial collections
      if (role === 'VIEWER' && colName !== 'system') {
        throw new Error(`PERMISSION_DENIED: User role VIEWER does not have permission to perform "${operation}" on /${colName}`);
      }
    }

    if (operation === 'delete') {
      // Destructive actions like deleting clients or deleting system data require ADMIN
      if (colName === 'clients' && role !== 'ADMIN') {
        throw new Error(`PERMISSION_DENIED: Deleting client /clients/${docId} requires ADMIN privileges; current role is ${role}`);
      }
      if (colName === 'caseNotes') {
        if (role !== 'ADMIN' && existingDoc && existingDoc.authorId !== uid) {
          throw new Error(`PERMISSION_DENIED: Only ADMIN or note author can delete case note`);
        }
      }
    }

    if (colName === 'caseNotes' && (operation === 'update')) {
      if (role !== 'ADMIN' && existingDoc && existingDoc.authorId && existingDoc.authorId !== uid) {
        throw new Error(`PERMISSION_DENIED: Non-author practitioner cannot update case note owned by ${existingDoc.authorId}`);
      }
    }

    // 5. Payload length and schema constraints
    if (data) {
      if (colName === 'clients' && data.name && data.name.length > 200) {
        throw new Error('INVALID_ARGUMENT: Client name exceeds 200 characters');
      }
      if (colName === 'caseNotes' && data.content && data.content.length > 15000) {
        throw new Error('INVALID_ARGUMENT: Case note content exceeds 15,000 characters');
      }
    }

    return true;
  }
}

// --- OPTIMISTIC ZUSTAND-COMPATIBLE STORE EMULATOR ---
export class ManagementStoreEmulator {
  constructor(firestore) {
    this.firestore = firestore;
    this.currentUser = SEED_USERS[0]; // Admin by default
    this.users = [...SEED_USERS];
    this.clients = [...SEED_CLIENTS];
    this.practitioners = [...SEED_PRACTITIONERS];
    this.caseNotes = [...SEED_CASE_NOTES];
    this.billingClaims = [...SEED_CLAIMS];
    this.incidents = [...SEED_INCIDENTS];
    this.restrictivePractices = [...SEED_RESTRICTIVE_PRACTICES];
    this.abcLogs = [...SEED_ABC_LOGS];
    this.leads = [...SEED_LEADS];
    this.supportItems = [...NDIS_2026_PRICE_GUIDE];
    this.auditLogs = [];
    this.notifications = [];
    this.offlineQueue = [];
    this.isOnline = true;
    this.syncStatus = 'synced';
    this.pendingChangesCount = 0;
    this.lastSyncTime = new Date().toISOString();
    this.activeTab = 'command-center';
  }

  getAuthContext() {
    return {
      uid: this.currentUser.id,
      email: this.currentUser.email,
      role: this.currentUser.role,
      name: this.currentUser.name
    };
  }

  switchUser(userId) {
    const found = this.users.find(u => u.id === userId);
    if (!found) throw new Error(`User ${userId} not found`);
    this.currentUser = found;
    this.addAuditLog('SWITCH_USER', 'UserProfile', found.id, `Switched session to ${found.name} (${found.role})`);
  }

  setUserRole(role) {
    this.currentUser = { ...this.currentUser, role };
    this.addAuditLog('UPDATE_ROLE', 'UserProfile', this.currentUser.id, `Role updated to ${role}`);
  }

  setOnlineStatus(online) {
    this.isOnline = online;
    this.firestore.setOnlineStatus(online);
    this.syncStatus = !online ? 'offline' : (this.offlineQueue.length > 0 ? 'pending' : 'synced');
    if (online && this.offlineQueue.length > 0) {
      this.triggerDeltaSync();
    }
  }

  queueOfflineDelta(action, entity, entityId, payload) {
    const delta = {
      id: `delta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      payload
    };
    this.offlineQueue.push(delta);
    this.pendingChangesCount = this.offlineQueue.length;
    this.syncStatus = this.isOnline ? 'pending' : 'offline';
  }

  async triggerDeltaSync() {
    if (this.offlineQueue.length === 0) {
      this.syncStatus = 'synced';
      this.pendingChangesCount = 0;
      this.lastSyncTime = new Date().toISOString();
      return;
    }

    this.syncStatus = 'syncing';
    const queueToProcess = [...this.offlineQueue];

    for (const delta of queueToProcess) {
      const colName = delta.entity === 'Client' ? 'clients'
        : delta.entity === 'CaseNote' ? 'caseNotes'
        : delta.entity === 'BillingClaim' ? 'billingClaims'
        : delta.entity === 'Incident' ? 'incidents'
        : delta.entity === 'ABCLog' ? 'abcLogs'
        : delta.entity.toLowerCase() + 's';

      if (delta.action === 'CREATE' || delta.action === 'UPDATE') {
        await this.firestore.setDoc(colName, delta.entityId, delta.payload, this.getAuthContext(), { merge: true });
      } else if (delta.action === 'DELETE') {
        await this.firestore.deleteDoc(colName, delta.entityId, this.getAuthContext());
      }
    }

    const processedCount = queueToProcess.length;
    this.offlineQueue = this.offlineQueue.filter(d => !queueToProcess.some(p => p.id === d.id));
    this.pendingChangesCount = this.offlineQueue.length;
    this.syncStatus = 'synced';
    this.lastSyncTime = new Date().toISOString();

    this.addAuditLog('DELTA_SYNC_SUCCESS', 'OfflineDeltaQueue', `batch-${Date.now()}`, `Synchronized ${processedCount} offline records.`);
    this.addNotification({
      title: 'Offline Deltas Synchronized',
      message: `Successfully flushed ${processedCount} queued offline records.`,
      type: 'compliance',
      severity: 'low'
    });
  }

  // --- CRUD ACTIONS ---
  async addClient(clientData) {
    const id = clientData.id || `cli-${Date.now().toString().slice(-4)}`;
    const newClient = {
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goals: [],
      spentBudget: 0,
      allocatedBudget: clientData.allocatedBudget || 0,
      totalBudget: clientData.totalBudget || 0,
      status: 'Active',
      riskLevel: 'Low',
      restrictivePracticesActive: false,
      ...clientData
    };

    // Optimistic store update
    this.clients = [newClient, ...this.clients];

    if (!this.isOnline) {
      this.queueOfflineDelta('CREATE', 'Client', id, newClient);
    } else {
      await this.firestore.setDoc('clients', id, newClient, this.getAuthContext());
    }

    this.addAuditLog('CREATE', 'Client', id, `Enrolled participant ${newClient.name}`);
    return newClient;
  }

  async updateClient(id, updates) {
    this.clients = this.clients.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    if (!this.isOnline) {
      this.queueOfflineDelta('UPDATE', 'Client', id, updates);
    } else {
      await this.firestore.updateDoc('clients', id, updates, this.getAuthContext());
    }
    this.addAuditLog('UPDATE', 'Client', id, 'Updated participant record');
  }

  async deleteClient(id) {
    if (this.currentUser.role !== 'ADMIN') {
      throw new Error(`PERMISSION_DENIED: Only ADMIN can delete client records`);
    }
    const target = this.clients.find(c => c.id === id);
    this.clients = this.clients.filter(c => c.id !== id);
    if (!this.isOnline) {
      this.queueOfflineDelta('DELETE', 'Client', id, null);
    } else {
      await this.firestore.deleteDoc('clients', id, this.getAuthContext());
    }
    this.addAuditLog('DELETE', 'Client', id, `Archived client record for ${target?.name || id}`);
  }

  async addCaseNote(noteData) {
    const id = noteData.id || `note-${Date.now().toString().slice(-4)}`;
    const newNote = {
      id,
      authorId: this.currentUser.id,
      practitionerId: noteData.practitionerId || this.currentUser.practitionerId || 'prac-201',
      practitionerName: noteData.practitionerName || this.currentUser.name,
      format: 'Standard',
      status: 'Submitted',
      flaggedForReview: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...noteData
    };

    this.caseNotes = [newNote, ...this.caseNotes];
    if (!this.isOnline) {
      this.queueOfflineDelta('CREATE', 'CaseNote', id, newNote);
    } else {
      await this.firestore.setDoc('caseNotes', id, newNote, this.getAuthContext());
    }

    this.addAuditLog('CREATE', 'CaseNote', id, `Logged ${newNote.format} case note for client ${newNote.clientName || newNote.clientId}`);
    return newNote;
  }

  async addBillingClaim(claimData) {
    const id = claimData.id || `claim-${Date.now().toString().slice(-4)}`;
    const newClaim = {
      id,
      status: 'Pending',
      reconciliationStatus: 'Pending',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      ...claimData
    };

    this.billingClaims = [newClaim, ...this.billingClaims];
    if (!this.isOnline) {
      this.queueOfflineDelta('CREATE', 'BillingClaim', id, newClaim);
    } else {
      await this.firestore.setDoc('billingClaims', id, newClaim, this.getAuthContext());
    }

    // Automatically update client spent budget
    const client = this.clients.find(c => c.id === newClaim.clientId);
    if (client) {
      client.spentBudget = (client.spentBudget || 0) + (newClaim.totalAmount || 0);
    }

    this.addAuditLog('CREATE', 'BillingClaim', id, `Generated claim for $${newClaim.totalAmount}`);
    return newClaim;
  }

  async addIncident(incidentData) {
    const id = incidentData.id || `inc-${Date.now().toString().slice(-4)}`;
    const isReportable = incidentData.severity === 'Critical / Reportable' ||
      (incidentData.description && /restrict|injur|hospital|emergency|abuse/i.test(incidentData.description));

    const newIncident = {
      id,
      status: 'Investigating',
      isNdisReportable: Boolean(isReportable),
      ndis24hrNotified: false,
      ndis5daySubmitted: false,
      reportedBy: this.currentUser.name,
      createdAt: new Date().toISOString(),
      ...incidentData
    };

    this.incidents = [newIncident, ...this.incidents];
    if (!this.isOnline) {
      this.queueOfflineDelta('CREATE', 'Incident', id, newIncident);
    } else {
      await this.firestore.setDoc('incidents', id, newIncident, this.getAuthContext());
    }

    this.addAuditLog('CREATE', 'Incident', id, `Logged ${newIncident.severity} incident for ${newIncident.clientName}`);
    return newIncident;
  }

  async addRestrictivePractice(rpData) {
    const id = rpData.id || `rp-${Date.now().toString().slice(-4)}`;
    const newRP = {
      id,
      status: 'Authorized',
      monthlyReportStatus: 'Due',
      startDate: new Date().toISOString().slice(0, 10),
      ...rpData
    };

    this.restrictivePractices = [newRP, ...this.restrictivePractices];
    if (!this.isOnline) {
      this.queueOfflineDelta('CREATE', 'RestrictivePractice', id, newRP);
    } else {
      await this.firestore.setDoc('restrictivePractices', id, newRP, this.getAuthContext());
    }

    const client = this.clients.find(c => c.id === newRP.clientId);
    if (client) client.restrictivePracticesActive = true;

    this.addAuditLog('CREATE', 'RestrictivePractice', id, `Registered ${newRP.practiceType} restrictive practice`);
    return newRP;
  }

  addAuditLog(action, entity, entityId, details) {
    const log = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorId: this.currentUser.id,
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action,
      entity,
      entityId,
      details,
      ipAddress: '127.0.0.1'
    };
    this.auditLogs.unshift(log);
  }

  addNotification(notif) {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    this.notifications.unshift(newNotif);
  }
}

// --- AI CLINICAL ASSISTANT & HEURISTIC ENGINE ---
export class AIAssistantEngine {
  static draftCaseNote(summary, format = 'SIMPL', clientName = 'Participant') {
    if (!summary || !summary.trim()) {
      if (format === 'BIRP') {
        return {
          subjective: `Behavior: Participant (${clientName}) presented for scheduled consultation.`,
          objective: `Intervention: Completed direct therapeutic intervention activities.`,
          assessment: `Response: Participant demonstrated engagement with target goals.`,
          plan: `Plan: Continue scheduled clinical intervention as planned.`
        };
      }
      return {
        subjective: `Participant presented for scheduled allied health consultation.`,
        objective: `Completed direct therapeutic intervention activities.`,
        assessment: `Participant demonstrated engagement with target goals.`,
        plan: `Continue scheduled clinical intervention as planned.`
      };
    }

    const cleanSummary = summary.trim();
    if (format === 'BIRP') {
      return {
        subjective: `Behavior: Participant (${clientName}) exhibited observable focus and engagement during session. Reported: "${cleanSummary.slice(0, 120)}".`,
        objective: `Intervention: Delivered 60 minutes of PBS positive reinforcement and replacement skill coaching.`,
        assessment: `Response: Participant achieved 80% independent milestone execution with minimal prompting.`,
        plan: `Plan: Re-assess visual schedule pacing in next weekly follow-up.`
      };
    }

    // Default SIMPL format
    const sentences = cleanSummary.split(/[.\n]+/).filter(s => s.trim().length > 0);
    const sPart = sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.3))).join('. ');
    const oPart = sentences.slice(Math.max(1, Math.ceil(sentences.length * 0.3)), Math.ceil(sentences.length * 0.6)).join('. ');
    const aPart = sentences.slice(Math.ceil(sentences.length * 0.6), Math.ceil(sentences.length * 0.8)).join('. ');
    const pPart = sentences.slice(Math.ceil(sentences.length * 0.8)).join('. ');

    return {
      subjective: sPart || `Participant engaged in consultation: ${cleanSummary.slice(0, 100)}`,
      objective: oPart || `Administered structured functional capacity exercises.`,
      assessment: aPart || `Demonstrated steady progress against target NDIS behavioral goals.`,
      plan: pPart || `Continue weekly intervention and review sensory tools with nominee.`
    };
  }

  static suggestGoalsFromABC(abcLogs) {
    if (!abcLogs || abcLogs.length === 0) {
      return [
        {
          id: `g-sugg-${Date.now()}-1`,
          title: 'Establish foundational emotional regulation strategies during daily transitions',
          category: 'Capacity Building',
          targetDate: '2026-12-31',
          progressPercent: 0,
          status: 'In Progress',
          gasScore: -1
        }
      ];
    }

    const functions = abcLogs.map(l => l.perceivedFunction);
    const topFunction = functions.includes('Escape/Avoidance') ? 'Escape/Avoidance'
      : functions.includes('Tangible/Access') ? 'Tangible/Access'
      : functions.includes('Sensory/Automatic') ? 'Sensory/Automatic'
      : 'Attention/Social';

    const goals = [];
    if (topFunction === 'Escape/Avoidance') {
      goals.push({
        id: `g-sugg-escape-${Date.now()}`,
        title: 'Master functional communication break-request cards to replace task avoidance agitation',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 10,
        status: 'In Progress',
        gasScore: -1
      });
    } else if (topFunction === 'Tangible/Access') {
      goals.push({
        id: `g-sugg-tangible-${Date.now()}`,
        title: 'Utilize visual schedule timer to tolerate delayed access to preferred sensory items',
        category: 'Core',
        targetDate: '2026-11-30',
        progressPercent: 15,
        status: 'In Progress',
        gasScore: 0
      });
    } else {
      goals.push({
        id: `g-sugg-sensory-${Date.now()}`,
        title: 'Independently access sensory decompression quiet zones prior to physiological escalation',
        category: 'Capacity Building',
        targetDate: '2026-12-31',
        progressPercent: 20,
        status: 'In Progress',
        gasScore: 0
      });
    }

    return goals;
  }

  static queryCommandCenterAI(question, liveContext) {
    const q = (question || '').toLowerCase();
    const { clients = [], claims = [], practitioners = [], restrictivePractices = [] } = liveContext;

    const activeClientsCount = clients.filter(c => c.status === 'Active').length;
    const totalRevenue = claims
      .filter(c => c.status === 'Paid' || c.status === 'Approved' || c.status === 'Submitted PACE')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const expiringScreenings = practitioners.filter(p => p.screeningStatus === 'Expiring Soon' || p.screeningStatus === 'Expired').length;
    const overdueRP = restrictivePractices.filter(rp => rp.monthlyReportStatus === 'Overdue').length;

    if (q.includes('how many clients') || q.includes('active clients') || q.includes('client count')) {
      return `Breakthrough OS currently has ${activeClientsCount} active participant${activeClientsCount === 1 ? '' : 's'} enrolled in clinical programs across all practitioners.`;
    }

    if (q.includes('revenue') || q.includes('billing') || q.includes('total claims')) {
      return `Total revenue across submitted, approved, and paid claims currently stands at $${totalRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    }

    if (q.includes('compliance') || q.includes('screening') || q.includes('practitioner')) {
      return `Compliance Alert Summary: ${expiringScreenings} practitioner screening(s) requiring renewal and ${overdueRP} overdue restrictive practice reduction report(s).`;
    }

    return `Command Center Telemetry: Managing ${activeClientsCount} active clients, $${totalRevenue.toFixed(2)} in total billing claims, and ${expiringScreenings} compliance alerts flagged for director review.`;
  }

  static analyzeIncidentSLA(description) {
    const text = (description || '').toLowerCase();
    const isCritical = text.includes('restrict') ||
      text.includes('injur') ||
      text.includes('emergency') ||
      text.includes('hospital') ||
      text.includes('death') ||
      text.includes('abuse') ||
      text.includes('police');

    if (isCritical) {
      return {
        severityLevel: 'LEVEL_4_CRITICAL',
        slaCategory: '24_HOUR_NOTIFIABLE',
        urgencyDays: 1,
        isReportable: true,
        recommendedAction: 'Initiate urgent 24-hour statutory notification to the NDIS Quality and Safeguards Commission.'
      };
    }

    return {
      severityLevel: 'LEVEL_2_MEDIUM',
      slaCategory: '5_DAY_REPORTABLE',
      urgencyDays: 5,
      isReportable: false,
      recommendedAction: 'Log ABC observation data and issue standard 5-day stakeholder summary.'
    };
  }

  static auditNDISSection34(evidenceText) {
    const text = (evidenceText || '').toLowerCase();
    const hasGoals = text.includes('goal') || text.includes('milestone');
    const hasValueForMoney = text.includes('rate') || text.includes('cost') || text.includes('hour') || text.includes('price');
    const hasEvidence = text.includes('assessment') || text.includes('pbs') || text.includes('clinical') || text.includes('fca');
    const hasConsent = text.includes('guardian consent') || text.includes('authorized') || text.includes('agreed') || text.includes('signed consent');
    const hasRestrictive = text.includes('restrictive') || text.includes('chemical') || text.includes('environmental') || text.includes('restraint');

    let score = 90;
    if (!hasGoals) score -= 20;
    if (hasRestrictive && !hasConsent) score -= 30;
    if (!hasEvidence) score -= 15;
    if (!hasValueForMoney) score -= 10;

    score = Math.max(25, Math.min(98, score));
    const riskLevel = score >= 85 ? 'LOW_RISK_COMPLIANT' : score >= 65 ? 'MODERATE_GAP' : 'HIGH_AUDIT_RISK';

    return {
      overallComplianceScore: score,
      riskLevel,
      hasGoals,
      hasConsent,
      hasRestrictive,
      isCompliant: score >= 65
    };
  }
}

// --- DASHBOARD & ANALYTICS AGGREGATOR ---
export class DashboardAnalyticsAggregator {
  static computeBillingMetrics(claims) {
    if (!claims || claims.length === 0) {
      return {
        totalRevenue: 0,
        totalPaid: 0,
        totalSubmitted: 0,
        totalPending: 0,
        totalRejected: 0,
        paidPercentage: 0,
        claimsByClient: {}
      };
    }

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalSubmitted = 0;
    let totalPending = 0;
    let totalRejected = 0;
    const claimsByClient = {};

    for (const c of claims) {
      const amount = Number(c.totalAmount) || 0;
      totalRevenue += amount;

      if (c.status === 'Paid') totalPaid += amount;
      else if (c.status === 'Submitted PACE') totalSubmitted += amount;
      else if (c.status === 'Approved' || c.status === 'Pending') totalPending += amount;
      else if (c.status === 'Rejected') totalRejected += amount;

      const clientKey = c.clientName || c.clientId || 'Unknown';
      claimsByClient[clientKey] = (claimsByClient[clientKey] || 0) + amount;
    }

    const paidPercentage = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalPaid,
      totalSubmitted,
      totalPending,
      totalRejected,
      paidPercentage,
      claimsByClient
    };
  }

  static computeComplianceKPIs(practitioners, incidents, restrictivePractices) {
    const pracList = practitioners || [];
    const validCount = pracList.filter(p => p.screeningStatus === 'Valid').length;
    const expiringSoonCount = pracList.filter(p => p.screeningStatus === 'Expiring Soon').length;
    const expiredCount = pracList.filter(p => p.screeningStatus === 'Expired').length;

    const incList = incidents || [];
    const totalIncidents = incList.length;
    const reportableCount = incList.filter(i => i.isNdisReportable).length;
    const reportabilityRate = totalIncidents > 0 ? Math.round((reportableCount / totalIncidents) * 100) : 0;

    const rpList = restrictivePractices || [];
    const activeRPCount = rpList.filter(rp => rp.status === 'Authorized' || rp.status === 'Active').length;
    const overdueRPCount = rpList.filter(rp => rp.monthlyReportStatus === 'Overdue').length;

    return {
      practitioners: {
        total: pracList.length,
        valid: validCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
        complianceRate: pracList.length > 0 ? Math.round((validCount / pracList.length) * 100) : 100
      },
      incidents: {
        total: totalIncidents,
        reportable: reportableCount,
        reportabilityRate
      },
      restrictivePractices: {
        total: rpList.length,
        active: activeRPCount,
        overdue: overdueRPCount
      }
    };
  }

  static computeCaseloadHeatmap(practitioners) {
    return (practitioners || []).map(p => {
      const active = p.activeCaseloadCount || p.activeCaseload || 0;
      const limit = p.caseloadLimit || 20;
      const utilization = limit > 0 ? Math.round((active / limit) * 100) : 0;
      const isOverCapacity = active > limit;

      return {
        id: p.id,
        name: p.name,
        position: p.position,
        activeCaseload: active,
        caseloadLimit: limit,
        utilization,
        isOverCapacity,
        rating: p.rating || 4.8,
        successRate: p.historicalSuccessRate || 90
      };
    });
  }

  static computeBudgetUtilization(client) {
    if (!client) return { total: 0, spent: 0, allocated: 0, utilizationPercent: 0, remaining: 0 };
    const total = Number(client.totalBudget) || 0;
    const spent = Number(client.spentBudget) || 0;
    const allocated = Number(client.allocatedBudget) || 0;
    const utilizationPercent = total > 0 ? Math.round((spent / total) * 100) : 0;
    const remaining = total - spent;

    return {
      total,
      spent,
      allocated,
      utilizationPercent,
      remaining,
      isOverdrawn: spent > total
    };
  }
}
