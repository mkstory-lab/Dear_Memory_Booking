import test from 'node:test';
import assert from 'node:assert/strict';
import { customerData, registerSubmission, managedReview, sendManagedContract, notifySubmission, contactKeys } from '../src/lib/referrals/contractIntegration';
import { execute, project, remainingBalance, amounts, type Event } from '../src/lib/referrals/ledger';
import { issueCode, type ReferralStore } from '../src/lib/referrals/issuance';
import { verifyApprovalToken } from '../src/lib/token';
import { calculateContractPrice } from '../src/lib/pricing';
import { GoogleAppsScriptAdapter } from '../src/services/googleAppsScriptAdapter';
const secret = 'isolated-test-referral-secret-not-production';
const body = { groomName: '가상신랑', brideName: '가상신부', groomPhone: '01011112222', bridePhone: '01033334444', email: 'test@example.invalid', weddingDate: '2027-06-06', weddingTime: '13:00', weddingVenue: '가상홀', weddingHall: '가상관', productId: 'album_plus', optionIds: [], termsAgreed: true, portfolioConsent: true, reviewContractCashback: true, reviewMainCashback: true };
const admin = (requestId: string) => ({ actor: 'test-owner', role: 'admin' as const, at: '2026-11-20T01:00:00Z', requestId });
function memory() {
 let history: Event[] = [];
 const store: ReferralStore = { async transaction(operation) { const r = operation(history); history.push(...r.events); return r.result; } };
 return { store, history: () => history };
}
async function owner(m: ReturnType<typeof memory>) {
 await m.store.transaction(h => ({ events: execute(h, { type: 'register', contract: { id: 'owner', coupleId: 'couple_owner', number: 'DM-20270601-TEST', groom: '가상추천인', bride: '가상추천인배우자', weddingDate: '2027-06-01', status: 'active', total: 1250000, deposit: 300000, paid: 0, identityKeys: contactKeys({ groomPhone: '01099998888', bridePhone: '01077776666' }, secret) } }, admin('owner-register')), result: true }));
 return issueCode(m.store, 'owner', admin('owner-issue'));
}
test('customer request strips forged manual adjustment and applies one discount for any nonblank partner text', () => {
 const d = customerData({ ...body, manualAdjustment: { amount: -999999, reason: 'forged' }, identityKeys: ['forged'] });
 assert.equal(d.manualAdjustment, undefined); assert.equal(d.partnerDiscount, false);
 assert.equal(customerData({ ...body, partnerName: '기존임의코드' }).partnerDiscount, true);
 assert.equal(customerData({ ...body, partnerDiscount: true, partnerName: '   ' }).partnerDiscount, false);
});
test('realistic form -> pending referral -> matching PDF price -> manual code generation -> benefits, stable on resubmission/resend', async () => {
 const m = memory(), code = await owner(m);
 const d = customerData({ ...body, referralCode: '  ' + code.value.toLowerCase() + ' ', partnerDiscount: true });
 const registered = await registerSubmission(m.store, d, 'submission-test-0001', secret);
 const repeated = await registerSubmission(m.store, d, 'submission-test-0001', secret);
 assert.deepEqual(repeated, registered);
 const decoded = verifyApprovalToken(registered.token), view = managedReview(m.history(), decoded);
 assert.equal(view.data.partnerDiscount, true); assert.equal(calculateContractPrice(view.data).contractTotal, 1200000);
 let s = project(m.history());
 assert.equal(Object.keys(s.contracts).length, 2); assert.equal(Object.keys(s.benefits).length, 0);
 assert.equal(Object.values(s.codes).filter(c => c.contractId === registered.contractId).length, 0);
 let sends = 0;
 const send = async (data: any, number: string) => { sends++; assert.equal(number, view.contractNumber); assert.equal(calculateContractPrice(data).contractTotal, 1200000); return { success: true, contractNumber: number, customerEmailSent: true, driveSaved: true, excelSaved: true, calendarSaved: true }; };
 await sendManagedContract(m.store, decoded, view.data, send);
 await sendManagedContract(m.store, decoded, view.data, send);
 assert.equal(sends, 1); assert.equal(Object.keys(project(m.history()).benefits).length, 0);
 const ownCode = await issueCode(m.store, registered.contractId, admin('customer-issue'));
 assert.equal((await issueCode(m.store, registered.contractId, admin('customer-issue-again'))).value, ownCode.value);
 s = project(m.history()); assert.equal(Object.keys(s.benefits).length, 2);
 assert.equal(remainingBalance(s, registered.contractId), 900000);
 assert.equal(Object.values(s.benefits).filter(b => b.contractId === 'owner').reduce((n,b) => n + amounts(s,b).balance, 0), 50000);
 assert.throws(() => customerData({ ...body, referralCode: 123 }));
});
test('unknown and inactive codes retain the legacy discount without attributing rewards; known self-referral stays blocked', async () => {
 const m = memory(), code = await owner(m);
 const unknown = await registerSubmission(m.store, customerData({ ...body, referralCode: 'DM-AAAAAAAA' }), 'submission-invalid1', secret);
 let s = project(m.history());
 assert.equal(s.contracts[unknown.contractId].legacyPartnerDiscount, true);
 assert.equal(s.contracts[unknown.contractId].total, 1200000);
 assert.equal(Object.keys(s.referrals).length, 0);
 await assert.rejects(registerSubmission(m.store, customerData({ ...body, groomPhone: '010-9999-8888', referralCode: code.value }), 'submission-self-001', secret), /자기 추천/);
 await m.store.transaction(h => ({ events: execute(h, { type: 'code_status', code: code.value, active: false }, { ...admin('disable'), reason: 'test' }), result: true }));
 const inactive = await registerSubmission(m.store, customerData({ ...body, groomPhone: '01055551111', bridePhone: '01066662222', referralCode: code.value }), 'submission-inactive', secret);
 s = project(m.history());
 assert.equal(s.contracts[inactive.contractId].legacyPartnerDiscount, true);
 assert.equal(Object.keys(s.referrals).length, 0);
 assert.equal(Object.keys(s.contracts).length, 3);
});
test('duplicate submission IDs with different data are rejected and notification retries cannot resend mail', async () => {
 const m = memory(), d = customerData(body), r = await registerSubmission(m.store, d, 'submission-test-0002', secret);
 await assert.rejects(registerSubmission(m.store, { ...d, brideName: '다른고객' }, 'submission-test-0002', secret));
 let sends = 0;
 await notifySubmission(m.store, r.contractId, async () => { sends++; return { success: false }; });
 await notifySubmission(m.store, r.contractId, async () => { sends++; return { success: true }; });
 assert.equal(sends, 1);
});
test('an uncertain provider result blocks concurrent and repeated dispatch', async () => {
 const m = memory(), d = customerData(body), r = await registerSubmission(m.store, d, 'submission-test-0003', secret), decoded = verifyApprovalToken(r.token);
 let sends = 0, release!: () => void;
 const first = sendManagedContract(m.store, decoded, d, async () => { sends++; await new Promise<void>(r => { release = r; }); throw new Error('network'); });
 await new Promise(r => setTimeout(r, 0));
 await assert.rejects(sendManagedContract(m.store, decoded, d, async () => { sends++; }), /발송 처리 중/);
 release(); await assert.rejects(first, /발송 결과/); assert.equal(sends, 1);
 await assert.rejects(sendManagedContract(m.store, decoded, d, async () => { sends++; }), /발송 처리 중/);
});
test('Google adapter uses exactly the shared submission identity, approval token and contract number', async () => {
 const original = global.fetch, requests: any[] = [];
 global.fetch = async (_url, init) => { requests.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ success: true, customerEmailSent: true }), { status: 200 }); };
 try {
  const adapter = new GoogleAppsScriptAdapter('https://example.invalid');
  await adapter.submitContract({ formData: customerData(body), contractId: 'stable-id', approvalToken: 'stable-token', reviewUrl: 'stable-review' });
  await adapter.approveAndSendContract({ token: 'stable-token', updatedData: customerData(body), contractNumber: 'DM-STABLE-0001' });
  assert.equal(requests[0].payload.contractId, 'stable-id'); assert.equal(requests[0].payload.approvalToken, 'stable-token'); assert.equal(requests[1].payload.contractNumber, 'DM-STABLE-0001');
 } finally { global.fetch = original; }
});

