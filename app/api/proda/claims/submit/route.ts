import { NextRequest, NextResponse } from 'next/server';
import { NDISProdaApiService } from '@/lib/prodaService';

export async function POST(req: NextRequest) {
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
