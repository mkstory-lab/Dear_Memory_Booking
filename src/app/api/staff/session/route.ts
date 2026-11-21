import { NextRequest, NextResponse } from 'next/server';
import { createStaffSession, STAFF_SESSION_COOKIE, STAFF_SESSION_SECONDS, verifyStaffSession } from '@/lib/admin/staffAuth';
import { normalizeStaffUsername, projectStaff, staffPasswordMatches } from '@/lib/admin/staff';
import { sameOrigin } from '@/lib/referrals/adminAuth';
import { rateLimit, referralSettings, referralStore } from '@/lib/referrals/server';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

async function activeSession(request: NextRequest) {
  const settings = referralSettings();
  const session = verifyStaffSession(request.cookies.get(STAFF_SESSION_COOKIE)?.value, settings.sessionSecret);
  if (!session) return null;
  return referralStore().transaction(history => {
    const staff = projectStaff(history).staff[session.staffId];
    return { events: [], result: staff?.active && staff.username === session.username ? { id: staff.id, username: staff.username, displayName: staff.displayName } : null };
  });
}

export async function GET(request: NextRequest) {
  try {
    const staff = await activeSession(request);
    return NextResponse.json({ authenticated: !!staff, staff }, { headers });
  } catch {
    return NextResponse.json({ authenticated: false, staff: null }, { headers });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403, headers });
  try {
    const settings = referralSettings();
    await rateLimit(request, 'login');
    const text = await request.text();
    if (text.length > 2048) throw new Error('입력값을 확인해 주세요.');
    const body = JSON.parse(text);
    const username = normalizeStaffUsername(String(body.username || ''));
    const password = body.password;
    const staff = await referralStore().transaction(history => {
      const found = Object.values(projectStaff(history).staff).find(item => item.username === username && item.active);
      return { events: [], result: found && staffPasswordMatches(password, found.passwordHash) ? found : null };
    });
    if (!staff) return NextResponse.json({ error: '아이디 또는 비밀번호를 확인해 주세요.' }, { status: 401, headers });
    const response = NextResponse.json({ authenticated: true, staff: { id: staff.id, username: staff.username, displayName: staff.displayName } }, { headers });
    response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession(settings.sessionSecret, staff.id, staff.username), {
      httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: STAFF_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '로그인할 수 없습니다.' }, { status: 503, headers });
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({}, { status: 403, headers });
  const response = NextResponse.json({ authenticated: false }, { headers });
  response.cookies.set(STAFF_SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
