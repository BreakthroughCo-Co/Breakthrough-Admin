import { NextRequest, NextResponse } from 'next/server';
import { GET as handleXeroAuth } from '@/app/api/auth/xero/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return handleXeroAuth(req);
}
