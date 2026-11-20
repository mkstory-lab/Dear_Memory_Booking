import { randomInt, randomUUID } from 'node:crypto';
import type { Event } from '@/lib/referrals/ledger';

export const BUDDY_REWARD_AMOUNT = 50_000;
export const BUDDY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type BuddyCustomer = {
  id: string;
  brideName: string;
  weddingDate: string;
  memo?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type BuddyCode = {
  value: string;
  customerId: string;
  active: boolean;
  issuedWeddingDate: string;
  createdAt: string;
};

export type BuddyReferralStatus = 'valid' | 'cancelled' | 'invalid' | 'needs_review';

export type BuddyReferral = {
  id: string;
  code: string;
  enteredCode?: string;
  ownerCustomerId: string;
  referredBrideName: string;
  referredWeddingDate: string;
  sourceContractId?: string;
  benefitAmount: number;
  status: BuddyReferralStatus;
  createdAt: string;
  updatedAt: string;
};

export type BuddyPaymentMethod = 'balance_discount' | 'payback' | 'other';

export type BuddyPayment = {
  id: string;
  referralId: string;
  ownerCustomerId: string;
  amount: number;
  method: BuddyPaymentMethod;
  paidAt: string;
  memo?: string;
  createdAt: string;
};

export type BuddyState = {
  customers: Record<string, BuddyCustomer>;
  codes: Record<string, BuddyCode>;
  referrals: Record<string, BuddyReferral>;
  payments: BuddyPayment[];
};

export type BuddyContext = {
  requestId: string;
  actor: string;
  at: string;
  reason?: string;
};

export type BuddyCommand =
  | { type: 'create_customer'; brideName: string; weddingDate: string; memo?: string; force?: boolean }
  | { type: 'update_customer'; customerId: string; brideName?: string; weddingDate?: string; memo?: string }
  | { type: 'code_status'; code: string; active: boolean }
  | { type: 'manual_referral'; code: string; referredBrideName: string; referredWeddingDate: string }
  | { type: 'referral_status'; referralId: string; status: Exclude<BuddyReferralStatus, 'needs_review'> }
  | { type: 'record_payment'; referralId: string; amount: number; method: BuddyPaymentMethod; paidAt: string; memo?: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE_PATTERN = /^\d{6}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

function event(ctx: BuddyContext, type: string, data: unknown, index = 0): Event {
  return {
    id: `${ctx.requestId}:buddy:${index}`,
    requestId: ctx.requestId,
    actor: ctx.actor,
    at: ctx.at,
    reason: ctx.reason || '',
    type,
    data,
  };
}

function validDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function cleanBrideName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function assertRequest(ctx: BuddyContext) {
  if (!ctx.requestId || !ctx.actor || !Number.isFinite(Date.parse(ctx.at))) throw new Error('요청 정보를 확인해 주세요.');
}

function assertBrideAndDate(brideName: string, weddingDate: string) {
  if (!cleanBrideName(brideName) || cleanBrideName(brideName).length > 80) throw new Error('신부 성함을 확인해 주세요.');
  if (!validDate(weddingDate)) throw new Error('본식 날짜를 확인해 주세요.');
}

export function normalizeBuddyCode(value: string) {
  return value.trim().toUpperCase();
}

export function isBuddyCode(value: string) {
  return CODE_PATTERN.test(normalizeBuddyCode(value));
}

function compactBuddyCode(value: string) {
  return normalizeBuddyCode(value).replace(/[^A-Z0-9]/g, '');
}

function editDistanceAtMostOne(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left === right) return true;

  if (left.length === right.length) {
    let differences = 0;
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i] && ++differences > 1) return false;
    }
    return true;
  }

  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
      continue;
    }
    if (skipped) return false;
    skipped = true;
    j++;
  }
  return true;
}

function similarActiveCode(state: BuddyState, entered: string) {
  const compact = compactBuddyCode(entered);
  if (compact.length < 9 || compact.length > 11 || !/^\d{6}/.test(compact)) return undefined;

  return Object.values(state.codes)
    .filter(code => code.active)
    .find(code => {
      const known = compactBuddyCode(code.value);
      return known.slice(0, 6) === compact.slice(0, 6) && editDistanceAtMostOne(known, compact);
    });
}

