import { NextRequest, NextResponse } from 'next/server';
import { processChatTurn } from '@/services/chatService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 17hats Webhook Route Handler for Breakthrough Coaching & Consulting
 * Receives webhook notifications from 17hats CRM (leads, invoices, questionnaires, contacts, contracts),
 * immediately acknowledges receipt with 200 OK, and triggers Gemini background processing via processChatTurn to execute sync tasks.
 */
export async function POST(req: NextRequest) {
  let event: any = {};
  
  try {
    const text = await req.text();
    event = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('Failed to parse 17hats webhook body:', parseError);
    return NextResponse.json(
      { received: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const eventName = event.event_name || event.event || 'general_notification';
  const eventData = event.data || event.payload || event;

  // Background processing asynchronously without blocking the webhook acknowledgment
  (async () => {
    try {
      // Construct prompt payload from webhook payload for Gemini background processing
      const prompt = `Webhook Alert (17hats): Event "${eventName}" received. Client Data: ${JSON.stringify(eventData)}. Execute any necessary sync tasks.`;
      
      const aiResponse = await processChatTurn('system-automation', prompt);
      console.log('Automated Processing Result:', aiResponse);
    } catch (error) {
      console.error('Failed to process 17hats webhook:', error);
    }
  })();

  // Immediately acknowledge receipt to 17hats
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
