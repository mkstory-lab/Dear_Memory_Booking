import { NextRequest, NextResponse } from 'next/server';
import { createSession, passwordMatches, sameOrigin, SESSION_COOKIE, SESSION_SECONDS, verifySession } from '@/lib/referrals/adminAuth';
import { rateLimit, referralSettings } from '@/lib/referrals/server';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(req: NextRequest) {
  try { const c = referralSettings(); return NextResponse.json({ authenticated: !!verifySession(req.cookies.get(SESSION_COOKIE)?.value, c.sessionSecret) }, { headers }); }
  catch (error) { return NextResponse.json({ authenticated: false, configured: false, configurationError: error instanceof Error ? error.message : 'configuration' }, { headers }); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403, headers });
  try {
    const c = referralSettings();
    await rateLimit(req, 'login');
    const text = await req.text(); if (text.length > 2048) throw new Error('입력값을 확인해 주세요.');
    const { password } = JSON.parse(text);
    if (!passwordMatches(password, c.hash)) return NextResponse.json({ error: '비밀번호를 확인해 주세요.' }, { status: 401, headers });
    const res = NextResponse.json({ authenticated: true }, { headers });
    res.cookies.set(SESSION_COOKIE, createSession(c.sessionSecret), { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/referrals', maxAge: SESSION_SECONDS });
    return res;
  } catch { return NextResponse.json({ error: '로그인할 수 없습니다. 운영 설정 또는 잠시 후 재시도를 확인해 주세요.' }, { status: 503, headers }); }
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({}, { status: 403, headers });
  const res = NextResponse.json({ authenticated: false }, { headers });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/referrals', maxAge: 0 }); return res;
}
