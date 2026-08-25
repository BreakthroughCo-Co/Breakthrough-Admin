import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claims = [], payments = [], tenantId } = body;

    // Record any incoming payment events
    for (const p of payments) {
      if (p.invoiceId && p.amount) {
        XeroOAuthService.recordBankFeedPayment(p.invoiceId, p.amount, p.paymentDate);
      }
    }

    // Reconcile with claims
    const storeProxy = {
      billingClaims: claims
    };

    const syncedCount = XeroOAuthService.syncBankFeedPayments(tenantId, storeProxy);

    return NextResponse.json({
      success: true,
      reconciledPayments: syncedCount,
      reconciledClaims: storeProxy.billingClaims.filter((c) => c.status === 'Paid'),
      totalPushedValue: storeProxy.billingClaims
        .filter((c) => c.status === 'Paid')
        .reduce((sum, c) => sum + (c.totalAmount || 0), 0),
      lastSyncAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_RECONCILE_FAILED', message: err.message || 'Failed to reconcile Xero bank feeds' },
      { status: 500 }
    );
  }
}
