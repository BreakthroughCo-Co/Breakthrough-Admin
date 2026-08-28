import { NextRequest, NextResponse } from 'next/server';
import { NDISProdaApiService } from '@/lib/prodaService';
import { requireAuth } from '@/lib/auth/verifySession';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

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
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'PRODA_STATUS_FAILED', message: err.message || 'Failed to poll PRODA batch status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const body = await req.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT', message: 'batchId is required in request body' },
        { status: 400 }
      );
    }

    const result = NDISProdaApiService.pollBatchStatus(batchId);
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'PRODA_STATUS_FAILED', message: err.message || 'Failed to poll PRODA batch status' },
      { status: 500 }
    );
  }
}
