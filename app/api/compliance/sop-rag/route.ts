import { NextRequest, NextResponse } from 'next/server';
import { searchPolicyKnowledge, auditCaseNoteAgainstSOPs, COMPANY_SOP_REGISTRY } from '@/lib/policyKnowledgeService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const results = searchPolicyKnowledge(query);

  return NextResponse.json({
    query,
    totalDocuments: COMPANY_SOP_REGISTRY.length,
    matchedResults: results,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'audit_note' && body.caseNote) {
      const audit = auditCaseNoteAgainstSOPs(body.caseNote);
      return NextResponse.json({ success: true, audit });
    }

    if (body.action === 'search' && body.query) {
      const results = searchPolicyKnowledge(body.query);
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
