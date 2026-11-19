import test from 'node:test';
import assert from 'node:assert/strict';
import { createApprovalToken } from '../src/lib/token';
import { previewContractImport } from '../src/lib/referrals/importContract';
import { calculateContractPrice } from '../src/lib/pricing';
import { execute, project } from '../src/lib/referrals/ledger';
const data: any = { groomName: '가상신랑', brideName: '가상신부', weddingDate: '2027-06-01', productId: 'album_plus', partnerDiscount: true };
const link = 'https://dear-memory-booking.vercel.app/review?token=' + createApprovalToken('stable_contract', data);
test('contract import preserves internal identity and original discounted amount without confirming payment', () => {
  const a = previewContractImport(link, 'TEST-1'), b = previewContractImport(link, 'TEST-2');
  assert.equal(a.id, b.id); assert.equal(a.total, calculateContractPrice(data).contractTotal);
  assert.equal(a.legacyPartnerDiscount, true); assert.equal(a.paid, 0); assert.equal(a.depositConfirmedAt, undefined);
  const history = execute([], { type: 'register', contract: a }, { requestId: 'one', actor: 'owner', role: 'admin', at: new Date().toISOString() });
  assert.equal(Object.keys(project(history).codes).length, 0);
  assert.throws(() => execute(history, { type: 'register', contract: b }, { requestId: 'two', actor: 'owner', role: 'admin', at: new Date().toISOString() }), /기존 계약/);
  assert.throws(() => execute(history, { type: 'refer', contractId: a.id, code: 'DM-A7K9M2Q8' }, { requestId: 'three', actor: 'owner', role: 'admin', at: new Date().toISOString() }), /중복 할인/);
});
test('foreign or tampered review links and explicitly cancelled contract are blocked', () => {
  assert.throws(() => previewContractImport(link.replace('dear-memory-booking.vercel.app', 'attacker.invalid'), 'TEST'));
  assert.throws(() => previewContractImport(link + 'x', 'TEST'));
  assert.throws(() => previewContractImport(link, 'DM-20270516-XJWF'));
});