export function projectBuddy(history: Event[]): BuddyState {
  const state: BuddyState = { customers: {}, codes: {}, referrals: {}, payments: [] };

  for (const e of history) {
    const d = e.data as any;
    switch (e.type) {
      case 'buddy_customer_created':
        state.customers[d.id] = { ...d };
        break;
      case 'buddy_customer_updated':
        if (state.customers[d.id]) {
          state.customers[d.id] = { ...state.customers[d.id], ...d.patch, updatedAt: e.at };
        }
        break;
      case 'buddy_code_issued':
        state.codes[d.value] = { ...d };
        break;
      case 'buddy_code_status':
        if (state.codes[d.code]) state.codes[d.code] = { ...state.codes[d.code], active: d.active };
        break;
      case 'buddy_referral_recorded':
        state.referrals[d.id] = { ...d };
        break;
      case 'buddy_referral_status':
        if (state.referrals[d.referralId]) {
          state.referrals[d.referralId] = { ...state.referrals[d.referralId], status: d.status, updatedAt: e.at };
        }
        break;
      case 'buddy_payment_recorded':
        state.payments.push({ ...d });
        break;
    }
  }

  return state;
}

export function generateBuddyCode(weddingDate: string, state: BuddyState) {
  if (!validDate(weddingDate)) throw new Error('본식 날짜를 확인해 주세요.');
  const prefix = weddingDate.slice(2).replaceAll('-', '');

  for (let attempt = 0; attempt < 128; attempt++) {
    const suffix = Array.from({ length: 4 }, () => BUDDY_ALPHABET[randomInt(BUDDY_ALPHABET.length)]).join('');
    const candidate = `${prefix}-${suffix}`;
    if (!state.codes[candidate]) return candidate;
  }

  throw new Error('짝꿍코드 생성에 실패했습니다. 다시 시도해 주세요.');
}

export function ownerTotals(state: BuddyState, customerId: string) {
  const referrals = Object.values(state.referrals).filter(r => r.ownerCustomerId === customerId);
  const valid = referrals.filter(r => r.status === 'valid');
  const totalBenefit = valid.reduce((sum, r) => sum + r.benefitAmount, 0);
  const paid = state.payments
    .filter(p => p.ownerCustomerId === customerId)
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    useCount: referrals.length,
    validUseCount: valid.length,
    totalBenefit,
    paid,
    outstanding: Math.max(0, totalBenefit - paid),
  };
}

export function buddySummary(state: BuddyState) {
  const customerIds = Object.keys(state.customers);
  const totalBenefit = customerIds.reduce((sum, id) => sum + ownerTotals(state, id).totalBenefit, 0);
  const paid = state.payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    issuedCodes: Object.keys(state.codes).length,
    referralCount: Object.keys(state.referrals).length,
    validReferralCount: Object.values(state.referrals).filter(r => r.status === 'valid').length,
    totalBenefit,
    paid,
    outstanding: Math.max(0, totalBenefit - paid),
  };
}

function requestAlreadyApplied(history: Event[], ctx: BuddyContext) {
  return history.some(e => e.requestId === ctx.requestId && e.type.startsWith('buddy_'));
}

export function buildBuddyReferralEvents(history: Event[], input: {
  code: string;
  referredBrideName: string;
  referredWeddingDate: string;
  sourceContractId?: string;
}, ctx: BuddyContext): Event[] {
  assertRequest(ctx);
  assertBrideAndDate(input.referredBrideName, input.referredWeddingDate);
  if (requestAlreadyApplied(history, ctx)) return [];

  const enteredCode = normalizeBuddyCode(input.code);
  const state = projectBuddy(history);
  const exactCode = isBuddyCode(enteredCode) ? state.codes[enteredCode] : undefined;
  const suggestedCode = exactCode?.active ? exactCode : similarActiveCode(state, enteredCode);
  if (!suggestedCode) return [];

  const codeValue = suggestedCode.value;
  const exactActiveMatch = exactCode?.active === true && exactCode.value === codeValue;

  const duplicate = Object.values(state.referrals).some(r =>
    r.code === codeValue &&
    ((input.sourceContractId && r.sourceContractId === input.sourceContractId) ||
      (cleanBrideName(r.referredBrideName) === cleanBrideName(input.referredBrideName) &&
       r.referredWeddingDate === input.referredWeddingDate))
  );
  if (duplicate) return [];

  const owner = state.customers[suggestedCode.customerId];
  if (!owner) return [];

  const selfReferral = cleanBrideName(owner.brideName) === cleanBrideName(input.referredBrideName) &&
    owner.weddingDate === input.referredWeddingDate;

  const needsReview = !exactActiveMatch || selfReferral;
  const now = ctx.at;
  return [event(ctx, 'buddy_referral_recorded', {
    id: 'buddy_ref_' + randomUUID(),
    code: codeValue,
    enteredCode,
    ownerCustomerId: owner.id,
    referredBrideName: cleanBrideName(input.referredBrideName),
    referredWeddingDate: input.referredWeddingDate,
    sourceContractId: input.sourceContractId,
    benefitAmount: BUDDY_REWARD_AMOUNT,
    status: needsReview ? 'needs_review' : 'valid',
    createdAt: now,
    updatedAt: now,
  })];
}

