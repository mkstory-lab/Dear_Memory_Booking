import { NextRequest, NextResponse } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';
import { verifyApprovalToken } from '@/lib/token';
import { referralStore } from '@/lib/referrals/server';
import { sendManagedContract } from '@/lib/referrals/contractIntegration';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, updatedData, pdfBase64, jpgBase64 } = body;
    const decoded = verifyApprovalToken(token);
    const adapter = getBackendAdapter();
    if (decoded.managedReferral && (!pdfBase64 || typeof pdfBase64 !== 'string')) throw new Error('계약서 PDF를 생성하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
    const result = decoded.managedReferral
      ? await sendManagedContract(referralStore(), decoded, updatedData || decoded.data,
        (data, number) => adapter.approveAndSendContract({ token, updatedData: data, contractNumber: number, pdfBase64, jpgBase64 }))
      : await adapter.approveAndSendContract({ token, updatedData, pdfBase64, jpgBase64 });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : '최종 계약서 발송 결과를 확인해 주세요.' }, { status: 400 });
  }
}
