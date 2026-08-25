import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const format = searchParams.get('format');

    if (!code) {
      return NextResponse.json(
        { error: 'INVALID_CALLBACK', message: 'Missing authorization code from Xero callback' },
        { status: 400 }
      );
    }

    const tokenData = XeroOAuthService.exchangeCodeForTokens(code, state || undefined);

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        ...tokenData
      });
    }

    // Redirect to billing dashboard with connection flag
    const redirectUrl = new URL('/?tab=billing&xero_connected=true', req.nextUrl.origin);
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_TOKEN_EXCHANGE_FAILED', message: err.message || 'Failed to exchange Xero code for tokens' },
      { status: 500 }
    );
  }
}
