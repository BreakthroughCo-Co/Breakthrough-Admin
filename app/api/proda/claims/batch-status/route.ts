import { NextRequest, NextResponse } from 'next/server';
import { NDISProdaApiService } from '@/lib/prodaService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT', message: 'batchId query parameter is required' },
        { status: 400 }
      );
    }

    const result = NDISProdaApiService.pollBatchStatus(batchId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'PRODA_STATUS_FAILED', message: err.message || 'Failed to poll PRODA batch status' },
      { status: 500 }
    );
  }
}
