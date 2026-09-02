import { Client } from '../types';

export interface FeedbackPulse {
  pulseId: string;
  clientId: string;
  clientName: string;
  respondentType: 'PARTICIPANT' | 'FAMILY_CARER' | 'SUPPORT_COORDINATOR';
  npsScore: number; // 0-10
  ratingCategory: 'PROMOTER' | 'PASSIVE' | 'DETRACTOR';
  rawComments: string;
  sentimentScore: number; // -1.0 to 1.0
  sentimentLabel: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT_ESCALATION';
  submittedAt: string;
  directorReviewRequired: boolean;
}

export class FeedbackSentimentEngine {
  /**
   * Analyzes feedback submission and determines sentiment & escalation triggers.
   */
  public static analyzeFeedback(
    client: Client,
    npsScore: number,
    comments: string,
    respondentType: FeedbackPulse['respondentType'] = 'FAMILY_CARER'
  ): FeedbackPulse {
    const isDetractor = npsScore <= 6;
    const isPromoter = npsScore >= 9;

    const lower = comments.toLowerCase();
    const hasUrgentKeywords = /unhappy|terrible|complaint|cancel|unsafe|neglect|rude|frustrated/i.test(lower);
    const hasPositiveKeywords = /great|excellent|supportive|wonderful|caring|happy|fantastic/i.test(lower);

    let sentimentScore = 0.2;
    let sentimentLabel: FeedbackPulse['sentimentLabel'] = 'NEUTRAL';
    let reviewRequired = false;

    if (hasUrgentKeywords || isDetractor) {
      sentimentScore = -0.8;
      sentimentLabel = hasUrgentKeywords ? 'URGENT_ESCALATION' : 'NEGATIVE';
      reviewRequired = true;
    } else if (hasPositiveKeywords || isPromoter) {
      sentimentScore = 0.9;
      sentimentLabel = 'POSITIVE';
    }

    return {
      pulseId: `PULSE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId: client.id,
      clientName: client.name,
      respondentType,
      npsScore,
      ratingCategory: isPromoter ? 'PROMOTER' : isDetractor ? 'DETRACTOR' : 'PASSIVE',
      rawComments: comments,
      sentimentScore,
      sentimentLabel,
      submittedAt: new Date().toISOString(),
      directorReviewRequired: reviewRequired,
    };
  }
}
