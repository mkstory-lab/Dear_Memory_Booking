import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';
import { execute, project } from '@/lib/referrals/ledger';
import { issueCode } from '@/lib/referrals/issuance';
import { adminInput } from '@/lib/referrals/input';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
function actor(req: NextRequest) { return verifySession(req.cookies.get(SESSION_COOKIE)?.value, referralSettings().sessionSecret)?.actor; }
async function snapshot() { return referralStore().transaction(history => ({ events: [], result: { state: project(history), audit: history.filter(e => e.type === 'command') } })); }
export async function GET(req: NextRequest) {
  try {
    if (!actor(req)) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    return NextResponse.json(await snapshot(), { headers });
  } catch { return NextResponse.json({ error: '관리 저장소 연결을 확인해 주세요.' }, { status: 503, headers }); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({}, { status: 403, headers });
  try {
    const user = actor(req); if (!user) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    const text = await req.text(); if (text.length > 10000) throw new Error('입력 내용이 너무 깁니다.');
    const { command, requestId, reason } = adminInput(JSON.parse(text));
    const context = { requestId, reason, actor: user, role: 'admin' as const, at: new Date().toISOString() };
    const store = referralStore();
    if (command.type === 'issue_code') await issueCode(store, command.contractId, context);
    else await store.transaction(history => ({ events: execute(history, command, context), result: true }));
    return NextResponse.json(await snapshot(), { headers });
  } catch (error) {
    // Business messages contain no secrets or provider responses; transport wraps its errors.
    return NextResponse.json({ error: error instanceof Error ? error.message : '저장에 실패했습니다.' }, { status: 400, headers });
  }
}
