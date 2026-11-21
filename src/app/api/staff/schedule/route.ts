import { NextRequest, NextResponse } from 'next/server';
import { projectAdminCrm } from '@/lib/admin/crm';
import { projectStaff } from '@/lib/admin/staff';
import { STAFF_SESSION_COOKIE, verifyStaffSession } from '@/lib/admin/staffAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const settings = referralSettings();
    const session = verifyStaffSession(request.cookies.get(STAFF_SESSION_COOKIE)?.value, settings.sessionSecret);
    if (!session) return NextResponse.json({ error: '작가 로그인이 필요합니다.' }, { status: 401, headers });

    const result = await referralStore().transaction(history => {
      const staffState = projectStaff(history);
      const staff = staffState.staff[session.staffId];
      if (!staff?.active || staff.username !== session.username) throw new Error('사용할 수 없는 작가 계정입니다.');
      const crm = projectAdminCrm(history);
      const assignedIds = new Set(Object.values(staffState.assignments)
        .filter(item => item.staffIds.includes(staff.id))
        .map(item => item.contractId));
      const schedules = crm.contracts
        .filter(contract => assignedIds.has(contract.id) && contract.status !== 'cancelled')
        .map(contract => ({
          id: contract.id,
          number: contract.number,
          groom: contract.groom,
          bride: contract.bride,
          groomPhone: contract.groomPhone,
          bridePhone: contract.bridePhone,
          weddingDate: contract.weddingDate,
          weddingTime: contract.weddingTime,
          weddingVenue: contract.weddingVenue,
          weddingHall: contract.weddingHall,
          productId: contract.productId,
          stage: contract.stage,
          memo: contract.memo,
        }))
        .sort((a, b) => `${a.weddingDate} ${a.weddingTime}`.localeCompare(`${b.weddingDate} ${b.weddingTime}`));
      return { events: [], result: { staff: { id: staff.id, username: staff.username, displayName: staff.displayName }, schedules } };
    });
    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '작가 스케줄을 불러오지 못했습니다.' }, { status: 503, headers });
  }
}
