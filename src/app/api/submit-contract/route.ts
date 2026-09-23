import { NextRequest, NextResponse } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adapter = getBackendAdapter();
    const result = await adapter.submitContract({ formData: body });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
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
