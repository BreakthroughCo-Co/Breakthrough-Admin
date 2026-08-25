import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON: Failed to parse request body' },
        { status: 400 }
      );
    }

    const { to, subject, templateId, templateData, payload, attachments } = body;

    // Validate mandatory fields
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT: Valid recipient email address is required' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT: Email subject is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@breakthrough.org.au';
    const messageId = `sg-msg-${crypto.randomUUID()}`;

    // If SendGrid API Key is configured in environment, dispatch to SendGrid v3 API
    if (apiKey) {
      try {
        const sendgridPayload: any = {
          personalizations: [
            {
              to: [{ email: to }],
              dynamic_template_data: templateData || payload || {}
            }
          ],
          from: { email: fromEmail, name: 'Breakthrough OS Quality & Safeguards' },
          subject: subject
        };

        if (templateId && templateId.startsWith('d-')) {
          sendgridPayload.template_id = templateId;
        } else {
          sendgridPayload.content = [
            {
              type: 'text/html',
              value: `<div style="font-family: sans-serif; padding: 20px;">
                <h2>${subject}</h2>
                <p>${JSON.stringify(templateData || payload || {})}</p>
                <hr/>
                <small>Breakthrough Coaching & Consulting &bull; Registered NDIS Practice #405001234</small>
              </div>`
            }
          ];
        }

        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          sendgridPayload.attachments = attachments.map((att: any) => ({
            content: att.content,
            filename: att.filename,
            type: att.type || 'application/pdf',
            disposition: 'attachment'
          }));
        }

        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sendgridPayload)
        });

        if (!sgRes.ok && sgRes.status !== 202) {
          const sgErr = await sgRes.json().catch(() => ({}));
          console.warn('[SendGrid API Error]:', sgErr);
        }
      } catch (sgError) {
        console.warn('[SendGrid Network Error]:', sgError);
      }
    }

    // Return standardized 202 Accepted response for transactional dispatch
    return NextResponse.json(
      {
        messageId,
        to,
        subject,
        templateId: templateId || 'd-default-template-id',
        status: 202,
        deliveredAt: new Date().toISOString()
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error in /api/notifications/email:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing email notification' },
      { status: 500 }
    );
  }
}
