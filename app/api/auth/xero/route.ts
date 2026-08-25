import { NextRequest, NextResponse } from 'next/server';
import { getXeroClient, isXeroConfigured } from '@/lib/xeroClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Initiates Xero OAuth2 authorization flow.
 * Redirects user to Xero consent URL or returns consent URL as JSON.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isXeroConfigured()) {
      return NextResponse.json(
        {
          error: 'Xero credentials unconfigured',
          message: 'Please set XERO_CLIENT_ID and XERO_CLIENT_SECRET in environment variables / Settings.',
          setupGuide: 'https://developer.xero.com/app/manage'
        },
        { status: 503 }
      );
    }

    const xero = getXeroClient();
    const consentUrl = await xero.buildConsentUrl();

    const format = req.nextUrl.searchParams.get('format');
    if (format === 'json') {
      return NextResponse.json({ consentUrl });
    }

    return NextResponse.redirect(consentUrl);
  } catch (error: any) {
    console.error('Failed to build Xero consent URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Xero authorization URL', details: error?.message },
      { status: 500 }
    );
  }
}
