import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, verifySession, passwordHash, passwordMatches, sameOrigin } from '../src/lib/referrals/adminAuth';
import { adminInput } from '../src/lib/referrals/input';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/referrals/admin/route';
const secret = 'test-only-session-secret-long-enough-000000';
test('admin password hashes and session signatures reject tampering and expiry', () => {
  const hash = passwordHash('test-admin-password-only');
  assert.ok(passwordMatches('test-admin-password-only', hash));
  assert.equal(passwordMatches('incorrect-password', hash), false);
  const token = createSession(secret, 1000000);
  assert.deepEqual(verifySession(token, secret, 1000001), { actor: 'owner' });
  assert.equal(verifySession(token + 'x', secret, 1000001), null);
  assert.equal(verifySession(token, secret, 1000000 + 8 * 3600000), null);
  assert.equal(verifySession(token, '', 1000001), null);
});
test('cross-origin mutation is rejected', () => {
  assert.equal(sameOrigin(new Request('https://example.com/api', { headers: { origin: 'https://attacker.invalid' } })), false);
  assert.equal(sameOrigin(new Request('https://example.com/api', { headers: { origin: 'https://example.com' } })), true);
});
test('HTTP commands cannot supply admin context, deposit state, or automatic issuance', () => {
  assert.throws(() => adminInput({ requestId: 'test', command: { type: 'deposit', contractId: 'A' } }));
  assert.throws(() => adminInput({ requestId: 'test', command: { type: 'issue', contractId: 'A', candidate: 'DM-A7K9M2Q8' } }));
  assert.throws(() => adminInput({ requestId: 'test', command: { type: 'payment', contractId: 'A', amount: -1 } }));
  const result = adminInput({ requestId: 'test', actor: 'forged', command: { type: 'register', contract: { id: 'A', coupleId: 'couple_A', number: 'test', groom: '가상신랑', bride: '가상신부', weddingDate: '2027-06-01', total: 1450000, deposit: 300000, paid: 1450000, depositConfirmedAt: 'forged' } } });
  assert.equal(result.command.type, 'register');
  if (result.command.type === 'register') { assert.equal(result.command.contract.paid, 0); assert.equal(result.command.contract.depositConfirmedAt, undefined); }
});
test('actual admin HTTP handlers deny unauthenticated reads and writes before storage access', async () => {
  const previous = { ...process.env };
  process.env.REFERRALS_ENABLED = 'true'; process.env.REFERRAL_SESSION_SECRET = secret;
  process.env.REFERRAL_JOURNAL_SECRET = secret; process.env.REFERRAL_ADMIN_PASSWORD_HASH = 'test';
  process.env.GAS_WEBAPP_URL = 'https://script.google.com/macros/s/TEST/exec';
  const original = global.fetch; global.fetch = async () => { throw new Error('Storage must not be called'); };
  try {
    const get = await GET(new NextRequest('https://example.com/api/referrals/admin')); assert.equal(get.status, 401);
    const post = await POST(new NextRequest('https://example.com/api/referrals/admin', { method: 'POST', headers: { origin: 'https://example.com' }, body: '{}' })); assert.equal(post.status, 401);
    const csrf = await POST(new NextRequest('https://example.com/api/referrals/admin', { method: 'POST', headers: { origin: 'https://other.invalid' }, body: '{}' })); assert.equal(csrf.status, 403);
  } finally { global.fetch = original; for (const key of ['REFERRALS_ENABLED','REFERRAL_SESSION_SECRET','REFERRAL_JOURNAL_SECRET','REFERRAL_ADMIN_PASSWORD_HASH','GAS_WEBAPP_URL']) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } }
});
