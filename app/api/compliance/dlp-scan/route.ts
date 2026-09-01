import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth/verifySession';
import { DLPSanitizer } from '../../../../lib/dlpSanitizer';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text field is required' }, { status: 400 });
    }

    const scanResult = DLPSanitizer.sanitize(text);
    return NextResponse.json(scanResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
