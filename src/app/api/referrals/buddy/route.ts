import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';
import {
  applyBuddyCommand,
  buddySummary,
  ownerTotals,
  projectBuddy,
  type BuddyCommand,
} from '@/lib/buddy/ledger';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

function actor(req: NextRequest) {
  return verifySession(
    req.cookies.get(SESSION_COOKIE)?.value,
    referralSettings().sessionSecret,
  )?.actor;
}

function commandFrom(input: unknown): BuddyCommand {
  if (!input || typeof input !== 'object') throw new Error('작업 내용을 확인해 주세요.');
  const value = input as Record<string, unknown>;
  const type = value.type;

  if (type === 'create_customer') {
    return {
      type,
      brideName: String(value.brideName || ''),
      weddingDate: String(value.weddingDate || ''),
      memo: typeof value.memo === 'string' ? value.memo : '',
      force: value.force === true,
      manualCode: typeof value.manualCode === 'string' ? value.manualCode : undefined,
    };
  }

  if (type === 'update_customer') {
    return {
      type,
      customerId: String(value.customerId || ''),
      brideName: value.brideName === undefined ? undefined : String(value.brideName),
      weddingDate: value.weddingDate === undefined ? undefined : String(value.weddingDate),
      memo: value.memo === undefined ? undefined : String(value.memo),
    };
  }

  if (type === 'code_status') {
    return { type, code: String(value.code || ''), active: value.active === true };
  }

  if (type === 'manual_referral') {
    return {
      type,
      code: String(value.code || ''),
      referredBrideName: String(value.referredBrideName || ''),
      referredWeddingDate: String(value.referredWeddingDate || ''),
    };
  }

  if (type === 'referral_status') {
    const status = value.status;
    if (!['valid', 'cancelled', 'invalid'].includes(String(status))) throw new Error('추천 상태를 확인해 주세요.');
    return {
      type,
      referralId: String(value.referralId || ''),
      status: status as 'valid' | 'cancelled' | 'invalid',
    };
  }

  if (type === 'record_payment') {
    const method = String(value.method || '');
    if (!['balance_discount', 'payback', 'other'].includes(method)) throw new Error('지급 방식을 확인해 주세요.');
    return {
      type,
      referralId: String(value.referralId || ''),
      amount: Number(value.amount),
      method: method as 'balance_discount' | 'payback' | 'other',
      paidAt: String(value.paidAt || ''),
      memo: typeof value.memo === 'string' ? value.memo : '',
    };
  }

  throw new Error('지원하지 않는 작업입니다.');
}

async function snapshot() {
  return referralStore().transaction(history => {
    const state = projectBuddy(history);
    const rows = Object.values(state.customers)
      .map(customer => {
        const code = Object.values(state.codes).find(item => item.customerId === customer.id);
        return { customer, code, totals: ownerTotals(state, customer.id) };
      })
      .sort((a, b) => a.customer.weddingDate.localeCompare(b.customer.weddingDate) || a.customer.brideName.localeCompare(b.customer.brideName, 'ko'));

    return {
      events: [],
      result: {
        state,
        summary: buddySummary(state),
        rows,
        audit: history.filter(event => event.type.startsWith('buddy_')).slice(-500),
      },
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    if (!actor(req)) {
      return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    }
    return NextResponse.json(await snapshot(), { headers });
  } catch {
    return NextResponse.json({ error: '짝꿍코드 저장소 연결을 확인해 주세요.' }, { status: 503, headers });
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({}, { status: 403, headers });

  try {
    const user = actor(req);
    if (!user) {
      return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    }

    const text = await req.text();
    if (text.length > 10_000) throw new Error('입력 내용이 너무 깁니다.');

    const body = JSON.parse(text) as Record<string, unknown>;
    const requestId = String(body.requestId || '');
    if (!/^[a-zA-Z0-9:_-]{8,160}$/.test(requestId)) throw new Error('요청 ID를 확인해 주세요.');

    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    const command = commandFrom(body.command);
    const context = {
      requestId,
      actor: user,
      at: new Date().toISOString(),
      reason,
    };

    const store = referralStore();
    await store.transaction(history => ({
      events: applyBuddyCommand(history, command, context),
      result: true,
    }));

    return NextResponse.json(await snapshot(), { headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '저장에 실패했습니다.' },
      { status: 400, headers },
    );
  }
}
