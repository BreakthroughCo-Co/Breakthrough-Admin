import { NextRequest, NextResponse } from 'next/server';
import { NDISProdaApiService } from '@/lib/prodaService';
import { BillingClaim } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claimIds, claims, providerRegNumber } = body;

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST: claimIds array is required' },
        { status: 400 }
      );
    }

    const batch = NDISProdaApiService.submitBatch(
      claimIds,
      (claims as BillingClaim[]) || [],
      providerRegNumber || '405001234'
    );

    const pollResult = NDISProdaApiService.pollBatchStatus(batch.batchId);

    return NextResponse.json({
      success: true,
      batchId: batch.batchId,
      submissionStatus: batch.status,
      completedResult: pollResult,
      xmlPayload: claims ? NDISProdaApiService.generateProdaXmlPayload(claims, batch.batchId, providerRegNumber) : undefined
    });
  } catch (error: any) {
    console.error('PRODA API batch submission error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit PRODA batch' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batchId query parameter is required' },
        { status: 400 }
      );
    }

    const result = NDISProdaApiService.pollBatchStatus(batchId);
    return NextResponse.json({ success: true, batch: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to poll PRODA batch' },
      { status: 500 }
    );
  }
}
