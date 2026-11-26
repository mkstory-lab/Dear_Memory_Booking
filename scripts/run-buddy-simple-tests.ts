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

test('공백/소문자는 정상 연결하고 유사 코드는 자동 승인하지 않고 확인필요로 남긴다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-01-01' });
  const code = Object.values(f.state().codes)[0];

  assert.equal(f.referral({ code: '  ' + code.value.toLowerCase() + '  ', referredBrideName: 'B', referredWeddingDate: '2027-02-01' }).length, 1);
  const missingHyphen = f.referral({ code: code.value.replace('-', ''), referredBrideName: 'C', referredWeddingDate: '2027-03-01' });
  assert.equal(missingHyphen.length, 1);
  assert.equal(Object.values(f.state().referrals).find(r => r.referredBrideName === 'C')?.status, 'needs_review');

  const suffix = code.value.slice(-4);
  const replacement = suffix[0] === 'A' ? 'B' : 'A';
  const typo = code.value.slice(0, -4) + replacement + suffix.slice(1);
  f.referral({ code: typo, referredBrideName: 'D', referredWeddingDate: '2027-04-01' });
  const typoReferral = Object.values(f.state().referrals).find(r => r.referredBrideName === 'D');
  assert.equal(typoReferral?.status, 'needs_review');
  assert.equal(typoReferral?.code, code.value);
  assert.equal(typoReferral?.enteredCode, typo);
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

test('기존 한글 코드 수동 등록 및 구분자 변형, 중복 방지, 비활성 차단', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-11-13', manualCode: '271113_테스트' });
  const code = '271113_테스트';
  const owner = Object.values(f.state().customers)[0];
  assert.equal(f.state().codes[code].active, true);
  assert.throws(() => f.run({ type: 'create_customer', brideName: 'Z', weddingDate: '2027-11-13', manualCode: '271113테스트' }), /이미 등록된 짝꿍코드/);
  for (const [i, alias] of [code, '271113테스트', '271113 테스트'].entries()) {
    const input = { code: alias, referredBrideName: 'B' + i, referredWeddingDate: '2027-01-01' };
    f.referral(input);
    f.referral(input);
  }
  assert.equal(ownerTotals(f.state(), owner.id).totalBenefit, 150000);
  assert.equal(f.referral({ code: '271113_다른별명', referredBrideName: 'X', referredWeddingDate: '2027-01-01' }).length, 0);
  f.run({ type: 'code_status', code, active: false });
  assert.equal(f.referral({ code, referredBrideName: 'Y', referredWeddingDate: '2027-01-01' }).length, 0);
});

test('날짜 없는 임의 한글 및 영문 기존 코드도 등록하며 미등록 코드는 적립하지 않는다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-11-13', manualCode: '기존닉네임' });
  f.run({ type: 'create_customer', brideName: 'C', weddingDate: '2027-11-14', manualCode: 'Old-code_123' });
  f.referral({ code: '기존닉네임', referredBrideName: 'B', referredWeddingDate: '2027-01-01' });
  f.referral({ code: 'old-code_123', referredBrideName: 'D', referredWeddingDate: '2027-01-02' });
  assert.equal(Object.values(f.state().referrals).length, 2);
  assert.equal(f.referral({ code: '기존닉네임오타', referredBrideName: 'E', referredWeddingDate: '2027-01-03' }).length, 0);
  assert.throws(() => f.run({ type: 'create_customer', brideName: 'F', weddingDate: '2027-11-15', manualCode: 'DM-ABCDEFGH' }));
});

test('과거 사용 일괄 등록은 중복 없이 유효 건만 추가한다', () => {
  const f = fixture();
  f.run({ type: 'create_customer', brideName: 'A', weddingDate: '2027-01-01', manualCode: '기존코드' });
  const code = Object.values(f.state().codes)[0].value;
  const owner = Object.values(f.state().customers)[0];
  const rows = [{ referredBrideName: 'B', referredWeddingDate: '2027-02-01' }, { referredBrideName: 'C', referredWeddingDate: '2027-03-01' }];
  f.run({ type: 'manual_referrals', code, rows: [...rows, rows[0]] });
  f.run({ type: 'manual_referrals', code, rows });
  assert.equal(ownerTotals(f.state(), owner.id).totalBenefit, 100000);
  assert.throws(() => f.run({ type: 'manual_referrals', code, rows: [{ referredBrideName: 'D', referredWeddingDate: 'invalid' }] }));
  assert.throws(() => f.run({ type: 'manual_referrals', code, rows: [{ referredBrideName: 'A', referredWeddingDate: '2027-01-01' }] }));
});
