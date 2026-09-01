import { NextRequest, NextResponse } from 'next/server';
import { getXeroClient } from '@/lib/xeroClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Xero OAuth2 Callback Route Handler
 * Exchanges authorization code for TokenSet and resolves active tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const xero = getXeroClient();
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants();

    const activeTenantId = xero.tenants && xero.tenants.length > 0 ? xero.tenants[0].tenantId : null;

    const returnUrl = req.nextUrl.searchParams.get('return_url') || '/';

    // If request asks for JSON or is API client
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        status: 'authenticated',
        tenantId: activeTenantId,
        tenants: xero.tenants,
        tokenSet: {
          expires_in: tokenSet.expires_in,
          token_type: tokenSet.token_type,
          scope: tokenSet.scope
        }
      });
    }

    const redirectUrl = new URL(returnUrl, req.url);
    redirectUrl.searchParams.set('xero_auth', 'success');
    if (activeTenantId) {
      redirectUrl.searchParams.set('xero_tenant', activeTenantId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Xero OAuth callback error:', err);
    return NextResponse.json(
      { error: 'OAuth Callback Failed', details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
