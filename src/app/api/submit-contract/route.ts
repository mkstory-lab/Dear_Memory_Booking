import { NextRequest, NextResponse, after } from 'next/server';
import { verifyApprovalToken } from '@/lib/token';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';
import { customerData, registerSubmission, notifySubmission } from '@/lib/referrals/contractIntegration';
import { rateLimit, referralSettings, referralStore } from '@/lib/referrals/server';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, 'lookup');
    const text = await req.text();
    if (text.length > 20000) throw new Error('입력 내용이 너무 깁니다.');
    const body = JSON.parse(text);
    const data = customerData(body), store = referralStore();
    const registered = await registerSubmission(store, data, body.submissionId, referralSettings().secret);
    after(async () => {
      try {
        await notifySubmission(store, registered.contractId, () => getBackendAdapter().submitContract({ formData: verifyApprovalToken(registered.token).data, contractId: registered.contractId, approvalToken: registered.token, reviewUrl: registered.reviewUrl }));
      } catch { console.error('계약 접수 알림 처리 결과 확인 필요'); }
    });
    return NextResponse.json({ success: true, contractId: registered.contractId, approvalToken: registered.token, reviewUrl: registered.reviewUrl, message: '계약정보가 성공적으로 접수되었습니다.' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : '계약정보를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 400 });
  }
}
