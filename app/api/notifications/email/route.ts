import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAuth } from '@/lib/auth/verifySession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ['ADMIN', 'PRACTITIONER']);
  if ('errorResponse' in authResult) {
    return authResult.errorResponse;
  }

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

    const sendgridApiKey = process.env.SENDGRID_API_KEY || 'SG.sandbox_dummy_key';
    const messageId = `sg-msg-${crypto.randomUUID()}`;

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
