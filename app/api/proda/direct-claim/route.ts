import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth/verifySession';
import { PRODAB2GConnector } from '../../../../lib/prodaB2GConnector';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { claim, claims } = body;

    if (claims && Array.isArray(claims)) {
      const bulkRes = await PRODAB2GConnector.submitBulkClaims(claims);
      return NextResponse.json(bulkRes);
    }

    if (!claim) {
      return NextResponse.json({ error: 'Missing claim payload' }, { status: 400 });
    }

    const res = await PRODAB2GConnector.submitDirectClaim(claim);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
