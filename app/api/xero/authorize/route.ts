import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || process.env.XERO_CLIENT_ID || 'xero_client_123';
    const redirectUri =
      searchParams.get('redirectUri') ||
      process.env.XERO_REDIRECT_URI ||
      `${req.nextUrl.origin}/api/xero/callback`;
    const state = searchParams.get('state') || `xero_state_${Math.random().toString(36).substring(2, 10)}`;
    const shouldRedirect = searchParams.get('redirect') !== 'false' && searchParams.get('json') !== 'true';

    const authUrl = XeroOAuthService.getAuthorizationUrl(clientId, redirectUri, state);

    if (shouldRedirect) {
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.json({
      success: true,
      url: authUrl,
      state
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_AUTH_INIT_FAILED', message: err.message || 'Failed to initialize Xero OAuth' },
      { status: 500 }
    );
  }
}