export function applyBuddyCommand(history: Event[], command: BuddyCommand, ctx: BuddyContext): Event[] {
  assertRequest(ctx);
  if (requestAlreadyApplied(history, ctx)) return [];

  const state = projectBuddy(history);
  const now = ctx.at;

  if (command.type === 'create_customer') {
    assertBrideAndDate(command.brideName, command.weddingDate);
    const brideName = cleanBrideName(command.brideName);
    const duplicate = Object.values(state.customers).find(c =>
      cleanBrideName(c.brideName) === brideName && c.weddingDate === command.weddingDate
    );
    if (duplicate && !command.force) {
      const existingCode = Object.values(state.codes).find(c => c.customerId === duplicate.id);
      throw new Error(`이미 등록된 고객입니다.${existingCode ? ' 기존 코드: ' + existingCode.value : ''}`);
    }

    const id = 'buddy_customer_' + randomUUID();
    const code = generateBuddyCode(command.weddingDate, state);
    return [
      event(ctx, 'buddy_customer_created', {
        id,
        brideName,
        weddingDate: command.weddingDate,
        memo: command.memo?.trim().slice(0, 500) || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }, 0),
      event(ctx, 'buddy_code_issued', {
        value: code,
        customerId: id,
        active: true,
        issuedWeddingDate: command.weddingDate,
        createdAt: now,
      }, 1),
    ];
  }

  if (command.type === 'update_customer') {
    const customer = state.customers[command.customerId];
    if (!customer) throw new Error('고객을 찾을 수 없습니다.');
    const brideName = command.brideName === undefined ? customer.brideName : cleanBrideName(command.brideName);
    const weddingDate = command.weddingDate === undefined ? customer.weddingDate : command.weddingDate;
    assertBrideAndDate(brideName, weddingDate);
    return [event(ctx, 'buddy_customer_updated', {
      id: customer.id,
      patch: {
        brideName,
        weddingDate,
        memo: command.memo === undefined ? customer.memo || '' : command.memo.trim().slice(0, 500),
      },
    })];
  }

  if (command.type === 'code_status') {
    const codeValue = normalizeBuddyCode(command.code);
    const code = state.codes[codeValue];
    if (!code) throw new Error('짝꿍코드를 찾을 수 없습니다.');
    if (code.active === command.active) return [];
    return [event(ctx, 'buddy_code_status', { code: codeValue, active: command.active })];
  }

  if (command.type === 'manual_referral') {
    return buildBuddyReferralEvents(history, {
      code: command.code,
      referredBrideName: command.referredBrideName,
      referredWeddingDate: command.referredWeddingDate,
    }, ctx);
  }

  if (command.type === 'referral_status') {
    const referral = state.referrals[command.referralId];
    if (!referral) throw new Error('추천 이력을 찾을 수 없습니다.');
    if (referral.status === command.status) return [];
    return [event(ctx, 'buddy_referral_status', { referralId: referral.id, status: command.status })];
  }

  if (command.type === 'record_payment') {
    const referral = state.referrals[command.referralId];
    if (!referral || referral.status !== 'valid') throw new Error('유효한 추천 건만 지급 처리할 수 있습니다.');
    if (!Number.isSafeInteger(command.amount) || command.amount <= 0) throw new Error('지급 금액을 확인해 주세요.');
    if (!validDate(command.paidAt)) throw new Error('지급일을 확인해 주세요.');
    if (!['balance_discount', 'payback', 'other'].includes(command.method)) throw new Error('지급 방식을 확인해 주세요.');

    const alreadyPaid = state.payments
      .filter(p => p.referralId === referral.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = referral.benefitAmount - alreadyPaid;
    if (remaining <= 0) throw new Error('이미 전액 지급된 추천 건입니다.');
    if (command.amount > remaining) throw new Error(`이 추천 건의 남은 지급 가능 금액은 ${remaining.toLocaleString('ko-KR')}원입니다.`);

    return [event(ctx, 'buddy_payment_recorded', {
      id: 'buddy_payment_' + randomUUID(),
      referralId: referral.id,
      ownerCustomerId: referral.ownerCustomerId,
      amount: command.amount,
      method: command.method,
      paidAt: command.paidAt,
      memo: command.memo?.trim().slice(0, 500) || '',
      createdAt: now,
    })];
  }

  return [];
}
