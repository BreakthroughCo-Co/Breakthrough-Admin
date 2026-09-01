import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';
import { requireAuth } from '@/lib/auth/verifySession';
import { BillingClaim } from '@/types';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const body = await req.json();
    const { claims = [], payments = [], tenantId } = body;
    const typedClaims: BillingClaim[] = claims;

    // Record any incoming payment events
    for (const p of payments) {
      if (p.invoiceId && p.amount) {
        XeroOAuthService.recordBankFeedPayment(p.invoiceId, p.amount, p.paymentDate);
      }
    }

    // Reconcile with claims
    const storeProxy = {
      billingClaims: typedClaims
    };

    const syncedCount = XeroOAuthService.syncBankFeedPayments(tenantId, storeProxy);

    return NextResponse.json({
      success: true,
      reconciledPayments: syncedCount,
      reconciledClaims: storeProxy.billingClaims.filter((c: BillingClaim) => c.status === 'Paid'),
      totalPushedValue: storeProxy.billingClaims
        .filter((c: BillingClaim) => c.status === 'Paid')
        .reduce((sum: number, c: BillingClaim) => sum + (c.totalAmount || 0), 0),
      lastSyncAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_RECONCILE_FAILED', message: err.message || 'Failed to reconcile Xero bank feeds' },
      { status: 500 }
    );
  }
}
