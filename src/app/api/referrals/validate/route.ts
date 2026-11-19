import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, referralStore } from '@/lib/referrals/server';
import { normalizeCode, project, validCode } from '@/lib/referrals/ledger';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    await rateLimit(req, 'lookup');
    const text = await req.text(); if (text.length > 200) throw new Error();
    const { code } = JSON.parse(text);
    if (typeof code !== 'string' || !/^DM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(normalizeCode(code))) return NextResponse.json({ valid: false, discountAmount: 0 }, { headers });
    const valid = await referralStore().transaction(history => ({ events: [], result: validCode(project(history), code) }));
    return NextResponse.json({ valid, discountAmount: valid ? 50000 : 0, provisional: true }, { headers });
  } catch { return NextResponse.json({ valid: false, discountAmount: 0, error: '지금은 코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503, headers }); }
}
