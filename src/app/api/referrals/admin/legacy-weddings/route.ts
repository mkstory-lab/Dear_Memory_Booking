import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings } from '@/lib/referrals/server';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  try {
    if (!verifySession(request.cookies.get(SESSION_COOKIE)?.value, referralSettings().sessionSecret)?.actor)
      return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401,headers});
    const raw = process.env.ADMIN_LEGACY_WEDDINGS_2026;
    if (!raw) throw new Error('missing data');
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length !== 134 || !rows.every(r => Array.isArray(r) && r.length === 7 && r.every(v => typeof v === 'string')))
      throw new Error('invalid data');
    return NextResponse.json({rows},{headers});
  } catch {
    return NextResponse.json({error:'기존 계약 일정 데이터를 확인해 주세요.'},{status:503,headers});
  }
}
