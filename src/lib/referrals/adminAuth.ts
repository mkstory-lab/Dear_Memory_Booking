import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export const SESSION_COOKIE = 'dm_referral_admin';
export const SESSION_SECONDS = 8 * 60 * 60;
export function passwordHash(password: string, salt = randomBytes(16).toString('hex')) {
  if (password.length < 16 || password.length > 256) throw new Error('관리자 비밀번호는 16~256자여야 합니다.');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function passwordMatches(password: unknown, stored: string) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, hex, extra] = stored.split(':');
  if (extra || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hex || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hex, 'hex'));
}
function signature(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('base64url'); }
export function createSession(secret: string, now = Date.now()) {
  if (secret.length < 32) throw new Error('관리자 인증 설정이 필요합니다.');
  const value = Buffer.from(JSON.stringify({ role: 'admin', actor: 'owner', exp: now + SESSION_SECONDS * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return value + '.' + signature(value, secret);
}
export function verifySession(token: string | undefined, secret: string, now = Date.now()): { actor: string } | null {
  if (!token || token.length > 1024 || secret.length < 32) return null;
  const [value, mac, extra] = token.split('.');
  if (!value || !mac || extra) return null;
  const expected = Buffer.from(signature(value, secret)); const supplied = Buffer.from(mac);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try { const p = JSON.parse(Buffer.from(value, 'base64url').toString());
    return p.role === 'admin' && p.actor === 'owner' && Number.isSafeInteger(p.exp) && p.exp > now && p.exp <= now + SESSION_SECONDS * 1000 ? { actor: p.actor } : null;
  } catch { return null; }
}
export function sameOrigin(req: Request) {
  return req.headers.get('origin') === new URL(req.url).origin;
}
