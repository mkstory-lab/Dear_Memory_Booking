import { createHash } from 'node:crypto';
import { createGasJournalTransport, GasReferralStore } from './gasStore';
export function referralSettings() {
  const secret = process.env.REFERRAL_JOURNAL_SECRET || '';
  const url = process.env.GAS_WEBAPP_URL || '';
  const sessionSecret = process.env.REFERRAL_SESSION_SECRET || '';
  const hash = process.env.REFERRAL_ADMIN_PASSWORD_HASH || '';
  if (process.env.REFERRALS_ENABLED !== 'true' || secret.length < 32 || sessionSecret.length < 32 || !hash || !url) throw new Error('추천 관리 기능의 운영 연결을 준비 중입니다.');
  return { secret, url, sessionSecret, hash };
}
export function referralStore() { const c = referralSettings(); return new GasReferralStore(createGasJournalTransport(c.url, c.secret)); }
export async function rateLimit(req: Request, purpose: 'login' | 'lookup') {
  const c = referralSettings();
  // Vercel provides this header. Do not fall back to a client-supplied X-Forwarded-For.
  const ip = req.headers.get('x-vercel-forwarded-for') || 'unknown';
  const key = createHash('sha256').update(c.secret + ':' + purpose + ':' + ip).digest('hex');
  const result = await createGasJournalTransport(c.url, c.secret).limit(key, purpose === 'login' ? 10 : 30);
  if (!result.allowed) throw new Error('요청이 많습니다. 잠시 후 다시 시도해 주세요.');
}
