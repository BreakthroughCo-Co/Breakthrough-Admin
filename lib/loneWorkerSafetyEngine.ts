import { Practitioner, Client } from '../types';

export interface SafetySession {
  sessionId: string;
  practitionerId: string;
  practitionerName: string;
  clientId: string;
  clientName: string;
  visitLocation: string;
  startedAt: string;
  expectedEndAt: string;
  checkInIntervalMinutes: number;
  lastCheckInAt: string;
  status: 'ACTIVE_SAFE' | 'CHECK_IN_DUE' | 'MISSED_CHECK_IN_OVERDUE' | 'EMERGENCY_SOS_TRIGGERED' | 'COMPLETED_SAFE';
  emergencyLat?: number;
  emergencyLng?: number;
  riskSummary: string;
}

export class LoneWorkerSafetyEngine {
  /**
   * Initializes a lone worker field visit session with safety timers.
   */
  public static startSafetySession(
    practitioner: Practitioner,
    client: Client,
    visitLocation?: string,
    intervalMinutes: number = 45
  ): SafetySession {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hr

    return {
      sessionId: `SAFE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      practitionerId: practitioner.id,
      practitionerName: practitioner.name,
      clientId: client.id,
      clientName: client.name,
      visitLocation: visitLocation || client.address?.street || 'Community Visit',
      startedAt: now.toISOString(),
      expectedEndAt: end.toISOString(),
      checkInIntervalMinutes: intervalMinutes,
      lastCheckInAt: now.toISOString(),
      status: 'ACTIVE_SAFE',
      riskSummary: client.riskLevel === 'Critical' || client.riskLevel === 'High'
        ? `High-risk participant (${client.riskLevel}). Dual worker protocol recommended if severe aggression history.`
        : 'Standard community visit risk profile.',
    };
  }

  /**
   * Evaluates if a check-in is overdue and transitions session state.
   */
  public static evaluateSessionState(session: SafetySession): SafetySession {
    if (session.status === 'EMERGENCY_SOS_TRIGGERED' || session.status === 'COMPLETED_SAFE') {
      return session;
    }

    const now = new Date().getTime();
    const lastCheckIn = new Date(session.lastCheckInAt).getTime();
    const elapsedMinutes = (now - lastCheckIn) / (1000 * 60);

    if (elapsedMinutes > session.checkInIntervalMinutes + 15) {
      return { ...session, status: 'MISSED_CHECK_IN_OVERDUE' };
    } else if (elapsedMinutes >= session.checkInIntervalMinutes) {
      return { ...session, status: 'CHECK_IN_DUE' };
    }

    return session;
  }

  /**
   * Triggers an emergency SOS panic beacon with GPS coordinates.
   */
  public static triggerEmergencySOS(
    session: SafetySession,
    lat: number = -37.8136,
    lng: number = 144.9631
  ): SafetySession {
    return {
      ...session,
      status: 'EMERGENCY_SOS_TRIGGERED',
      emergencyLat: lat,
      emergencyLng: lng,
    };
  }
}
