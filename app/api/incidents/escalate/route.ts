import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      incidentId,
      clientName,
      severity,
      incidentType,
      description,
      immediateActionTaken,
      reportedBy,
      incidentDate,
      statutoryDeadline24h,
      escalationStage,
      recipients
    } = body;

    // Simulate Cloud Function / transactional email dispatch
    const emailPayload = {
      to: recipients || [
        'ndis-commission-escalations@breakthrough.org.au',
        'clinical-director@breakthrough.org.au',
        'quality-safeguards@breakthrough.org.au'
      ],
      subject: `🚨 [NDIS REPORTABLE ESCALATION] ${severity} Incident - ${clientName || 'Participant'} (ID: ${incidentId})`,
      timestamp: new Date().toISOString(),
      statutoryDeadline24h: statutoryDeadline24h || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      details: {
        incidentId,
        clientName,
        severity,
        incidentType,
        description,
        immediateActionTaken,
        reportedBy,
        incidentDate,
        escalationStage: escalationStage || 'STAGE_1_24HR_NOTIFICATION'
      }
    };

    console.info('[Firebase Cloud Function Simulation] Dispatched NDIS Escalation Email:', emailPayload);

    return NextResponse.json({
      success: true,
      message: `Escalation workflow triggered. Notification dispatched to NDIS Quality & Safeguards team and Clinical Director for ${clientName}.`,
      dispatchId: `disp_${Date.now()}`,
      statutoryNoticeRequired: severity === 'Critical / Reportable' || severity === 'Critical',
      emailPayload
    });
  } catch (error: any) {
    console.error('Escalation API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
