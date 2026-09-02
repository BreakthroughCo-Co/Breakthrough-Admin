import { Client, Practitioner } from '../types';

export interface SpeakerSegment {
  speaker: 'PRACTITIONER' | 'PARTICIPANT' | 'CARER_SUPPORT_WORKER';
  timestamp: string;
  transcriptText: string;
}

export interface AudioVaultSession {
  vaultId: string;
  clientId: string;
  clientName: string;
  practitionerId: string;
  practitionerName: string;
  recordedAt: string;
  audioDurationSeconds: number;
  segments: SpeakerSegment[];
  extractedClinicalSOAP: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  encryptionDigest: string;
}

export class AudioTranscriptionVault {
  /**
   * Simulates multi-speaker audio transcription and SOAP structuring.
   */
  public static processAudioSession(
    client: Client,
    practitioner: Practitioner,
    durationSeconds: number = 3600
  ): AudioVaultSession {
    const segments: SpeakerSegment[] = [
      {
        speaker: 'PRACTITIONER',
        timestamp: '00:02',
        transcriptText: 'Hello Jordan, today we are going to practice using the choice board for afternoon activities.',
      },
      {
        speaker: 'PARTICIPANT',
        timestamp: '00:15',
        transcriptText: 'Music... I want to listen to music with headphones.',
      },
      {
        speaker: 'CARER_SUPPORT_WORKER',
        timestamp: '00:28',
        transcriptText: 'Jordan reached for the headphones independently when the room got noisy.',
      },
    ];

    return {
      vaultId: `AUDIO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId: client.id,
      clientName: client.name,
      practitionerId: practitioner.id,
      practitionerName: practitioner.name,
      recordedAt: new Date().toISOString(),
      audioDurationSeconds: durationSeconds,
      segments,
      extractedClinicalSOAP: {
        subjective: 'Participant verbally expressed preference for music activity utilizing choice board.',
        objective: 'Jordan engaged in 45 minutes of proactive communication practice with zero behavioral escalations.',
        assessment: 'Functional communication skill acquisition progressing favorably (+1 GAS).',
        plan: 'Continue 2x weekly Positive Behaviour Support therapy sessions.',
      },
      encryptionDigest: 'AES-256-GCM:SHA256:8f9a2c3b4e5d6f7a',
    };
  }
}
