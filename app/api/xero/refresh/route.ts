import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty
    }
    const { refreshToken } = body;

    const refreshed = XeroOAuthService.refreshToken(refreshToken);
    return NextResponse.json({
      success: true,
      action: 'refresh_token',
      ...refreshed
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_REFRESH_FAILED', message: err.message || 'Failed to refresh Xero token' },
      { status: 401 }
    );
  }
}
