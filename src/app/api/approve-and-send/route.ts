import { NextRequest, NextResponse } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, updatedData, pdfBase64, jpgBase64 } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '승인 토큰이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    const adapter = getBackendAdapter();
    const result = await adapter.approveAndSendContract({
      token,
      updatedData,
      pdfBase64,
      jpgBase64,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `최종 계약서 발송 처리 실패: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
