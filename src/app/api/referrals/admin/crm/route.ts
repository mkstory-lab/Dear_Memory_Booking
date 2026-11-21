import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_STAGES, projectAdminCrm } from '@/lib/admin/crm';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { execute, project, type Event } from '@/lib/referrals/ledger';
import { referralSettings, referralStore } from '@/lib/referrals/server';

export const dynamic = 'force-dynamic';

const responseHeaders = { 'Cache-Control': 'no-store' };

function actor(request: NextRequest) {
  return verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
    referralSettings().sessionSecret,
  )?.actor;
}

function requestId(value: unknown) {
  const id = String(value || '');
  if (!/^[a-zA-Z0-9:_-]{8,160}$/.test(id)) throw new Error('요청 ID를 확인해 주세요.');
  return id;
}

function contractId(value: unknown) {
  const id = String(value || '');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('계약 정보를 확인해 주세요.');
  return id;
}

async function snapshot() {
  return referralStore().transaction(history => ({ events: [], result: projectAdminCrm(history) }));
}

export async function GET(request: NextRequest) {
  try {
    if (!actor(request)) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers: responseHeaders });
    return NextResponse.json(await snapshot(), { headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: '관리 저장소 연결을 확인해 주세요.' }, { status: 503, headers: responseHeaders });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({}, { status: 403, headers: responseHeaders });
  try {
    const user = actor(request);
    if (!user) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers: responseHeaders });
    const text = await request.text();
    if (text.length > 12_000) throw new Error('입력 내용이 너무 깁니다.');
    const body = JSON.parse(text) as Record<string, unknown>;
    const id = requestId(body.requestId);
    const command = body.command as Record<string, unknown> | undefined;
    if (!command) throw new Error('작업 내용을 확인해 주세요.');
    const targetId = contractId(command.contractId);
    const at = new Date().toISOString();
    const store = referralStore();

    await store.transaction(history => {
      const contract = project(history).contracts[targetId];
      if (!contract) throw new Error('계약을 찾을 수 없습니다.');
      if (command.type === 'update_customer') {
        const stage = String(command.stage || '');
        const memo = String(command.memo || '').trim();
        const groomPhone = String(command.groomPhone || '').trim().slice(0, 40);
        const bridePhone = String(command.bridePhone || '').trim().slice(0, 40);
        const weddingTime = String(command.weddingTime || '').trim().slice(0, 40);
        const weddingVenue = String(command.weddingVenue || '').trim().slice(0, 200);
        const weddingHall = String(command.weddingHall || '').trim().slice(0, 200);
        if (!CUSTOMER_STAGES.includes(stage as (typeof CUSTOMER_STAGES)[number])) throw new Error('진행 단계를 확인해 주세요.');
        if (memo.length > 2_000) throw new Error('관리자 메모는 2,000자 이내로 입력해 주세요.');
        const data = { contractId: targetId, stage, memo, groomPhone, bridePhone, weddingTime, weddingVenue, weddingHall };
        const previous = history.find(event => event.requestId === id && event.type === 'crm_customer_updated');
        if (previous) {
          if (JSON.stringify(previous.data) !== JSON.stringify(data)) throw new Error('같은 요청 ID에 다른 작업을 사용할 수 없습니다.');
          return { events: [], result: true };
        }
        const event: Event = { id: `${id}:crm`, requestId: id, actor: user, at, reason: '통합 관리자 고객 정보 수정', type: 'crm_customer_updated', data };
        return { events: [event], result: true };
      }
      if (contract.status === 'cancelled') throw new Error('취소된 계약의 입금 상태는 변경할 수 없습니다.');
      if (command.type === 'confirm_deposit') {
        return { events: execute(history, { type: 'deposit', contractId: targetId }, { requestId: id, actor: user, role: 'admin', at, reason: '통합 관리자에서 계약금 입금 확인' }), result: true };
      }
      if (command.type === 'record_payment') {
        const amount = Number(command.amount);
        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000) throw new Error('입금액을 확인해 주세요.');
        return { events: execute(history, { type: 'payment', contractId: targetId, amount }, { requestId: id, actor: user, role: 'admin', at, reason: '통합 관리자에서 잔금 입금 확인' }), result: true };
      }
      throw new Error('지원하지 않는 관리 작업입니다.');
    });

    return NextResponse.json(await snapshot(), { headers: responseHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '저장하지 못했습니다.' }, { status: 400, headers: responseHeaders });
  }
}

