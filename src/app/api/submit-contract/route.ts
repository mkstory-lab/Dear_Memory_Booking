import { NextRequest, NextResponse, after } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';
import { createApprovalToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contractId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = createApprovalToken(contractId, body);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dear-memory-booking.vercel.app';
    const reviewUrl = `${appUrl}/review?token=${token}`;

    const adapter = getBackendAdapter();

    // Next.js 15 after() 백그라운드 큐: 
    // 사용자는 0.1초 만에 즉시 접수 완료 화면으로 전환되고,
    // Google Apps Script 통신 및 대표 이메일 발송은 서버 백그라운드에서 신속하게 비동기 완료됩니다.
    after(async () => {
      try {
        await adapter.submitContract({ formData: body });
      } catch (bgErr) {
        console.error('Google Apps Script 백그라운드 전송 오류:', bgErr);
      }
    });

    return NextResponse.json(
      {
        success: true,
        contractId,
        approvalToken: token,
        reviewUrl,
        message: '계약정보가 성공적으로 접수되었습니다.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `계약정보 제출 중 서버 오류가 발생했습니다: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