test('storage failure after successful mail returns a warning and never sends again', async () => {
 const m = memory(), d = customerData(body), r = await registerSubmission(m.store, d, 'submission-test-0004', secret), decoded = verifyApprovalToken(r.token);
 const unreliable: ReferralStore = { transaction(operation) { return m.store.transaction(history => { const result = operation(history); if (result.events.some(e => e.type === 'contract_delivery_result')) throw new Error('isolated simulated storage failure'); return result; }); } };
 let sends = 0;
 const result = await sendManagedContract(unreliable, decoded, d, async () => { sends++; return { success: true, customerEmailSent: true }; });
 assert.equal(result.success, true); assert.match(result.warning, /메일은 발송/);
 await assert.rejects(sendManagedContract(unreliable, decoded, d, async () => { sends++; }), /발송 처리 중/);
 assert.equal(sends, 1);
});
test('representative price changes survive review reload and keep the same contract number', async () => {
 const m = memory(), d = customerData(body), r = await registerSubmission(m.store, d, 'submission-test-0005', secret), decoded = verifyApprovalToken(r.token);
 const changed = { ...d, manualAdjustment: { amount: -20000, reason: '대표 확정 조정' } };
 await sendManagedContract(m.store, decoded, changed, async (_data, number) => ({ success: true, customerEmailSent: true, contractNumber: number }));
 const view = managedReview(m.history(), decoded);
 assert.equal(calculateContractPrice(view.data).contractTotal, calculateContractPrice(changed).contractTotal);
 assert.equal(view.contractNumber, decoded.contractNumber);
});

test('free text discount survives review, sending and code issuance without double discount or invented owner rewards', async () => {
 const m = memory(), d = customerData({ ...body, partnerName: '  예전_짝꿍코드 김메모리  ' });
 const registered = await registerSubmission(m.store, d, 'submission-legacy001', secret);
 const decoded = verifyApprovalToken(registered.token), view = managedReview(m.history(), decoded);
 assert.equal(view.data.partnerName, '예전_짝꿍코드 김메모리');
 assert.equal(view.data.referralCode, ''); assert.equal(view.data.partnerDiscount, true);
 assert.equal(calculateContractPrice(view.data).contractTotal, 1200000);
 await sendManagedContract(m.store, decoded, view.data, async (data) => { assert.equal(calculateContractPrice(data).contractTotal, 1200000); return { success: true, customerEmailSent: true }; });
 await issueCode(m.store, registered.contractId, admin('legacy-issue'));
 const s = project(m.history());
 assert.equal(remainingBalance(s, registered.contractId), 900000);
 assert.equal(Object.keys(s.benefits).length, 0); assert.equal(Object.keys(s.referrals).length, 0);
 assert.equal(calculateContractPrice(managedReview(m.history(),decoded).data).contractTotal, 1200000);
});
