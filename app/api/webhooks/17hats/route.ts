import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { processChatTurn } from '@/services/chatService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function verifyWebhookHmac(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const cleanHeader = signatureHeader.replace(/^sha256=/, '').trim();

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanHeader, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return cleanHeader === expectedSignature;
  }
}

function sanitizeWebhookData(data: any): string {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  // Strip control chars and markdown code block delimiters that could break prompts
  return jsonStr
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/```/g, "'''")
    .slice(0, 4000);
}

/**
 * 17hats Webhook Route Handler for Breakthrough Coaching & Consulting
 * Enforces HMAC-SHA256 signature verification and payload sanitization.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get('x-17hats-signature') ||
    req.headers.get('x-signature') ||
    req.headers.get('x-hub-signature-256');

  const webhookSecret =
    process.env.SEVENTEENHATS_WEBHOOK_SECRET ||
    process.env['17HATS_WEBHOOK_SECRET'];

  // If secret is configured, enforce signature match; if in dev/sandbox without secret, allow with warning
  if (webhookSecret) {
    if (!verifyWebhookHmac(rawBody, signature, webhookSecret)) {
      return NextResponse.json(
        { received: false, error: 'UNAUTHORIZED: Invalid or missing webhook HMAC signature' },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { received: false, error: 'UNAUTHORIZED: SEVENTEENHATS_WEBHOOK_SECRET is required in production environment' },
      { status: 401 }
    );
  }

  let event: any = {};
  try {
    event = rawBody ? JSON.parse(rawBody) : {};
  } catch (parseError) {
    console.error('Failed to parse 17hats webhook body:', parseError);
    return NextResponse.json(
      { received: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const eventName = (event.event_name || event.event || 'general_notification').toString().replace(/[^\w.-]/g, '');
  const eventData = event.data || event.payload || event;
  const sanitizedData = sanitizeWebhookData(eventData);

  // Background processing asynchronously without blocking the webhook acknowledgment
  (async () => {
    try {
      // Construct sanitized prompt payload for background execution
      const prompt = `System Webhook (17hats CRM):\nEvent: ${eventName}\nData: ${sanitizedData}\nTask: Validate participant or invoice details and record audit reconciliation.`;
      
      const aiResponse = await processChatTurn('system-automation', prompt);
      console.log('Automated Processing Result:', aiResponse);
    } catch (error) {
      console.error('Failed to process 17hats webhook:', error);
    }
  })();

  // Immediately acknowledge receipt
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/17hats',
    provider: '17hats CRM & Business Automation',
    status: 'Operational',
    methodsAllowed: ['POST', 'GET'],
    readyForEvents: ['lead_created', 'invoice_paid', 'contract_signed', 'questionnaire_submitted', 'contact_updated']
  });
}
