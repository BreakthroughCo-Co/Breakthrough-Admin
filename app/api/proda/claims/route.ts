import { NextRequest, NextResponse } from 'next/server';
import { NDISProdaApiService } from '@/lib/prodaService';
import { requireAuth } from '@/lib/auth/verifySession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const body = await req.json();
    const { claimIds, claims = [], providerRegNumber = '405001234' } = body;

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT', message: 'claimIds array cannot be empty' },
        { status: 400 }
      );
    }

    const result = NDISProdaApiService.submitBatch(claimIds, claims, providerRegNumber);
    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      status: result.status,
      submittedClaimsCount: result.submittedClaimsCount,
      timestamp: result.timestamp,
      claims: result.claims
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'PRODA_SUBMISSION_FAILED', message: err.message || 'Failed to submit PRODA batch' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR', 'VIEWER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  return NextResponse.json({
    service: 'NDIS PRODA B2G Direct Batch Claim Submission API',
    version: '2026.4.2',
    status: 'ACTIVE',
    endpoint: '/api/proda/claims'
  });
}
