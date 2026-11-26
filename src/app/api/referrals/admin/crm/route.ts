import { createHmac, randomUUID } from 'node:crypto';
import { deliveryEligible, validateDeliveryDate, seoulDay } from '@/lib/admin/delivery';
import { recoverable, recoveryEvents, type OriginalRows } from '@/lib/admin/recoverMetadata';
import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_STAGES, projectAdminCrm } from '@/lib/admin/crm';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { execute, project, type Event } from '@/lib/referrals/ledger';
import { projectStaff } from '@/lib/admin/staff';
import { referralSettings, referralStore } from '@/lib/referrals/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    const at = new Date().toISOString();
    const store = referralStore();

    if (command.type === 'recover_verified_original_rows') {
      if (!Array.isArray(command.originals) || command.originals.length < 1 || command.originals.length > 10) throw new Error('검증된 원본은 한 번에 1~10건을 입력해 주세요.');
      const fields = ['계약번호','신랑 성명','신부 성명','예식일','예식장','홀','예식시간','신랑 연락처','신부 연락처','고객 이메일','선택상품','추가옵션'];
      const originals = command.originals.map((raw:unknown)=>{
        if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('원본 입력 형식을 확인해 주세요.');
        const row=raw as Record<string,unknown>;
        const targetId=contractId(row.contractId);
        if(!row.rows || typeof row.rows!=='object' || Array.isArray(row.rows)) throw new Error('원본 항목을 확인해 주세요.');
        const rows:OriginalRows={};
        for(const [key,value] of Object.entries(row.rows as Record<string,unknown>)) {
          if(!fields.includes(key) || typeof value!=='string' || value.length>200) throw new Error('허용되지 않는 원본 입력 항목입니다.');
          rows[key]=value;
        }
        return {contractId:targetId,rows};
      });
      if(new Set(originals.map(x=>x.contractId)).size!==originals.length) throw new Error('중복된 계약이 있습니다.');
      const report=await store.transaction(history=>{
        const events:Event[]=[];
        const result:Array<{number:string;fields:string[];error?:string}>=[];
        for(const original of originals) {
          const current=projectAdminCrm([...history,...events]).contracts.find(c=>c.id===original.contractId);
          if(!current || !recoverable(current)) {result.push({number:original.rows['계약번호']||original.contractId,fields:[],error:'복구 대상 아님'});continue;}
          try {
            const next=recoveryEvents([...history,...events],original.contractId,original.rows,{requestId:id,actor:user,at});
            for(const event of next)event.reason='관리자가 보관 원본 이미지 또는 엑셀과 대조한 누락 정보 복구';
            events.push(...next);
            result.push({number:current.number,fields:Object.keys(next.find(e=>e.type==='crm_import_metadata_recovered')?.data.patch||{})});
          }catch(e){result.push({number:current.number,fields:[],error:e instanceof Error?e.message:'원본 대조 실패'});}
        }
        return {events,result};
      });
      return NextResponse.json({...await snapshot(),recoveryReport:report},{headers:responseHeaders});
    }

    if (command.type === 'recover_imported_metadata') {
      if (!Array.isArray(command.contractIds) || command.contractIds.length < 1 || command.contractIds.length > 4) throw new Error('복구 대상은 한 번에 1~4건으로 지정해 주세요.');
      const ids = [...new Set(command.contractIds.map(contractId))];
      const candidates = (await snapshot()).contracts.filter(c => ids.includes(c.id) && recoverable(c));
      const {secret,url} = referralSettings();
      const originals = await Promise.all(candidates.map(async c => {
        try {
          const body = JSON.stringify({operation:'read_original',timestamp:Date.now(),folderUrl:c.driveFolderUrl,contractNumber:c.number});
          const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revise_contract',payload:{body,signature:createHmac('sha256',secret).update(body).digest('hex')}}),cache:'no-store',signal:AbortSignal.timeout(20000)});
          const result = await res.json();
          if (!res.ok || !result.success || !result.rows || typeof result.rows !== 'object') throw new Error('원본 엑셀 조회 실패');
          return {contractId:c.id,number:c.number,rows:result.rows as OriginalRows};
        } catch { return {contractId:c.id,number:c.number,error:'원본 엑셀 조회 실패'}; }
      }));
      const report = await store.transaction(history => {
        const events: Event[] = [];
        const result: Array<{number:string; fields:string[]; error?:string}> = [];
        for (const source of originals) {
          if (!source.rows) {result.push({number:source.number,fields:[],error:source.error});continue;}
          try {
            const next = recoveryEvents([...history,...events],source.contractId,source.rows,{requestId:id,actor:user,at});
            events.push(...next);
            result.push({number:source.number,fields:Object.keys(next.find(e=>e.type==='crm_import_metadata_recovered')?.data.patch || {})});
          } catch (e) { result.push({number:source.number,fields:[],error:e instanceof Error ? e.message : '원본 대조 실패'}); }
        }
        return {events,result};
      });
      return NextResponse.json({...await snapshot(),recoveryReport:report},{headers:responseHeaders});
    }

    await store.transaction(history => {
      if (command.type === 'create_manual_schedule') {
        const staffState = projectStaff(history);
        const title = String(command.title || '').trim();
        const date = String(command.date || '').trim();
        const time = String(command.time || '').trim().slice(0, 40);
        const venue = String(command.venue || '').trim().slice(0, 200);
        const details = String(command.details || '').trim().slice(0, 2000);
        const contact = String(command.contact || '').trim().slice(0, 100);
        const staffIds = Array.isArray(command.staffIds) ? [...new Set(command.staffIds.map(String))] : [];
        if (!title || title.length > 120) throw new Error('일정 제목은 1~120자로 입력해 주세요.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error('일정 날짜를 확인해 주세요.');
        if (!staffIds.length) throw new Error('일정을 배정할 작가를 한 명 이상 선택해 주세요.');
        if (staffIds.some(id => !staffState.staff[id] || !staffState.staff[id].active)) throw new Error('활성 상태인 작가만 배정할 수 있습니다.');
        const event: Event = {
          id: `${id}:manual`,
          requestId: id,
          actor: user,
          at,
          reason: '통합 관리자 달력에서 수동 일정 등록',
          type: 'crm_staff_manual_schedule_created',
          data: { id: 'manual_' + randomUUID().replace(/-/g, '').slice(0, 20), title, date, time, venue, details, contact, staffIds },
        };
        return { events: [event], result: true };
      }
      if (command.type === 'update_manual_schedule') {
        const staffState = projectStaff(history);
        const manualId = String(command.id || '');
        const current = staffState.manualSchedules[manualId];
        if (!current?.active) throw new Error('수정할 수동 일정을 찾을 수 없습니다.');
        const title = String(command.title || '').trim();
        const date = String(command.date || '').trim();
        const time = String(command.time || '').trim().slice(0, 40);
        const venue = String(command.venue || '').trim().slice(0, 200);
        const details = String(command.details || '').trim().slice(0, 2000);
        const contact = String(command.contact || '').trim().slice(0, 100);
        const staffIds = Array.isArray(command.staffIds) ? [...new Set(command.staffIds.map(String))] : [];
        if (!title || title.length > 120) throw new Error('일정 제목은 1~120자로 입력해 주세요.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw new Error('일정 날짜를 확인해 주세요.');
        if (!staffIds.length) throw new Error('일정을 배정할 작가를 한 명 이상 선택해 주세요.');
        if (staffIds.some(id => !staffState.staff[id] || !staffState.staff[id].active)) throw new Error('활성 상태인 작가만 배정할 수 있습니다.');
        const event: Event = {
          id: `${id}:manual-update`,
          requestId: id,
          actor: user,
          at,
          reason: '통합 관리자 달력에서 수동 일정 수정',
          type: 'crm_staff_manual_schedule_updated',
          data: { id: manualId, title, date, time, venue, details, contact, staffIds },
        };
        return { events: [event], result: true };
      }
      if (command.type === 'delete_manual_schedule') {
        const staffState = projectStaff(history);
        const manualId = String(command.id || '');
        if (!staffState.manualSchedules[manualId]?.active) throw new Error('삭제할 수동 일정을 찾을 수 없습니다.');
        const event: Event = {
          id: `${id}:manual-delete`,
          requestId: id,
          actor: user,
          at,
          reason: '통합 관리자 달력에서 수동 일정 삭제',
          type: 'crm_staff_manual_schedule_status',
          data: { id: manualId, active: false },
        };
        return { events: [event], result: true };
      }
      const targetId = contractId(command.contractId);
      const contract = project(history).contracts[targetId];
      if (!contract) throw new Error('계약을 찾을 수 없습니다.');
      if (command.type === 'set_delivery_date') {
        if (!deliveryEligible(contract)) throw new Error('납품 관리 대상 계약이 아닙니다.');
        const {key,date} = validateDeliveryDate(command.key,command.date,contract.weddingDate,seoulDay(at));
        const data = {contractId:targetId,key,date};
        const prior=history.find(e=>e.type==='crm_delivery_date_set'&&e.requestId===id);
        if(prior){if(JSON.stringify(prior.data)!==JSON.stringify(data))throw new Error('같은 요청 ID를 다시 사용할 수 없습니다.');return {events:[],result:true};}
        const event:Event={id:id+':delivery',requestId:id,actor:user,at,reason:'관리자 납품 발송일 확인',type:'crm_delivery_date_set',data};
        return {events:[event],result:true};
      }
      if (command.type === 'assign_contract') {
        const staffState = projectStaff(history);
        const staffIds = Array.isArray(command.staffIds) ? [...new Set(command.staffIds.map(String))] : [];
        if (staffIds.some(id => !staffState.staff[id] || !staffState.staff[id].active)) throw new Error('활성 상태인 작가만 배정할 수 있습니다.');
        const event: Event = {
          id: `${id}:staff-assignment`,
          requestId: id,
          actor: user,
          at,
          reason: '통합 관리자 달력에서 작가 배정 수정',
          type: 'crm_staff_assignment_set',
          data: { contractId: targetId, staffIds },
        };
        return { events: [event], result: true };
      }
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

