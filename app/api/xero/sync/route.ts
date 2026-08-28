import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';
import { requireAuth } from '@/lib/auth/verifySession';
import { BillingClaim } from '@/types';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const tokenState = XeroOAuthService.getTokenState();
    return NextResponse.json({
      success: true,
      tokenState
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_STATUS_FAILED', message: err.message || 'Failed to retrieve Xero status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const body = await req.json();
    const { action = 'sync_payments', payments = [], claims = [], tenantId } = body;
    const typedClaims: BillingClaim[] = claims;

    if (action === 'refresh_token') {
      const refreshed = XeroOAuthService.refreshToken();
      return NextResponse.json({
        success: true,
        action: 'refresh_token',
        ...refreshed
      });
    }

    if (action === 'record_payment') {
      const recorded = [];
      for (const p of payments) {
        if (p.invoiceId && p.amount) {
          const rec = XeroOAuthService.recordBankFeedPayment(p.invoiceId, p.amount, p.paymentDate);
          recorded.push(rec);
        }
      }
      return NextResponse.json({
        success: true,
        action: 'record_payment',
        recordedCount: recorded.length,
        payments: recorded
      });
    }

    // Sync bank feed payments to claims
    const storeProxy = {
      billingClaims: typedClaims
    };

    const syncedCount = XeroOAuthService.syncBankFeedPayments(tenantId, storeProxy);

    return NextResponse.json({
      success: true,
      action: 'sync_payments',
      syncedCount,
      reconciledClaims: storeProxy.billingClaims.filter((c: BillingClaim) => c.status === 'Paid'),
      lastSyncAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_SYNC_FAILED', message: err.message || 'Failed to sync with Xero' },
      { status: 500 }
    );
  }
}
