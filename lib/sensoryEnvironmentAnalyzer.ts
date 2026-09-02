import { Client } from '../types';

export interface EnvironmentalAuditResult {
  environmentType: 'LIVING_ROOM' | 'BEDROOM' | 'CLASSROOM' | 'SENSORY_SPACE' | 'COMMUNITY_FACILITY';
  sensoryScores: {
    lightingArousal: number; // 0-100 (high = over-stimulating)
    acousticClutter: number; // 0-100
    spatialFlowAndClutter: number; // 0-100
  };
  identifiedHazards: string[];
  recommendedModifications: string[];
  ndisCapitalSupportCategory: string;
  auditSummary: string;
}

export class SensoryEnvironmentAnalyzer {
  /**
   * Evaluates sensory environment parameters and outputs accommodation recommendations.
   */
  public static analyzeEnvironment(
    client: Client,
    environmentType: EnvironmentalAuditResult['environmentType'] = 'LIVING_ROOM',
    hasHardFlooring: boolean = true,
    hasFluorescentLighting: boolean = true
  ): EnvironmentalAuditResult {
    const lightingScore = hasFluorescentLighting ? 78 : 32;
    const acousticScore = hasHardFlooring ? 82 : 28;
    const spatialScore = 45;

    const hazards: string[] = [];
    const recommendations: string[] = [];

    if (hasFluorescentLighting) {
      hazards.push('High-frequency fluorescent flicker and high kelvin glare (hyper-arousal trigger).');
      recommendations.push('Install dimmable warm LED fixtures (2700K) or glare-reduction diffusers.');
    }

    if (hasHardFlooring) {
      hazards.push('Excessive acoustic reverberation time (>1.2s RT60) causing auditory fatigue.');
      recommendations.push('Install acoustic sound-absorption wall panels and high-pile rugs in sensory calming area.');
    }

    recommendations.push('Designate dedicated low-stimulation decompression corner with weighted blanket and sensory seating.');

    return {
      environmentType,
      sensoryScores: {
        lightingArousal: lightingScore,
        acousticClutter: acousticScore,
        spatialFlowAndClutter: spatialScore,
      },
      identifiedHazards: hazards,
      recommendedModifications: recommendations,
      ndisCapitalSupportCategory: '05_Assistive_Technology_&_Home_Modifications',
      auditSummary: `Sensory audit completed for ${client.name}. Environment exhibits elevated acoustic and lighting stimulation requiring environmental adaptations to support regulation.`,
    };
  }
}
