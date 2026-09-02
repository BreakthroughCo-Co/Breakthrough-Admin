import { RestrictivePractice } from '../types';

export interface FadingPhase {
  phaseNumber: number;
  phaseName: string;
  durationWeeks: number;
  dosageOrRestrictionLevel: string;
  targetReplacementSkill: string;
  successCriteria: string;
}

export interface FadingProtocolSimulation {
  practiceId: string;
  practiceType: string;
  baselineUsage: string;
  totalWeeksToElimination: number;
  phases: FadingPhase[];
  riskMitigationStrategies: string[];
}

export class RestrictivePracticeFadingEngine {
  /**
   * Generates a multi-phase clinical fading protocol simulation.
   */
  public static simulateFadingProtocol(practice: RestrictivePractice): FadingProtocolSimulation {
    const isChemical = /chemical|prn|medication/i.test(practice.practiceType || practice.type || '');

    const phases: FadingPhase[] = isChemical
      ? [
          { phaseNumber: 1, phaseName: 'Baseline Stabilization & Functional Communication Training', durationWeeks: 4, dosageOrRestrictionLevel: '100% PRN Baseline', targetReplacementSkill: 'PECS / Verbal Request for Space', successCriteria: 'Zero unprompted escalations for 14 consecutive days' },
          { phaseNumber: 2, phaseName: '25% PRN Dosage Reduction & Sensory Accommodation', durationWeeks: 6, dosageOrRestrictionLevel: '75% PRN Baseline', targetReplacementSkill: 'Independent use of noise-canceling headphones', successCriteria: 'Calm recovery achieved in <10 mins without medication' },
          { phaseNumber: 3, phaseName: '50% PRN Step-Down & Environmental De-escalation', durationWeeks: 8, dosageOrRestrictionLevel: '50% PRN Baseline', targetReplacementSkill: 'Self-directed transition to sensory decompression zone', successCriteria: 'Zero physical aggression across 30 days' },
          { phaseNumber: 4, phaseName: 'Full Fade & Restraint Elimination', durationWeeks: 4, dosageOrRestrictionLevel: '0% (Eliminated)', targetReplacementSkill: 'Autonomous emotional self-regulation', successCriteria: 'Permanent cessation of chemical restraint authorization' },
        ]
      : [
          { phaseNumber: 1, phaseName: 'Environmental Freedom Expansion', durationWeeks: 4, dosageOrRestrictionLevel: 'Unlocking internal access doors during waking hours', targetReplacementSkill: 'Safe visual orientation', successCriteria: 'Zero absconding incidents across 4 weeks' },
          { phaseNumber: 2, phaseName: 'Complete Lock Removal & Proactive Supervision', durationWeeks: 8, dosageOrRestrictionLevel: '100% Unrestricted Access', targetReplacementSkill: 'Community navigation and road safety awareness', successCriteria: 'Safe independent engagement in home environment' },
        ];

    const totalWeeks = phases.reduce((acc, p) => acc + p.durationWeeks, 0);

    return {
      practiceId: practice.id,
      practiceType: practice.practiceType || practice.type || 'Environmental',
      baselineUsage: 'Daily / As Needed Protocol',
      totalWeeksToElimination: totalWeeks,
      phases,
      riskMitigationStrategies: [
        'Immediate de-escalation protocol training for all active support workers',
        'Weekly behavioral rate monitoring in 24/7 PBS Heatmap',
        'Monthly review by Specialist Positive Behaviour Support Practitioner',
      ],
    };
  }
}
