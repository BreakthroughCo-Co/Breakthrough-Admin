import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb
} from 'drizzle-orm/pg-core';

// Users table (synced with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('clinician'), // 'admin' | 'clinical_supervisor' | 'clinician' | 'support_coordinator' | 'auditor' | 'participant'
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Participants table
export const participants = pgTable('participants', {
  id: serial('id').primaryKey(),
  ndisNumber: text('ndis_number').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  suburb: text('suburb'),
  postcode: text('postcode'),
  state: text('state').default('NSW'),
  mmmZone: integer('mmm_zone').default(1),
  dateOfBirth: text('date_of_birth'),
  planStartDate: text('plan_start_date'),
  planEndDate: text('plan_end_date'),
  planManagementType: text('plan_management_type').default('Plan Managed'), // 'Self Managed' | 'Plan Managed' | 'Agency Managed (PACE)'
  planManagerEmail: text('plan_manager_email'),
  supportCoordinator: text('support_coordinator'),
  status: text('status').default('Active'), // 'Active' | 'Onboarding' | 'Review Due' | 'Archived'
  totalBudget: numeric('total_budget', { precision: 12, scale: 2 }).default('0.00'),
  allocatedBudget: numeric('allocated_budget', { precision: 12, scale: 2 }).default('0.00'),
  bspActive: boolean('bsp_active').default(false),
  pbsPractitioner: text('pbs_practitioner'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Case Notes & Clinical Records table
export const caseNotes = pgTable('case_notes', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id').references(() => participants.id),
  authorUid: text('author_uid').notNull(),
  authorName: text('author_name'),
  date: text('date').notNull(),
  timeSpentMinutes: integer('time_spent_minutes').default(60),
  supportCategory: text('support_category'),
  lineItemNumber: text('line_item_number'),
  noteType: text('note_type').default('SOAP'), // 'SOAP' | 'ABC' | 'Incident' | 'Progress Report' | 'Direct Support'
  content: text('content').notNull(),
  subjective: text('subjective'),
  objective: text('objective'),
  assessment: text('assessment'),
  plan: text('plan'),
  goalAlignment: text('goal_alignment'),
  ndisReasonableAndNecessary: boolean('ndis_reasonable_and_necessary').default(true),
  isBillable: boolean('is_billable').default(true),
  status: text('status').default('Completed'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Incidents & Quality Safeguards table
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id').references(() => participants.id),
  referenceNumber: text('reference_number').notNull(),
  incidentDate: text('incident_date').notNull(),
  reportedDate: text('reported_date').notNull(),
  severity: text('severity').notNull(), // 'Low' | 'Medium' | 'High' | 'Critical'
  category: text('category').notNull(), // 'Injury' | 'Behavioral' | 'Medication Error' | 'Unauthorized Restrictive Practice' | 'Allegation' | 'Property Damage'
  description: text('description').notNull(),
  immediateActionsTaken: text('immediate_actions_taken'),
  correctiveActions: text('corrective_actions'),
  ndisCommissionReportable: boolean('ndis_commission_reportable').default(false),
  commissionNotifiedAt: text('commission_notified_at'),
  commissionReference: text('commission_reference'),
  reportedByUid: text('reported_by_uid'),
  reportedByName: text('reported_by_name'),
  status: text('status').default('Under Investigation'), // 'Draft' | 'Under Investigation' | 'Corrective Action' | 'Closed'
  createdAt: timestamp('created_at').defaultNow(),
});

// NDIS Billing & PRODA Claims table
export const billingClaims = pgTable('billing_claims', {
  id: serial('id').primaryKey(),
  participantId: integer('participant_id').references(() => participants.id),
  invoiceNumber: text('invoice_number').notNull(),
  serviceDate: text('service_date').notNull(),
  claimType: text('claim_type').default('Standard'), // 'Standard' | 'Travel' | 'Non-Face-to-Face' | 'Report Writing' | 'Short Notice Cancellation'
  supportItemNumber: text('support_item_number').notNull(),
  supportItemDescription: text('support_item_description'),
  quantityHours: numeric('quantity_hours', { precision: 8, scale: 2 }).notNull(),
  unitRate: numeric('unit_rate', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  travelDistanceKm: numeric('travel_distance_km', { precision: 8, scale: 2 }),
  travelCharge: numeric('travel_charge', { precision: 10, scale: 2 }),
  planManagementType: text('plan_management_type').notNull(),
  status: text('status').default('Draft'), // 'Draft' | 'Ready to Batch' | 'Submitted' | 'Paid' | 'Rejected'
  prodaBatchNumber: text('proda_batch_number'),
  prodaClaimStatus: text('proda_claim_status'), // 'Pending' | 'Approved' | 'Error'
  xeroInvoiceId: text('xero_invoice_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Classroom Training & Staff Competency table
export const classroomCourses = pgTable('classroom_courses', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').notNull().unique(), // Google Classroom Course ID or Internal ID
  title: text('title').notNull(),
  section: text('section'),
  descriptionHeading: text('description_heading'),
  description: text('description'),
  room: text('room'),
  ownerId: text('owner_id'),
  courseState: text('course_state').default('ACTIVE'), // 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED'
  ndisPracticeStandard: text('ndis_practice_standard'), // e.g., 'Core Module 1: Rights and Responsibilities'
  mandatoryForRoles: text('mandatory_for_roles'), // CSV or JSON array of roles
  totalSubmissions: integer('total_submissions').default(0),
  enrolledStudentsCount: integer('enrolled_students_count').default(0),
  alternateLink: text('alternate_link'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorName: text('actor_name'),
  action: text('action').notNull(), // 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW_SENSITIVE' | 'EXPORT_PRODA' | 'EXPORT_BSP'
  entityType: text('entity_type').notNull(), // 'Participant' | 'CaseNote' | 'Incident' | 'Billing' | 'Course' | 'Integration'
  entityId: text('entity_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  caseNotes: many(caseNotes),
  incidentsReported: many(incidents),
}));

export const participantsRelations = relations(participants, ({ many }) => ({
  caseNotes: many(caseNotes),
  incidents: many(incidents),
  billingClaims: many(billingClaims),
}));

export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  participant: one(participants, {
    fields: [caseNotes.participantId],
    references: [participants.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  participant: one(participants, {
    fields: [incidents.participantId],
    references: [participants.id],
  }),
}));

export const billingClaimsRelations = relations(billingClaims, ({ one }) => ({
  participant: one(participants, {
    fields: [billingClaims.participantId],
    references: [participants.id],
  }),
}));
