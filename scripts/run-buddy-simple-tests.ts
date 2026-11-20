import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Event } from '../src/lib/referrals/ledger';
import {
  BUDDY_REWARD_AMOUNT,
  applyBuddyCommand,
  buildBuddyReferralEvents,
  ownerTotals,
  projectBuddy,
} from '../src/lib/buddy/ledger';

function fixture() {
  let history: Event[] = [];
  let sequence = 0;
  const context = (reason = '테스트') => ({
    requestId: 'buddy-test-' + (++sequence),
    actor: 'admin-test',
    at: '2026-11-20T07:00:00.000Z',
    reason,
  });
  const run = (command: Parameters<typeof applyBuddyCommand>[1]) => {
    const events = applyBuddyCommand(history, command, context());
    history = [...history, ...events];
    return events;
  };
  const referral = (input: Parameters<typeof buildBuddyReferralEvents>[1]) => {
    const events = buildBuddyReferralEvents(history, input, context('계약서 자동 연결'));
    history = [...history, ...events];
    return events;
  };
  return { run, referral, state: () => projectBuddy(history), history: () => history };
}

test('YYMMDD-XXXX 형식으로 발급하고 본식일을 바꿔도 코드는 유지한다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: '요닝', weddingDate: '2027-11-13' });
  const before = f.state();
  const customer = Object.values(before.customers)[0];
  const code = Object.values(before.codes)[0];

  assert.match(code.value, /^271113-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  assert.equal(code.issuedWeddingDate, '2027-11-13');

  f.run({ type: 'update_customer', customerId: customer.id, weddingDate: '2027-11-20' });
  const after = f.state();
  assert.equal(after.customers[customer.id].weddingDate, '2027-11-20');
  assert.equal(Object.values(after.codes)[0].value, code.value);
});

test('같은 신부명과 본식일 중복 생성은 기본 차단하고 관리자 강제 생성만 허용한다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: '김민지', weddingDate: '2027-05-30' });
  assert.throws(() => f.run({ type: 'create_customer', brideName: '김민지', weddingDate: '2027-05-30' }), /이미 등록된 고객/);
  f.run({ type: 'create_customer', brideName: '김민지', weddingDate: '2027-05-30', force: true });
  assert.equal(Object.keys(f.state().codes).length, 2);
});

test('한 코드가 여러 번 사용되면 건당 5만원씩 코드 주인 혜택이 누적된다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: '요닝', weddingDate: '2027-11-13' });
  const state = f.state();
  const customer = Object.values(state.customers)[0];
  const code = Object.values(state.codes)[0];

  ['정수정', '공민지', '김연경', '주유리', '한다경'].forEach((name, index) => {
    f.referral({
      code: code.value,
      referredBrideName: name,
      referredWeddingDate: `2027-${String(index + 4).padStart(2, '0')}-04`,
      sourceContractId: 'contract-' + index,
    });
  });

  const totals = ownerTotals(f.state(), customer.id);
  assert.equal(totals.validUseCount, 5);
  assert.equal(totals.totalBenefit, BUDDY_REWARD_AMOUNT * 5);
  assert.equal(totals.outstanding, 250000);
});

test('코드 소유자의 본식이 지나도 코드는 만료되지 않고 추천을 계속 받을 수 있다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: '요닝', weddingDate: '2025-01-01' });
  const state = f.state();
  const customer = Object.values(state.customers)[0];
  const code = Object.values(state.codes)[0];

  f.referral({
    code: code.value,
    referredBrideName: '2028신부',
    referredWeddingDate: '2028-03-01',
    sourceContractId: 'future-contract',
  });

  assert.equal(f.state().codes[code.value].active, true);
  assert.equal(ownerTotals(f.state(), customer.id).totalBenefit, 50000);
});

test('취소/무효 건은 이력에 남지만 유효 혜택 합계에서 제외된다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-01-01' });
  const state = f.state();
  const customer = Object.values(state.customers)[0];
  const code = Object.values(state.codes)[0];

  f.referral({ code: code.value, referredBrideName: 'B', referredWeddingDate: '2027-02-01' });
  f.referral({ code: code.value, referredBrideName: 'C', referredWeddingDate: '2027-03-01' });

  const referrals = Object.values(f.state().referrals);
  f.run({ type: 'referral_status', referralId: referrals[0].id, status: 'cancelled' });

  const totals = ownerTotals(f.state(), customer.id);
  assert.equal(totals.useCount, 2);
  assert.equal(totals.validUseCount, 1);
  assert.equal(totals.totalBenefit, 50000);
});

test('지급은 추천 건별 남은 금액까지만 기록하고 페이백을 지원한다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2025-01-01' });
  const code = Object.values(f.state().codes)[0];
  f.referral({ code: code.value, referredBrideName: 'B', referredWeddingDate: '2027-02-01' });
  const referral = Object.values(f.state().referrals)[0];

  f.run({ type: 'record_payment', referralId: referral.id, amount: 20000, method: 'payback', paidAt: '2026-11-20' });
  assert.throws(
    () => f.run({ type: 'record_payment', referralId: referral.id, amount: 40000, method: 'payback', paidAt: '2026-11-20' }),
    /남은 지급 가능 금액/,
  );
  f.run({ type: 'record_payment', referralId: referral.id, amount: 30000, method: 'payback', paidAt: '2026-11-20' });

  const customer = Object.values(f.state().customers)[0];
  const totals = ownerTotals(f.state(), customer.id);
  assert.equal(totals.paid, 50000);
  assert.equal(totals.outstanding, 0);
});

test('코드는 공백 제거/대문자 변환만 허용하고 다른 오타는 자동 연결하지 않는다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-01-01' });
  const code = Object.values(f.state().codes)[0];

  assert.equal(f.referral({ code: '  ' + code.value.toLowerCase() + '  ', referredBrideName: 'B', referredWeddingDate: '2027-02-01' }).length, 1);
  assert.equal(f.referral({ code: code.value.replace('-', ''), referredBrideName: 'C', referredWeddingDate: '2027-03-01' }).length, 0);
});

test('동일 코드·신부명·본식일 중복 사용은 한 번만 기록한다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-01-01' });
  const code = Object.values(f.state().codes)[0];
  const input = { code: code.value, referredBrideName: 'B', referredWeddingDate: '2027-02-01' };

  f.referral(input);
  f.referral(input);
  assert.equal(Object.keys(f.state().referrals).length, 1);
});

test('자기 추천으로 보이는 동일 신부명·본식일은 자동 유효 처리하지 않고 확인필요로 남긴다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: '요닝', weddingDate: '2027-11-13' });
  const code = Object.values(f.state().codes)[0];
  f.referral({ code: code.value, referredBrideName: '요닝', referredWeddingDate: '2027-11-13' });
  assert.equal(Object.values(f.state().referrals)[0].status, 'needs_review');
});
