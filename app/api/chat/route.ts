import { NextRequest, NextResponse } from 'next/server';
import { processChatTurn } from '@/services/chatService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Conversational UI Interaction Endpoint for Breakthrough Coaching & Consulting.
 * Accepts { sessionId, message } and processes conversational turns with Gemini.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message parameter is required and must be a string.' },
        { status: 400 }
      );
    }

    const reply = await processChatTurn(sessionId || 'default-user', message);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Error in /api/chat endpoint:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Operational',
    service: 'Breakthrough Coaching & Consulting AI Conversational API',
    endpoint: '/api/chat',
    method: 'POST',
    bodyFormat: { sessionId: 'optional string', message: 'required string' },
  });
}
