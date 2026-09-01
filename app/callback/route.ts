import { NextRequest } from 'next/server';
import { GET as handleXeroCallback } from '@/app/api/auth/xero/callback/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return handleXeroCallback(req);
}
