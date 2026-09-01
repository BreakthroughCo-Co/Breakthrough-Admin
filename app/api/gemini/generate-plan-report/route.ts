import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth/verifySession';
import { PlanReportGenerator } from '../../../../lib/planReportGenerator';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { client, caseNotes = [], abcLogs = [], restrictivePractices = [] } = body;

    if (!client || !client.id) {
      return NextResponse.json({ error: 'Valid client object is required' }, { status: 400 });
    }

    const report = PlanReportGenerator.generateReport(
      client,
      caseNotes,
      abcLogs,
      restrictivePractices
    );

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
