import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const STAFF_SESSION_COOKIE = 'dm_staff_session';
export const STAFF_SESSION_SECONDS = 12 * 60 * 60;

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update('staff-session:' + value).digest('base64url');
}

export function createStaffSession(secret: string, staffId: string, username: string, now = Date.now()) {
  if (secret.length < 32) throw new Error('작가 인증 설정이 필요합니다.');
  const value = Buffer.from(JSON.stringify({
    role: 'staff',
    staffId,
    username,
    exp: now + STAFF_SESSION_SECONDS * 1000,
    nonce: randomBytes(16).toString('hex'),
  })).toString('base64url');
  return value + '.' + signature(value, secret);
}

export function verifyStaffSession(token: string | undefined, secret: string, now = Date.now()): { staffId: string; username: string } | null {
  if (!token || token.length > 2048 || secret.length < 32) return null;
  const [value, mac, extra] = token.split('.');
  if (!value || !mac || extra) return null;
  const expected = Buffer.from(signature(value, secret));
  const supplied = Buffer.from(mac);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString());
    if (payload.role !== 'staff' || typeof payload.staffId !== 'string' || typeof payload.username !== 'string') return null;
    if (!Number.isSafeInteger(payload.exp) || payload.exp <= now || payload.exp > now + STAFF_SESSION_SECONDS * 1000) return null;
    return { staffId: payload.staffId, username: payload.username };
  } catch {
    return null;
  }
}
