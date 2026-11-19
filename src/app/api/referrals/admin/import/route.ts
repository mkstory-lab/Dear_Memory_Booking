import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';
import { previewContractImport } from '@/lib/referrals/importContract';
import { execute, project } from '@/lib/referrals/ledger';
import { identifier } from '@/lib/referrals/input';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!sameOrigin(req)) return NextResponse.json({}, { status: 403, headers });
  try {
    const actor = verifySession(req.cookies.get(SESSION_COOKIE)?.value, referralSettings().sessionSecret)?.actor;
    if (!actor) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401, headers });
    const text = await req.text(); if (text.length > 35000) throw new Error('입력 내용을 확인해 주세요.');
    const body = JSON.parse(text);
    if (typeof body.url !== 'string' || typeof body.number !== 'string') throw new Error('링크와 계약번호를 입력해 주세요.');
    const contract = previewContractImport(body.url, body.number);
    if (body.mode === 'preview') return NextResponse.json(await referralStore().transaction(history => { const s = project(history); const duplicate = Object.values(s.contracts).find(c => c.id === contract.id || c.number === contract.number || c.coupleId === contract.coupleId); return { events: [], result: { contract, duplicate: duplicate?.id || null } }; }), { headers });
    if (body.mode !== 'commit') throw new Error('미리보기를 확인해 주세요.');
    const requestId = identifier(body.requestId);
    await referralStore().transaction(history => ({ events: execute(history, { type: 'register', contract }, { actor, role: 'admin', at: new Date().toISOString(), requestId, reason: '관리자가 계약 검토 링크의 내용을 미리 확인한 후 가져오기' }), result: true }));
    return NextResponse.json({ saved: true, contractId: contract.id }, { headers });
  } catch { return NextResponse.json({ error: '계약을 가져오지 못했습니다. 링크 만료·취소 계약·기존 등록 여부와 입력값을 확인해 주세요. 고객 메일은 발송하지 않았습니다.' }, { status: 400, headers }); }
}
