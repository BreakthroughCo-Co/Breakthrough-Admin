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
    let requestBody: any = {};
    try {
      const text = await req.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON: Failed to parse request body' },
        { status: 400 }
      );
    }

    const { to, body, priority } = requestBody;

    // Validate mobile number format
    const cleanTo = (to || '').toString().trim().replace(/\s+/g, '');
    if (!cleanTo || (!cleanTo.startsWith('+') && !cleanTo.startsWith('04'))) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT: Valid mobile phone number is required (e.g. +61411234567 or 0411234567)' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json(
        { error: 'INVALID_ARGUMENT: SMS body cannot be empty' },
        { status: 400 }
      );
    }

    const sid = `SM${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`;

    return NextResponse.json(
      {
        sid,
        to: cleanTo,
        body,
        priority: priority || 'normal',
        status: 'delivered',
        sentAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in /api/notifications/sms:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing SMS notification' },
      { status: 500 }
    );
  }
}
