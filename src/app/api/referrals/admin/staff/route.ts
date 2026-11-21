import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { projectAdminCrm } from '@/lib/admin/crm';
import { hashStaffPassword, projectStaff, publicStaff, validateStaffUsername } from '@/lib/admin/staff';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import type { Event } from '@/lib/referrals/ledger';
import { referralSettings, referralStore } from '@/lib/referrals/server';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

function owner(request: NextRequest) {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value, referralSettings().sessionSecret)?.actor;
}

function snapshot(history: Event[]) {
  const staffState = projectStaff(history);
  const crm = projectAdminCrm(history);
  return {
    staff: publicStaff(staffState),
    assignments: staffState.assignments,
    contracts: crm.contracts.map(contract => ({
      id: contract.id,
      number: contract.number,
      groom: contract.groom,
      bride: contract.bride,
      weddingDate: contract.weddingDate,
      weddingTime: contract.weddingTime,
      weddingVenue: contract.weddingVenue,
      weddingHall: contract.weddingHall,
      status: contract.status,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!owner(request)) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    const result = await referralStore().transaction(history => ({ events: [], result: snapshot(history) }));
    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '작가 관리 정보를 불러오지 못했습니다.' }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({}, { status: 403, headers });
  try {
    const actor = owner(request);
    if (!actor) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    const text = await request.text();
    if (text.length > 12_000) throw new Error('입력값이 너무 깁니다.');
    const body = JSON.parse(text) as Record<string, any>;
    const command = body.command || {};
    const requestId = typeof body.requestId === 'string' && /^[A-Za-z0-9:_-]{8,160}$/.test(body.requestId) ? body.requestId : randomUUID();
    const at = new Date().toISOString();

    const result = await referralStore().transaction(history => {
      const state = projectStaff(history);
      const crm = projectAdminCrm(history);
      const events: Event[] = [];
      const emit = (type: string, data: Record<string, unknown>) => {
        events.push({ id: `${requestId}:${events.length}`, requestId, actor, at, reason: '대표 작가 계정·스케줄 관리', type, data });
      };

      if (command.type === 'create_staff') {
        const username = validateStaffUsername(String(command.username || ''));
        const displayName = String(command.displayName || '').trim();
        if (!displayName || displayName.length > 40) throw new Error('작가 이름은 1~40자로 입력해 주세요.');
        if (Object.values(state.staff).some(item => item.username === username)) throw new Error('이미 사용 중인 작가 아이디입니다.');
        emit('crm_staff_created', {
          id: 'staff_' + randomUUID().replace(/-/g, '').slice(0, 20),
          username,
          displayName,
          passwordHash: hashStaffPassword(String(command.password || '')),
          active: true,
        });
      } else if (command.type === 'set_staff_active') {
        const staff = state.staff[String(command.staffId || '')];
        if (!staff) throw new Error('작가 계정을 찾을 수 없습니다.');
        emit('crm_staff_status_changed', { staffId: staff.id, active: command.active === true });
      } else if (command.type === 'change_staff_password') {
        const staff = state.staff[String(command.staffId || '')];
        if (!staff) throw new Error('작가 계정을 찾을 수 없습니다.');
        emit('crm_staff_password_changed', { staffId: staff.id, passwordHash: hashStaffPassword(String(command.password || '')) });
      } else if (command.type === 'change_staff_name') {
        const staff = state.staff[String(command.staffId || '')];
        const displayName = String(command.displayName || '').trim();
        if (!staff) throw new Error('작가 계정을 찾을 수 없습니다.');
        if (!displayName || displayName.length > 40) throw new Error('작가 이름을 확인해 주세요.');
        emit('crm_staff_name_changed', { staffId: staff.id, displayName });
      } else if (command.type === 'assign_contract') {
        const contractId = String(command.contractId || '');
        if (!crm.contracts.some(contract => contract.id === contractId)) throw new Error('계약을 찾을 수 없습니다.');
        const staffIds = Array.isArray(command.staffIds) ? [...new Set(command.staffIds.map(String))] : [];
        if (staffIds.some(id => !state.staff[id] || !state.staff[id].active)) throw new Error('활성 상태인 작가만 배정할 수 있습니다.');
        emit('crm_staff_assignment_set', { contractId, staffIds });
      } else {
        throw new Error('지원하지 않는 작가 관리 작업입니다.');
      }

      return { events, result: null };
    });

    void result;
    const refreshed = await referralStore().transaction(history => ({ events: [], result: snapshot(history) }));
    return NextResponse.json(refreshed, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '작가 정보를 저장하지 못했습니다.' }, { status: 400, headers });
  }
}
