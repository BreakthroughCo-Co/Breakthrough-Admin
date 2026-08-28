import { NextRequest, NextResponse } from 'next/server';
import { XeroOAuthService } from '@/lib/xeroService';
import { requireAuth } from '@/lib/auth/verifySession';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const body = await req.json();
    const { claim, tenantId, claimId } = body;

    const claimData = claim || { id: claimId, invoiceNumber: `INV-${claimId || Date.now().toString().slice(-4)}` };

    if (!claimData) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT', message: 'claim object or claimId is required' },
        { status: 400 }
      );
    }

    const invoice = XeroOAuthService.createAccrecInvoice(claimData, tenantId);

    return NextResponse.json({
      success: true,
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoice
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_INVOICE_FAILED', message: err.message || 'Failed to create Xero invoice' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER', 'SUPPORT_COORDINATOR']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

  try {
    const invoices = XeroOAuthService.getInvoices();
    return NextResponse.json({
      success: true,
      count: invoices.length,
      invoices
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'XERO_FETCH_FAILED', message: err.message || 'Failed to retrieve Xero invoices' },
      { status: 500 }
    );
  }
}
