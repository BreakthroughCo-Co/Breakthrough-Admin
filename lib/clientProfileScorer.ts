/**
 * Breakthrough OS — Client Profile Completeness Scorer (Phase 2.2)
 * Scores each client record across 12 critical NDIS/clinical fields.
 */

import type { Client } from '@/types';

export interface ProfileCompletenessResult {
  score: number; // 0–100
  tier: 'complete' | 'partial' | 'incomplete';
  missingFields: string[];
  completedFields: string[];
}

const SCORED_FIELDS: { label: string; check: (c: Client) => boolean }[] = [
  { label: 'Date of Birth',         check: c => !!c.dateOfBirth },
  { label: 'Phone Number',          check: c => !!c.phone },
  { label: 'Email Address',         check: c => !!c.email },
  { label: 'Home Address / Suburb', check: c => !!(c.address?.suburb || (c as any).suburb || c.address) },
  { label: 'GP Contact Details',    check: c => !!(c.gpContact?.doctorName && c.gpContact?.phone) },
  { label: 'Emergency Contact',     check: c => !!(c.emergencyContact?.name && c.emergencyContact?.phone) },
  { label: 'Communication Method',  check: c => !!c.communicationMethod },
  { label: 'Active NDIS Goals (≥1)',check: c => (c.goals?.length ?? 0) >= 1 },
  { label: 'Active BSP on File',    check: c => !!(c.bspExpiryDate && new Date(c.bspExpiryDate) > new Date()) },
  { label: 'Primary Disability',    check: c => !!c.primaryDisability },
  { label: 'Plan Management Type',  check: c => !!(c as any).planManagementType },
  { label: 'De-escalation Strategies', check: c => !!c.deescalationStrategies },
];

export function scoreClientProfile(client: Client): ProfileCompletenessResult {
  const completed = SCORED_FIELDS.filter(f => f.check(client));
  const missing   = SCORED_FIELDS.filter(f => !f.check(client));
  const score = Math.round((completed.length / SCORED_FIELDS.length) * 100);
  return {
    score,
    tier: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'incomplete',
    missingFields:   missing.map(f => f.label),
    completedFields: completed.map(f => f.label),
  };
}
