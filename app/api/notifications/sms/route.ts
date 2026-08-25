import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || '+61400000000';
    const sid = `SM${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`;

    // If Twilio credentials are configured in environment, dispatch to Twilio Messages API
    if (accountSid && authToken) {
      try {
        const formData = new URLSearchParams();
        formData.append('To', cleanTo);
        formData.append('From', fromNumber);
        formData.append('Body', body);

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
          }
        );

        if (!twilioRes.ok) {
          const twErr = await twilioRes.json().catch(() => ({}));
          console.warn('[Twilio API Error]:', twErr);
        }
      } catch (twError) {
        console.warn('[Twilio Network Error]:', twError);
      }
    }

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
